"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { getStoreUserInfo, getOverview } from "@/api/api";
import { StoreUserInfo } from "@/types/interface";
import Wallet from "@/components/shared/Wallet";
import QrWalletModal from "@/components/profile/QrWalletModal";
import type { TabType } from "@/app/akwaba/Sidebar";

interface DashMenuProps {
    onNavigate: (tab: TabType) => void;
}

type MenuColor = "primary" | "secondary" | "blue" | "green" | "orange" | "indigo" | "fuchsia" | "rose" | "amber";

interface MenuItem {
    label: string;
    tab: TabType;
    icon: string;
    color: MenuColor;
}

// Une couleur distincte par tuile — palette déjà utilisée ailleurs dans le projet
// (primary/secondary de la marque + teintes Tailwind vues dans Overview.tsx et l'admin).
const COLOR_VARIANTS: Record<MenuColor, { bg: string; text: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    secondary: { bg: "bg-secondary/10", text: "text-secondary" },
    blue: { bg: "bg-blue-500/10", text: "text-blue-500" },
    green: { bg: "bg-green-500/10", text: "text-green-500" },
    orange: { bg: "bg-orange-500/10", text: "text-orange-500" },
    indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500" },
    fuchsia: { bg: "bg-fuchsia-500/10", text: "text-fuchsia-500" },
    rose: { bg: "bg-rose-500/10", text: "text-rose-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500" },
};

interface PromoMessage {
    id: string;
    title: string;
    subtitle: string;
    icon: string;
    /** Couleur du badge — réutilise la même palette que la grille de raccourcis. */
    color: MenuColor;
    /** Onglet interne à ouvrir au clic (via onNavigate, comme MENU_ITEMS) — prioritaire sur `url`. */
    tab?: TabType;
    /** Cible de navigation au clic (router.push) — utilisée seulement si `tab` est absent. null = bannière non cliquable, juste informative. */
    url: string | null;
}

// Carrousel de messages promo — pensé pour être alimenté plus tard (admin / backend) avec
// plusieurs messages poussés successivement, chacun avec sa propre couleur et sa propre cible (ou aucune).
// Un message par raccourci de MENU_ITEMS ci-dessous (même icône/couleur/onglet), plus un message
// générique en tête.
const PROMO_MESSAGES: PromoMessage[] = [
    {
        id: "boost-activity",
        title: "Boostez votre activité",
        subtitle: "Publiez vos services et touchez plus de clients dès aujourd'hui.",
        icon: "solar:graph-new-up-bold-duotone",
        color: "primary",
        url: null,
    },
    {
        id: "promo-calendrier",
        title: "Gérez votre calendrier",
        subtitle: "Visualisez et organisez tous vos rendez-vous à venir.",
        icon: "solar:calendar-bold-duotone",
        color: "orange",
        tab: "Calendrier",
        url: null,
    },
    {
        id: "promo-boutique",
        title: "Lancez votre boutique",
        subtitle: "Vendez vos produits en ligne et touchez plus de clients.",
        icon: "solar:shop-bold-duotone",
        color: "primary",
        tab: "Boutique",
        url: null,
    },
    {
        id: "promo-commandes",
        title: "Suivez vos commandes",
        subtitle: "Consultez et gérez toutes vos commandes en un coup d'œil.",
        icon: "solar:cart-large-bold-duotone",
        color: "green",
        tab: "Commandes",
        url: null,
    },
    {
        id: "promo-historique-commandes",
        title: "Retrouvez votre historique",
        subtitle: "Toutes vos commandes passées, classées et archivées.",
        icon: "solar:clock-circle-bold-duotone",
        color: "indigo",
        tab: "Historique-commandes",
        url: null,
    },
    {
        id: "promo-services",
        title: "Boostez vos services",
        subtitle: "Publiez vos services et gagnez en visibilité dès aujourd'hui.",
        icon: "solar:box-bold-duotone",
        color: "blue",
        tab: "Services",
        url: null,
    },
    {
        id: "promo-annonces",
        title: "Publiez une annonce",
        subtitle: "Mettez en avant vos annonces auprès de nouveaux clients.",
        icon: "solar:document-text-bold-duotone",
        color: "fuchsia",
        tab: "Annonces",
        url: null,
    },
    {
        id: "promo-rdv-service",
        title: "Vos rendez-vous services",
        subtitle: "Consultez et confirmez vos prochains rendez-vous.",
        icon: "solar:calendar-mark-bold-duotone",
        color: "rose",
        tab: "Rendez-vous",
        url: null,
    },
    {
        id: "promo-rdv-annonce",
        title: "Vos rendez-vous annonces",
        subtitle: "Gérez les rendez-vous liés à vos annonces.",
        icon: "solar:calendar-search-bold-duotone",
        color: "amber",
        tab: "Rendez-vous-annonces",
        url: null,
    },
    {
        id: "promo-facturation",
        title: "Comprenez la facturation",
        subtitle: "Le fonctionnement du Wallet et de vos crédits, expliqué simplement.",
        icon: "solar:wallet-money-bold-duotone",
        color: "secondary",
        tab: "Facturation",
        url: null,
    },
];

// Raccourcis "façon accueil app mobile" — chaque tuile pointe vers un TabType déjà
// géré par page.tsx/Sidebar.tsx (aucune nouvelle route/logique de navigation créée).
const MENU_ITEMS: MenuItem[] = [
    { label: "Calendrier", tab: "Calendrier", icon: "solar:calendar-bold-duotone", color: "orange" },
    { label: "Boutique", tab: "Boutique", icon: "solar:shop-bold-duotone", color: "primary" },
    { label: "Commandes", tab: "Commandes", icon: "solar:cart-large-bold-duotone", color: "green" },
    { label: "Historique des commandes", tab: "Historique-commandes", icon: "solar:clock-circle-bold-duotone", color: "indigo" },
    { label: "Services", tab: "Services", icon: "solar:box-bold-duotone", color: "blue" },
    { label: "Annonces", tab: "Annonces", icon: "solar:document-text-bold-duotone", color: "fuchsia" },
    { label: "Rendez-vous service", tab: "Rendez-vous", icon: "solar:calendar-mark-bold-duotone", color: "rose" },
    { label: "Rendez-vous annonce", tab: "Rendez-vous-annonces", icon: "solar:calendar-search-bold-duotone", color: "amber" },
    { label: "Facturation", tab: "Facturation", icon: "solar:wallet-money-bold-duotone", color: "secondary" },
];

export default function DashMenu({ onNavigate }: DashMenuProps) {
    const router = useRouter();
    const [showBalance, setShowBalance] = useState(false);
    const [showPromo, setShowPromo] = useState(true);
    const [walletOpen, setWalletOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [promoIndex, setPromoIndex] = useState(0);
    const currentPromo = PROMO_MESSAGES[promoIndex];

    // Défile automatiquement d'un message à l'autre — inutile s'il n'y en a qu'un seul.
    useEffect(() => {
        if (PROMO_MESSAGES.length <= 1) return;
        const id = setInterval(() => {
            setPromoIndex((i) => (i + 1) % PROMO_MESSAGES.length);
        }, 5000);
        return () => clearInterval(id);
    }, []);

    const handlePromoClick = () => {
        if (currentPromo.tab) {
            onNavigate(currentPromo.tab);
        } else if (currentPromo.url) {
            router.push(currentPromo.url);
        }
    };
    const hasPromoTarget = !!(currentPromo.tab || currentPromo.url);

    // Même requête/queryKey que Overview.tsx — total des gains (RDV + ventes boutique)
    // du prestataire, affiché à la place du numéro masqué en haut du QR.
    const { data: overviewRes } = useQuery({
        queryKey: ["overview"],
        queryFn: getOverview,
    });
    const overviewStats = overviewRes?.data;
    const totalGains = (overviewStats?.prestataire?.totalEarnings || 0) + (overviewStats?.prestataire?.boutiqueRevenue || 0);

    // Réutilise le même workflow que Store.tsx (getStoreUserInfo + createStoreSlug) pour
    // obtenir l'URL publique de la boutique — storeName vide/absent = pas encore de boutique.
    const [storeInfo, setStoreInfo] = useState<StoreUserInfo | null>(null);
    const [storeLoading, setStoreLoading] = useState(true);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await getStoreUserInfo();
                if (active && res.statusCode === 200 && res.data) setStoreInfo(res.data);
            } catch {
                // silencieux — le QR bascule simplement sur le fallback "installer l'app"
            } finally {
                if (active) setStoreLoading(false);
            }
        })();
        return () => { active = false; };
    }, []);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
    const hasStore = !!storeInfo?.storeName;
    // Même route stable que la section "QR Code de votre boutique" de Store.tsx (/qr/store/{id})
    // — reste valide même si le nom/slug de la boutique change ensuite.
    const qrValue = hasStore
        ? `${baseUrl}/qr/store/${storeInfo!.id}`
        : `${baseUrl}/guide#installation`;
    const qrLogoSrc = hasStore && storeInfo?.storeLogo ? storeInfo.storeLogo : "/logo.png";
    const qrTitle = hasStore ? (storeInfo?.storeName || "Ma boutique") : "Djamko";
    const qrSubtitle = hasStore
        ? "Présentez ce code à un client : il accède directement à votre boutique"
        : "Scannez ce code pour installer l'application Djamko";
    const hasLogoImage = !!(hasStore && storeInfo?.storeLogo);

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Barre du haut — Portefeuille + Paramètres, à droite pour l'accessibilité au pouce */}
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => setWalletOpen(true)}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 active:scale-90 transition-all"
                    aria-label="Mon portefeuille"
                >
                    <Icon icon="solar:wallet-bold-duotone" width={20} className="text-foreground/80" />
                </button>
                <button
                    onClick={() => onNavigate("Paramètres")}
                    className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 active:scale-90 transition-all"
                    aria-label="Paramètres"
                >
                    <Icon icon="solar:settings-bold-duotone" width={20} className="text-foreground/80" />
                </button>
            </div>

            <Wallet isOpen={walletOpen} onClose={() => setWalletOpen(false)} />

            {/* Carte gains + QR — fond dégradé façon "portefeuille" (teinte secondary du projet,
                volontairement mêlée à du navy pour ne pas être trop pure/saturée — voir
                .qr-card-surface, identique dans QrWalletModal) */}
            <div className="relative rounded-3xl qr-card-surface qr-card-pattern p-3.5 shadow-lg shadow-secondary/20 overflow-hidden">

                {/* Gains totaux — masqués par défaut (points), révélés à la bascule de l'œil */}
                <div className="flex items-center justify-center gap-1.5">
                    {showBalance ? (
                        <span className="text-lg font-black text-white tabular-nums">
                            {`${totalGains.toLocaleString()} F`}
                        </span>
                    ) : (
                        Array.from({ length: 8 }).map((_, i) => ( <span key={i}  className={`rounded-full transition-all ${i === 0 ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40" }`} />  ))
                    )}
                    <button
                        onClick={() => setShowBalance((v) => !v)}
                        className="ml-2 p-1 rounded-full hover:bg-white/10 active:scale-90 transition-all"
                        aria-label={showBalance ? "Masquer" : "Afficher"}
                    >
                        <Icon
                            icon={showBalance ? "solar:eye-bold-duotone" : "solar:eye-closed-bold-duotone"}
                            width={16}
                            className="text-white/70"
                        />
                    </button>
                </div>

                <div className="h-px bg-white/15 my-2" />

                {/* Bloc QR — toute la zone est cliquable : ouvre la version plein écran
                    (QrWalletModal), plus confortable à scanner. "Scanner" en pied de la
                    carte QR blanche (comme la référence Wave), logo en coin bas-droit de
                    la carte colorée — pas de texte/pastille en plus, la carte se suffit. */}
                {storeLoading ? (
                    <div className="flex flex-col items-center py-1">
                        <div className="w-full h-36 rounded-2xl bg-white/10 animate-pulse" />
                    </div>
                ) : (
                    <button
                        onClick={() => setQrModalOpen(true)}
                        className="relative w-full flex flex-col items-center py-1 group active:scale-[0.98] transition-transform"
                    >
                        <motion.div
                            key="qr"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className="rounded-2xl bg-white shadow-sm overflow-hidden transition-transform group-hover:scale-[1.02]"
                        >
                            <div className="p-2.5 pb-1.5">
                                <QRCodeCanvas value={qrValue} size={112} level="H" bgColor="#ffffff" fgColor="#111111" />
                            </div>
                            <div className="flex items-center justify-center gap-1 pb-1.5">
                                <Icon icon="solar:camera-bold" width={12} className="text-[#0F172A]" />
                                <span className="text-[#0F172A] text-xs font-bold">Scanner</span>
                            </div>
                        </motion.div>

                        {/* Logo — coin bas-droit de la carte colorée */}
                        <div className="absolute -bottom-2 -right-1 w-10 h-10 rounded-full bg-white border-[3px] border-white shadow-md flex items-center justify-center overflow-hidden">
                            <Image
                                src={qrLogoSrc}
                                alt={qrTitle}
                                width={hasLogoImage ? 40 : 22}
                                height={hasLogoImage ? 40 : 22}
                                className={hasLogoImage ? "w-full h-full object-cover" : "object-contain"}
                                unoptimized
                            />
                        </div>
                    </button>
                )}
            </div>

            <QrWalletModal
                isOpen={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                qrValue={qrValue}
                title={qrTitle}
                subtitle={qrSubtitle}
                logoSrc={qrLogoSrc}
                hasLogoImage={hasLogoImage}
            />

            {/* Grille des raccourcis — cartes bordées avec badge icône en carré arrondi, même
                langage visuel que le lexique de la page Facturation (BillingGuide.tsx). */}
            <div className="grid grid-cols-3 gap-2.5">
                {MENU_ITEMS.map((item, i) => {
                    const variant = COLOR_VARIANTS[item.color];
                    return (
                        <motion.button
                            key={item.tab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onNavigate(item.tab)}
                            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-card border border-border/60 hover:border-primary/30 transition-colors group"
                        >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${variant.bg}`}>
                                <Icon icon={item.icon} width={28} className={variant.text} />
                            </div>
                            <span className="text-[12px] font-bold text-foreground text-center leading-tight">
                                {item.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Bannière promo — carrousel de messages, chacun avec sa propre couleur (façon badge
                info) et sa propre cible (ou aucune). Fond transparent + compact + texte gris
                bien lisible : ce sont de simples notifications pour l'utilisateur connecté. */}
            {showPromo && currentPromo && (
                <div className={`relative ${COLOR_VARIANTS[currentPromo.color].bg} backdrop-blur-md rounded-2xl overflow-hidden border border-border/40`}>
                    <button
                        onClick={() => setShowPromo(false)}
                        className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors"
                        aria-label="Fermer"
                    >
                        <Icon icon="solar:close-circle-bold" width={13} className="text-muted-foreground" />
                    </button>

                    <div
                        onClick={handlePromoClick}
                        className={`overflow-hidden ${hasPromoTarget ? "cursor-pointer" : ""}`}
                    >
                        <motion.div
                            key={currentPromo.id}
                            initial={{ x: 40, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 26 }}
                            whileTap={hasPromoTarget ? { scale: 0.99 } : undefined}
                            className="flex items-center gap-3 p-3"
                        >
                            <div className="flex-1 min-w-0 pr-5">
                                <p className="text-gray-700 dark:text-gray-200 font-black text-sm">{currentPromo.title}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{currentPromo.subtitle}</p>
                            </div>

                            <div className="relative shrink-0 flex items-center justify-center">
                                <div className="w-11 h-11 rounded-xl bg-card/70 flex items-center justify-center">
                                    <Icon icon={currentPromo.icon} width={22} className={COLOR_VARIANTS[currentPromo.color].text} />
                                </div>
                                {hasPromoTarget && (
                                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-md">
                                        <Icon icon="solar:play-bold" width={11} className={`${COLOR_VARIANTS[currentPromo.color].text} ml-0.5`} />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Indicateur — un point par message, un seul message = pas d'indicateur */}
                    {PROMO_MESSAGES.length > 1 && (
                        <div className="flex items-center justify-center gap-1.5 pb-2">
                            {PROMO_MESSAGES.map((msg, i) => (
                                <button
                                    key={msg.id}
                                    onClick={() => setPromoIndex(i)}
                                    className={`h-1.5 rounded-full transition-all ${i === promoIndex ? "w-4 bg-foreground" : "w-1.5 bg-muted-foreground/30"}`}
                                    aria-label={`Message ${i + 1}`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
