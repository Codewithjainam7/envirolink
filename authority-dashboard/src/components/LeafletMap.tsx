'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import { Report, STATUS_CONFIG, WASTE_CATEGORIES } from '@/types';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [19.2, 72.85];

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
        case 'rejected':
            return '#9ca3af';
        default:
            return '#6b7280';
    }
};

function FitBoundsController({ validReports }: { validReports: Report[] }) {
    const map = useMap();
    const lastSigRef = useRef('');

    useEffect(() => {
        if (validReports.length === 0) return;
        const sig = validReports.map((r) => r.id).slice(0, 12).join(',');
        if (sig === lastSigRef.current) return;
        lastSigRef.current = sig;

        try {
            if (validReports.length === 1) {
                const only = validReports[0];
                map.setView([Number(only.location.latitude), Number(only.location.longitude)], 14, { animate: true });
            } else {
                const bounds = latLngBounds(
                    validReports.map((r) => [Number(r.location.latitude), Number(r.location.longitude)] as [number, number])
                );
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13, animate: true });
            }
        } catch {
            // Keep default view
        }
    }, [validReports, map]);

    return null;
}

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

    const validReports = useMemo(
        () =>
            (reports || []).filter((r) => {
                const lat = Number(r.location?.latitude);
                const lng = Number(r.location?.longitude);
                return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
            }),
        [reports]
    );

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
            <FitBoundsController validReports={validReports} />

            {validReports.map((report) => {
                const lat = Number(report.location.latitude);
                const lng = Number(report.location.longitude);
                const color = getMarkerColor(report.status);
                const category = WASTE_CATEGORIES[report.category] || {
                    label: String(report.category || 'Waste Issue').replace(/_/g, ' '),
                    color: '#6b7280',
                };
                const status = STATUS_CONFIG[report.status] || {
                    label: String(report.status || 'Submitted').replace(/_/g, ' '),
                    color: '#6b7280',
                    bgColor: '#f3f4f6',
                };

                return (
                    <CircleMarker
                        key={report.id}
                        center={[lat, lng]}
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
                                <p className="text-xs text-gray-500 mt-1">{report.location.locality || report.location.address}</p>
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
