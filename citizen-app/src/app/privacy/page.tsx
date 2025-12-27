'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Lock, Database, Bell, Trash2, Mail } from 'lucide-react';
import { FloatingBlobs } from '@/components';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
            <FloatingBlobs />
            {/* Header */}
            <div className="bg-emerald-600 text-white py-16 lg:py-24">
                <div className="max-w-4xl mx-auto px-4 lg:px-8">
                    <Link href="/home" className="inline-flex items-center gap-2 text-emerald-100 hover:text-white mb-6 transition-colors">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Shield size={40} />
                            <h1 className="text-4xl lg:text-5xl font-bold">Privacy Policy</h1>
                        </div>
                        <p className="text-emerald-100 text-lg">Last updated: December 2025</p>
                    </motion.div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="prose prose-lg max-w-none"
                >
                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Eye className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Information We Collect</h2>
                        </div>
                        <p className="text-gray-600">
                            ENVIROLINK collects information you provide directly to us when you create an account, submit a waste report, or contact us for support. This may include:
                        </p>
                        <ul className="text-gray-600 space-y-2">
                            <li>Name and email address</li>
                            <li>Phone number (optional)</li>
                            <li>Location data for accurate report placement</li>
                            <li>Photos of waste issues</li>
                            <li>Device information and usage statistics</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">How We Use Your Information</h2>
                        </div>
                        <p className="text-gray-600">We use the information we collect to:</p>
                        <ul className="text-gray-600 space-y-2">
                            <li>Process and respond to waste reports</li>
                            <li>Improve our services and user experience</li>
                            <li>Send notifications about report status updates</li>
                            <li>Communicate with municipal authorities</li>
                            <li>Analyze trends to improve city cleanliness</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Data Security</h2>
                        </div>
                        <p className="text-gray-600">
                            We implement industry-standard security measures to protect your personal information. All data is encrypted in transit and at rest. We regularly review our security practices and update them as needed.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Bell className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Notifications</h2>
                        </div>
                        <p className="text-gray-600">
                            You may receive notifications via email, SMS, or push notifications about your reports. You can opt out of non-essential communications at any time through your account settings.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Data Deletion</h2>
                        </div>
                        <p className="text-gray-600">
                            You can request deletion of your personal data at any time by contacting us. We will delete your information within 30 days of receiving your request, except where we are required by law to retain it.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Mail className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Contact Us</h2>
                        </div>
                        <p className="text-gray-600">
                            If you have any questions about this Privacy Policy, please contact us at:
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg mt-4">
                            <p className="text-gray-800 font-medium">ENVIROLINK Privacy Team</p>
                            <p className="text-gray-600">Email: privacy@envirolink.in</p>
                            <p className="text-gray-600">Phone: +91 98765 43210</p>
                        </div>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
