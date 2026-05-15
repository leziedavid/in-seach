'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { getPlans } from '@/api/api';
import SubscriptionPaymentModal from '@/components/subscription/modals/SubscriptionPaymentModal';
import { SubscriptionPlan } from '@/types/interface';

interface Feature {
    text: string;
    included: boolean;
}

interface Plan {
    id?: string;
    name: string;
    price: string | number;
    description: string;
    features: Feature[];
    cta: string;
    highlight: boolean;
}

const faqs = [
    {
        q: 'Puis-je changer de plan à tout moment ?',
        a: "Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace abonné. La facturation est ajustée au prorata.",
    },
    {
        q: 'Y a-t-il des frais cachés ?',
        a: "Aucun. Le prix affiché est le prix final. Aucun frais de mise en place, aucune commission sur vos transactions.",
    },
    {
        q: 'Comment fonctionne la résiliation ?',
        a: "Vous pouvez résilier à tout moment en un clic. Votre accès reste actif jusqu'à la fin de la période déjà payée.",
    },
    {
        q: 'Le plan FREE est-il vraiment gratuit ?',
        a: "Oui, le plan FREE est gratuit sans limite de durée. Pas de carte bancaire requise pour commencer.",
    },
    {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: "Nous acceptons les cartes bancaires (Visa, Mastercard), Mobile Money (Orange Money, MTN, Wave) et les virements bancaires.",
    },
    {
        q: "Le badge 'Expert Certifié' est-il visible par les clients ?",
        a: "Oui, ce badge apparaît directement sur votre profil et dans les résultats de recherche, renforçant la confiance des clients potentiels.",
    },
];

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = React.useState(false);
    return (
        <div className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between py-5 text-left group"
                aria-expanded={open}
            >
                <span className="text-[15px] font-medium text-zinc-800 dark:text-zinc-100 group-hover:text-secondary dark:group-hover:text-primary transition-colors pr-4">
                    {q}
                </span>
                <span className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-300
                    ${open
                        ? 'bg-primary border-primary rotate-45'
                        : 'border-zinc-200 dark:border-zinc-700 bg-transparent'
                    }`}
                >
                    <Icon
                        icon="solar:add-linear"
                        width={14}
                        className={open ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}
                    />
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-48 pb-5' : 'max-h-0'}`}>
                <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{a}</p>
            </div>
        </div>
    );
}

export default function PricingPage() {

    const { data: plansRes, isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: getPlans
    });

    const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    const apiPlans = React.useMemo(() => {
        return (plansRes?.data?.data || []).filter((p: SubscriptionPlan) => p.isActive);
    }, [plansRes]);

    const defaultFeatures = {
        FREE: [
            { text: "Jusqu'à 5 services publiés", included: true },
            { text: 'Visibilité locale standard', included: true },
            { text: 'Messagerie basique', included: true },
            { text: 'Analyse IA limitée', included: true },
            { text: 'Badge vérifié', included: false },
            { text: 'Priorité dans la recherche', included: false },
        ],
        PREMIUM: [
            { text: 'Services illimités', included: true },
            { text: 'Visibilité boostée x10', included: true },
            { text: 'Messagerie prioritaire', included: true },
            { text: 'Analyse IA illimitée', included: true },
            { text: 'Badge "Expert Certifié"', included: true },
            { text: 'Statistiques avancées', included: true },
        ]
    };

    const plans = React.useMemo<Plan[]>(() => {
        if (!apiPlans || apiPlans.length === 0) {
            return [
                {
                    name: 'FREE',
                    price: 0,
                    description: 'Idéal pour commencer et tester la plateforme.',
                    features: defaultFeatures.FREE,
                    cta: 'Commencer gratuitement',
                    highlight: false,
                },
                {
                    name: 'PREMIUM',
                    price: 29,
                    description: 'Pour les professionnels qui veulent booster leur activité.',
                    features: defaultFeatures.PREMIUM,
                    cta: 'Passer au Premium',
                    highlight: true,
                }
            ];
        }

        return apiPlans.map((p) => {
            const isFree = p.price === 0;
            const isPremium = p.name.toUpperCase().includes('PREMIUM');
            const isLogistic = p.name.toUpperCase().includes('LOGISTIC');

            const mappedFeatures = (p.features && p.features.length > 0)
                ? p.features.map(f => ({ text: f, included: true }))
                : (isFree ? defaultFeatures.FREE : defaultFeatures.PREMIUM);

            return {
                id: p.id,
                name: p.name,
                price: p.price,
                description: p.description || (isFree
                    ? 'Idéal pour commencer et tester la plateforme.'
                    : 'Pour les professionnels qui veulent booster leur activité.'),
                features: mappedFeatures,
                cta: isFree ? 'Commencer gratuitement' : "S'abonner maintenant",
                highlight: isPremium || isLogistic,
            };
        });
    }, [apiPlans]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-900">
            <Icon icon="solar:refresh-bold-duotone" width={40} className="animate-spin text-primary" />
        </div>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-900">

            {/* ── Hero ── */}
            <section className="pt-20 pb-16 px-6 text-center">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 dark:border-primary/30 text-[12px] font-medium text-primary mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                    Tarifs simples et transparents
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-5 leading-tight">
                    Choisissez votre plan
                </h1>

                <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed">
                    Pas de frais cachés. Pas d&apos;engagement. Résiliable à tout moment.
                </p>
            </section>

            {/* ── Pricing Cards ── */}
            <section className="px-6 pb-20">
                <div className={`max-w-4xl mx-auto grid grid-cols-1 ${plans.length > 1 ? 'md:grid-cols-2' : ''} gap-5`}>
                    {plans.map((plan: Plan, i: number) => (
                        <div
                            key={i}
                            className={`relative rounded-2xl p-8 flex flex-col transition-all duration-200
                                ${plan.highlight
                                    ? 'bg-secondary text-white'
                                    : 'bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 hover:border-secondary/30 dark:hover:border-secondary/40'
                                }`}
                        >
                            {plan.highlight && (
                                <span className="absolute -top-3 left-8 inline-flex items-center gap-1.5 bg-primary text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                                    <Icon icon="solar:star-bold" width={11} />
                                    Recommandé
                                </span>
                            )}

                            {/* Plan header */}
                            <div className="mb-6">
                                <p className={`text-[11px] font-semibold uppercase tracking-widest mb-3
                                    ${plan.highlight ? 'text-primary' : 'text-secondary dark:text-secondary'}`}>
                                    {plan.name}
                                </p>
                                <div className="flex items-baseline gap-1.5 mb-3">
                                    <span className={`text-5xl font-bold tracking-tight
                                        ${plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                        {plan.price}€
                                    </span>
                                    <span className={`text-sm
                                        ${plan.highlight ? 'text-white/50' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                        /mois
                                    </span>
                                </div>
                                <p className={`text-[13px] leading-relaxed
                                    ${plan.highlight ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`h-px mb-6
                                ${plan.highlight ? 'bg-white/10' : 'bg-zinc-100 dark:bg-zinc-700/50'}`} />

                            {/* Features */}
                            <ul className="space-y-3.5 flex-1 mb-8">
                                {plan.features.map((feature: Feature, j: number) => (
                                    <li key={j} className="flex items-start gap-3">
                                        {feature.included ? (
                                            <Icon
                                                icon="solar:check-circle-bold"
                                                width={17}
                                                className={`shrink-0 mt-0.5
                                                    ${plan.highlight ? 'text-primary' : 'text-secondary dark:text-secondary'}`}
                                            />
                                        ) : (
                                            <Icon
                                                icon="solar:close-circle-linear"
                                                width={17}
                                                className={`shrink-0 mt-0.5
                                                    ${plan.highlight ? 'text-white/25' : 'text-zinc-300 dark:text-zinc-600'}`}
                                            />
                                        )}
                                        <span className={`text-[13px] leading-snug ${
                                            feature.included
                                                ? plan.highlight
                                                    ? 'text-white/90'
                                                    : 'text-zinc-700 dark:text-zinc-300'
                                                : plan.highlight
                                                    ? 'text-white/30 line-through'
                                                    : 'text-zinc-300 dark:text-zinc-600 line-through'
                                        }`}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button
                                onClick={() => {
                                    setSelectedPlan(apiPlans.find((p: any) => p.id === plan.id) || null);
                                    setIsModalOpen(true);
                                }}
                                className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-150 cursor-pointer
                                    ${plan.highlight
                                        ? 'bg-primary text-white hover:bg-primary/90'
                                        : 'bg-secondary text-white hover:bg-secondary/90'
                                    }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Trust Bar ── */}
            <section className="border-y border-zinc-100 dark:border-zinc-800 py-10 px-6">
                <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
                    {[
                        { icon: 'solar:shield-check-bold-duotone', label: 'Paiement sécurisé',       color: 'text-secondary' },
                        { icon: 'solar:refresh-bold-duotone',      label: 'Résiliable à tout moment', color: 'text-primary'   },
                        { icon: 'solar:headphones-round-bold-duotone', label: 'Support réactif',      color: 'text-secondary' },
                        { icon: 'solar:lock-keyhole-bold-duotone', label: 'Données protégées',        color: 'text-primary'   },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Icon icon={item.icon} width={24} className={item.color} />
                            <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">{item.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FAQ ── */}
            <section className="py-20 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                            Questions fréquentes sur les tarifs
                        </h2>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                            Tout ce que vous devez savoir avant de vous lancer.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 sm:px-8">
                        {faqs.map((item, i) => (
                            <FAQItem key={i} q={item.q} a={item.a} />
                        ))}
                    </div>

                    <p className="text-center text-[13px] text-zinc-400 dark:text-zinc-500 mt-8">
                        Une autre question ?{' '}
                        <a href="mailto:support@djamko.com" className="text-secondary dark:text-primary hover:underline font-medium">
                            Contactez-nous
                        </a>
                    </p>
                </div>
            </section>

            <SubscriptionPaymentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                plan={selectedPlan}
            />
        </div>
    );
}
