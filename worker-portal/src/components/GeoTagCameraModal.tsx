'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, MapPin, Check, RotateCcw, Upload } from 'lucide-react';
import { stampWorkerGeoTag } from '@/lib/geotag';

interface WorkerGeoTagCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'resolved' | 'nothing_found';
    address: string;
    workerCoords: { lat: number; lng: number; distanceMeters: number } | null;
    onCapture: (payload: { rawDataUrl: string; stampedDataUrl: string }) => void;
}

export default function GeoTagCameraModal({
    isOpen,
    onClose,
    mode,
    address,
    workerCoords,
    onCapture,
}: WorkerGeoTagCameraModalProps) {
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

    const startCamera = async (camMode: 'environment' | 'user') => {
        stopStream();
        setStarting(true);
        setCameraError(null);
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Live camera is unavailable in this browser.');
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: camMode },
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

    const isFlagged = mode === 'nothing_found';

    const handleShutter = async () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return;

        const maxDim = 1100;
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

        const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const timestamp = new Date().toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
        const stampedDataUrl = await stampWorkerGeoTag(rawDataUrl, {
            maxDim: 1100,
            quality: 0.85,
            isFlagged,
            geo: {
                lat: workerCoords?.lat ?? null,
                lng: workerCoords?.lng ?? null,
                distanceMeters: workerCoords?.distanceMeters ?? null,
                address,
                label: isFlagged ? 'NOTHING FOUND FLAG GEOTAG' : 'CLEANUP VERIFIED GEOTAG',
                timestamp,
            },
        });

        stopStream();
        setCapturedRawUrl(rawDataUrl);
        setCapturedStampedUrl(stampedDataUrl);
    };

    const handleConfirm = () => {
        if (!capturedRawUrl || !capturedStampedUrl) return;
        onCapture({ rawDataUrl: capturedRawUrl, stampedDataUrl: capturedStampedUrl });
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
            <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent text-white">
                <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isFlagged ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className="text-sm font-bold tracking-wide">
                        {isFlagged ? 'Worker Flag GeoTag Camera' : 'Worker Verification GeoTag Camera'}
                    </span>
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

            <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
                {capturedStampedUrl ? (
                    <img
                        src={capturedStampedUrl}
                        alt="Captured Worker GeoTag Proof"
                        className="max-h-full max-w-full object-contain"
                    />
                ) : cameraError ? (
                    <div className="text-center text-white px-6 max-w-sm space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto">
                            <Camera size={28} className="text-emerald-400" />
                        </div>
                        <p className="text-sm text-gray-200">{cameraError}</p>
                        <p className="text-xs text-gray-400">
                            Gallery uploads are disabled for anti-tampering. Allow camera access and tap Retry.
                        </p>
                        <button
                            type="button"
                            onClick={() => startCamera(facingMode)}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Retry Live Camera
                        </button>
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

                        <div
                            className={`absolute bottom-3 left-3 right-3 rounded-xl backdrop-blur-md border-l-4 px-3.5 py-2.5 text-white shadow-lg ${
                                isFlagged
                                    ? 'bg-[#451a03]/85 border-amber-400'
                                    : 'bg-[#022c22]/85 border-emerald-400'
                            }`}
                        >
                            <p className={`text-[11px] font-bold tracking-wide flex items-center gap-1.5 ${isFlagged ? 'text-amber-300' : 'text-emerald-300'}`}>
                                <MapPin size={12} />
                                {workerCoords
                                    ? `LAT ${workerCoords.lat.toFixed(6)} · LNG ${workerCoords.lng.toFixed(6)} · ${Math.round(workerCoords.distanceMeters)}m FROM PIN`
                                    : 'CAPTURING WORKER GPS GEOTAG...'}
                            </p>
                            <p className="text-xs text-white/95 truncate mt-0.5">{address}</p>
                            <p className="text-[10px] text-white/75 mt-0.5 font-mono">{clockStr}</p>
                        </div>
                    </>
                )}
            </div>

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
                            className={`px-6 py-3 rounded-full text-white font-bold text-sm flex items-center gap-2 shadow-lg transition ${
                                isFlagged
                                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                    : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                            }`}
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
