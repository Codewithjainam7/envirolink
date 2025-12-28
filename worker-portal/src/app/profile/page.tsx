'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Camera, Save, Bell,
    Shield, LogOut, ChevronRight, Star, Award, Loader2
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface WorkerProfile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    zone: string;
    status: string;
    created_at: string;
}

export default function WorkerProfilePage() {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [worker, setWorker] = useState<WorkerProfile | null>(null);
    const [stats, setStats] = useState({ totalTasks: 0, completedTasks: 0, rating: 4.8, totalEarnings: 0 });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch worker profile
            const { data: workerData, error } = await supabase
                .from('workers')
                .select('*')
                .eq('email', user.email)
                .single();

            if (error || !workerData) {
                router.push('/login');
                return;
            }

            setWorker(workerData);

            // Fetch stats
            const { count: totalTasks } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_worker_id', workerData.id);

            const { count: completedTasks } = await supabase
                .from('reports')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_worker_id', workerData.id)
                .eq('status', 'resolved');

            // Calculate earnings
            const { data: resolvedTasks } = await supabase
                .from('reports')
                .select('severity')
                .eq('assigned_worker_id', workerData.id)
                .eq('status', 'resolved');

            let totalEarnings = 0;
            (resolvedTasks || []).forEach(task => {
                totalEarnings += task.severity === 'critical' ? 200 : task.severity === 'high' ? 150 : 100;
            });

            setStats({
                totalTasks: totalTasks || 0,
                completedTasks: completedTasks || 0,
                rating: 4.8,
                totalEarnings
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!worker) return;
        setSaving(true);
        try {
            await supabase
                .from('workers')
                .update({
                    phone: worker.phone,
                    zone: worker.zone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', worker.id);

            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        if (confirm('Are you sure you want to log out?')) {
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!worker) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            <FloatingBlobs />

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 pb-24 pt-8 px-6 rounded-b-[40px] shadow-xl relative z-10">
                <div className="flex justify-between items-center text-white mb-6">
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <button
                        onClick={() => router.push('/notifications')}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition"
                    >
                        <Bell size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4 text-white">
                    <div className="relative">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                            {worker.first_name[0]}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 p-1.5 rounded-lg border-2 border-emerald-600 text-emerald-900">
                            <Star size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{worker.first_name} {worker.last_name}</h2>
                        <p className="text-emerald-100 text-sm">WK-{worker.id.slice(0, 5).toUpperCase()} • {worker.zone || 'Zone --'}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 -mt-12 relative z-10 space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                            <Award size={20} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.completedTasks}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tasks Done</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <Star size={20} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.rating}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Rating</span>
                    </motion.div>
                </div>

                {/* Earnings Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 rounded-2xl text-white"
                >
                    <p className="text-emerald-100 text-xs font-bold uppercase mb-1">Total Earnings</p>
                    <p className="text-3xl font-extrabold">₹{stats.totalEarnings.toLocaleString()}</p>
                </motion.div>

                {/* Personal Info Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Personal Details</h3>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={saving}
                            className="text-sm font-bold text-emerald-600 hover:underline disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                                <p className="font-medium text-gray-900">{worker.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Phone</p>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={worker.phone || ''}
                                        onChange={(e) => setWorker({ ...worker, phone: e.target.value })}
                                        className="w-full font-medium text-gray-900 border-b-2 border-emerald-500 outline-none"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900">{worker.phone || 'Not provided'}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <MapPin size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Zone</p>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={worker.zone || ''}
                                        onChange={(e) => setWorker({ ...worker, zone: e.target.value })}
                                        className="w-full font-medium text-gray-900 border-b-2 border-emerald-500 outline-none"
                                    />
                                ) : (
                                    <p className="font-medium text-gray-900">{worker.zone || 'Not assigned'}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <User size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Member Since</p>
                                <p className="font-medium text-gray-900">{formatDate(worker.created_at)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Links */}
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                    <button
                        onClick={() => alert('Privacy settings coming soon!')}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Shield size={18} /></div>
                            <span className="font-bold text-gray-700">Privacy & Security</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 text-red-600 p-2 rounded-lg"><LogOut size={18} /></div>
                            <span className="font-bold text-red-600">Log Out</span>
                        </div>
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
