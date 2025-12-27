'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Camera, Award, TrendingUp,
    CheckCircle, Clock, Star, Edit2, Save, X, Shield, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

// Mock user data
const MOCK_USER = {
    id: '1',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 98765 43210',
    avatar: null,
    address: 'Andheri West, Mumbai',
    points: 2450,
    level: 'Gold Citizen',
    reportsSubmitted: 47,
    reportsResolved: 42,
    joinedDate: 'January 2024',
};

const BADGES = [
    { name: 'First Report', icon: Star, earned: true, color: '#f59e0b' },
    { name: '10 Reports', icon: Award, earned: true, color: '#3b82f6' },
    { name: 'Quick Responder', icon: Clock, earned: true, color: '#10b981' },
    { name: '50 Reports', icon: TrendingUp, earned: false, color: '#6b7280' },
    { name: 'Community Hero', icon: Shield, earned: false, color: '#6b7280' },
];

export default function ProfilePage() {
    const [user, setUser] = useState(MOCK_USER);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
    });

    const handleSave = () => {
        setUser({ ...user, ...editData });
        setIsEditing(false);
        toast.success('Profile updated successfully!');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-48" />

            <div className="max-w-4xl mx-auto px-4 -mt-24">
                {/* Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-xl p-6 mb-6"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                                {user.firstName[0]}{user.lastName[0]}
                            </div>
                            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition">
                                <Camera size={18} className="text-gray-600" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {user.firstName} {user.lastName}
                                    </h1>
                                    <p className="text-gray-500">{user.email}</p>
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mt-2">
                                        <Award size={14} />
                                        {user.level}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition text-gray-700 font-medium"
                                >
                                    {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                                    {isEditing ? 'Cancel' : 'Edit Profile'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Editable Fields */}
                    {isEditing && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-6 pt-6 border-t border-gray-100"
                        >
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                    <input
                                        type="text"
                                        value={editData.firstName}
                                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                    <input
                                        type="text"
                                        value={editData.lastName}
                                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <input
                                        type="text"
                                        value={editData.address}
                                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                className="mt-4 flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </motion.div>
                    )}
                </motion.div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Points Earned', value: user.points.toLocaleString(), icon: Star, color: '#f59e0b' },
                        { label: 'Reports Filed', value: user.reportsSubmitted, icon: TrendingUp, color: '#3b82f6' },
                        { label: 'Issues Resolved', value: user.reportsResolved, icon: CheckCircle, color: '#10b981' },
                        { label: 'Success Rate', value: `${Math.round((user.reportsResolved / user.reportsSubmitted) * 100)}%`, icon: Award, color: '#8b5cf6' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white rounded-2xl p-5 shadow-sm"
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                                style={{ backgroundColor: `${stat.color}15` }}
                            >
                                <stat.icon size={20} style={{ color: stat.color }} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Badges */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm p-6 mb-6"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Badges</h2>
                    <div className="flex flex-wrap gap-4">
                        {BADGES.map((badge, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${badge.earned ? 'bg-gray-50' : 'bg-gray-100 opacity-50'
                                    }`}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{ backgroundColor: badge.earned ? `${badge.color}20` : '#e5e7eb' }}
                                >
                                    <badge.icon size={20} style={{ color: badge.earned ? badge.color : '#9ca3af' }} />
                                </div>
                                <div>
                                    <p className={`font-semibold ${badge.earned ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {badge.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {badge.earned ? 'Earned' : 'Locked'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-sm p-6 mb-8"
                >
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Push Notifications</p>
                                    <p className="text-sm text-gray-500">Get notified about report updates</p>
                                </div>
                            </div>
                            <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                                <Mail size={20} className="text-gray-500" />
                                <div>
                                    <p className="font-medium text-gray-900">Email Updates</p>
                                    <p className="text-sm text-gray-500">Weekly summary of your activity</p>
                                </div>
                            </div>
                            <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
