'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight, Eye, EyeOff, Sparkles, Leaf } from 'lucide-react';

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
            <motion.div
                className="absolute w-56 h-56 rounded-full bg-emerald-300/25 blur-3xl"
                animate={{ x: [0, -80, 40, 0], y: [-50, 30, -20, -50] }}
                transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '20%', right: '5%' }}
            />
        </div>
    );
}

const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.165, 0.84, 0.44, 1] } },
};

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;
            
            // Check worker approval status
            const { data: worker, error: workerError } = await supabase
                .from('workers')
                .select('status')
                .eq('email', email)
                .single();
            
            if (workerError) {
                // No worker record - might be new or not a worker
                await supabase.auth.signOut();
                throw new Error('No worker profile found. Please register first.');
            }
            
            if (worker.status === 'pending_approval') {
                await supabase.auth.signOut();
                throw new Error('Your application is still pending approval. Please wait for admin approval.');
            }
            
            if (worker.status === 'rejected') {
                await supabase.auth.signOut();
                throw new Error('Your application was not approved. Please contact support.');
            }
            
            if (worker.status !== 'approved') {
                await supabase.auth.signOut();
                throw new Error('Your account status is invalid. Please contact support.');
            }
            
            router.push('/');
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
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            <FloatingGreenBlobs />

            <motion.div
                initial="hidden"
                animate="visible"
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <motion.div variants={itemVariants} className="text-center mb-8">
                    <div className="w-24 h-24 mx-auto mb-6 relative">
                        <motion.div
                            className="absolute inset-0 bg-emerald-400/30 rounded-3xl blur-xl"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <img
                            src="/images/envirolink-icon.png"
                            alt="EnviroLink"
                            className="w-full h-full object-contain relative z-10 drop-shadow-xl"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to continue your mission</p>
                </motion.div>

                {/* Login Card */}
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

                    <form onSubmit={handleLogin} className="space-y-5">
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
                                    placeholder="••••••••"
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

                        <div className="text-right">
                            <a href="#" className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                                Forgot Password?
                            </a>
                        </div>

                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                            {!loading && <ArrowRight size={20} />}
                        </motion.button>
                    </form>

                    <div className="my-6 flex items-center gap-4">
                        <div className="h-px bg-gray-200 flex-1" />
                        <span className="text-gray-400 text-sm font-medium">or continue with</span>
                        <div className="h-px bg-gray-200 flex-1" />
                    </div>

                    <motion.button
                        onClick={handleGoogleLogin}
                        disabled={true}
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
                        Continue with Google
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Soon</span>
                    </motion.button>
                </motion.div>

                <motion.p variants={itemVariants} className="text-center mt-8 text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors">
                        Register Here
                    </Link>
                </motion.p>

                {/* Bottom decorative text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center text-emerald-600/50 text-sm font-medium mt-6"
                >
                    <div className="flex items-center gap-2 justify-center">
                        <Leaf size={14} />
                        <span>Making cities cleaner, one report at a time</span>
                        <Leaf size={14} />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
