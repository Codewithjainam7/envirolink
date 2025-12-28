'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Gift, AlertTriangle, CheckCircle, Info, Loader2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import FloatingBlobs from '@/components/FloatingBlobs';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    icon: any;
    color: string;
    bg: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
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

            // Fetch recently assigned tasks
            const { data: assignedTasks } = await supabase
                .from('reports')
                .select('*')
                .eq('assigned_worker_id', workerData.id)
                .order('updated_at', { ascending: false })
                .limit(10);

            // Fetch recently completed tasks
            const { data: completedTasks } = await supabase
                .from('reports')
                .select('*')
                .eq('assigned_worker_id', workerData.id)
                .eq('status', 'resolved')
                .order('updated_at', { ascending: false })
                .limit(5);

            const notifList: Notification[] = [];

            // Add completed task notifications
            (completedTasks || []).forEach(task => {
                const reward = task.severity === 'critical' ? 200 : task.severity === 'high' ? 150 : 100;
                notifList.push({
                    id: `completed-${task.id}`,
                    type: 'success',
                    title: 'Task Completed',
                    message: `You successfully completed ${task.report_id}. ₹${reward} has been credited.`,
                    time: formatTimeAgo(task.updated_at),
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bg: 'bg-green-100',
                });
            });

            // Add new assignment notifications
            (assignedTasks || []).filter(t => t.status === 'assigned').forEach(task => {
                notifList.push({
                    id: `assigned-${task.id}`,
                    type: 'alert',
                    title: `New ${task.severity === 'critical' ? 'Urgent' : task.severity === 'high' ? 'Priority' : ''} Task`,
                    message: `${task.category?.replace(/_/g, ' ')} reported at ${task.locality || 'Unknown location'}. Accept now!`,
                    time: formatTimeAgo(task.created_at),
                    icon: AlertTriangle,
                    color: task.severity === 'critical' ? 'text-red-600' : 'text-amber-600',
                    bg: task.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100',
                });
            });

            // Add in-progress notifications
            (assignedTasks || []).filter(t => t.status === 'in_progress').forEach(task => {
                notifList.push({
                    id: `progress-${task.id}`,
                    type: 'info',
                    title: 'Task In Progress',
                    message: `You're working on ${task.report_id}. Complete it to earn your reward!`,
                    time: formatTimeAgo(task.updated_at),
                    icon: ClipboardList,
                    color: 'text-blue-600',
                    bg: 'bg-blue-100',
                });
            });

            // Sort by time
            notifList.sort((a, b) => {
                const timeOrder = ['Just now', 'mins ago', 'hours ago', 'days ago', 'weeks ago'];
                const getOrder = (t: string) => timeOrder.findIndex(o => t.includes(o));
                return getOrder(a.time) - getOrder(b.time);
            });

            setNotifications(notifList);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
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
        if (diffDays < 7) return `${diffDays} days ago`;
        return `${Math.floor(diffDays / 7)} weeks ago`;
    };

    const handleMarkAllRead = () => {
        alert('All notifications marked as read');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

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
                    <button
                        onClick={handleMarkAllRead}
                        className="text-sm font-bold text-emerald-600"
                    >
                        Mark all read
                    </button>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 space-y-4 relative z-10">
                {notifications.length > 0 ? (
                    notifications.map((notif, i) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
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
                    ))
                ) : (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No Notifications</h3>
                        <p className="text-gray-500">You're all caught up! New notifications will appear here.</p>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="text-center pt-8 text-gray-400 text-sm">
                        No older notifications
                    </div>
                )}
            </div>
        </div>
    );
}
