'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, MapPin, Clock, CheckCircle2, AlertTriangle, Shield, User,
    Copy, Check, ExternalLink, Calendar, HardHat, Sparkles, ChevronRight,
    Trash2, PackageOpen, Wind, Cpu, Leaf, Droplets, Bug, Flame, Car, FileWarning, Zap,
    LucideIcon
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Report, WasteCategory, STATUS_CONFIG, WASTE_CATEGORIES } from '@/types';
import toast from 'react-hot-toast';

// Icon mapping
const categoryIcons: Record<string, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
    sewage_overflow: Droplets,
    dead_animal: Bug,
    burning_waste: Flame,
    abandoned_vehicle: Car,
    hazardous_material: FileWarning,
    electrical_hazard: Zap,
};

interface ReportDetailModalProps {
    report: Report | null;
    onClose: () => void;
    onDelete?: (report: Report) => Promise<void> | void;
}

const STATUS_STEPS = [
    { key: 'submitted', label: 'Report Filed', desc: 'Received & queued' },
    { key: 'under_review', label: 'Under Review', desc: 'Inspected by authority' },
    { key: 'assigned', label: 'Assigned', desc: 'Crew dispatched' },
    { key: 'in_progress', label: 'In Progress', desc: 'Work underway' },
    { key: 'resolved', label: 'Resolved', desc: 'Cleaned & verified' },
];

export default function ReportDetailModal({ report, onClose, onDelete }: ReportDetailModalProps) {
    const [copied, setCopied] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    if (!report) return null;

    const category = WASTE_CATEGORIES[report.category] || {
        label: report.category ? report.category.replace('_', ' ') : 'General Waste',
        color: '#10b981'
    };
    const statusConfig = STATUS_CONFIG[report.status] || {
        label: report.status || 'Submitted',
        color: '#3b82f6',
        bgColor: 'rgba(59, 130, 246, 0.1)'
    };

    const CategoryIcon = categoryIcons[report.category] || Trash2;

    const copyReportId = () => {
        if (!report.reportId) return;
        navigator.clipboard.writeText(report.reportId);
        setCopied(true);
        toast.success('Report ID copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
    };

    // Determine current status step index
    const getStepIndex = (status: string) => {
        switch (status) {
            case 'submitted': return 0;
            case 'under_review': return 1;
            case 'assigned': return 2;
            case 'in_progress': return 3;
            case 'resolved':
            case 'closed': return 4;
            default: return 0;
        }
    };

    const currentStepIndex = getStepIndex(report.status);

    let formattedDate = 'Recently';
    try {
        formattedDate = format(new Date(report.createdAt), 'PPP p');
    } catch {}

    const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-emerald-100 z-10 my-8 max-h-[90vh] flex flex-col"
                >
                    {/* Header with gradient banner */}
                    <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white flex-shrink-0">
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors backdrop-blur-sm"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-start gap-4 pr-10">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
                                <CategoryIcon size={30} className="text-white" />
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/25 text-white backdrop-blur-md"
                                    >
                                        {statusConfig.label}
                                    </span>
                                    <span className="text-xs text-emerald-100 font-medium">
                                        • {timeAgo}
                                    </span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                                    {category.label}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs sm:text-sm font-mono text-emerald-100 bg-white/10 px-2.5 py-0.5 rounded-md">
                                        {report.reportId}
                                    </span>
                                    <button
                                        onClick={copyReportId}
                                        className="text-emerald-100 hover:text-white transition-colors p-1"
                                        title="Copy Report ID"
                                    >
                                        {copied ? <Check size={14} className="text-emerald-200" /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Body */}
                    <div className="p-6 overflow-y-auto space-y-6">
                        {/* Status Progress Stepper */}
                        {report.status === 'rejected' ? (
                            <div className="bg-red-50 rounded-2xl p-4 sm:p-5 border border-red-200">
                                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                                    <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                                        <AlertTriangle size={14} /> Report Rejected · 0 Points Awarded
                                    </h3>
                                    <span className="text-xs font-semibold text-red-600 bg-white px-2.5 py-0.5 rounded-full border border-red-200">
                                        -25 Trust Score
                                    </span>
                                </div>
                                <p className="text-sm text-red-900/90">
                                    {report.rejectionReason || 'Field verification found no matching waste at this location.'}
                                </p>
                            </div>
                        ) : (
                        <div className="bg-gray-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                    Resolution Progress
                                </h3>
                                {!report.isAnonymous && (
                                    (report.pointsAwarded || report.status === 'resolved' || report.status === 'closed') ? (
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                            +20 Civic Points Earned
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                            Pending (+20 pts on resolution)
                                        </span>
                                    )
                                )}
                            </div>

                            <div className="relative">
                                {/* Connecting Bar */}
                                <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-gray-200 z-0">
                                    <div
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2 relative z-10">
                                    {STATUS_STEPS.map((step, idx) => {
                                        const isPast = idx < currentStepIndex;
                                        const isCurrent = idx === currentStepIndex;
                                        const isCompleted = isPast || isCurrent;

                                        return (
                                            <div
                                                key={step.key}
                                                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                                                    isCurrent
                                                        ? 'bg-white shadow-sm ring-1 ring-emerald-400'
                                                        : ''
                                                }`}
                                            >
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                                                        isCurrent
                                                            ? 'bg-emerald-500 text-white ring-4 ring-emerald-100 animate-pulse'
                                                            : isPast
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                    }`}
                                                >
                                                    {isPast || (isCurrent && report.status === 'resolved') ? (
                                                        <Check size={14} strokeWidth={3} />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </div>
                                                <p className={`text-xs font-bold leading-tight ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {step.label}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
                                                    {step.desc}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        )}

                        {/* Image Gallery */}
                        {report.images && report.images.length > 0 && (
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-emerald-500" /> Uploaded Photos ({report.images.length})
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {report.images.map((img, i) => (
                                        <div
                                            key={img.id || i}
                                            onClick={() => setSelectedImage(img.url)}
                                            className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 group cursor-pointer bg-gray-100 hover:shadow-md transition-all"
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Report photo ${i + 1}`}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
                                                Click to enlarge
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        {report.description && (
                            <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
                                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                                    Issue Description
                                </h3>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {report.description}
                                </p>
                            </div>
                        )}

                        {/* Location Details */}
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                Location Details
                            </h3>
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MapPin size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">
                                        {report.location?.address || 'Mumbai, Maharashtra'}
                                    </p>
                                    {report.location?.locality && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Locality: {report.location.locality}
                                        </p>
                                    )}
                                    {report.location?.latitude !== undefined && report.location?.longitude !== undefined && (
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[11px] font-mono text-gray-400">
                                                {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                                            </span>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${report.location.latitude},${report.location.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold hover:underline"
                                            >
                                                Open in Maps <ExternalLink size={12} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <span className="text-[11px] text-gray-400 font-medium block">Reported On</span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block truncate">
                                    {formattedDate}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                                <span className="text-[11px] text-gray-400 font-medium block">Priority Level</span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block capitalize flex items-center gap-1">
                                    <AlertTriangle size={14} className={report.severity === 'high' || report.severity === 'critical' ? 'text-red-500' : 'text-amber-500'} />
                                    {report.severity || 'Medium'}
                                </span>
                            </div>

                            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 col-span-2 sm:col-span-1">
                                <span className="text-[11px] text-gray-400 font-medium block">Submission Mode</span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-800 mt-0.5 block flex items-center gap-1">
                                    <Shield size={14} className="text-emerald-500" />
                                    {report.isAnonymous ? 'Anonymous' : 'Verified Citizen'}
                                </span>
                            </div>
                        </div>

                        {/* Assigned Team (if applicable) */}
                        {report.assignedTo && (
                            <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <HardHat size={15} className="text-blue-600" /> Assigned Municipal Unit
                                </h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                                        {report.assignedTo.workerName?.[0] || 'W'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {report.assignedTo.departmentName || 'Solid Waste Management'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Officer/Worker: {report.assignedTo.workerName || 'Field Assigned'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Resolution Details (if resolved) */}
                        {(report.status === 'resolved' || report.status === 'closed') && (
                            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
                                <div className="flex items-center gap-2 mb-2 text-emerald-800 font-bold">
                                    <CheckCircle2 size={18} className="text-emerald-600" />
                                    <span>Issue Resolved Successfully!</span>
                                </div>
                                <p className="text-sm text-emerald-900/80">
                                    {report.resolution?.notes || 'Municipal sanitation team has cleaned up and addressed this location.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-shrink-0 gap-3">
                        <span className="text-xs text-gray-400">
                            EnviroLink Citizen Tracking
                        </span>
                        <div className="flex items-center gap-2">
                            {onDelete && (
                                <button
                                    type="button"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        setIsDeleting(true);
                                        try {
                                            await onDelete(report);
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
                                >
                                    <Trash2 size={15} />
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-sm rounded-xl transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Lightbox Modal for Large Image */}
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={selectedImage}
                            alt="Full preview"
                            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                        />
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    );
}
