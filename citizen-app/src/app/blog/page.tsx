'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, Clock, ArrowRight } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const posts = [
    { title: 'How AI is Revolutionizing Waste Detection', excerpt: 'Learn how our AI technology can identify 50+ types of waste with 95% accuracy...', date: 'Dec 20, 2025', readTime: '5 min' },
    { title: '10 Tips for Effective Waste Reporting', excerpt: 'Make your reports more actionable with these simple tips from our team...', date: 'Dec 15, 2025', readTime: '3 min' },
    { title: 'Success Story: Mumbai Cleanup Drive', excerpt: 'How citizens and authorities came together to clean 100+ locations...', date: 'Dec 10, 2025', readTime: '4 min' },
    { title: 'Understanding Waste Categories', excerpt: 'A comprehensive guide to different types of waste and proper disposal methods...', date: 'Dec 5, 2025', readTime: '6 min' },
];

export default function BlogPage() {
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
                        <BookOpen size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Blog</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Insights, tips, and stories about urban waste management.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <div className="space-y-6">
                    {posts.map((post, i) => (
                        <motion.article
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl hover:shadow-lg transition-shadow"
                        >
                            <div className="flex gap-4 text-sm text-gray-500 mb-3">
                                <span className="flex items-center gap-1"><Calendar size={14} />{post.date}</span>
                                <span className="flex items-center gap-1"><Clock size={14} />{post.readTime}</span>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                            <p className="text-gray-600 mb-4">{post.excerpt}</p>
                            <button className="text-emerald-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                                Read More <ArrowRight size={16} />
                            </button>
                        </motion.article>
                    ))}
                </div>
            </div>
        </div>
    );
}
