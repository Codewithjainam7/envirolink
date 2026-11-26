export interface WorkerGeoTag {
    lat?: number | null;
    lng?: number | null;
    distanceMeters?: number | null;
    address?: string;
    label?: string;
    timestamp?: string;
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
    const cleaned = (rawAddress || 'Mumbai Verification Site').replace(/\s+/g, ' ').trim();
    const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 3) {
        return parts.slice(0, 3).join(', ');
    }
    return cleaned;
}

/**
 * Compresses an image File or DataURL and stamps a clean GPS Map Camera style GeoTag card onto the bottom.
 */
export function stampWorkerGeoTag(
    source: File | string,
    options?: {
        maxDim?: number;
        quality?: number;
        geo?: WorkerGeoTag | null;
        isFlagged?: boolean;
    }
): Promise<string> {
    const maxDim = options?.maxDim ?? 1100;
    const quality = options?.quality ?? 0.84;
    const geo = options?.geo;
    const isFlagged = Boolean(options?.isFlagged);

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

                    if (geo) {
                        const margin = Math.max(12, Math.round(Math.min(width, height) * 0.024));
                        const cardHeight = Math.max(66, Math.round(Math.min(width, height) * 0.135));
                        const cardW = Math.max(220, width - margin * 2);
                        const cardX = margin;
                        const cardY = height - cardHeight - margin;
                        const cardRadius = Math.max(10, Math.round(cardHeight * 0.18));

                        ctx.save();
                        drawRoundedRectPath(ctx, cardX, cardY, cardW, cardHeight, cardRadius);
                        ctx.fillStyle = 'rgba(15, 23, 42, 0.76)';
                        ctx.fill();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = isFlagged ? 'rgba(251, 191, 36, 0.35)' : 'rgba(255, 255, 255, 0.18)';
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

                        const pinCx = tileX + tileSize * 0.5;
                        const pinCy = tileY + tileSize * 0.44;
                        const pinR = Math.max(5, tileSize * 0.16);
                        const pinColor = isFlagged ? '#f59e0b' : '#10b981';

                        ctx.fillStyle = isFlagged ? 'rgba(245, 158, 11, 0.28)' : 'rgba(16, 185, 129, 0.28)';
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy + pinR * 0.6, pinR * 1.45, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = pinColor;
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy, pinR, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(pinCx, pinCy, pinR * 0.42, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.restore();

                        // Right typography block
                        const textX = tileX + tileSize + Math.max(10, Math.round(innerPad * 1.1));
                        const textMaxW = cardX + cardW - innerPad - textX;

                        const titleSize = Math.max(12, Math.round(cardHeight * 0.21));
                        const coordSize = Math.max(10, Math.round(cardHeight * 0.175));
                        const metaSize = Math.max(9, Math.round(cardHeight * 0.155));

                        const placeTitle = formatShortPlace(geo.address);
                        const coordLine =
                            typeof geo.lat === 'number' && typeof geo.lng === 'number'
                                ? `Lat ${geo.lat.toFixed(6)}°   Long ${geo.lng.toFixed(6)}°`
                                : 'Manual verification flag';
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
                        const tagLabel = isFlagged ? 'Flagged · Nothing Found' : 'Worker Proof · GeoTag';

                        ctx.textBaseline = 'middle';

                        ctx.font = `600 ${titleSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(fitText(ctx, placeTitle, textMaxW), textX, cardY + cardHeight * 0.28);

                        ctx.font = `500 ${coordSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = '#e2e8f0';
                        ctx.fillText(fitText(ctx, `${coordLine}${distSuffix}`, textMaxW), textX, cardY + cardHeight * 0.54);

                        ctx.font = `400 ${metaSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.fillStyle = isFlagged ? '#fde68a' : '#cbd5e1';
                        ctx.fillText(fitText(ctx, `${timeStr}  ·  ${tagLabel}`, textMaxW), textX, cardY + cardHeight * 0.78);

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
