'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
    ShieldCheck, Sparkles, Activity, CheckCircle2, Loader2, KeyRound
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

// Authorized Municipal Authority accounts
const ADMIN_CREDENTIALS = {
    usernames: ['admin', 'admin@envirolink.in'],
    password: 'admin123'
};

const PLATFORM_LEGENDS = [
    {
        icon: Activity,
        title: 'Real-Time Sync',
        desc: 'Live reports & SLA breach alerts.',
    },
    {
        icon: Sparkles,
        title: 'Nemotron AI Audit',
        desc: 'Before & after cleanup proof.',
    },
    {
        icon: CheckCircle2,
        title: 'Trust & GPS Guards',
        desc: 'Anti-fraud & worker approvals.',
    },
];

export default function AdminLoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const normalizedUser = username.trim().toLowerCase();
        if (ADMIN_CREDENTIALS.usernames.includes(normalizedUser) && password === ADMIN_CREDENTIALS.password) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('admin_session', JSON.stringify({
                    username: normalizedUser,
                    loggedInAt: new Date().toISOString(),
                    role: 'admin'
                }));
                document.cookie = 'envirolink_admin_auth=1; path=/; max-age=86400; SameSite=Lax';
            }
            router.replace('/');
        } else {
            setError('Invalid username or password. Please verify your credentials.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen lg:h-screen w-full grid lg:grid-cols-12 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/70 relative overflow-x-hidden">
            {/* Left Showcase Panel: Flat on left edge, rounded ONLY on right edge facing the login form */}
            <div className="lg:col-span-6 relative lg:h-screen bg-gradient-to-br from-[#022c22] via-[#064e3b] to-[#042f2e] overflow-hidden rounded-b-[2rem] lg:rounded-b-none lg:rounded-r-[2.75rem] shadow-2xl shadow-emerald-950/30 flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-white z-10">
                {/* Ambient glow behind smart-city artwork */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />

                {/* Top Command Pill */}
                <div className="relative z-10 flex items-center justify-between shrink-0">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-emerald-300/25 text-[11px] sm:text-xs font-semibold tracking-wider text-emerald-50 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ENVIROLINK · COMMAND CENTER
                    </span>
                    <span className="hidden sm:inline-flex text-[11px] font-medium text-emerald-200/80 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        v2.0 Live Ops
                    </span>
                </div>

                {/* Full Uncropped Illustration Centerpiece */}
                <div className="relative z-10 flex-1 flex items-center justify-center my-4 min-h-[200px] lg:min-h-0">
                    <motion.img
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.55, ease: [0.165, 0.84, 0.44, 1] }}
                        src="/images/admin-login-hero.jpg"
                        alt="EnviroLink Smart Municipal Operations"
                        className="max-h-[240px] sm:max-h-[300px] lg:max-h-[44vh] w-auto object-contain rounded-3xl shadow-2xl shadow-black/40 border border-emerald-400/20"
                    />
                </div>

                {/* Bottom Title + 3 Side-by-Side Legends */}
                <div className="relative z-10 shrink-0 space-y-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-white">
                            Smart Municipal Waste Governance
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl">
                            Track live citizen reports, assign field crews, and audit AI-verified cleanups in real time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {PLATFORM_LEGENDS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:bg-white/15 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center shrink-0">
                                            <Icon size={14} className="text-emerald-300" />
                                        </div>
                                        <p className="text-xs font-bold text-white leading-tight">{item.title}</p>
                                    </div>
                                    <p className="text-[11px] text-emerald-100/80 leading-snug">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel: Cool Glassmorphic Officer Sign-In Card */}
            <div className="lg:col-span-6 lg:h-screen flex items-center justify-center p-6 sm:p-10 lg:p-14 relative overflow-hidden">
                <FloatingBlobs />
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(#047857 1px, transparent 1px)',
                        backgroundSize: '26px 26px',
                    }}
                />

                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.165, 0.84, 0.44, 1] }}
                    className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-2xl rounded-[1.75rem] shadow-2xl shadow-emerald-950/10 border border-emerald-100 overflow-hidden"
                >
                    {/* Top Emerald Accent Gradient Bar */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

                    <div className="p-7 sm:p-9">
                        {/* Brand Header + Officer Badge */}
                        <div className="flex items-center justify-between gap-3 mb-7">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/70 flex items-center justify-center p-2 shadow-sm">
                                    <img
                                        src="/images/envirolink-icon.png"
                                        alt="ENVIROLINK"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div>
                                    <img
                                        src="/images/envirolink-logo.png"
                                        alt="ENVIROLINK"
                                        className="h-5 w-auto object-contain"
                                    />
                                    <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 mt-0.5">
                                        Authority Portal
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                <KeyRound size={12} />
                                Officer Auth
                            </span>
                        </div>

                        <div className="mb-6">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                                Welcome back, Officer
                            </h1>
                            <p className="text-sm text-gray-500 mt-1.5">
                                Sign in to access city analytics, report dispatch, and worker approvals.
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-sm"
                                >
                                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                                    Username or Official Email
                                </label>
                                <div className="relative group">
                                    <User
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors"
                                    />
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50/80 focus:bg-white border-2 border-slate-200/70 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Enter admin username"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                                    Password
                                </label>
                                <div className="relative group">
                                    <Lock
                                        size={18}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors"
                                    />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-slate-50/80 focus:bg-white border-2 border-slate-200/70 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.015, y: -1 }}
                                whileTap={{ scale: 0.985 }}
                                className="group relative w-full py-4 px-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-3 overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Verifying Access...
                                        </>
                                    ) : (
                                        <>
                                            Access Command Center
                                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </motion.button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                Protected Authority Access
                            </span>
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                Mumbai Ops
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
