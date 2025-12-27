'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Cookie, Settings, BarChart3, Shield, ToggleLeft } from 'lucide-react';
import { FloatingBlobs } from '@/components';

export default function CookiesPage() {
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
                            <Cookie size={40} />
                            <h1 className="text-4xl lg:text-5xl font-bold">Cookie Policy</h1>
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
                            <Cookie className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">What Are Cookies?</h2>
                        </div>
                        <p className="text-gray-600">
                            Cookies are small text files that are stored on your device when you visit a website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Settings className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Types of Cookies We Use</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900">Essential Cookies</h3>
                                <p className="text-gray-600 text-sm">Required for the website to function properly. These cannot be disabled.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900">Performance Cookies</h3>
                                <p className="text-gray-600 text-sm">Help us understand how visitors interact with our website.</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900">Functional Cookies</h3>
                                <p className="text-gray-600 text-sm">Remember your preferences and settings.</p>
                            </div>
                        </div>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <BarChart3 className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Analytics</h2>
                        </div>
                        <p className="text-gray-600">
                            We use analytics tools to understand how our service is used. This helps us improve the user experience and optimize our platform for waste reporting efficiency.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <ToggleLeft className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Managing Cookies</h2>
                        </div>
                        <p className="text-gray-600">
                            You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Shield className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Your Privacy</h2>
                        </div>
                        <p className="text-gray-600">
                            We respect your privacy and are committed to protecting your personal data. Our cookie usage complies with applicable data protection laws.
                        </p>
                    </section>
                </motion.div>
            </div>
        </div>
    );
}
