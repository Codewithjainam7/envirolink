'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Camera, MapPin, Mic, MicOff, Upload, CheckCircle2,
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, User, Phone, Mail, Send,
    Loader2, Navigation, X, Sparkles, ChevronRight, ChevronLeft, Image,
    Droplets, Bug, Flame, Car, FileWarning, Zap, AlertTriangle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/store';
import { Report, WasteCategory } from '@/types';

const CATEGORIES = [
    { id: 'illegal_dumping', label: 'Illegal Dumping', icon: Trash2, color: '#ef4444', description: 'Unauthorized disposal of waste' },
    { id: 'overflowing_bin', label: 'Overflowing Bin', icon: PackageOpen, color: '#f59e0b', description: 'Public bin needs emptying' },
    { id: 'littering', label: 'Littering', icon: Wind, color: '#8b5cf6', description: 'Scattered trash on roads/parks' },
    { id: 'construction_debris', label: 'Construction Debris', icon: HardHat, color: '#f97316', description: 'Building materials left on site' },
    { id: 'e_waste', label: 'E-Waste', icon: Cpu, color: '#3b82f6', description: 'Electronic waste disposal' },
    { id: 'organic_waste', label: 'Organic Waste', icon: Leaf, color: '#10b981', description: 'Food/garden waste issues' },
    { id: 'sewage_overflow', label: 'Sewage Overflow', icon: Droplets, color: '#06b6d4', description: 'Drainage/sewer problems' },
    { id: 'dead_animal', label: 'Dead Animal', icon: Bug, color: '#84cc16', description: 'Animal carcass on road' },
    { id: 'burning_waste', label: 'Burning Waste', icon: Flame, color: '#dc2626', description: 'Illegal waste burning' },
    { id: 'abandoned_vehicle', label: 'Abandoned Vehicle', icon: Car, color: '#6366f1', description: 'Deserted vehicles' },
    { id: 'hazardous_material', label: 'Hazardous Material', icon: FileWarning, color: '#eab308', description: 'Chemical/toxic waste' },
    { id: 'electrical_hazard', label: 'Electrical Hazard', icon: Zap, color: '#f43f5e', description: 'Fallen wires/exposed cables' },
];

const SEVERITY_OPTIONS = [
    { id: 'low', label: 'Low', color: '#10b981', icon: Clock, description: 'Can wait a few days' },
    { id: 'medium', label: 'Medium', color: '#f59e0b', icon: AlertTriangle, description: 'Needs attention soon' },
    { id: 'high', label: 'High', color: '#ef4444', icon: Flame, description: 'Urgent cleanup needed' },
];

const STEPS = ['Photos', 'Category', 'Details', 'Location', 'Review'];

export default function ReportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { reports, setReports, user, updateNewReport, submitReport, resetNewReport, fetchReports } = useAppStore();

    const [currentStep, setCurrentStep] = useState(0);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ topCategories: string[]; confidence: number; description: string } | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [voiceSupported, setVoiceSupported] = useState(true);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isTranscribing, setIsTranscribing] = useState(false);

    useEffect(() => {
        // Check if MediaRecorder is supported
        if (typeof window !== 'undefined') {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.log('MediaDevices not supported');
                setVoiceSupported(false);
            }
        }
    }, []);

    useEffect(() => { getCurrentLocation(); }, []);

    const getCurrentLocation = async () => {
        if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const data = await res.json();
                    setLocation({ lat: latitude, lng: longitude, address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
                } catch { setLocation({ lat: latitude, lng: longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }); }
                setIsGettingLocation(false);
                toast.success('Location detected!');
            },
            () => { setIsGettingLocation(false); toast.error('Enable GPS'); },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    // Analyze a single image
    const analyzeImage = async (file: File): Promise<{ valid: boolean; result?: any }> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const response = await fetch('/api/analyze-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64: reader.result })
                    });
                    const result = await response.json();

                    if (!result.isWasteRelated) {
                        toast.error(result.rejectionReason || 'Image rejected - not related to waste');
                        resolve({ valid: false });
                    } else {
                        resolve({ valid: true, result });
                    }
                } catch {
                    toast.error('Failed to analyze image');
                    resolve({ valid: false });
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        setIsAnalyzing(true);
        const validImages: File[] = [...images];
        const validPreviews: string[] = [...imagePreviews];
        let bestAnalysis: { topCategories: string[]; confidence: number; description: string } | null = aiAnalysis;

        // Analyze each new image
        for (const file of files) {
            if (validImages.length >= 5) break;

            const { valid, result } = await analyzeImage(file);

            if (valid && result) {
                validImages.push(file);
                validPreviews.push(URL.createObjectURL(file));

                // Update AI analysis with best result (highest confidence)
                if (!bestAnalysis || (result.confidence > bestAnalysis.confidence)) {
                    bestAnalysis = {
                        topCategories: result.topCategories || [],
                        confidence: result.confidence || 80,
                        description: result.description || ''
                    };
                }
            }
        }

        setImages(validImages);
        setImagePreviews(validPreviews);

        if (bestAnalysis && bestAnalysis.topCategories.length > 0) {
            setAiAnalysis(bestAnalysis);
            if (!category && bestAnalysis.topCategories[0]) {
                setCategory(bestAnalysis.topCategories[0]);
            }
            if (validImages.length > 0) {
                toast.success(`${validImages.length - images.length} valid image(s) added!`);
            }
        }

        setIsAnalyzing(false);
    };

    const removeImage = async (i: number) => {
        const newImages = images.filter((_, idx) => idx !== i);
        const newPreviews = imagePreviews.filter((_, idx) => idx !== i);

        setImages(newImages);
        setImagePreviews(newPreviews);

        // Re-analyze if we removed images and have remaining ones
        if (newImages.length > 0 && newImages.length < images.length) {
            setIsAnalyzing(true);
            // Re-analyze first remaining image
            const { valid, result } = await analyzeImage(newImages[0]);
            if (valid && result) {
                setAiAnalysis({
                    topCategories: result.topCategories || [],
                    confidence: result.confidence || 80,
                    description: result.description || ''
                });
                if (result.topCategories?.[0]) {
                    setCategory(result.topCategories[0]);
                }
            }
            setIsAnalyzing(false);
        } else if (newImages.length === 0) {
            // Clear analysis if no images left
            setAiAnalysis(null);
            setCategory('');
        }
    };

    const toggleRecording = async () => {
        if (!voiceSupported) {
            toast.error('Voice input unavailable. Please type your description.');
            return;
        }

        if (isRecording) {
            // Stop recording
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
        } else {
            // Start recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    // Stop all tracks
                    stream.getTracks().forEach(track => track.stop());

                    if (audioChunksRef.current.length === 0) {
                        toast.error('No audio recorded');
                        return;
                    }

                    // Convert to base64 and send to API
                    setIsTranscribing(true);
                    try {
                        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                        const reader = new FileReader();

                        reader.onloadend = async () => {
                            const base64Audio = reader.result as string;

                            try {
                                const response = await fetch('/api/speech-to-text', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ audioBase64: base64Audio })
                                });

                                const result = await response.json();

                                if (result.transcript && result.transcript.trim()) {
                                    setDescription(prev => (prev ? prev + ' ' : '') + result.transcript.trim());
                                    toast.success('Voice captured!');
                                } else {
                                    toast.error('No speech detected. Try again.');
                                }
                            } catch (err) {
                                console.error('Transcription error:', err);
                                toast.error('Failed to transcribe. Please type instead.');
                            }
                            setIsTranscribing(false);
                        };

                        reader.readAsDataURL(audioBlob);
                    } catch (err) {
                        console.error('Audio processing error:', err);
                        toast.error('Audio processing failed');
                        setIsTranscribing(false);
                    }
                };

                mediaRecorder.start();
                setIsRecording(true);
                toast.success('🎤 Recording... Tap again to stop');

                // Auto-stop after 30 seconds
                setTimeout(() => {
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                        mediaRecorderRef.current.stop();
                        setIsRecording(false);
                    }
                }, 30000);

            } catch (err: any) {
                console.error('Microphone access error:', err);
                if (err.name === 'NotAllowedError') {
                    toast.error('Microphone blocked. Enable it in browser settings.');
                } else {
                    toast.error('Could not access microphone.');
                }
                setVoiceSupported(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!location || !category || !images.length) { toast.error('Complete all fields'); return; }
        setIsSubmitting(true);
        try {
            // Convert images to base64 for Supabase storage
            const base64Images = await Promise.all(
                images.map(file => new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                }))
            );

            // Extract locality from address
            const addressParts = location.address.split(',');
            const locality = addressParts[0]?.trim() || 'Unknown';

            // Update store's newReport state with all form data
            updateNewReport({
                images: base64Images,
                location: {
                    latitude: location.lat,
                    longitude: location.lng,
                    address: location.address,
                    locality: locality,
                    city: 'Mumbai'
                },
                category: category as WasteCategory,
                description: description || 'No description provided',
                isAnonymous
            });

            // Submit to Supabase using the store's method
            await submitReport();

            // Refresh reports to update the UI
            await fetchReports();

            // Reset form state
            resetNewReport();

            toast.success('Report submitted successfully!');
            router.push('/home');
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Failed to submit report. Please try again.');
        }
        finally { setIsSubmitting(false); }
    };

    const canProceed = () => {
        if (currentStep === 0) return images.length > 0;
        if (currentStep === 1) return category !== '';
        if (currentStep === 3) return location !== null;
        return true;
    };

    const selectedCategory = CATEGORIES.find(c => c.id === category);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-gray-50 relative">
            {/* Floating Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div className="absolute w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl" animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 15, repeat: Infinity }} style={{ top: '5%', right: '10%' }} />
                <motion.div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-300/30 blur-3xl" animate={{ x: [0, -40, 0], y: [0, 60, 0] }} transition={{ duration: 20, repeat: Infinity }} style={{ bottom: '10%', left: '-10%' }} />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
                {/* Progress Bar */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-3">
                        {STEPS.map((step, i) => (
                            <React.Fragment key={step}>
                                <motion.div
                                    initial={false}
                                    animate={{ scale: i === currentStep ? 1.1 : 1 }}
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all duration-300 flex-shrink-0 ${i < currentStep ? 'bg-emerald-500 text-white' : i === currentStep ? 'bg-emerald-500 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                                    {i < currentStep ? <CheckCircle2 size={16} /> : i + 1}
                                </motion.div>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded-full transition-colors duration-500 ${i < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                    <p className="text-center text-xs sm:text-sm text-gray-500 font-medium">Step {currentStep + 1} of {STEPS.length}: <span className="text-emerald-600">{STEPS[currentStep]}</span></p>
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: "easeOut" }}>

                        {/* Step 0: Photos */}
                        {currentStep === 0 && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Upload Photos</h2>
                                <p className="text-gray-500 text-sm mb-6">Add clear photos of the waste issue (max 5)</p>

                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-emerald-300 rounded-2xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all mb-4">
                                    {imagePreviews.length === 0 ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-4">
                                                <Camera className="w-10 h-10 text-emerald-600" />
                                            </div>
                                            <p className="text-gray-700 font-semibold">Click or drag to upload</p>
                                            <p className="text-gray-400 text-sm mt-1">JPG, PNG up to 10MB each</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                            {imagePreviews.map((p, i) => (
                                                <div key={i} className="relative aspect-square">
                                                    <img src={p} alt="" className="w-full h-full rounded-xl object-cover" />
                                                    <button onClick={(e) => { e.stopPropagation(); removeImage(i); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600"><X size={14} /></button>
                                                </div>
                                            ))}
                                            {imagePreviews.length < 5 && (
                                                <div className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                                                    <Upload className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" suppressHydrationWarning />

                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="font-medium">AI is analyzing your photo...</span>
                                    </div>
                                )}
                                {aiAnalysis && !isAnalyzing && (
                                    <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-xl border border-emerald-200">
                                        <Sparkles className="text-emerald-600 flex-shrink-0" size={20} />
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm">AI Detection: {CATEGORIES.find(c => c.id === aiAnalysis.topCategories[0])?.label}</p>
                                            <p className="text-xs text-gray-500 truncate">{aiAnalysis.description || `${aiAnalysis.confidence}% confidence`}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Category */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Select Category</h2>
                                <p className="text-gray-500 text-sm mb-4">What type of waste issue is this?</p>

                                {/* AI Suggested Categories */}
                                {aiAnalysis && aiAnalysis.topCategories.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs font-semibold text-emerald-600 uppercase mb-2 flex items-center gap-1">
                                            <Sparkles size={12} /> AI Recommended
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                            {aiAnalysis.topCategories.slice(0, 4).map((catId) => {
                                                const cat = CATEGORIES.find(c => c.id === catId);
                                                if (!cat) return null;
                                                const Icon = cat.icon;
                                                const isSelected = category === cat.id;
                                                return (
                                                    <motion.button key={cat.id} onClick={() => setCategory(cat.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-400'}`}>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                                                                <Icon size={18} style={{ color: cat.color }} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{cat.label}</p>
                                                            </div>
                                                        </div>
                                                        {isSelected && <div className="mt-2 flex justify-end"><CheckCircle2 size={16} className="text-emerald-500" /></div>}
                                                    </motion.button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* More Categories Toggle */}
                                <button
                                    onClick={() => setShowAllCategories(!showAllCategories)}
                                    className="w-full py-2 text-sm font-medium text-gray-500 hover:text-emerald-600 flex items-center justify-center gap-1 mb-3"
                                >
                                    {showAllCategories ? 'Show Less' : 'More Categories'}
                                    <ChevronRight size={16} className={`transition-transform ${showAllCategories ? 'rotate-90' : ''}`} />
                                </button>

                                {/* All Categories */}
                                {showAllCategories && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="grid grid-cols-2 gap-2 sm:gap-3"
                                    >
                                        {CATEGORIES.filter(cat => !aiAnalysis?.topCategories.includes(cat.id)).map((cat) => {
                                            const Icon = cat.icon;
                                            const isSelected = category === cat.id;
                                            return (
                                                <motion.button key={cat.id} onClick={() => setCategory(cat.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'}`}>
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                                                            <Icon size={18} style={{ color: cat.color }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{cat.label}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && <div className="mt-2 flex justify-end"><CheckCircle2 size={16} className="text-emerald-500" /></div>}
                                                </motion.button>
                                            );
                                        })}
                                    </motion.div>
                                )}

                                {/* Show all if no AI analysis */}
                                {!aiAnalysis && (
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        {CATEGORIES.map((cat) => {
                                            const Icon = cat.icon;
                                            const isSelected = category === cat.id;
                                            return (
                                                <motion.button key={cat.id} onClick={() => setCategory(cat.id)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                                    className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 text-left transition-all ${isSelected ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200 hover:border-emerald-300'}`}>
                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                                                            <Icon size={18} style={{ color: cat.color }} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">{cat.label}</p>
                                                            <p className="text-xs text-gray-500 truncate hidden sm:block">{cat.description}</p>
                                                        </div>
                                                    </div>
                                                    {isSelected && <div className="mt-2 flex justify-end"><CheckCircle2 size={16} className="text-emerald-500" /></div>}
                                                </motion.button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {currentStep === 2 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Severity Level</h2>
                                    <div className="grid grid-cols-3 gap-3">
                                        {SEVERITY_OPTIONS.map((opt) => {
                                            const Icon = opt.icon;
                                            return (
                                                <button key={opt.id} onClick={() => setSeverity(opt.id)}
                                                    className={`p-4 rounded-2xl border-2 text-center transition-all ${severity === opt.id ? 'text-white shadow-lg' : 'border-gray-200 text-gray-700'}`}
                                                    style={severity === opt.id ? { backgroundColor: opt.color, borderColor: opt.color } : {}}>
                                                    <Icon size={24} className={`mx-auto mb-2 ${severity === opt.id ? 'text-white' : ''}`} style={severity !== opt.id ? { color: opt.color } : {}} />
                                                    <p className="font-bold">{opt.label}</p>
                                                    <p className={`text-xs mt-1 ${severity === opt.id ? 'text-white/80' : 'text-gray-500'}`}>{opt.description}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                                    <div className="relative">
                                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail... (optional)" rows={4}
                                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 resize-none" />
                                        {voiceSupported ? (
                                            <button
                                                onClick={toggleRecording}
                                                disabled={isTranscribing}
                                                className={`absolute bottom-3 right-3 p-3 rounded-full transition-all ${isTranscribing ? 'bg-blue-500 text-white' :
                                                        isRecording ? 'bg-red-500 text-white animate-pulse' :
                                                            'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}>
                                                {isTranscribing ? <Loader2 size={20} className="animate-spin" /> :
                                                    isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                                            </button>
                                        ) : (
                                            <button disabled className="absolute bottom-3 right-3 p-3 rounded-full bg-gray-50 text-gray-300 cursor-not-allowed" title="Voice input unavailable">
                                                <Mic size={20} />
                                            </button>
                                        )}
                                    </div>
                                    {isRecording && <p className="text-red-500 text-sm mt-2 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />Recording... Tap to stop</p>}
                                    {isTranscribing && <p className="text-blue-500 text-sm mt-2 flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Transcribing...</p>}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Location */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Location</h2>
                                <p className="text-gray-500 text-sm mb-6">Where is the waste issue located?</p>

                                {isGettingLocation ? (
                                    <div className="flex flex-col items-center py-8">
                                        <Loader2 className="animate-spin text-emerald-500 mb-3" size={40} />
                                        <p className="text-gray-600">Detecting your location...</p>
                                    </div>
                                ) : location ? (
                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                                                <MapPin className="text-white" size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900 mb-1">Location Detected</p>
                                                <p className="text-gray-600 text-sm">{location.address}</p>
                                                <p className="text-xs text-gray-400 mt-2">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
                                            </div>
                                        </div>
                                        <button onClick={getCurrentLocation} className="mt-4 w-full py-2 text-emerald-600 font-medium hover:bg-emerald-100 rounded-xl transition">Refresh Location</button>
                                    </div>
                                ) : (
                                    <button onClick={getCurrentLocation} className="w-full py-6 border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-600 flex flex-col items-center gap-2 hover:bg-emerald-50 transition">
                                        <Navigation size={32} />
                                        <span className="font-semibold">Enable Location</span>
                                        <span className="text-sm text-gray-500">Grant permission to detect</span>
                                    </button>
                                )}

                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div><p className="font-medium text-gray-900">Submit Anonymously</p><p className="text-sm text-gray-500">Your identity will be hidden</p></div>
                                        <button onClick={() => setIsAnonymous(!isAnonymous)} className={`w-14 h-7 rounded-full transition ${isAnonymous ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${isAnonymous ? 'translate-x-7' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    {!isAnonymous && (
                                        <div className="mt-4 space-y-3">
                                            <div className="relative"><User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 placeholder:text-gray-400" /></div>
                                            <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 placeholder:text-gray-400" /></div>
                                            <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none text-gray-900 placeholder:text-gray-400" /></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Review Your Report</h2>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                            <Image className="text-emerald-600" size={24} />
                                            <div><p className="font-medium text-gray-900">{imagePreviews.length} Photo(s)</p><p className="text-sm text-gray-500">Uploaded</p></div>
                                            <div className="ml-auto flex gap-2">
                                                {imagePreviews.slice(0, 3).map((p, i) => <img key={i} src={p} className="w-10 h-10 rounded-lg object-cover" />)}
                                            </div>
                                        </div>

                                        {selectedCategory && (
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selectedCategory.color}15` }}>
                                                    <selectedCategory.icon size={20} style={{ color: selectedCategory.color }} />
                                                </div>
                                                <div><p className="font-medium text-gray-900">{selectedCategory.label}</p><p className="text-sm text-gray-500">Category</p></div>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${SEVERITY_OPTIONS.find(s => s.id === severity)?.color}15` }}>
                                                <AlertTriangle size={20} style={{ color: SEVERITY_OPTIONS.find(s => s.id === severity)?.color }} />
                                            </div>
                                            <div><p className="font-medium text-gray-900">{severity.charAt(0).toUpperCase() + severity.slice(1)} Severity</p><p className="text-sm text-gray-500">Priority Level</p></div>
                                        </div>

                                        {location && (
                                            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                                <MapPin className="text-emerald-600" size={24} />
                                                <div className="flex-1 min-w-0"><p className="font-medium text-gray-900 truncate">{location.address}</p><p className="text-sm text-gray-500">Location</p></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button onClick={handleSubmit} disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/30">
                                    {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> Submitting...</> : <><Send size={22} /> Submit Report</>}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                {currentStep < 4 && (
                    <div className="flex gap-3 mt-6">
                        {currentStep > 0 && (
                            <button onClick={() => setCurrentStep(currentStep - 1)} className="flex-1 py-4 border-2 border-gray-200 rounded-2xl font-semibold text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition">
                                <ChevronLeft size={20} /> Back
                            </button>
                        )}
                        <button onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 transition">
                            {currentStep === 3 ? 'Review' : 'Continue'} <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
