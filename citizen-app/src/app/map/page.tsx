'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Layers, Navigation2, ZoomIn, ZoomOut, MapPin, List, Grid,
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, LucideIcon, ChevronRight, X,
    Droplets, Bug, Flame, Car, AlertTriangle, Zap, RefreshCw
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getSupabase } from '@/lib/supabase';
import { getStatusMeta, getWasteCategoryMeta } from '@/types';
import { ReportForm, ReportCard, MapWrapper, ReportDetailModal } from '@/components';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';

// Icon mapping supporting all 12 waste & hazard categories cleanly
const categoryIcons: Record<string, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
    sewage_overflow: Droplets,
    dead_animal: Bug,
    burning_waste: Flame,
    abandoned_vehicle: Car,
    hazardous_material: AlertTriangle,
    hazardous_waste: AlertTriangle,
    electrical_hazard: Zap,
};

// Floating green blobs
function FloatingGreenBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{ x: [100, 200, 50, 100], y: [50, 150, 100, 50] }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{ top: '10%', right: '10%' }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{ x: [-50, 100, 0, -50], y: [200, 100, 300, 200] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                style={{ top: '30%', left: '-5%' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                style={{ bottom: '5%', left: '40%' }}
            />
        </div>
    );
}

export default function MapPage() {
    const {
        reports,
        isLoading,
        fetchReports,
        selectedReport,
        setSelectedReport,
        setIsReportSheetOpen,
    } = useAppStore();

    const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'progress' | 'resolved'>('all');
    const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
    const [searchQuery, setSearchQuery] = useState('');
    const [tileStyle, setTileStyle] = useState<'street' | 'clean'>('street');
    const [zoomCommand, setZoomCommand] = useState<{ delta: number; seq: number }>({ delta: 0, seq: 0 });
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; seq: number } | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Fetch live reports on mount, on tab focus, and via Supabase Realtime
    useEffect(() => {
        void fetchReports();

        const onFocus = () => { void fetchReports(); };
        window.addEventListener('focus', onFocus);

        const supabase = getSupabase();
        const channel = supabase
            .channel('citizen-map-reports-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => {
                    void fetchReports();
                }
            )
            .subscribe();

        return () => {
            window.removeEventListener('focus', onFocus);
            supabase.removeChannel(channel);
        };
    }, [fetchReports]);

    const handleManualRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchReports();
        setIsRefreshing(false);
        toast.success('Map reports synced');
    }, [fetchReports]);

    const handleLocateMe = useCallback(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            toast.error('Location access not supported on this device');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation((prev) => ({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    seq: (prev?.seq || 0) + 1,
                }));
                toast.success('Centered on your GPS location');
            },
            () => toast.error('Could not access GPS location'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    const filteredReports = reports.filter((report) => {
        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'open' && (report.status === 'submitted' || report.status === 'under_review')) ||
            (activeFilter === 'progress' && (report.status === 'assigned' || report.status === 'in_progress')) ||
            (activeFilter === 'resolved' && (report.status === 'resolved' || report.status === 'closed'));

        const q = searchQuery.toLowerCase().trim();
        const categoryMeta = getWasteCategoryMeta(report.category);
        const matchesSearch =
            q === '' ||
            (report.location?.address?.toLowerCase().includes(q) ?? false) ||
            (report.location?.locality?.toLowerCase().includes(q) ?? false) ||
            (report.reportId?.toLowerCase().includes(q) ?? false) ||
            categoryMeta.label.toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <FloatingGreenBlobs />
            {/* Page Header - Translucent */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <MapPin size={28} className="text-emerald-500" />
                                    Waste Reports Map
                                </h1>
                                <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm">
                                    <span>
                                        {isLoading && reports.length === 0
                                            ? 'Loading live reports...'
                                            : `${filteredReports.length} reports found • Real-time locations`}
                                    </span>
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                title="Refresh live map reports"
                                className="p-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0 lg:hidden"
                            >
                                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 lg:w-80">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search locations, ID, issues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                title="Refresh live map reports"
                                className="hidden lg:flex p-3 rounded-xl bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                            </button>

                            <div className="hidden lg:flex items-center bg-gray-100 rounded-xl p-1">
                                {[
                                    { key: 'split', icon: Grid },
                                    { key: 'map', icon: MapPin },
                                    { key: 'list', icon: List },
                                ].map((item) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setViewMode(item.key as typeof viewMode)}
                                        className={`p-2.5 rounded-lg transition-all ${viewMode === item.key
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <item.icon size={18} />
                                    </button>
                                ))}
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsReportSheetOpen(true)}
                                className="hidden md:flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-600 transition-colors"
                            >
                                + New Report
                            </motion.button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
                        {[
                            { key: 'all', label: 'All Reports', count: reports.length },
                            { key: 'open', label: 'Open', count: reports.filter(r => r.status === 'submitted' || r.status === 'under_review').length },
                            { key: 'progress', label: 'In Progress', count: reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length },
                            { key: 'resolved', label: 'Resolved', count: reports.filter(r => r.status === 'resolved' || r.status === 'closed').length },
                        ].map((filter) => (
                            <motion.button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key as typeof activeFilter)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${activeFilter === filter.key
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                            >
                                {filter.label}
                                <span className="ml-2 opacity-70">({filter.count})</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`${viewMode === 'split' ? 'lg:grid lg:grid-cols-5' : ''}`}>
                {/* Map Section - REAL MAP with Leaflet */}
                {(viewMode === 'split' || viewMode === 'map') && (
                    <div
                        className={`relative w-full ${
                            viewMode === 'split'
                                ? 'lg:col-span-3 h-[50vh] lg:h-[calc(100vh-220px)] lg:sticky lg:top-20'
                                : 'h-[62vh] lg:h-[calc(100vh-250px)] min-h-[420px]'
                        } z-0`}
                    >
                        <MapWrapper
                            reports={filteredReports}
                            onReportClick={(report) => setSelectedReport(report)}
                            selectedReportId={selectedReport?.id}
                            tileStyle={tileStyle}
                            zoomCommand={zoomCommand}
                            userLocation={userLocation}
                            layoutKey={viewMode}
                            className="w-full h-full"
                        />

                        {/* Working Map Controls */}
                        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                            <motion.button
                                type="button"
                                title="Zoom in"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setZoomCommand((z) => ({ delta: 1, seq: z.seq + 1 }))}
                                className="w-11 h-11 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-700"
                            >
                                <ZoomIn size={20} />
                            </motion.button>
                            <motion.button
                                type="button"
                                title="Zoom out"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setZoomCommand((z) => ({ delta: -1, seq: z.seq + 1 }))}
                                className="w-11 h-11 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-700"
                            >
                                <ZoomOut size={20} />
                            </motion.button>
                            <motion.button
                                type="button"
                                title={`Switch map style (${tileStyle === 'street' ? 'Clean Light' : 'Street'})`}
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={() => setTileStyle((prev) => (prev === 'street' ? 'clean' : 'street'))}
                                className={`w-11 h-11 rounded-xl shadow-md border flex items-center justify-center transition-colors ${
                                    tileStyle === 'clean'
                                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <Layers size={20} />
                            </motion.button>
                            <motion.button
                                type="button"
                                title="Center on my GPS location"
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.92 }}
                                onClick={handleLocateMe}
                                className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-md flex items-center justify-center text-white"
                            >
                                <Navigation2 size={20} />
                            </motion.button>
                        </div>

                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md rounded-xl p-4 shadow-lg border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 mb-2.5 uppercase tracking-wider">Status Legend</p>
                            <div className="flex flex-wrap gap-4">
                                {[
                                    { color: 'bg-red-500', label: 'Open' },
                                    { color: 'bg-amber-500', label: 'In Progress' },
                                    { color: 'bg-emerald-500', label: 'Resolved' },
                                ].map((item) => (
                                    <span key={item.label} className="flex items-center gap-2 text-sm text-gray-600">
                                        <span className={`w-3 h-3 rounded-full ${item.color}`} />
                                        {item.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Reports List Panel */}
                {(viewMode === 'split' || viewMode === 'list') && (
                    <div className={`${viewMode === 'split' ? 'lg:col-span-2 lg:h-[calc(100vh-220px)] lg:overflow-y-auto' : 'max-w-7xl mx-auto px-4 lg:px-8 py-8'} bg-white lg:border-l border-gray-200 relative z-10`}>
                        <div className="p-4 lg:p-6 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <List size={20} className="text-emerald-500" />
                                Reports ({filteredReports.length})
                            </h2>

                            {filteredReports.length === 0 ? (
                                <div className="py-12 px-4 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/70">
                                    <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="font-semibold text-gray-700 text-sm">
                                        {isLoading ? 'Loading reports...' : 'No matching reports on the map'}
                                    </p>
                                    {!isLoading && (
                                        <button
                                            type="button"
                                            onClick={handleManualRefresh}
                                            className="mt-3 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                                        >
                                            Refresh Reports
                                        </button>
                                    )}
                                </div>
                            ) : viewMode === 'list' ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredReports.map((report, i) => (
                                        <motion.div
                                            key={report.id}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                        >
                                            <ReportCard
                                                report={report}
                                                onClick={() => setSelectedReport(report)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredReports.map((report, i) => {
                                        const categoryMeta = getWasteCategoryMeta(report.category);
                                        const statusMeta = getStatusMeta(report.status);
                                        const Icon = categoryIcons[report.category] || Trash2;
                                        const isSelected = selectedReport?.id === report.id;

                                        return (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -12 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                onClick={() => setSelectedReport(report)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${isSelected
                                                    ? 'bg-emerald-50 border-emerald-500'
                                                    : 'bg-white border-emerald-100 hover:bg-gray-50 hover:border-emerald-300'
                                                    }`}
                                            >
                                                <div
                                                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${categoryMeta.color}15` }}
                                                >
                                                    <Icon size={26} style={{ color: categoryMeta.color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {categoryMeta.label}
                                                        </h3>
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                                                            style={{
                                                                backgroundColor: statusMeta.bgColor,
                                                                color: statusMeta.color,
                                                            }}
                                                        >
                                                            {statusMeta.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {report.location?.locality || report.location?.address || 'Mumbai'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                <ChevronRight size={18} className="text-gray-300 flex-shrink-0" />
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Full Report Detail Modal */}
            {selectedReport && (
                <ReportDetailModal
                    report={selectedReport}
                    onClose={() => setSelectedReport(null)}
                />
            )}

            <ReportForm />
        </div>
    );
}
