'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, ArrowRight, Eye, EyeOff, Leaf, CheckCircle } from 'lucide-react';

// Floating green blobs component
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
        </div>
    );
}

const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] as const } },
};

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = getSupabase();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'citizen'
                    }
                }
            });
            if (authError) throw authError;

            // Supabase trigger will handle profile creation

            router.push('/home'); // Or to a verify email page if needed
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 via-emerald-50/50 to-gray-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <FloatingGreenBlobs />

            <motion.div
                initial="hidden"
                animate="visible"
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto mb-4 relative flex items-center justify-center bg-emerald-100 rounded-2xl">
                        <Leaf className="w-8 h-8 text-emerald-600" />
                        <motion.div
                            className="absolute inset-0 bg-emerald-400/30 rounded-2xl blur-xl"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Join EnviroLink</h1>
                    <p className="text-gray-500">Be a hero for your community</p>
                </motion.div>

                {/* Register Card */}
                <motion.div
                    variants={itemVariants}
                    className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 border border-emerald-100 shadow-xl shadow-emerald-500/5"
                >
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm"
                        >
                            <AlertCircle size={18} />
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                            <div className="relative group">
                                <CheckCircle size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="Confirm password"
                                    required
                                />
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                            {!loading && <ArrowRight size={20} />}
                        </motion.button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="text-gray-400 text-sm font-medium">or join with</span>
                        <div className="h-px bg-gray-200 flex-1" />
                    </div>

                    <motion.button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Join with Google
                    </motion.button>
                </motion.div>

                <motion.p variants={itemVariants} className="text-center mt-8 text-gray-600">
                    Already have an account?{' '}
                    <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                        Sign In
                    </Link>
                </motion.p>
            </motion.div>
        </div>
    );
}
