'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, FileText, Scale, AlertTriangle, Users, Ban, RefreshCw } from 'lucide-react';
import { FloatingBlobs } from '@/components';

export default function TermsPage() {
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
                            <FileText size={40} />
                            <h1 className="text-4xl lg:text-5xl font-bold">Terms of Service</h1>
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
                            <Scale className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Agreement to Terms</h2>
                        </div>
                        <p className="text-gray-600">
                            By accessing or using ENVIROLINK, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access our service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Users className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">User Responsibilities</h2>
                        </div>
                        <p className="text-gray-600">As a user of ENVIROLINK, you agree to:</p>
                        <ul className="text-gray-600 space-y-2">
                            <li>Provide accurate and truthful information in your reports</li>
                            <li>Not submit false or misleading waste reports</li>
                            <li>Respect the privacy and rights of others</li>
                            <li>Not use the service for any illegal purposes</li>
                            <li>Not attempt to manipulate or abuse the reporting system</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Disclaimer</h2>
                        </div>
                        <p className="text-gray-600">
                            ENVIROLINK provides a platform for citizens to report waste issues. We do not guarantee the resolution of any reported issue within a specific timeframe. Response times depend on local municipal authorities and their capacity.
                        </p>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <Ban className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Prohibited Activities</h2>
                        </div>
                        <p className="text-gray-600">You may not:</p>
                        <ul className="text-gray-600 space-y-2">
                            <li>Upload harmful, offensive, or inappropriate content</li>
                            <li>Impersonate others or provide false identity information</li>
                            <li>Attempt to hack, disrupt, or damage our services</li>
                            <li>Use automated systems to submit reports</li>
                            <li>Violate any applicable laws or regulations</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <RefreshCw className="text-emerald-600" size={24} />
                            <h2 className="text-2xl font-bold text-gray-900 m-0">Changes to Terms</h2>
                        </div>
                        <p className="text-gray-600">
                            We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the application. Your continued use of ENVIROLINK after such modifications constitutes acceptance of the updated terms.
                        </p>
                    </section>

                    <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl mt-8">
                        <p className="text-emerald-800 font-medium">Questions about our Terms?</p>
                        <p className="text-emerald-700">Contact us at legal@envirolink.in</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
