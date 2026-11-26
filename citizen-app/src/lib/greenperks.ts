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
    partnerLogo: string;
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
    logo: string;
    focus: string;
    rewardModel: string;
    websiteLabel: string;
    accentColor: string;
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
        partnerLogo: '/images/partners/beco.png',
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
        partnerLogo: '/images/partners/beco.png',
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
        brand: 'Ugaoo Nursery (Showcase Partner)',
        partnerLogo: '/images/partners/ugaoo.png',
        category: 'gardening',
        categoryLabel: 'Plants & Seeds',
        pointsCost: 80,
        image: '/images/perks/indoor-plant.jpg',
        description: 'Easy-care home succulent in a matte ceramic planter sourced with urban nursery partners.',
        retailValue: 'Worth ₹399',
        tag: 'Citizen Favorite',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-compost-kit',
        title: 'Countertop Home Composting Kit',
        brand: 'Daily Dump (Showcase Partner)',
        partnerLogo: '/images/partners/dailydump.png',
        category: 'waste_management',
        categoryLabel: 'Waste & Compost',
        pointsCost: 150,
        image: '/images/perks/compost-kit.jpg',
        description: 'Odour-sealed kitchen composter + microbe starter mix turning wet household waste into garden compost.',
        retailValue: 'Worth ₹899',
        tag: 'Zero-Waste Hero',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-seed-stationery',
        title: 'Plantable Seed-Paper Notebook & Pen Set',
        brand: 'Phool (Showcase Partner)',
        partnerLogo: '/images/partners/phool.png',
        category: 'stationery',
        categoryLabel: 'Recycled Stationery',
        pointsCost: 50,
        image: '/images/perks/seed-stationery.jpg',
        description: 'Upcycled kraft notebooks with wildflower seed covers and bamboo pens crafted from recovered fiber.',
        retailValue: 'Worth ₹249',
        tag: 'Eco Stationery',
        demoNote: 'Illustrative sponsor reward (demo showcase)',
    },
    {
        id: 'perk-eco-voucher',
        title: '20% Off Eco Refill & Home Care Voucher',
        brand: 'The Better Home (Showcase Partner)',
        partnerLogo: '/images/partners/betterhome.png',
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
        logo: '/images/partners/beco.png',
        focus: 'Reusable & sustainable household products',
        rewardModel: '20% eco-bundle discounts & steel bottles for verified citizens',
        websiteLabel: 'D2C Eco Brand · Outreach Target',
        accentColor: '#10b981',
    },
    {
        id: 'better-home',
        name: 'The Better Home',
        logo: '/images/partners/betterhome.png',
        focus: 'Environment-conscious home cleaning & refill packs',
        rewardModel: 'Digital vouchers on plastic-free refill starters',
        websiteLabel: 'Home Care · Outreach Target',
        accentColor: '#0ea5e9',
    },
    {
        id: 'phool',
        name: 'Phool',
        logo: '/images/partners/phool.png',
        focus: 'Upcycled temple-flower lifestyle & botanical goods',
        rewardModel: 'Recycled stationery & organic gift packs',
        websiteLabel: 'Circular Brand · Outreach Target',
        accentColor: '#ca8a04',
    },
    {
        id: 'bisleri',
        name: 'Bisleri — Bottles for Change',
        logo: '/images/partners/bottlesforchange.png',
        focus: 'Plastic waste segregation & neighbourhood drives',
        rewardModel: 'Sponsored 30-Day Clean Neighbourhood Challenges',
        websiteLabel: 'CSR Initiative · Outreach Target',
        accentColor: '#14b8a6',
    },
    {
        id: 'ugaoo',
        name: 'Ugaoo',
        logo: '/images/partners/ugaoo.png',
        focus: 'Urban plants, seeds & sustainable gardening kits',
        rewardModel: 'Green planter & home-garden reward vouchers',
        websiteLabel: 'Gardening Brand · Outreach Target',
        accentColor: '#15803d',
    },
    {
        id: 'dailydump',
        name: 'Daily Dump',
        logo: '/images/partners/dailydump.png',
        focus: 'Decentralized household & community composting systems',
        rewardModel: 'Home composting starter kits & segregation bins',
        websiteLabel: 'Compost Pioneer · Outreach Target',
        accentColor: '#f59e0b',
    },
];
