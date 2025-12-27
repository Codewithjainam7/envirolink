'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Newspaper, Calendar, ExternalLink } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const pressReleases = [
    { title: 'ENVIROLINK Launches AI-Powered Waste Detection', date: 'December 2025', source: 'TechCrunch', link: '#' },
    { title: 'Smart Cities: How ENVIROLINK is Changing Urban Waste Management', date: 'November 2025', source: 'Economic Times', link: '#' },
    { title: 'ENVIROLINK Partners with 50 Indian Cities', date: 'October 2025', source: 'Business Standard', link: '#' },
    { title: 'Citizen-Powered Cleanup: The ENVIROLINK Story', date: 'September 2025', source: 'YourStory', link: '#' },
];

export default function PressPage() {
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
                        <Newspaper size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Press & Media</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Latest news and media coverage about ENVIROLINK.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Press Releases</h2>
                <div className="space-y-4 mb-16">
                    {pressReleases.map((item, i) => (
                        <motion.a
                            key={i}
                            href={item.link}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="block bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><Calendar size={14} />{item.date}</span>
                                        <span className="text-emerald-600">{item.source}</span>
                                    </div>
                                </div>
                                <ExternalLink size={20} className="text-gray-400 flex-shrink-0" />
                            </div>
                        </motion.a>
                    ))}
                </div>

                <div className="bg-emerald-50 p-8 rounded-2xl text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Media Inquiries</h3>
                    <p className="text-gray-600 mb-4">For press and media inquiries, please contact:</p>
                    <a href="mailto:press@envirolink.in" className="text-emerald-600 font-semibold hover:underline">
                        press@envirolink.in
                    </a>
                </div>
            </div>
        </div>
    );
}
