'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Briefcase, MapPin, Clock, Heart, Zap, Users } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const jobs = [
    { title: 'Senior Full Stack Developer', location: 'Mumbai, India', type: 'Full-time', department: 'Engineering' },
    { title: 'Product Designer', location: 'Remote', type: 'Full-time', department: 'Design' },
    { title: 'Operations Manager', location: 'Delhi, India', type: 'Full-time', department: 'Operations' },
    { title: 'Community Manager', location: 'Remote', type: 'Part-time', department: 'Marketing' },
    { title: 'Data Analyst', location: 'Bangalore, India', type: 'Full-time', department: 'Data' },
];

const benefits = [
    { icon: Heart, title: 'Health Insurance', desc: 'Comprehensive health coverage for you and family' },
    { icon: Clock, title: 'Flexible Hours', desc: 'Work when you\'re most productive' },
    { icon: Zap, title: 'Learning Budget', desc: '₹50,000 annual learning allowance' },
    { icon: Users, title: 'Great Team', desc: 'Work with passionate, driven people' },
];

export default function CareersPage() {
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
                        <Briefcase size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Join Our Team</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Help us build technology that makes cities cleaner. We're always looking for passionate people.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Open Positions</h2>
                <div className="space-y-4 mb-16">
                    {jobs.map((job, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{job.title}</h3>
                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>
                                        <span className="flex items-center gap-1"><Clock size={14} />{job.type}</span>
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">{job.department}</span>
                                    </div>
                                </div>
                                <button className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-600 transition-colors">
                                    Apply Now
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Work With Us?</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {benefits.map((benefit, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl text-center">
                            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <benefit.icon size={28} className="text-emerald-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                            <p className="text-gray-600 text-sm">{benefit.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
