"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Role } from "@/types/interface";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/utils/langue/hooks";

export type TabType =
    | "Overview"
    | "Calendrier"
    | "Services"
    | "Rendez-vous"
    | "Rendez-vous-annonces"
    | "Annonces"
    | "Historique-rdv"
    | "Boutique"
    | "Commandes"
    | "Historique-commandes"
    | "Paramètres"
    | "Tarifs"
    | "Services-logistiques"
    | "Mes-devis"
    | "Mes-livraisons"
    | "Mes-services-logistiques"
    | "Devis-recus"
    | "Livraisons"
    | "Livraisons-chauffeur"
    | "Documentation-API"
    | "Ma-flotte"
    | "Livreur-dashboard";

export interface TabConfig {
    key: TabType;
    labelKey: string;
    icon: string;
    roles: Role[];
    subtitle?: string;
}

export const TABS_CONFIG: TabConfig[] = [
    { labelKey: 'akwaba.sidebar.overview', icon: "solar:graph-bold-duotone", key: 'Overview', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE] },
    { labelKey: 'akwaba.sidebar.calendar', icon: "solar:calendar-date-bold-duotone", key: 'Calendrier', roles: [Role.PRESTATAIRE, Role.ADMIN, Role.CLIENT] },
    { labelKey: 'akwaba.sidebar.services', icon: "solar:box-bold-duotone", key: 'Services', roles: [Role.PRESTATAIRE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.annonces', icon: "solar:eye-bold-duotone", key: 'Annonces', roles: [Role.PRESTATAIRE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.rd_services', icon: "solar:clipboard-list-bold-duotone", key: 'Rendez-vous', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.rd_annonces', icon: "solar:clipboard-check-bold-duotone", key: 'Rendez-vous-annonces', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.history_rdv', icon: "solar:history-bold-duotone", key: 'Historique-rdv', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.store', icon: "solar:shop-bold-duotone", key: 'Boutique', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE] },
    { labelKey: 'akwaba.sidebar.orders', icon: "solar:cart-large-bold-duotone", key: 'Commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.history_orders', icon: "solar:history-bold-duotone", key: 'Historique-commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.my_quotes', icon: "solar:chat-round-money-bold-duotone", key: 'Mes-devis', roles: [Role.CLIENT, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.my_deliveries', icon: "solar:map-point-wave-bold-duotone", key: 'Mes-livraisons', roles: [Role.CLIENT, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.my_logistics_services', icon: "solar:box-bold-duotone", key: 'Mes-services-logistiques', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.received_quotes', icon: "solar:chat-round-money-bold-duotone", key: 'Devis-recus', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.deliveries', icon: "solar:delivery-bold-duotone", key: 'Livraisons', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.driver_deliveries', icon: "solar:delivery-bold-duotone", key: 'Livraisons-chauffeur', roles: [Role.CHAUFFEUR] },
    { labelKey: 'akwaba.sidebar.my_fleet', icon: "solar:bus-bold-duotone", key: 'Ma-flotte', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { labelKey: 'akwaba.sidebar.pricing', icon: "solar:bill-list-bold-duotone", key: 'Tarifs', roles: [Role.ENTREPRISE, Role.ADMIN, Role.PRESTATAIRE, Role.CLIENT] },
    { labelKey: 'akwaba.sidebar.api_doc', icon: "solar:document-bold-duotone", key: 'Documentation-API', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE] },
    { labelKey: 'akwaba.sidebar.settings', icon: "solar:settings-bold-duotone", key: 'Paramètres', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR, Role.LIVREUR] },
    { labelKey: 'akwaba.sidebar.deliverer_space', icon: "solar:delivery-bold-duotone", key: 'Livreur-dashboard', roles: [Role.LIVREUR, Role.ADMIN] },
];

interface SidebarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    user: any;
    onLogout: () => void;
}

const LOGISTICS_KEYS: TabType[] = [
    'Services-logistiques', 'Mes-devis', 'Mes-livraisons',
    'Mes-services-logistiques', 'Devis-recus', 'Livraisons',
    'Livraisons-chauffeur', 'Ma-flotte', 'Livreur-dashboard',
];

// Groupes pour la vue mobile style Yango
const MOBILE_GROUPS = [
    { keys: ['Overview', 'Calendrier'] },
    { keys: ['Services', 'Annonces', 'Boutique', 'Commandes', 'Historique-commandes'] },
    { keys: ['Rendez-vous', 'Rendez-vous-annonces', 'Historique-rdv'] },
    { keys: ['Mes-devis', 'Mes-livraisons', 'Mes-services-logistiques', 'Devis-recus', 'Livraisons', 'Livraisons-chauffeur', 'Ma-flotte', 'Livreur-dashboard'] },
    { keys: ['Tarifs', 'Documentation-API', 'Paramètres'] },
];

export default function Sidebar({ activeTab, onTabChange, user, onLogout }: SidebarProps) {
    const { t } = useTranslation();
    const userRole = user?.role as Role;

    const baseMenu = TABS_CONFIG.filter(item => item.roles.includes(userRole));

    const menu = React.useMemo(() => {
        if (userRole === Role.CHAUFFEUR || userRole === Role.ENTREPRISE || userRole === Role.LIVREUR) {
            const logisticsItems = baseMenu.filter(item => LOGISTICS_KEYS.includes(item.key));
            const otherItems = baseMenu.filter(item => !LOGISTICS_KEYS.includes(item.key));
            return [...logisticsItems, ...otherItems];
        }
        return baseMenu;
    }, [baseMenu, userRole]);

    const [open, setOpen] = React.useState(false);
    const isLoading = !user;

    const roleLabel = userRole === Role.PRESTATAIRE ? t("akwaba.sidebar.roles.prestataire") :
        userRole === Role.ENTREPRISE ? t("akwaba.sidebar.roles.entreprise") :
        userRole === Role.CHAUFFEUR ? t("akwaba.sidebar.roles.chauffeur") :
        userRole === Role.LIVREUR ? t("akwaba.sidebar.roles.livreur") :
        t("akwaba.sidebar.roles.client");

    // ── Desktop menu item ──
    const renderMenuItem = (item: TabConfig) => {
        const isActive = activeTab === item.key;
        return (
            <button
                key={item.key}
                onClick={() => { onTabChange(item.key); setOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-300 ${
                    isActive
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white"
                }`}
            >
                <Icon icon={item.icon} width={18} />
                {t(item.labelKey as any)}
            </button>
        );
    };

    // ── Mobile row item style Yango ──
    const renderMobileRow = (item: TabConfig, isLast: boolean) => {
        const isActive = activeTab === item.key;
        return (
            <button
                key={item.key}
                onClick={() => { onTabChange(item.key); setOpen(false); }}
                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-muted/60 transition-colors"
            >
                {/* Icône dans un cercle */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-primary/15' : 'bg-muted'
                }`}>
                    <Icon
                        icon={item.icon}
                        width={20}
                        className={isActive ? 'text-primary' : 'text-foreground/70'}
                    />
                </div>

                {/* Label */}
                <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {t(item.labelKey as any)}
                    </p>
                </div>

                {/* Chevron */}
                <Icon
                    icon="solar:alt-arrow-right-bold"
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                />
            </button>
        );
    };

    const MenuSkeleton = ({ count }: { count: number }) => (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-muted/40 relative overflow-hidden border border-border/5">
                    <div className="w-6 h-6 rounded-lg bg-muted/80 shrink-0" />
                    <div className={`h-3 bg-muted/80 rounded-full ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-24' : 'w-28'}`} />
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            ))}
        </div>
    );

    const skeletonCount = userRole ? TABS_CONFIG.filter(item => item.roles.includes(userRole)).length : 6;

    return (
        <>
            <style jsx global>{`
                @keyframes shimmer { 100% { transform: translateX(100%); } }
            `}</style>

            {/* ═══════════════════════════════
                DESKTOP SIDEBAR (inchangé)
            ═══════════════════════════════ */}
            <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-6 sticky top-24">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-xl shrink-0 bg-muted/30">
                            {user && <Image src={user?.avatar || "/avatars/user2.png"} fill className="object-cover" alt="User Avatar" unoptimized />}
                        </div>
                        <div className="flex flex-col items-center mt-3 gap-1">
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-28 bg-muted/50 rounded-full animate-pulse" />
                                    <div className="h-3 w-20 bg-muted/40 rounded-full animate-pulse" />
                                </>
                            ) : (
                                <>
                                    <p className="font-bold text-center text-foreground dark:text-white">{user?.fullName || t("akwaba.sidebar.my_account")}</p>
                                    <p className="text-sm text-muted-foreground dark:text-zinc-400">{roleLabel}</p>
                                </>
                            )}
                        </div>
                        {user?.totalGain !== undefined && (
                            <div className="mt-4 bg-primary/10 px-4 py-2 rounded-xl text-center border border-primary/20">
                                <p className="text-primary font-black">{user.totalGain.toLocaleString()} FCFA</p>
                                <p className="text-[10px] text-primary/70 uppercase font-bold">{t("akwaba.sidebar.total_gains")}</p>
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        {isLoading ? <MenuSkeleton count={skeletonCount} /> : menu.map(renderMenuItem)}
                    </div>
                    <div className="mt-8 pt-6 border-t border-border">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300">
                            <Icon icon="solar:logout-bold-duotone" width={18} />
                            {t("akwaba.sidebar.logout")}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ═══════════════════════════════
                MOBILE — FAB trigger
            ═══════════════════════════════ */}
            <div className="md:hidden fixed bottom-20 left-6 z-40">
                <button
                    onClick={() => setOpen(true)}
                    className="rounded-full h-14 w-14 flex items-center justify-center bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                >
                    <Image
                        src="/service.svg"
                        alt="Menu"
                        width={32}
                        height={32}
                        className="brightness-0 invert dark:brightness-100 dark:invert-0"
                        style={{ height: 'auto' }}
                    />
                </button>
            </div>

            {/* ═══════════════════════════════
                MOBILE — Panneau plein écran style Yango
            ═══════════════════════════════ */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/30 md:hidden"
                        />

                        {/* Panel glissant depuis la droite */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed inset-0 z-[61] bg-background md:hidden overflow-y-auto flex flex-col"
                        >
                            {/* ── Header avec flèche retour ── */}
                            <div className="flex items-center px-4 pt-12 pb-4">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-90 transition-all"
                                >
                                    <Icon icon="solar:alt-arrow-left-bold" className="w-6 h-6 text-foreground" />
                                </button>
                            </div>

                            {/* ── Profil centré ── */}
                            <div className="flex flex-col items-center px-6 pb-6">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-border shadow-lg shrink-0">
                                    {user?.avatar ? (
                                        <Image src={user.avatar} fill className="object-cover" alt="Avatar" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Icon icon="solar:user-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 text-center">
                                    {isLoading ? (
                                        <>
                                            <div className="h-5 w-32 bg-muted rounded-full animate-pulse mx-auto" />
                                            <div className="h-3 w-24 bg-muted/60 rounded-full animate-pulse mx-auto mt-2" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span className="text-lg font-black text-foreground">
                                                    {user?.fullName || t("akwaba.sidebar.my_account")}
                                                </span>
                                                <Icon icon="solar:arrow-right-bold-duotone" className="w-4 h-4 text-primary" />
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {user?.indicatif ? `+${user.indicatif} ` : ''}{user?.phone || roleLabel}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Gains si disponibles */}
                                {user?.totalGain !== undefined && (
                                    <div className="mt-4 bg-primary/10 px-5 py-2.5 rounded-2xl text-center border border-primary/20">
                                        <p className="text-primary font-black text-base">{user.totalGain.toLocaleString()} FCFA</p>
                                        <p className="text-[10px] text-primary/70 uppercase font-bold">{t("akwaba.sidebar.total_gains")}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Menu groupé ── */}
                            <div className="flex-1 px-4 pb-8 space-y-4">
                                {isLoading ? (
                                    <MenuSkeleton count={skeletonCount} />
                                ) : (
                                    <>
                                        {MOBILE_GROUPS.map((group, gi) => {
                                            const groupItems = menu.filter(item => group.keys.includes(item.key));
                                            if (groupItems.length === 0) return null;
                                            return (
                                                <div key={gi} className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                                    {groupItems.map((item, idx) => (
                                                        <React.Fragment key={item.key}>
                                                            {renderMobileRow(item, idx === groupItems.length - 1)}
                                                            {idx < groupItems.length - 1 && (
                                                                <div className="h-px bg-border/40 mx-4" />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            );
                                        })}

                                        {/* ── Bouton déconnexion ── */}
                                        <div className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-red-50/60 dark:active:bg-red-900/20 transition-colors"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                                    <Icon icon="solar:logout-bold-duotone" width={20} className="text-red-500" />
                                                </div>
                                                <span className="flex-1 text-left text-sm font-semibold text-red-500">
                                                    {t("akwaba.sidebar.logout")}
                                                </span>
                                                <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-red-400/60 shrink-0" />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
