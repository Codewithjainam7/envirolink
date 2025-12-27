'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MapPin, Clock, CheckCircle, XCircle, AlertCircle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

interface Worker {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address: string;
    zone: string;
    experience: string;
    vehicle_type: string;
    status: string;
    joined_at: string;
}

export default function PendingRegistrationsPage() {
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPendingWorkers();
    }, []);

    const fetchPendingWorkers = async () => {
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .eq('status', 'pending_approval')
                .order('joined_at', { ascending: false });

            if (error) throw error;
            setWorkers(data || []);
        } catch (err) {
            console.error('Error fetching workers:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (workerId: string) => {
        setActionLoading(workerId);
        try {
            const { error } = await supabase
                .from('workers')
                .update({ status: 'approved' })
                .eq('id', workerId);

            if (error) throw error;

            // Remove from list
            setWorkers(workers.filter(w => w.id !== workerId));
        } catch (err) {
            console.error('Error approving worker:', err);
            alert('Failed to approve worker');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (workerId: string) => {
        if (!confirm('Are you sure you want to reject this application?')) return;

        setActionLoading(workerId);
        try {
            const { error } = await supabase
                .from('workers')
                .update({ status: 'rejected' })
                .eq('id', workerId);

            if (error) throw error;

            setWorkers(workers.filter(w => w.id !== workerId));
        } catch (err) {
            console.error('Error rejecting worker:', err);
            alert('Failed to reject worker');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/workers">
                    <button className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Registrations</h1>
                    <p className="text-gray-500 text-sm">Review and approve worker applications</p>
                </div>
                <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">
                    {workers.length} pending
                </span>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && workers.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"
                >
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                    <p className="text-gray-500">No pending registrations to review.</p>
                </motion.div>
            )}

            {/* Workers List */}
            <div className="space-y-4">
                {workers.map((worker, i) => (
                    <motion.div
                        key={worker.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                            {/* Worker Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                                        <User size={24} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">
                                            {worker.first_name} {worker.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Clock size={12} />
                                            Applied {formatDate(worker.joined_at)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={14} className="text-gray-400" />
                                        <span className="truncate">{worker.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Phone size={14} className="text-gray-400" />
                                        <span>{worker.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>{worker.zone || 'Not specified'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Briefcase size={14} className="text-gray-400" />
                                        <span>{worker.experience || 'Fresher'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleReject(worker.id)}
                                    disabled={actionLoading === worker.id}
                                    className="px-4 py-2 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <XCircle size={18} />
                                    Reject
                                </button>
                                <button
                                    onClick={() => handleApprove(worker.id)}
                                    disabled={actionLoading === worker.id}
                                    className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {actionLoading === worker.id ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <CheckCircle size={18} />
                                    )}
                                    Approve
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
