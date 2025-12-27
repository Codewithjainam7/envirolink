'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, ChevronRight, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: 'success' | 'info' | 'warning' | 'alert';
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    reportId?: string;
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'success',
        title: 'Report Resolved',
        message: 'Your report RPT-2024-000003 at Colaba Causeway has been cleaned up successfully!',
        timestamp: '2024-12-21T11:00:00Z',
        read: false,
        reportId: 'RPT-2024-000003',
    },
    {
        id: '2',
        type: 'info',
        title: 'Status Update',
        message: 'Your report RPT-2024-000001 has been assigned to Solid Waste Management team.',
        timestamp: '2024-12-24T14:00:00Z',
        read: false,
        reportId: 'RPT-2024-000001',
    },
    {
        id: '3',
        type: 'warning',
        title: 'Work in Progress',
        message: 'Cleanup crew is now working on your report at Marine Drive.',
        timestamp: '2024-12-25T09:00:00Z',
        read: true,
        reportId: 'RPT-2024-000001',
    },
    {
        id: '4',
        type: 'alert',
        title: 'New Badge Earned!',
        message: 'Congratulations! You\'ve earned the "Community Hero" badge for 10+ resolved reports.',
        timestamp: '2024-12-20T15:00:00Z',
        read: true,
    },
    {
        id: '5',
        type: 'info',
        title: 'Weekly Summary',
        message: 'Your city cleaned up 156 waste issues this week. You contributed 3 reports!',
        timestamp: '2024-12-22T10:00:00Z',
        read: true,
    },
];

const typeConfig = {
    success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    warning: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    alert: { icon: AlertCircle, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState(mockNotifications);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const markAllRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="px-4 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell size={22} />
                            Notifications
                        </h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-gray-500">{unreadCount} unread</p>
                        )}
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            className="flex items-center gap-1 text-sm text-emerald-600 font-medium"
                        >
                            <Check size={16} />
                            Mark all read
                        </button>
                    )}
                </div>
            </header>

            {/* Notifications List */}
            <div className="px-4 py-4 space-y-3">
                {notifications.length === 0 ? (
                    <div className="text-center py-16">
                        <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            No notifications yet
                        </h3>
                        <p className="text-gray-500 text-sm">
                            We&apos;ll notify you when something happens
                        </p>
                    </div>
                ) : (
                    notifications.map((notification, index) => {
                        const config = typeConfig[notification.type];
                        const Icon = config.icon;
                        const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

                        return (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative flex gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border transition-all ${notification.read
                                        ? 'border-gray-100 dark:border-gray-800'
                                        : 'border-emerald-200 dark:border-emerald-800 shadow-sm'
                                    }`}
                            >
                                {/* Unread indicator */}
                                {!notification.read && (
                                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500" />
                                )}

                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={18} className={config.color} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className={`font-medium ${notification.read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                            {notification.title}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="text-xs text-gray-400">{timeAgo}</span>
                                        {notification.reportId && (
                                            <button className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                                                View Report
                                                <ChevronRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
