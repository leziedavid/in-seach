'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { getPlans } from '@/api/api';
import SubscriptionPaymentModal from '@/components/subscription/modals/SubscriptionPaymentModal';
import { SubscriptionPlan } from '@/types/interface';

interface Advantage {
    text: string;
}

interface Plan {
    id?: string;
    name: string;
    price: string | number;
    durationDays: number;
    description: string;
    advantages: Advantage[];
    cta: string;
    highlight: boolean;
}

const faqs = [
    {
        q: 'Un pack donne-t-il accès à des fonctionnalités supplémentaires ?',
        a: "Non. Un pack ne débloque rien : il crédite simplement votre Wallet, automatiquement, à la fréquence choisie. Les actions payantes de la plateforme (publier, valider, booster...) restent les mêmes pour tout le monde.",
    },
    {
        q: 'Le montant du pack sert-il à payer mes achats ?',
        a: "Non, jamais. Vos achats en tant que client se règlent toujours directement au vendeur ou à la livraison. Le Wallet ne sert qu'à régler les actions professionnelles de la plateforme.",
    },
    {
        q: 'Que se passe-t-il à chaque échéance ?',
        a: "Si le renouvellement automatique est actif, votre Wallet est recrédité du montant du pack à chaque échéance, sans action de votre part. Sinon, le pack s'arrête simplement.",
    },
    {
        q: 'Puis-je arrêter un pack à tout moment ?',
        a: "Oui. Arrêter un pack n'affecte jamais votre solde déjà crédité — vous pouvez toujours recharger votre Wallet manuellement à tout moment depuis « Mon Portefeuille ».",
    },
    {
        q: 'Le pack FREE sert-il à quelque chose ?',
        a: "Le pack FREE ne programme aucun rechargement — c'est l'option par défaut si vous préférez recharger votre Wallet manuellement, quand vous en avez besoin.",
    },
    {
        q: 'Quels moyens de paiement acceptez-vous pour un pack ?',
        a: "Aujourd'hui, le paiement se fait par preuve de transaction (Mobile Money ou virement) validée par un administrateur. La carte bancaire et le paiement mobile automatique arrivent bientôt.",
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

    const plans = React.useMemo<Plan[]>(() => {
        if (!apiPlans || apiPlans.length === 0) {
            return [];
        }

        return apiPlans.map((p) => {
            const isFree = p.price === 0;
            const isPremium = p.name.toUpperCase().includes('PREMIUM');
            const isLogistic = p.name.toUpperCase().includes('LOGISTIC');

            const advantages = (p.defaultFeatures && p.defaultFeatures.length > 0)
                ? p.defaultFeatures.map((f: any) => ({ text: f.label }))
                : [];

            return {
                id: p.id,
                name: p.name,
                price: p.price,
                durationDays: p.durationDays,
                description: p.description || (isFree ? 'Aucun rechargement programmé — rechargez votre Wallet manuellement quand vous le souhaitez.' : 'Rechargement automatique et récurrent de votre Wallet.'),
                advantages,
                cta: isFree ? 'Continuer sans pack' : 'Recharger via ce pack',
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
                    Packs de rechargement Wallet
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white mb-5 leading-tight">
                    Programmez le rechargement de votre Wallet
                </h1>

                <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed mb-4">
                    Un pack recrédite automatiquement votre Wallet à intervalles réguliers — pratique pour les vendeurs et prestataires actifs. Aucun frais caché, aucun engagement.
                </p>

                <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-md mx-auto leading-relaxed">
                    Le Wallet sert uniquement à régler vos actions professionnelles sur la plateforme — jamais vos achats.{' '}
                    <Link href="/akwaba?tab=Facturation" className="text-secondary dark:text-primary hover:underline font-medium">
                        Comprendre le fonctionnement du Wallet
                    </Link>
                </p>
            </section>

            {/* ── Pricing Cards ── */}
            <section className="px-6 pb-20">
                <div className={`max-w-4xl mx-auto grid grid-cols-1 ${plans.length > 1 ? 'md:grid-cols-2' : ''} gap-5`}>
                    {plans.map((plan: Plan, i: number) => (
                        <div key={i} className={`relative rounded-2xl p-8 flex flex-col transition-all duration-200  ${plan.highlight ? 'bg-secondary text-white' : 'bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 hover:border-secondary/30 dark:hover:border-secondary/40'}`}>
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
                                <div className="flex items-baseline gap-1.5 mb-1">
                                    <span className={`text-5xl font-bold tracking-tight
                                        ${plan.highlight ? 'text-white' : 'text-zinc-900 dark:text-white'}`}>
                                        {plan.price.toLocaleString()} FCFA
                                    </span>
                                </div>
                                <p className={`text-[11px] font-semibold uppercase tracking-wide mb-3
                                    ${plan.highlight ? 'text-white/50' : 'text-zinc-400 dark:text-zinc-500'}`}>
                                    {plan.price === 0 ? 'Sans rechargement programmé' : `crédités au Wallet tous les ${plan.durationDays} jours`}
                                </p>
                                <p className={`text-[13px] leading-relaxed
                                    ${plan.highlight ? 'text-white/70' : 'text-zinc-500 dark:text-zinc-400'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className={`h-px mb-6
                                ${plan.highlight ? 'bg-white/10' : 'bg-zinc-100 dark:bg-zinc-700/50'}`} />

                            {/* Avantages */}
                            <ul className="space-y-3.5 flex-1 mb-8">
                                {plan.advantages.map((advantage: Advantage, j: number) => (
                                    <li key={j} className="flex items-start gap-3">
                                        <Icon icon="solar:check-circle-bold" width={17} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-primary' : 'text-secondary dark:text-secondary'}`} />
                                        <span className={`text-[13px] leading-snug ${plan.highlight ? 'text-white/90' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                            {advantage.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <button onClick={() => { setSelectedPlan(apiPlans.find((p: any) => p.id === plan.id) || null); setIsModalOpen(true); }}
                                className={`w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-150 cursor-pointer ${plan.highlight ? 'bg-primary text-white hover:bg-primary/90' : 'bg-secondary text-white hover:bg-secondary/90'}`} >
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
                        { icon: 'solar:shield-check-bold-duotone', label: 'Paiement sécurisé', color: 'text-secondary' },
                        { icon: 'solar:refresh-bold-duotone', label: 'Résiliable à tout moment', color: 'text-primary' },
                        { icon: 'solar:headphones-round-bold-duotone', label: 'Support réactif', color: 'text-secondary' },
                        { icon: 'solar:lock-keyhole-bold-duotone', label: 'Données protégées', color: 'text-primary' },
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
