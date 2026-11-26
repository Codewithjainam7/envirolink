'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Lock, User, AlertCircle, ArrowRight, Eye, EyeOff,
    ShieldCheck, Sparkles, Activity, CheckCircle2, Loader2
} from 'lucide-react';

// Authorized Municipal Authority accounts
const ADMIN_CREDENTIALS = {
    usernames: ['admin', 'admin@envirolink.in'],
    password: 'admin123'
};

const PLATFORM_LEGENDS = [
    {
        icon: Activity,
        title: 'Real-Time Command Sync',
        desc: 'Live report updates, SLA breach tracking, and zone metrics.',
    },
    {
        icon: Sparkles,
        title: 'Nemotron AI Proof Audit',
        desc: 'Automated before-and-after cleanup verification for every task.',
    },
    {
        icon: CheckCircle2,
        title: 'Anti-Fraud & Trust Guards',
        desc: 'Citizen trust scoring, GPS checks, and worker onboarding control.',
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
        <div className="min-h-screen w-full grid lg:grid-cols-2 bg-white">
            {/* Left Half: Full-Height Smart City Visual & Legends */}
            <div className="relative min-h-[340px] lg:min-h-screen bg-emerald-950 overflow-hidden flex flex-col justify-between p-8 sm:p-10 lg:p-14 text-white">
                <img
                    src="/images/admin-login-hero.jpg"
                    alt="EnviroLink Smart Municipal Operations"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                {/* Scrims keeping middle smart-city illustration crisp while making legends highly legible */}
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/35 to-emerald-950/45" />

                {/* Top Command Pill */}
                <div className="relative z-10 flex items-center justify-between">
                    <span className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-950/55 backdrop-blur-md border border-emerald-300/25 text-xs font-semibold tracking-wider text-emerald-50 shadow-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        ENVIROLINK · AUTHORITY COMMAND CENTER
                    </span>
                </div>

                {/* Bottom Legends */}
                <div className="relative z-10 mt-auto pt-16 max-w-xl">
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
                        Smart Municipal Waste Governance
                    </h2>
                    <p className="text-sm sm:text-base text-emerald-100/90 mt-2.5 leading-relaxed">
                        Manage city-wide waste reports, assign field teams, and verify cleanups in real time.
                    </p>

                    <div className="mt-6 grid gap-3">
                        {PLATFORM_LEGENDS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={item.title}
                                    className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-950/60 backdrop-blur-md border border-white/15"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon size={18} className="text-emerald-300" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-snug">{item.title}</p>
                                        <p className="text-xs text-emerald-100/80 mt-0.5 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Right Half: Full-Height Centered Login Panel */}
            <div className="min-h-[calc(100vh-340px)] lg:min-h-screen flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 relative overflow-hidden">
                {/* Subtle ambient glow */}
                <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-teal-200/25 blur-3xl pointer-events-none" />

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
                    className="relative z-10 w-full max-w-md"
                >
                    {/* Brand Lockup */}
                    <div className="flex items-center gap-3.5 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center p-2 shadow-sm">
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
                                className="h-6 w-auto object-contain"
                            />
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mt-0.5">
                                Municipal Authority Portal
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            Welcome back, Officer
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 mt-2">
                            Sign in to access city analytics, report dispatch, and worker approvals.
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm"
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
                                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border-2 border-gray-200/80 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-sm"
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
                                    className="w-full pl-11 pr-12 py-4 rounded-2xl bg-white border-2 border-gray-200/80 text-gray-900 text-sm font-medium placeholder-gray-400 focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-500 outline-none transition-all shadow-sm"
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
                            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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

                    <div className="mt-8 pt-6 border-t border-gray-200/70 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
                        <span>Authorized Municipal Authority Portal · Mumbai Operations</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
