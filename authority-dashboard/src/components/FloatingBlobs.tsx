'use client';

import { motion } from 'framer-motion';

export default function FloatingBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {/* Blob 1 - Top right */}
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{
                    x: [100, 200, 50, 100],
                    y: [50, 150, 100, 50],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: '10%', right: '10%' }}
            />
            {/* Blob 2 - Left side */}
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{
                    x: [-50, 100, 0, -50],
                    y: [200, 100, 300, 200],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ top: '30%', left: '-5%' }}
            />
            {/* Blob 3 - Bottom center */}
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{
                    x: [0, 100, -50, 0],
                    y: [0, -100, 50, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '5%', left: '40%' }}
            />
            {/* Blob 4 - Top left */}
            <motion.div
                className="absolute w-48 h-48 rounded-full bg-emerald-200/30 blur-3xl"
                animate={{
                    x: [0, 80, -20, 0],
                    y: [0, 50, -30, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{ top: '5%', left: '15%' }}
            />
        </div>
    );
}
