export interface GeoTagPayload {
    lat?: number | null;
    lng?: number | null;
    address?: string;
    label?: string;
    distanceMeters?: number | null;
    timestamp?: string;
    source?: 'exif' | 'gps' | string;
}

function readRational(view: DataView, offset: number, littleEndian: boolean): number {
    const num = view.getUint32(offset, littleEndian);
    const den = view.getUint32(offset + 4, littleEndian);
    return den ? num / den : 0;
}

function dmsToDecimal(deg: number, min: number, sec: number, ref: string): number {
    let val = deg + min / 60 + sec / 3600;
    if (ref === 'S' || ref === 'W') val = -val;
    return val;
}

/**
 * Lightweight zero-dependency JPEG EXIF GPS extractor.
 * Returns { lat, lng } if photo contains EXIF GPS coordinates, otherwise null.
 */
export async function extractExifGps(file: File): Promise<{ lat: number; lng: number } | null> {
    try {
        if (!file.type.includes('jpeg') && !file.type.includes('jpg') && !/\.jpe?g$/i.test(file.name)) {
            return null;
        }
        const slice = file.slice(0, 131072);
        const buffer = await slice.arrayBuffer();
        const view = new DataView(buffer);

        if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) return null;

        let offset = 2;
        while (offset + 4 < view.byteLength) {
            const marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xffe1) {
                if (view.getUint32(offset + 2, false) !== 0x45786966) return null; // "Exif"
                const tiffStart = offset + 8;
                if (tiffStart + 8 >= view.byteLength) return null;

                const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
                const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
                const ifd0 = tiffStart + firstIfdOffset;
                if (ifd0 + 2 >= view.byteLength) return null;

                const entries = view.getUint16(ifd0, littleEndian);
                let gpsIfdOffset = 0;

                for (let i = 0; i < entries; i++) {
                    const entry = ifd0 + 2 + i * 12;
                    if (entry + 12 > view.byteLength) break;
                    if (view.getUint16(entry, littleEndian) === 0x8825) {
                        gpsIfdOffset = tiffStart + view.getUint32(entry + 8, littleEndian);
                        break;
                    }
                }

                if (!gpsIfdOffset || gpsIfdOffset + 2 >= view.byteLength) return null;

                const gpsEntries = view.getUint16(gpsIfdOffset, littleEndian);
                let latRef = 'N';
                let lngRef = 'E';
                let latVals: number[] | null = null;
                let lngVals: number[] | null = null;

                for (let i = 0; i < gpsEntries; i++) {
                    const entry = gpsIfdOffset + 2 + i * 12;
                    if (entry + 12 > view.byteLength) break;
                    const tag = view.getUint16(entry, littleEndian);
                    const count = view.getUint32(entry + 4, littleEndian);
                    const valOffset = tiffStart + view.getUint32(entry + 8, littleEndian);

                    if (tag === 0x0001) {
                        latRef = String.fromCharCode(view.getUint8(entry + 8));
                    } else if (tag === 0x0003) {
                        lngRef = String.fromCharCode(view.getUint8(entry + 8));
                    } else if (tag === 0x0002 && count === 3 && valOffset + 24 <= view.byteLength) {
                        latVals = [
                            readRational(view, valOffset, littleEndian),
                            readRational(view, valOffset + 8, littleEndian),
                            readRational(view, valOffset + 16, littleEndian),
                        ];
                    } else if (tag === 0x0004 && count === 3 && valOffset + 24 <= view.byteLength) {
                        lngVals = [
                            readRational(view, valOffset, littleEndian),
                            readRational(view, valOffset + 8, littleEndian),
                            readRational(view, valOffset + 16, littleEndian),
                        ];
                    }
                }

                if (latVals && lngVals) {
                    const lat = dmsToDecimal(latVals[0], latVals[1], latVals[2], latRef);
                    const lng = dmsToDecimal(lngVals[0], lngVals[1], lngVals[2], lngRef);
                    if (Number.isFinite(lat) && Number.isFinite(lng) && (Math.abs(lat) > 0.001 || Math.abs(lng) > 0.001)) {
                        return { lat, lng };
                    }
                }
                return null;
            }
            if ((marker & 0xff00) !== 0xff00) break;
            if (offset + 2 > view.byteLength) break;
            const segLen = view.getUint16(offset, false);
            if (segLen < 2) break;
            offset += segLen;
        }
        return null;
    } catch {
        return null;
    }
}

function drawRoundedRectPath(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let trimmed = text;
    while (trimmed.length > 3 && ctx.measureText(`${trimmed}...`).width > maxWidth) {
        trimmed = trimmed.slice(0, -1);
    }
    return `${trimmed.trim()}...`;
}

function formatShortPlace(rawAddress?: string): string {
    const cleaned = (rawAddress || 'Mumbai, Maharashtra').replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
        return parts.slice(0, 3).join(', ');
    }
    return cleaned;
}

/**
 * Compresses an image File or DataURL and stamps a clean GPS Map Camera style GeoTag card onto the bottom.
 */
export function stampGeoTagOnImage(
    source: File | string,
    options?: {
        maxDim?: number;
        quality?: number;
        geo?: GeoTagPayload | null;
    }
): Promise<string> {
    const maxDim = options?.maxDim ?? 1280;
    const quality = options?.quality ?? 0.84;
    const geo = options?.geo;

    const renderDataUrl = (dataUrl: string): Promise<string> =>
        new Promise((resolve) => {
            const img = new window.Image();
            img.onload = () => {
                try {
                    let { width, height } = img;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        resolve(dataUrl);
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);

                    if (geo && (typeof geo.lat === 'number' || geo.address)) {
                        const margin = Math.max(12, Math.round(Math.min(width, height) * 0.024));
                        const cardHeight = Math.max(66, Math.round(Math.min(width, height) * 0.13));
                        const cardW = Math.max(220, width - margin * 2);
                        const cardX = margin;
                        const cardY = height - cardHeight - margin;
                        const cardRadius = Math.max(10, Math.round(cardHeight * 0.18));

                        // Floating translucent dark card
                        ctx.save();
                        drawRoundedRectPath(ctx, cardX, cardY, cardW, cardHeight, cardRadius);
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
                        ctx.fill();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
                        ctx.stroke();

                        // Left mini-map tile
                        const innerPad = Math.max(8, Math.round(cardHeight * 0.13));
                        const tileSize = cardHeight - innerPad * 2;
                        const tileX = cardX + innerPad;
                        const tileY = cardY + innerPad;

                        drawRoundedRectPath(ctx, tileX, tileY, tileSize, tileSize, Math.max(7, Math.round(tileSize * 0.18)));
                        ctx.fillStyle = '#1e293b';
                        ctx.fill();
                        ctx.save();
                        ctx.clip();

                        // Subtle vector street grid lines inside mini-map
                        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
                        ctx.lineWidth = Math.max(1, Math.round(tileSize * 0.04));
                        ctx.beginPath();
                        ctx.moveTo(tileX, tileY + tileSize * 0.35);
                        ctx.lineTo(tileX + tileSize, tileY + tileSize * 0.28);
                        ctx.moveTo(tileX, tileY + tileSize * 0.72);
                        ctx.lineTo(tileX + tileSize, tileY + tileSize * 0.65);
                        ctx.moveTo(tileX + tileSize * 0.34, tileY);
                        ctx.lineTo(tileX + tileSize * 0.42, tileY + tileSize);
                        ctx.moveTo(tileX + tileSize * 0.74, tileY);
                        ctx.lineTo(tileX + tileSize * 0.68, tileY + tileSize);
                        ctx.stroke();

                        // Green pin drop in center of mini-map
                        const pinCx = tileX + tileSize * 0.5;
                        const pinCy = tileY + tileSize * 0.44;
                        const pinR = Math.max(5, tileSize * 0.16);
                        ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy + pinR * 0.6, pinR * 1.45, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#10b981';
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy, pinR, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy, pinR * 0.42, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();

                        // Right text block
                        const textX = tileX + tileSize + Math.max(10, Math.round(innerPad * 1.1));
                        const textMaxW = cardX + cardW - innerPad - textX;

                        const titleSize = Math.max(12, Math.round(cardHeight * 0.21));
                        const coordSize = Math.max(10, Math.round(cardHeight * 0.175));
                        const metaSize = Math.max(9, Math.round(cardHeight * 0.155));

                        const placeTitle = formatShortPlace(geo.address);
                        const coordLine =
                            typeof geo.lat === 'number' && typeof geo.lng === 'number'
                                ? `Lat ${geo.lat.toFixed(6)}°   Long ${geo.lng.toFixed(6)}°`
                                : 'Location coordinates pending';
                        const distSuffix =
                            typeof geo.distanceMeters === 'number' && Number.isFinite(geo.distanceMeters)
                                ? `  (${Math.round(geo.distanceMeters)}m from pin)`
                                : '';
                        const timeStr =
                            geo.timestamp ||
                            new Date().toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            });

                        ctx.textBaseline = 'middle';

                        ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(fitText(ctx, placeTitle, textMaxW), textX, cardY + cardHeight * 0.28);

                        ctx.font = `500 ${coordSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = '#e2e8f0';
                        ctx.fillText(fitText(ctx, `${coordLine}${distSuffix}`, textMaxW), textX, cardY + cardHeight * 0.54);

                        ctx.font = `400 ${metaSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = '#cbd5e1';
                        ctx.fillText(fitText(ctx, `${timeStr}  ·  EnviroLink GeoTag`, textMaxW), textX, cardY + cardHeight * 0.78);

                        ctx.restore();
                    }

                    resolve(canvas.toDataURL('image/jpeg', quality));
                } catch {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });

    if (typeof source === 'string') {
        return renderDataUrl(source);
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => renderDataUrl(reader.result as string).then(resolve);
        reader.onerror = reject;
        reader.readAsDataURL(source);
    });
}
