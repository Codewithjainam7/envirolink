'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { FloatingBlobs } from '@/components';

const services = [
    { name: 'Web Application', status: 'operational', uptime: '99.99%' },
    { name: 'Mobile App', status: 'operational', uptime: '99.95%' },
    { name: 'API Services', status: 'operational', uptime: '99.99%' },
    { name: 'AI Analysis', status: 'operational', uptime: '99.90%' },
    { name: 'Notification Service', status: 'operational', uptime: '99.98%' },
    { name: 'Database', status: 'operational', uptime: '99.99%' },
];

const incidents = [
    { date: 'Dec 15, 2025', title: 'Scheduled Maintenance', status: 'resolved', desc: 'Database optimization completed successfully.' },
    { date: 'Dec 10, 2025', title: 'API Latency', status: 'resolved', desc: 'Minor latency issues resolved within 30 minutes.' },
];

export default function StatusPage() {
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
                        <Activity size={48} className="mx-auto mb-4" />
                        <h1 className="text-4xl lg:text-5xl font-bold mb-4">System Status</h1>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                            All Systems Operational
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>
                <div className="space-y-3 mb-16">
                    {services.map((service, i) => (
                        <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <CheckCircle size={20} className="text-green-500" />
                                <span className="font-medium text-gray-900">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-500">{service.uptime} uptime</span>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    Operational
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Incidents</h2>
                <div className="space-y-4">
                    {incidents.map((incident, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-gray-900">{incident.title}</h3>
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                                    Resolved
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{incident.desc}</p>
                            <span className="text-xs text-gray-400">{incident.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
