'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Report } from '@/types'; // Ensure types are shared or copied
import 'leaflet/dist/leaflet.css';

// Mock types if not available in worker portal yet
// We will need to check if 'src/types' exists or needs to be created.
// For now, I'll assume I might need to create a types file or inline interfaces if simple.
// Note: Authority Dashboard imported `STATUS_CONFIG` and `WASTE_CATEGORIES`.
// I should check if those exist in worker-portal. 
// Safest bet is to copy the component but be ready to fix imports.
// Actually, looking at previous steps, I saw `MapWrapper` in Authority dashboard used `import { Report } from '@/types'`.
// I'll assume I need to create/update types in worker-portal or this will fail.

const defaultCenter: [number, number] = [19.076, 72.8777];

const getMarkerColor = (status: string) => {
    switch (status) {
        case 'submitted':
        case 'under_review':
            return '#ef4444';
        case 'assigned':
        case 'in_progress':
            return '#f59e0b';
        case 'resolved':
        case 'closed':
            return '#10b981';
        default:
            return '#6b7280';
    }
};

interface LeafletMapProps {
    reports: Report[];
    onReportClick?: (report: Report) => void;
    center?: [number, number];
    zoom?: number;
    className?: string;
}

export default function LeafletMap({
    reports,
    onReportClick,
    center = defaultCenter,
    zoom = 11,
    className = '',
}: LeafletMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className={`w-full h-full ${className}`}
            zoomControl={false} // Disable default zoom control for cleaner mobile look
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => {
                const color = getMarkerColor(report.status);
                // Fallback for missing category/status config
                const label = report.category || 'Report';

                return (
                    <CircleMarker
                        key={report.id}
                        center={[report.location.latitude, report.location.longitude]}
                        radius={10}
                        pathOptions={{
                            color: 'white',
                            weight: 2,
                            fillColor: color,
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: () => onReportClick?.(report),
                        }}
                    >
                        <Popup>
                            <div className="p-1 min-w-[150px]">
                                <p className="font-semibold text-sm capitalize">{label.replace('_', ' ')}</p>
                                <p className="text-xs text-gray-500 mt-1">{report.location.locality}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
