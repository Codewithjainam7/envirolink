'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    MapPin, TrendingUp, Award, ChevronRight, Sparkles,
    Globe, Target, CheckCircle2, ArrowRight, Users,
    BarChart3, Clock, Camera, Shield, Truck, Phone, FileText, ArrowUp, Leaf
} from 'lucide-react';
import { useAppStore } from '@/store';
import { AnimatedCounter, ReportCard, ReportForm, MapWrapper } from '@/components';

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },

    // NEW:
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] as const } },
};

// Floating green blobs component
function FloatingGreenBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Blob 1 - Top right */}
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{
                    x: [100, 200, 50, 100],
                    y: [50, 150, 100, 50],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: '10%', right: '10%' }}
            />
            {/* Blob 2 - Left side */}
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{
                    x: [-50, 100, 0, -50],
                    y: [200, 100, 300, 200],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ top: '30%', left: '-5%' }}
            />
            {/* Blob 3 - Bottom center */}
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -100, 50, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '5%', left: '40%' }}
            />
            {/* Blob 4 - Top left */}
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-emerald-200/30 blur-3xl"
                animate={{
                    x: [0, 80, -20, 0],
                    y: [0, 50, -30, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{ top: '5%', left: '15%' }}
            />
            {/* Blob 5 - Right bottom */}
            <motion.div
                className="absolute w-56 h-56 rounded-full bg-emerald-300/25 blur-3xl"
                animate={{
                    x: [0, -80, 40, 0],
                    y: [-50, 30, -20, -50],
                }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '20%', right: '5%' }}
            />
        </div>
    );
}

export default function HomePage() {
    const { reports, cityStats, user, setIsReportSheetOpen, setSelectedReport, initializeAuth, fetchReports } = useAppStore();
    const [mounted, setMounted] = useState(false);
    const [isBooting, setIsBooting] = useState(true);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        // Initialize auth and fetch data on mount
        initializeAuth();
        fetchReports();

        // Boot animation for 2.5 seconds
        const bootTimer = setTimeout(() => {
            setIsBooting(false);
            setMounted(true);
        }, 2500);

        return () => clearTimeout(bootTimer);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Boot animation screen
    if (isBooting) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex items-center justify-center z-[9999]">
                {/* Same floating blobs as landing page */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute w-64 h-64 rounded-full bg-emerald-200/60 blur-3xl"
                        animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ top: '10%', right: '15%' }}
                    />
                    <motion.div
                        className="absolute w-80 h-80 rounded-full bg-emerald-300/40 blur-3xl"
                        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ top: '40%', left: '5%' }}
                    />
                    <motion.div
                        className="absolute w-72 h-72 rounded-full bg-emerald-100/70 blur-3xl"
                        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
                        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ bottom: '15%', right: '25%' }}
                    />
                </div>

                {/* Pulsing glow ring behind logo */}
                <motion.div
                    className="absolute w-40 h-40 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0.2, 0.5]
                    }}
                    transition={{ duration: 1, repeat: 2, ease: "easeInOut" }}
                />

                {/* Rotating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-3 h-3 rounded-full bg-emerald-400"
                        initial={{
                            x: 0,
                            y: 0,
                            opacity: 0,
                            scale: 0
                        }}
                        animate={{
                            x: Math.cos((i * 60) * Math.PI / 180) * 60,
                            y: Math.sin((i * 60) * Math.PI / 180) * 60,
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0]
                        }}
                        transition={{
                            duration: 1.5,
                            delay: i * 0.1,
                            ease: "easeOut"
                        }}
                    />
                ))}

                {/* Rotating Logo - Fast 360° rotation with scale */}
                <motion.div
                    initial={{ rotate: 0, scale: 0.5, opacity: 0 }}
                    animate={{ rotate: 1080, scale: 1, opacity: 1 }}
                    transition={{
                        rotate: { duration: 1.5, ease: [0.25, 0.1, 0.25, 1] },
                        scale: { duration: 0.5, ease: "easeOut" },
                        opacity: { duration: 0.3 }
                    }}
                    className="relative z-10"
                >
                    <motion.img
                        src="/images/envirolink-icon.png"
                        alt="ENVIROLINK"
                        className="w-28 h-28 object-contain"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(16,185,129,0.5))' }}
                        animate={{
                            filter: [
                                'drop-shadow(0 0 10px rgba(16,185,129,0.3))',
                                'drop-shadow(0 0 30px rgba(16,185,129,0.6))',
                                'drop-shadow(0 0 10px rgba(16,185,129,0.3))'
                            ]
                        }}
                        transition={{ duration: 1, repeat: 2 }}
                    />
                </motion.div>
            </div>
        );
    }

    if (!mounted) return null;

    const recentReports = reports.slice(0, 6);

    return (
        <div className="min-h-screen relative">
            {/* Floating Green Blobs */}
            <FloatingGreenBlobs />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-emerald-50 via-white to-gray-50 overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 rounded-full opacity-60"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                        transition={{ duration: 20, repeat: Infinity }}
                    />
                    <motion.div
                        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-100 rounded-full opacity-60"
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 15, repeat: Infinity, delay: 2 }}
                    />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 lg:px-8 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-6">
                                <Sparkles size={16} />
                                Smart Waste Management Platform
                            </motion.div>

                            <motion.h1 variants={itemVariants} className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                Report Waste.{' '}
                                <span className="text-emerald-600">Track Progress.</span>{' '}
                                Transform Cities.
                            </motion.h1>

                            <motion.p variants={itemVariants} className="text-lg text-gray-600 mb-8 max-w-lg">
                                Turn every citizen into a cleanliness sensor. Snap a photo, report the issue, and watch as your city becomes cleaner—one report at a time.
                            </motion.p>

                            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                                <Link href="/report">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-2xl transition-all"
                                    >
                                        <Camera size={20} />
                                        Report an Issue
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </Link>
                                <Link href="/map">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-2 px-8 py-4 bg-emerald-50 text-emerald-700 font-semibold rounded-2xl transition-all border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400"
                                    >
                                        <MapPin size={20} />
                                        Explore Map
                                    </motion.button>
                                </Link>
                            </motion.div>

                            {/* Quick Stats */}
                            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4 sm:gap-8 mt-12">
                                {[
                                    { value: cityStats.totalReports, label: 'Reports Filed', icon: FileText },
                                    { value: cityStats.resolvedReports, label: 'Issues Resolved', icon: CheckCircle2 },
                                    { value: `${cityStats.resolutionRate.toFixed(0)}%`, label: 'Resolution Rate', icon: TrendingUp },
                                ].map((stat, i) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={i} className="flex flex-col items-center justify-center">
                                            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-1">
                                                <Icon size={20} className="text-emerald-500 flex-shrink-0" />
                                                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                                    {typeof stat.value === 'number' ? <AnimatedCounter value={stat.value} /> : stat.value}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-500 text-center">{stat.label}</p>
                                        </div>
                                    )
                                })}
                            </motion.div>
                        </motion.div>

                        {/* Hero Map Preview - REAL MAP */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 0.8, ease: [0.165, 0.84, 0.44, 1] }}
                            className="relative"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 h-[400px] lg:h-[500px]">
                                <MapWrapper
                                    reports={reports}
                                    onReportClick={(report) => setSelectedReport(report)}
                                    className="w-full h-full"
                                />

                                {/* Floating Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="absolute bottom-4 left-4 right-4 md:right-auto md:w-72 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl p-4 shadow-xl"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Target size={20} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Live Activity</p>
                                            <p className="text-xs text-gray-500">{reports.length} reports in your area</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            {reports.filter(r => r.status === 'submitted').length} open
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                                            {reports.filter(r => r.status === 'in_progress').length} in progress
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                            {reports.filter(r => r.status === 'resolved').length} resolved
                                        </span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 lg:py-24 bg-gradient-to-b from-emerald-50/50 via-white to-white relative" style={{ zIndex: 1 }}>
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">All-in-One Platform</span>
                        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mt-2 mb-4">
                            Smart & Fast Software for Your Needs
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Complete solution for efficient waste management with real-time tracking, instant alerts, and smart control room dashboards.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Camera, title: 'Report Issues', desc: 'Snap a photo and report waste issues instantly. AI auto-detects waste type.', color: '#10b981', bg: '#d1fae5' },
                            { icon: MapPin, title: 'GPS Tracking', desc: 'Real-time location tracking with auto-detected GPS coordinates.', color: '#059669', bg: '#ecfdf5' },
                            { icon: Phone, title: 'Instant Alerts', desc: 'Get notifications via SMS, Email, WhatsApp, and Push notifications.', color: '#047857', bg: '#d1fae5' },
                            { icon: Truck, title: 'Collection Tracking', desc: 'Track door-to-door waste collection status in real-time.', color: '#10b981', bg: '#ecfdf5' },
                            { icon: BarChart3, title: 'Smart Dashboard', desc: 'Live data from ground to ensure 100% operational transparency.', color: '#059669', bg: '#d1fae5' },
                            { icon: Shield, title: 'Complaint Management', desc: 'Efficient complaint resolution with SLA tracking and escalation.', color: '#047857', bg: '#ecfdf5' },
                        ].map((feature, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="p-6 rounded-2xl hover:shadow-xl transition-all cursor-pointer group border border-emerald-100 relative"
                                style={{ backgroundColor: '#f0fdf4', zIndex: 2 }}
                            >
                                <div
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: feature.bg }}
                                >
                                    <feature.icon size={28} style={{ color: feature.color }} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-gray-600 text-sm">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works - Redesigned */}
            <section id="how-it-works" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                            Simple Process
                        </span>
                        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Report waste issues in just three simple steps and help keep your city clean
                        </p>
                    </motion.div>

                    {/* Timeline Steps */}
                    <div className="relative">
                        {/* Connection Line */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 transform -translate-y-1/2 z-0" />

                        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                            {[
                                {
                                    icon: Camera,
                                    step: '01',
                                    title: 'Snap a Photo',
                                    description: 'Take a photo of the waste issue. Our AI automatically detects the type and severity.',
                                    color: '#10b981'
                                },
                                {
                                    icon: MapPin,
                                    step: '02',
                                    title: 'Pin Location',
                                    description: 'GPS auto-detects your location or manually select on the interactive map.',
                                    color: '#3b82f6'
                                },
                                {
                                    icon: CheckCircle2,
                                    step: '03',
                                    title: 'Track Progress',
                                    description: 'Get real-time updates via SMS/email as authorities resolve your report.',
                                    color: '#8b5cf6'
                                },
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.2 }}
                                    className="relative"
                                >
                                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow text-center">
                                        {/* Step Number */}
                                        <div
                                            className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                                            style={{
                                                background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                                                border: `2px solid ${step.color}30`
                                            }}
                                        >
                                            <step.icon size={36} style={{ color: step.color }} strokeWidth={1.5} />
                                        </div>

                                        {/* Step Badge */}
                                        <div
                                            className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4"
                                            style={{
                                                backgroundColor: `${step.color}15`,
                                                color: step.color
                                            }}
                                        >
                                            Step {step.step}
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                                    </div>

                                    {/* Connection Dot for Desktop */}
                                    <div
                                        className="hidden lg:flex absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full items-center justify-center shadow-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${step.color}, ${step.color}dd)`,
                                            boxShadow: `0 4px 20px ${step.color}50`
                                        }}
                                    >
                                        <span className="text-white font-bold text-sm">{i + 1}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* CTA under How It Works */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mt-16"
                    >
                        <Link href="/report">
                            <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className="inline-flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg rounded-2xl transition-all"
                            >
                                <Camera size={22} />
                                Start Reporting Now
                                <ArrowRight size={20} />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Recent Reports */}
            <section className="py-16 lg:py-24 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-10"
                    >
                        <div>
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                                Recent Reports
                            </h2>
                            <p className="text-gray-600">
                                See what's happening in your community
                            </p>
                        </div>
                        <Link href="/map">
                            <motion.button
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-2 text-emerald-600 font-semibold"
                            >
                                View All Reports
                                <ChevronRight size={20} />
                            </motion.button>
                        </Link>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {recentReports.map((report, i) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <ReportCard
                                    report={report}
                                    onClick={() => setSelectedReport(report)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Join Our Team CTA */}
            <section className="py-20 bg-gray-50 relative">
                <div className="max-w-5xl mx-auto px-4 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-100 relative overflow-hidden"
                    >
                        {/* Subtle background accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                            {/* Left content */}
                            <div className="flex-1 text-center lg:text-left">
                                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4">
                                    NOW HIRING
                                </span>
                                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
                                    We're looking for people like you
                                </h2>
                                <p className="text-gray-600 mb-6 max-w-lg">
                                    Help us keep Mumbai clean. Flexible hours, fair pay, and you'll actually
                                    see the difference you make every single day.
                                </p>

                                <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        <span>₹15,000+ monthly</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        <span>Work near home</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <CheckCircle2 size={16} className="text-emerald-500" />
                                        <span>Weekly payouts</span>
                                    </div>
                                </div>

                                <a
                                    href="https://envirolink-worker.vercel.app/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                                    >
                                        Apply Now
                                        <ArrowRight size={18} />
                                    </motion.button>
                                </a>
                            </div>

                            {/* Right - Stats and Social Proof */}
                            <div className="hidden lg:flex flex-col gap-4 w-56">
                                <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl p-5 text-center">
                                    <Users size={36} className="text-emerald-600 mx-auto mb-2" />
                                    <p className="text-2xl font-bold text-gray-900">100+</p>
                                    <p className="text-sm text-emerald-700">Active Workers</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex -space-x-2">
                                            <div className="w-7 h-7 rounded-full bg-emerald-200 border-2 border-white" />
                                            <div className="w-7 h-7 rounded-full bg-emerald-300 border-2 border-white" />
                                            <div className="w-7 h-7 rounded-full bg-emerald-400 border-2 border-white" />
                                        </div>
                                        <span className="text-xs text-gray-500">+12 this week</span>
                                    </div>
                                    <p className="text-xs text-gray-600 italic">"Best decision I made. Flexible timing and good pay!"</p>
                                    <p className="text-xs text-gray-400 mt-1">— Rajesh, Worker since 2024</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>


            <ReportForm />

            {/* Back to Top Button */}
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-[9999]"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
