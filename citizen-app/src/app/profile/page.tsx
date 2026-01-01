'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, Shield } from 'lucide-react';
import { useAppStore } from '@/store';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, initializeAuth, fetchUserReports, refreshProfile } = useAppStore();

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            refreshProfile();
        }
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        try {
            await useAppStore.getState().logout();
            router.replace('/home');
            toast.success('Logged out');
            window.location.href = '/home';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    if (!user) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    const userPoints = user.engagement?.points || 0;

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto relative z-10">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
                >
                    <div className="h-32 bg-gradient-to-r from-emerald-400 to-cyan-500"></div>

                    <div className="px-8 pb-8">
                        <div className="relative -mt-16 mb-6 flex justify-center">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white overflow-hidden">
                                {user.profile?.avatar ? (
                                    <img
                                        src={user.profile.avatar}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                {user.profile?.firstName || 'User'} {user.profile?.lastName || ''}
                            </h1>
                            <p className="text-gray-500 mb-4">{user.email}</p>

                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full font-bold border border-emerald-100">
                                <Shield size={18} />
                                <span>{userPoints} Points</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-colors border border-red-100"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </motion.div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    Simplified View • Advanced stats temporarily hidden
                </p>
            </div>
        </div>
    );
}
