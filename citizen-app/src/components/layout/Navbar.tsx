'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Globe, Home, Map, Bell, User, Menu, X, Plus, LogIn,
    ChevronDown, Search, IndianRupee, Info, Phone as PhoneIcon, Languages
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAppStore } from '@/store';

const navLinks = [
    { href: '/home', label: 'Home', icon: Home },
    { href: '/map', label: 'Map', icon: Map },
    { href: '/pricing', label: 'Pricing', icon: IndianRupee },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: PhoneIcon },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showTranslate, setShowTranslate] = useState(false);
    const { user, isAuthenticated, initializeAuth } = useAppStore();

    // Initialize auth on mount
    useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिंदी (Hindi)' },
        { code: 'mr', name: 'मराठी (Marathi)' },
        { code: 'ta', name: 'தமிழ் (Tamil)' },
        { code: 'te', name: 'తెలుగు (Telugu)' },
        { code: 'bn', name: 'বাংলা (Bengali)' },
        { code: 'gu', name: 'ગુજરાતી (Gujarati)' },
        { code: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
        { code: 'ml', name: 'മലയാളം (Malayalam)' },
    ];

    // Load Google Translate script
    useEffect(() => {
        const addScript = () => {
            const script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);
            (window as any).googleTranslateElementInit = () => {
                new (window as any).google.translate.TranslateElement(
                    { pageLanguage: 'en', includedLanguages: 'hi,mr,ta,te,bn,gu,kn,ml,pa,ur,en', layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false },
                    'google_translate_element'
                );
            };
        };
        if (!(window as any).google?.translate) addScript();
    }, []);

    const translateTo = (langCode: string) => {
        // Set the googletrans cookie which Google Translate uses
        document.cookie = `googtrans=/en/${langCode}; path=/`;
        document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;

        // Try to use the select dropdown if available
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
            setShowTranslate(false);
        } else {
            // If Google Translate hasn't loaded yet, reload the page
            setShowTranslate(false);
            window.location.reload();
        }
    };

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.165, 0.84, 0.44, 1] }}
            className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-200/30"
        >
            <div className="max-w-7xl mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link href="/home" className="flex items-center gap-2 group">
                        <motion.img
                            src="/images/envirolink-icon.png"
                            alt=""
                            className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 object-contain"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                        />
                        <motion.img
                            src="/images/envirolink-logo.png"
                            alt="ENVIROLINK"
                            className="h-6 sm:h-7 lg:h-8 max-w-[120px] sm:max-w-[150px] lg:max-w-[180px] w-auto object-contain"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={clsx(
                                        'relative px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2',
                                        isActive
                                            ? 'text-emerald-600'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    )}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="navActiveIndicator"
                                            className="absolute inset-0 bg-emerald-50 rounded-xl"
                                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon size={16} className="relative z-10" />
                                    <span className="relative z-10">{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Report Button */}
                        <Link href="/report">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-sm rounded-xl transition-all"
                            >
                                <Plus size={18} />
                                Report Issue
                            </motion.button>
                        </Link>
                        {/* Translate Button with Dropdown */}
                        <div className="relative">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowTranslate(!showTranslate)}
                                className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-600 hover:from-blue-100 hover:to-indigo-200 transition-all"
                                title="Translate"
                            >
                                <Languages size={20} />
                            </motion.button>

                            {/* Language Dropdown */}
                            {showTranslate && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-50"
                                >
                                    <p className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold">Select Language</p>
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => translateTo(lang.code)}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                            <div id="google_translate_element" className="hidden" />
                        </div>

                        {/* User Menu */}
                        {user ? (
                            <Link href="/profile" className="flex items-center gap-2">
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold cursor-pointer"
                                >
                                    {user.profile?.avatar ? (
                                        <img
                                            src={user.profile.avatar}
                                            alt={user.profile?.firstName || 'User'}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{(user.profile?.firstName?.[0] || user.email?.[0] || 'U').toUpperCase()}</span>
                                    )}
                                </motion.div>
                                <div className="hidden lg:block">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {user.profile?.firstName || user.email?.split('@')[0] || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-500">{user.engagement?.points || 0} pts</p>
                                </div>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 font-medium text-sm hover:bg-gray-100 rounded-xl transition-colors"
                                    >
                                        <LogIn size={18} />
                                        <span className="hidden sm:inline">Sign In</span>
                                    </motion.button>
                                </Link>
                                <Link href="/register">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold text-sm rounded-xl"
                                    >
                                        Register
                                    </motion.button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                initial={false}
                animate={{ height: mobileMenuOpen ? 'auto' : 0, opacity: mobileMenuOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.165, 0.84, 0.44, 1] }}
                className="lg:hidden overflow-hidden border-t border-gray-200"
            >
                <div className="px-4 py-4 space-y-2 bg-white">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all',
                                    isActive
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <Icon size={20} />
                                {link.label}
                            </Link>
                        );
                    })}

                    {/* Mobile Report Button */}
                    <Link
                        href="/report"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 w-full px-4 py-3 bg-emerald-500 text-white rounded-xl font-semibold mt-4"
                    >
                        <Plus size={20} />
                        Report Issue
                    </Link>
                </div>
            </motion.div>
        </motion.header>
    );
}

