'use client';

import dynamic from 'next/dynamic';
import { Report } from '@/types';

// Dynamic import with SSR disabled (required for Leaflet)
const LeafletMap = dynamic(
    () => import('./LeafletMap'),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Loading map...</p>
                </div>
            </div>
        )
    }
);

interface MapWrapperProps {
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

export default function MapWrapper(props: MapWrapperProps) {
    return <LeafletMap {...props} />;
}
