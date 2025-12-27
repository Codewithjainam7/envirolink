'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, Shield, Users, Award, ArrowRight, Sparkles, IndianRupee } from 'lucide-react';

const PRICING_PLANS = [
    {
        name: 'Citizen',
        price: 'Free',
        description: 'For individual citizens reporting issues',
        features: [
            'Unlimited report submissions',
            'GPS location tracking',
            'Real-time status updates',
            'SMS & Email notifications',
            'Report history access',
            'Community leaderboard',
        ],
        cta: 'Get Started Free',
        popular: false,
        color: '#10b981',
    },
    {
        name: 'Municipality',
        price: '₹49,999',
        period: '/month',
        description: 'For city authorities and municipalities',
        features: [
            'Everything in Citizen',
            'Admin control panel',
            'Worker management',
            'AI-powered assignments',
            'Analytics dashboard',
            'SLA tracking',
            'API access',
            'Priority support',
        ],
        cta: 'Contact Sales',
        popular: true,
        color: '#3b82f6',
    },
    {
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large organizations & states',
        features: [
            'Everything in Municipality',
            'Multi-city deployment',
            'Custom integrations',
            'White-label solution',
            'Dedicated account manager',
            'On-premise deployment',
            '24/7 phone support',
            'Training & onboarding',
        ],
        cta: 'Get Quote',
        popular: false,
        color: '#8b5cf6',
    },
];

// Floating green blobs component
function FloatingGreenBlobs() {
    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <motion.div
                className="absolute w-64 h-64 rounded-full bg-emerald-200/40 blur-3xl"
                animate={{ x: [100, 200, 50, 100], y: [50, 150, 100, 50] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ top: '10%', right: '10%' }}
            />
            <motion.div
                className="absolute w-80 h-80 rounded-full bg-emerald-300/30 blur-3xl"
                animate={{ x: [-50, 100, 0, -50], y: [200, 100, 300, 200] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ top: '30%', left: '-5%' }}
            />
            <motion.div
                className="absolute w-72 h-72 rounded-full bg-emerald-100/50 blur-3xl"
                animate={{ x: [0, 100, -50, 0], y: [0, -100, 50, 0] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                style={{ bottom: '5%', left: '40%' }}
            />
        </div>
    );
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative">
            <FloatingGreenBlobs />
            {/* Hero */}
            <section className="pt-20 pb-16 px-4 relative z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            <Sparkles size={16} />
                            Pricing Plans
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Choose the plan that fits your needs. Start free as a citizen, or get enterprise features for your municipality.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8">
                        {PRICING_PLANS.map((plan, i) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className={`relative bg-white rounded-3xl p-8 shadow-xl border-2 ${plan.popular ? 'border-blue-500 scale-105' : 'border-gray-100'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                        <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                                            <Award size={14} />
                                            Most Popular
                                        </span>
                                    </div>
                                )}

                                <div className="text-center mb-8">
                                    <div
                                        className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                        style={{ backgroundColor: `${plan.color}15` }}
                                    >
                                        {plan.name === 'Citizen' && <Users size={28} style={{ color: plan.color }} />}
                                        {plan.name === 'Municipality' && <Shield size={28} style={{ color: plan.color }} />}
                                        {plan.name === 'Enterprise' && <Zap size={28} style={{ color: plan.color }} />}
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <p className="text-gray-500 text-sm mb-4">{plan.description}</p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                        {plan.period && <span className="text-gray-500">{plan.period}</span>}
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-center gap-3 text-gray-600">
                                            <Check size={18} className="text-emerald-500 flex-shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition ${plan.popular
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {plan.cta}
                                    <ArrowRight size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 bg-gray-50 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        {[
                            { q: 'Is the Citizen plan really free?', a: 'Yes! Citizens can use all basic reporting features completely free. We believe everyone should be able to contribute to a cleaner city.' },
                            { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, UPI, net banking, and wire transfers for enterprise plans.' },
                            { q: 'Can I upgrade my plan later?', a: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.' },
                            { q: 'Do you offer a free trial for Municipality plans?', a: 'Yes, we offer a 30-day free trial with full access to all Municipality features.' },
                        ].map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true }}
                                className="bg-white rounded-2xl p-6 shadow-sm"
                            >
                                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                                <p className="text-gray-600">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
