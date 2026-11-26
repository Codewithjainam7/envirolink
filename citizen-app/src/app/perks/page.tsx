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
    pointsCost: number;
    voucherCode: string;
    claimedAt: string;
}

const CLAIMED_PERKS_STORAGE_KEY = 'envirolink_greenperks_claims_v1';

export default function GreenPerksPage() {
    const { user, isAuthenticated, initializeAuth } = useAppStore();

    const [activeCategory, setActiveCategory] = useState<PerkCategory>('all');
    const [demoPreviewMode, setDemoPreviewMode] = useState(false);
    const [demoSpentPoints, setDemoSpentPoints] = useState(0);
    const [joinedChallenge, setJoinedChallenge] = useState(false);
    const [selectedPerk, setSelectedPerk] = useState<GreenPerkItem | null>(null);
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

    const handleRedeemConfirm = () => {
        if (!selectedPerk) return;
        if (effectiveBalance < selectedPerk.pointsCost) {
            toast.error(`Need ${selectedPerk.pointsCost - effectiveBalance} more PTS to unlock this perk.`);
            return;
        }

        const prefix = selectedPerk.brand.split(' ')[0].toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'ECO';
        const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
        const record: ClaimedPerkRecord = {
            claimId: `claim-${Date.now()}`,
            perkId: selectedPerk.id,
            title: selectedPerk.title,
            brand: selectedPerk.brand,
            pointsCost: selectedPerk.pointsCost,
            voucherCode: `ELGP-${prefix}-${suffix}`,
            claimedAt: new Date().toISOString(),
        };

        const nextClaims = [record, ...claimedPerks];
        setClaimedPerks(nextClaims);
        setDemoSpentPoints((prev) => prev + selectedPerk.pointsCost);
        try {
            localStorage.setItem(CLAIMED_PERKS_STORAGE_KEY, JSON.stringify(nextClaims.slice(0, 20)));
        } catch {}

        setSelectedPerk(null);
        setJustClaimedRecord(record);
        toast.success('GreenPerk demo voucher generated!');
    };

    const handleCopyCode = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopiedCode(code);
            toast.success('Voucher code copied');
            setTimeout(() => setCopiedCode(null), 2000);
        } catch {
            toast.error('Copy not supported here');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50/40 via-white to-gray-50 relative pb-24">
            <FloatingBlobs />

            {/* Top Header & Wallet Summary */}
            <div className="bg-white/85 backdrop-blur-xl border-b border-emerald-100 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
                                <Sprout size={14} className="text-emerald-600" />
                                EnviroLink GreenPerks · Zero-Ad Monetization Showcase
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">
                                Turn Cleanup Action into{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                                    Eco Rewards
                                </span>
                            </h1>
                            <p className="text-gray-600 mt-2.5 text-sm sm:text-base leading-relaxed">
                                Earn <span className="font-bold text-emerald-700">+20 PTS</span> for every verified &amp; resolved civic waste report.
                                Redeem points cleanly for eco-friendly products &amp; vouchers funded by sustainable brand partners — with zero ads interrupting your reporting experience.
                            </p>
                        </div>

                        {/* Wallet Card */}
                        <div className="w-full lg:w-[390px] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-emerald-600/20 flex-shrink-0">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                                        {demoPreviewMode ? 'Demo Preview Balance' : isAuthenticated ? 'Your GreenPerks Balance' : 'Citizen Rewards Wallet'}
                                    </p>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-3xl sm:text-4xl font-black tracking-tight">{effectiveBalance}</span>
                                        <span className="text-sm font-bold text-emerald-200">PTS</span>
                                    </div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-bold text-emerald-50">
                                    {userRank}
                                </span>
                            </div>

                            {/* Expo Demo Balance Toggle + Claimed Drawer Trigger */}
                            <div className="mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDemoPreviewMode((prev) => !prev);
                                        setDemoSpentPoints(0);
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                        demoPreviewMode
                                            ? 'bg-white text-emerald-800 shadow-sm'
                                            : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                                    }`}
                                >
                                    <Sparkles size={13} />
                                    {demoPreviewMode ? 'Expo Preview (120+ PTS) On' : 'Try Demo Balance (120 PTS)'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowClaimedDrawer(true)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/20 hover:bg-black/30 text-xs font-semibold text-emerald-50 transition-colors"
                                >
                                    <Ticket size={13} />
                                    Claimed ({claimedPerks.length})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 relative z-10 space-y-12">
                {/* Category Filter Pills */}
                <section>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <ShoppingBag size={22} className="text-emerald-600" />
                                Sponsored Rewards Catalog
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                Illustrative showcase partners &amp; point values demonstrating post-deployment reward redemption.
                            </p>
                        </div>
                        {!isAuthenticated && (
                            <Link
                                href="/login?next=/perks"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors w-fit"
                            >
                                Sign in to sync live PTS
                                <ArrowRight size={14} />
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                        {PERK_CATEGORIES.map((cat) => {
                            const active = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                                        active
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Rewards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {filteredCatalog.map((perk, idx) => {
                            const canAfford = effectiveBalance >= perk.pointsCost;
                            const progressPct = Math.min(100, Math.round((effectiveBalance / perk.pointsCost) * 100));

                            return (
                                <motion.div
                                    key={perk.id}
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(idx * 0.05, 0.25) }}
                                    className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-xl hover:border-emerald-200 transition-all overflow-hidden flex flex-col"
                                >
                                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                        <img
                                            src={perk.image}
                                            alt={perk.title}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-bold text-gray-800 shadow-sm">
                                                {perk.tag}
                                            </span>
                                            <span className="px-2.5 py-1 rounded-full bg-emerald-600/95 text-[11px] font-bold text-white shadow-sm">
                                                {perk.categoryLabel}
                                            </span>
                                        </div>
                                        <span className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-gray-900/80 backdrop-blur-sm text-xs font-extrabold text-white">
                                            {perk.pointsCost} PTS
                                        </span>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-center justify-between gap-2 mb-1.5">
                                            <span className="text-xs font-bold text-emerald-700 truncate">
                                                {perk.brand}
                                            </span>
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
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                                            style={{ width: `${progressPct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => setSelectedPerk(perk)}
                                                className={`w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                    canAfford
                                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                }`}
                                            >
                                                <Gift size={16} />
                                                {canAfford ? `Redeem for ${perk.pointsCost} PTS` : 'Preview Reward'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Brand-Sponsored Neighbourhood Challenge */}
                <section className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 grid lg:grid-cols-5 gap-6 items-center">
                        <div className="lg:col-span-3 space-y-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/30 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                                <Trophy size={13} />
                                Sponsored Civic Challenge · Showcase
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                                30-Day Clean Neighbourhood Challenge
                            </h2>
                            <p className="text-emerald-100 text-sm sm:text-base max-w-2xl">
                                Powered by <span className="font-bold text-white">Bisleri — Bottles for Change (Showcase Partner)</span>.
                                Citizens who submit 5 verified segregation or plastic-litter cleanup reports this month earn bonus CSR eco-kits without seeing a single pop-up ad.
                            </p>
                        </div>

                        <div className="lg:col-span-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-emerald-100 font-medium">Bonus Milestone</span>
                                <span className="font-extrabold text-white">+50 Challenge PTS</span>
                            </div>
                            <div className="h-2 bg-white/15 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                    style={{ width: joinedChallenge ? '40%' : '15%' }}
                                />
                            </div>
                            <button
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
                                        ? 'bg-emerald-400 text-emerald-950'
                                        : 'bg-white text-emerald-900 hover:bg-emerald-50'
                                }`}
                            >
                                <CheckCircle2 size={16} />
                                {joinedChallenge ? 'Joined Challenge (Active)' : 'Join Showcase Challenge'}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Non-Intrusive Monetization Architecture + Partner Outreach Showcase */}
                <section className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Layers size={22} className="text-emerald-600" />
                                Illustrative Brand Partners &amp; Sustainability Model
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Potential eco-brand outreach targets shown to illustrate how EnviroLink stays 100% ad-free for citizens while generating CSR partner revenue.
                            </p>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold w-fit">
                            Not active commercial contracts — Expo showcase concept
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {SHOWCASE_SPONSOR_PARTNERS.map((partner) => (
                            <div
                                key={partner.id}
                                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-white text-sm shrink-0"
                                        style={{ backgroundColor: partner.accentColor }}
                                    >
                                        {partner.initials}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{partner.name}</h3>
                                        <p className="text-[11px] font-medium text-emerald-700 truncate">{partner.websiteLabel}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">{partner.focus}</p>
                                <div className="pt-2 border-t border-gray-100 mt-auto">
                                    <p className="text-[11px] font-semibold text-gray-800">{partner.rewardModel}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why UX Stays Zero-Ad */}
                    <div className="grid sm:grid-cols-3 gap-5 pt-2">
                        {[
                            {
                                icon: ShieldCheck,
                                title: 'Zero Pop-Ups While Reporting',
                                desc: 'Camera, GPS geotagging, AI waste detection, and status tracking remain 100% distraction-free.',
                            },
                            {
                                icon: Award,
                                title: 'CSR Co-Branded Rewards',
                                desc: 'Brands fund tangible reusable bottles, composters, or green discounts in exchange for verified impact reach.',
                            },
                            {
                                icon: Leaf,
                                title: 'Circular Green Economy',
                                desc: 'Verified cleanups fund eco-friendly habits rather than single-use consumption.',
                            },
                        ].map((pillar) => (
                            <div key={pillar.title} className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-5">
                                <pillar.icon size={20} className="text-emerald-600 mb-2.5" />
                                <h3 className="font-bold text-gray-900 text-sm">{pillar.title}</h3>
                                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{pillar.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Redeem Preview / Confirmation Modal */}
            <AnimatePresence>
                {selectedPerk && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedPerk(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0, y: 12 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.94, opacity: 0, y: 12 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative h-48 bg-gray-100">
                                <img
                                    src={selectedPerk.image}
                                    alt={selectedPerk.title}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSelectedPerk(null)}
                                    className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-emerald-700">{selectedPerk.brand}</p>
                                    <h3 className="text-xl font-bold text-gray-900 mt-0.5">{selectedPerk.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2">{selectedPerk.description}</p>
                                </div>

                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium">Perk Cost</p>
                                        <p className="text-lg font-extrabold text-emerald-700">{selectedPerk.pointsCost} PTS</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 font-medium">Available Wallet</p>
                                        <p className="text-lg font-bold text-gray-900">{effectiveBalance} PTS</p>
                                    </div>
                                </div>

                                {effectiveBalance < selectedPerk.pointsCost && (
                                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                                        Tip: Switch on <strong>Try Demo Balance (120 PTS)</strong> in the GreenPerks wallet card to demo live redemption during your presentation.
                                    </div>
                                )}

                                <div className="flex items-center gap-3 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPerk(null)}
                                        className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        type="button"
                                        disabled={effectiveBalance < selectedPerk.pointsCost}
                                        onClick={handleRedeemConfirm}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors disabled:opacity-50"
                                    >
                                        Confirm Redeem
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Instant Voucher Code Success Modal */}
            <AnimatePresence>
                {justClaimedRecord && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setJustClaimedRecord(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                <CheckCircle2 size={30} />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Demo Reward Unlocked</p>
                                <h3 className="text-xl font-extrabold text-gray-900 mt-1">{justClaimedRecord.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{justClaimedRecord.brand}</p>
                            </div>
                            <div className="bg-gray-50 border-2 border-dashed border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-gray-900 text-base tracking-wider">
                                    {justClaimedRecord.voucherCode}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleCopyCode(justClaimedRecord.voucherCode)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-emerald-700"
                                >
                                    {copiedCode === justClaimedRecord.voucherCode ? <Check size={14} /> : <Copy size={14} />}
                                    {copiedCode === justClaimedRecord.voucherCode ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400">
                                Illustrative voucher code generated for EnviroLink GreenPerks showcase demonstration.
                            </p>
                            <button
                                type="button"
                                onClick={() => setJustClaimedRecord(null)}
                                className="w-full py-2.5 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-gray-800 transition-colors"
                            >
                                Done
                            </button>
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
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowClaimedDrawer(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
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
                                    claimedPerks.map((item) => (
                                        <div
                                            key={item.claimId}
                                            className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 text-sm truncate">{item.title}</p>
                                                <p className="text-xs text-gray-500">{item.brand} · {item.pointsCost} PTS</p>
                                                <p className="font-mono text-xs font-bold text-emerald-700 mt-1">{item.voucherCode}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopyCode(item.voucherCode)}
                                                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-50 shrink-0"
                                            >
                                                {copiedCode === item.voucherCode ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
