'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles, Zap, UserPlus, Loader2, CheckCircle, AlertTriangle,
    MapPin, Clock, User, ArrowRight, RefreshCw, Bot
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import { createClient } from '@/lib/supabase';

interface PendingReport {
    id: string;
    report_id: string;
    category: string;
    address: string;
    locality: string;
    latitude: number;
    longitude: number;
    created_at: string;
    severity: string;
}

interface AvailableWorker {
    id: string;
    first_name: string;
    last_name: string;
    zone: string;
    phone: string;
    status: string;
}

export default function AIAssignmentPage() {
    const supabase = createClient();
    const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
    const [availableWorkers, setAvailableWorkers] = useState<AvailableWorker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    const [assignedCount, setAssignedCount] = useState(0);
    const [selectedReport, setSelectedReport] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch pending/submitted reports - these are reports waiting for assignment
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('id, report_id, category, address, locality, latitude, longitude, created_at, severity, status')
                .eq('status', 'submitted')
                .order('created_at', { ascending: false });

            if (reportsError) {
                console.error('Error fetching reports:', reportsError);
                throw reportsError;
            }
            console.log('Fetched pending reports:', reportsData?.length || 0);
            setPendingReports(reportsData || []);

            // Fetch available workers
            const { data: workersData, error: workersError } = await supabase
                .from('workers')
                .select('id, first_name, last_name, zone, phone, status')
                .in('status', ['approved', 'active', 'available']);

            if (workersError) {
                console.error('Error fetching workers:', workersError);
                throw workersError;
            }
            console.log('Fetched available workers:', workersData?.length || 0);
            setAvailableWorkers(workersData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} mins ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hours ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} days ago`;
    };

    // AI Auto-assign all pending reports
    const handleAutoAssignAll = async () => {
        if (pendingReports.length === 0 || availableWorkers.length === 0) return;

        setIsAutoAssigning(true);
        setAssignedCount(0);

        try {
            for (let i = 0; i < pendingReports.length; i++) {
                const report = pendingReports[i];
                const worker = availableWorkers[i % availableWorkers.length]; // Round-robin assignment

                await supabase
                    .from('reports')
                    .update({
                        status: 'assigned',
                        assigned_worker_id: worker.id,
                        assigned_worker_name: `${worker.first_name} ${worker.last_name}`
                    })
                    .eq('id', report.id);

                setAssignedCount(i + 1);
                await new Promise(r => setTimeout(r, 500)); // Small delay for visual feedback
            }

            // Refresh data
            await fetchData();
        } catch (error) {
            console.error('Error auto-assigning:', error);
        } finally {
            setIsAutoAssigning(false);
            setAssignedCount(0);
        }
    };

    // Manual assignment
    const handleManualAssign = async (reportId: string, worker: AvailableWorker) => {
        try {
            await supabase
                .from('reports')
                .update({
                    status: 'assigned',
                    assigned_worker_id: worker.id,
                    assigned_worker_name: `${worker.first_name} ${worker.last_name}`
                })
                .eq('id', reportId);

            setPendingReports(prev => prev.filter(r => r.id !== reportId));
            setSelectedReport(null);
        } catch (error) {
            console.error('Error assigning:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen relative pb-8">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Bot size={28} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900">AI Assignment</h1>
                        </div>
                        <p className="text-gray-500 font-medium">Automatically assign reports to nearest available workers</p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAutoAssignAll}
                        disabled={isAutoAssigning || pendingReports.length === 0 || availableWorkers.length === 0}
                        className="flex items-center gap-3 px-8 py-4 bg-emerald-50 text-emerald-700 font-semibold rounded-2xl transition-all border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-50 shadow-sm"
                    >
                        {isAutoAssigning ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                Assigning... ({assignedCount}/{pendingReports.length})
                            </>
                        ) : (
                            <>
                                <Sparkles size={22} />
                                Auto-Assign All ({pendingReports.length})
                            </>
                        )}
                    </motion.button>
                </div>

                {/* AI Status Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 mb-8 text-white shadow-xl shadow-emerald-500/20"
                >
                    <div className="grid md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-emerald-400/30">
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">{pendingReports.length}</p>
                            <p className="text-emerald-100 font-medium">Pending Reports</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">{availableWorkers.length}</p>
                            <p className="text-emerald-100 font-medium">Available Workers</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">-</p>
                            <p className="text-emerald-100 font-medium">Avg. Distance</p>
                        </div>
                        <div className="text-center p-2">
                            <p className="text-4xl font-bold mb-1">~15 min</p>
                            <p className="text-emerald-100 font-medium">Est. Response</p>
                        </div>
                    </div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Pending Reports */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-emerald-500" size={20} />
                            Pending Reports
                        </h2>

                        {pendingReports.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg border-2 border-emerald-100"
                            >
                                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Caught Up!</h3>
                                <p className="text-gray-500">All reports have been assigned to workers.</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {pendingReports.map((report, i) => (
                                    <motion.div
                                        key={report.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm hover:shadow-lg border-2 transition-all cursor-pointer ${selectedReport === report.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-emerald-50/50 hover:border-emerald-200'
                                            }`}
                                        onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${report.severity === 'high' ? 'bg-red-100 text-red-700' :
                                                        report.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                        {(report.severity || 'medium').toUpperCase()}
                                                    </span>
                                                    <span className="text-gray-400 text-sm font-mono">{report.report_id}</span>
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-lg">{report.category?.replace(/_/g, ' ') || 'Waste Report'}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={14} className="text-emerald-500" />
                                                        {report.locality || report.address?.slice(0, 30) || 'Unknown location'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} className="text-emerald-500" />
                                                        {formatTimeAgo(report.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedReport(report.id);
                                                }}
                                                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                            >
                                                <UserPlus size={18} />
                                                Assign
                                            </button>
                                        </div>

                                        {/* Worker Selection (when expanded) */}
                                        {selectedReport === report.id && availableWorkers.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="mt-4 pt-4 border-t border-gray-100"
                                            >
                                                <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                                    <Zap size={14} className="text-emerald-500" />
                                                    Available Workers
                                                </p>
                                                <div className="space-y-2">
                                                    {availableWorkers.slice(0, 5).map(worker => (
                                                        <button
                                                            key={worker.id}
                                                            onClick={() => handleManualAssign(report.id, worker)}
                                                            className="w-full flex items-center gap-3 p-3 bg-gray-50/80 rounded-xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all group"
                                                        >
                                                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-bold text-emerald-600 shadow-sm group-hover:scale-105 transition-transform">
                                                                {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                            </div>
                                                            <div className="flex-1 text-left">
                                                                <p className="font-bold text-gray-900">{worker.first_name} {worker.last_name}</p>
                                                                <p className="text-xs font-semibold text-gray-500">{worker.zone || 'Unassigned'} • {worker.phone || 'No phone'}</p>
                                                            </div>
                                                            <ArrowRight size={18} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Assignments & Settings */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <RefreshCw className="text-emerald-500" size={20} />
                            Assignment Settings
                        </h2>

                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-emerald-50 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-4">Configuration</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">Auto-assign on submit</p>
                                            <p className="text-sm text-gray-500">Automatically assign when report is submitted</p>
                                        </div>
                                        <button className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer shadow-inner">
                                            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-semibold text-gray-900">Worker proximity</p>
                                            <p className="text-sm text-gray-500">Assign to nearest worker by default</p>
                                        </div>
                                        <button className="w-12 h-6 bg-emerald-500 rounded-full relative cursor-pointer shadow-inner">
                                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Available Workers ({availableWorkers.length})</h3>
                                {availableWorkers.length === 0 ? (
                                    <p className="text-gray-500 text-center py-4">No workers available</p>
                                ) : (
                                    <div className="space-y-3 max-h-64 overflow-y-auto">
                                        {availableWorkers.map(worker => (
                                            <div key={worker.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center font-bold text-emerald-700">
                                                    {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-900">{worker.first_name} {worker.last_name}</p>
                                                    <p className="text-sm text-gray-500">{worker.zone || 'No zone'}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                                    {worker.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
