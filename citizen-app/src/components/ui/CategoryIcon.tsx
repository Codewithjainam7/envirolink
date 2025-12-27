'use client';

import {
    Trash2, PackageOpen, Wind, HardHat, Cpu, Leaf,
    LucideIcon
} from 'lucide-react';
import { WasteCategory } from '@/types';

// Icon mapping from string names to components
const iconMap: Record<string, LucideIcon> = {
    Trash2,
    PackageOpen,
    Wind,
    HardHat,
    Cpu,
    Leaf,
};

interface CategoryIconProps {
    category: WasteCategory;
    size?: number;
    className?: string;
}

const categoryIcons: Record<WasteCategory, LucideIcon> = {
    illegal_dumping: Trash2,
    overflowing_bin: PackageOpen,
    littering: Wind,
    construction_debris: HardHat,
    e_waste: Cpu,
    organic_waste: Leaf,
};

const categoryColors: Record<WasteCategory, string> = {
    illegal_dumping: '#ef4444',
    overflowing_bin: '#f59e0b',
    littering: '#eab308',
    construction_debris: '#6b7280',
    e_waste: '#3b82f6',
    organic_waste: '#10b981',
};

export default function CategoryIcon({ category, size = 24, className = '' }: CategoryIconProps) {
    const Icon = categoryIcons[category];
    const color = categoryColors[category];

    return (
        <div
            className={`flex items-center justify-center rounded-xl ${className}`}
            style={{ backgroundColor: `${color}15` }}
        >
            <Icon size={size} style={{ color }} strokeWidth={2} />
        </div>
    );
}

export { categoryIcons, categoryColors, iconMap };
