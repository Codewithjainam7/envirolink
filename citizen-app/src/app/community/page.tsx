'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, Award, Trophy } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const leaderboard = [
    { name: 'Rahul M.', reports: 156, city: 'Mumbai' },
    { name: 'Priya S.', reports: 134, city: 'Delhi' },
    { name: 'Amit K.', reports: 98, city: 'Bangalore' },
    { name: 'Deepa R.', reports: 87, city: 'Chennai' },
    { name: 'Vikram J.', reports: 76, city: 'Pune' },
];

export default function CommunityPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
            <FloatingBlobs />
            <div className="bg-emerald-600 text-white py-16 lg:py-24">
                <div className="max-w-6xl mx-auto px-4 lg:px-8">
                    <Link href="/home" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <Users size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Community</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Join thousands of citizens making their cities cleaner every day.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">10,000+</div>
                        <p className="text-gray-600">Active Members</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
                        <p className="text-gray-600">Cities</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <div className="text-4xl font-bold text-emerald-600 mb-2">1M+</div>
                        <p className="text-gray-600">Issues Resolved</p>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Trophy className="text-yellow-500" /> Top Contributors
                </h2>
                <div className="space-y-3 mb-16">
                    {leaderboard.map((user, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}`}>
                                #{i + 1}
                            </div>
                            <div className="flex-1">
                                <div className="font-semibold text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.city}</div>
                            </div>
                            <div className="text-emerald-600 font-semibold">{user.reports} reports</div>
                        </div>
                    ))}
                </div>

                <div className="bg-emerald-50 p-8 rounded-2xl text-center">
                    <MessageSquare size={32} className="text-emerald-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Join the Discussion</h3>
                    <p className="text-gray-600 mb-4">Connect with other community members on our forum.</p>
                    <button className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
                        Coming Soon
                    </button>
                </div>
            </div>
        </div>
    );
}
