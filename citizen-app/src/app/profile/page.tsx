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
    { name: 'Silver', minPoints: 200, maxPoints: 500, color: '#c0c0c0', icon: Medal },
    { name: 'Gold', minPoints: 500, maxPoints: 1000, color: '#ffd700', icon: Trophy },
    { name: 'Platinum', minPoints: 1000, maxPoints: 2500, color: '#e5e4e2', icon: Crown },
    { name: 'Diamond', minPoints: 2500, maxPoints: Infinity, color: '#b9f2ff', icon: Sparkles },
];

// Animated counter component
const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = value;
        const incrementTime = (duration * 1000) / end;

        if (end === 0) return;

        const timer = setInterval(() => {
            start += 1;
            setCount(start);
            if (start >= end) clearInterval(timer);
        }, Math.max(incrementTime, 10));

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
};

export default function ProfilePage() {
    const router = useRouter();
    const { user, isAuthenticated, initializeAuth, fetchUserReports, userReports, reports } = useAppStore();
    const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity'>('overview');

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetchUserReports();
        }
    }, [isAuthenticated, user]);

    const handleLogout = async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        useAppStore.setState({ user: null, isAuthenticated: false });
        router.push('/login');
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

    // Get user's reports from the global reports
    const myReports = reports.filter(r => r.reporterId === user?.id).slice(0, 5);

    // Show login prompt if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Animated background blobs */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{ x: [0, -100, 0], y: [0, 100, 0] }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center max-w-md w-full border border-white/20 relative z-10"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
                    >
                        <User size={42} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome to EnviroLink</h1>
                    <p className="text-gray-300 mb-8">Sign in to view your profile, track reports, and earn rewards.</p>
                    <div className="space-y-4">
                        <Link href="/login" className="block">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all"
                            >
                                Sign In
                            </motion.button>
                        </Link>
                        <Link href="/register" className="block">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition border border-white/20"
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
        { label: 'Reports Filed', value: user.engagement?.totalReports || 0, icon: TrendingUp, color: '#3b82f6', suffix: '' },
        { label: 'Issues Resolved', value: user.engagement?.resolvedReports || 0, icon: CheckCircle, color: '#10b981', suffix: '' },
        {
            label: 'Success Rate',
            value: user.engagement?.totalReports ? Math.round((user.engagement.resolvedReports / user.engagement.totalReports) * 100) : 0,
            icon: Award,
            color: '#8b5cf6',
            suffix: '%'
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-emerald-900/50 to-gray-900 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ x: [0, 50, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-20 right-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, -50, 0], y: [0, 50, 0] }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-40 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -40, 0] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
                />
            </div>

            {/* Header gradient */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/30 to-transparent h-80" />

                {/* Decorative grid */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '50px 50px'
                }} />
            </div>

            <div className="max-w-5xl mx-auto px-4 pt-8 pb-20 relative z-10">
                {/* Profile Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 mb-6 border border-white/20 shadow-2xl"
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
                                        className="w-28 h-28 rounded-3xl object-cover shadow-lg ring-4 ring-emerald-500/30"
                                    />
                                ) : (
                                    <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-emerald-500/30">
                                        {user.profile?.firstName?.[0] || 'U'}{user.profile?.lastName?.[0] || ''}
                                    </div>
                                )}
                            </motion.div>

                            {/* Level badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.3 }}
                                className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: currentLevel.color }}
                            >
                                <currentLevel.icon size={24} className="text-white" />
                            </motion.div>

                            <button className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition border border-white/20">
                                <Camera size={14} className="text-white" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                                <div>
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-3xl font-bold text-white mb-1"
                                    >
                                        {user.profile?.firstName || 'User'} {user.profile?.lastName || ''}
                                    </motion.h1>
                                    <p className="text-gray-300 mb-3">{user.email}</p>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <span
                                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg"
                                            style={{ backgroundColor: `${currentLevel.color}30`, color: currentLevel.color, border: `1px solid ${currentLevel.color}50` }}
                                        >
                                            <currentLevel.icon size={16} />
                                            {currentLevel.name} Level
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-bold border border-emerald-500/30">
                                            <Award size={16} />
                                            {user.engagement?.rank || 'New Reporter'}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl transition text-red-400 font-medium border border-red-500/30"
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
                            className="mt-6 pt-6 border-t border-white/10"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-gray-400">Progress to {nextLevel.name}</span>
                                <span className="text-sm font-bold text-white">{userPoints} / {nextLevel.minPoints} pts</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${levelProgress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full rounded-full"
                                    style={{ background: `linear-gradient(90deg, ${currentLevel.color}, ${nextLevel.color})` }}
                                />
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
                            className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 hover:border-white/30 transition-all group"
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${stat.color}20` }}
                            >
                                <stat.icon size={24} style={{ color: stat.color }} />
                            </div>
                            <p className="text-3xl font-bold text-white mb-1">
                                <AnimatedCounter value={stat.value} />
                                {stat.suffix}
                            </p>
                            <p className="text-sm text-gray-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
                    {(['overview', 'achievements', 'activity'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${activeTab === tab
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Activity size={24} className="text-emerald-400" />
                                        Your Recent Reports
                                    </h2>
                                    <Link href="/home" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
                                        View All <ChevronRight size={16} />
                                    </Link>
                                </div>

                                {myReports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="w-20 h-20 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center"
                                        >
                                            <MapPin size={32} className="text-emerald-400" />
                                        </motion.div>
                                        <p className="text-gray-400 mb-4">No reports yet. Start making a difference!</p>
                                        <Link href="/report">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30"
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
                                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                                        <MapPin size={20} className="text-emerald-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{report.reportId}</p>
                                                        <p className="text-sm text-gray-400">
                                                            {report.category?.replace(/_/g, ' ')} • {report.location?.locality || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${report.status === 'resolved' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                                            report.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                                        }`}>
                                                        {report.status?.replace(/_/g, ' ')}
                                                    </span>
                                                    <ChevronRight size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Environmental Impact */}
                            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                                    <Leaf size={24} className="text-emerald-400" />
                                    Your Environmental Impact
                                </h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-emerald-400">
                                            <AnimatedCounter value={(user.engagement?.totalReports || 0) * 5} />kg
                                        </p>
                                        <p className="text-sm text-gray-300">Waste Reported</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-teal-400">
                                            <AnimatedCounter value={Math.round((user.engagement?.resolvedReports || 0) * 0.5)} />
                                        </p>
                                        <p className="text-sm text-gray-300">Trees Saved Equivalent</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-3xl font-bold text-cyan-400">
                                            <AnimatedCounter value={(user.engagement?.resolvedReports || 0) * 2} />kg
                                        </p>
                                        <p className="text-sm text-gray-300">CO₂ Prevented</p>
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
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <Trophy size={24} className="text-yellow-400" />
                                Achievements
                                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
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
                                                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                                                    : 'bg-white/5 border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-14 h-14 rounded-xl flex items-center justify-center ${isEarned ? 'shadow-lg' : 'opacity-50'
                                                        }`}
                                                    style={{ backgroundColor: isEarned ? `${achievement.color}30` : 'rgba(255,255,255,0.1)' }}
                                                >
                                                    <achievement.icon size={28} style={{ color: isEarned ? achievement.color : '#6b7280' }} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className={`font-bold ${isEarned ? 'text-white' : 'text-gray-400'}`}>
                                                            {achievement.name}
                                                        </h3>
                                                        <span className={`text-sm font-bold ${isEarned ? 'text-yellow-400' : 'text-gray-500'}`}>
                                                            +{achievement.points} pts
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                                                    {!isEarned && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progress}%` }}
                                                                    className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full"
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500">{totalReports}/{achievement.requirement}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {isEarned && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center"
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
                            className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
                        >
                            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                                <Clock size={24} className="text-blue-400" />
                                Recent Activity
                            </h2>

                            {myReports.length === 0 ? (
                                <div className="text-center py-12">
                                    <Calendar size={48} className="mx-auto mb-4 text-gray-500" />
                                    <p className="text-gray-400">No activity yet</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-transparent" />

                                    <div className="space-y-6">
                                        {myReports.map((report, i) => (
                                            <motion.div
                                                key={report.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex gap-4 relative"
                                            >
                                                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center z-10 shadow-lg shadow-emerald-500/30">
                                                    <MapPin size={20} className="text-white" />
                                                </div>
                                                <div className="flex-1 bg-white/5 rounded-xl p-4 border border-white/10">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="font-semibold text-white">Reported {report.category?.replace(/_/g, ' ')}</p>
                                                        <span className="text-xs text-gray-500">
                                                            {new Date(report.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-400">{report.location?.address || 'Unknown location'}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Gift size={14} className="text-yellow-400" />
                                                        <span className="text-xs text-yellow-400 font-bold">+50 points earned</span>
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
                    className="mt-6 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20"
                >
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                        <Bell size={24} className="text-gray-400" />
                        Settings
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-gray-400" />
                                <div>
                                    <p className="font-medium text-white">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Get notified about report updates</p>
                                </div>
                            </div>
                            <button className="w-14 h-7 bg-emerald-500 rounded-full relative transition-all">
                                <motion.div
                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ right: 4 }}
                                />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-gray-400" />
                                <div>
                                    <p className="font-medium text-white">Email Updates</p>
                                    <p className="text-sm text-gray-500">Weekly summary of your activity</p>
                                </div>
                            </div>
                            <button className="w-14 h-7 bg-emerald-500 rounded-full relative transition-all">
                                <motion.div
                                    className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ right: 4 }}
                                />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
