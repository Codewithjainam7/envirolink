export type PerkCategory =
    | 'all'
    | 'eco_essentials'
    | 'waste_management'
    | 'gardening'
    | 'stationery'
    | 'vouchers';

export interface GreenPerkItem {
    id: string;
    title: string;
    brand: string;
    category: Exclude<PerkCategory, 'all'>;
    categoryLabel: string;
    pointsCost: number;
    image: string;
    description: string;
    retailValue: string;
    tag: string;
    demoNote: string;
}

export interface SponsorShowcasePartner {
    id: string;
    name: string;
    focus: string;
    rewardModel: string;
    websiteLabel: string;
    accentColor: string;
    initials: string;
}

export const PERK_CATEGORIES: { id: PerkCategory; label: string }[] = [
    { id: 'all', label: 'All Perks' },
    { id: 'eco_essentials', label: 'Everyday Eco' },
    { id: 'waste_management', label: 'Waste & Compost' },
    { id: 'gardening', label: 'Plants & Seeds' },
    { id: 'stationery', label: 'Recycled Stationery' },
    { id: 'vouchers', label: 'Brand Vouchers' },
];

export const GREEN_PERKS_CATALOG: GreenPerkItem[] = [
    {
        id: 'perk-steel-bottle',
        title: 'Insulated Stainless Steel Bottle',
        brand: 'Beco (Showcase Partner)',
        category: 'eco_essentials',
        categoryLabel: 'Everyday Eco',
        pointsCost: 100,
        image: '/images/perks/steel-bottle.jpg',
        description: '750 ml single-use plastic alternative bottle co-sponsored through CSR sustainability budgets.',
        retailValue: 'Worth ₹549',
        tag: 'Most Popular',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-jute-bag',
        title: 'Heavy-Duty Natural Jute Tote Bag',
        brand: 'Beco (Showcase Partner)',
        category: 'eco_essentials',
        categoryLabel: 'Everyday Eco',
        pointsCost: 60,
        image: '/images/perks/jute-bag.jpg',
        description: 'Reusable unbleached woven jute grocery carryall replacing 300+ single-use polybags.',
        retailValue: 'Worth ₹299',
        tag: 'Quick Unlock',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-indoor-plant',
        title: 'Air-Purifying Succulent & Ceramic Pot',
        brand: 'Urban Nursery Partner (Demo)',
        category: 'gardening',
        categoryLabel: 'Plants & Seeds',
        pointsCost: 80,
        image: '/images/perks/indoor-plant.jpg',
        description: 'Easy-care home succulent in a minimalist ceramic planter sourced from local nursery partners.',
        retailValue: 'Worth ₹399',
        tag: 'Citizen Favorite',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-compost-kit',
        title: 'Countertop Home Composting Kit',
        brand: 'EcoBin India (Showcase Partner)',
        category: 'waste_management',
        categoryLabel: 'Waste & Compost',
        pointsCost: 150,
        image: '/images/perks/compost-kit.jpg',
        description: 'Odour-sealed kitchen bin + microbe starter mix to convert wet household waste into garden manure.',
        retailValue: 'Worth ₹899',
        tag: 'Zero-Waste Hero',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-seed-stationery',
        title: 'Plantable Seed-Paper Notebook & Pen Set',
        brand: 'Phool / Rescript (Showcase Partner)',
        category: 'stationery',
        categoryLabel: 'Recycled Stationery',
        pointsCost: 50,
        image: '/images/perks/seed-stationery.jpg',
        description: 'Upcycled kraft notebooks with wildflower seed covers and bamboo pens made from recycled fiber.',
        retailValue: 'Worth ₹249',
        tag: 'Eco Stationery',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-eco-voucher',
        title: '20% Off Eco Refill & Home Care Voucher',
        brand: 'The Better Home (Showcase Partner)',
        category: 'vouchers',
        categoryLabel: 'Brand Vouchers',
        pointsCost: 30,
        image: '/images/perks/eco-voucher.jpg',
        description: 'Instant digital discount code on biodegradable surface cleaners and plastic-free refill packs.',
        retailValue: 'Instant Digital Code',
        tag: 'Instant Unlock',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
];

export const SHOWCASE_SPONSOR_PARTNERS: SponsorShowcasePartner[] = [
    {
        id: 'beco',
        name: 'Beco',
        focus: 'Reusable & sustainable household products',
        rewardModel: '20% eco-bundle discounts & steel bottles for verified citizens',
        websiteLabel: 'Outreach Target · D2C Eco Brand',
        accentColor: '#10b981',
        initials: 'BC',
    },
    {
        id: 'better-home',
        name: 'The Better Home',
        focus: 'Environment-conscious home cleaning & refill packs',
        rewardModel: 'Digital vouchers on plastic-free refill starters',
        websiteLabel: 'Outreach Target · Home Care',
        accentColor: '#0ea5e9',
        initials: 'BH',
    },
    {
        id: 'phool',
        name: 'Phool',
        focus: 'Upcycled temple-flower lifestyle & incense goods',
        rewardModel: 'Recycled stationery & organic gift packs',
        websiteLabel: 'Outreach Target · Circular Brand',
        accentColor: '#8b5cf6',
        initials: 'PH',
    },
    {
        id: 'bisleri',
        name: 'Bisleri — Bottles for Change',
        focus: 'Plastic waste segregation & neighbourhood drives',
        rewardModel: 'Sponsored 30-Day Clean Neighbourhood Challenges',
        websiteLabel: 'Outreach Target · CSR Initiative',
        accentColor: '#14b8a6',
        initials: 'BF',
    },
];
