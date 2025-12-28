'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Filter, Download, ChevronDown, MapPin, Clock,
    User, Eye, UserPlus, CheckCircle, X,
    Trash2, Package, Recycle, Construction, Cpu, Leaf, AlertTriangle,
    Calendar, Tag, Image as ImageIcon, Phone, Mail, Briefcase
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Report, WASTE_CATEGORIES, STATUS_CONFIG, SEVERITY_CONFIG, ReportStatus } from '@/types';
import FloatingBlobs from '@/components/FloatingBlobs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const statusFilters: { key: ReportStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All Reports' },
    { key: 'submitted', label: 'New' },
    { key: 'assigned', label: 'Assigned' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
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
function ReportDetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
    const category = WASTE_CATEGORIES[report.category] || { label: report.category, color: '#6b7280', icon: 'Trash2' };
    const status = STATUS_CONFIG[report.status] || { label: report.status, color: '#6b7280', bgColor: '#f3f4f6' };
    const severity = SEVERITY_CONFIG[report.severity] || { label: report.severity, color: '#6b7280' };

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
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                    <ImageIcon size={14} />
                                    Report Images
                                </p>
                                {report.images && report.images.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {report.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-200">
                                                <img
                                                    src={img.url}
                                                    alt={`Report image ${idx + 1}`}
                                                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                    onClick={() => window.open(img.url, '_blank')}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                        <ImageIcon size={32} className="mb-2" />
                                        <p className="text-sm">No images attached</p>
                                    </div>
                                )}
                            </div>

                            {/* Assigned Worker */}
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                    <User size={14} />
                                    Assigned Worker
                                </p>
                                {report.assignedTo ? (
                                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                                                {report.assignedTo.workerName?.split(' ').map(n => n[0]).join('') || 'W'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">{report.assignedTo.workerName || 'Worker'}</p>
                                                <p className="text-sm text-emerald-600 font-medium">{report.assignedTo.departmentName || 'Department'}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Briefcase size={14} className="text-gray-400" />
                                                <span>ID: {report.assignedTo.workerId?.slice(0, 8) || 'N/A'}</span>
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
                    {!report.assignedTo && (
                        <button className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                            <UserPlus size={18} />
                            Assign Worker
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function ReportsPage() {
    const [mounted, setMounted] = useState(false);
    const [reports, setReports] = useState<Report[]>([]);
    const [activeFilter, setActiveFilter] = useState<ReportStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReports, setSelectedReports] = useState<string[]>([]);
    const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [advancedFilters, setAdvancedFilters] = useState({
        category: '',
        severity: '',
        dateFrom: '',
        dateTo: '',
        slaBreachOnly: false,
    });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const supabase = createClient();
                const { data: reportsData, error: reportsError } = await supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false });

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
                    assignedTo: r.assigned_department_id ? {
                        departmentId: r.assigned_department_id,
                        departmentName: r.assigned_department_name || 'Department',
                        workerId: r.assigned_worker_id,
                        workerName: r.assigned_worker_name || 'Worker'
                    } : undefined,
                    slaHours: r.sla_hours || 24,
                    slaDueAt: r.sla_due_at || new Date(new Date(r.created_at).getTime() + 24 * 60 * 60 * 1000).toISOString(),
                    isSlaBreach: r.is_sla_breach || false,
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

    // Enhanced PDF Export
    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for more space
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header with gradient effect
        doc.setFillColor(16, 185, 129);
        doc.rect(0, 0, pageWidth, 35, 'F');

        // Logo/Title
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('EnviroLink', 14, 18);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Reports Management System', 14, 26);

        // Report info box
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(14, 42, pageWidth - 28, 20, 3, 3, 'F');

        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text('Report Summary', 20, 50);

        doc.setTextColor(75, 85, 99);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${format(new Date(), 'PPPP')} at ${format(new Date(), 'pp')}`, 20, 56);
        doc.text(`Total Reports: ${filteredReports.length}`, 150, 50);
        doc.text(`SLA Breaches: ${filteredReports.filter(r => r.isSlaBreach).length}`, 150, 56);
        doc.text(`New Reports: ${filteredReports.filter(r => r.status === 'submitted').length}`, 220, 50);
        doc.text(`Resolved: ${filteredReports.filter(r => r.status === 'resolved').length}`, 220, 56);

        // Table data
        const tableData = filteredReports.map(report => {
            const category = WASTE_CATEGORIES[report.category] || { label: report.category };
            const status = STATUS_CONFIG[report.status] || { label: report.status };
            const severity = SEVERITY_CONFIG[report.severity] || { label: report.severity };

            return [
                report.reportId,
                `${report.location.locality || 'Unknown'}\n${report.location.city || 'Mumbai'}`,
                category.label,
                severity.label.toUpperCase(),
                status.label,
                report.assignedTo?.workerName || 'Unassigned',
                report.isSlaBreach ? 'BREACHED' : `${Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h left`,
                format(new Date(report.createdAt), 'MMM d, yyyy\nh:mm a')
            ];
        });

        autoTable(doc, {
            head: [['Report ID', 'Location', 'Category', 'Severity', 'Status', 'Assigned To', 'SLA', 'Reported']],
            body: tableData,
            startY: 68,
            styles: {
                fontSize: 8,
                cellPadding: 3,
                lineColor: [229, 231, 235],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [16, 185, 129],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 25 },
                1: { cellWidth: 40 },
                2: { cellWidth: 30 },
                3: { halign: 'center', cellWidth: 22 },
                4: { halign: 'center', cellWidth: 25 },
                5: { cellWidth: 35 },
                6: { halign: 'center', cellWidth: 22 },
                7: { cellWidth: 30 },
            },
            didParseCell: (data) => {
                // Color severity cells
                if (data.column.index === 3 && data.section === 'body') {
                    const val = data.cell.raw?.toString().toLowerCase();
                    if (val === 'critical') {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (val === 'high') {
                        data.cell.styles.textColor = [234, 88, 12];
                    } else if (val === 'medium') {
                        data.cell.styles.textColor = [202, 138, 4];
                    }
                }
                // Color SLA breach cells
                if (data.column.index === 6 && data.section === 'body') {
                    if (data.cell.raw?.toString().includes('BREACH')) {
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [254, 226, 226];
                    }
                }
            }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(
                `Page ${i} of ${pageCount} | EnviroLink Reports - ${format(new Date(), 'yyyy-MM-dd')}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`EnviroLink-Reports-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
    };

    return (
        <div className="space-y-6 relative pb-8">
            <FloatingBlobs />

            {/* Report Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <ReportDetailModal
                        report={selectedReport}
                        onClose={() => setSelectedReport(null)}
                    />
                )}
            </AnimatePresence>

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
                        <button
                            onClick={exportToPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-700 rounded-xl font-medium text-sm border border-emerald-100 shadow-sm hover:bg-white hover:shadow-md transition-all"
                        >
                            <Download size={16} />
                            Export PDF
                        </button>
                        <button
                            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm shadow-lg transition-all ${hasActiveAdvancedFilters
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
                                    {getStatusCount(filter.key)}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search */}
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
                                    <th className="w-12 px-4 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                        />
                                    </th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report ID</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reported</th>
                                    <th className="w-24 px-4 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
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
                                                transition={{ delay: index * 0.02 }}
                                                className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-emerald-50/60' : ''}`}
                                            >
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelect(report.id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <span className="font-mono text-sm font-medium text-gray-900">{report.reportId}</span>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                            <MapPin size={12} className="text-emerald-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
                                                                {report.location.locality || 'Unknown'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{report.location.city || 'Mumbai'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
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
                                                <td className="px-4 py-4">
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs font-bold border"
                                                        style={{
                                                            backgroundColor: `${severity.color}10`,
                                                            color: severity.color,
                                                            borderColor: `${severity.color}30`
                                                        }}
                                                    >
                                                        {severity.label.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4">
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
                                                </td>
                                                <td className="px-4 py-4">
                                                    {report.isSlaBreach ? (
                                                        <span className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 px-2 py-1 rounded-md border border-red-100 w-fit">
                                                            <Clock size={12} />
                                                            Breached
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                            {Math.max(0, Math.round((new Date(report.slaDueAt).getTime() - Date.now()) / (1000 * 60 * 60)))}h left
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{timeAgo}</p>
                                                        <p className="text-xs text-gray-500">{format(new Date(report.createdAt), 'MMM d, h:mm a')}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedReport(report)}
                                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 mx-auto"
                                                    >
                                                        <Eye size={14} />
                                                        Details
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        );
                                    })
                                )}
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
