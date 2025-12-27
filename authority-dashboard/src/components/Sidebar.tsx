'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, FileText, Map, Users, BarChart3,
    Settings, Bell, LogOut, ChevronRight, Sparkles
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/reports', icon: FileText, label: 'Reports' },
    { href: '/assignment', icon: Sparkles, label: 'AI Assignment' },
    { href: '/map', icon: Map, label: 'Map View' },
    { href: '/workers', icon: Users, label: 'Workers' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="px-5 py-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <img
                        src="/images/envirolink-icon.png"
                        alt="ENVIROLINK"
                        className="w-10 h-10 object-contain"
                    />
                    <div>
                        <img
                            src="/images/envirolink-logo.png"
                            alt="ENVIROLINK"
                            className="h-5 w-auto object-contain"
                        />
                        <p className="text-xs text-gray-500 mt-0.5">Authority Dashboard</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="py-4">
                <p className="px-5 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Main Menu
                </p>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx('sidebar-nav-item', isActive && 'active')}
                        >
                            <Icon size={18} />
                            <span>{item.label}</span>
                            {isActive && <ChevronRight size={14} className="ml-auto opacity-50" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600">
                        AD
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">Admin User</p>
                        <p className="text-xs text-gray-500">Mumbai Municipal</p>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
}
