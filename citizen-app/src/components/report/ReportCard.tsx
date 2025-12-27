'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronRight, Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, LucideIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Report, WasteCategory, STATUS_CONFIG, WASTE_CATEGORIES } from '@/types';
import clsx from 'clsx';

// Icon mapping
const categoryIcons: Record<WasteCategory, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
};

interface ReportCardProps {
    report: Report;
    onClick?: () => void;
    variant?: 'default' | 'compact';
}

export default function ReportCard({ report, onClick, variant = 'default' }: ReportCardProps) {
    const category = WASTE_CATEGORIES[report.category];
    const statusConfig = STATUS_CONFIG[report.status];
    const timeAgo = formatDistanceToNow(new Date(report.createdAt), { addSuffix: true });
    const CategoryIcon = categoryIcons[report.category];

    if (variant === 'compact') {
        return (
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4, scale: 1.01 }}
                transition={{ duration: 0.3 }}
                onClick={onClick}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 border-emerald-100 cursor-pointer transition-all hover:shadow-lg hover:border-emerald-300"
            >
                {/* Icon with colored bg */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: '#ecfdf5' }}
                >
                    <CategoryIcon size={22} style={{ color: '#059669' }} strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">
                            {report.reportId}
                        </p>
                        <span
                            className="px-2 py-0.5 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                        >
                            {statusConfig.label}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                        <MapPin size={12} />
                        {report.location?.locality || report.location?.address || 'Unknown'} · {timeAgo}
                    </p>
                </div>

                <ChevronRight size={18} className="text-emerald-400 flex-shrink-0" />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
            onClick={onClick}
            className="group bg-white rounded-2xl border-2 border-emerald-100 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:border-emerald-300 w-full max-w-full"
        >
            {/* Image / Icon Header */}
            <div className="relative h-40 lg:h-44 bg-gradient-to-br from-emerald-50 to-gray-50 overflow-hidden">
                {report.images && report.images[0] && report.images[0].url ? (
                    <motion.div
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url(${report.images[0].url})` }}
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.6 }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <motion.div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center bg-emerald-100"
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CategoryIcon size={40} style={{ color: '#059669' }} strokeWidth={1.5} />
                        </motion.div>
                    </div>
                )}

                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Status Badge */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md shadow-sm"
                    style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                >
                    {statusConfig.label}
                </motion.div>

                {/* Category Icon Badge */}
                <motion.div
                    className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                >
                    <CategoryIcon size={20} style={{ color: '#059669' }} strokeWidth={2} />
                </motion.div>
            </div>

            {/* Content */}
            <div className="p-4 lg:p-5 bg-white overflow-hidden">
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                        {category.label}
                    </h3>
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded flex-shrink-0 whitespace-nowrap">
                        {report.reportId}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 min-w-0">
                    <MapPin size={14} className="text-emerald-500 flex-shrink-0" />
                    <span className="truncate block">{report.location?.address || 'Location not specified'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={12} className="flex-shrink-0" />
                    <span>{timeAgo}</span>
                </div>

                {/* Progress indicator for in_progress */}
                {report.status === 'in_progress' && report.assignedTo && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 pt-4 border-t border-emerald-100"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600">
                                {report.assignedTo.workerName?.[0] || 'W'}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Assigned to</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {report.assignedTo.departmentName}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

