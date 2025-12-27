'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    User, Mail, Phone, Camera, Award, TrendingUp,
    CheckCircle, Star, LogOut, Settings, Bell
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getSupabase } from '@/lib/supabase';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, initializeAuth, fetchUserReports, userReports } = useAppStore();

    useEffect(() => {
        initializeAuth();
        if (isAuthenticated) {
            fetchUserReports();
        }
    }, [isAuthenticated]);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        useAppStore.setState({ user: null, isAuthenticated: false });
        router.push('/login');
    };

    // Show login prompt if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center">
                        <User size={36} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to EnviroLink</h1>
                    <p className="text-gray-500 mb-6">Sign in to view your profile, track reports, and earn rewards.</p>
                    <div className="space-y-3">
                        <Link href="/login" className="block">
                            <button className="w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition">
                                Sign In
                            </button>
                        </Link>
                        <Link href="/register" className="block">
                            <button className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition">
                                Create Account
                            </button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const stats = [
        { label: 'Points Earned', value: user.engagement?.points?.toLocaleString() || '0', icon: Star, color: '#f59e0b' },
        { label: 'Reports Filed', value: user.engagement?.totalReports || 0, icon: TrendingUp, color: '#3b82f6' },
        { label: 'Issues Resolved', value: user.engagement?.resolvedReports || 0, icon: CheckCircle, color: '#10b981' },
        {
            label: 'Success Rate',
            value: user.engagement?.totalReports ? `${Math.round((user.engagement.resolvedReports / user.engagement.totalReports) * 100)}%` : '0%',
            icon: Award,
            color: '#8b5cf6'
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-48" />

            <div className="max-w-4xl mx-auto px-4 -mt-24">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            {user.profile?.avatar ? (
                                <img
                                    src={user.profile.avatar}
                                    alt={user.profile.firstName}
                                    className="w-28 h-28 rounded-3xl object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                                    {user.profile?.firstName?.[0] || 'U'}{user.profile?.lastName?.[0] || ''}
                                </div>
                            )}
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition">
                                <Camera size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {user.profile?.firstName || 'User'} {user.profile?.lastName || ''}
                                    </h1>
                                    <p className="text-gray-500">{user.email}</p>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mt-2">
                                        <Award size={14} />
                                        {user.engagement?.rank || 'New Reporter'}
                                    </span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl transition text-red-600 font-medium"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-5 shadow-sm"
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <stat.icon size={20} style={{ color: stat.color }} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Recent Reports */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm p-6 mb-6"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Recent Reports</h2>
                    {userReports.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No reports yet. Start by reporting an issue!</p>
                    ) : (
                        <div className="space-y-3">
                            {userReports.slice(0, 5).map((report, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="font-medium text-gray-900">{report.reportId}</p>
                                        <p className="text-sm text-gray-500">{report.category} • {report.location?.locality}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                            report.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {report.status.replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm p-6 mb-8"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Get notified about report updates</p>
                                </div>
                            </div>
                            <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Email Updates</p>
                                    <p className="text-sm text-gray-500">Weekly summary of your activity</p>
                                </div>
                            </div>
                            <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
