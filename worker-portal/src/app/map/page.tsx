'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Loader2, ArrowLeft, X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import { Report } from '@/types';
import { createClient } from '@/lib/supabase';
import { fetchReportImagesMap } from '@/lib/reportImages';
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
    const [previewModal, setPreviewModal] = useState<{ images: string[]; index: number; title: string } | null>(null);
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
                .ilike('email', user.email || '')
                .maybeSingle();

            if (!workerData) {
                router.push('/login');
                return;
            }

            const { data: tasksData } = await supabase
                .from('reports')
                .select('*')
                .or(`assigned_worker_id.eq.${workerData.id},assigned_department_id.ilike.%${workerData.id}%`)
                .in('status', ['assigned', 'in_progress']);

            const taskIds = (tasksData || []).map((r) => r.id);
            const imagesByReport = await fetchReportImagesMap(supabase, taskIds);

            const mappedTasks: Report[] = (tasksData || []).map(r => {
                const taskImages = imagesByReport.get(r.id) || [];
                return {
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
                    imageUrl: taskImages[0],
                    images: taskImages,
                    createdAt: r.created_at,
                    updatedAt: r.updated_at,
                };
            });

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
        <div className="h-[100dvh] w-full relative bg-gray-50 flex flex-col overflow-hidden">
            <FloatingBlobs />

            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 z-10 pointer-events-none">
                <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-lg border border-emerald-100 pointer-events-auto flex items-center gap-3">
                    <Link href="/">
                        <button className="p-2 hover:bg-gray-100 rounded-xl transition shrink-0">
                            <ArrowLeft size={20} className="text-gray-600" />
                        </button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="font-bold text-gray-900 flex items-center gap-2 text-base sm:text-lg">
                            <MapPin className="text-emerald-500 shrink-0" size={20} />
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
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        className="absolute bottom-20 sm:bottom-24 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:w-full sm:max-w-lg z-30"
                    >
                        <div className="bg-white rounded-3xl shadow-2xl p-4 sm:p-6 border border-emerald-100 max-h-[calc(100dvh-8.5rem)] overflow-y-auto">
                            <div className="flex justify-between items-start gap-3 mb-3 sm:mb-4">
                                <div className="min-w-0 flex-1">
                                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider mb-1.5 inline-block ${selectedTask.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {selectedTask.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                                    </span>
                                    <h3 className="font-bold text-gray-900 text-base sm:text-lg leading-snug">
                                        {selectedTask.category?.replace(/_/g, ' ').toUpperCase() || 'Task'}
                                    </h3>
                                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 mt-0.5">{selectedTask.location.address}</p>
                                </div>
                                <div className="text-right shrink-0 bg-emerald-50 px-3 py-1.5 rounded-xl">
                                    <p className="text-lg sm:text-xl font-bold text-emerald-600">₹{getReward(selectedTask.severity)}</p>
                                    <p className="text-[10px] text-emerald-700 font-semibold uppercase">Reward</p>
                                </div>
                            </div>

                            {selectedTask.images && selectedTask.images.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPreviewModal({
                                            images: selectedTask.images!,
                                            index: 0,
                                            title: `${selectedTask.category?.replace(/_/g, ' ') || 'Task'} · ${selectedTask.location.locality || selectedTask.location.address}`,
                                        })
                                    }
                                    className="w-full aspect-[16/10] max-h-48 sm:max-h-56 mb-3 sm:mb-4 rounded-2xl overflow-hidden bg-emerald-50 border border-gray-200 relative group text-left"
                                >
                                    <img
                                        src={selectedTask.images[0]}
                                        alt="Assigned task photo"
                                        loading="eager"
                                        decoding="async"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-between p-2.5 sm:p-3">
                                        <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                                            <ZoomIn size={14} />
                                            Tap to enlarge reported photo
                                        </span>
                                        {selectedTask.images.length > 1 && (
                                            <span className="px-2 py-0.5 rounded-full bg-black/65 text-white text-[10px] font-bold">
                                                +{selectedTask.images.length - 1} more
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )}

                            <div className="flex gap-2.5 sm:gap-3">
                                <button
                                    onClick={() => startNavigation(selectedTask)}
                                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    <Navigation size={18} />
                                    Navigate
                                </button>
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition text-sm sm:text-base"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Fullscreen Photo Preview Lightbox (above BottomNav) */}
            <AnimatePresence>
                {previewModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewModal(null)}
                        className="fixed inset-0 z-[70] bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-3xl flex flex-col items-center"
                        >
                            <div className="w-full flex items-center justify-between text-white mb-3 gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm sm:text-base font-bold capitalize truncate">{previewModal.title}</p>
                                    {previewModal.images.length > 1 && (
                                        <p className="text-xs text-white/70">
                                            Photo {previewModal.index + 1} of {previewModal.images.length}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPreviewModal(null)}
                                    className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition shrink-0"
                                    aria-label="Close photo preview"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="relative w-full flex items-center justify-center">
                                <img
                                    src={previewModal.images[previewModal.index]}
                                    alt={`Assigned task photo ${previewModal.index + 1}`}
                                    className="max-h-[78dvh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                                />
                                {previewModal.images.length > 1 && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewModal((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              index: (prev.index - 1 + prev.images.length) % prev.images.length,
                                                          }
                                                        : null
                                                )
                                            }
                                            className="absolute left-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                                            aria-label="Previous photo"
                                        >
                                            <ChevronLeft size={22} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setPreviewModal((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              index: (prev.index + 1) % prev.images.length,
                                                          }
                                                        : null
                                                )
                                            }
                                            className="absolute right-2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                                            aria-label="Next photo"
                                        >
                                            <ChevronRight size={22} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomNav />
        </div>
    );
}
