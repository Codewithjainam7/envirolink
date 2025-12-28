'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    User, Mail, Phone, MapPin, CheckCircle, Lock, Eye, EyeOff,
    ArrowRight, Recycle, Shield, AlertCircle, Leaf, LucideIcon
} from 'lucide-react';

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

// InputField component OUTSIDE the main component to prevent focus loss
interface InputFieldProps {
    label: string;
    icon: LucideIcon;
    type?: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    isPassword?: boolean;
    showPassword?: boolean;
    onTogglePassword?: () => void;
}

function InputField({ label, icon: Icon, type = 'text', value, onChange, placeholder, isPassword, showPassword, onTogglePassword }: InputFieldProps) {
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className="relative group">
                <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600 transition-colors" />
                <input
                    type={isPassword ? (showPassword ? "text" : "password") : type}
                    value={value}
                    onChange={onChange}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
                    placeholder={placeholder}
                />
                {isPassword && onTogglePassword && (
                    <button
                        type="button"
                        onClick={onTogglePassword}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: '',
        city: 'Mumbai',
        zone: '',
        experience: '',
        vehicleType: 'none',
    });

    const validateStep1 = () => {
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.phone) {
            setError('Please fill all required fields');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        setError(null);
        return true;
    };

    const handleSignup = async () => {
        setLoading(true);
        setError(null);

        try {
            // First create the auth user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        phone: formData.phone,
                        role: 'worker',
                    },
                },
            });

            if (authError) throw authError;

            if (authData.user) {
                // Insert into workers table with pending_approval status
                console.log('Inserting worker into database with user id:', authData.user.id);

                const { data: workerData, error: workerError } = await supabase
                    .from('workers')
                    .insert([{
                        id: authData.user.id,
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                        address: formData.address,
                        zone: formData.zone,
                        experience: formData.experience,
                        vehicle_type: formData.vehicleType,
                        status: 'pending_approval',
                        joined_at: new Date().toISOString(),
                    }])
                    .select();

                if (workerError) {
                    console.error('Failed to insert worker:', workerError);
                    throw new Error(`Failed to create worker profile: ${workerError.message}`);
                }

                console.log('Worker profile created successfully:', workerData);
            }

            setStep(4);
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to register. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-100/80 via-gray-100 to-emerald-50 py-8 px-4 relative overflow-hidden">
            <FloatingGreenBlobs />

            <div className="max-w-lg mx-auto relative z-10">
                {/* Logo Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-20 h-20 mx-auto mb-4 relative">
                        <motion.div
                            className="absolute inset-0 bg-emerald-400/30 rounded-2xl blur-xl"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <img
                            src="/images/envirolink-icon.png"
                            alt="EnviroLink"
                            className="w-full h-full object-contain relative z-10 drop-shadow-xl"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Join the Team</h1>
                    <p className="text-gray-500 text-sm">Register as a Sanitation Worker</p>
                </motion.div>

                {/* Progress Bar */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: step >= s ? 1 : 0.8 }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg ${step >= s
                                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/25'
                                    : 'bg-white text-gray-400 border-2 border-gray-100'
                                    }`}
                            >
                                {step > s ? <CheckCircle size={18} /> : s}
                            </motion.div>
                            {s < 3 && (
                                <div className={`w-12 h-1 mx-1 rounded-full transition-colors ${step > s ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gray-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

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

                {/* Step 1: Personal Info */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <User size={20} className="text-emerald-600" />
                            Personal Information
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    label="First Name"
                                    icon={User}
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="John"
                                />
                                <InputField
                                    label="Last Name"
                                    icon={User}
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                />
                            </div>

                            <InputField
                                label="Email"
                                icon={Mail}
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="john@example.com"
                            />

                            <InputField
                                label="Password"
                                icon={Lock}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Min. 6 characters"
                                isPassword
                                showPassword={showPassword}
                                onTogglePassword={() => setShowPassword(!showPassword)}
                            />

                            <InputField
                                label="Confirm Password"
                                icon={Lock}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Re-enter password"
                                isPassword
                                showPassword={showConfirmPassword}
                                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                            />

                            <InputField
                                label="Phone Number"
                                icon={Phone}
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="+91 98765 43210"
                            />
                        </div>

                        <motion.button
                            onClick={() => validateStep1() && setStep(2)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                        >
                            Continue <ArrowRight size={18} />
                        </motion.button>

                        <p className="text-center mt-4 text-gray-500 text-sm">
                            Already have an account?{' '}
                            <Link href="/login" className="text-emerald-600 font-bold hover:text-emerald-700">Sign In</Link>
                        </p>
                    </motion.div>
                )}

                {/* Step 2: Work Details */}
                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Recycle size={20} className="text-emerald-600" />
                            Work Details
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                <div className="relative group">
                                    <MapPin size={18} className="absolute left-4 top-4 text-gray-400" />
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none outline-none text-sm"
                                        rows={2}
                                        placeholder="Your full address"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Work Experience</label>
                                <select
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                                >
                                    <option value="">Select experience</option>
                                    <option value="fresher">Fresher</option>
                                    <option value="1-2">1-2 Years</option>
                                    <option value="3-5">3-5 Years</option>
                                    <option value="5+">5+ Years</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['none', 'bicycle', 'motorcycle', 'auto', 'tempo'].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, vehicleType: v })}
                                            className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${formData.vehicleType === v
                                                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                                }`}
                                        >
                                            {v.charAt(0).toUpperCase() + v.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Zone</label>
                                <select
                                    value={formData.zone}
                                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm"
                                >
                                    <option value="">Select zone</option>
                                    <option value="zone1">Zone 1 - South Mumbai</option>
                                    <option value="zone2">Zone 2 - Central Mumbai</option>
                                    <option value="zone3">Zone 3 - Western Suburbs</option>
                                    <option value="zone4">Zone 4 - Eastern Suburbs</option>
                                    <option value="zone5">Zone 5 - Navi Mumbai</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="flex-1 py-3.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition border border-gray-200"
                            >
                                Back
                            </button>
                            <motion.button
                                onClick={() => setStep(3)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                            >
                                Continue <ArrowRight size={18} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5"
                    >
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-emerald-600" />
                            Review & Submit
                        </h2>

                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Name', value: `${formData.firstName} ${formData.lastName}` },
                                { label: 'Email', value: formData.email },
                                { label: 'Phone', value: formData.phone },
                                { label: 'Experience', value: formData.experience || 'Not specified' },
                                { label: 'Zone', value: formData.zone || 'Not specified' },
                            ].map((item) => (
                                <div key={item.label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                                    <p className="text-gray-900 font-medium text-sm">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mb-6">
                            <div className="flex items-start gap-3">
                                <Shield size={18} className="text-amber-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-amber-800 text-sm">Admin Approval Required</p>
                                    <p className="text-xs text-amber-600">Your application will be reviewed by our team. You'll be notified once approved.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStep(2)}
                                className="flex-1 py-3.5 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition border border-gray-200"
                            >
                                Back
                            </button>
                            <motion.button
                                onClick={handleSignup}
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-500/25"
                            >
                                {loading ? 'Submitting...' : 'Submit'}
                                {!loading && <ArrowRight size={18} />}
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/70 backdrop-blur-2xl rounded-3xl p-8 text-center border border-emerald-100 shadow-xl shadow-emerald-500/5"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                            className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/30"
                        >
                            <Shield size={48} className="text-white" />
                        </motion.div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
                        <p className="text-gray-500 mb-4 text-sm">
                            Your registration is pending admin approval.
                        </p>
                        <p className="text-gray-400 mb-6 text-xs">
                            You'll receive an email once your application is approved. Only then you can log in.
                        </p>

                        <Link href="/">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25"
                            >
                                Back to Home
                            </motion.button>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Bottom tag */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center mt-8 text-emerald-600/50 text-sm font-medium flex items-center gap-2 justify-center"
            >
                <Leaf size={14} />
                <span>Making cities cleaner, one report at a time</span>
                <Leaf size={14} />
            </motion.div>
        </div>
    );
}
