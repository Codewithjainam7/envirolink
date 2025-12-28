'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Loader2, ArrowLeft } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import { Report } from '@/types';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Dynamic map import
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse" />
});

export default function WorkerMapPage() {
    const [tasks, setTasks] = useState<Report[]>([]);
    const [selectedTask, setSelectedTask] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: workerData } = await supabase
                .from('workers')
                .select('id')
                .eq('email', user.email)
                .single();

            if (!workerData) {
                router.push('/login');
                return;
            }

            const { data: tasksData } = await supabase
                .from('reports')
                .select('*')
                .eq('assigned_worker_id', workerData.id)
                .in('status', ['assigned', 'in_progress']);

            const mappedTasks: Report[] = (tasksData || []).map(r => ({
                id: r.id,
                reportId: r.report_id,
                location: {
                    latitude: r.latitude,
                    longitude: r.longitude,
                    address: r.address || r.locality || 'Unknown location',
                    locality: r.locality || 'Unknown',
                    city: r.city || 'Mumbai'
                },
                category: r.category,
                severity: r.severity,
                status: r.status,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
            }));

            setTasks(mappedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const getReward = (severity: string) => {
        return severity === 'critical' ? 200 : severity === 'high' ? 150 : 100;
    };

    const startNavigation = (task: Report) => {
        const { latitude, longitude } = task.location;
        // Open in Google Maps
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="h-screen w-full relative bg-gray-50 flex flex-col">
            <FloatingBlobs />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 z-10 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-emerald-100 pointer-events-auto flex items-center gap-3">
                    <Link href="/">
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="font-bold text-gray-900 flex items-center gap-2">
                            <MapPin className="text-emerald-500" size={20} />
                            Task Map
                        </h1>
                        <p className="text-xs text-gray-500">
                            {tasks.length > 0 ? `${tasks.length} assigned tasks` : 'No tasks assigned'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative z-0">
                <MapWrapper
                    reports={tasks}
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
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block ${selectedTask.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {selectedTask.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-lg">
                                        {selectedTask.category?.replace(/_/g, ' ').toUpperCase() || 'Task'}
                                    </h3>
                                    <p className="text-gray-500 text-sm">{selectedTask.location.address}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-emerald-600">₹{getReward(selectedTask.severity)}</p>
                                    <p className="text-xs text-gray-400">Reward</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => startNavigation(selectedTask)}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                                >
                                    <Navigation size={20} />
                                    Navigate
                                </button>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
