"use client";

import { useState } from "react";
import { AccordionSection } from "@/components/ui/AccordionSection";

const FAQ_ITEMS = [
    {
        id: "faq-gratuit",
        question: "Créer un catalogue ou publier une annonce est-il gratuit ?",
        answer: "Oui, la publication de base est gratuite. Des options de mise en avant (boost) payantes existent pour gagner en visibilité, mais elles restent entièrement optionnelles.",
    },
    {
        id: "faq-paiement",
        question: "Quels moyens de paiement sont acceptés ?",
        answer: "Le paiement à la livraison, ainsi que les principaux portefeuilles mobiles (Wave, Orange Money, MTN Money, Moov Money) selon le vendeur et la commande.",
    },
    {
        id: "faq-livraison",
        question: "Comment savoir où en est ma commande ou ma livraison ?",
        answer: "Chaque commande affiche un statut mis à jour en temps réel (en attente, validée, expédiée, livrée...). Pour la logistique internationale, un suivi détaillé avec code de tracking est disponible.",
    },
    {
        id: "faq-modifier-annonce",
        question: "Puis-je modifier une annonce ou un produit après publication ?",
        answer: "Oui, à tout moment depuis votre espace personnel. Vous pouvez modifier le prix, les photos, la description, ou suspendre temporairement la publication.",
    },
    {
        id: "faq-notifications",
        question: "Je ne reçois pas de notifications, que faire ?",
        answer: "Vérifiez que les notifications sont activées à la fois dans les paramètres de Djamko et dans les réglages de notifications de votre téléphone. L'installation de l'application (voir plus haut) améliore aussi la fiabilité de réception.",
    },
] as const;

export default function GuideFAQ() {
    const [active, setActive] = useState<string | null>(null);
    const toggle = (id: string) => setActive(prev => prev === id ? null : id);

    return (
        <div className="space-y-3 max-w-3xl mx-auto">
            {FAQ_ITEMS.map(item => (
                <AccordionSection
                    key={item.id}
                    id={item.id}
                    title={item.question}
                    icon="solar:question-circle-bold-duotone"
                    activeSection={active}
                    onToggle={toggle}
                >
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
                </AccordionSection>
            ))}
        </div>
    );
}
