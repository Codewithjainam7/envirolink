'use client';

import clsx from 'clsx';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
}

export default function Skeleton({
    className,
    variant = 'rectangular',
    width,
    height,
}: SkeletonProps) {
    const baseStyles = 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 bg-[length:200%_100%] animate-[skeleton-loading_1.5s_infinite]';

    const variants = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-xl',
    };

    const style = {
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : variant === 'circular' ? '48px' : '100px'),
    };

    return (
        <div
            className={clsx(baseStyles, variants[variant], className)}
            style={style}
        />
    );
}

// Skeleton Card preset
export function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800">
            <div className="flex gap-4">
                <Skeleton variant="rectangular" width={80} height={80} className="rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="40%" />
                </div>
            </div>
        </div>
    );
}

// Skeleton Stats preset
export function SkeletonStats() {
    return (
        <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                    <Skeleton variant="text" width={60} height={32} className="mb-2" />
                    <Skeleton variant="text" width={80} height={14} />
                </div>
            ))}
        </div>
    );
}
