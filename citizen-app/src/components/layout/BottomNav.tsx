'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Map, Bell, User } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/map', icon: Map, label: 'Map' },
    { href: '/notifications', icon: Bell, label: 'Alerts' },
    { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-800/50 flex items-center justify-around px-4 z-[100] pb-safe">
            {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={clsx(
                            'relative flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200',
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
                        <Icon
                            size={22}
                            className={clsx(
                                'relative z-10 transition-transform',
                                isActive && 'scale-110'
                            )}
                        />
                        <span className={clsx(
                            'text-xs font-medium relative z-10',
                            isActive ? 'text-emerald-600 dark:text-emerald-400' : ''
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
