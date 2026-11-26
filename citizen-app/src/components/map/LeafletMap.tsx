'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import { latLngBounds } from 'leaflet';
import { Report, getStatusMeta, getWasteCategoryMeta } from '@/types';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import 'leaflet/dist/leaflet.css';

// Default center (Mumbai)
const defaultCenter: [number, number] = [19.2, 72.85];

// Get marker color based on status
const getMarkerColor = (status: Report['status']) => {
    switch (status) {
        case 'submitted':
        case 'under_review':
            return '#ef4444'; // red
        case 'assigned':
        case 'in_progress':
            return '#f59e0b'; // amber
        case 'resolved':
        case 'closed':
            return '#10b981'; // green
        case 'rejected':
            return '#9ca3af'; // gray
        default:
            return '#6b7280';
    }
};

function MapController({
    validReports,
    selectedReportId,
    zoomCommand,
    userLocation,
}: {
    validReports: Report[];
    selectedReportId?: string;
    zoomCommand?: { delta: number; seq: number } | null;
    userLocation?: { lat: number; lng: number; seq: number } | null;
}) {
    const map = useMap();
    const hasFittedRef = useRef(false);
    const lastReportSignatureRef = useRef('');

    // Auto-fit bounds whenever reports first arrive or change significantly
    useEffect(() => {
        if (validReports.length === 0) return;
        const signature = validReports.map((r) => r.id).slice(0, 12).join(',');
        if (hasFittedRef.current && signature === lastReportSignatureRef.current) return;

        lastReportSignatureRef.current = signature;
        hasFittedRef.current = true;

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
            // Keep default center cleanly
        }
    }, [validReports, map]);

    // Fly smoothly to selected report marker
    useEffect(() => {
        if (!selectedReportId) return;
        const target = validReports.find((r) => r.id === selectedReportId);
        if (!target) return;
        map.flyTo([Number(target.location.latitude), Number(target.location.longitude)], Math.max(map.getZoom(), 14), {
            duration: 0.6,
        });
    }, [selectedReportId, validReports, map]);

    // Interactive +/- zoom controls
    useEffect(() => {
        if (!zoomCommand || zoomCommand.seq === 0) return;
        if (zoomCommand.delta > 0) map.zoomIn();
        else map.zoomOut();
    }, [zoomCommand, map]);

    // Interactive Locate Me control
    useEffect(() => {
        if (!userLocation || userLocation.seq === 0) return;
        map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.8 });
    }, [userLocation, map]);

    return null;
}

interface LeafletMapProps {
    reports: Report[];
    onReportClick?: (report: Report) => void;
    center?: [number, number];
    zoom?: number;
    className?: string;
    selectedReportId?: string;
    tileStyle?: 'street' | 'clean';
    zoomCommand?: { delta: number; seq: number } | null;
    userLocation?: { lat: number; lng: number; seq: number } | null;
}

// Main component - must be dynamically imported with ssr: false
export default function LeafletMap({
    reports,
    onReportClick,
    center = defaultCenter,
    zoom = 11,
    className = '',
    selectedReportId,
    tileStyle = 'street',
    zoomCommand = null,
    userLocation = null,
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
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={center}
            zoom={zoom}
            className={`w-full h-full ${className}`}
            style={{ background: '#e5e7eb' }}
            zoomControl={false}
        >
            {tileStyle === 'clean' ? (
                <TileLayer
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
            ) : (
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
            )}

            <MapController
                validReports={validReports}
                selectedReportId={selectedReportId}
                zoomCommand={zoomCommand}
                userLocation={userLocation}
            />

            {/* User live GPS marker when located */}
            {userLocation && (
                <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={9}
                    pathOptions={{
                        color: 'white',
                        weight: 3,
                        fillColor: '#2563eb',
                        fillOpacity: 1,
                    }}
                >
                    <Popup>
                        <p className="text-xs font-semibold text-blue-700">Your current location</p>
                    </Popup>
                </CircleMarker>
            )}

            {/* Report Markers */}
            {validReports.map((report) => {
                const lat = Number(report.location.latitude);
                const lng = Number(report.location.longitude);
                const color = getMarkerColor(report.status);
                const isSelected = selectedReportId === report.id;
                const category = getWasteCategoryMeta(report.category);
                const statusConfig = getStatusMeta(report.status);

                return (
                    <CircleMarker
                        key={report.id}
                        center={[lat, lng]}
                        radius={isSelected ? 15 : 11}
                        pathOptions={{
                            color: 'white',
                            weight: isSelected ? 4 : 3,
                            fillColor: color,
                            fillOpacity: 1,
                        }}
                        eventHandlers={{
                            click: () => onReportClick?.(report),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[200px] p-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                                    >
                                        {category.iconName[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{category.label}</p>
                                        <span
                                            className="text-xs px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                                        >
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={10} />
                                    {report.location.address || report.location.locality || 'Location pinned'}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Clock size={10} />
                                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                </p>
                                <button
                                    onClick={() => onReportClick?.(report)}
                                    className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline"
                                >
                                    View Details <ChevronRight size={12} />
                                </button>
                            </div>
                        </Popup>
                    </CircleMarker>
                );
            })}
        </MapContainer>
    );
}
