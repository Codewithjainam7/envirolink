'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import { Report } from '@/types';

// Dynamic map import
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

// Mock task data for map (would come from API/Store)
const MOCK_TASKS: Report[] = [
    {
        id: '1',
        reportId: 'RPT-2025-0123',
        location: { latitude: 19.11, longitude: 72.85, address: 'Lokhandwala Complex', locality: 'Andheri', city: 'Mumbai' },
        category: 'overflowing_bin',
        severity: 'high',
        status: 'assigned',
        reward: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        reportId: 'RPT-2025-0125',
        location: { latitude: 19.13, longitude: 72.82, address: 'Oshiwara Garden', locality: 'Oshiwara', city: 'Mumbai' },
        category: 'littering',
        severity: 'low',
        status: 'assigned',
        reward: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
];

export default function WorkerMapPage() {
    const [selectedTask, setSelectedTask] = useState<Report | null>(null);

    return (
        <div className="h-screen w-full relative bg-gray-50 flex flex-col">
            <FloatingBlobs />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-emerald-100 pointer-events-auto">
                    <h1 className="font-bold text-gray-900 flex items-center gap-2">
                        <MapPin className="text-emerald-500" size={20} />
                        Task Map
                    </h1>
                    <p className="text-xs text-gray-500">Showing assigned tasks near you</p>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative z-0">
                <MapWrapper
                    reports={MOCK_TASKS}
                    onReportClick={setSelectedTask}
                    className="w-full h-full"
                />
            </div>

            {/* Task Details Overlay */}
            <AnimatePresence>
                {selectedTask && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="absolute bottom-20 left-4 right-4 z-20"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-6 border border-emerald-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                                        Assigned
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {selectedTask.category.replace('_', ' ').toUpperCase()}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{selectedTask.location.address}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-emerald-600">₹{selectedTask.reward}</p>
                                    <p className="text-xs text-gray-400">Reward</p>
                                </div>
                            </div>

                            <button className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2">
                                <Navigation size={20} />
                                Start Navigation
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
