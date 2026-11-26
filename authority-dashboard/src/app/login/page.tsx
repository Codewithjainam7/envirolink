'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
    ShieldCheck, Loader2, KeyRound, Radio, Check
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
    const [focusedField, setFocusedField] = useState<'username' | 'password' | null>(null);
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
        <div className="min-h-screen lg:h-screen w-full grid lg:grid-cols-12 bg-[#f3f8f6] relative overflow-x-hidden">
            {/* Left Full-Bleed Showcase Panel:
                Flush on left edge (TL=0, BL=0), inset slightly top/bottom on desktop so BOTH top-right and bottom-right rounded edges frame cleanly */}
            <div className="lg:col-span-6 relative min-h-[340px] lg:h-[calc(100vh-2rem)] lg:my-4 bg-[#022c22] overflow-hidden rounded-bl-[2.25rem] rounded-br-[2.25rem] lg:rounded-tl-none lg:rounded-bl-none lg:rounded-tr-[2.75rem] lg:rounded-br-[2.75rem] border-y border-r border-emerald-400/20 shadow-[0_24px_60px_-15px_rgba(2,44,34,0.38)] flex flex-col justify-between p-6 sm:p-8 lg:p-10 text-white z-10">
                {/* Full-size smart-city hero image */}
                <motion.img
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease: [0.165, 0.84, 0.44, 1] }}
                    src="/images/admin-login-hero.jpg"
                    alt="EnviroLink Smart Municipal Operations"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Balanced top & bottom gradient scrims */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#022c22]/85 via-transparent to-[#022c22]/92 pointer-events-none" />

                {/* Top Command Pill */}
                <div className="relative z-10 flex items-center justify-between shrink-0">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-emerald-300/30 text-[11px] sm:text-xs font-semibold tracking-wider text-emerald-50 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ENVIROLINK · COMMAND CENTER
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-100 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
                        <Radio size={12} className="text-emerald-400" />
                        v2.0 Live Ops
                    </span>
                </div>

                {/* Clean Bottom Title */}
                <div className="relative z-10 shrink-0 max-w-lg pb-1">
                    <h2 className="text-2xl sm:text-3xl xl:text-4xl font-bold tracking-tight text-white drop-shadow-sm">
                        Smart Municipal Waste Governance
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100/90 mt-2 leading-relaxed drop-shadow-sm">
                        Centralized command portal for live citizen dispatches, crew assignments, and AI-verified field operations.
                    </p>
                </div>
            </div>

            {/* Right Panel: Command-Grade Officer Auth UI */}
            <div className="lg:col-span-6 lg:h-screen flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-hidden">
                <FloatingBlobs />
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.06]"
                    style={{
                        backgroundImage: 'radial-gradient(#047857 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 left-8 w-80 h-80 rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: [0.165, 0.84, 0.44, 1] }}
                    className="relative z-10 w-full max-w-[460px] p-[1.5px] rounded-[2rem] bg-gradient-to-br from-emerald-500/45 via-teal-300/35 to-emerald-700/35 shadow-[0_28px_70px_-15px_rgba(6,78,59,0.22)]"
                >
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[calc(2rem-1.5px)] overflow-hidden">
                        {/* Dark-Emerald Command Card Header Strip (visually links with left hero panel) */}
                        <div className="relative bg-gradient-to-r from-[#022c22] via-[#064e3b] to-[#042f2e] px-7 py-5 text-white overflow-hidden">
                            <div
                                className="absolute inset-0 opacity-15 pointer-events-none"
                                style={{
                                    backgroundImage: 'radial-gradient(rgba(167,243,208,0.45) 1px, transparent 1px)',
                                    backgroundSize: '14px 14px',
                                }}
                            />
                            <div className="relative z-10 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-emerald-300/30 flex items-center justify-center p-2 shadow-inner">
                                        <img
                                            src="/images/envirolink-icon.png"
                                            alt="ENVIROLINK"
                                            className="w-full h-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-base font-extrabold tracking-wide text-white">
                                                ENVIROLINK
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-400/20 text-emerald-200 border border-emerald-300/25">
                                                Admin
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-medium text-emerald-200/85 mt-0.5">
                                            Municipal Authority Portal
                                        </p>
                                    </div>
                                </div>

                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-300/30 text-emerald-100 text-[11px] font-semibold">
                                    <KeyRound size={12} className="text-emerald-300" />
                                    Officer Auth
                                </span>
                            </div>
                        </div>

                        {/* Form Body */}
                        <div className="p-7 sm:p-8">
                            <div className="flex items-start justify-between gap-3 mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                                        Welcome back, Officer
                                    </h1>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                                        Authenticate to manage city zones, dispatch teams, and review AI proofs.
                                    </p>
                                </div>
                            </div>

                            {/* Compact Security / Clearance Strip */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                {['Live Dispatch', 'Worker Gate', 'AI Audit'].map((tag) => (
                                    <div
                                        key={tag}
                                        className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-emerald-50/80 border border-emerald-100 text-[11px] font-semibold text-emerald-800"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        {tag}
                                    </div>
                                ))}
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-red-700 text-xs sm:text-sm"
                                    >
                                        <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            Officer ID / Email
                                        </label>
                                        {username.trim().length > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                                <Check size={12} /> Ready
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        className={`flex items-center rounded-2xl border-2 bg-slate-50/70 transition-all duration-200 ${
                                            focusedField === 'username'
                                                ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/15 shadow-sm'
                                                : 'border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div
                                            className={`ml-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                                focusedField === 'username'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white text-slate-500 border border-slate-200/80'
                                            }`}
                                        >
                                            <User size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={username}
                                            onFocus={() => setFocusedField('username')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setUsername(e.target.value)}
                                            className="w-full px-3.5 py-3.5 bg-transparent text-slate-900 text-sm font-medium placeholder-slate-400 outline-none"
                                            placeholder="admin or admin@envirolink.in"
                                            autoComplete="username"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                                            Access Passkey
                                        </label>
                                        <span className="text-[11px] font-medium text-slate-400">
                                            24h Session
                                        </span>
                                    </div>
                                    <div
                                        className={`flex items-center rounded-2xl border-2 bg-slate-50/70 transition-all duration-200 ${
                                            focusedField === 'password'
                                                ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/15 shadow-sm'
                                                : 'border-slate-200/80 hover:border-slate-300'
                                        }`}
                                    >
                                        <div
                                            className={`ml-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                                                focusedField === 'password'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-white text-slate-500 border border-slate-200/80'
                                            }`}
                                        >
                                            <Lock size={16} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3.5 py-3.5 bg-transparent text-slate-900 text-sm font-medium placeholder-slate-400 outline-none"
                                            placeholder="Enter officer password"
                                            autoComplete="current-password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="mr-3 px-2 py-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <motion.button
                                    type="submit"
                                    disabled={loading}
                                    whileHover={{ scale: 1.012, y: -1 }}
                                    whileTap={{ scale: 0.985 }}
                                    className="group relative w-full py-4 px-6 bg-gradient-to-r from-[#022c22] via-emerald-600 to-teal-600 hover:from-[#04392c] hover:via-emerald-700 hover:to-teal-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/35 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mt-3 overflow-hidden"
                                >
                                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        {loading ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                Verifying Clearance...
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

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1.5 font-medium">
                                    <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                                    Encrypted Authority Gate
                                </span>
                                <span className="text-emerald-800 font-bold bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                                    Mumbai Ops
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
