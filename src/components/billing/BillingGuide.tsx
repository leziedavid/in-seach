"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import OnBack from "@/components/shared/OnBack";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Wallet from "@/components/shared/Wallet";
import { getMyWallet } from "@/api/wallet-api";

interface BillingGuideProps {
    onBack: () => void;
}

// ── Palette par "tone" — mêmes teintes que GuideIllustration (guide public), réutilisées
// ici pour rester cohérent visuellement entre le guide public et cet espace connecté.
type Tone = "primary" | "secondary" | "emerald" | "amber" | "cyan" | "indigo" | "purple" | "rose" | "orange" | "fuchsia" | "blue";

const TONE: Record<Tone, { bg: string; text: string; ring: string; solid: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", ring: "ring-primary/20", solid: "bg-primary" },
    secondary: { bg: "bg-secondary/10", text: "text-secondary", ring: "ring-secondary/20", solid: "bg-secondary" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/20", solid: "bg-emerald-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/20", solid: "bg-amber-500" },
    cyan: { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400", ring: "ring-cyan-500/20", solid: "bg-cyan-500" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", ring: "ring-indigo-500/20", solid: "bg-indigo-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", ring: "ring-purple-500/20", solid: "bg-purple-500" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", ring: "ring-rose-500/20", solid: "bg-rose-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", ring: "ring-orange-500/20", solid: "bg-orange-500" },
    fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-600 dark:text-fuchsia-400", ring: "ring-fuchsia-500/20", solid: "bg-fuchsia-500" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", ring: "ring-blue-500/20", solid: "bg-blue-500" },
};

// ── Petit utilitaire d'apparition au scroll — animation légère déjà utilisée dans le
// projet (framer-motion), simplement appliquée en whileInView pour ne l'exécuter qu'une
// fois la section visible plutôt qu'au chargement de toute la page.
function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

function SectionHeading({ eyebrow, title, description, tone = "primary" }: { eyebrow: string; title: string; description?: string; tone?: Tone }) {
    return (
        <div className="mb-6 md:mb-8">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-3 ${TONE[tone].bg} ${TONE[tone].text}`}>
                {eyebrow}
            </span>
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight mb-2">{title}</h2>
            {description && <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{description}</p>}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Lexique visuel — vue d'ensemble en un coup d'œil, avant tout texte détaillé
// ═══════════════════════════════════════════════════════════════════════════
const GLOSSARY: { icon: string; label: string; tone: Tone }[] = [
    { icon: "solar:gift-bold-duotone", label: "Bonus de bienvenue", tone: "amber" },
    { icon: "solar:wallet-bold-duotone", label: "Wallet", tone: "emerald" },
    { icon: "solar:card-transfer-bold-duotone", label: "Rechargement", tone: "cyan" },
    { icon: "solar:history-bold-duotone", label: "Historique", tone: "indigo" },
    { icon: "solar:box-bold-duotone", label: "Produits", tone: "blue" },
    { icon: "solar:chef-hat-bold-duotone", label: "Menus", tone: "orange" },
    { icon: "solar:hand-stars-bold-duotone", label: "Services", tone: "purple" },
    { icon: "solar:megaphone-bold-duotone", label: "Annonces", tone: "rose" },
    { icon: "solar:rocket-bold-duotone", label: "Boost", tone: "fuchsia" },
    { icon: "solar:calendar-bold-duotone", label: "Rendez-vous", tone: "secondary" },
    { icon: "solar:check-circle-bold-duotone", label: "Validation", tone: "emerald" },
    { icon: "solar:bolt-bold-duotone", label: "Débit automatique", tone: "primary" },
];

function GlossaryGrid() {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {GLOSSARY.map((g, i) => (
                <Reveal key={g.label} delay={i * 0.02}>
                    <div className="flex flex-col items-center text-center gap-2 p-3 rounded-2xl bg-card border border-border/60 h-full">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TONE[g.tone].bg}`}>
                            <Icon icon={g.icon} className={`w-5 h-5 ${TONE[g.tone].text}`} />
                        </div>
                        <span className="text-[11px] font-bold text-foreground leading-tight">{g.label}</span>
                    </div>
                </Reveal>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Deux circuits de paiement — la distinction la plus importante de toute la page
// ═══════════════════════════════════════════════════════════════════════════
function PaymentCircuits() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Reveal>
                <div className="h-full p-6 rounded-3xl bg-card border border-emerald-500/20 relative overflow-hidden">
                    <Icon icon="solar:bag-heart-bold-duotone" className="absolute -bottom-4 -right-4 w-28 h-28 text-emerald-500/5" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                                <Icon icon="solar:user-bold-duotone" className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Gratuit</Badge>
                        </div>
                        <h3 className="font-black text-foreground text-lg mb-2">Quand j'achète en tant que client</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            Parcourir le catalogue, commander un produit ou un repas ne coûte jamais rien. Le Wallet n'intervient à aucun moment.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <Icon icon="solar:map-point-bold-duotone" width={16} />
                            Vous payez le vendeur directement, ou à la livraison.
                        </div>
                    </div>
                </div>
            </Reveal>

            <Reveal delay={0.08}>
                <div className="h-full p-6 rounded-3xl bg-card border border-primary/20 relative overflow-hidden">
                    <Icon icon="solar:wallet-money-bold-duotone" className="absolute -bottom-4 -right-4 w-28 h-28 text-primary/5" />
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:case-minimalistic-bold-duotone" className="w-6 h-6 text-primary" />
                            </div>
                            <Badge className="bg-primary/10 text-primary border border-primary/20">Wallet</Badge>
                        </div>
                        <h3 className="font-black text-foreground text-lg mb-2">Quand j'agis en tant que vendeur</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            Publier, valider, booster : certaines actions professionnelles consomment des crédits de votre Wallet.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                            <Icon icon="solar:bolt-bold-duotone" width={16} />
                            Le coût est débité automatiquement au moment de l'action.
                        </div>
                    </div>
                </div>
            </Reveal>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline — Comment fonctionne le Wallet
// ═══════════════════════════════════════════════════════════════════════════
const WALLET_STEPS: { icon: string; title: string; description: string; tone: Tone }[] = [
    { icon: "solar:user-plus-rounded-bold-duotone", title: "Créer un compte", description: "Gratuit, pour tous les profils — client, prestataire, entreprise...", tone: "primary" },
    { icon: "solar:gift-bold-duotone", title: "Recevoir le bonus de bienvenue", description: "Un crédit offert automatiquement dans le Wallet dès l'inscription.", tone: "amber" },
    { icon: "solar:card-transfer-bold-duotone", title: "Recharger son Wallet", description: "À tout moment, via Wave, Orange Money, MTN Money ou Moov Money.", tone: "cyan" },
    { icon: "solar:wallet-bold-duotone", title: "Utiliser ses crédits", description: "Pour réaliser une action payante de la plateforme.", tone: "emerald" },
    { icon: "solar:bolt-bold-duotone", title: "Le coût est débité automatiquement", description: "Aucune manipulation : le montant exact est retiré au moment de l'action.", tone: "orange" },
    { icon: "solar:refresh-circle-bold-duotone", title: "Le solde est mis à jour", description: "Visible immédiatement dans « Mon Portefeuille », avec la transaction dans l'historique.", tone: "secondary" },
];

const WALLET_ACTIONS_MID_STEP = [
    { icon: "solar:box-bold-duotone", label: "Publier un produit" },
    { icon: "solar:hand-stars-bold-duotone", label: "Publier un service" },
    { icon: "solar:chef-hat-bold-duotone", label: "Publier un menu" },
    { icon: "solar:cart-check-bold-duotone", label: "Valider une commande" },
    { icon: "solar:calendar-bold-duotone", label: "Valider un rendez-vous" },
];

function WalletTimeline() {
    return (
        <div className="relative">
            {/* Ligne verticale de connexion, derrière les pastilles (z-10) */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />

            <div className="space-y-2">
                {WALLET_STEPS.map((step, i) => (
                    <Reveal key={step.title} delay={i * 0.05}>
                        <div className="relative flex gap-4 pb-2">
                            <div className={`relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-4 ring-background ${TONE[step.tone].bg}`}>
                                <Icon icon={step.icon} className={`w-6 h-6 ${TONE[step.tone].text}`} />
                            </div>
                            <div className="pt-2 pb-3">
                                <p className="font-black text-foreground text-sm mb-0.5">{step.title}</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>

                                {/* Bloc d'actions imbriqué à l'étape "Utiliser ses crédits" */}
                                {step.title === "Utiliser ses crédits" && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {WALLET_ACTIONS_MID_STEP.map((a) => (
                                            <span key={a.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-[11px] font-bold text-foreground/80">
                                                <Icon icon={a.icon} width={13} className="text-primary" />
                                                {a.label}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Flow — Comment fonctionne un achat
// ═══════════════════════════════════════════════════════════════════════════
const PURCHASE_STEPS: { icon: string; label: string }[] = [
    { icon: "solar:user-bold-duotone", label: "Client" },
    { icon: "solar:cart-large-4-bold-duotone", label: "Commande un produit" },
    { icon: "solar:check-circle-bold-duotone", label: "Le vendeur accepte" },
    { icon: "solar:hand-money-bold-duotone", label: "Paie le vendeur ou à la livraison" },
];

function PurchaseFlow() {
    return (
        <div>
            <div className="flex flex-wrap md:flex-nowrap items-stretch gap-2">
                {PURCHASE_STEPS.map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2 flex-1 min-w-[140px]">
                        <Reveal delay={i * 0.06} className="flex-1">
                            <div className="h-full p-4 rounded-2xl bg-card border border-border/60 flex flex-col items-center text-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Icon icon={step.icon} className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-xs font-bold text-foreground leading-tight">{step.label}</span>
                            </div>
                        </Reveal>
                        {i < PURCHASE_STEPS.length - 1 && (
                            <Icon icon="solar:arrow-right-bold" className="w-5 h-5 text-muted-foreground/40 shrink-0 hidden md:block" />
                        )}
                    </div>
                ))}
            </div>

            <Reveal delay={0.3}>
                <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex gap-3">
                    <Icon icon="solar:shield-check-bold-duotone" className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground font-bold leading-relaxed">
                        <span className="uppercase tracking-wide text-primary mr-1">Important —</span>
                        Le Wallet du client n'est jamais utilisé pour acheter un produit. Le paiement se fait toujours directement au vendeur, ou à la livraison selon le mode proposé.
                    </p>
                </div>
            </Reveal>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Grille — Pourquoi utiliser son Wallet
// ═══════════════════════════════════════════════════════════════════════════
const WHY_WALLET: { icon: string; label: string; tone: Tone }[] = [
    { icon: "solar:box-bold-duotone", label: "Publier un produit", tone: "blue" },
    { icon: "solar:chef-hat-bold-duotone", label: "Publier un menu", tone: "orange" },
    { icon: "solar:hand-stars-bold-duotone", label: "Publier un service", tone: "purple" },
    { icon: "solar:megaphone-bold-duotone", label: "Publier une annonce", tone: "rose" },
    { icon: "solar:cart-check-bold-duotone", label: "Valider une commande", tone: "emerald" },
    { icon: "solar:calendar-bold-duotone", label: "Valider un rendez-vous", tone: "secondary" },
    { icon: "solar:rocket-bold-duotone", label: "Booster une annonce", tone: "fuchsia" },
];

function WhyWalletGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {WHY_WALLET.map((w, i) => (
                <Reveal key={w.label} delay={i * 0.04}>
                    <div className="h-full p-4 rounded-2xl bg-card border border-border/60 flex flex-col gap-3 hover:border-primary/30 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TONE[w.tone].bg}`}>
                            <Icon icon={w.icon} className={`w-5 h-5 ${TONE[w.tone].text}`} />
                        </div>
                        <span className="text-xs font-bold text-foreground leading-snug">{w.label}</span>
                    </div>
                </Reveal>
            ))}
            <Reveal delay={WHY_WALLET.length * 0.04}>
                <div className="h-full p-4 rounded-2xl border border-dashed border-border/60 flex flex-col items-center justify-center text-center gap-1.5">
                    <Icon icon="solar:sticker-smile-circle-2-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[11px] font-bold text-muted-foreground leading-snug">et quelques autres actions professionnelles</span>
                </div>
            </Reveal>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Exemples concrets
// ═══════════════════════════════════════════════════════════════════════════
interface Example {
    role: string;
    tone: Tone;
    roleIcon: string;
    title: string;
    steps: { icon: string; text: string }[];
}

const EXAMPLES: Example[] = [
    {
        role: "Restaurateur",
        tone: "orange",
        roleIcon: "solar:chef-hat-bold-duotone",
        title: "Publier un menu et recevoir des commandes",
        steps: [
            { icon: "solar:card-transfer-bold-duotone", text: "Je recharge mon Wallet." },
            { icon: "solar:chef-hat-bold-duotone", text: "Je publie un menu — quelques crédits sont débités." },
            { icon: "solar:bell-bold-duotone", text: "Je reçois des commandes de repas." },
            { icon: "solar:check-circle-bold-duotone", text: "Je valide une commande — les crédits prévus sont débités automatiquement." },
        ],
    },
    {
        role: "Vendeur",
        tone: "blue",
        roleIcon: "solar:bag-heart-bold-duotone",
        title: "Publier un produit et être payé à la livraison",
        steps: [
            { icon: "solar:box-bold-duotone", text: "Je publie un produit." },
            { icon: "solar:bell-bold-duotone", text: "Je reçois une commande." },
            { icon: "solar:check-circle-bold-duotone", text: "Je valide la commande." },
            { icon: "solar:hand-money-bold-duotone", text: "Le client paie directement à la livraison — le Wallet ne sert qu'à payer les actions de la plateforme." },
        ],
    },
    {
        role: "Prestataire",
        tone: "purple",
        roleIcon: "solar:case-minimalistic-bold-duotone",
        title: "Publier un service et honorer un rendez-vous",
        steps: [
            { icon: "solar:hand-stars-bold-duotone", text: "Je publie un service." },
            { icon: "solar:calendar-add-bold-duotone", text: "Un client réserve un rendez-vous." },
            { icon: "solar:check-circle-bold-duotone", text: "Je valide le rendez-vous." },
            { icon: "solar:bolt-bold-duotone", text: "Les frais configurés sont automatiquement prélevés de mon Wallet." },
        ],
    },
];

function ExampleCard({ ex, index }: { ex: Example; index: number }) {
    return (
        <Reveal delay={index * 0.08}>
            <div className="h-full p-5 rounded-3xl bg-card border border-border/60">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${TONE[ex.tone].bg}`}>
                        <Icon icon={ex.roleIcon} className={`w-5 h-5 ${TONE[ex.tone].text}`} />
                    </div>
                    <div className="min-w-0">
                        <Badge variant="outline" className="mb-1">{ex.role}</Badge>
                        <p className="text-sm font-black text-foreground leading-tight">{ex.title}</p>
                    </div>
                </div>
                <ol className="space-y-3">
                    {ex.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                            <span className="shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground font-black text-[10px] flex items-center justify-center mt-0.5">
                                {i + 1}
                            </span>
                            <p className="text-xs text-muted-foreground leading-relaxed">{s.text}</p>
                        </li>
                    ))}
                </ol>
            </div>
        </Reveal>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// FAQ
// ═══════════════════════════════════════════════════════════════════════════
const FAQ_ITEMS = [
    { id: "why-wallet", q: "Pourquoi ai-je besoin d'un Wallet ?", a: "Un Wallet n'est utile que si vous vendez, proposez un service ou publiez du contenu sur Djamko : il sert à régler les actions professionnelles (publication, validation, boost...). Si vous n'utilisez la plateforme qu'en tant que client, vous n'en avez pas réellement besoin — vos achats n'y passent jamais." },
    { id: "recharge", q: "Comment recharger mon Wallet ?", a: "Depuis « Mon Portefeuille », onglet « Recharger » : choisissez un montant, un opérateur (Wave, Orange Money, MTN Money, Moov Money), puis validez. Vous pouvez joindre une preuve de paiement pour accélérer la validation." },
    { id: "pay-purchases", q: "Le Wallet sert-il à payer mes achats ?", a: "Non, jamais. Un produit ou un repas commandé se règle toujours directement au vendeur, ou à la livraison selon le mode proposé. Le Wallet ne concerne que les actions professionnelles des vendeurs et prestataires." },
    { id: "why-debited", q: "Pourquoi mon Wallet a-t-il été débité ?", a: "Chaque débit correspond à une action facturable que vous avez effectuée (publication, validation de commande ou de rendez-vous, boost...). Le détail exact — action, montant, date — est toujours visible dans l'onglet « Transactions »." },
    { id: "bonus-recover", q: "Puis-je récupérer mon bonus si je l'ai dépensé ?", a: "Non. Le bonus de bienvenue est offert une seule fois, à la création du compte. Une fois utilisé (ou si le solde revient à 0), il n'est jamais reversé ni recrédité automatiquement." },
    { id: "empty-wallet", q: "Que se passe-t-il si mon Wallet est vide ?", a: "L'action payante est bloquée et vous êtes invité à recharger avant de continuer — vos publications, commandes ou rendez-vous déjà existants ne sont jamais affectés." },
    { id: "action-cost", q: "Comment connaître le coût d'une action ?", a: "Le montant exact s'affiche systématiquement avant confirmation, au moment de l'action (publication, validation, boost...). Les tarifs pouvant évoluer, ils ne sont jamais figés à l'avance ailleurs que sur cet écran de confirmation." },
    { id: "history", q: "Comment consulter mon historique ?", a: "Ouvrez « Mon Portefeuille » puis l'onglet « Transactions » : chaque crédit et chaque débit y apparaît avec sa date et son motif, du plus récent au plus ancien." },
    { id: "bonus-once", q: "Le bonus est-il attribué plusieurs fois ?", a: "Non. Il est unique par compte, pour toute la durée de vie du compte — un redémarrage, une mise à jour de l'application ou un nouveau solde à 0 ne déclenchent jamais un second bonus." },
] as const;

function BillingFAQ() {
    const [active, setActive] = useState<string | null>(null);
    return (
        <div className="space-y-3">
            {FAQ_ITEMS.map((item) => (
                <AccordionSection
                    key={item.id}
                    id={item.id}
                    title={item.q}
                    icon="solar:question-circle-bold-duotone"
                    activeSection={active}
                    onToggle={(id) => setActive((p) => (p === id ? null : id))}
                >
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </AccordionSection>
            ))}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Page principale
// ═══════════════════════════════════════════════════════════════════════════
export default function BillingGuide({ onBack }: BillingGuideProps) {
    const [walletOpen, setWalletOpen] = useState(false);
    const [walletTab, setWalletTab] = useState<"transactions" | "recharger">("recharger");

    const { data: walletRes, isLoading: walletLoading } = useQuery({
        queryKey: ["wallet"],
        queryFn: getMyWallet,
    });
    const wallet = walletRes?.statusCode === 200 ? walletRes.data : undefined;

    const openWallet = (tab: "transactions" | "recharger") => {
        setWalletTab(tab);
        setWalletOpen(true);
    };

    return (
        <div className="w-full max-w-full space-y-10 md:space-y-14 pb-10">
            <OnBack
                label="Facturation"
                onBack={onBack}
                subtitle="Comprenez en moins de deux minutes comment fonctionnent le Wallet et la facturation sur Djamko."
            />

            {/* ── Hero : solde en direct + CTA ── */}
            <Reveal>
                <div className="relative rounded-3xl bg-gradient-to-br from-[#092E40] to-secondary p-6 md:p-8 shadow-lg shadow-secondary/20 overflow-hidden">
                    <Icon icon="solar:wallet-bold-duotone" className="absolute -bottom-6 -right-6 w-40 h-40 text-white/5" />
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-bold uppercase tracking-wide mb-3">
                                <Icon icon="solar:wallet-bold-duotone" width={15} />
                                Mon Portefeuille
                            </div>
                            <p className="text-white/70 text-xs font-semibold mb-1">Solde disponible</p>
                            <p className="text-3xl md:text-4xl font-black text-white tabular-nums mb-1">
                                {walletLoading ? "…" : `${(wallet?.balance ?? 0).toLocaleString()} FCFA`}
                            </p>
                            <p className="text-white/60 text-xs leading-relaxed max-w-md">
                                Ce solde sert uniquement à régler vos actions professionnelles sur la plateforme — jamais vos achats.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <Button onClick={() => openWallet("recharger")} className="bg-white text-secondary hover:bg-white/90 shadow-none rounded-2xl px-5">
                                <Icon icon="solar:card-transfer-bold-duotone" width={18} />
                                Recharger
                            </Button>
                            <Button onClick={() => openWallet("transactions")} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl px-5">
                                <Icon icon="solar:history-bold-duotone" width={18} />
                                Historique
                            </Button>
                        </div>
                    </div>
                </div>
            </Reveal>

            {/* ── Lexique visuel ── */}
            <div>
                <SectionHeading eyebrow="En un coup d'œil" title="Le lexique du Wallet" tone="indigo" />
                <GlossaryGrid />
            </div>

            {/* ── Deux circuits ── */}
            <div>
                <SectionHeading
                    eyebrow="À bien distinguer"
                    title="Deux circuits de paiement, jamais mélangés"
                    description="C'est la règle la plus importante à retenir : vos achats et le Wallet ne se croisent jamais."
                    tone="emerald"
                />
                <PaymentCircuits />
            </div>

            {/* ── Timeline Wallet ── */}
            <div>
                <SectionHeading
                    eyebrow="Étape par étape"
                    title="Comment fonctionne le Wallet ?"
                    description="Du compte créé jusqu'au solde mis à jour, chaque étape est automatique."
                    tone="primary"
                />
                <div className="p-5 md:p-6 rounded-3xl bg-card border border-border/60">
                    <WalletTimeline />
                </div>
            </div>

            {/* ── Flow achat ── */}
            <div>
                <SectionHeading
                    eyebrow="Étape par étape"
                    title="Comment fonctionne un achat ?"
                    description="Un produit commandé suit un tout autre circuit, indépendant du Wallet."
                    tone="blue"
                />
                <PurchaseFlow />
            </div>

            {/* ── Pourquoi utiliser le Wallet ── */}
            <div>
                <SectionHeading
                    eyebrow="Cas d'usage"
                    title="Pourquoi utiliser son Wallet ?"
                    description="Uniquement pour ces actions professionnelles — jamais pour un achat."
                    tone="fuchsia"
                />
                <WhyWalletGrid />
            </div>

            {/* ── Exemples concrets ── */}
            <div>
                <SectionHeading eyebrow="Exemples concrets" title="Trois profils, trois scénarios" tone="orange" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {EXAMPLES.map((ex, i) => (
                        <ExampleCard key={ex.role} ex={ex} index={i} />
                    ))}
                </div>
            </div>

            {/* ── FAQ ── */}
            <div>
                <SectionHeading eyebrow="Questions fréquentes" title="Tout ce qu'il faut savoir sur le Wallet" tone="secondary" />
                <BillingFAQ />
            </div>

            {/* ── CTA de clôture ── */}
            <Reveal>
                <div className="rounded-3xl bg-card border border-border p-6 md:p-10 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-56 h-56 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl" />
                    <div className="relative z-10">
                        <Icon icon="solar:shield-check-bold-duotone" className="w-10 h-10 text-primary mx-auto mb-3 opacity-30" />
                        <h3 className="text-lg md:text-xl font-black text-foreground mb-2">Prêt à passer à l'action ?</h3>
                        <p className="text-muted-foreground text-sm mb-5 max-w-md mx-auto">
                            Rechargez votre Wallet ou consultez votre historique directement depuis « Mon Portefeuille ».
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <Button onClick={() => openWallet("recharger")} className="rounded-2xl px-6">
                                <Icon icon="solar:card-transfer-bold-duotone" width={18} />
                                Recharger mon Wallet
                            </Button>
                            <Button onClick={() => openWallet("transactions")} variant="outline" className="rounded-2xl px-6">
                                <Icon icon="solar:history-bold-duotone" width={18} />
                                Voir mes transactions
                            </Button>
                        </div>
                    </div>
                </div>
            </Reveal>

            <Wallet isOpen={walletOpen} onClose={() => setWalletOpen(false)} initialTab={walletTab} />
        </div>
    );
}
