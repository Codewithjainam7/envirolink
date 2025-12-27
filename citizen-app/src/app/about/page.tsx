'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Leaf, Target, Users, Globe, Award, ArrowRight, Heart, Sparkles } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const TEAM_MEMBERS = [
    { name: 'Jainam Jain', role: 'Founder & CEO', avatar: 'JJ' },
    { name: 'Tech Team', role: 'Engineering', avatar: 'TT' },
    { name: 'Operations', role: 'Field Team', avatar: 'OT' },
];

const STATS = [
    { value: '50+', label: 'Cities Covered' },
    { value: '1M+', label: 'Reports Resolved' },
    { value: '10K+', label: 'Active Workers' },
    { value: '99%', label: 'Satisfaction Rate' },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white relative">
            <FloatingBlobs />
            {/* Hero */}
            <section className="pt-20 pb-16 px-4 bg-gradient-to-br from-emerald-50 to-white">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-3xl mx-auto"
                    >
                        <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            <Heart size={16} />
                            Our Story
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                            Building Cleaner Cities, <br />
                            <span className="text-emerald-600">One Report at a Time</span>
                        </h1>
                        <p className="text-lg text-gray-600">
                            ENVIROLINK is revolutionizing urban waste management through technology,
                            AI, and community engagement. We're on a mission to make every city cleaner and greener.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 bg-emerald-600">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {STATS.map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center text-white"
                            >
                                <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                                <p className="text-emerald-100">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="py-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
                            <p className="text-gray-600 mb-6 text-lg">
                                We believe that technology can transform how cities manage waste. By connecting
                                citizens directly with sanitation workers and authorities, we're creating a
                                transparent, efficient ecosystem for urban cleanliness.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { icon: Target, text: 'Reduce waste management response time by 80%' },
                                    { icon: Users, text: 'Empower citizens to be active participants' },
                                    { icon: Globe, text: 'Create sustainable, cleaner cities' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <item.icon size={24} className="text-emerald-600" />
                                        </div>
                                        <p className="text-gray-700 font-medium">{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white"
                        >
                            <Leaf size={48} className="mb-6" />
                            <h3 className="text-2xl font-bold mb-4">Our Values</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Sparkles size={20} className="flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-semibold">Transparency</p>
                                        <p className="text-emerald-100 text-sm">Every report tracked, every action visible</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles size={20} className="flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-semibold">Community First</p>
                                        <p className="text-emerald-100 text-sm">Built for citizens, by citizens</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Sparkles size={20} className="flex-shrink-0 mt-1" />
                                    <div>
                                        <p className="font-semibold">Innovation</p>
                                        <p className="text-emerald-100 text-sm">AI-powered, always improving</p>
                                    </div>
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-20 bg-gray-50 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Join the Movement</h2>
                    <p className="text-gray-600 mb-8">
                        Be part of the solution. Start reporting waste issues in your neighborhood today.
                    </p>
                    <Link href="/report">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white font-semibold rounded-2xl"
                        >
                            Start Reporting
                            <ArrowRight size={20} />
                        </motion.button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
