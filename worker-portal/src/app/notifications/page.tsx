'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Gift, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';
import FloatingBlobs from '@/components/FloatingBlobs';

const NOTIFICATIONS = [
    {
        id: 1,
        type: 'success',
        title: 'Task Completed',
        message: 'You have successfully completed task #RPT-0121. Reward of ₹150 has been credited.',
        time: 'Just now',
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
    },
    {
        id: 2,
        type: 'alert',
        title: 'New High Priority Task',
        message: 'A severe waste dump reported near your location. Accept now for 1.5x reward!',
        time: '14 min ago',
        icon: AlertTriangle,
        color: 'text-red-600',
        bg: 'bg-red-100',
    },
    {
        id: 3,
        type: 'info',
        title: 'Weekly Bonus Unlocked',
        message: 'Great job! You completed 15 tasks this week. Your ₹500 bonus is ready.',
        time: '2 hours ago',
        icon: Gift,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
    },
    {
        id: 4,
        type: 'info',
        title: 'System Update',
        message: 'The worker portal will undergo maintenance tonight from 2 AM to 4 AM.',
        time: 'Yesterday',
        icon: Info,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
    },
];

export default function NotificationsPage() {
    return (
        <div className="min-h-screen bg-gray-50 relative pb-20">
            <FloatingBlobs />

            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <button className="p-2 hover:bg-gray-100 rounded-xl transition">
                                <ArrowLeft size={20} className="text-gray-600" />
                            </button>
                        </Link>
                        <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
                    </div>
                    <button className="text-sm font-bold text-emerald-600">Mark all read</button>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4 relative z-10">
                {NOTIFICATIONS.map((notif, i) => (
                    <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.bg} ${notif.color}`}>
                            <notif.icon size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-900 text-sm">{notif.title}</h3>
                                <span className="text-xs text-gray-400">{notif.time}</span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{notif.message}</p>
                        </div>
                    </motion.div>
                ))}

                <div className="text-center pt-8 text-gray-400 text-sm">
                    No older notifications
                </div>
            </div>
        </div>
    );
}
