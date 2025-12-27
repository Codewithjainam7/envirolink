'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Filter, Layers, Navigation2, ZoomIn, ZoomOut, MapPin, List, Grid,
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, LucideIcon, ChevronRight, X
} from 'lucide-react';
import { useAppStore } from '@/store';
import { STATUS_CONFIG, WASTE_CATEGORIES, WasteCategory, Report } from '@/types';
import { ReportForm, ReportCard, MapWrapper } from '@/components';
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

// Floating green blobs
function FloatingGreenBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{ x: [100, 200, 50, 100], y: [50, 150, 100, 50] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: '10%', right: '10%' }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{ x: [-50, 100, 0, -50], y: [200, 100, 300, 200] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ top: '30%', left: '-5%' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '5%', left: '40%' }}
            />
        </div>
    );
}

export default function MapPage() {
    const { reports, selectedReport, setSelectedReport, setIsReportSheetOpen } = useAppStore();
    const [mounted, setMounted] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'progress' | 'resolved'>('all');
    const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredReports = reports.filter(report => {
        const matchesFilter =
            activeFilter === 'all' ||
            (activeFilter === 'open' && (report.status === 'submitted' || report.status === 'under_review')) ||
            (activeFilter === 'progress' && (report.status === 'assigned' || report.status === 'in_progress')) ||
            (activeFilter === 'resolved' && (report.status === 'resolved' || report.status === 'closed'));

        const matchesSearch =
            searchQuery === '' ||
            report.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (report.location.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            WASTE_CATEGORIES[report.category].label.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <FloatingGreenBlobs />
            {/* Page Header - Translucent */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <MapPin size={28} className="text-emerald-500" />
                                Waste Reports Map
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {filteredReports.length} reports found • Real-time locations
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative flex-1 lg:w-80">
                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search locations, issues..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                />
                            </div>

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
                                            ? 'bg-white text-emerald-600'
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
                                className="hidden md:flex items-center gap-2 px-5 py-3 bg-emerald-500 text-white font-semibold rounded-xl"
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
                    <div className={`relative ${viewMode === 'split' ? 'lg:col-span-3' : ''} h-[50vh] lg:h-[calc(100vh-220px)] sticky top-0`}>
                        <MapWrapper
                            reports={filteredReports}
                            onReportClick={(report) => setSelectedReport(report)}
                            selectedReportId={selectedReport?.id}
                            className="w-full h-full"
                        />

                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 flex flex-col gap-2">
                            {[ZoomIn, ZoomOut, Layers].map((Icon, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-11 h-11 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-50"
                                >
                                    <Icon size={20} className="text-gray-600" />
                                </motion.button>
                            ))}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center"
                            >
                                <Navigation2 size={20} className="text-white" />
                            </motion.button>
                        </div>

                        {/* Legend */}
                        <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl p-4 shadow-lg">
                            <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Status Legend</p>
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
                    <div className={`${viewMode === 'split' ? 'lg:col-span-2 lg:h-[calc(100vh-220px)] lg:overflow-y-auto' : 'max-w-7xl mx-auto px-4 lg:px-8 py-8'} bg-white lg:border-l border-gray-200`}>
                        <div className="p-4 lg:p-6 space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <List size={20} className="text-emerald-500" />
                                Reports ({filteredReports.length})
                            </h2>

                            {viewMode === 'list' ? (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredReports.map((report, i) => (
                                        <motion.div
                                            key={report.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
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
                                        const Icon = categoryIcons[report.category];
                                        const color = WASTE_CATEGORIES[report.category].color;
                                        const isSelected = selectedReport?.id === report.id;

                                        return (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                whileHover={{ scale: 1.01, x: 4 }}
                                                onClick={() => setSelectedReport(report)}
                                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${isSelected
                                                    ? 'bg-emerald-50 border-emerald-500'
                                                    : 'bg-white border-emerald-100 hover:bg-gray-50 hover:border-emerald-300'
                                                    }`}
                                            >
                                                <div
                                                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ backgroundColor: `${color}15` }}
                                                >
                                                    <Icon size={26} style={{ color }} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {WASTE_CATEGORIES[report.category].label}
                                                        </h3>
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                                                            style={{
                                                                backgroundColor: STATUS_CONFIG[report.status].bgColor,
                                                                color: STATUS_CONFIG[report.status].color
                                                            }}
                                                        >
                                                            {STATUS_CONFIG[report.status].label}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {report.location.locality || report.location.address}
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

            {/* Selected Report Detail Drawer */}
            {selectedReport && viewMode === 'map' && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
                >
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {(() => {
                                    const Icon = categoryIcons[selectedReport.category];
                                    const color = WASTE_CATEGORIES[selectedReport.category].color;
                                    return (
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${color}15` }}
                                        >
                                            <Icon size={24} style={{ color }} />
                                        </div>
                                    );
                                })()}
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {WASTE_CATEGORIES[selectedReport.category].label}
                                    </h3>
                                    <p className="text-sm text-gray-500">{selectedReport.reportId}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2 text-sm">
                            <MapPin size={14} />
                            {selectedReport.location.address}
                        </p>
                    </div>
                </motion.div>
            )}

            <ReportForm />
        </div>
    );
}
