'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sprout, Award, Gift, Sparkles, CheckCircle2, ShieldCheck, Copy, Check,
    ArrowRight, Leaf, ShoppingBag, Ticket, X, Trophy, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppStore } from '@/store';
import { FloatingBlobs } from '@/components';
import {
    PERK_CATEGORIES,
    GREEN_PERKS_CATALOG,
    SHOWCASE_SPONSOR_PARTNERS,
    PerkCategory,
    GreenPerkItem,
} from '@/lib/greenperks';

interface ClaimedPerkRecord {
    claimId: string;
    perkId: string;
    title: string;
    brand: string;
    partnerLogo: string;
    image: string;
    pointsCost: number;
    voucherCode: string;
    claimedAt: string;
}

const CLAIMED_PERKS_STORAGE_KEY = 'envirolink_greenperks_claims_v1';

const MINTING_STEPS = [
    'Validating GreenPerks PTS wallet',
    'Locking showcase partner allocation',
    'Issuing digital Eco-Voucher pass',
];

export default function GreenPerksPage() {
    const { user, isAuthenticated, initializeAuth } = useAppStore();

    const [activeCategory, setActiveCategory] = useState<PerkCategory>('all');
    const [demoPreviewMode, setDemoPreviewMode] = useState(false);
    const [demoSpentPoints, setDemoSpentPoints] = useState(0);
    const [joinedChallenge, setJoinedChallenge] = useState(false);
    const [selectedPerk, setSelectedPerk] = useState<GreenPerkItem | null>(null);
    const [isConfirmingRedeem, setIsConfirmingRedeem] = useState(false);
    const [isMintingVoucher, setIsMintingVoucher] = useState(false);
    const [mintStep, setMintStep] = useState(0);
    const [claimedPerks, setClaimedPerks] = useState<ClaimedPerkRecord[]>([]);
    const [justClaimedRecord, setJustClaimedRecord] = useState<ClaimedPerkRecord | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [showClaimedDrawer, setShowClaimedDrawer] = useState(false);

    useEffect(() => {
        initializeAuth();
        try {
            const raw = localStorage.getItem(CLAIMED_PERKS_STORAGE_KEY);
            if (raw) setClaimedPerks(JSON.parse(raw));
        } catch {
            // Ignore malformed storage cleanly
        }
    }, [initializeAuth]);

    const realPoints = user?.engagement?.points ?? 0;
    const effectiveBalance = Math.max(
        0,
        (demoPreviewMode ? Math.max(realPoints, 120) : realPoints) - demoSpentPoints
    );
    const userRank = demoPreviewMode && effectiveBalance >= 100
        ? 'Civic Contributor'
        : (user?.engagement?.rank || 'New Reporter');

    const filteredCatalog = GREEN_PERKS_CATALOG.filter(
        (item) => activeCategory === 'all' || item.category === activeCategory
    );

    const handleRedeemConfirm = async () => {
        if (!selectedPerk || isConfirmingRedeem) return;
        if (effectiveBalance < selectedPerk.pointsCost) {
            toast.error(`Need ${selectedPerk.pointsCost - effectiveBalance} more PTS to unlock this perk.`);
            return;
        }

        const perkToClaim = selectedPerk;
        setIsConfirmingRedeem(true);
        await new Promise((resolve) => setTimeout(resolve, 260));

        const prefix = perkToClaim.brand.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ECO';
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const record: ClaimedPerkRecord = {
            claimId: `claim-${Date.now()}`,
            perkId: perkToClaim.id,
            title: perkToClaim.title,
            brand: perkToClaim.brand,
            partnerLogo: perkToClaim.partnerLogo,
            image: perkToClaim.image,
            pointsCost: perkToClaim.pointsCost,
            voucherCode: `ELGP-${prefix}-${suffix}`,
            claimedAt: new Date().toISOString(),
        };

        const nextClaims = [record, ...claimedPerks];
        setClaimedPerks(nextClaims);
        setDemoSpentPoints((prev) => prev + perkToClaim.pointsCost);
        try {
            localStorage.setItem(CLAIMED_PERKS_STORAGE_KEY, JSON.stringify(nextClaims.slice(0, 20)));
        } catch {}

        setIsConfirmingRedeem(false);
        setSelectedPerk(null);

        // Smooth Apple-Wallet-style 3-step generation (no clunky spin icons)
        setJustClaimedRecord(record);
        setMintStep(0);
        setIsMintingVoucher(true);
        await new Promise((resolve) => setTimeout(resolve, 340));
        setMintStep(1);
        await new Promise((resolve) => setTimeout(resolve, 340));
        setMintStep(2);
        await new Promise((resolve) => setTimeout(resolve, 360));
        setIsMintingVoucher(false);
        toast.success('GreenPerk Eco-Pass unlocked!');
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success('Voucher code copied!');
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            toast.error('Copy not supported here');
        }
    };

    return (
        <div className="min-h-screen font-sans bg-gradient-to-br from-emerald-50/50 via-white to-gray-50 relative pb-24">
            <FloatingBlobs />

            {/* Sunlit Glass Header & Citizen Wallet matching EnviroLink theme */}
            <section className="relative z-10 bg-white/80 backdrop-blur-xl border-b border-emerald-100/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    <div className="grid lg:grid-cols-12 gap-8 items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                            className="lg:col-span-7 space-y-4"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs sm:text-sm font-bold border border-emerald-200/70">
                                <Sprout size={15} className="text-emerald-600" />
                                EnviroLink GreenPerks · Zero-Ad Sustainability Marketplace
                            </div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                Turn Cleanup Action into{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">
                                    Real Eco Perks
                                </span>
                            </h1>
                            <p className="text-gray-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                                Earn <span className="font-bold text-emerald-700">+20 PTS</span> for every verified &amp; resolved civic waste report.
                                Redeem rewards funded by sustainable brand partners — keeping reporting and tracking 100% ad-free.
                            </p>
                        </motion.div>

                        {/* Light Emerald Glass Wallet Card matching Citizen Portal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.08 }}
                            className="lg:col-span-5"
                        >
                            <div className="relative rounded-3xl bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/90 border-2 border-emerald-200 p-6 shadow-xl shadow-emerald-500/10 overflow-hidden">
                                <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-emerald-200/40 blur-2xl pointer-events-none" />

                                <div className="relative flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                            <Award size={14} />
                                            {demoPreviewMode ? 'Demo Presentation Balance' : isAuthenticated ? 'Your GreenPerks Wallet' : 'Citizen Rewards Wallet'}
                                        </p>
                                        <div className="flex items-baseline gap-2 mt-2">
                                            <motion.span
                                                key={effectiveBalance}
                                                initial={{ scale: 0.9, opacity: 0.6 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight"
                                            >
                                                {effectiveBalance}
                                            </motion.span>
                                            <span className="text-base font-extrabold text-emerald-600">PTS</span>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shrink-0">
                                        {userRank}
                                    </span>
                                </div>

                                <div className="mt-5 pt-4 border-t border-emerald-100 flex flex-wrap items-center justify-between gap-2.5">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        onClick={() => {
                                            setDemoPreviewMode((prev) => !prev);
                                            setDemoSpentPoints(0);
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                            demoPreviewMode
                                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                                : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}
                                    >
                                        <Sparkles size={13} />
                                        {demoPreviewMode ? 'Expo Demo Mode (120+ PTS) On' : 'Try Demo Balance (120 PTS)'}
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        onClick={() => setShowClaimedDrawer(true)}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 transition-colors"
                                    >
                                        <Ticket size={13} className="text-emerald-600" />
                                        Claimed ({claimedPerks.length})
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-14">
                {/* Catalog Section */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
                                <ShoppingBag size={24} className="text-emerald-500" />
                                Sponsored Rewards Catalog
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Sustainable rewards showcased with real eco-brand partner logos &amp; illustrative redemption points.
                            </p>
                        </div>
                        {!isAuthenticated && (
                            <Link
                                href="/login?next=/perks"
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs sm:text-sm font-bold hover:bg-emerald-100 transition-colors w-fit"
                            >
                                Sign in to sync live PTS
                                <ArrowRight size={15} />
                            </Link>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2">
                        {PERK_CATEGORIES.map((cat) => {
                            const active = activeCategory === cat.id;
                            return (
                                <motion.button
                                    key={cat.id}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                                        active
                                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/70'
                                    }`}
                                >
                                    {cat.label}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Rewards Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredCatalog.map((perk, idx) => {
                            const canAfford = effectiveBalance >= perk.pointsCost;
                            const progressPct = Math.min(100, Math.round((effectiveBalance / perk.pointsCost) * 100));

                            return (
                                <motion.div
                                    key={perk.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.05, 0.25) }}
                                    whileHover={{ y: -4 }}
                                    className="bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-emerald-100/80 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all overflow-hidden flex flex-col"
                                >
                                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                        <img
                                            src={perk.image}
                                            alt={perk.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 block"
                                        />
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-bold text-gray-800 shadow-sm">
                                                {perk.tag}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/95 text-[11px] font-bold text-white shadow-sm">
                                                {perk.categoryLabel}
                                            </span>
                                        </div>
                                        <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm border border-emerald-200 text-xs font-extrabold text-emerald-700 shadow-sm">
                                            {perk.pointsCost} PTS
                                        </span>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        {/* Real Partner Brand Logo + Value */}
                                        <div className="flex items-center justify-between gap-3 mb-3">
                                            <div className="inline-flex items-center gap-2 min-w-0">
                                                <div className="h-8 w-16 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                                                    <img
                                                        src={perk.partnerLogo}
                                                        alt={perk.brand}
                                                        className="max-h-full max-w-full object-contain"
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-emerald-700 truncate">
                                                    {perk.brand}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-semibold text-gray-400 shrink-0">
                                                {perk.retailValue}
                                            </span>
                                        </div>

                                        <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                                            {perk.title}
                                        </h3>

                                        <p className="text-sm text-gray-600 mt-2 leading-relaxed flex-1">
                                            {perk.description}
                                        </p>

                                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                                            {!canAfford && (
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-gray-500 font-medium">
                                                            {perk.pointsCost - effectiveBalance} more PTS needed
                                                        </span>
                                                        <span className="text-emerald-700 font-bold">{progressPct}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-300"
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <motion.button
                                                whileHover={{ scale: 1.015 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => setSelectedPerk(perk)}
                                                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                    canAfford
                                                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}
                                            >
                                                <Gift size={16} />
                                                {canAfford ? `Redeem for ${perk.pointsCost} PTS` : 'Preview Reward'}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Sunlit Emerald Brand-Sponsored Challenge Banner matching theme */}
                <section className="rounded-3xl bg-gradient-to-r from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 p-6 sm:p-8 lg:p-10 shadow-lg relative overflow-hidden">
                    <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-emerald-200/35 blur-3xl pointer-events-none" />
                    <div className="relative z-10 grid lg:grid-cols-12 gap-6 items-center">
                        <div className="lg:col-span-7 space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                                    <Trophy size={13} className="text-emerald-600" />
                                    Sponsored Civic Challenge
                                </span>
                                <div className="h-9 px-3 rounded-xl bg-white border border-gray-200 shadow-xs flex items-center">
                                    <img
                                        src="/images/partners/bottlesforchange.png"
                                        alt="Bisleri Bottles for Change"
                                        className="h-6 w-auto object-contain"
                                    />
                                </div>
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                30-Day Clean Neighbourhood Challenge
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                                Powered by <span className="font-bold text-emerald-700">Bisleri — Bottles for Change (Showcase Partner)</span>.
                                Citizens who log 5 verified plastic or public-waste cleanups this month unlock co-branded sustainability kits with zero third-party ads.
                            </p>
                        </div>

                        <div className="lg:col-span-5 bg-white/90 backdrop-blur-md border border-emerald-200 rounded-2xl p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 font-semibold">Challenge Milestone</span>
                                <span className="font-extrabold text-emerald-700">+50 Bonus PTS</span>
                            </div>
                            <div className="h-2.5 bg-emerald-100 rounded-full overflow-hidden">
                                <motion.div
                                    initial={false}
                                    animate={{ width: joinedChallenge ? '45%' : '15%' }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                />
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.015 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => {
                                    setJoinedChallenge((prev) => !prev);
                                    toast.success(
                                        joinedChallenge
                                            ? 'Left preview challenge'
                                            : 'Joined 30-Day Clean Neighbourhood Challenge!'
                                    );
                                }}
                                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                    joinedChallenge
                                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400'
                                        : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20'
                                }`}
                            >
                                <CheckCircle2 size={16} />
                                {joinedChallenge ? 'Joined Challenge (Active)' : 'Join Showcase Challenge'}
                            </motion.button>
                        </div>
                    </div>
                </section>

                {/* Official Showcase Partner Logos & Zero-Ad Revenue Architecture */}
                <section className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
                                <Layers size={24} className="text-emerald-500" />
                                Showcase Partners &amp; CSR Monetization Model
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Real Indian sustainability &amp; gardening brands illustrated as CSR reward sponsors (no active commercial endorsement implied).
                            </p>
                        </div>
                        <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold w-fit">
                            Expo Showcase · Outreach Targets
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {SHOWCASE_SPONSOR_PARTNERS.map((partner, idx) => (
                            <motion.div
                                key={partner.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.04 }}
                                whileHover={{ y: -3 }}
                                className="bg-white/95 rounded-2xl border border-emerald-100 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col gap-3.5"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-20 h-12 rounded-xl bg-white border border-gray-200 p-2 flex items-center justify-center shrink-0 shadow-xs">
                                        <img
                                            src={partner.logo}
                                            alt={partner.name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 text-base truncate">{partner.name}</h3>
                                        <p className="text-[11px] font-semibold text-emerald-700 truncate">{partner.websiteLabel}</p>
                                    </div>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{partner.focus}</p>
                                <div className="pt-2.5 border-t border-gray-100 mt-auto">
                                    <p className="text-xs font-semibold text-gray-800">{partner.rewardModel}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* 3 Clean Pillars */}
                    <div className="grid sm:grid-cols-3 gap-5 pt-2">
                        {[
                            {
                                icon: ShieldCheck,
                                title: 'Zero Pop-Ups While Reporting',
                                desc: 'Camera, GPS geotagging, AI validation, and live map remain 100% clean and uninterrupted.',
                            },
                            {
                                icon: Award,
                                title: 'CSR Co-Branded Rewards',
                                desc: 'Brands fund bottles, compost kits, plants, and refill codes in exchange for verified green engagement.',
                            },
                            {
                                icon: Leaf,
                                title: 'Circular Green Economy',
                                desc: 'Civic participation drives adoption of reusable, zero-waste consumer alternatives.',
                            },
                        ].map((pillar) => (
                            <div key={pillar.title} className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5">
                                <div className="w-10 h-10 rounded-xl bg-white border border-emerald-200 flex items-center justify-center mb-3 shadow-xs">
                                    <pillar.icon size={20} className="text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base">{pillar.title}</h3>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1.5 leading-relaxed">{pillar.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Animated Reward Confirmation Dialog Box (always renders reliable product image + Nunito fonts) */}
            <AnimatePresence>
                {selectedPerk && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-gray-900/45 backdrop-blur-md flex items-center justify-center p-4 font-sans"
                        onClick={() => !isConfirmingRedeem && setSelectedPerk(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 14 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-100 max-w-md w-full overflow-hidden relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Crisp Explicit-Height Product Preview (guaranteed visible image) */}
                            <div className="relative w-full h-56 bg-emerald-50 overflow-hidden">
                                <img
                                    src={selectedPerk.image}
                                    alt={selectedPerk.title}
                                    loading="eager"
                                    decoding="sync"
                                    className="w-full h-full object-cover block"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

                                {/* Partner Logo Pill */}
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.08 }}
                                    className="absolute bottom-3 left-4 h-9 px-3 rounded-xl bg-white/95 backdrop-blur-md border border-white shadow-md flex items-center gap-2 z-10"
                                >
                                    <img
                                        src={selectedPerk.partnerLogo}
                                        alt={selectedPerk.brand}
                                        className="h-5 w-auto max-w-[76px] object-contain"
                                    />
                                    <span className="text-[11px] font-bold text-emerald-700 border-l border-gray-200 pl-2">
                                        {selectedPerk.pointsCost} PTS
                                    </span>
                                </motion.div>

                                <motion.button
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.92 }}
                                    type="button"
                                    onClick={() => !isConfirmingRedeem && setSelectedPerk(null)}
                                    className="absolute top-3.5 right-3.5 p-2 rounded-full bg-white/95 text-gray-700 hover:bg-white shadow-md transition-colors z-10"
                                >
                                    <X size={18} />
                                </motion.button>
                            </div>

                            <div className="p-6 space-y-5">
                                <div>
                                    <p className="text-xs font-bold text-emerald-700">{selectedPerk.brand}</p>
                                    <h3 className="text-xl font-extrabold text-gray-900 mt-0.5">{selectedPerk.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{selectedPerk.description}</p>
                                </div>

                                {/* Animated Balance Deduction Meter */}
                                {(() => {
                                    const canAfford = effectiveBalance >= selectedPerk.pointsCost;
                                    const remaining = Math.max(0, effectiveBalance - selectedPerk.pointsCost);
                                    const maxScale = Math.max(effectiveBalance, selectedPerk.pointsCost, 1);
                                    const afterPct = canAfford ? Math.round((remaining / maxScale) * 100) : Math.round((effectiveBalance / maxScale) * 100);
                                    const currentPct = Math.round((effectiveBalance / maxScale) * 100);

                                    return (
                                        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-500 font-semibold">Current Wallet</p>
                                                    <p className="text-base font-extrabold text-gray-900">{effectiveBalance} PTS</p>
                                                </div>
                                                <ArrowRight size={18} className="text-emerald-500" />
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 font-semibold">
                                                        {canAfford ? 'Balance After' : 'Points Short'}
                                                    </p>
                                                    <p className={`text-base font-extrabold ${canAfford ? 'text-emerald-700' : 'text-amber-600'}`}>
                                                        {canAfford ? `${remaining} PTS` : `-${selectedPerk.pointsCost - effectiveBalance} PTS`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-2.5 w-full bg-white rounded-full overflow-hidden border border-emerald-100">
                                                <motion.div
                                                    initial={{ width: `${currentPct}%` }}
                                                    animate={{ width: `${afterPct}%` }}
                                                    transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                                                    className={`h-full rounded-full ${canAfford ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-amber-400'}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })()}

                                {effectiveBalance < selectedPerk.pointsCost && (
                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                        Tip: Toggle <strong>Try Demo Balance (120 PTS)</strong> in the wallet card to demonstrate instant voucher generation during your Expo talk.
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={isConfirmingRedeem}
                                        onClick={() => setSelectedPerk(null)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.015 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        disabled={effectiveBalance < selectedPerk.pointsCost || isConfirmingRedeem}
                                        onClick={handleRedeemConfirm}
                                        className="flex-[1.35] py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                                    >
                                        <Gift size={16} />
                                        {isConfirmingRedeem ? 'Preparing Pass...' : 'Confirm Redeem'}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clean Apple-Wallet Style Eco-Voucher Minting & Digital Pass Modal */}
            <AnimatePresence>
                {justClaimedRecord && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-md flex items-center justify-center p-4 font-sans"
                        onClick={() => !isMintingVoucher && setJustClaimedRecord(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 14 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="relative max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <AnimatePresence mode="wait">
                                {isMintingVoucher ? (
                                    <motion.div
                                        key="minting-step"
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, y: -12, scale: 0.98 }}
                                        transition={{ duration: 0.24 }}
                                        className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 p-6 sm:p-7 space-y-5 overflow-hidden relative"
                                    >
                                        {/* Preview strip: actual product thumbnail + partner logo */}
                                        <div className="flex items-center gap-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3">
                                            <img
                                                src={justClaimedRecord.image}
                                                alt={justClaimedRecord.title}
                                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-emerald-200"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                                    EnviroLink GreenPerks
                                                </p>
                                                <h3 className="text-base font-extrabold text-gray-900 truncate">
                                                    {justClaimedRecord.title}
                                                </h3>
                                                <p className="text-xs text-gray-500 font-medium truncate">
                                                    {justClaimedRecord.brand}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Smooth 3-Step Horizontal Checklist + Shimmer Progress Bar */}
                                        <div className="space-y-3">
                                            {MINTING_STEPS.map((label, idx) => {
                                                const done = mintStep > idx;
                                                const current = mintStep === idx;
                                                return (
                                                    <motion.div
                                                        key={label}
                                                        initial={{ opacity: 0, x: -8 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: idx * 0.08 }}
                                                        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border transition-colors ${
                                                            done
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                                : current
                                                                ? 'bg-white border-emerald-300 shadow-xs text-gray-900'
                                                                : 'bg-gray-50/60 border-gray-100 text-gray-400'
                                                        }`}
                                                    >
                                                        <span className="text-xs sm:text-sm font-bold">{label}</span>
                                                        {done ? (
                                                            <motion.span
                                                                initial={{ scale: 0.6, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0"
                                                            >
                                                                <Check size={12} strokeWidth={3} />
                                                            </motion.span>
                                                        ) : current ? (
                                                            <motion.span
                                                                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                                                transition={{ duration: 0.9, repeat: Infinity }}
                                                                className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"
                                                            />
                                                        ) : (
                                                            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                                        )}
                                                    </motion.div>
                                                );
                                            })}
                                        </div>

                                        {/* Smooth linear shimmer bar */}
                                        <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: '12%' }}
                                                animate={{ width: mintStep === 0 ? '35%' : mintStep === 1 ? '72%' : '100%' }}
                                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full"
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="revealed-pass"
                                        initial={{ opacity: 0, y: 18, scale: 0.94 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                                        className="bg-white rounded-3xl shadow-2xl border-2 border-emerald-200 overflow-hidden relative"
                                    >
                                        {/* Top Brand & Impact Header with Subtle Single Sheen Sweep */}
                                        <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 px-6 py-4 text-white relative overflow-hidden">
                                            <motion.div
                                                initial={{ x: '-120%' }}
                                                animate={{ x: '220%' }}
                                                transition={{ duration: 1.1, ease: 'easeInOut' }}
                                                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-18deg] pointer-events-none"
                                            />
                                            <div className="flex items-center justify-between gap-3 relative z-10">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                        <CheckCircle2 size={20} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                                                            Eco-Voucher Unlocked
                                                        </p>
                                                        <p className="font-extrabold text-sm">
                                                            -{justClaimedRecord.pointsCost} PTS Redeemed
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-9 px-3 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                                    <img
                                                        src={justClaimedRecord.partnerLogo}
                                                        alt={justClaimedRecord.brand}
                                                        className="h-5 w-auto max-w-[72px] object-contain"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Crisp Product Strip inside Pass */}
                                        <div className="p-6 space-y-5">
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.08 }}
                                                className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3.5"
                                            >
                                                <img
                                                    src={justClaimedRecord.image}
                                                    alt={justClaimedRecord.title}
                                                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-emerald-200 shadow-xs"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-[11px] font-bold text-emerald-700 block truncate">
                                                        {justClaimedRecord.brand}
                                                    </span>
                                                    <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug">
                                                        {justClaimedRecord.title}
                                                    </h3>
                                                </div>
                                            </motion.div>

                                            {/* Clean Dashed Ticket Divider */}
                                            <div className="border-t-2 border-dashed border-emerald-200/80" />

                                            {/* Code Pill matching Website Typography (Nunito) */}
                                            <motion.div
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.16 }}
                                                className="bg-emerald-50/80 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                                        Partner Reward Code
                                                    </p>
                                                    <p className="font-sans font-extrabold text-gray-900 text-lg sm:text-xl tracking-[0.14em] truncate mt-0.5">
                                                        {justClaimedRecord.voucherCode}
                                                    </p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="button"
                                                    onClick={() => handleCopyCode(justClaimedRecord.voucherCode)}
                                                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors shrink-0 ${
                                                        copiedCode === justClaimedRecord.voucherCode
                                                            ? 'bg-emerald-700 text-white'
                                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                                    }`}
                                                >
                                                    {copiedCode === justClaimedRecord.voucherCode ? <Check size={14} /> : <Copy size={14} />}
                                                    {copiedCode === justClaimedRecord.voucherCode ? 'Copied' : 'Copy'}
                                                </motion.button>
                                            </motion.div>

                                            <p className="text-xs text-center text-gray-400 font-medium">
                                                Saved inside <strong>Claimed ({claimedPerks.length})</strong> · Illustrative showcase voucher
                                            </p>

                                            <motion.button
                                                whileHover={{ scale: 1.015 }}
                                                whileTap={{ scale: 0.97 }}
                                                type="button"
                                                onClick={() => setJustClaimedRecord(null)}
                                                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20"
                                            >
                                                Done
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Claimed Perks Drawer Modal */}
            <AnimatePresence>
                {showClaimedDrawer && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-gray-900/45 backdrop-blur-sm flex items-center justify-center p-4 font-sans"
                        onClick={() => setShowClaimedDrawer(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.93, opacity: 0, y: 16 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.93, opacity: 0, y: 12 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
                            className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-lg w-full max-h-[82vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Ticket size={20} />
                                    <h3 className="font-bold text-lg">Claimed GreenPerks ({claimedPerks.length})</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowClaimedDrawer(false)}
                                    className="p-1.5 rounded-lg hover:bg-white/20"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-5 overflow-y-auto space-y-3">
                                {claimedPerks.length === 0 ? (
                                    <div className="py-10 text-center text-gray-500">
                                        <Gift size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm font-medium">No claimed perks yet</p>
                                        <p className="text-xs mt-1">Toggle Demo Balance (120 PTS) to try claiming an eco reward!</p>
                                    </div>
                                ) : (
                                    claimedPerks.map((item) => {
                                        const fallbackImg = GREEN_PERKS_CATALOG.find((p) => p.id === item.perkId)?.image;
                                        const itemImg = item.image || fallbackImg;
                                        return (
                                            <div
                                                key={item.claimId}
                                                className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 flex items-center justify-between gap-3"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {itemImg ? (
                                                        <img
                                                            src={itemImg}
                                                            alt={item.title}
                                                            className="w-12 h-12 rounded-xl object-cover border border-emerald-200 shrink-0"
                                                        />
                                                    ) : item.partnerLogo ? (
                                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 p-1.5 flex items-center justify-center shrink-0">
                                                            <img
                                                                src={item.partnerLogo}
                                                                alt={item.brand}
                                                                className="max-h-full max-w-full object-contain"
                                                            />
                                                        </div>
                                                    ) : null}
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-gray-900 text-sm truncate">{item.title}</p>
                                                        <p className="text-xs text-gray-500 truncate">{item.brand} · {item.pointsCost} PTS</p>
                                                        <p className="font-sans text-xs font-extrabold tracking-wider text-emerald-700 mt-1">{item.voucherCode}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyCode(item.voucherCode)}
                                                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 shrink-0"
                                                >
                                                    {copiedCode === item.voucherCode ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
