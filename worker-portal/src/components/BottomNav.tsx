'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Navigation, Wallet, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { icon: ClipboardList, label: 'Tasks', href: '/' },
        { icon: Navigation, label: 'Navigate', href: '/map' },
        { icon: Wallet, label: 'Earnings', href: '/earnings' },
        { icon: User, label: 'Profile', href: '/profile' },
    ];

    return (
        <nav
            aria-label="Worker portal navigation"
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-emerald-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 sm:px-4 py-2 sm:py-3 z-50"
        >
            <div className="max-w-2xl mx-auto flex justify-around items-center gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href} className="flex-1 flex justify-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex flex-col items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition ${isActive
                                        ? 'text-emerald-700 bg-emerald-50 font-semibold'
                                        : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50/70'
                                    }`}
                            >
                                <item.icon size={21} />
                                <span className="text-[11px] sm:text-xs font-semibold">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
