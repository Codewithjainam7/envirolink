'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Bell, Shield, Smartphone, Globe, Moon,
    LayoutGrid, Mail, Lock, User, Save, BellRing,
    Bot, Zap, Radio, Volume2, Eye, Database, LogOut,
    ChevronRight, ChevronDown, Check, Sparkles
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

interface SelectOption {
    value: string;
    label: string;
}

function SettingsSelect({
    value,
    options,
    onChange,
}: {
    value: string;
    options: SelectOption[];
    onChange: (val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((o) => o.value === value) || options[0];

    return (
        <div ref={ref} className="relative w-full">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-left font-medium text-sm text-gray-900 transition-all ${
                    open
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-gray-200 hover:border-emerald-300'
                }`}
            >
                <span className="truncate">{selectedOption?.label}</span>
                <ChevronDown
                    size={18}
                    className={`shrink-0 ml-2 transition-transform duration-200 ${
                        open ? 'rotate-180 text-emerald-600' : 'text-gray-400'
                    }`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-emerald-900/10 border border-emerald-100 py-1.5 z-50 max-h-60 overflow-y-auto"
                    >
                        {options.map((opt) => {
                            const isSelected = opt.value === value;
                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors ${
                                        isSelected
                                            ? 'bg-emerald-50 text-emerald-700 font-semibold'
                                            : 'text-gray-700 hover:bg-gray-50 hover:text-emerald-600'
                                    }`}
                                >
                                    <span>{opt.label}</span>
                                    {isSelected && <Check size={15} className="text-emerald-600 shrink-0" />}
                                </button>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Settings Categories
const CATEGORIES = [
    { id: 'general', label: 'General', icon: LayoutGrid },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'ai', label: 'AI & Automation', icon: Bot },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'data', label: 'Data & Privacy', icon: Database },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState('general');
    const [isSaving, setIsSaving] = useState(false);

    // Mock State for Settings
    const [settings, setSettings] = useState({
        // General
        dashboardName: 'Mumbai Municipal Authority',
        language: 'English',
        timezone: 'IST (UTC+05:30)',
        refreshInterval: '30s',

        // Notifications
        emailAlerts: true,
        smsAlerts: false,
        pushNotifications: true,
        highSeverityAlerts: true,
        dailyDigest: true,

        // AI
        autoAssign: true,
        aiConfidenceThreshold: 85,
        smartRouting: true,
        autoCloseDuplicate: false,

        // Security
        twoFactorAuth: true,
        sessionTimeout: '30m',

        // Data
        dataRetention: '1 year',
        publicApiAccess: false
    });

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            alert('Settings saved successfully!');
        }, 1500);
    };

    const handleSignOut = () => {
        if (confirm('Are you sure you want to sign out?')) {
            // Clear any local storage/auth state
            alert('Signed out successfully!');
            // In a real app, would redirect to login
            window.location.href = '/login';
        }
    };

    const handleRevokeSessions = () => {
        if (confirm('This will sign you out from all devices. Are you sure?')) {
            alert('All sessions have been revoked. You will be signed out.');
            // In a real app, would invalidate all sessions and redirect
            window.location.href = '/login';
        }
    };

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${checked ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
        >
            <span
                className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ease-in-out ${checked ? 'translate-x-7' : 'translate-x-0'
                    }`}
            />
        </button>
    );

    return (
        <div className="min-h-screen relative pb-12">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500 font-medium mt-1">Manage dashboard preferences and system configuration</p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Save Changes
                            </>
                        )}
                    </motion.button>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-xl border border-emerald-50 sticky top-8">
                            <nav className="space-y-1.5">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`relative overflow-hidden w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeTab === cat.id
                                            ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-200'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {activeTab === cat.id && (
                                                <motion.span
                                                    layoutId="active-pill"
                                                    className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r-full"
                                                />
                                            )}
                                            <cat.icon size={19} className={`shrink-0 ${activeTab === cat.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                            <span className="truncate">{cat.label}</span>
                                        </div>
                                        {activeTab === cat.id && <ChevronRight size={16} className="text-emerald-500 shrink-0" />}
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-3 mb-4 px-1">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-emerald-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate">Admin User</p>
                                        <p className="text-xs text-gray-500 truncate">admin@mumbai-auth.gov</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <LogOut size={17} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25 }}
                            className="bg-white/85 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-50"
                        >
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-5">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                                            <LayoutGrid size={22} className="text-emerald-500 shrink-0" />
                                            General Configuration
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">Basic dashboard information and preferences</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Organization Name</label>
                                            <input
                                                type="text"
                                                value={settings.dashboardName}
                                                onChange={(e) => setSettings({ ...settings, dashboardName: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Timezone</label>
                                            <SettingsSelect
                                                value={settings.timezone}
                                                onChange={(val) => setSettings({ ...settings, timezone: val })}
                                                options={[
                                                    { value: 'IST (UTC+05:30)', label: 'IST (UTC+05:30)' },
                                                    { value: 'UTC (GMT+00:00)', label: 'UTC (GMT+00:00)' },
                                                    { value: 'EST (UTC-05:00)', label: 'EST (UTC-05:00)' },
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Language</label>
                                            <SettingsSelect
                                                value={settings.language}
                                                onChange={(val) => setSettings({ ...settings, language: val })}
                                                options={[
                                                    { value: 'English', label: 'English' },
                                                    { value: 'Hindi', label: 'हिंदी (Hindi)' },
                                                    { value: 'Marathi', label: 'मराठी (Marathi)' },
                                                    { value: 'Bhojpuri', label: 'भोजपुरी (Bhojpuri)' },
                                                    { value: 'Marwadi', label: 'मारवाड़ी (Marwadi)' },
                                                ]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Auto-Refresh Interval</label>
                                            <SettingsSelect
                                                value={settings.refreshInterval}
                                                onChange={(val) => setSettings({ ...settings, refreshInterval: val })}
                                                options={[
                                                    { value: '15s', label: '15 seconds' },
                                                    { value: '30s', label: '30 seconds' },
                                                    { value: '1m', label: '1 minute' },
                                                    { value: '5m', label: '5 minutes' },
                                                ]}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notifications Settings */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <BellRing size={24} className="text-emerald-500" />
                                            Alert & Notification Preferences
                                        </h2>
                                        <p className="text-gray-500 mt-1">Manage how and when you receive alerts</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Mail size={20} className="text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Email Alerts</p>
                                                    <p className="text-sm text-gray-500">Receive critical updates via email</p>
                                                </div>
                                            </div>
                                            <Toggle checked={settings.emailAlerts} onChange={(v) => setSettings({ ...settings, emailAlerts: v })} />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                    <Smartphone size={20} className="text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">SMS Alerts</p>
                                                    <p className="text-sm text-gray-500">Receive critical SMS on registered number</p>
                                                </div>
                                            </div>
                                            <Toggle checked={settings.smsAlerts} onChange={(v) => setSettings({ ...settings, smsAlerts: v })} />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                                    <Volume2 size={20} className="text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">High Severity Only</p>
                                                    <p className="text-sm text-gray-500">Only notify for high priority incidents</p>
                                                </div>
                                            </div>
                                            <Toggle checked={settings.highSeverityAlerts} onChange={(v) => setSettings({ ...settings, highSeverityAlerts: v })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* AI & Automation */}
                            {activeTab === 'ai' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Sparkles size={24} className="text-emerald-500" />
                                            AI & Automation Rules
                                        </h2>
                                        <p className="text-gray-500 mt-1">Configure automated workflows and AI thresholds</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Zap size={24} className="text-emerald-600" />
                                                    <div>
                                                        <p className="font-bold text-gray-900 text-lg">Auto-Assignment</p>
                                                        <p className="text-sm text-gray-600">Automatically assign workers to new reports</p>
                                                    </div>
                                                </div>
                                                <Toggle checked={settings.autoAssign} onChange={(v) => setSettings({ ...settings, autoAssign: v })} />
                                            </div>

                                            {settings.autoAssign && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="pt-4 border-t border-emerald-200/50"
                                                >
                                                    <div className="mb-2 flex justify-between">
                                                        <label className="text-sm font-bold text-gray-700">Confidence Threshold</label>
                                                        <span className="text-sm font-bold text-emerald-600">{settings.aiConfidenceThreshold}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="50"
                                                        max="100"
                                                        value={settings.aiConfidenceThreshold}
                                                        onChange={(e) => setSettings({ ...settings, aiConfidenceThreshold: parseInt(e.target.value) })}
                                                        className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-2">Only auto-assign if AI confidence score is above this value.</p>
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">Smart Routing</p>
                                                <p className="text-sm text-gray-500">Optimize routes based on traffic and worker location</p>
                                            </div>
                                            <Toggle checked={settings.smartRouting} onChange={(v) => setSettings({ ...settings, smartRouting: v })} />
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                            <div>
                                                <p className="font-bold text-gray-900">Auto-Close Duplicates</p>
                                                <p className="text-sm text-gray-500">Automatically resolve report if detected as duplicate</p>
                                            </div>
                                            <Toggle checked={settings.autoCloseDuplicate} onChange={(v) => setSettings({ ...settings, autoCloseDuplicate: v })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Shield size={24} className="text-emerald-500" />
                                            Security & Access
                                        </h2>
                                        <p className="text-gray-500 mt-1">Protect your dashboard and manage sessions</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                                                    <Lock size={20} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">Two-Factor Authentication (2FA)</p>
                                                    <p className="text-sm text-gray-500">Require OTP for login</p>
                                                </div>
                                            </div>
                                            <Toggle checked={settings.twoFactorAuth} onChange={(v) => setSettings({ ...settings, twoFactorAuth: v })} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Session Timeout</label>
                                            <SettingsSelect
                                                value={settings.sessionTimeout}
                                                onChange={(val) => setSettings({ ...settings, sessionTimeout: val })}
                                                options={[
                                                    { value: '15m', label: '15 minutes' },
                                                    { value: '30m', label: '30 minutes' },
                                                    { value: '1h', label: '1 hour' },
                                                    { value: '4h', label: '4 hours' },
                                                ]}
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <button
                                                onClick={handleRevokeSessions}
                                                className="text-red-500 font-bold text-sm hover:underline flex items-center gap-2"
                                            >
                                                <LogOut size={16} />
                                                Revoke all active sessions
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Data Settings */}
                            {activeTab === 'data' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <Database size={24} className="text-emerald-500" />
                                            Data Retention & Privacy
                                        </h2>
                                        <p className="text-gray-500 mt-1">Manage data lifecycle and api access</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Report Retention Period</label>
                                            <SettingsSelect
                                                value={settings.dataRetention}
                                                onChange={(val) => setSettings({ ...settings, dataRetention: val })}
                                                options={[
                                                    { value: '6m', label: '6 Months' },
                                                    { value: '1y', label: '1 Year' },
                                                    { value: '3y', label: '3 Years' },
                                                    { value: 'forever', label: 'Forever' },
                                                ]}
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Archived reports will be deleted after this period.</p>
                                        </div>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div>
                                                <p className="font-bold text-gray-900">Public API Access</p>
                                                <p className="text-sm text-gray-500">Allow third-party apps to read public stats</p>
                                            </div>
                                            <Toggle checked={settings.publicApiAccess} onChange={(v) => setSettings({ ...settings, publicApiAccess: v })} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
