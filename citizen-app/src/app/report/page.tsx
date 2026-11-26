'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    Camera, MapPin, Mic, MicOff, Upload, CheckCircle2,
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf, User, Phone, Mail, Send,
    Loader2, Navigation, X, Sparkles, ChevronRight, ChevronLeft, Image, Shield,
    Droplets, Bug, Flame, Car, FileWarning, Zap, AlertTriangle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/store';
import { getSupabase } from '@/lib/supabase';
import { extractExifGps, stampGeoTagOnImage } from '@/lib/geotag';
import GeoTagCameraModal from '@/components/GeoTagCameraModal';
import { Report, WasteCategory, Severity } from '@/types';

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
    const [imageHashes, setImageHashes] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [severity, setSeverity] = useState('medium');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [geoSource, setGeoSource] = useState<'gps' | 'exif'>('gps');
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [showGeoCamera, setShowGeoCamera] = useState(false);
    const hasFetchedGpsRef = useRef(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ topCategories: string[]; confidence: number; description: string } | null>(null);
    const [showAllCategories, setShowAllCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitPhase, setSubmitPhase] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [submitStage, setSubmitStage] = useState(0);
    const [submittedReportId, setSubmittedReportId] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Auth Check
    const { isAuthenticated, isAuthChecked, initializeAuth } = useAppStore();
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    useEffect(() => {
        if (isAuthChecked && !isAuthenticated) {
            router.replace('/login?next=/report');
        }
    }, [isAuthenticated, isAuthChecked, router]);

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

    useEffect(() => {
        if (hasFetchedGpsRef.current) return;
        hasFetchedGpsRef.current = true;
        getCurrentLocation(true);
    }, []);

    const getCurrentLocation = async (silent = false) => {
        if (!navigator.geolocation) {
            if (!silent) toast.error('Geolocation not supported', { id: 'geotag-location-toast' });
            return;
        }
        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    // Use our proxy API to avoid CORS issues
                    const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    setLocation({ lat: latitude, lng: longitude, address: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` });
                } catch { setLocation({ lat: latitude, lng: longitude, address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` }); }
                setGeoSource('gps');
                setIsGettingLocation(false);
                if (!silent) {
                    toast.success('GeoTag location updated!', { id: 'geotag-location-toast' });
                }
            },
            () => {
                setIsGettingLocation(false);
                if (!silent) {
                    toast.error('Please enable GPS to attach GeoTag', { id: 'geotag-location-toast' });
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const computeImageHash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    };

    // Temporarily disabled for testing so the same test photo can be uploaded multiple times
    const ENABLE_DUPLICATE_HASH_BLOCK = false;

    // Analyze a single image & verify against duplicate photo hashes
    const analyzeImage = async (
        file: File,
        options?: { skipDuplicateCheck?: boolean; batchHashes?: string[] }
    ): Promise<{ valid: boolean; result?: any; imageHash?: string }> => {
        let imageHash = '';
        try {
            imageHash = await computeImageHash(file);
            if (ENABLE_DUPLICATE_HASH_BLOCK && !options?.skipDuplicateCheck) {
                const knownHashes = options?.batchHashes || imageHashes;
                if (knownHashes.includes(imageHash)) {
                    toast.error('This photo is already attached to this report.');
                    return { valid: false };
                }

                try {
                    const supabase = getSupabase();
                    const rpcRes = await Promise.race([
                        (supabase as any).rpc('check_duplicate_image_hash', { p_hash: imageHash }),
                        new Promise<{ data: null }>((res) => setTimeout(() => res({ data: null }), 2000)),
                    ]);
                    const dupMatches = rpcRes?.data;
                    if (Array.isArray(dupMatches) && dupMatches.length > 0) {
                        toast.error('Duplicate photo detected — this exact image was already submitted.');
                        return { valid: false };
                    }
                } catch {
                    // Non-fatal if duplicate RPC times out or is unreachable; submitReport re-checks
                }
            }
        } catch {
            // Fallback gracefully if crypto.subtle is unavailable
        }

        try {
            // Downscale large phone photos (~50-80 KB) before AI inspection so uploads are fast
            const compressedBase64 = await compressImage(file, 768, 0.72);
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 40000);

            try {
                const response = await fetch('/api/analyze-image', {
                    method: 'POST',
                    signal: controller.signal,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64: compressedBase64 }),
                });
                const result = await response.json();

                if (!result.isWasteRelated) {
                    toast.error(result.rejectionReason || 'Image rejected - not related to waste');
                    return { valid: false };
                }
                return { valid: true, result, imageHash };
            } finally {
                clearTimeout(timer);
            }
        } catch (err: any) {
            toast.error(err?.name === 'AbortError' ? 'AI verification timed out. Please try again.' : 'Failed to analyze image');
            return { valid: false };
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';
        if (!files.length) return;

        setIsAnalyzing(true);
        const validImages: File[] = [...images];
        const validPreviews: string[] = [...imagePreviews];
        const validHashes: string[] = [...imageHashes];
        let bestAnalysis: { topCategories: string[]; confidence: number; description: string } | null = aiAnalysis;
        let addedCount = 0;

        // Analyze each new image
        for (const file of files) {
            if (validImages.length >= 5) break;

            const { valid, result, imageHash } = await analyzeImage(file, { batchHashes: validHashes });

            if (valid && result) {
                let effectiveLoc = location;
                let effectiveSource = geoSource;

                // Check native EXIF GPS metadata inside photo silently (zero popup toast spam)
                const exifGps = await extractExifGps(file).catch(() => null);
                if (exifGps) {
                    effectiveSource = 'exif';
                    setGeoSource('exif');
                    try {
                        const res = await fetch(`/api/geocode?lat=${exifGps.lat}&lon=${exifGps.lng}`);
                        const geoData = await res.json();
                        effectiveLoc = {
                            lat: exifGps.lat,
                            lng: exifGps.lng,
                            address: geoData.display_name || `${exifGps.lat.toFixed(6)}, ${exifGps.lng.toFixed(6)}`,
                        };
                    } catch {
                        effectiveLoc = {
                            lat: exifGps.lat,
                            lng: exifGps.lng,
                            address: `${exifGps.lat.toFixed(6)}, ${exifGps.lng.toFixed(6)}`,
                        };
                    }
                    setLocation(effectiveLoc);
                }

                // Immediately stamp GeoTag onto preview so the tag is visible inside the photo itself
                const stampedPreview = await stampGeoTagOnImage(file, {
                    maxDim: 1280,
                    quality: 0.84,
                    geo: effectiveLoc
                        ? {
                              lat: effectiveLoc.lat,
                              lng: effectiveLoc.lng,
                              address: effectiveLoc.address,
                              label: effectiveSource === 'exif' ? 'PHOTO EXIF GEOTAG' : 'CITIZEN REPORT GEOTAG',
                          }
                        : {
                              lat: null,
                              lng: null,
                              address: 'Detecting GPS location...',
                              label: 'CITIZEN REPORT GEOTAG',
                          },
                });

                validImages.push(file);
                validPreviews.push(stampedPreview);
                if (imageHash) validHashes.push(imageHash);
                addedCount++;

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
        setImageHashes(validHashes);

        if (bestAnalysis && bestAnalysis.topCategories.length > 0) {
            setAiAnalysis(bestAnalysis);
            if (!category && bestAnalysis.topCategories[0]) {
                setCategory(bestAnalysis.topCategories[0]);
            }
        }

        if (addedCount > 0) {
            toast.success(`${addedCount} valid GeoTagged photo(s) added!`, { id: 'photo-added' });
        }

        setIsAnalyzing(false);
    };

    const handleGeoCameraCapture = async ({
        rawFile,
        stampedPreviewUrl,
    }: {
        rawFile: File;
        stampedPreviewUrl: string;
    }) => {
        if (images.length >= 5) {
            toast.error('Maximum 5 photos allowed per report.', { id: 'photo-limit' });
            return;
        }
        setIsAnalyzing(true);
        const { valid, result, imageHash } = await analyzeImage(rawFile, { batchHashes: imageHashes });
        if (valid && result) {
            setImages((prev) => [...prev, rawFile]);
            setImagePreviews((prev) => [...prev, stampedPreviewUrl]);
            if (imageHash) setImageHashes((prev) => [...prev, imageHash]);

            const nextAnalysis = {
                topCategories: result.topCategories || [],
                confidence: result.confidence || 80,
                description: result.description || '',
            };
            if (!aiAnalysis || nextAnalysis.confidence > aiAnalysis.confidence) {
                setAiAnalysis(nextAnalysis);
                if (!category && nextAnalysis.topCategories[0]) {
                    setCategory(nextAnalysis.topCategories[0]);
                }
            }
            toast.success('GeoTagged camera photo captured!', { id: 'photo-added' });
        }
        setIsAnalyzing(false);
    };

    const removeImage = async (i: number) => {
        const newImages = images.filter((_, idx) => idx !== i);
        const newPreviews = imagePreviews.filter((_, idx) => idx !== i);
        const newHashes = imageHashes.filter((_, idx) => idx !== i);

        setImages(newImages);
        setImagePreviews(newPreviews);
        setImageHashes(newHashes);

        // Re-analyze if we removed images and have remaining ones
        if (newImages.length > 0 && newImages.length < images.length) {
            setIsAnalyzing(true);
            // Re-analyze first remaining image
            const { valid, result } = await analyzeImage(newImages[0], { skipDuplicateCheck: true });
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

    const compressImage = (file: File, maxDim = 1280, quality = 0.8): Promise<string> => {
        return stampGeoTagOnImage(file, { maxDim, quality });
    };

    const handleSubmit = async () => {
        if (!location || !category || !images.length) { toast.error('Complete all fields'); return; }
        setSubmitError(null);
        setIsSubmitting(true);
        setSubmitPhase('submitting');
        setSubmitStage(0);

        // Smooth stage progression timer during network upload
        const stageTimer1 = setTimeout(() => setSubmitStage(prev => Math.max(prev, 1)), 450);
        const stageTimer2 = setTimeout(() => setSubmitStage(prev => Math.max(prev, 2)), 1100);

        try {
            const stampTimestamp = new Date().toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            // Compress & permanently stamp visible EnviroLink GeoTag bar onto uploaded photos
            const base64Images = await Promise.all(
                images.map(file =>
                    stampGeoTagOnImage(file, {
                        maxDim: 1280,
                        quality: 0.82,
                        geo: {
                            lat: location.lat,
                            lng: location.lng,
                            address: location.address,
                            label: geoSource === 'exif' ? 'PHOTO EXIF GEOTAG' : 'CITIZEN REPORT GEOTAG',
                            timestamp: stampTimestamp,
                            source: geoSource,
                        },
                    })
                )
            );
            setSubmitStage(1);

            // Extract locality from address
            const addressParts = location.address.split(',');
            const locality = addressParts[0]?.trim() || 'Unknown';

            // Update store's newReport state with all form data
            updateNewReport({
                images: base64Images,
                imageHashes,
                location: {
                    latitude: location.lat,
                    longitude: location.lng,
                    address: location.address,
                    locality: locality,
                    city: 'Mumbai'
                },
                category: category as WasteCategory,
                severity: severity as Severity,
                description: description || 'No description provided',
                isAnonymous
            });

            // Submit to Supabase using the store's method
            await submitReport();
            setSubmitStage(3);

            const latestReportId = useAppStore.getState().userReports[0]?.reportId || 'R-SUBMITTED';
            setSubmittedReportId(latestReportId);

            // Reset form state
            resetNewReport();

            // Show animated success celebration before navigating to Profile
            setSubmitPhase('success');
            await new Promise(resolve => setTimeout(resolve, 1600));
            router.push('/profile');
        } catch (err: any) {
            const message = err?.message || 'Failed to submit report. Please try again.';
            console.warn('Report submit blocked:', message);
            setSubmitPhase('idle');
            setSubmitError(message);
            toast.error(message, { id: 'report-submit-error', duration: 5000 });
        } finally {
            clearTimeout(stageTimer1);
            clearTimeout(stageTimer2);
            setIsSubmitting(false);
        }
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
                {/* Trust Score Advisory Banner */}
                {user?.engagement?.trustScore !== undefined && user.engagement.trustScore < 50 && (
                    <div
                        className={`mb-4 rounded-2xl p-4 border flex items-start gap-3 ${
                            user.engagement.trustScore < 20
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                    >
                        <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                            <p className="font-bold">
                                {user.engagement.trustScore < 20
                                    ? `Reporting Restricted (Trust Score: ${user.engagement.trustScore}/100)`
                                    : `Enhanced Verification Active (Trust Score: ${user.engagement.trustScore}/100)`}
                            </p>
                            <p className="opacity-90 mt-0.5">
                                {user.engagement.trustScore < 20
                                    ? 'Your account has multiple rejected reports and cannot submit non-anonymous reports right now.'
                                    : 'New reports will be flagged for additional authority verification.'}
                            </p>
                        </div>
                    </div>
                )}

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

                        {/* Step 0: Photos (Live GeoTag Camera Only) */}
                        {currentStep === 0 && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-4 sm:p-6 shadow-sm">
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Capture Live GeoTag Photo</h2>
                                <p className="text-gray-500 text-sm mb-5">
                                    Live GeoTag Camera capture only — gallery uploads are disabled to prevent tampering and guarantee on-spot GPS proof.
                                </p>

                                <button
                                    type="button"
                                    onClick={() => setShowGeoCamera(true)}
                                    disabled={isAnalyzing || images.length >= 5}
                                    className="w-full py-5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-base shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-emerald-600 transition flex items-center justify-center gap-3 disabled:opacity-50 mb-4"
                                >
                                    <Camera size={22} />
                                    {images.length === 0 ? 'Open GeoTag Camera' : `Capture Another Photo (${images.length}/5)`}
                                </button>

                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                        {imagePreviews.map((p, i) => (
                                            <div key={i} className="relative rounded-2xl overflow-hidden border border-emerald-200 bg-gray-900">
                                                <img src={p} alt={`GeoTagged capture ${i + 1}`} className="w-full max-h-64 object-contain" />
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {isAnalyzing && (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl">
                                        <Loader2 className="animate-spin shrink-0" size={18} />
                                        <span className="font-medium text-sm">
                                            AI is analyzing your photo (usually ~20–25s on free Nemotron VL)...
                                        </span>
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

                                {/* Live GeoTag Stamp Indicator */}
                                <div className={`mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-xs ${location ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <MapPin size={15} className={location ? 'text-emerald-600 shrink-0' : 'text-amber-600 shrink-0'} />
                                        <span className="truncate font-medium">
                                            {location
                                                ? `GeoTag Ready (${geoSource === 'exif' ? 'Photo EXIF' : 'Live GPS'}): ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                                                : isGettingLocation
                                                    ? 'Acquiring live GPS GeoTag...'
                                                    : 'GPS GeoTag needed — tap to capture location'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => getCurrentLocation(false)}
                                        className="font-bold underline shrink-0 hover:opacity-80"
                                    >
                                        {location ? 'Refresh' : 'Detect'}
                                    </button>
                                </div>
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
                                        <button onClick={() => getCurrentLocation(false)} className="mt-4 w-full py-2 text-emerald-600 font-medium hover:bg-emerald-100 rounded-xl transition">Refresh Location</button>
                                    </div>
                                ) : (
                                    <button onClick={() => getCurrentLocation(false)} className="w-full py-6 border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-600 flex flex-col items-center gap-2 hover:bg-emerald-50 transition">
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
                                            <div>
                                                <p className="font-medium text-gray-900">{imagePreviews.length} Photo(s) · GeoTagged</p>
                                                <p className="text-xs text-emerald-700 font-medium">
                                                    {location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)} (${geoSource === 'exif' ? 'EXIF GPS' : 'Live GPS'})` : 'GeoTag embedded on upload'}
                                                </p>
                                            </div>
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

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800">
                                        <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-bold">
                                                {/duplicate|already exists|already been submitted|trust score|restricted/i.test(submitError)
                                                    ? 'Submission Blocked (Anti-Fraud Check)'
                                                    : 'Submission Failed'}
                                            </p>
                                            <p className="mt-0.5">{submitError}</p>
                                        </div>
                                    </div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.01, y: -1 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg shadow-emerald-500/30"
                                >
                                    {isSubmitting ? <><Loader2 className="animate-spin" size={24} /> Submitting...</> : <><Send size={22} /> Submit Report</>}
                                </motion.button>
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

            {/* Animated Submission & Success Celebration Overlay */}
            <AnimatePresence>
                {submitPhase !== 'idle' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[120] bg-emerald-950/35 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -12 }}
                            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                            className="relative bg-white/95 backdrop-blur-2xl rounded-3xl border border-emerald-100 shadow-2xl p-8 max-w-md w-full text-center overflow-hidden"
                        >
                            {/* Subtle ambient glow */}
                            <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-48 h-48 rounded-full bg-teal-200/40 blur-3xl pointer-events-none" />

                            <AnimatePresence mode="wait">
                                {submitPhase === 'submitting' ? (
                                    <motion.div
                                        key="submitting"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.92 }}
                                        transition={{ duration: 0.25 }}
                                        className="relative z-10"
                                    >
                                        {/* Animated Orbital Rings */}
                                        <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                            <motion.div
                                                className="absolute inset-0 rounded-full border-4 border-emerald-100 border-t-emerald-500"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                                            />
                                            <motion.div
                                                className="absolute inset-2 rounded-full border-4 border-teal-50 border-b-teal-400"
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.12, 1] }}
                                                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                                                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30"
                                            >
                                                <Send size={22} />
                                            </motion.div>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-900 mb-1">Submitting Report</h3>
                                        <p className="text-sm text-gray-500 mb-6">Connecting to municipal dispatch...</p>

                                        {/* Live Progress Stages */}
                                        <div className="space-y-3 text-left bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                                            {[
                                                'Preparing & optimizing photos',
                                                'Logging waste report & GPS pin',
                                                'Verifying location & anti-fraud checks',
                                            ].map((label, idx) => {
                                                const isDone = submitStage > idx;
                                                const isActive = submitStage === idx;
                                                return (
                                                    <motion.div
                                                        key={label}
                                                        initial={{ opacity: 0.4, x: -6 }}
                                                        animate={{ opacity: isDone || isActive ? 1 : 0.45, x: 0 }}
                                                        className="flex items-center gap-3 text-sm"
                                                    >
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                                                isDone
                                                                    ? 'bg-emerald-500 text-white'
                                                                    : isActive
                                                                    ? 'bg-emerald-100 text-emerald-600'
                                                                    : 'bg-gray-200 text-gray-400'
                                                            }`}
                                                        >
                                                            {isDone ? (
                                                                <CheckCircle2 size={14} />
                                                            ) : isActive ? (
                                                                <Loader2 size={14} className="animate-spin" />
                                                            ) : (
                                                                <span className="text-[11px] font-bold">{idx + 1}</span>
                                                            )}
                                                        </div>
                                                        <span className={isDone || isActive ? 'font-semibold text-gray-800' : 'text-gray-400'}>
                                                            {label}
                                                        </span>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Smooth Progress Bar */}
                                        <div className="mt-5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                                initial={{ width: '15%' }}
                                                animate={{ width: `${Math.min(92, 28 + submitStage * 28)}%` }}
                                                transition={{ duration: 0.45, ease: 'easeOut' }}
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="success"
                                        initial={{ opacity: 0, scale: 0.85 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                        className="relative z-10 py-2"
                                    >
                                        {/* Confetti Burst Particles */}
                                        <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
                                            {[
                                                { x: -46, y: -38, color: 'bg-emerald-400', delay: 0.05 },
                                                { x: 48, y: -34, color: 'bg-amber-400', delay: 0.08 },
                                                { x: -54, y: 12, color: 'bg-teal-400', delay: 0.1 },
                                                { x: 52, y: 18, color: 'bg-emerald-500', delay: 0.12 },
                                                { x: -24, y: -54, color: 'bg-cyan-400', delay: 0.07 },
                                                { x: 26, y: -52, color: 'bg-lime-400', delay: 0.11 },
                                                { x: -34, y: 42, color: 'bg-amber-300', delay: 0.09 },
                                                { x: 36, y: 42, color: 'bg-teal-300', delay: 0.13 },
                                            ].map((dot, idx) => (
                                                <motion.span
                                                    key={idx}
                                                    initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                                                    animate={{ opacity: 0, x: dot.x, y: dot.y, scale: [0, 1.3, 0.6] }}
                                                    transition={{ duration: 0.9, delay: dot.delay, ease: [0.165, 0.84, 0.44, 1] }}
                                                    className={`absolute w-2.5 h-2.5 rounded-full ${dot.color}`}
                                                />
                                            ))}

                                            {/* Expanding Halo */}
                                            <motion.div
                                                initial={{ scale: 0.6, opacity: 0.8 }}
                                                animate={{ scale: 1.5, opacity: 0 }}
                                                transition={{ duration: 0.9, ease: 'easeOut' }}
                                                className="absolute inset-0 rounded-full bg-emerald-400/30"
                                            />

                                            {/* Animated Self-Drawing Checkmark Circle */}
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                                                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/35"
                                            >
                                                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <motion.path
                                                        d="M5 13l4 4L19 7"
                                                        initial={{ pathLength: 0 }}
                                                        animate={{ pathLength: 1 }}
                                                        transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
                                                    />
                                                </svg>
                                            </motion.div>
                                        </div>

                                        <motion.h3
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-2xl font-extrabold text-gray-900 mb-1"
                                        >
                                            Report Submitted!
                                        </motion.h3>

                                        <motion.p
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.28 }}
                                            className="text-sm text-gray-500 mb-4"
                                        >
                                            Thank you for keeping Mumbai clean.
                                        </motion.p>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.85 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 320, delay: 0.32 }}
                                            className="flex items-center justify-center gap-2 flex-wrap mb-6"
                                        >
                                            {submittedReportId && (
                                                <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-mono text-xs font-bold border border-gray-200">
                                                    {submittedReportId}
                                                </span>
                                            )}
                                            {!isAnonymous && (
                                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                                                    <Clock size={13} />
                                                    Pending (+20 pts on resolution)
                                                </span>
                                            )}
                                        </motion.div>

                                        <p className="text-xs text-gray-400 mb-2">Opening your Profile &amp; My Reports...</p>
                                        <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: 1.45, ease: 'easeInOut' }}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <GeoTagCameraModal
                isOpen={showGeoCamera}
                onClose={() => setShowGeoCamera(false)}
                location={location}
                onCapture={handleGeoCameraCapture}
            />
        </div>
    );
}
