'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, TrendingUp, Calendar, Download, ChevronRight, Loader2 } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Transaction {
    id: string;
    type: string;
    taskId: string;
    amount: number;
    date: string;
    status: string;
}

export default function EarningsPage() {
    const [loading, setLoading] = useState(true);
    const [earnings, setEarnings] = useState({ today: 0, thisWeek: 0, thisMonth: 0, total: 0 });
    const [weeklyData, setWeeklyData] = useState<{ day: string; amount: number }[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchEarnings();
    }, []);

    const fetchEarnings = async () => {
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

            // Get all completed tasks for this worker
            const { data: completedTasks } = await supabase
                .from('reports')
                .select('id, report_id, severity, updated_at')
                .eq('assigned_worker_id', workerData.id)
                .eq('status', 'resolved')
                .order('updated_at', { ascending: false });

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(todayStart);
            weekStart.setDate(weekStart.getDate() - 7);
            const monthStart = new Date(todayStart);
            monthStart.setDate(1);

            let todayEarnings = 0;
            let weekEarnings = 0;
            let monthEarnings = 0;
            let totalEarnings = 0;

            const txnList: Transaction[] = [];
            const dailyAmounts: { [key: string]: number } = {};

            // Initialize last 7 days
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                dailyAmounts[days[d.getDay()]] = 0;
            }

            (completedTasks || []).forEach((task, idx) => {
                const reward = task.severity === 'critical' ? 200 : task.severity === 'high' ? 150 : 100;
                const taskDate = new Date(task.updated_at);

                totalEarnings += reward;
                if (taskDate >= todayStart) todayEarnings += reward;
                if (taskDate >= weekStart) {
                    weekEarnings += reward;
                    dailyAmounts[days[taskDate.getDay()]] += reward;
                }
                if (taskDate >= monthStart) monthEarnings += reward;

                // Add to transactions (limit to 10)
                if (idx < 10) {
                    txnList.push({
                        id: task.id,
                        type: 'Task Completed',
                        taskId: task.report_id || `RPT-${idx}`,
                        amount: reward,
                        date: formatDate(task.updated_at),
                        status: 'credited'
                    });
                }
            });

            setEarnings({
                today: todayEarnings,
                thisWeek: weekEarnings,
                thisMonth: monthEarnings,
                total: totalEarnings
            });

            // Convert daily amounts to chart data
            const chartData = Object.entries(dailyAmounts).map(([day, amount]) => ({
                day,
                amount
            }));
            setWeeklyData(chartData);
            setTransactions(txnList);

        } catch (error) {
            console.error('Error fetching earnings:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 pb-24 relative font-sans">
            <FloatingBlobs />

            {/* Vibrant Header Section */}
            <header className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white pb-32 rounded-b-[3rem] shadow-2xl overflow-hidden">
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
                            onClick={() => alert('Download feature coming soon!')}
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
                            <p className="text-emerald-100 text-sm font-medium mb-2 uppercase tracking-wide opacity-80">Total Earnings</p>
                            <h2 className="text-5xl font-extrabold mb-6 tracking-tight relative inline-block">
                                <span className="text-3xl align-top opacity-70">₹</span>
                                {earnings.total.toLocaleString()}
                            </h2>
                        </motion.div>

                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => alert('Withdrawal feature coming soon!')}
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
                                <span className="text-2xl font-bold text-gray-900">₹{earnings.today}</span>
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
                                <span className="text-2xl font-bold text-gray-900">₹{earnings.thisWeek.toLocaleString()}</span>
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
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-lg">
                            ₹{earnings.thisMonth.toLocaleString()} this month
                        </span>
                    </div>
                    <div className="h-48 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyData}>
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
                        <h3 className="font-bold text-gray-900 text-lg">Recent Transactions</h3>
                    </div>

                    {transactions.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {transactions.map((tx, i) => (
                                <motion.div
                                    key={tx.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + (i * 0.05) }}
                                    whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.8)' }}
                                    className="p-4 flex items-center justify-between cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 bg-emerald-100 text-emerald-600">
                                            <Wallet size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors">{tx.type}</p>
                                            <p className="text-xs text-gray-400 font-medium">{tx.date} • {tx.taskId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-sm text-emerald-600">
                                            +₹{tx.amount}
                                        </p>
                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{tx.status}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <Wallet size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No transactions yet</p>
                            <p className="text-sm">Complete tasks to earn rewards</p>
                        </div>
                    )}
                </motion.div>
            </div>

            <BottomNav />
        </div>
    );
}
