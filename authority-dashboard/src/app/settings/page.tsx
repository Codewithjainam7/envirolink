'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings, Bell, Shield, Smartphone, Globe, Moon,
    LayoutGrid, Mail, Lock, User, Save, BellRing,
    Bot, Zap, Radio, Volume2, Eye, Database, LogOut,
    ChevronRight, Check, Sparkles
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';

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
        setTimeout(() => setIsSaving(false), 1500);
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
        <div className="min-h-screen relative pb-8">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                        <p className="text-gray-500 font-medium">Manage dashboard preferences and system configuration</p>
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

                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Sidebar Tabs */}
                    <div className="lg:col-span-3">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-emerald-50 sticky top-8">
                            <nav className="space-y-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveTab(cat.id)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${activeTab === cat.id
                                            ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm ring-1 ring-emerald-200'
                                            : 'text-gray-600 hover:bg-white hover:shadow-sm font-medium'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <cat.icon size={20} className={activeTab === cat.id ? 'text-emerald-500' : 'text-gray-400'} />
                                            {activeTab === cat.id && <motion.span layoutId="active-pill" className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full" />}
                                            {cat.label}
                                        </div>
                                        {activeTab === cat.id && <ChevronRight size={16} className="text-emerald-500" />}
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-8 pt-6 border-t border-gray-100 px-3">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <User size={20} className="text-emerald-600" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="font-bold text-gray-900 truncate">Admin User</p>
                                        <p className="text-xs text-gray-500 truncate">admin@mumbai-auth.gov</p>
                                    </div>
                                </div>
                                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors">
                                    <LogOut size={18} />
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-9 space-y-6">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-emerald-50"
                        >
                            {/* General Settings */}
                            {activeTab === 'general' && (
                                <div className="space-y-8">
                                    <div className="border-b border-gray-100 pb-4">
                                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                            <LayoutGrid size={24} className="text-emerald-500" />
                                            General Configuration
                                        </h2>
                                        <p className="text-gray-500 mt-1">Basic dashboard information and preferences</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Organization Name</label>
                                            <input
                                                type="text"
                                                value={settings.dashboardName}
                                                onChange={(e) => setSettings({ ...settings, dashboardName: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Timezone</label>
                                            <select
                                                value={settings.timezone}
                                                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            >
                                                <option>IST (UTC+05:30)</option>
                                                <option>UTC (GMT+00:00)</option>
                                                <option>EST (UTC-05:00)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Language</label>
                                            <select
                                                value={settings.language}
                                                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            >
                                                <option>English</option>
                                                <option>Hindi</option>
                                                <option>Marathi</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Auto-Refresh Interval</label>
                                            <select
                                                value={settings.refreshInterval}
                                                onChange={(e) => setSettings({ ...settings, refreshInterval: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            >
                                                <option value="15s">15 seconds</option>
                                                <option value="30s">30 seconds</option>
                                                <option value="1m">1 minute</option>
                                                <option value="5m">5 minutes</option>
                                            </select>
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

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Session Timeout</label>
                                            <select
                                                value={settings.sessionTimeout}
                                                onChange={(e) => setSettings({ ...settings, sessionTimeout: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            >
                                                <option value="15m">15 minutes</option>
                                                <option value="30m">30 minutes</option>
                                                <option value="1h">1 hour</option>
                                                <option value="4h">4 hours</option>
                                            </select>
                                        </div>

                                        <div className="pt-4 border-t border-gray-100">
                                            <button className="text-red-500 font-bold text-sm hover:underline flex items-center gap-2">
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
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700">Report Retention Period</label>
                                            <select
                                                value={settings.dataRetention}
                                                onChange={(e) => setSettings({ ...settings, dataRetention: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
                                            >
                                                <option value="6m">6 Months</option>
                                                <option value="1y">1 Year</option>
                                                <option value="3y">3 Years</option>
                                                <option value="forever">Forever</option>
                                            </select>
                                            <p className="text-xs text-gray-500">Archived reports will be deleted after this period.</p>
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
