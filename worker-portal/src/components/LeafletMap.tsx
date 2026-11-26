'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import { Report } from '@/types';
import 'leaflet/dist/leaflet.css';

const defaultCenter: [number, number] = [19.2, 72.85];

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

function WorkerFitBounds({ validReports }: { validReports: Report[] }) {
    const map = useMap();
    const fittedRef = useRef('');

    useEffect(() => {
        if (validReports.length === 0) return;
        const sig = validReports.map((r) => r.id).join(',');
        if (sig === fittedRef.current) return;
        fittedRef.current = sig;

        try {
            if (validReports.length === 1) {
                const only = validReports[0];
                map.setView([Number(only.location.latitude), Number(only.location.longitude)], 14, { animate: true });
            } else {
                const bounds = latLngBounds(
                    validReports.map((r) => [Number(r.location.latitude), Number(r.location.longitude)] as [number, number])
                );
                map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
            }
        } catch {
            // Keep default center
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
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <WorkerFitBounds validReports={validReports} />

            {validReports.map((report) => {
                const lat = Number(report.location.latitude);
                const lng = Number(report.location.longitude);
                const color = getMarkerColor(report.status);
                const label = report.category || 'Report';

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
                            <div className="p-1 min-w-[150px]">
                                <p className="font-semibold text-sm capitalize">{label.replace(/_/g, ' ')}</p>
                                <p className="text-xs text-gray-500 mt-1">{report.location.locality || report.location.address}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
