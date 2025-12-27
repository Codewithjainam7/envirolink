'use client';

import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, TrendingDown, Users, FileSpreadsheet,
    Calendar, Download, Filter, ArrowUp, ArrowDown, Clock, CheckCircle
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

// Mock analytics data
const STATS = {
    totalReports: 2456,
    resolvedReports: 2234,
    avgResponseTime: 2.4,
    workerEfficiency: 94.2,
    citizenSatisfaction: 4.7,
    monthlyGrowth: 12.5,
};

const WEEKLY_DATA = [
    { day: 'Mon', reports: 45, resolved: 42 },
    { day: 'Tue', reports: 52, resolved: 48 },
    { day: 'Wed', reports: 38, resolved: 40 },
    { day: 'Thu', reports: 65, resolved: 58 },
    { day: 'Fri', reports: 55, resolved: 52 },
    { day: 'Sat', reports: 28, resolved: 30 },
    { day: 'Sun', reports: 22, resolved: 25 },
];

const TOP_ZONES = [
    { zone: 'Zone 3 - Andheri', reports: 456, resolved: 432, efficiency: 94.7 },
    { zone: 'Zone 1 - South', reports: 389, resolved: 378, efficiency: 97.2 },
    { zone: 'Zone 2 - Central', reports: 312, resolved: 298, efficiency: 95.5 },
    { zone: 'Zone 4 - Eastern', reports: 278, resolved: 256, efficiency: 92.1 },
    { zone: 'Zone 5 - Navi', reports: 234, resolved: 220, efficiency: 94.0 },
];

const TOP_WORKERS = [
    { name: 'Suresh Patil', tasks: 145, rating: 4.9, efficiency: 98.2 },
    { name: 'Ramesh Kumar', tasks: 132, rating: 4.8, efficiency: 96.5 },
    { name: 'Anil Sharma', tasks: 128, rating: 4.7, efficiency: 95.8 },
    { name: 'Vijay Singh', tasks: 115, rating: 4.5, efficiency: 93.2 },
];

export default function AnalyticsPage() {
    const maxReports = Math.max(...WEEKLY_DATA.map(d => d.reports));

    return (
        <div className="min-h-screen relative pb-8">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                        <p className="text-gray-500 font-medium">Performance metrics and insights</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Last 90 Days</option>
                            <option>This Year</option>
                        </select>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-emerald-100 rounded-xl text-emerald-700 font-medium hover:bg-emerald-50 transition-all shadow-sm">
                            <Download size={18} />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    {[
                        { label: 'Total Reports', value: STATS.totalReports.toLocaleString(), icon: FileSpreadsheet, color: '#10b981', change: '+12%' }, // Emerald
                        { label: 'Resolved', value: STATS.resolvedReports.toLocaleString(), icon: CheckCircle, color: '#059669', change: '+15%' }, // Darker Emerald
                        { label: 'Avg Response', value: `${STATS.avgResponseTime}h`, icon: Clock, color: '#f59e0b', change: '-8%' }, // Amber
                        { label: 'Efficiency', value: `${STATS.workerEfficiency}%`, icon: TrendingUp, color: '#8b5cf6', change: '+3%' }, // Violet
                        { label: 'Satisfaction', value: `${STATS.citizenSatisfaction}/5`, icon: Users, color: '#ec4899', change: '+5%' }, // Pink
                        { label: 'Growth', value: `${STATS.monthlyGrowth}%`, icon: BarChart3, color: '#06b6d4', change: '+2%' }, // Cyan
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
                                <span className={`flex items-center gap-1 text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-red-500'
                                    }`}>
                                    {stat.change.startsWith('+') ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                    {stat.change}
                                </span>
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
                        <div className="flex items-end gap-3 h-56 sm:h-64 pb-2">
                            {WEEKLY_DATA.map((data, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full group">
                                    <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-2 px-1 rounded-xl transition-colors hover:bg-emerald-50/50">
                                        {/* Reports Filed Bar */}
                                        <div className="relative flex flex-col items-center gap-1 w-full">
                                            <div
                                                className="w-full max-w-[24px] bg-emerald-500 rounded-t-lg shadow-sm transition-all group-hover:bg-emerald-600 relative overflow-hidden"
                                                style={{ height: `${(data.reports / maxReports) * 200}px` }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                                            </div>
                                        </div>

                                        {/* Resolved Bar */}
                                        <div className="relative flex flex-col items-center gap-1 w-full">
                                            <div
                                                className="w-full max-w-[24px] bg-emerald-300 rounded-t-lg shadow-sm transition-all group-hover:bg-emerald-400 relative overflow-hidden"
                                                style={{ height: `${(data.resolved / maxReports) * 200}px` }}
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
                    </motion.div>

                    {/* Zone Performance */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6">Zone Performance</h2>
                        <div className="space-y-4">
                            {TOP_ZONES.map((zone, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-8 text-center text-sm font-bold text-gray-400">#{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-bold text-gray-900">{zone.zone}</span>
                                            <span className="text-sm font-medium text-gray-500">{zone.reports} reports</span>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                                style={{ width: `${zone.efficiency}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{zone.efficiency}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Top Workers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-emerald-100"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Top Performing Workers</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-emerald-50/50 rounded-lg">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 rounded-l-lg">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Worker</th>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Tasks Completed</th>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600">Rating</th>
                                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-600 rounded-r-lg">Efficiency</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {TOP_WORKERS.map((worker, i) => (
                                    <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="py-4 px-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${i === 0 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 shadow-sm' :
                                                i === 1 ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                                    i === 2 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        'bg-transparent text-gray-400 border-transparent'
                                                }`}>
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 shadow-sm border border-emerald-200">
                                                    {worker.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <span className="font-bold text-gray-900">{worker.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-gray-900 font-bold">{worker.tasks}</td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-1 bg-amber-50 w-fit px-2 py-1 rounded-lg border border-amber-100">
                                                <span className="text-amber-400">★</span>
                                                <span className="font-bold text-amber-700">{worker.rating}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm border border-emerald-200">
                                                {worker.efficiency}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
