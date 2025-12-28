'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    Users, UserPlus, AlertTriangle, CheckCircle, Clock, Search,
    MapPin, Filter, MoreVertical, Star, Phone, Truck, ArrowRight, XCircle, Mail, Briefcase
} from 'lucide-react';
import FloatingBlobs from '@/components/FloatingBlobs';
import { createClient } from '@/lib/supabase';

interface PendingWorker {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    zone: string;
    experience: string;
    joined_at: string;
    status: string;
}

interface ActiveWorker {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    zone: string;
    status: string;
}

export default function WorkersManagementPage() {
    const [selectedTab, setSelectedTab] = useState<'active' | 'pending'>('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [pendingWorkers, setPendingWorkers] = useState<PendingWorker[]>([]);
    const [activeWorkers, setActiveWorkers] = useState<ActiveWorker[]>([]);
    const [loadingPending, setLoadingPending] = useState(true);
    const [loadingActive, setLoadingActive] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchPendingWorkers();
        fetchActiveWorkers();
    }, []);

    const fetchActiveWorkers = async () => {
        try {
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .in('status', ['approved', 'active'])
                .order('first_name', { ascending: true });

            if (error) throw error;
            setActiveWorkers(data || []);
        } catch (err) {
            console.error('Error fetching active workers:', err);
        } finally {
            setLoadingActive(false);
        }
    };

    const fetchPendingWorkers = async () => {
        try {
            console.log('Fetching pending workers with status: pending_approval');
            const { data, error } = await supabase
                .from('workers')
                .select('*')
                .eq('status', 'pending_approval')
                .order('joined_at', { ascending: false });

            if (error) {
                console.error('Error in pending workers query:', error);
                throw error;
            }
            console.log('Fetched pending workers:', data?.length || 0, data);
            setPendingWorkers(data || []);
        } catch (err) {
            console.error('Error fetching pending workers:', err);
        } finally {
            setLoadingPending(false);
        }
    };

    const handleApprove = async (workerId: string) => {
        setActionLoading(workerId);
        try {
            console.log('Approving worker:', workerId);
            const { error } = await supabase
                .from('workers')
                .update({ status: 'approved' })
                .eq('id', workerId);

            if (error) {
                console.error('Supabase error approving worker:', error);
                throw error;
            }

            console.log('Worker approved successfully, refreshing lists...');
            setPendingWorkers(pendingWorkers.filter(w => w.id !== workerId));
            await fetchActiveWorkers(); // Refresh active list
            console.log('Active workers refreshed, count:', activeWorkers.length);

            // Auto-switch to Active tab to show the approved worker
            setSelectedTab('active');
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
            setPendingWorkers(pendingWorkers.filter(w => w.id !== workerId));
        } catch (err) {
            console.error('Error rejecting worker:', err);
            alert('Failed to reject worker');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const filteredWorkers = activeWorkers.filter(w =>
        `${w.first_name} ${w.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen relative pb-8">
            <FloatingBlobs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Worker Management</h1>
                        <p className="text-gray-500 font-medium">Manage and track all sanitation workers</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Workers', value: activeWorkers.length, icon: Users, color: '#10b981' },
                        { label: 'Active/Approved', value: activeWorkers.filter(w => w.status === 'active' || w.status === 'approved').length, icon: CheckCircle, color: '#059669' },
                        { label: 'Inactive', value: activeWorkers.filter(w => w.status === 'inactive').length, icon: Clock, color: '#f59e0b' },
                        { label: 'Pending Apps', value: pendingWorkers.length, icon: UserPlus, color: '#8b5cf6' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg border border-emerald-50/50"
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
                                    style={{ backgroundColor: `${stat.color}15` }}
                                >
                                    <stat.icon size={24} style={{ color: stat.color }} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setSelectedTab('active')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all ${selectedTab === 'active'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm shadow-sm'
                            }`}
                    >
                        Active Workers ({activeWorkers.length})
                    </button>
                    <button
                        onClick={() => setSelectedTab('pending')}
                        className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${selectedTab === 'pending'
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : 'bg-white/80 text-gray-600 hover:bg-white backdrop-blur-sm shadow-sm'
                            }`}
                    >
                        Pending Registrations
                        {pendingWorkers.length > 0 && (
                            <span className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center shadow-sm">
                                {pendingWorkers.length}
                            </span>
                        )}
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search workers by name or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm rounded-xl border border-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                    />
                </div>

                {/* Active Workers Table */}
                {selectedTab === 'active' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100 overflow-hidden"
                    >
                        <table className="w-full">
                            <thead className="bg-gray-50/50 border-b border-emerald-100">
                                <tr>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Worker</th>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Zone</th>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Rating</th>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Tasks</th>
                                    <th className="text-left px-6 py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-50">
                                {filteredWorkers.map((worker) => (
                                    <tr key={worker.id} className="hover:bg-emerald-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-emerald-700 shadow-sm border border-emerald-200">
                                                    {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{worker.first_name} {worker.last_name}</p>
                                                    <p className="text-xs font-medium text-gray-500">{worker.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-gray-100 text-gray-800">
                                                {worker.zone}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${worker.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                worker.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                <span className={`w-2 h-2 rounded-full ${worker.status === 'active' ? 'bg-emerald-500' :
                                                    worker.status === 'busy' ? 'bg-amber-500' :
                                                        'bg-gray-400'
                                                    }`} />
                                                {worker.status.charAt(0).toUpperCase() + worker.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-lg border border-emerald-100">
                                                <Star size={14} className="text-emerald-400" fill="#10b981" />
                                                <span className="font-bold text-emerald-700 text-sm">New</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-gray-600">{worker.phone || 'N/A'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 rounded-lg transition-colors" title="Call">
                                                    <Phone size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 rounded-lg transition-colors" title="Track">
                                                    <MapPin size={18} />
                                                </button>
                                                <button className="p-2 hover:bg-emerald-100 text-gray-500 hover:text-emerald-600 rounded-lg transition-colors">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {/* Pending Registrations */}
                {selectedTab === 'pending' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        {loadingPending ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : pendingWorkers.length === 0 ? (
                            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 text-center shadow-md border border-emerald-50">
                                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-emerald-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">All caught up!</h3>
                                <p className="text-gray-500">No pending registrations to review.</p>
                            </div>
                        ) : (
                            pendingWorkers.map((worker) => (
                                <div key={worker.id} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-md border border-emerald-50">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center font-bold text-purple-600 text-lg shadow-sm border border-purple-200">
                                                {worker.first_name[0]}{worker.last_name[0]}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{worker.first_name} {worker.last_name}</h3>
                                                <p className="text-gray-500 text-sm font-medium">{worker.email}</p>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Phone size={12} />
                                                        {worker.phone}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} />
                                                        {worker.zone || 'Not specified'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase size={12} />
                                                        {worker.experience || 'Fresher'}
                                                    </span>
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                        Applied {formatDate(worker.joined_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleReject(worker.id)}
                                                disabled={actionLoading === worker.id}
                                                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <XCircle size={18} />
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApprove(worker.id)}
                                                disabled={actionLoading === worker.id}
                                                className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
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
                                </div>
                            ))
                        )}
                    </motion.div>
                )}
            </div>
        </div>
    );
}
