'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Report, STATUS_CONFIG, WASTE_CATEGORIES } from '@/types';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [19.076, 72.8777];

const getMarkerColor = (status: Report['status']) => {
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
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {reports.map((report) => {
                const color = getMarkerColor(report.status);
                const category = WASTE_CATEGORIES[report.category];
                const status = STATUS_CONFIG[report.status];

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
                            <div className="p-1 min-w-[180px]">
                                <p className="font-semibold text-sm">{category.label}</p>
                                <p className="text-xs text-gray-500 mt-1">{report.location.locality}</p>
                                <span
                                    className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: status.bgColor, color: status.color }}
                                >
                                    {status.label}
                                </span>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
