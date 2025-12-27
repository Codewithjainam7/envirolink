'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Filter, Search, MapPin, Navigation, Layers,
    AlertTriangle, CheckCircle, Clock, ChevronRight,
    Maximize2, Minimize2, Trash2, Package, Recycle,
    Construction, Cpu, Leaf, X
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import { Report, WASTE_CATEGORIES, STATUS_CONFIG } from '@/types';

// Dynamic import for map to avoid SSR issues
const MapWrapper = dynamic(() => import('@/components/MapWrapper'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full" />
        </div>
    )
});

// Mock Initial Data (will be replaced by API data)
const MOCK_REPORTS: Report[] = [];

export default function MapViewPage() {
    const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Fetch reports from API
    useEffect(() => {
        const fetchReports = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/reports');
                if (response.ok) {
                    const data = await response.json();
                    setReports(data.reports);
                }
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
        const interval = setInterval(fetchReports, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Filter logic
    const filteredReports = reports.filter(report => {
        const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
        const matchesSearch = report.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.location.address.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const categories = {
        illegal_dumping: { icon: Trash2, label: 'Illegal Dumping', color: '#ef4444' },
        overflowing_bin: { icon: Package, label: 'Overflowing Bin', color: '#f59e0b' },
        construction: { icon: Construction, label: 'Debris', color: '#6366f1' },
        electronic: { icon: Cpu, label: 'E-Waste', color: '#8b5cf6' },
        organic: { icon: Leaf, label: 'Organic', color: '#10b981' },
        recyclable: { icon: Recycle, label: 'Recyclable', color: '#3b82f6' },
    };

    return (
        <div className="h-[calc(100vh-64px)] lg:h-screen w-full relative overflow-hidden bg-gray-50">
            <FloatingBlobs />

            {/* Map Container */}
            <div className="absolute inset-0 z-0">
                <MapWrapper
                    reports={filteredReports}
                    onReportClick={setSelectedReport}
                    className="w-full h-full"
                />
            </div>

            {/* Sidebar / Overlay Panel */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        className="absolute left-4 top-4 bottom-4 w-96 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex flex-col z-10 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-white/50">
                            <div className="flex items-center justify-between mb-4">
                                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <MapPin className="text-emerald-500" />
                                    Live Reports
                                </h1>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search location or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {['all', 'submitted', 'in_progress', 'resolved'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === status
                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {status === 'all' ? 'All Reports' : status.replace('_', ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-emerald-200">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
                                </div>
                            ) : filteredReports.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                                    <p>No reports found in this area</p>
                                </div>
                            ) : (
                                filteredReports.map((report) => {
                                    const CategoryIcon = WASTE_CATEGORIES[report.category]?.icon ?
                                        categories[report.category as keyof typeof categories]?.icon || Trash2 : Trash2;

                                    return (
                                        <motion.div
                                            key={report.id}
                                            layoutId={report.id}
                                            onClick={() => setSelectedReport(report)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedReport?.id === report.id
                                                ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500'
                                                : 'bg-white border-gray-100 hover:border-emerald-200'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_CONFIG[report.status].bgColor} ${STATUS_CONFIG[report.status].color}`}>
                                                        {report.status.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-xs text-gray-400 font-mono">#{report.reportId.slice(-4)}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                                    <CategoryIcon size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-900">{WASTE_CATEGORIES[report.category]?.label || 'Waste Report'}</h3>
                                                    <p className="text-xs text-gray-500 line-clamp-1">{report.location.address}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button (when sidebar is closed) */}
            {!isSidebarOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setIsSidebarOpen(true)}
                    className="absolute left-4 top-4 p-3 bg-white rounded-xl shadow-lg hover:bg-emerald-50 text-emerald-600 z-10"
                >
                    <Layers size={24} />
                </motion.button>
            )}

            {/* Selected Report Details Popup (Floating center/right) */}
            <AnimatePresence>
                {selectedReport && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute right-4 top-4 bottom-4 w-96 z-20"
                    >
                        <div className="h-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-y-auto relative">
                            {/* Close Button */}
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="absolute top-4 right-4 p-2 bg-black/5 hover:bg-black/10 rounded-full z-10"
                            >
                                <X size={20} />
                            </button>

                            {/* Image Header */}
                            <div className="h-48 bg-gray-200 relative">
                                {selectedReport.images?.[0]?.url ? (
                                    <img
                                        src={selectedReport.images[0].url}
                                        alt="Report"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                        <Trash2 size={48} className="mb-2 opacity-50" />
                                        <span className="text-sm">No image available</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                    <div>
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider mb-2 inline-block ${reportSeverityColor(selectedReport.severity)}`}>
                                            {selectedReport.severity} Severity
                                        </span>
                                        <h2 className="text-2xl font-bold text-white shadow-sm">
                                            {WASTE_CATEGORIES[selectedReport.category]?.label}
                                        </h2>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Status Bar */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase">Current Status</p>
                                        <p className={`font-bold ${STATUS_CONFIG[selectedReport.status].color}`}>
                                            {STATUS_CONFIG[selectedReport.status].label}
                                        </p>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${STATUS_CONFIG[selectedReport.status].color.replace('text-', 'bg-')}`} />
                                </div>

                                {/* Location */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <MapPin size={16} className="text-emerald-500" />
                                        Location Details
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {selectedReport.location.address}
                                        <br />
                                        <span className="text-xs text-gray-400 mt-1 block">
                                            Lat: {selectedReport.location.latitude.toFixed(6)}, Lng: {selectedReport.location.longitude.toFixed(6)}
                                        </span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <button className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2">
                                        <CheckCircle size={20} />
                                        Mark as Resolved
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                            <Navigation size={18} />
                                            Navigate
                                        </button>
                                        <button className="py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                                            <AlertTriangle size={18} />
                                            Escalate
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function reportSeverityColor(severity: string) {
    switch (severity) {
        case 'high': return 'bg-red-500 text-white';
        case 'medium': return 'bg-amber-500 text-white';
        case 'low': return 'bg-emerald-500 text-white';
        default: return 'bg-gray-500 text-white';
    }
}
