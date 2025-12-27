'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera, Upload, MapPin, Mic, X, Check, ChevronRight, ChevronLeft,
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, LucideIcon
} from 'lucide-react';
import { useAppStore } from '@/store';
import { WasteCategory, WASTE_CATEGORIES } from '@/types';
import Button from '@/components/ui/Button';
import BottomSheet from '@/components/ui/BottomSheet';

// Icon mapping
const categoryIcons: Record<WasteCategory, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
};

// Netflix-style animation variants
const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 100 : -100,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 100 : -100,
        opacity: 0,
        scale: 0.95,
    }),
};

export default function ReportForm() {
    const {
        isReportSheetOpen,
        setIsReportSheetOpen,
        newReport,
        updateNewReport,
        submitReport,
        isLoading
    } = useAppStore();

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const goToStep = (newStep: number) => {
        setDirection(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const imageUrls = Array.from(files).map(file => URL.createObjectURL(file));
            updateNewReport({ images: [...newReport.images, ...imageUrls] });
        }
    };

    const handleCategorySelect = (category: WasteCategory) => {
        updateNewReport({ category });
    };

    const handleSubmit = async () => {
        await submitReport();
        setStep(1);
    };

    const handleClose = () => {
        setIsReportSheetOpen(false);
        setTimeout(() => setStep(1), 300);
    };

    const canProceedToStep2 = newReport.images.length > 0;
    const canProceedToStep3 = newReport.category !== null;

    return (
        <BottomSheet
            isOpen={isReportSheetOpen}
            onClose={handleClose}
            title={step === 1 ? 'Report Waste' : step === 2 ? 'Select Category' : 'Review & Submit'}
        >
            <div className="px-6 py-4">
                {/* Progress Indicator */}
                <div className="flex gap-2 mb-6">
                    {[1, 2, 3].map((s) => (
                        <motion.div
                            key={s}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: s <= step ? 1 : 0.3 }}
                            transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    {/* Step 1: Image Capture */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
                            className="space-y-5"
                        >
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Take a photo or upload an image of the waste issue
                            </p>

                            {/* Image Preview Grid */}
                            {newReport.images.length > 0 && (
                                <motion.div
                                    className="grid grid-cols-3 gap-3"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    {newReport.images.map((url, index) => (
                                        <motion.div
                                            key={index}
                                            className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 shadow-md"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => updateNewReport({
                                                    images: newReport.images.filter((_, i) => i !== index)
                                                })}
                                                className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm"
                                            >
                                                <X size={14} />
                                            </motion.button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Capture Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { icon: Camera, label: 'Camera' },
                                    { icon: Upload, label: 'Gallery' },
                                ].map((item, index) => (
                                    <motion.button
                                        key={item.label}
                                        onClick={() => fileInputRef.current?.click()}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                                    >
                                        <item.icon size={32} className="text-gray-400" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{item.label}</span>
                                    </motion.button>
                                ))}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                capture="environment"
                                onChange={handleImageSelect}
                                className="hidden"
                            />

                            {/* Location Preview */}
                            <motion.div
                                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <MapPin size={22} className="text-emerald-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Current Location</p>
                                        <p className="text-xs text-gray-500">Auto-detected via GPS</p>
                                    </div>
                                    <ChevronRight size={18} className="text-gray-400" />
                                </div>
                            </motion.div>

                            <Button
                                fullWidth
                                size="lg"
                                disabled={!canProceedToStep2}
                                onClick={() => goToStep(2)}
                                rightIcon={<ChevronRight size={18} />}
                            >
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Step 2: Category Selection */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
                            className="space-y-5"
                        >
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Select the type of waste issue
                            </p>

                            <div className="grid grid-cols-3 gap-3">
                                {(Object.entries(WASTE_CATEGORIES) as [WasteCategory, typeof WASTE_CATEGORIES[WasteCategory]][]).map(
                                    ([key, value], index) => {
                                        const Icon = categoryIcons[key];
                                        const isSelected = newReport.category === key;

                                        return (
                                            <motion.button
                                                key={key}
                                                onClick={() => handleCategorySelect(key)}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                whileHover={{ scale: 1.05, y: -2 }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${isSelected
                                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 shadow-lg'
                                                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                    style={{ backgroundColor: `${value.color}15` }}
                                                >
                                                    <Icon size={24} style={{ color: value.color }} strokeWidth={2} />
                                                </div>
                                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 text-center">
                                                    {value.label}
                                                </span>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                                                    >
                                                        <Check size={14} className="text-white" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        );
                                    }
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description (optional)
                                </label>
                                <textarea
                                    value={newReport.description}
                                    onChange={(e) => updateNewReport({ description: e.target.value })}
                                    placeholder="Add any additional details..."
                                    rows={3}
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none resize-none"
                                />
                            </div>

                            {/* Voice Note Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                className="flex items-center gap-3 w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <Mic size={20} className="text-red-500" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Add voice note
                                </span>
                            </motion.button>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => goToStep(1)} className="flex-1">
                                    <ChevronLeft size={18} />
                                    Back
                                </Button>
                                <Button
                                    disabled={!canProceedToStep3}
                                    onClick={() => goToStep(3)}
                                    rightIcon={<ChevronRight size={18} />}
                                    className="flex-1"
                                >
                                    Continue
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Review & Submit */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            custom={direction}
                            variants={stepVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.4, ease: [0.165, 0.84, 0.44, 1] }}
                            className="space-y-5"
                        >
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Review your report before submitting
                            </p>

                            {/* Summary Card */}
                            <motion.div
                                className="bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {newReport.images[0] && (
                                    <div className="h-44 bg-gray-200 relative overflow-hidden">
                                        <motion.img
                                            src={newReport.images[0]}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.6 }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                                    </div>
                                )}

                                <div className="p-5 space-y-4">
                                    {/* Category */}
                                    {newReport.category && (
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: `${WASTE_CATEGORIES[newReport.category].color}15` }}
                                            >
                                                {(() => {
                                                    const Icon = categoryIcons[newReport.category];
                                                    return <Icon size={24} style={{ color: WASTE_CATEGORIES[newReport.category].color }} />;
                                                })()}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-white text-lg">
                                                {WASTE_CATEGORIES[newReport.category].label}
                                            </span>
                                        </div>
                                    )}

                                    {/* Location */}
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin size={16} />
                                        <span>Current location (auto-detected)</span>
                                    </div>

                                    {/* Description */}
                                    {newReport.description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 p-3 rounded-lg">
                                            {newReport.description}
                                        </p>
                                    )}
                                </div>
                            </motion.div>

                            {/* Anonymous Toggle */}
                            <label className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={newReport.isAnonymous}
                                    onChange={(e) => updateNewReport({ isAnonymous: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Submit anonymously
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Your identity will be hidden from public view
                                    </p>
                                </div>
                            </label>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => goToStep(2)} className="flex-1">
                                    <ChevronLeft size={18} />
                                    Back
                                </Button>
                                <Button
                                    isLoading={isLoading}
                                    onClick={handleSubmit}
                                    className="flex-1"
                                >
                                    Submit Report
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </BottomSheet>
    );
}
