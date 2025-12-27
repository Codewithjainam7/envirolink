'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, HelpCircle, MessageCircle, Book, Mail, Phone, ChevronRight } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const faqs = [
    { q: 'How do I report a waste issue?', a: 'Simply click "Report Issue" on the home page, take a photo of the waste, and our AI will automatically detect the type. Add location details and submit!' },
    { q: 'How long does it take for issues to be resolved?', a: 'Most issues are resolved within 24-48 hours, depending on the type and severity. You\'ll receive real-time updates on your report status.' },
    { q: 'Is the app free to use?', a: 'Yes! ENVIROLINK is completely free for citizens. Our mission is to make waste management accessible to everyone.' },
    { q: 'Can I report anonymously?', a: 'Yes, you can submit reports anonymously. However, providing contact details helps us follow up if we need more information.' },
];

export default function HelpPage() {
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
                        <HelpCircle size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Help Center</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Find answers to common questions or get in touch with our support team.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
                <div className="space-y-4 mb-16">
                    {faqs.map((faq, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl"
                        >
                            <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                            <p className="text-gray-600">{faq.a}</p>
                        </motion.div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Support</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <Mail size={32} className="text-emerald-600 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Email</h3>
                        <a href="mailto:support@envirolink.in" className="text-emerald-600 hover:underline">support@envirolink.in</a>
                    </div>
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <Phone size={32} className="text-emerald-600 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Phone</h3>
                        <a href="tel:+919876543210" className="text-emerald-600 hover:underline">+91 98765 43210</a>
                    </div>
                    <div className="bg-white p-6 rounded-2xl text-center">
                        <MessageCircle size={32} className="text-emerald-600 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-2">Live Chat</h3>
                        <p className="text-gray-600">Available 9 AM - 6 PM IST</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
