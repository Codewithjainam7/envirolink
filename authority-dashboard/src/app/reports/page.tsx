'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';
import {
    Search, Filter, Download, ChevronDown, MapPin, Clock,
    User, MoreVertical, Eye, UserPlus, CheckCircle, X,
    Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Report, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG, ReportStatus } from '@/types';
import FloatingBlobs from '@/components/FloatingBlobs';

// Extended mock data
const mockReports: Report[] = [
    {
        id: '1',
        reportId: 'RPT-2024-001',
        location: { latitude: 19.076, longitude: 72.877, address: '123 Marine Drive, Near Oberoi Hotel', locality: 'Churchgate', city: 'Mumbai' },
        category: 'illegal_dumping',
        severity: 'high',
        status: 'submitted',
        isAnonymous: false,
        reporterName: 'Rahul Sharma',
        slaHours: 24,
        slaDueAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '2',
        reportId: 'RPT-2024-002',
        location: { latitude: 19.082, longitude: 72.881, address: '45 Linking Road, Bandra West', locality: 'Bandra', city: 'Mumbai' },
        category: 'overflowing_bin',
        severity: 'medium',
        status: 'in_progress',
        isAnonymous: true,
        assignedTo: { departmentId: 'd1', departmentName: 'Solid Waste Management', workerId: 'w1', workerName: 'Amit Kumar' },
        slaHours: 48,
        slaDueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '3',
        reportId: 'RPT-2024-003',
        location: { latitude: 19.065, longitude: 72.865, address: '78 Colaba Causeway', locality: 'Colaba', city: 'Mumbai' },
        category: 'construction_debris',
        severity: 'critical',
        status: 'submitted',
        isAnonymous: false,
        reporterName: 'Priya Mehta',
        slaHours: 6,
        slaDueAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: true,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '4',
        reportId: 'RPT-2024-004',
        location: { latitude: 19.055, longitude: 72.855, address: 'Gateway of India, Apollo Bunder', locality: 'South Mumbai', city: 'Mumbai' },
        category: 'littering',
        severity: 'low',
        status: 'resolved',
        isAnonymous: false,
        reporterName: 'Vikram Singh',
        assignedTo: { departmentId: 'd1', departmentName: 'SWM Zone 1', workerId: 'w2', workerName: 'Rajesh Patil' },
        slaHours: 72,
        slaDueAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
        id: '5',
        reportId: 'RPT-2024-005',
        location: { latitude: 19.095, longitude: 72.895, address: '21 Juhu Beach Road', locality: 'Juhu', city: 'Mumbai' },
        category: 'e_waste',
        severity: 'medium',
        status: 'assigned',
        isAnonymous: true,
        assignedTo: { departmentId: 'd2', departmentName: 'E-Waste Division', workerId: 'w3', workerName: 'Suresh Nair' },
        slaHours: 48,
        slaDueAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        isSlaBreach: false,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    },
];

const statusFilters: { key: ReportStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All Reports' },
    { key: 'submitted', label: 'New' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
];

export default function ReportsPage() {
    const [mounted, setMounted] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [activeFilter, setActiveFilter] = useState<ReportStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const supabase = createClient();
                const { data: reportsData, error: reportsError } = await supabase
                    .from('reports')
                    .select('*');

                if (reportsError) throw reportsError;

                const { data: imagesData } = await supabase
                    .from('report_images')
                    .select('*');

                const mappedReports: Report[] = (reportsData || []).map((r: any) => ({
                    id: r.id,
                    reportId: r.report_id,
                    location: {
                        latitude: r.latitude,
                        longitude: r.longitude,
                        address: r.address,
                        locality: r.locality,
                        city: r.city
                    },
                    category: r.category,
                    severity: r.severity,
                    status: r.status,
                    description: r.description,
                    reporterName: 'Anonymous',
                    isAnonymous: r.is_anonymous,
                    assignedTo: r.assigned_department_id ? {
                        departmentId: r.assigned_department_id,
                        departmentName: r.assigned_department_name,
                        workerId: r.assigned_worker_id,
                        workerName: r.assigned_worker_name
                    } : undefined,
                    slaHours: r.sla_hours,
                    slaDueAt: r.sla_due_at,
                    isSlaBreach: r.is_sla_breach,
                    createdAt: r.created_at,
                    updatedAt: r.updated_at,
                    images: imagesData?.filter((img: any) => img.report_id === r.id).map((img: any) => ({
                        id: img.id,
                        url: img.url
                    })) || []
                }));

                setReports(mappedReports);
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            }
        };

        setMounted(true);
        fetchReports();

        const interval = setInterval(() => {
            // Logic to refresh reports could go here
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!mounted) return null;

    if (!mounted) return null;

    const filteredReports = reports.filter((report) => {
        const matchesStatus = activeFilter === 'all' || report.status === activeFilter;
        const matchesSearch =
            report.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (report.location.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        return matchesStatus && matchesSearch;
    });

    const toggleSelect = (id: string) => {
        setSelectedReports((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedReports.length === filteredReports.length) {
            setSelectedReports([]);
        } else {
            setSelectedReports(filteredReports.map((r) => r.id));
        }
    };

    return (
        <div className="space-y-6 relative pb-8">
            <FloatingBlobs />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {filteredReports.length} reports found
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-100 shadow-sm hover:bg-white hover:shadow-md transition-all">
                            <Download size={16} />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all">
                            <Filter size={16} />
                            Advanced Filter
                        </button>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
                    {/* Status Tabs */}
                    <div className="flex gap-2 p-2 border-b border-gray-100 overflow-x-auto bg-white/50">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeFilter === filter.key
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {filter.label}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${activeFilter === filter.key
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {filter.key === 'all'
                                        ? mockReports.length
                                        : mockReports.filter((r) => r.status === filter.key).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search and Bulk Actions */}
                    <div className="p-4 flex items-center justify-between gap-4 bg-white/50">
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by ID, location, or area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {selectedReports.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                            >
                                <span className="text-sm font-medium text-emerald-800">{selectedReports.length} selected</span>
                                <div className="h-4 w-px bg-emerald-200" />
                                <button className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors" title="Assign">
                                    <UserPlus size={16} />
                                </button>
                                <button className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors" title="Resolve">
                                    <CheckCircle size={16} />
                                </button>
                                <button
                                    onClick={() => setSelectedReports([])}
                                    className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors ml-1"
                                >
                                    <X size={16} />
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50 border-y border-gray-100">
                                    <th className="w-12 px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported</th>
                                    <th className="w-10 px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReports.map((report, index) => {
                                    const category = WASTE_CATEGORIES[report.category];
                                    const status = STATUS_CONFIG[report.status];
                                    const severity = SEVERITY_CONFIG[report.severity];
                                    const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });
                                    const isSelected = selectedReports.includes(report.id);

                                    return (
                                        <motion.tr
                                            key={report.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: index * 0.03 }}
                                            className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/60' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(report.id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm font-medium text-gray-900">{report.reportId}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3 max-w-[220px]">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                        <MapPin size={14} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">{report.location.locality}</p>
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">{report.location.address}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="p-2 rounded-lg bg-gray-50 text-gray-600 border border-gray-100">
                                                        {(() => {
                                                            const IconComponent = { Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle }[category.icon] || Trash2;
                                                            return <IconComponent size={16} style={{ color: category.color }} />;
                                                        })()}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-700">{category.label}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="px-2.5 py-1 rounded-full text-xs font-bold border"
                                                    style={{
                                                        backgroundColor: `${severity.color}10`,
                                                        color: severity.color,
                                                        borderColor: `${severity.color}30`
                                                    }}
                                                >
                                                    {severity.label.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit"
                                                    style={{
                                                        backgroundColor: status.bgColor,
                                                        color: status.color,
                                                        boxShadow: `0 0 0 1px ${status.color}20`
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.assignedTo ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 border border-white shadow-sm">
                                                            {report.assignedTo.workerName?.split(' ').map(n => n[0]).join('')}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{report.assignedTo.workerName}</p>
                                                            <p className="text-xs text-gray-500">{report.assignedTo.departmentName}</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {report.isSlaBreach ? (
                                                    <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100 w-fit">
                                                        <Clock size={12} />
                                                        Breached
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        {Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h left
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{timeAgo}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-sm text-gray-500 font-medium">
                            Showing 1-{filteredReports.length} of {filteredReports.length} reports
                        </p>
                        <div className="flex items-center gap-2">
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>Previous</button>
                            <button className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors hover:border-emerald-200 hover:text-emerald-700">Next</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
