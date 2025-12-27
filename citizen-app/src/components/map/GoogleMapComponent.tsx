'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { motion } from 'framer-motion';
import { Report, STATUS_CONFIG, WASTE_CATEGORIES, WasteCategory } from '@/types';
import {
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf,
    MapPin, Clock, ChevronRight, LucideIcon
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Icon mapping
const categoryIcons: Record<WasteCategory, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
};

// Map styling - Clean minimal style
const mapStyles = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e9f6' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
];

// Map container style
const containerStyle = {
    width: '100%',
    height: '100%',
};

// Default center (Mumbai)
const defaultCenter = {
    lat: 19.076,
    lng: 72.8777,
};

interface GoogleMapComponentProps {
    reports: Report[];
    onReportClick?: (report: Report) => void;
    center?: { lat: number; lng: number };
    zoom?: number;
    className?: string;
}

export default function GoogleMapComponent({
    reports,
    onReportClick,
    center = defaultCenter,
    zoom = 12,
    className = '',
}: GoogleMapComponentProps) {
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    // Load Google Maps API
    // Note: Replace with your actual API key in .env.local
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        // For demo, we'll show a placeholder if no API key
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

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

    // If no API key, show placeholder map
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className={`relative bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 ${className}`}>
                {/* Placeholder Map */}
                <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
                    <defs>
                        <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                        </pattern>
                        <linearGradient id="markerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#gridPattern)" />

                    {/* Roads */}
                    <path d="M0 300 L1200 300" stroke="#d1d5db" strokeWidth="15" opacity="0.6" />
                    <path d="M600 0 L600 600" stroke="#d1d5db" strokeWidth="15" opacity="0.6" />
                    <path d="M0 150 L1200 450" stroke="#e5e7eb" strokeWidth="8" opacity="0.5" />
                    <path d="M0 450 L1200 150" stroke="#e5e7eb" strokeWidth="8" opacity="0.5" />

                    {/* Report markers */}
                    {reports.slice(0, 10).map((report, index) => {
                        const x = 100 + ((index * 180) % 1000);
                        const y = 80 + ((index * 120) % 450);
                        const color = getMarkerColor(report.status);

                        return (
                            <g key={report.id} style={{ cursor: 'pointer' }} onClick={() => onReportClick?.(report)}>
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: index * 0.1, type: 'spring', stiffness: 200 }}
                                    cx={x}
                                    cy={y}
                                    r="25"
                                    fill={`${color}20`}
                                    stroke={color}
                                    strokeWidth="3"
                                />
                                <motion.circle
                                    initial={{ scale: 0 }}
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ delay: index * 0.1, duration: 2, repeat: Infinity }}
                                    cx={x}
                                    cy={y}
                                    r="25"
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2"
                                />
                            </g>
                        );
                    })}
                </svg>

                {/* API Key Notice */}
                <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80">
                    <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            🗺️ Demo Map View
                        </p>
                        <p className="text-xs text-gray-500">
                            Add <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local for real Google Maps
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
                <p className="text-gray-500">Error loading maps</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
                <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className={className}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: mapStyles,
                    disableDefaultUI: true,
                    zoomControl: true,
                    mapTypeControl: false,
                    streetViewControl: false,
                    fullscreenControl: true,
                }}
            >
                {/* Report Markers */}
                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        position={{
                            lat: report.location.latitude,
                            lng: report.location.longitude,
                        }}
                        onClick={() => setSelectedReport(report)}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: getMarkerColor(report.status),
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                    />
                ))}

                {/* Info Window */}
                {selectedReport && (
                    <InfoWindow
                        position={{
                            lat: selectedReport.location.latitude,
                            lng: selectedReport.location.longitude,
                        }}
                        onCloseClick={() => setSelectedReport(null)}
                    >
                        <div className="p-2 min-w-[200px]">
                            <div className="flex items-center gap-2 mb-2">
                                {(() => {
                                    const Icon = categoryIcons[selectedReport.category];
                                    const color = WASTE_CATEGORIES[selectedReport.category].color;
                                    return (
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <Icon size={16} style={{ color }} />
                                        </div>
                                    );
                                })()}
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">
                                        {WASTE_CATEGORIES[selectedReport.category].label}
                                    </p>
                                    <span
                                        className="text-xs px-2 py-0.5 rounded-full"
                                        style={{
                                            backgroundColor: STATUS_CONFIG[selectedReport.status].bgColor,
                                            color: STATUS_CONFIG[selectedReport.status].color,
                                        }}
                                    >
                                        {STATUS_CONFIG[selectedReport.status].label}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin size={10} />
                                {selectedReport.location.address}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Clock size={10} />
                                {formatDistanceToNow(new Date(selectedReport.createdAt), { addSuffix: true })}
                            </p>
                            <button
                                onClick={() => onReportClick?.(selectedReport)}
                                className="mt-2 text-xs text-emerald-600 font-semibold flex items-center gap-1"
                            >
                                View Details <ChevronRight size={12} />
                            </button>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
}
