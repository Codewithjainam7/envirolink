'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

// Authorized Municipal Authority accounts
const ADMIN_CREDENTIALS = {
    usernames: ['admin', 'admin@envirolink.in'],
    password: 'admin123'
};

const itemVariants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
    visible: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.5, ease: [0.165, 0.84, 0.44, 1] as const }
    },
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
        <div className="min-h-screen lg:h-screen w-full grid lg:grid-cols-12 bg-gradient-to-br from-emerald-100/80 via-gray-100 to-emerald-50 relative overflow-x-hidden">
            {/* Left Full-Bleed Visual Panel: flat left edge, rounded ONLY on top-right and bottom-right */}
            <div className="lg:col-span-6 relative min-h-[340px] lg:h-screen bg-[#022c22] overflow-hidden rounded-bl-[2.5rem] rounded-br-[2.5rem] lg:rounded-tl-none lg:rounded-bl-none lg:rounded-tr-[2.75rem] lg:rounded-br-[2.75rem] shadow-2xl shadow-emerald-950/20 flex flex-col justify-between p-7 sm:p-10 text-white z-10">
                <motion.img
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.65, ease: [0.165, 0.84, 0.44, 1] }}
                    src="/images/admin-login-hero.jpg"
                    alt="EnviroLink Smart Municipal Operations"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />

                {/* Soft scrims only at top & bottom so the artwork stays crisp */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-emerald-950/85 pointer-events-none" />

                <div className="relative z-10 flex items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Authority Dashboard
                    </span>
                </div>

                <div className="relative z-10 max-w-lg">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                        Smart Municipal Waste Governance
                    </h2>
                    <p className="text-sm text-emerald-50/90 mt-2 leading-relaxed">
                        Manage city waste reports, assign field teams, and review verified cleanups in real time.
                    </p>
                </div>
            </div>

            {/* Right Login Area: Matches EnviroLink Worker & Citizen theme */}
            <div className="lg:col-span-6 lg:h-screen flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-hidden">
                <FloatingBlobs />

                <motion.div
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-md relative z-10"
                >
                    {/* Brand Header above card (same structure as Worker & Citizen login) */}
                    <motion.div variants={itemVariants} className="text-center mb-7">
                        <div className="w-20 h-20 mx-auto mb-5 relative">
                            <motion.div
                                className="absolute inset-0 bg-emerald-400/30 rounded-3xl blur-xl"
                                animate={{ scale: [1, 1.08, 1] }}
                                transition={{ duration: 2.5, repeat: Infinity }}
                            />
                            <img
                                src="/images/envirolink-icon.png"
                                alt="ENVIROLINK"
                                className="w-full h-full object-contain relative z-10 drop-shadow-lg"
                            />
                        </div>
                        <div className="flex items-center justify-center mb-2">
                            <img
                                src="/images/envirolink-logo.png"
                                alt="ENVIROLINK"
                                className="h-6 w-auto object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
                        <p className="text-gray-500 mt-1">Sign in to the Authority Dashboard</p>
                    </motion.div>

                    {/* Login Card (same frosted white card as Worker & Citizen portals) */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white/80 backdrop-blur-2xl rounded-3xl p-8 border border-emerald-100 shadow-xl shadow-emerald-500/10"
                    >
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm"
                            >
                                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Username or Email
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
                                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                        placeholder="Enter username or email"
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
                                        className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
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
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? 'Signing in...' : (
                                    <>
                                        Sign In
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                            <ShieldCheck size={15} className="text-emerald-600" />
                            <span>Mumbai Municipal Corporation · Authorized Access Only</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
