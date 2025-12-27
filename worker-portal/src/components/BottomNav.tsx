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
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-emerald-100 px-4 py-3 z-50">
            <div className="max-w-7xl mx-auto flex justify-around">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.label} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition ${isActive
                                        ? 'text-emerald-600 bg-emerald-50'
                                        : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                    }`}
                            >
                                <item.icon size={22} />
                                <span className="text-xs font-medium">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
