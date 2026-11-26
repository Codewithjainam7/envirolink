export interface WorkerGeoTag {
    lat?: number | null;
    lng?: number | null;
    distanceMeters?: number | null;
    address?: string;
    label?: string;
    timestamp?: string;
}

/**
 * Compresses an image File or DataURL and optionally burns a visible EnviroLink Worker GeoTag bar.
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
    const quality = options?.quality ?? 0.82;
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
                        const barHeight = Math.max(58, Math.round(height * 0.12));
                        const padX = Math.max(14, Math.round(width * 0.025));
                        const yStart = height - barHeight;

                        ctx.fillStyle = isFlagged ? 'rgba(69, 26, 3, 0.88)' : 'rgba(2, 44, 34, 0.86)';
                        ctx.fillRect(0, yStart, width, barHeight);

                        ctx.fillStyle = isFlagged ? '#f59e0b' : '#10b981';
                        ctx.fillRect(0, yStart, 6, barHeight);

                        const headerFont = Math.max(11, Math.round(barHeight * 0.22));
                        const detailFont = Math.max(10, Math.round(barHeight * 0.19));

                        const coordStr =
                            typeof geo.lat === 'number' && typeof geo.lng === 'number'
                                ? `LAT ${geo.lat.toFixed(6)} · LNG ${geo.lng.toFixed(6)}`
                                : 'GPS OVERRIDE FLAG';
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
                        const addrRaw = (geo.address || 'Field Verification Spot').replace(/\s+/g, ' ').trim();
                        const addrStr = addrRaw.length > 54 ? `${addrRaw.slice(0, 51)}...` : addrRaw;

                        ctx.font = `700 ${headerFont}px system-ui, -apple-system, sans-serif`;
                        ctx.fillStyle = isFlagged ? '#fcd34d' : '#6ee7b7';
                        ctx.fillText(
                            `${(geo.label || 'WORKER VERIFICATION GEOTAG').toUpperCase()}  |  ${coordStr}${distStr}`,
                            padX,
                            yStart + Math.round(barHeight * 0.38)
                        );

                        ctx.font = `500 ${detailFont}px system-ui, -apple-system, sans-serif`;
                        ctx.fillStyle = '#f8fafc';
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
