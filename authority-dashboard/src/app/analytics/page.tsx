'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, TrendingDown, Users, FileSpreadsheet,
    Calendar, Download, Filter, ArrowUp, ArrowDown, Clock, CheckCircle, Loader2
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import { createClient } from '@/lib/supabase';

interface Stats {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    inProgressReports: number;
    totalWorkers: number;
}

interface WeeklyData {
    day: string;
    reports: number;
    resolved: number;
}

interface WorkerStats {
    id: string;
    first_name: string;
    last_name: string;
    zone: string;
    status: string;
}

export default function AnalyticsPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({
        totalReports: 0,
        resolvedReports: 0,
        pendingReports: 0,
        inProgressReports: 0,
        totalWorkers: 0
    });
    const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
    const [workers, setWorkers] = useState<WorkerStats[]>([]);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            // Fetch all reports
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('id, status, created_at');

            if (reportsError) throw reportsError;

            const reports = reportsData || [];

            // Calculate stats
            const totalReports = reports.length;
            const resolvedReports = reports.filter(r => r.status === 'resolved').length;
            const pendingReports = reports.filter(r => r.status === 'submitted' || r.status === 'pending').length;
            const inProgressReports = reports.filter(r => r.status === 'in_progress' || r.status === 'assigned').length;

            // Fetch workers
            const { data: workersData, error: workersError } = await supabase
                .from('workers')
                .select('id, first_name, last_name, zone, status')
                .in('status', ['approved', 'active']);

            if (workersError) throw workersError;

            setStats({
                totalReports,
                resolvedReports,
                pendingReports,
                inProgressReports,
                totalWorkers: workersData?.length || 0
            });

            setWorkers(workersData || []);

            // Calculate weekly data (last 7 days)
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const today = new Date();
            const weeklyStats: WeeklyData[] = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
                const dateStr = date.toISOString().split('T')[0];

                const dayReports = reports.filter(r => r.created_at?.startsWith(dateStr));
                const dayResolved = dayReports.filter(r => r.status === 'resolved');

                weeklyStats.push({
                    day: dayName,
                    reports: dayReports.length,
                    resolved: dayResolved.length
                });
            }

            setWeeklyData(weeklyStats);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const maxReports = Math.max(...weeklyData.map(d => d.reports), 1);
    const resolutionRate = stats.totalReports > 0
        ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
        : 0;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
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
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-500 font-medium">Real-time performance metrics</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={fetchAnalytics}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl text-emerald-700 font-medium hover:bg-emerald-50 transition-all shadow-sm"
                        >
                            <TrendingUp size={18} />
                            Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl text-emerald-700 font-medium hover:bg-emerald-50 transition-all shadow-sm">
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
                    {[
                        { label: 'Total Reports', value: stats.totalReports, icon: FileSpreadsheet, color: '#10b981' },
                        { label: 'Resolved', value: stats.resolvedReports, icon: CheckCircle, color: '#059669' },
                        { label: 'Pending', value: stats.pendingReports, icon: Clock, color: '#f59e0b' },
                        { label: 'In Progress', value: stats.inProgressReports, icon: TrendingUp, color: '#3b82f6' },
                        { label: 'Resolution Rate', value: `${resolutionRate}%`, icon: BarChart3, color: '#8b5cf6' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-emerald-50/50"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                                    style={{ backgroundColor: `${stat.color}15` }}
                                >
                                    <stat.icon size={20} style={{ color: stat.color }} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 mb-8">
                    {/* Weekly Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Weekly Report Trends</h2>
                        {weeklyData.every(d => d.reports === 0) ? (
                            <div className="h-56 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <BarChart3 size={48} className="mx-auto mb-2 opacity-30" />
                                    <p>No report data for this week</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-end gap-3 h-56 sm:h-64 pb-2">
                                    {weeklyData.map((data, i) => (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                                            <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-2 px-1 rounded-xl transition-colors hover:bg-emerald-50/50">
                                                {/* Reports Filed Bar */}
                                                <div className="relative flex flex-col items-center gap-1 w-full">
                                                    <div
                                                        className="w-full max-w-[24px] bg-emerald-500 rounded-t-lg shadow-sm transition-all group-hover:bg-emerald-600 relative overflow-hidden"
                                                        style={{ height: `${Math.max((data.reports / maxReports) * 200, 4)}px` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                                    </div>
                                                </div>

                                                {/* Resolved Bar */}
                                                <div className="relative flex flex-col items-center gap-1 w-full">
                                                    <div
                                                        className="w-full max-w-[24px] bg-emerald-300 rounded-t-lg shadow-sm transition-all group-hover:bg-emerald-400 relative overflow-hidden"
                                                        style={{ height: `${Math.max((data.resolved / maxReports) * 200, 4)}px` }}
                                                    >
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-xs sm:text-sm font-medium text-gray-500 group-hover:text-emerald-700 transition-colors">{data.day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-6 mt-6">
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <span className="w-3 h-3 bg-emerald-500 rounded ring-2 ring-emerald-100" />
                                        Reports Filed
                                    </span>
                                    <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                        <span className="w-3 h-3 bg-emerald-300 rounded ring-2 ring-emerald-100" />
                                        Resolved
                                    </span>
                                </div>
                            </>
                        )}
                    </motion.div>

                    {/* Report Status */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Report Status Distribution</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Resolved', value: stats.resolvedReports, color: '#10b981' },
                                { label: 'In Progress', value: stats.inProgressReports, color: '#3b82f6' },
                                { label: 'Pending', value: stats.pendingReports, color: '#f59e0b' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-24 text-sm font-medium text-gray-600">{item.label}</div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: stats.totalReports > 0 ? `${(item.value / stats.totalReports) * 100}%` : '0%' }}
                                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 w-12 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Active Workers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Active Workers ({workers.length})</h2>
                    {workers.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Users size={48} className="mx-auto mb-2 opacity-30" />
                            <p>No active workers found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-emerald-50/50 rounded-lg">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 rounded-l-lg">#</th>
                                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Worker</th>
                                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Zone</th>
                                        <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 rounded-r-lg">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {workers.map((worker, i) => (
                                        <tr key={worker.id} className="hover:bg-emerald-50/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <span className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-gray-50 text-gray-600 border border-gray-200">
                                                    {i + 1}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 shadow-sm border border-emerald-200">
                                                        {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                    </div>
                                                    <span className="font-bold text-gray-900">{worker.first_name} {worker.last_name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-gray-600 font-medium">{worker.zone || 'Unassigned'}</td>
                                            <td className="py-4 px-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${worker.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {worker.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
