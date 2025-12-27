'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootScreenProps {
    onComplete: () => void;
}

export default function BootScreen({ onComplete }: BootScreenProps) {
    const [phase, setPhase] = useState<'rotating' | 'zooming' | 'done'>('rotating');

    useEffect(() => {
        const rotateTimer = setTimeout(() => {
            setPhase('zooming');
        }, 1800);

        const zoomTimer = setTimeout(() => {
            setPhase('done');
            setTimeout(onComplete, 400);
        }, 3000);

        return () => {
            clearTimeout(rotateTimer);
            clearTimeout(zoomTimer);
        };
    }, [onComplete]);

    return (
        <AnimatePresence>
            {phase !== 'done' && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="fixed inset-0 z-[9999] bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center overflow-hidden"
                >
                    {/* Subtle floating green blobs */}
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            className="absolute w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl"
                            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            style={{ top: '10%', right: '10%' }}
                        />
                        <motion.div
                            className="absolute w-[500px] h-[500px] rounded-full bg-emerald-300/30 blur-3xl"
                            animate={{ x: [0, -30, 0], y: [0, 50, 0] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            style={{ bottom: '10%', left: '-10%' }}
                        />
                    </div>

                    <div className="relative flex flex-col items-center">
                        {phase === 'rotating' && (
                            <motion.div
                                className="relative"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{
                                    scale: [0, 1.2, 1],
                                    rotate: [-180, 360, 720],
                                }}
                                transition={{
                                    duration: 1.6,
                                    times: [0, 0.5, 1],
                                    ease: "easeInOut",
                                }}
                            >
                                <motion.img
                                    src="/images/envirolink-icon.png"
                                    alt="ENVIROLINK"
                                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 object-contain drop-shadow-2xl"
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 1.5, ease: "easeInOut" }}
                                />
                                <motion.div
                                    className="absolute inset-0 rounded-full bg-emerald-400/30 blur-2xl"
                                    animate={{
                                        opacity: [0.3, 0.6, 0.3],
                                        scale: [1, 1.3, 1],
                                    }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                />
                            </motion.div>
                        )}

                        {phase === 'zooming' && (
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: [0.3, 1.1, 1], opacity: 1 }}
                                transition={{
                                    duration: 0.8,
                                    times: [0, 0.6, 1],
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                            >
                                <motion.div
                                    className="flex items-center gap-3 sm:gap-4"
                                    initial={{ y: 20 }}
                                    animate={{ y: 0 }}
                                    transition={{ delay: 0.2, duration: 0.5 }}
                                >
                                    <motion.img
                                        src="/images/envirolink-icon.png"
                                        alt=""
                                        className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 object-contain"
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ delay: 0.5, duration: 0.5 }}
                                    />
                                    <motion.img
                                        src="/images/envirolink-logo.png"
                                        alt="ENVIROLINK"
                                        className="h-10 sm:h-14 lg:h-16 w-auto object-contain"
                                    />
                                </motion.div>

                                <motion.p
                                    className="mt-4 text-emerald-600/70 text-sm sm:text-base font-medium"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, duration: 0.4 }}
                                >
                                    Report. Track. Resolve.
                                </motion.p>

                                <motion.div
                                    className="flex gap-1.5 mt-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-2 h-2 rounded-full bg-emerald-500"
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 1, 0.5],
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                repeat: Infinity,
                                                delay: i * 0.15,
                                            }}
                                        />
                                    ))}
                                </motion.div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
