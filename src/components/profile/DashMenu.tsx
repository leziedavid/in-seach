"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { getStoreUserInfo, getOverview } from "@/api/api";
import { StoreUserInfo } from "@/types/interface";
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
    { label: "Tarifs", tab: "Tarifs", icon: "solar:tag-price-bold-duotone", color: "secondary" },
];

export default function DashMenu({ onNavigate }: DashMenuProps) {
    const { addNotification } = useNotification();
    const [showBalance, setShowBalance] = useState(false);
    const [showPromo, setShowPromo] = useState(true);

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

    const handleScanClick = () => {
        addNotification("Scanner : bientôt disponible", "info");
    };

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Barre du haut — Paramètres */}
            <button
                onClick={() => onNavigate("Paramètres")}
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 active:scale-90 transition-all"
                aria-label="Paramètres"
            >
                <Icon icon="solar:settings-bold-duotone" width={20} className="text-foreground/80" />
            </button>

            {/* Gains totaux — masqués par défaut (points), révélés à la bascule de l'œil */}
            <div className="flex items-center justify-center gap-1.5 min-h-[20px]">
                {showBalance ? (
                    <span className="text-sm font-black text-green-500 tabular-nums">
                        {`${totalGains.toLocaleString()} FCFA`}
                    </span>
                ) : (
                    Array.from({ length: 8 }).map((_, i) => (
                        <span
                            key={i}
                            className={`rounded-full transition-all ${i === 0 ? "w-4 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/30"
                                }`}
                        />
                    ))
                )}
                <button
                    onClick={() => setShowBalance((v) => !v)}
                    className="ml-2 p-1 rounded-full hover:bg-muted active:scale-90 transition-all"
                    aria-label={showBalance ? "Masquer" : "Afficher"}
                >
                    <Icon
                        icon={showBalance ? "solar:eye-bold-duotone" : "solar:eye-closed-bold-duotone"}
                        width={16}
                        className="text-muted-foreground"
                    />
                </button>
            </div>

            {/* Bloc QR / Scanner — logo "chapeau" au-dessus du QR (boutique si dispo, sinon logo de l'app), boutique si elle existe sinon lien d'installation PWA */}
            <div className="flex flex-col items-center gap-2 pt-4">
                {storeLoading ? (
                    <div className="relative">
                        <div className="w-[144px] h-[144px] rounded-2xl bg-muted animate-pulse" />
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-muted animate-pulse border-2 border-background" />
                    </div>
                ) : (
                    <motion.div
                        key="qr"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative"
                    >
                        <div className="p-2 rounded-2xl bg-card border border-border shadow-sm">
                            <QRCodeCanvas value={qrValue} size={144} level="H" bgColor="#ffffff" fgColor="#111111" />
                        </div>
                        {/* Logo "chapeau" — chevauche le bord supérieur du QR */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-card border-2 border-background shadow-md flex items-center justify-center overflow-hidden">
                            <Image
                                src={qrLogoSrc}
                                alt={hasStore ? (storeInfo?.storeName || "Boutique") : "Djamko"}
                                width={hasStore && storeInfo?.storeLogo ? 56 : 32}
                                height={hasStore && storeInfo?.storeLogo ? 56 : 32}
                                className={hasStore && storeInfo?.storeLogo ? "w-full h-full object-cover" : "object-contain"}
                                unoptimized
                            />
                        </div>
                    </motion.div>
                )}

                <p className="text-xs font-semibold text-muted-foreground text-center px-6">
                    {hasStore
                        ? "Présentez ce code à un client : il accède directement à votre boutique"
                        : "Scannez ce code pour installer l'application Djamko"}
                </p>

                <button
                    onClick={handleScanClick}
                    className="flex items-center gap-2 bg-muted hover:bg-muted/70 text-foreground font-bold text-sm px-5 py-2 rounded-2xl transition-all active:scale-95"
                >
                    <Icon icon="solar:camera-bold-duotone" width={20} className="text-primary" />
                    Scanner
                </button>
            </div>

            {/* Grille des raccourcis — une couleur distincte par tuile */}
            <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                {MENU_ITEMS.map((item, i) => {
                    const variant = COLOR_VARIANTS[item.color];
                    return (
                        <motion.button
                            key={item.tab}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => onNavigate(item.tab)}
                            className="flex flex-col items-center gap-2 group"
                        >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 ${variant.bg}`}>
                                <Icon icon={item.icon} width={26} className={variant.text} />
                            </div>
                            <span className="text-[11px] font-semibold text-foreground text-center leading-tight px-1">
                                {item.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Bannière promo — dismissible */}
            {showPromo && (
                <div className="relative bg-primary rounded-3xl p-4 flex items-center gap-4 overflow-hidden shadow-lg shadow-primary/20">
                    <button
                        onClick={() => setShowPromo(false)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                        aria-label="Fermer"
                    >
                        <Icon icon="solar:close-circle-bold" width={16} className="text-white" />
                    </button>

                    <div className="flex-1 min-w-0 pr-6">
                        <p className="text-white font-black text-base">Boostez votre activité</p>
                        <p className="text-white/85 text-sm mt-1">
                            Publiez vos services et touchez plus de clients dès aujourd&apos;hui.
                        </p>
                    </div>

                    <div className="relative shrink-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">
                            <Icon icon="solar:graph-new-up-bold-duotone" width={30} className="text-white" />
                        </div>
                        <button
                            onClick={() => onNavigate("Services")}
                            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md active:scale-90 transition-transform"
                            aria-label="Découvrir"
                        >
                            <Icon icon="solar:play-bold" width={14} className="text-primary ml-0.5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
