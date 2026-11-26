'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, MapPin, Check, RotateCcw, Upload } from 'lucide-react';
import { stampGeoTagOnImage } from '@/lib/geotag';

interface GeoTagCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: { lat: number; lng: number; address: string } | null;
    onCapture: (payload: { rawFile: File; stampedPreviewUrl: string }) => void;
    onFallbackGallery: () => void;
}

export default function GeoTagCameraModal({
    isOpen,
    onClose,
    location,
    onCapture,
    onFallbackGallery,
}: GeoTagCameraModalProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [starting, setStarting] = useState(true);
    const [capturedRawUrl, setCapturedRawUrl] = useState<string | null>(null);
    const [capturedStampedUrl, setCapturedStampedUrl] = useState<string | null>(null);
    const [clockStr, setClockStr] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const updateClock = () => {
            setClockStr(
                new Date().toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                })
            );
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    };

    const startCamera = async (mode: 'environment' | 'user') => {
        stopStream();
        setStarting(true);
        setCameraError(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Live camera is unavailable in this browser.');
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: mode },
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play().catch(() => {});
            }
        } catch (err: any) {
            setCameraError(err?.message || 'Camera permission denied or no camera detected.');
        } finally {
            setStarting(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            stopStream();
            setCapturedRawUrl(null);
            setCapturedStampedUrl(null);
            return;
        }
        startCamera(facingMode);
        return () => {
            stopStream();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, facingMode]);

    const handleShutter = async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return;

        const maxDim = 1280;
        let width = video.videoWidth;
        let height = video.videoHeight;
        if (width > maxDim || height > maxDim) {
            if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
            } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, width, height);

        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        const timestamp = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        const stampedDataUrl = await stampGeoTagOnImage(rawDataUrl, {
            maxDim: 1280,
            quality: 0.86,
            geo: {
                lat: location?.lat ?? null,
                lng: location?.lng ?? null,
                address: location?.address || 'Live GPS Capture',
                label: 'ENVIROLINK GEOTAG CAMERA',
                timestamp,
            },
        });

        stopStream();
        setCapturedRawUrl(rawDataUrl);
        setCapturedStampedUrl(stampedDataUrl);
    };

    const handleConfirm = async () => {
        if (!capturedRawUrl || !capturedStampedUrl) return;
        const res = await fetch(capturedRawUrl);
        const blob = await res.blob();
        const file = new File([blob], `geotag-report-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture({ rawFile: file, stampedPreviewUrl: capturedStampedUrl });
        onClose();
    };

    const handleRetake = () => {
        setCapturedRawUrl(null);
        setCapturedStampedUrl(null);
        startCamera(facingMode);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] bg-black flex flex-col justify-between">
            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent text-white">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-bold tracking-wide">EnviroLink GeoTag Camera</span>
                </div>
                <div className="flex items-center gap-2">
                    {!capturedStampedUrl && !cameraError && (
                        <button
                            type="button"
                            onClick={() => setFacingMode((m) => (m === 'environment' ? 'user' : 'environment'))}
                            className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition"
                            aria-label="Switch Camera"
                        >
                            <RefreshCw size={18} />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/15 hover:bg-white/25 transition"
                        aria-label="Close Camera"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* Camera Viewfinder OR Captured Preview */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
                {capturedStampedUrl ? (
                    <img
                        src={capturedStampedUrl}
                        alt="Captured GeoTagged Photo"
                        className="max-h-full max-w-full object-contain"
                    />
                ) : cameraError ? (
                    <div className="text-center text-white px-6 max-w-sm space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                            <Camera size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-sm text-gray-200">{cameraError}</p>
                        <div className="space-y-2.5">
                            <button
                                type="button"
                                onClick={() => startCamera(facingMode)}
                                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Retry Live Camera
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onFallbackGallery();
                                }}
                                className="w-full py-3 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <Upload size={16} />
                                Upload Photo / Gallery
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            autoPlay
                            className="w-full h-full object-cover"
                        />
                        {starting && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white text-sm">
                                Starting camera viewfinder...
                            </div>
                        )}

                        {/* Live GeoTag HUD overlay on Viewfinder */}
                        <div className="absolute bottom-3 left-3 right-3 rounded-xl bg-[#022c22]/85 backdrop-blur-md border-l-4 border-emerald-400 px-3.5 py-2.5 text-white shadow-lg">
                            <p className="text-[11px] font-bold text-emerald-300 tracking-wide flex items-center gap-1.5">
                                <MapPin size={12} />
                                {location
                                    ? `LAT ${location.lat.toFixed(6)} · LNG ${location.lng.toFixed(6)}`
                                    : 'ACQUIRING GPS GEOTAG...'}
                            </p>
                            <p className="text-xs text-emerald-50 truncate mt-0.5">
                                {location?.address || 'Locating street address...'}
                            </p>
                            <p className="text-[10px] text-emerald-200/80 mt-0.5 font-mono">{clockStr}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Bottom Controls */}
            <div className="relative z-20 px-6 py-5 bg-gradient-to-t from-black/90 to-black/60 flex items-center justify-center gap-6">
                {capturedStampedUrl ? (
                    <>
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="px-5 py-3 rounded-full bg-white/15 text-white font-semibold text-sm flex items-center gap-2 hover:bg-white/25 transition"
                        >
                            <RotateCcw size={17} />
                            Retake
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition"
                        >
                            <Check size={18} />
                            Use GeoTagged Photo
                        </button>
                    </>
                ) : !cameraError ? (
                    <button
                        type="button"
                        onClick={handleShutter}
                        disabled={starting}
                        aria-label="Capture GeoTagged Photo"
                        className="w-18 h-18 rounded-full border-4 border-white p-1.5 flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                    >
                        <span className="w-full h-full rounded-full bg-white block" />
                    </button>
                ) : null}
            </div>
        </div>
    );
}
