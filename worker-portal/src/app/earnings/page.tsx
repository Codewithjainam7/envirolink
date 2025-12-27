'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, Calendar, Download, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

// Mock earnings data
const EARNINGS_SUMMARY = {
    today: 450,
    thisWeek: 3200,
    thisMonth: 12500,
    pending: 800,
    available: 11700,
};

const WEEKLY_DATA = [
    { day: 'Mon', amount: 350 },
    { day: 'Tue', amount: 450 },
    { day: 'Wed', amount: 200 },
    { day: 'Thu', amount: 600 },
    { day: 'Fri', amount: 400 },
    { day: 'Sat', amount: 800 },
    { day: 'Sun', amount: 450 },
];

const TRANSACTIONS = [
    { id: 1, type: 'Task Completed', taskId: 'RPT-0121', amount: 150, date: 'Today, 2:30 PM', status: 'credited', icon: 'check' },
    { id: 2, type: 'Task Completed', taskId: 'RPT-0120', amount: 200, date: 'Today, 11:15 AM', status: 'credited', icon: 'check' },
    { id: 3, type: 'Bonus', taskId: 'Weekly Bonus', amount: 500, date: 'Yesterday', status: 'credited', icon: 'gift' },
    { id: 4, type: 'Task Completed', taskId: 'RPT-0118', amount: 100, date: 'Yesterday', status: 'credited', icon: 'check' },
    { id: 5, type: 'Withdrawal', taskId: 'Bank Transfer', amount: -5000, date: 'Dec 24', status: 'completed', icon: 'bank' },
    { id: 6, type: 'Task Completed', taskId: 'RPT-0115', amount: 175, date: 'Dec 24', status: 'credited', icon: 'check' },
];

export default function EarningsPage() {
    // Simple state to toggle chart view if needed, or just interactions
    const [selectedPeriod, setSelectedPeriod] = useState('Week');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pb-24 relative font-sans">
            <FloatingBlobs />

            {/* Vibrant Header Section */}
            <header className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white pb-32 rounded-b-[3rem] shadow-2xl overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl translate-y-10 -translate-x-10 pointer-events-none" />

                <div className="relative z-10 px-6 pt-8">
                    <div className="flex items-center justify-between mb-8">
                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition text-emerald-50"
                            >
                                <ArrowLeft size={20} />
                            </motion.button>
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight">My Wallet</h1>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 10 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition text-emerald-50"
                        >
                            <Download size={20} />
                        </motion.button>
                    </div>

                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        >
                            <p className="text-emerald-100 text-sm font-medium mb-2 uppercase tracking-wide opacity-80">Available Balance</p>
                            <h2 className="text-5xl font-extrabold mb-6 tracking-tight relative inline-block">
                                <span className="text-3xl align-top opacity-70">₹</span>
                                {EARNINGS_SUMMARY.available.toLocaleString()}
                            </h2>
                        </motion.div>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                            whileTap={{ scale: 0.98 }}
                            className="px-10 py-4 bg-white text-emerald-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all relative overflow-hidden group"
                        >
                            <span className="relative z-10">Withdraw to Bank</span>
                            <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                    </div>
                </div>
            </header>

            <div className="max-w-xl mx-auto px-4 -mt-20 relative z-20 space-y-6">

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Calendar size={60} className="text-emerald-600" />
                        </div>
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Today</span>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-bold text-gray-900">₹{EARNINGS_SUMMARY.today}</span>
                                <span className="text-xs text-emerald-500 font-bold mb-1 mb-1.5">+12%</span>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-lg border border-white/50 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp size={60} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">This Week</span>
                            <div className="flex items-end gap-1">
                                <span className="text-2xl font-bold text-gray-900">₹{EARNINGS_SUMMARY.thisWeek.toLocaleString()}</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl shadow-xl border border-emerald-50 overflow-hidden"
                >
                    <div className="p-6 pb-0 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">Weekly Earnings</h3>
                        <select className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-lg outline-none cursor-pointer">
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-48 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={WEEKLY_DATA}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorAmount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Transactions List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/50 overflow-hidden"
                >
                    <div className="p-6 pb-2">
                        <h3 className="font-bold text-gray-900 text-lg">Transactions</h3>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {TRANSACTIONS.map((tx, i) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                                className="p-4 flex items-center justify-between cursor-pointer group transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {tx.amount > 0 ? <Wallet size={20} /> : <TrendingUp size={20} className="rotate-180" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">{tx.type}</p>
                                        <p className="text-xs text-gray-400 font-medium">{tx.date} • {tx.taskId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
                                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount)}
                                    </p>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{tx.status}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <button className="w-full py-4 text-center text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1">
                        View All History <ChevronRight size={16} />
                    </button>
                </motion.div>
            </div>

            <BottomNav />
        </div>
    );
}
