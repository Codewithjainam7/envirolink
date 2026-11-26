'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Download, ChevronDown, MapPin, Clock,
    User, Users, Check, Eye, UserPlus, CheckCircle, X,
    Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle,
    Calendar, Tag, Image as ImageIcon, Phone, Mail, Briefcase
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Report, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG, ReportStatus } from '@/types';
import { encodeCrewIds, parseCrewIds, formatCrewDepartmentName, parseBackupRequest } from '@/lib/crew';
import FloatingBlobs from '@/components/FloatingBlobs';
import { exportReportsManagementPDF } from '@/lib/pdfExport';

const statusFilters: { key: ReportStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All Reports' },
    { key: 'submitted', label: 'New' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'rejected', label: 'Rejected' },
];

const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'illegal_dumping', label: 'Illegal Dumping' },
    { value: 'overflowing_bin', label: 'Overflowing Bin' },
    { value: 'littering', label: 'Littering' },
    { value: 'construction_debris', label: 'Construction Debris' },
    { value: 'e_waste', label: 'E-Waste' },
    { value: 'organic_waste', label: 'Organic Waste' },
    { value: 'hazardous_waste', label: 'Hazardous Waste' },
];

const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

// Detail Modal Component
function ReportDetailModal({
    report,
    onClose,
    onAssign,
}: {
    report: Report;
    onClose: () => void;
    onAssign?: (report: Report) => void;
}) {
    const category = WASTE_CATEGORIES[report.category] || { label: report.category, color: '#6b7280', icon: 'Trash2' };
    const status = STATUS_CONFIG[report.status] || { label: report.status, color: '#6b7280', bgColor: '#f3f4f6' };
    const severity = SEVERITY_CONFIG[report.severity] || { label: report.severity, color: '#6b7280' };
    const backupReq = parseBackupRequest(report.assignedTo?.departmentName);
    const crewIds = parseCrewIds(report.assignedTo?.departmentId, report.assignedTo?.workerId);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold">Report Details</h2>
                            <p className="text-emerald-100 text-sm font-mono">{report.reportId}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Report Info */}
                        <div className="space-y-5">
                            {/* Status & Severity */}
                            <div className="flex items-center gap-3">
                                <span
                                    className="px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5"
                                    style={{
                                        backgroundColor: status.bgColor,
                                        color: status.color,
                                    }}
                                >
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
                                    {status.label}
                                </span>
                                <span
                                    className="px-3 py-1.5 rounded-full text-sm font-bold border"
                                    style={{
                                        backgroundColor: `${severity.color}10`,
                                        color: severity.color,
                                        borderColor: `${severity.color}30`
                                    }}
                                >
                                    {severity.label.toUpperCase()}
                                </span>
                            </div>

                            {/* Category */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Category</p>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white border border-gray-200">
                                        {(() => {
                                            const IconComponent = { Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle }[category.icon] || Trash2;
                                            return <IconComponent size={20} style={{ color: category.color }} />;
                                        })()}
                                    </div>
                                    <span className="font-semibold text-gray-900">{category.label}</span>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Location</p>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-50 mt-0.5">
                                        <MapPin size={18} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{report.location.locality || 'Unknown Area'}</p>
                                        <p className="text-sm text-gray-600 mt-0.5">{report.location.address}</p>
                                        <p className="text-xs text-gray-500 mt-1">{report.location.city || 'Mumbai'}</p>
                                        <p className="text-xs text-gray-400 font-mono mt-2">
                                            {report.location.latitude?.toFixed(6)}, {report.location.longitude?.toFixed(6)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {report.description && (
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</p>
                                    <p className="text-gray-700">{report.description}</p>
                                </div>
                            )}

                            {/* Worker Flag / Rejection Alert */}
                            {(report.rejectionReason || report.status === 'rejected') && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                    <p className="text-xs font-bold text-red-700 uppercase mb-1.5 flex items-center gap-1.5">
                                        <AlertTriangle size={14} className="text-red-600" />
                                        Worker Flagged · Nothing Found / Rejected
                                    </p>
                                    <p className="text-sm text-red-900 font-medium">
                                        {report.rejectionReason || 'Flagged by field worker as no waste found / invalid report.'}
                                    </p>
                                </div>
                            )}

                            {/* Timeline */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Timeline</p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Clock size={14} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Reported</p>
                                            <p className="text-xs text-gray-500">{format(new Date(report.createdAt), 'PPpp')}</p>
                                        </div>
                                    </div>
                                    {report.updatedAt !== report.createdAt && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                <CheckCircle size={14} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                                <p className="text-xs text-gray-500">{format(new Date(report.updatedAt), 'PPpp')}</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${report.isSlaBreach ? 'bg-red-100' : 'bg-amber-100'}`}>
                                            <AlertTriangle size={14} className={report.isSlaBreach ? 'text-red-600' : 'text-amber-600'} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">SLA Due</p>
                                            <p className={`text-xs ${report.isSlaBreach ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                {report.isSlaBreach ? 'BREACHED - ' : ''}{format(new Date(report.slaDueAt), 'PPpp')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Images & Worker */}
                        <div className="space-y-5">
                            {/* Images */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                        <ImageIcon size={14} />
                                        Report &amp; Verification Photos
                                    </p>
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                        <MapPin size={10} />
                                        GeoTagged Evidence
                                    </span>
                                </div>
                                {report.images && report.images.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {report.images.map((img, idx) => {
                                            const isWorkerProof = /worker-(resolved|nothing_found)/i.test(img.url || '');
                                            return (
                                                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-200">
                                                    <img
                                                        src={img.url}
                                                        alt={isWorkerProof ? `Worker Verification ${idx + 1}` : `Citizen Report ${idx + 1}`}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                        onClick={() => window.open(img.url, '_blank')}
                                                    />
                                                    <span
                                                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${
                                                            isWorkerProof
                                                                ? 'bg-emerald-600/90 text-white'
                                                                : 'bg-black/65 text-white'
                                                        }`}
                                                    >
                                                        {isWorkerProof ? 'Worker GeoTag Proof' : 'Citizen GeoTag'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                        <ImageIcon size={32} className="mb-2" />
                                        <p className="text-sm">No images attached</p>
                                    </div>
                                )}
                            </div>

                            {/* Backup Request Banner */}
                            {backupReq && (
                                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1.5">
                                                <Users size={14} className="text-amber-600" />
                                                Backup Crew Requested (+{backupReq.count} Workers)
                                            </p>
                                            <p className="text-sm text-amber-900 font-medium mt-1">
                                                {backupReq.reason}
                                            </p>
                                        </div>
                                        {onAssign && (
                                            <button
                                                onClick={() => onAssign(report)}
                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shrink-0 transition"
                                            >
                                                Add Backup
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Assigned Worker / Crew */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
                                        <Users size={14} />
                                        {crewIds.length > 1 ? `Assigned Crew (${crewIds.length} Workers)` : 'Assigned Worker'}
                                    </p>
                                    {crewIds.length > 1 && (
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                            Multi-Worker Team
                                        </span>
                                    )}
                                </div>
                                {report.assignedTo ? (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0">
                                                {crewIds.length > 1 ? `${crewIds.length}W` : (report.assignedTo.workerName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'W')}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-base leading-snug">{report.assignedTo.workerName || 'Worker'}</p>
                                                <p className="text-sm text-emerald-600 font-medium mt-0.5">{report.assignedTo.departmentName || 'Department'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Briefcase size={14} className="text-gray-400" />
                                                <span>Lead ID: {report.assignedTo.workerId?.slice(0, 8) || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-white rounded-xl border-2 border-dashed border-gray-200">
                                        <UserPlus size={32} className="mb-2" />
                                        <p className="text-sm font-medium">Not yet assigned</p>
                                        <p className="text-xs mt-1">Awaiting assignment</p>
                                    </div>
                                )}
                            </div>

                            {/* Reporter Info */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reporter</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User size={18} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {report.isAnonymous ? 'Anonymous Reporter' : (report.reporterName || 'Citizen')}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {report.isAnonymous ? 'Identity protected' : 'Registered user'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                    {!['resolved', 'rejected', 'closed'].includes(report.status) && onAssign && (
                        <button
                            onClick={() => onAssign(report)}
                            className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                            <Users size={18} />
                            {report.assignedTo ? 'Manage / Add Crew' : 'Assign Worker / Crew'}
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

interface Worker {
    id: string;
    first_name: string;
    last_name: string;
    zone: string;
    phone: string;
    status: string;
}

export default function ReportsPage() {
    const [mounted, setMounted] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [activeFilter, setActiveFilter] = useState<ReportStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
    const [selectedAssignWorkerIds, setSelectedAssignWorkerIds] = useState<string[]>([]);
    const [assignSuccessState, setAssignSuccessState] = useState(false);
    const [statusBanner, setStatusBanner] = useState<{ id: number; type: 'success' | 'error'; message: string } | null>(null);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);

    const notifyBanner = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setStatusBanner({ id, type, message });
        setTimeout(() => {
            setStatusBanner((prev) => (prev?.id === id ? null : prev));
        }, 4200);
    };
    const [advancedFilters, setAdvancedFilters] = useState({
        category: '',
        severity: '',
        dateFrom: '',
        dateTo: '',
        slaBreachOnly: false,
    });

    const fetchReports = async () => {
        try {
            const supabase = createClient();
            const { data: reportsData, error: reportsError } = await supabase
                .from('reports')
                .select('*, report_images(*)')
                .order('created_at', { ascending: false });

            if (reportsError) throw reportsError;

            const mappedReports: Report[] = (reportsData || []).map((r: any) => ({
                id: r.id,
                reportId: r.report_id,
                location: {
                    latitude: r.latitude,
                    longitude: r.longitude,
                    address: r.address || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`,
                    locality: r.locality || r.address?.split(',')[0] || 'Unknown',
                    city: r.city || 'Mumbai'
                },
                category: r.category,
                severity: r.severity,
                status: r.status,
                description: r.description,
                reporterName: r.is_anonymous ? 'Anonymous' : 'Citizen',
                isAnonymous: r.is_anonymous,
                assignedTo: (r.assigned_worker_id || r.assigned_department_id) ? {
                    departmentId: r.assigned_department_id,
                    departmentName: r.assigned_department_name || 'Waste Management',
                    workerId: r.assigned_worker_id,
                    workerName: r.assigned_worker_name || 'Assigned Worker'
                } : undefined,
                slaHours: r.sla_hours || 24,
                slaDueAt: r.sla_due_at || new Date(new Date(r.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
                isSlaBreach: r.is_sla_breach || false,
                requiresReview: Boolean(r.requires_review),
                rejectionReason: r.rejection_reason || undefined,
                createdAt: r.created_at,
                updatedAt: r.updated_at,
                images: (r.report_images || []).map((img: any) => ({
                    id: img.id,
                    url: img.url
                }))
            }));

            setReports(mappedReports);
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        }
    };

    useEffect(() => {
        setMounted(true);
        fetchReports();

        const interval = setInterval(fetchReports, 15000);
        const onFocus = () => fetchReports();
        window.addEventListener('focus', onFocus);

        const supabase = createClient();
        const channel = supabase
            .channel('authority-reports-page-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => {
                    fetchReports();
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
            supabase.removeChannel(channel);
        };
    }, []);

    if (!mounted) return null;

    // Apply all filters
    const filteredReports = reports.filter((report) => {
        const matchesStatus = activeFilter === 'all' || report.status === activeFilter;
        const matchesSearch =
            report.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (report.location.address?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
            (report.location.locality?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
        const matchesCategory = !advancedFilters.category || report.category === advancedFilters.category;
        const matchesSeverity = !advancedFilters.severity || report.severity === advancedFilters.severity;
        const matchesSlaBreach = !advancedFilters.slaBreachOnly || report.isSlaBreach;

        let matchesDateFrom = true;
        let matchesDateTo = true;
        if (advancedFilters.dateFrom) {
            matchesDateFrom = new Date(report.createdAt) >= new Date(advancedFilters.dateFrom);
        }
        if (advancedFilters.dateTo) {
            matchesDateTo = new Date(report.createdAt) <= new Date(advancedFilters.dateTo + 'T23:59:59');
        }

        return matchesStatus && matchesSearch && matchesCategory && matchesSeverity && matchesSlaBreach && matchesDateFrom && matchesDateTo;
    });

    const getStatusCount = (status: ReportStatus | 'all') => {
        if (status === 'all') return reports.length;
        return reports.filter(r => r.status === status).length;
    };

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

    const clearAdvancedFilters = () => {
        setAdvancedFilters({
            category: '',
            severity: '',
            dateFrom: '',
            dateTo: '',
            slaBreachOnly: false,
        });
    };

    const hasActiveAdvancedFilters =
        advancedFilters.category ||
        advancedFilters.severity ||
        advancedFilters.dateFrom ||
        advancedFilters.dateTo ||
        advancedFilters.slaBreachOnly;

    // Fetch available workers for assignment (newest first)
    const fetchWorkers = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('workers')
            .select('id, first_name, last_name, zone, phone, status, joined_at')
            .in('status', ['approved', 'active', 'available'])
            .order('joined_at', { ascending: false });

        if (!error && data) {
            setAvailableWorkers(data);
        }
    };

    // Handle bulk assign - opens modal with multi-worker selection
    const handleBulkAssign = async () => {
        if (selectedReports.length === 0) return;

        await fetchWorkers();
        if (selectedReports.length === 1) {
            const target = reports.find((r) => r.id === selectedReports[0]);
            setSelectedAssignWorkerIds(
                target ? parseCrewIds(target.assignedTo?.departmentId, target.assignedTo?.workerId) : []
            );
        } else {
            setSelectedAssignWorkerIds([]);
        }
        setShowAssignModal(true);
    };

    const toggleAssignWorker = (workerId: string) => {
        setSelectedAssignWorkerIds((prev) =>
            prev.includes(workerId) ? prev.filter((id) => id !== workerId) : [...prev, workerId]
        );
    };

    // Assign 1 or multiple selected workers (crew) to selected reports with animated confirmation
    const assignSelectedCrew = async () => {
        if (selectedAssignWorkerIds.length === 0) {
            notifyBanner('error', 'Select at least one worker to dispatch.');
            return;
        }
        const chosenWorkers = availableWorkers.filter((w) => selectedAssignWorkerIds.includes(w.id));
        if (chosenWorkers.length === 0) return;

        const leadWorker = chosenWorkers[0];
        const allNames = chosenWorkers.map((w) => `${w.first_name} ${w.last_name}`.trim()).join(', ');
        const deptId = encodeCrewIds(chosenWorkers.map((w) => w.id));
        const deptName = formatCrewDepartmentName(chosenWorkers.length);

        setBulkActionLoading(true);
        try {
            const supabase = createClient();

            const targetReports = reports.filter((r) => selectedReports.includes(r.id));
            const inProgressIds = targetReports.filter((r) => r.status === 'in_progress').map((r) => r.id);
            const pendingIds = targetReports.filter((r) => r.status !== 'in_progress').map((r) => r.id);

            if (pendingIds.length > 0) {
                const { error } = await supabase
                    .from('reports')
                    .update({
                        status: 'assigned',
                        assigned_worker_id: leadWorker.id,
                        assigned_worker_name: allNames,
                        assigned_department_id: deptId,
                        assigned_department_name: deptName,
                        updated_at: new Date().toISOString()
                    })
                    .in('id', pendingIds);
                if (error) throw error;
            }

            if (inProgressIds.length > 0) {
                const { error } = await supabase
                    .from('reports')
                    .update({
                        status: 'in_progress',
                        assigned_worker_id: leadWorker.id,
                        assigned_worker_name: allNames,
                        assigned_department_id: deptId,
                        assigned_department_name: deptName,
                        updated_at: new Date().toISOString()
                    })
                    .in('id', inProgressIds);
                if (error) throw error;
            }

            // Update local state immediately
            setReports(reports.map(r =>
                selectedReports.includes(r.id)
                    ? {
                        ...r,
                        status: (r.status === 'in_progress' ? 'in_progress' : 'assigned') as ReportStatus,
                        assignedTo: {
                            departmentId: deptId,
                            departmentName: deptName,
                            workerId: leadWorker.id,
                            workerName: allNames
                        }
                    }
                    : r
            ));

            // Brief smooth success transition inside the modal before closing
            setAssignSuccessState(true);
            await new Promise((resolve) => setTimeout(resolve, 650));

            setAssignSuccessState(false);
            setSelectedReports([]);
            setSelectedAssignWorkerIds([]);
            setShowAssignModal(false);
            notifyBanner(
                'success',
                `Dispatched ${chosenWorkers.length} worker(s) (${allNames}) to ${targetReports.length} report(s).`
            );
        } catch (err) {
            console.error('Error assigning reports:', err);
            notifyBanner('error', 'Failed to assign workers. Please try again.');
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Handle bulk resolve - marks selected reports as resolved
    const handleBulkResolve = async () => {
        if (selectedReports.length === 0) return;

        if (!confirm(`Are you sure you want to mark ${selectedReports.length} report(s) as resolved?`)) {
            return;
        }

        setBulkActionLoading(true);
        try {
            const supabase = createClient();

            const { error } = await supabase
                .from('reports')
                .update({
                    status: 'resolved',
                    updated_at: new Date().toISOString()
                })
                .in('id', selectedReports);

            if (error) throw error;

            setReports(reports.map(r =>
                selectedReports.includes(r.id)
                    ? { ...r, status: 'resolved' as ReportStatus }
                    : r
            ));

            const count = selectedReports.length;
            setSelectedReports([]);
            notifyBanner('success', `Successfully resolved ${count} report(s).`);
        } catch (err) {
            console.error('Error resolving reports:', err);
            notifyBanner('error', 'Failed to resolve reports. Please try again.');
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Delete one or multiple reports from Supabase
    const handleDeleteReports = async (reportIds: string[]) => {
        if (reportIds.length === 0) return;
        const msg = reportIds.length === 1
            ? 'Are you sure you want to permanently delete this report?'
            : `Are you sure you want to permanently delete ${reportIds.length} report(s)?`;
        if (!confirm(msg)) return;

        setBulkActionLoading(true);
        try {
            const supabase = createClient();

            await supabase
                .from('report_images')
                .delete()
                .in('report_id', reportIds);

            const { data: deletedRows, error } = await supabase
                .from('reports')
                .delete()
                .in('id', reportIds)
                .select('id');

            if (error) throw error;

            if (!deletedRows || deletedRows.length === 0) {
                notifyBanner('error', 'Delete blocked by Supabase RLS policy. Check DELETE RLS permissions.');
                return;
            }

            const deletedIds = new Set(deletedRows.map((r: any) => r.id));
            setReports(prev => prev.filter(r => !deletedIds.has(r.id)));
            setSelectedReports(prev => prev.filter(id => !deletedIds.has(id)));
            if (selectedReport && deletedIds.has(selectedReport.id)) {
                setSelectedReport(null);
            }
            notifyBanner('success', `Deleted ${deletedRows.length} report(s).`);
        } catch (err: any) {
            console.error('Error deleting reports:', err);
            notifyBanner('error', err?.message || 'Failed to delete reports. Please try again.');
        } finally {
            setBulkActionLoading(false);
        }
    };

    // Crisp full-width PDF Export using shared KPI + grid template
    const exportToPDF = () => {
        exportReportsManagementPDF(filteredReports);
        notifyBanner('success', `Exported ${filteredReports.length} report(s) to PDF.`);
    };

    return (
        <div className="space-y-6 relative pb-8">
            <FloatingBlobs />

            {/* Animated Status Toast Banner (replaces blocking native alert boxes) */}
            <AnimatePresence>
                {statusBanner && (
                    <motion.div
                        key={statusBanner.id}
                        initial={{ opacity: 0, y: -24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                        className={`fixed top-5 right-5 z-[60] max-w-md px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                            statusBanner.type === 'success'
                                ? 'bg-emerald-600/95 border-emerald-400 text-white'
                                : 'bg-red-600/95 border-red-400 text-white'
                        }`}
                    >
                        {statusBanner.type === 'success' ? (
                            <CheckCircle size={20} className="shrink-0" />
                        ) : (
                            <AlertTriangle size={20} className="shrink-0" />
                        )}
                        <p className="text-sm font-semibold leading-snug">{statusBanner.message}</p>
                        <button
                            type="button"
                            onClick={() => setStatusBanner(null)}
                            className="p-1 rounded-lg hover:bg-white/15 shrink-0"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <ReportDetailModal
                        report={selectedReport}
                        onClose={() => setSelectedReport(null)}
                        onAssign={async (r) => {
                            setSelectedReports([r.id]);
                            setSelectedReport(null);
                            await fetchWorkers();
                            setSelectedAssignWorkerIds(
                                parseCrewIds(r.assignedTo?.departmentId, r.assignedTo?.workerId)
                            );
                            setAssignSuccessState(false);
                            setShowAssignModal(true);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Animated Assign Worker / Crew Modal */}
            <AnimatePresence>
                {showAssignModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => !bulkActionLoading && setShowAssignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 18 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 12 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[82vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold">Assign Worker / Crew</h2>
                                        <p className="text-emerald-100 text-sm">
                                            Select 1 or multiple workers for {selectedReports.length} report(s)
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => !bulkActionLoading && setShowAssignModal(false)}
                                        className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Worker Multi-Select List */}
                            <div className="p-4 max-h-[50vh] overflow-y-auto flex-1">
                                {availableWorkers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <User size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p className="font-medium">No workers available</p>
                                        <p className="text-sm mt-1">Please add workers in Worker Management</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2.5">
                                        {availableWorkers.map((worker, idx) => {
                                            const selectionIndex = selectedAssignWorkerIds.indexOf(worker.id);
                                            const checked = selectionIndex !== -1;
                                            return (
                                                <motion.button
                                                    key={worker.id}
                                                    type="button"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                                                    whileHover={{ x: 2 }}
                                                    whileTap={{ scale: 0.985 }}
                                                    onClick={() => toggleAssignWorker(worker.id)}
                                                    disabled={bulkActionLoading || assignSuccessState}
                                                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl transition-colors border-2 disabled:opacity-70 ${
                                                        checked
                                                            ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
                                                            : 'bg-gray-50/80 hover:bg-emerald-50/40 border-gray-200'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                            checked
                                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                : 'bg-white border-gray-300'
                                                        }`}
                                                    >
                                                        <AnimatePresence>
                                                            {checked && (
                                                                <motion.span
                                                                    initial={{ scale: 0, rotate: -45 }}
                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                    exit={{ scale: 0 }}
                                                                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                                                                >
                                                                    <Check size={14} strokeWidth={3} />
                                                                </motion.span>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-base font-bold text-white shadow-sm shrink-0">
                                                        {worker.first_name[0]}{worker.last_name?.[0] || ''}
                                                    </div>
                                                    <div className="flex-1 text-left min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-900 truncate">{worker.first_name} {worker.last_name}</p>
                                                            <AnimatePresence>
                                                                {checked && (
                                                                    <motion.span
                                                                        initial={{ opacity: 0, scale: 0.75 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.75 }}
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                            selectionIndex === 0
                                                                                ? 'bg-emerald-600 text-white'
                                                                                : 'bg-emerald-100 text-emerald-800'
                                                                        }`}
                                                                    >
                                                                        {selectionIndex === 0 ? 'Lead' : `Crew #${selectionIndex + 1}`}
                                                                    </motion.span>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                                            Zone: {worker.zone || 'General'} • {worker.phone}
                                                        </p>
                                                    </div>
                                                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${worker.status === 'active'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {worker.status}
                                                    </div>
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                                <motion.span
                                    key={selectedAssignWorkerIds.length}
                                    initial={{ scale: 0.92 }}
                                    animate={{ scale: 1 }}
                                    className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg"
                                >
                                    {selectedAssignWorkerIds.length === 0
                                        ? 'Pick 1+ workers'
                                        : selectedAssignWorkerIds.length === 1
                                        ? '1 worker selected'
                                        : `Crew of ${selectedAssignWorkerIds.length} workers`}
                                </motion.span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowAssignModal(false)}
                                        disabled={bulkActionLoading || assignSuccessState}
                                        className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors text-sm disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={assignSelectedCrew}
                                        disabled={bulkActionLoading || assignSuccessState || selectedAssignWorkerIds.length === 0}
                                        className={`px-5 py-2.5 rounded-xl font-bold transition-all text-sm disabled:opacity-60 flex items-center gap-2 shadow-md ${
                                            assignSuccessState
                                                ? 'bg-emerald-500 text-white'
                                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        }`}
                                    >
                                        {assignSuccessState ? (
                                            <>
                                                <motion.span
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                                                >
                                                    <CheckCircle size={16} />
                                                </motion.span>
                                                Dispatched!
                                            </>
                                        ) : bulkActionLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Users size={16} />
                                                {selectedAssignWorkerIds.length > 1
                                                    ? `Assign Crew (${selectedAssignWorkerIds.length})`
                                                    : 'Assign Worker'}
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports Management</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            {filteredReports.length} reports found
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-200 shadow-sm hover:bg-white hover:shadow-md transition-all"
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                        <button
                            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-lg transition-all ${hasActiveAdvancedFilters
                                ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                                : 'bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600'
                                }`}
                        >
                            <Filter size={16} />
                            Advanced Filter
                            {hasActiveAdvancedFilters && (
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Filter Panel */}
                <AnimatePresence>
                    {showAdvancedFilter && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 overflow-hidden"
                        >
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-100 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Filter size={18} className="text-emerald-600" />
                                        Advanced Filters
                                    </h3>
                                    <button
                                        onClick={clearAdvancedFilters}
                                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        Clear All
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            <Tag size={12} className="inline mr-1" />
                                            Category
                                        </label>
                                        <select
                                            value={advancedFilters.category}
                                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, category: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        >
                                            {categoryOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            <AlertTriangle size={12} className="inline mr-1" />
                                            Severity
                                        </label>
                                        <select
                                            value={advancedFilters.severity}
                                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, severity: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        >
                                            {severityOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            <Calendar size={12} className="inline mr-1" />
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={advancedFilters.dateFrom}
                                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateFrom: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            <Calendar size={12} className="inline mr-1" />
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={advancedFilters.dateTo}
                                            onChange={(e) => setAdvancedFilters({ ...advancedFilters, dateTo: e.target.value })}
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={advancedFilters.slaBreachOnly}
                                                onChange={(e) => setAdvancedFilters({ ...advancedFilters, slaBreachOnly: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">SLA Breached Only</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
                    {/* Status Tabs */}
                    <div className="flex gap-2 p-3 border-b border-gray-100 overflow-x-auto bg-white/60">
                        {statusFilters.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => setActiveFilter(filter.key)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all whitespace-nowrap shrink-0 ${activeFilter === filter.key
                                    ? 'bg-emerald-50 text-emerald-700 shadow-sm ring-1 ring-emerald-200'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                {filter.label}
                                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-bold ${activeFilter === filter.key
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {getStatusCount(filter.key)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search & Selection Bar */}
                    <div className="p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 bg-white/50">
                        <div className="relative flex-1 min-w-[240px] max-w-md">
                            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by ID, location, or area..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        {selectedReports.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-wrap items-center gap-2 sm:gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"
                            >
                                <span className="text-sm font-bold text-emerald-800 whitespace-nowrap">{selectedReports.length} selected</span>
                                <div className="h-5 w-px bg-emerald-200 hidden sm:block" />
                                <button
                                    onClick={handleBulkAssign}
                                    disabled={bulkActionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    <UserPlus size={16} />
                                    Assign
                                </button>
                                <button
                                    onClick={handleBulkResolve}
                                    disabled={bulkActionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    <CheckCircle size={16} />
                                    Resolve
                                </button>
                                <button
                                    onClick={() => handleDeleteReports(selectedReports)}
                                    disabled={bulkActionLoading}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                                <button
                                    onClick={() => setSelectedReports([])}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium ml-1"
                                >
                                    <X size={16} />
                                    Clear
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[960px]">
                            <thead>
                                <tr className="bg-gray-50/70 border-y border-gray-100">
                                    <th className="w-12 px-4 sm:px-5 py-3.5 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Report ID</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Severity</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">SLA</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Reported</th>
                                    <th className="px-4 sm:px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <Search size={24} className="text-gray-400" />
                                                </div>
                                                <p className="text-gray-500 font-medium">No reports found</p>
                                                <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReports.map((report, index) => {
                                        const category = WASTE_CATEGORIES[report.category] || { label: report.category, color: '#6b7280', icon: 'Trash2' };
                                        const status = STATUS_CONFIG[report.status] || { label: report.status, color: '#6b7280', bgColor: '#f3f4f6' };
                                        const severity = SEVERITY_CONFIG[report.severity] || { label: report.severity, color: '#6b7280' };
                                        const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });
                                        const isSelected = selectedReports.includes(report.id);

                                        return (
                                            <motion.tr
                                                key={report.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: Math.min(index * 0.015, 0.25) }}
                                                className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-emerald-50/60' : ''}`}
                                            >
                                                <td className="px-4 sm:px-5 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(report.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-sm font-medium text-gray-900">{report.reportId}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <MapPin size={12} className="text-emerald-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate max-w-[170px]">
                                                                {report.location.locality || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500 truncate max-w-[170px]">{report.location.city || 'Mumbai'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <span className="p-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                                            {(() => {
                                                                const IconComponent = { Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle }[category.icon] || Trash2;
                                                                return <IconComponent size={14} style={{ color: category.color }} />;
                                                            })()}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-700">{category.label}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span
                                                        className="px-2.5 py-0.5 rounded-full text-xs font-bold border inline-block"
                                                        style={{
                                                            backgroundColor: `${severity.color}10`,
                                                            color: severity.color,
                                                            borderColor: `${severity.color}30`
                                                        }}
                                                    >
                                                        {severity.label.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        <span
                                                            className="px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit"
                                                            style={{
                                                                backgroundColor: status.bgColor,
                                                                color: status.color,
                                                            }}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                                                            {status.label}
                                                        </span>
                                                        {(() => {
                                                            const bReq = parseBackupRequest(report.assignedTo?.departmentName);
                                                            const crewCount = parseCrewIds(report.assignedTo?.departmentId, report.assignedTo?.workerId).length;
                                                            if (bReq) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                                        <Users size={10} /> Backup +{bReq.count}
                                                                    </span>
                                                                );
                                                            }
                                                            if (crewCount > 1) {
                                                                return (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                        <Users size={10} /> Crew ({crewCount})
                                                                    </span>
                                                                );
                                                            }
                                                            return null;
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {report.isSlaBreach ? (
                                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-md border border-red-100 w-fit">
                                                            <Clock size={12} />
                                                            Breached
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs font-medium bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 inline-block">
                                                            {Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h left
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{timeAgo}</p>
                                                        <p className="text-xs text-gray-500">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-5 py-4 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedReport(report)}
                                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Eye size={14} />
                                                            Details
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteReports([report.id])}
                                                            disabled={bulkActionLoading}
                                                            title="Delete Report"
                                                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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
