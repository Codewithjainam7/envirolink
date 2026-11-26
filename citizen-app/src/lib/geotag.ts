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

/**
 * Compresses an image File or DataURL and optionally burns a visible EnviroLink GeoTag bar onto the bottom edge.
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
    const quality = options?.quality ?? 0.82;
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
                        const barHeight = Math.max(58, Math.round(height * 0.115));
                        const padX = Math.max(14, Math.round(width * 0.025));
                        const yStart = height - barHeight;

                        ctx.fillStyle = 'rgba(2, 44, 34, 0.84)';
                        ctx.fillRect(0, yStart, width, barHeight);

                        ctx.fillStyle = '#10b981';
                        ctx.fillRect(0, yStart, 6, barHeight);

                        const headerFont = Math.max(11, Math.round(barHeight * 0.22));
                        const detailFont = Math.max(10, Math.round(barHeight * 0.19));

                        const coordStr =
                            typeof geo.lat === 'number' && typeof geo.lng === 'number'
                                ? `LAT ${geo.lat.toFixed(6)} · LNG ${geo.lng.toFixed(6)}`
                                : 'GPS COORDINATES PENDING';
                        const distStr =
                            typeof geo.distanceMeters === 'number' && Number.isFinite(geo.distanceMeters)
                                ? ` · ${Math.round(geo.distanceMeters)}m FROM PIN`
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
                        const addrRaw = (geo.address || 'Mumbai, India').replace(/\s+/g, ' ').trim();
                        const addrStr = addrRaw.length > 58 ? `${addrRaw.slice(0, 55)}...` : addrRaw;

                        ctx.font = `700 ${headerFont}px system-ui, -apple-system, sans-serif`;
                        ctx.fillStyle = '#6ee7b7';
                        ctx.fillText(
                            `${(geo.label || 'ENVIROLINK GEOTAG').toUpperCase()}  |  ${coordStr}${distStr}`,
                            padX,
                            yStart + Math.round(barHeight * 0.38)
                        );

                        ctx.font = `500 ${detailFont}px system-ui, -apple-system, sans-serif`;
                        ctx.fillStyle = '#ecfdf5';
                        ctx.fillText(
                            `${addrStr}  •  ${timeStr}`,
                            padX,
                            yStart + Math.round(barHeight * 0.74)
                        );
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
