'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Handshake, Building2, Globe, Award } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const partners = [
    { name: 'Mumbai Municipal Corporation', type: 'Government', logo: '🏛️' },
    { name: 'Delhi MCD', type: 'Government', logo: '🏛️' },
    { name: 'Bangalore BBMP', type: 'Government', logo: '🏛️' },
    { name: 'Tata Consultancy', type: 'Technology', logo: '💻' },
    { name: 'Infosys Foundation', type: 'NGO', logo: '🌱' },
    { name: 'Clean India Initiative', type: 'NGO', logo: '🌍' },
];

export default function PartnersPage() {
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
                        <Handshake size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">Our Partners</h1>
                        <p className="text-emerald-100 text-lg max-w-2xl mx-auto">
                            Working together with leading organizations to create cleaner cities.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {partners.map((partner, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl text-center border border-gray-100"
                        >
                            <div className="text-4xl mb-4">{partner.logo}</div>
                            <h3 className="font-bold text-gray-900 mb-1">{partner.name}</h3>
                            <span className="text-sm text-emerald-600">{partner.type}</span>
                        </motion.div>
                    ))}
                </div>

                <div className="bg-emerald-600 text-white p-8 rounded-3xl text-center">
                    <h3 className="text-2xl font-bold mb-4">Become a Partner</h3>
                    <p className="text-emerald-100 mb-6">Join us in our mission to create cleaner, greener cities.</p>
                    <a href="mailto:partners@envirolink.in" className="inline-block bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors">
                        Contact Us
                    </a>
                </div>
            </div>
        </div>
    );
}
