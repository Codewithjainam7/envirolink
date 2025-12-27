'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import { Icon, DivIcon } from 'leaflet';
import { motion } from 'framer-motion';
import { Report, STATUS_CONFIG, WASTE_CATEGORIES, WasteCategory } from '@/types';
import { MapPin, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import 'leaflet/dist/leaflet.css';

// Default center (Mumbai)
const defaultCenter: [number, number] = [19.076, 72.8777];

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
        default:
            return '#6b7280'; // gray
    }
};

// Custom marker icon creator
const createCustomIcon = (color: string) => {
    return new DivIcon({
        className: 'custom-marker',
        html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Component to recenter map
function RecenterMap({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, map.getZoom());
    }, [center, map]);
    return null;
}

interface LeafletMapProps {
    reports: Report[];
    onReportClick?: (report: Report) => void;
    center?: [number, number];
    zoom?: number;
    className?: string;
    selectedReportId?: string;
}

// Main component - must be dynamically imported with ssr: false
export default function LeafletMap({
    reports,
    onReportClick,
    center = defaultCenter,
    zoom = 12,
    className = '',
    selectedReportId,
}: LeafletMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
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
            {/* OpenStreetMap Tile Layer - FREE, no API key needed */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Alternative: CartoDB Positron (cleaner look) */}
            {/* <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      /> */}

            {/* Report Markers */}
            {reports.map((report) => {
                // Skip reports without valid location
                if (!report.location?.latitude || !report.location?.longitude) {
                    return null;
                }

                const color = getMarkerColor(report.status);
                const isSelected = selectedReportId === report.id;
                const category = WASTE_CATEGORIES[report.category];
                const statusConfig = STATUS_CONFIG[report.status];

                return (
                    <CircleMarker
                        key={report.id}
                        center={[report.location.latitude, report.location.longitude]}
                        radius={isSelected ? 16 : 12}
                        pathOptions={{
                            color: 'white',
                            weight: 3,
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
                                        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs"
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
                                    {report.location.address}
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
