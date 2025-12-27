'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';

interface ActionSliderProps {
    onComplete: () => void;
    label?: string;
    completedLabel?: string;
    color?: string; // 'emerald' | 'blue' | 'red'
}

export default function ActionSlider({
    onComplete,
    label = 'Slide to Confirm',
    completedLabel = 'Confirmed!',
    color = 'emerald'
}: ActionSliderProps) {
    const [isCompleted, setIsCompleted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const controls = useAnimation();

    // Constraints
    const [constraints, setConstraints] = useState({ left: 0, right: 0 });

    useEffect(() => {
        if (containerRef.current) {
            setConstraints({
                left: 0,
                right: containerRef.current.offsetWidth - 56 // width - handle width
            });
        }
    }, []);

    const handleDragEnd = () => {
        if (x.get() > constraints.right - 20) {
            // Completed
            x.set(constraints.right);
            setIsCompleted(true);
            onComplete();
        } else {
            // Reset
            controls.start({ x: 0 });
        }
    };

    const bgColors = {
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        red: 'bg-red-500',
    };

    const bgLightColors = {
        emerald: 'bg-emerald-50',
        blue: 'bg-blue-50',
        red: 'bg-red-50',
    };

    const textColors = {
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        red: 'text-red-600',
    };

    const activeColor = bgColors[color as keyof typeof bgColors] || bgColors.emerald;
    const activeLightColor = bgLightColors[color as keyof typeof bgLightColors] || bgLightColors.emerald;
    const activeTextColor = textColors[color as keyof typeof textColors] || textColors.emerald;

    return (
        <div
            ref={containerRef}
            className={`relative h-14 rounded-full ${isCompleted ? activeColor : activeLightColor} overflow-hidden shadow-inner transition-colors duration-300`}
        >
            {/* Background Text */}
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-sm ${isCompleted ? 'text-white' : activeTextColor}`}>
                {isCompleted ? (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2"
                    >
                        <Check size={18} /> {completedLabel}
                    </motion.div>
                ) : (
                    <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {label}
                    </motion.span>
                )}
            </div>

            {/* Slider Handle */}
            {!isCompleted && (
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: constraints.right }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                    animate={controls}
                    style={{ x }}
                    whileTap={{ scale: 1.1, cursor: 'grabbing' }}
                    className={`absolute top-1 left-1 bottom-1 w-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10 cursor-grab ${activeTextColor}`}
                >
                    <ChevronRight size={24} />
                </motion.div>
            )}

            {/* Progress Fill */}
            {!isCompleted && (
                <motion.div
                    className={`absolute top-0 left-0 bottom-0 ${activeColor} opacity-20`}
                    style={{ width: x }}
                />
            )}
        </div>
    );
}
