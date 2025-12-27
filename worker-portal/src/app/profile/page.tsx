'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User, Mail, Phone, MapPin, Camera, Save, Bell,
    Shield, LogOut, ChevronRight, Star, Award
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import BottomNav from '@/components/BottomNav';

// Mock worker data
const WORKER = {
    name: 'Suresh Patil',
    email: 'suresh.patil@email.com',
    phone: '+91 98765 43210',
    address: 'Andheri West, Mumbai',
    zone: 'Zone 3',
    employeeId: 'WK-10234',
    rating: 4.8,
    totalTasks: 234,
    completedTasks: 228,
    totalEarnings: 45600,
    joinedDate: 'March 2024',
};

export default function WorkerProfilePage() {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 relative">
            <FloatingBlobs />

            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 pb-24 pt-8 px-6 rounded-b-[40px] shadow-xl relative z-10">
                <div className="flex justify-between items-center text-white mb-6">
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <button className="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition">
                        <Bell size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4 text-white">
                    <div className="relative">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl font-bold border-2 border-white/30">
                            {WORKER.name[0]}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-amber-400 p-1.5 rounded-lg border-2 border-emerald-600 text-emerald-900">
                            <Star size={14} fill="currentColor" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">{WORKER.name}</h2>
                        <p className="text-emerald-100 text-sm">{WORKER.employeeId} • {WORKER.zone}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 -mt-12 relative z-10 space-y-6">

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                            <Award size={20} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{WORKER.totalTasks}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Tasks Done</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center text-center"
                    >
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
                            <Star size={20} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{WORKER.rating}</span>
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Rating</span>
                    </motion.div>
                </div>

                {/* Personal Info Card */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-gray-900 text-lg">Personal Details</h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="text-sm font-bold text-emerald-600 hover:underline"
                        >
                            {isEditing ? 'Save' : 'Edit'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <Mail size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Email</p>
                                <p className="font-medium text-gray-900">{WORKER.email}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <Phone size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Phone</p>
                                <p className="font-medium text-gray-900">{WORKER.phone}</p>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                                <MapPin size={20} />
                            </div>
                            <div className="flex-1 border-b border-gray-100 pb-2">
                                <p className="text-xs text-gray-400 font-medium uppercase">Zone</p>
                                <p className="font-medium text-gray-900">{WORKER.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settings Links */}
                <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg"><Shield size={18} /></div>
                            <span className="font-bold text-gray-700">Privacy & Security</span>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl transition">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 text-red-600 p-2 rounded-lg"><LogOut size={18} /></div>
                            <span className="font-bold text-red-600">Log Out</span>
                        </div>
                    </button>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
