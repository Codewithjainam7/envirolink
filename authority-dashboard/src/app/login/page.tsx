'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
    ShieldCheck, Sparkles, Activity, CheckCircle2, Loader2
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

// Authorized Municipal Authority accounts
const ADMIN_CREDENTIALS = {
    usernames: ['admin', 'admin@envirolink.in'],
    password: 'admin123'
};

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/50 to-teal-50/70 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
            <FloatingBlobs />

            {/* Subtle background grid texture */}
            <div
                className="fixed inset-0 pointer-events-none opacity-[0.035] z-0"
                style={{
                    backgroundImage: 'radial-gradient(#047857 1px, transparent 1px)',
                    backgroundSize: '28px 28px',
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45, ease: [0.165, 0.84, 0.44, 1] }}
                className="relative z-10 w-full max-w-5xl bg-white/85 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-emerald-950/10 border border-emerald-100/80 overflow-hidden grid lg:grid-cols-12"
            >
                {/* Left Showcase Panel with Generated Smart City Illustration */}
                <div className="lg:col-span-6 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[600px] bg-emerald-950 overflow-hidden flex flex-col justify-between p-6 sm:p-8 text-white">
                    <img
                        src="/images/admin-login-hero.jpg"
                        alt="EnviroLink Smart Municipal Operations"
                        className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/95 via-emerald-950/35 to-emerald-950/30" />

                    {/* Top Live Command Pill */}
                    <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold tracking-wide text-emerald-50">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            ENVIROLINK COMMAND CENTER
                        </span>
                    </div>

                    {/* Bottom Feature Highlights */}
                    <div className="relative z-10 space-y-4 mt-auto pt-12">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-white">
                                Smart Municipal Waste Governance
                            </h2>
                            <p className="text-sm text-emerald-100/85 mt-2 leading-relaxed max-w-md">
                                Monitor live citizen reports, dispatch sanitation teams, and verify AI-audited cleanups from one unified hub.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-emerald-50">
                                <Activity size={13} className="text-emerald-300" />
                                Real-Time Sync
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-emerald-50">
                                <Sparkles size={13} className="text-emerald-300" />
                                Nemotron AI Verification
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-emerald-50">
                                <CheckCircle2 size={13} className="text-emerald-300" />
                                SLA &amp; Trust Guards
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Login Form Panel */}
                <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white/75">
                    {/* Brand Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 shadow-sm">
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

                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, Officer
                        </h1>
                        <p className="text-sm text-gray-500 mt-1.5">
                            Sign in to access city analytics, dispatch, and worker approvals.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mb-6 p-3.5 bg-red-50 border border-red-200/80 rounded-2xl flex items-start gap-2.5 text-red-700 text-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Enter admin username"
                                    autoComplete="username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                                    className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all"
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
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Verifying Access...
                                </>
                            ) : (
                                <>
                                    Access Command Center
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                        <span>Authorized Municipal Authority Portal · Mumbai Operations</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
