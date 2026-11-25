'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, Plus, Bell, User } from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '@/store';

const navItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/map', icon: Map, label: 'Map' },
    { href: '/report', icon: Plus, label: 'Report' },
    { href: '/notifications', icon: Bell, label: 'Alerts' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
    const pathname = usePathname();
    const { userReports } = useAppStore();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-around px-2 sm:px-4 z-[100] pb-safe">
            {navItems.map((item) => {
                const isActive = item.href === '/home'
                    ? (pathname === '/' || pathname === '/home')
                    : pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            'relative flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200',
                            isActive
                                ? 'text-emerald-500'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId="navIndicator"
                                className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl"
                                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                        )}
                        <div className="relative">
                            <Icon
                                size={20}
                                className={clsx(
                                    'relative z-10 transition-transform',
                                    isActive && 'scale-110 text-emerald-600'
                                )}
                            />
                            {item.href === '/profile' && userReports && userReports.length > 0 && (
                                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center z-20">
                                    {userReports.length > 9 ? '9+' : userReports.length}
                                </span>
                            )}
                        </div>
                        <span className={clsx(
                            'text-[11px] font-medium relative z-10',
                            isActive ? 'text-emerald-600 font-bold' : ''
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
