'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    User, Mail, Camera, Award, TrendingUp, CheckCircle, Star, LogOut,
    Bell, Shield, Zap, Target, Trophy, Flame, Leaf, MapPin, Clock,
    ChevronRight, Sparkles, Crown, Medal, Gift, Calendar, Activity
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getSupabase } from '@/lib/supabase';

// Floating green blobs component (same as landing page)
function FloatingGreenBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{ x: [100, 200, 50, 100], y: [50, 150, 100, 50] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: '10%', right: '10%' }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{ x: [-50, 100, 0, -50], y: [200, 100, 300, 200] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ top: '30%', left: '-5%' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '5%', left: '40%' }}
            />
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-emerald-200/30 blur-3xl"
                animate={{ x: [0, 80, -20, 0], y: [0, 50, -30, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{ top: '5%', left: '15%' }}
            />
        </div>
    );
}

// Achievement definitions
const ACHIEVEMENTS = [
    { id: 'first_report', name: 'First Steps', description: 'Submit your first report', icon: Zap, color: '#10b981', points: 100, requirement: 1 },
    { id: 'five_reports', name: 'Active Citizen', description: 'Submit 5 reports', icon: Target, color: '#3b82f6', points: 250, requirement: 5 },
    { id: 'ten_reports', name: 'Eco Warrior', description: 'Submit 10 reports', icon: Shield, color: '#8b5cf6', points: 500, requirement: 10 },
    { id: 'twenty_reports', name: 'Environmental Champion', description: 'Submit 20 reports', icon: Trophy, color: '#f59e0b', points: 1000, requirement: 20 },
    { id: 'fifty_reports', name: 'City Guardian', description: 'Submit 50 reports', icon: Crown, color: '#ef4444', points: 2500, requirement: 50 },
];

// Level definitions
const LEVELS = [
    { name: 'Bronze', minPoints: 0, maxPoints: 200, color: '#cd7f32', icon: Medal },
    { name: 'Silver', minPoints: 200, maxPoints: 500, color: '#9ca3af', icon: Medal },
    { name: 'Gold', minPoints: 500, maxPoints: 1000, color: '#fbbf24', icon: Trophy },
    { name: 'Platinum', minPoints: 1000, maxPoints: 2500, color: '#06b6d4', icon: Crown },
    { name: 'Diamond', minPoints: 2500, maxPoints: Infinity, color: '#8b5cf6', icon: Sparkles },
];

// Animated counter component
const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (value === 0) return;
        let start = 0;
        const end = value;
        const incrementTime = Math.max((duration * 1000) / end, 10);

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= end) clearInterval(timer);
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, initializeAuth, fetchUserReports, userReports, reports } = useAppStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity'>('overview');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

    // 25 Default avatars using DiceBear API
    const DEFAULT_AVATARS = [
        // Adventurer style
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=b6e3f4',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Maya&backgroundColor=c0aede',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=d1d4f9',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sam&backgroundColor=ffd5dc',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Jordan&backgroundColor=ffdfbf',
        // Bottts (robots)
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot1&backgroundColor=b6e3f4',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot2&backgroundColor=c0aede',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot3&backgroundColor=10b981',
        'https://api.dicebear.com/7.x/bottts/svg?seed=Robot4&backgroundColor=059669',
        // Fun emoji
        'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy&backgroundColor=d1d4f9',
        'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cool&backgroundColor=ffd5dc',
        'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Love&backgroundColor=10b981',
        'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Star&backgroundColor=34d399',
        // Thumbs
        'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumbs&backgroundColor=ffdfbf',
        'https://api.dicebear.com/7.x/thumbs/svg?seed=Green&backgroundColor=6ee7b7',
        // Lorelei (realistic)
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Aria&backgroundColor=b6e3f4',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Max&backgroundColor=c0aede',
        'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe&backgroundColor=34d399',
        // Personas
        'https://api.dicebear.com/7.x/personas/svg?seed=Nature&backgroundColor=10b981',
        'https://api.dicebear.com/7.x/personas/svg?seed=Earth&backgroundColor=059669',
        // Avataaars
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Eco&backgroundColor=6ee7b7',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Green&backgroundColor=34d399',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Nature&backgroundColor=10b981',
        // Big smile
        'https://api.dicebear.com/7.x/big-smile/svg?seed=Happy&backgroundColor=6ee7b7',
        'https://api.dicebear.com/7.x/big-smile/svg?seed=Eco&backgroundColor=34d399',
    ];

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserReports();
            setSelectedAvatar(user.profile?.avatar || null);
        }
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
            useAppStore.setState({ user: null, isAuthenticated: false, userReports: [], reports: [] });
            // Clear any cached session data
            if (typeof window !== 'undefined') {
                localStorage.removeItem('supabase.auth.token');
                sessionStorage.clear();
            }
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if signOut fails
            useAppStore.setState({ user: null, isAuthenticated: false });
            router.push('/login');
        }
    };

    const handleAvatarSelect = async (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
        // Update in database
        try {
            const supabase = getSupabase();
            await (supabase.from('profiles') as any).update({ avatar_url: avatarUrl }).eq('id', user?.id);
            // Update local state
            if (user) {
                useAppStore.setState({
                    user: {
                        ...user,
                        profile: { ...user.profile, avatar: avatarUrl }
                    }
                });
            }
            setShowAvatarPicker(false);
        } catch (error) {
            console.error('Failed to update avatar:', error);
        }
    };

    // Get user's level
    const userPoints = user?.engagement?.points || 0;
    const currentLevel = LEVELS.find(l => userPoints >= l.minPoints && userPoints < l.maxPoints) || LEVELS[0];
    const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
    const levelProgress = nextLevel
        ? ((userPoints - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints)) * 100
        : 100;

    // Get earned achievements
    const totalReports = user?.engagement?.totalReports || 0;
    const earnedAchievements = ACHIEVEMENTS.filter(a => totalReports >= a.requirement);

    // Get user's reports - use userReports directly since fetchUserReports populates it
    const myReports = userReports.slice(0, 5);

    // Show login prompt if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white flex items-center justify-center p-4 relative overflow-hidden">
                <FloatingGreenBlobs />
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center max-w-md w-full border border-emerald-100 relative z-10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200"
                    >
                        <User size={42} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to EnviroLink</h1>
                    <p className="text-gray-500 mb-8">Sign in to view your profile, track reports, and earn rewards.</p>
                    <div className="space-y-4">
                        <Link href="/login" className="block">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                        <Link href="/register" className="block">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gray-50 text-gray-700 font-semibold rounded-2xl hover:bg-gray-100 transition border border-gray-200"
                            >
                                Create Account
                            </motion.button>
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    const stats = [
        { label: 'Points Earned', value: userPoints, icon: Star, color: '#f59e0b', suffix: '' },
        { label: 'Reports Filed', value: user.engagement?.totalReports || 0, icon: TrendingUp, color: '#10b981', suffix: '' },
        { label: 'Issues Resolved', value: user.engagement?.resolvedReports || 0, icon: CheckCircle, color: '#3b82f6', suffix: '' },
        {
            label: 'Success Rate',
            value: user.engagement?.totalReports ? Math.round((user.engagement.resolvedReports / user.engagement.totalReports) * 100) : 0,
            icon: Award,
            color: '#8b5cf6',
            suffix: '%'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-emerald-50/30 to-white relative overflow-hidden">
            <FloatingGreenBlobs />

            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-48" />

            <div className="max-w-5xl mx-auto px-4 -mt-24 pb-20 relative z-10">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-6 border border-emerald-100 shadow-xl"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar with level badge */}
                        <div className="relative">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                            >
                                {user.profile?.avatar ? (
                                    <img
                                        src={user.profile.avatar}
                                        alt={user.profile.firstName}
                                        className="w-28 h-28 rounded-3xl object-cover shadow-lg ring-4 ring-emerald-100"
                                    />
                                ) : (
                                    <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-emerald-100">
                                        {user.profile?.firstName?.[0] || 'U'}{user.profile?.lastName?.[0] || ''}
                                    </div>
                                )}
                            </motion.div>

                            {/* Level badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                                style={{ backgroundColor: currentLevel.color }}
                            >
                                <currentLevel.icon size={24} className="text-white" />
                            </motion.div>

                            <button
                                onClick={() => setShowAvatarPicker(true)}
                                className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-emerald-50 hover:scale-110 transition-all border border-gray-200 shadow-sm"
                            >
                                <Camera size={14} className="text-emerald-600" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-3xl font-bold text-gray-900 mb-1"
                                    >
                                        {user.profile?.firstName || 'User'} {user.profile?.lastName || ''}
                                    </motion.h1>
                                    <p className="text-gray-500 mb-3">{user.email}</p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm"
                                            style={{ backgroundColor: `${currentLevel.color}15`, color: currentLevel.color, border: `1px solid ${currentLevel.color}30` }}
                                        >
                                            <currentLevel.icon size={16} />
                                            {currentLevel.name} Level
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-200">
                                            <Award size={16} />
                                            {user.engagement?.rank || 'New Reporter'}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl transition text-red-600 font-medium border border-red-200"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Level Progress Bar */}
                    {nextLevel && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 pt-6 border-t border-gray-100"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-500 font-medium">Progress to {nextLevel.name}</span>
                                <span className="text-sm font-bold text-gray-900">{userPoints} / {nextLevel.minPoints} pts</span>
                            </div>
                            <div className="h-4 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full overflow-hidden shadow-inner relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(levelProgress, 100)}%` }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                    className="h-full rounded-full relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)',
                                        backgroundSize: '200% 100%',
                                        boxShadow: '0 0 20px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                                    }}
                                >
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                    {/* Glow pulse */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/30 to-emerald-400/0"
                                        animate={{ x: ['-100%', '200%'] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    />
                                </motion.div>
                                {/* Progress indicator dot */}
                                {levelProgress > 0 && (
                                    <motion.div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-emerald-400"
                                        style={{ left: `calc(${Math.min(levelProgress, 100)}% - 6px)` }}
                                        animate={{ scale: [1, 1.2, 1], boxShadow: ['0 0 0 0 rgba(16,185,129,0.4)', '0 0 0 8px rgba(16,185,129,0)', '0 0 0 0 rgba(16,185,129,0)'] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + i * 0.1 }}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="bg-white/90 backdrop-blur-xl rounded-2xl p-5 border border-emerald-100 shadow-lg hover:shadow-xl transition-all group"
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <stat.icon size={24} style={{ color: stat.color }} />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">
                                <AnimatedCounter value={stat.value} />
                                {stat.suffix}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 bg-white/50 p-1.5 rounded-2xl backdrop-blur-sm border border-emerald-100 shadow-sm">
                    {(['overview', 'achievements', 'activity'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === tab
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-white'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Recent Reports */}
                            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <Activity size={24} className="text-emerald-500" />
                                        Your Recent Reports
                                    </h2>
                                    <Link href="/home" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-1">
                                        View All <ChevronRight size={16} />
                                    </Link>
                                </div>

                                {myReports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-20 h-20 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center"
                                        >
                                            <MapPin size={32} className="text-emerald-500" />
                                        </motion.div>
                                        <p className="text-gray-500 mb-4">No reports yet. Start making a difference!</p>
                                        <Link href="/report">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-200"
                                            >
                                                Report an Issue
                                            </motion.button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {myReports.map((report, i) => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-emerald-50/50 transition-all border border-gray-100 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                                        <MapPin size={20} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{report.reportId}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {report.category?.replace(/_/g, ' ')} • {report.location?.locality || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${report.status === 'resolved' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                        report.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                            'bg-amber-100 text-amber-700 border border-amber-200'
                                                        }`}>
                                                        {report.status?.replace(/_/g, ' ')}
                                                    </span>
                                                    <ChevronRight size={20} className="text-gray-300 group-hover:text-emerald-500 transition-colors" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Environmental Impact */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-xl rounded-3xl p-6 border border-emerald-200 shadow-lg">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                                    <Leaf size={24} className="text-emerald-600" />
                                    Your Environmental Impact
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center bg-white/60 rounded-2xl p-4">
                                        <p className="text-3xl font-bold text-emerald-600">
                                            <AnimatedCounter value={(user.engagement?.totalReports || 0) * 5} />kg
                                        </p>
                                        <p className="text-sm text-gray-600 font-medium">Waste Reported</p>
                                    </div>
                                    <div className="text-center bg-white/60 rounded-2xl p-4">
                                        <p className="text-3xl font-bold text-teal-600">
                                            <AnimatedCounter value={Math.round((user.engagement?.resolvedReports || 0) * 0.5)} />
                                        </p>
                                        <p className="text-sm text-gray-600 font-medium">Trees Saved</p>
                                    </div>
                                    <div className="text-center bg-white/60 rounded-2xl p-4">
                                        <p className="text-3xl font-bold text-cyan-600">
                                            <AnimatedCounter value={(user.engagement?.resolvedReports || 0) * 2} />kg
                                        </p>
                                        <p className="text-sm text-gray-600 font-medium">CO₂ Prevented</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'achievements' && (
                        <motion.div
                            key="achievements"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-lg"
                        >
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <Trophy size={24} className="text-amber-500" />
                                Achievements
                                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-sm border border-amber-200">
                                    {earnedAchievements.length}/{ACHIEVEMENTS.length}
                                </span>
                            </h2>

                            <div className="grid gap-4">
                                {ACHIEVEMENTS.map((achievement, i) => {
                                    const isEarned = totalReports >= achievement.requirement;
                                    const progress = Math.min((totalReports / achievement.requirement) * 100, 100);

                                    return (
                                        <motion.div
                                            key={achievement.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`p-4 rounded-2xl border transition-all ${isEarned
                                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
                                                : 'bg-gray-50 border-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${isEarned ? 'shadow-lg' : 'opacity-50'
                                                        }`}
                                                    style={{ backgroundColor: isEarned ? `${achievement.color}20` : '#f3f4f6' }}
                                                >
                                                    <achievement.icon size={28} style={{ color: isEarned ? achievement.color : '#9ca3af' }} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-bold ${isEarned ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {achievement.name}
                                                        </h3>
                                                        <span className={`text-sm font-bold ${isEarned ? 'text-amber-600' : 'text-gray-400'}`}>
                                                            +{achievement.points} pts
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-2">{achievement.description}</p>
                                                    {!isEarned && (
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden shadow-inner relative">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                                    className="h-full rounded-full relative overflow-hidden"
                                                                    style={{
                                                                        background: `linear-gradient(90deg, ${achievement.color}90, ${achievement.color})`,
                                                                        boxShadow: `0 0 10px ${achievement.color}50`
                                                                    }}
                                                                >
                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                                                </motion.div>
                                                                {progress > 0 && (
                                                                    <motion.div
                                                                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-lg"
                                                                        style={{ left: `calc(${progress}% - 4px)` }}
                                                                        animate={{ scale: [1, 1.2, 1] }}
                                                                        transition={{ duration: 1.5, repeat: Infinity }}
                                                                    />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold px-2 py-1 rounded-full bg-gray-100" style={{ color: achievement.color }}>
                                                                {totalReports}/{achievement.requirement}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEarned && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                                                    >
                                                        <CheckCircle size={20} className="text-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'activity' && (
                        <motion.div
                            key="activity"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-lg"
                        >
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <Clock size={24} className="text-blue-500" />
                                Recent Activity
                            </h2>

                            {myReports.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-400">No activity yet</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-400 to-transparent" />

                                    <div className="space-y-6">
                                        {myReports.map((report, i) => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex gap-4 relative"
                                            >
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center z-10 shadow-lg shadow-emerald-200">
                                                    <MapPin size={20} className="text-white" />
                                                </div>
                                                <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-gray-900">Reported {report.category?.replace(/_/g, ' ')}</p>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(report.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">{report.location?.address || 'Unknown location'}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Gift size={14} className="text-amber-500" />
                                                        <span className="text-xs text-amber-600 font-bold">+50 points earned</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 bg-white/90 backdrop-blur-xl rounded-3xl p-6 border border-emerald-100 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <Bell size={24} className="text-gray-500" />
                        Settings
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Get notified about report updates</p>
                                </div>
                            </div>
                            <button className="w-14 h-7 bg-emerald-500 rounded-full relative transition-all shadow-inner">
                                <motion.div
                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ right: 4 }}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Email Updates</p>
                                    <p className="text-sm text-gray-500">Weekly summary of your activity</p>
                                </div>
                            </div>
                            <button className="w-14 h-7 bg-emerald-500 rounded-full relative transition-all shadow-inner">
                                <motion.div
                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ right: 4 }}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Avatar Picker Modal */}
            <AnimatePresence>
                {showAvatarPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowAvatarPicker(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">Choose Your Avatar</h3>
                            <p className="text-gray-500 text-center mb-6">Select from our collection of unique avatars</p>

                            <div className="grid grid-cols-5 gap-3 mb-6">
                                {DEFAULT_AVATARS.map((avatar, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleAvatarSelect(avatar)}
                                        className={`w-14 h-14 rounded-2xl overflow-hidden border-3 transition-all ${selectedAvatar === avatar
                                            ? 'border-emerald-500 ring-4 ring-emerald-200'
                                            : 'border-gray-200 hover:border-emerald-300'
                                            }`}
                                    >
                                        <img src={avatar} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                                    </motion.button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAvatarPicker(false)}
                                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
