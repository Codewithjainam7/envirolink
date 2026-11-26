'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    LogOut, User, Shield, FileText, Plus, Search,
    RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2, Pencil, Check, X
} from 'lucide-react';
import { useAppStore } from '@/store';
import { toast } from 'react-hot-toast';
import { ReportCard, ReportDetailModal, FloatingBlobs } from '@/components';

export default function ProfilePage() {
    const router = useRouter();
    const {
        user,
        isAuthenticated,
        isAuthChecked,
        initializeAuth,
        userReports,
        fetchUserReports,
        trackReport,
        deleteReport,
        updateProfileName,
        refreshProfile,
        selectedReport,
        setSelectedReport
    } = useAppStore();

    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
    const [isTracking, setIsTracking] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [firstNameInput, setFirstNameInput] = useState('');
    const [lastNameInput, setLastNameInput] = useState('');
    const [isSavingName, setIsSavingName] = useState(false);

    useEffect(() => {
        setMounted(true);
        initializeAuth();

        // Safety net: ensure auth gate never stays stuck indefinitely on slow mobile/WebView loads
        const safetyTimer = setTimeout(() => {
            if (!useAppStore.getState().isAuthChecked) {
                useAppStore.setState({ isAuthChecked: true });
            }
        }, 4000);

        return () => clearTimeout(safetyTimer);
    }, [initializeAuth]);

    // Protect Profile: redirect to login if not signed in
    useEffect(() => {
        if (mounted && isAuthChecked && !isAuthenticated) {
            router.replace('/login?next=/profile');
        }
    }, [mounted, isAuthChecked, isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && user) {
            refreshProfile();
            fetchUserReports();
        }
    }, [isAuthenticated, user?.id, refreshProfile, fetchUserReports]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchUserReports();
        setIsRefreshing(false);
        toast.success('Reports refreshed');
    };

    const handleTrackLookup = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const query = searchQuery.trim();
        if (!query) return;

        setIsTracking(true);
        const found = await trackReport(query);
        setIsTracking(false);

        if (found) {
            toast.success(`Found report ${found.reportId}`);
            setSelectedReport(found);
        } else {
            toast.error('No report found with that ID');
        }
    };

    const handleDeleteReport = async (report: typeof userReports[number]) => {
        if (!confirm(`Delete report ${report.reportId}? This action cannot be undone.`)) {
            return;
        }
        await deleteReport(report);
    };

    const startEditingName = () => {
        setFirstNameInput(user?.profile?.firstName || '');
        setLastNameInput(user?.profile?.lastName || '');
        setIsEditingName(true);
    };

    const handleSaveName = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSavingName(true);
        const ok = await updateProfileName(firstNameInput, lastNameInput);
        setIsSavingName(false);
        if (ok) {
            setIsEditingName(false);
        }
    };

    const handleLogout = async () => {
        try {
            await useAppStore.getState().logout();
            toast.success('Logged out');
            router.replace('/home');
            window.location.href = '/home';
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    // Never render Profile UI before auth check completes and user is confirmed signed in
    if (!mounted || !isAuthChecked || !isAuthenticated || !user) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-gray-500 px-4 text-center">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <p className="text-sm font-medium">
                    {isAuthChecked && !isAuthenticated ? 'Redirecting to sign in...' : 'Loading profile...'}
                </p>
                {isAuthChecked && !isAuthenticated && (
                    <Link
                        href="/login?next=/profile"
                        className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
                    >
                        Continue to Sign In
                    </Link>
                )}
            </div>
        );
    }

    const points = user.engagement?.points ?? 0;
    const trustScore = user.engagement?.trustScore ?? 100;
    const totalCount = userReports.length;
    const openCount = userReports.filter(r => r.status === 'submitted' || r.status === 'under_review').length;
    const inProgressCount = userReports.filter(r => r.status === 'assigned' || r.status === 'in_progress').length;
    const resolvedCount = userReports.filter(r => r.status === 'resolved' || r.status === 'closed').length;

    const filteredReports = userReports.filter(r => {
        const matchesTab =
            activeTab === 'all' ||
            (activeTab === 'open' && (r.status === 'submitted' || r.status === 'under_review')) ||
            (activeTab === 'in_progress' && (r.status === 'assigned' || r.status === 'in_progress')) ||
            (activeTab === 'resolved' && (r.status === 'resolved' || r.status === 'closed'));

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
            q === '' ||
            r.reportId?.toLowerCase().includes(q) ||
            r.location?.address?.toLowerCase().includes(q) ||
            (r.location?.locality?.toLowerCase().includes(q) ?? false) ||
            (r.description?.toLowerCase().includes(q) ?? false) ||
            r.category?.toLowerCase().includes(q);

        return matchesTab && matchesSearch;
    });

    const looksLikeReportId = /^(r|rpt)-?[a-z0-9-]+$/i.test(searchQuery.trim());

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-gray-50 relative pb-24">
            <FloatingBlobs />

            {/* Clean Translucent Profile Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 relative z-10">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                    >
                        {/* Left: Citizen Identity */}
                        <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-emerald-200 bg-emerald-50 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                                {user.profile?.avatar ? (
                                    <img
                                        src={user.profile.avatar}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User size={34} className="text-emerald-600" />
                                )}
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                    {isEditingName ? (
                                        <form onSubmit={handleSaveName} className="flex items-center gap-2 flex-wrap">
                                            <input
                                                type="text"
                                                value={firstNameInput}
                                                onChange={(e) => setFirstNameInput(e.target.value)}
                                                placeholder="First name"
                                                required
                                                className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 w-32 sm:w-36"
                                            />
                                            <input
                                                type="text"
                                                value={lastNameInput}
                                                onChange={(e) => setLastNameInput(e.target.value)}
                                                placeholder="Last name"
                                                className="px-3 py-1.5 text-sm font-semibold text-gray-900 bg-white border-2 border-emerald-300 rounded-xl focus:outline-none focus:border-emerald-500 w-32 sm:w-36"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSavingName}
                                                title="Save Name"
                                                className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                                            >
                                                {isSavingName ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isSavingName}
                                                onClick={() => setIsEditingName(false)}
                                                title="Cancel"
                                                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                                            >
                                                <X size={15} />
                                            </button>
                                        </form>
                                    ) : (
                                        <>
                                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                                                {`${user.profile?.firstName || 'User'} ${user.profile?.lastName || ''}`.trim()}
                                            </h1>
                                            <button
                                                type="button"
                                                onClick={startEditingName}
                                                title="Edit Name"
                                                aria-label="Edit Name"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </>
                                    )}
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                                        <Shield size={13} />
                                        {points} pts
                                    </span>
                                    <span
                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                            trustScore >= 70
                                                ? 'bg-teal-100 text-teal-700'
                                                : trustScore >= 40
                                                ? 'bg-amber-100 text-amber-700'
                                                : 'bg-red-100 text-red-700'
                                        }`}
                                        title="Civic Trust Score increases (+5) when reports are verified & resolved, and drops (-25) for false reports"
                                    >
                                        Trust: {trustScore}/100
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 truncate">
                                    {user.email} · <span className="text-emerald-600 font-medium">{user.engagement?.rank || 'New Reporter'}</span>
                                </p>
                            </div>
                        </div>

                        {/* Right: Minimal Stats + Logout */}
                        <div className="flex items-center justify-between md:justify-end gap-6 sm:gap-8">
                            <div className="flex items-center gap-5 sm:gap-7">
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalCount}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <FileText size={12} className="text-emerald-500" /> Filed
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-amber-500">{openCount + inProgressCount}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock size={12} className="text-amber-500" /> Active
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">{resolvedCount}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <CheckCircle2 size={12} className="text-emerald-500" /> Resolved
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition-colors"
                            >
                                <LogOut size={16} />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* My Reports Section inside Profile */}
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-10 relative z-10">
                {/* Section Header & Unified Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                            <FileText size={24} className="text-emerald-500" />
                            My Reports
                        </h2>
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Refresh reports"
                        >
                            <RefreshCw size={17} className={isRefreshing ? 'animate-spin text-emerald-600' : ''} />
                        </button>
                    </div>

                    {/* Unified Search & Track Bar */}
                    <form onSubmit={handleTrackLookup} className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search or enter Report ID (R-...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border-2 border-gray-200 focus:border-emerald-500 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors"
                            />
                        </div>
                        {(looksLikeReportId || (searchQuery.trim() && filteredReports.length === 0)) && (
                            <button
                                type="submit"
                                disabled={isTracking}
                                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap disabled:opacity-50"
                            >
                                {isTracking ? 'Tracking...' : 'Track ID'}
                            </button>
                        )}
                    </form>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { key: 'all', label: 'All Reports', count: totalCount },
                        { key: 'open', label: 'Open', count: openCount },
                        { key: 'in_progress', label: 'In Progress', count: inProgressCount },
                        { key: 'resolved', label: 'Resolved', count: resolvedCount },
                    ].map((filter) => (
                        <button
                            key={filter.key}
                            onClick={() => setActiveTab(filter.key as typeof activeTab)}
                            className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border-2 ${
                                activeTab === filter.key
                                    ? 'bg-emerald-500 text-white border-emerald-500'
                                    : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                            }`}
                        >
                            {filter.label}
                            <span className="ml-1.5 opacity-75">({filter.count})</span>
                        </button>
                    ))}
                </div>

                {/* Reports Grid or Clean Empty State */}
                {filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredReports.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report}
                                onClick={() => setSelectedReport(report)}
                                onDelete={handleDeleteReport}
                            />
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl border-2 border-emerald-100 p-10 text-center max-w-md mx-auto mt-10"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                            {searchQuery ? <AlertCircle size={32} /> : <FileText size={32} />}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                            {searchQuery ? 'No matching reports' : 'No reports filed yet'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {searchQuery
                                ? 'Try clearing your search or click "Track ID" to look up a report by its code.'
                                : 'Reports you submit appear right here so you can track cleanup progress.'}
                        </p>

                        {searchQuery ? (
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors"
                                >
                                    Clear Search
                                </button>
                                <button
                                    onClick={() => handleTrackLookup()}
                                    disabled={isTracking}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-colors"
                                >
                                    {isTracking ? 'Looking up...' : 'Lookup ID'}
                                </button>
                            </div>
                        ) : (
                            <Link href="/report">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/20"
                                >
                                    <Plus size={18} />
                                    Report an Issue
                                </motion.button>
                            </Link>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Detailed Tracking Modal */}
            <ReportDetailModal
                report={selectedReport}
                onClose={() => setSelectedReport(null)}
                onDelete={handleDeleteReport}
            />
        </div>
    );
}
