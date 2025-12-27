'use client';

import dynamic from 'next/dynamic';
import { Report } from '@/types';

const LeafletMap = dynamic(() => import('./LeafletMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    )
});

interface MapWrapperProps {
    reports: Report[];
    onReportClick?: (report: Report) => void;
    center?: [number, number];
    zoom?: number;
    className?: string;
}

export default function MapWrapper(props: MapWrapperProps) {
    return <LeafletMap {...props} />;
}
