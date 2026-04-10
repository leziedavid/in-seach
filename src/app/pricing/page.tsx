'use client';

import React from 'react';
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { getPlans } from '@/api/api';
import SubscriptionPaymentModal from '@/components/subscription/SubscriptionPaymentModal';
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

export default function PricingPage() {

    const { data: plansRes, isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: getPlans
    });

    const [selectedPlan, setSelectedPlan] = React.useState<SubscriptionPlan | null>(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);

    // Dynamic Plans from API
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

            // Map features from string array to UI Feature object
            const mappedFeatures = (p.features && p.features.length > 0)
                ? p.features.map(f => ({ text: f, included: true }))
                : (isFree ? defaultFeatures.FREE : defaultFeatures.PREMIUM);

            return {
                id: p.id,
                name: p.name,
                price: p.price,
                description: p.description || (isFree ? 'Idéal pour commencer et tester la plateforme.' : 'Pour les professionnels qui veulent booster leur activité.'),
                features: mappedFeatures,
                cta: isFree ? 'Commencer gratuitement' : 'S\'abonner maintenant',
                highlight: isPremium || isLogistic,
            };
        });
    }, [apiPlans]);

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center ">
            <Icon icon="solar:refresh-bold-duotone" width={48} className="animate-spin text-primary" />
        </div>
    );

    return (

        <div className="min-h-screen py-24 px-8">
            <div className="max-w-6xl mx-auto">

                <div className="text-center mb-20">
                    <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-6">
                        Des tarifs simples et transparents
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                        Choisissez le plan qui correspond à vos ambitions. Pas de frais cachés, résiliable à tout moment.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan: Plan, i: number) => (
                        <div key={i} className={`relative bg-white rounded-[2rem] p-10 border-2 ${plan.highlight ? 'border-primary shadow-2xl shadow-indigo-100' : 'border-slate-100'} transition-all hover:scale-[1.02]`}  >
                            {plan.highlight && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2">
                                    <Icon icon="solar:star-bold-duotone" width={16} className="fill-white" />
                                    RECOMMANDÉ
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                                <p className="text-primary0 text-sm leading-relaxed">{plan.description}</p>
                            </div>

                            <div className="mb-10 flex items-baseline gap-1">
                                <span className="text-5xl font-extrabold text-slate-900">{plan.price}€</span>
                                <span className="text-slate-400 font-medium">/mois</span>
                            </div>

                            <ul className="space-y-5 mb-10">
                                {plan.features.map((feature: Feature, j: number) => (
                                    <li key={j} className="flex items-center gap-4 text-slate-700 font-medium">
                                        {feature.included ? (
                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <Icon icon="solar:check-circle-bold-duotone" width={14} className="text-green-600" />
                                            </div>
                                        ) : (
                                            <div className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Icon icon="solar:close-circle-bold-duotone" width={14} className="text-slate-400" />
                                            </div>
                                        )}
                                        <span className={feature.included ? 'text-slate-700' : 'text-slate-400 line-through'}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={() => { setSelectedPlan(apiPlans.find((p: any) => p.id === plan.id) || null); setIsModalOpen(true); }}
                                className={`block w-full text-center py-4 rounded-2xl font-bold transition-all ${plan.highlight ? 'bg-primary text-white shadow-lg shadow-secondary hover:bg-secondary hover:text-white' : 'bg-white text-primary border-2 border-secondary hover:bg-secondary hover:text-white'}`} >
                                {plan.cta}
                            </button>

                        </div>
                    ))}
                </div>

                <SubscriptionPaymentModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    plan={selectedPlan}
                />

            </div>
        </div>

    );
}
