'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone } from 'lucide-react';

export default function MobileBlocker() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!isMobile) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[9999] bg-gradient-to-br from-emerald-50 via-white to-emerald-100 flex items-center justify-center p-6"
        >
            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
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

            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative bg-white/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-emerald-100 text-center"
            >
                {/* Icon */}
                <motion.div
                    className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center mb-6"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    <Monitor size={40} className="text-emerald-600" />
                </motion.div>

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-4">
                    <img
                        src="/images/envirolink-icon.png"
                        alt="ENVIROLINK"
                        className="w-8 h-8 object-contain"
                    />
                    <img
                        src="/images/envirolink-logo.png"
                        alt="ENVIROLINK"
                        className="h-6 w-auto object-contain"
                    />
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Desktop Required
                </h1>
                <p className="text-gray-600 mb-6">
                    The Authority Dashboard is optimized for desktop devices.
                    Please open this page on a computer with a screen width of at least 1024px.
                </p>

                {/* Visual indicator */}
                <div className="flex items-center justify-center gap-4 p-4 bg-emerald-50 rounded-xl">
                    <div className="flex items-center gap-2 text-red-500">
                        <Smartphone size={24} />
                        <span className="text-sm font-medium">Mobile</span>
                    </div>
                    <span className="text-gray-400">→</span>
                    <div className="flex items-center gap-2 text-emerald-600">
                        <Monitor size={24} />
                        <span className="text-sm font-medium">Desktop</span>
                    </div>
                </div>

                {/* Animated dots */}
                <motion.div
                    className="flex gap-1.5 mt-6 justify-center"
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
        </motion.div>
    );
}
