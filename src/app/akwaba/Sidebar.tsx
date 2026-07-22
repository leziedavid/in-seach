"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Role, AuthorizationNode } from "@/types/interface";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/utils/langue/hooks";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useAuthStore } from "@/store/authStore";

// Numéro WhatsApp de l'assistance Djamko (indicatif +225 conservé avec le 0 initial,
// conforme au plan de numérotation ivoirien en vigueur)
const ADMIN_WHATSAPP_NUMBER = "2250153686819";

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
    | "Livreur-dashboard"
    | "Mes-lives"
    | "Retours-SAV"
    | "Recharge-gaz"
    | "Mes-bouteilles-gaz"
    | "Mon-Garage"
    | "Historique";

interface SidebarProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    user: any;
    onLogout: () => void;
}

// Le menu est piloté par les Authorization dynamiques (RBAC, voir /authorizations/my),
// filtrées côté serveur selon les policies de l'utilisateur — plus aucun rôle codé en dur ici.
// Seules les entrées "AKWABA_*" (voir backend/prisma/seed-rbac.ts) concernent ce menu ; le
// tab historique (TabType) reste piloté par page.tsx via le paramètre `tab` de frontendRoute.
const AKWABA_PREFIX = 'AKWABA_';

function extractTabFromRoute(frontendRoute: string | null): TabType | null {
    if (!frontendRoute) return null;
    const qIndex = frontendRoute.indexOf('?');
    if (qIndex === -1) return null;
    const tab = new URLSearchParams(frontendRoute.slice(qIndex + 1)).get('tab');
    return (tab as TabType) || null;
}

export default function Sidebar({ activeTab, onTabChange, user, onLogout }: SidebarProps) {

    const { t } = useTranslation();
    const { addNotification } = useNotification();
    const { permission, subscribe, unsubscribe, isNotificationsEnabled, isPushSupported, lastError } = useNotifications();
    const userRole = user?.role as Role;

    const authorizations = useAuthStore(s => s.authorizations);
    const hydrated = useAuthStore(s => s.hydrated);
    const hydrate = useAuthStore(s => s.hydrate);

    React.useEffect(() => {
        if (user) hydrate();
    }, [user, hydrate]);

    // Menu Akwaba = les Authorization dynamiques préfixées AKWABA_ que le backend a déjà
    // filtrées selon les policies de l'utilisateur (voir GET /authorizations/my), regroupées
    // par catégorie (remplace les anciens groupes MOBILE_GROUPS codés en dur).
    const menu = React.useMemo(
        () => authorizations.filter(a => a.code.startsWith(AKWABA_PREFIX)),
        [authorizations],
    );

    const menuGroups = React.useMemo(() => {
        const byCategory = new Map<string, AuthorizationNode[]>();
        for (const item of menu) {
            const cat = item.category || 'Autres';
            if (!byCategory.has(cat)) byCategory.set(cat, []);
            byCategory.get(cat)!.push(item);
        }
        return Array.from(byCategory.values());
    }, [menu]);

    const [open, setOpen] = React.useState(false);
    const isLoading = !user || !hydrated;

    const roleLabel = userRole === Role.PRESTATAIRE ? t("akwaba.sidebar.roles.prestataire") :
        userRole === Role.ENTREPRISE ? t("akwaba.sidebar.roles.entreprise") :
            userRole === Role.CHAUFFEUR ? t("akwaba.sidebar.roles.chauffeur") :
                userRole === Role.LIVREUR ? t("akwaba.sidebar.roles.livreur") :
                    userRole === Role.GAZIER ? t("akwaba.sidebar.roles.gazier") :
                        userRole === Role.GARAGISTE_VENTE_PIECE_AUTO ? t("akwaba.sidebar.roles.garagiste") : t("akwaba.sidebar.roles.client");

    // ── Assistance — ouvre WhatsApp avec un message prédéfini vers l'admin ──
    const handleOpenAssistance = () => {
        const message = encodeURIComponent("Bonjour, j'ai besoin d'assistance concernant mon compte Djamko.");
        window.open(`https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
        setOpen(false);
    };

    // ── Notifications — appelle le workflow existant (useNotifications), aucune nouvelle logique ──
    const handleToggleNotifications = async () => {
        if (!isPushSupported) {
            addNotification(t("akwaba.settings.notifications_not_supported"), "error");
            return;
        }
        if (permission === 'denied') {
            addNotification(t("akwaba.settings.notifications_blocked"), "error");
            return;
        }
        if (isNotificationsEnabled) {
            const success = await unsubscribe();
            addNotification(success ? t("akwaba.settings.notifications_disabled_success") : (lastError || t("akwaba.settings.notifications_error")), success ? "success" : "error");
        } else {
            const success = await subscribe();
            addNotification(success ? t("akwaba.settings.notifications_enabled_success") : (lastError || t("akwaba.settings.notifications_error")), success ? "success" : "error");
        }
    };

    // ── Ligne de menu style Yango — variant "desktop" = icônes légèrement réduites pour ne pas déborder ──
    const renderMobileRow = (item: AuthorizationNode, isLast: boolean, variant: 'mobile' | 'desktop' = 'mobile') => {
        const tab = extractTabFromRoute(item.frontendRoute);
        const isActive = !!tab && activeTab === tab;
        const circleSize = variant === 'desktop' ? 'w-8 h-8' : 'w-9 h-9';
        const iconWidth = variant === 'desktop' ? 16 : 19;
        return (
            <button key={item.code} onClick={() => { if (tab) onTabChange(tab); setOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-muted/60 transition-colors">
                {/* Icône dans un cercle */}
                <div className={`${circleSize} rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/15' : 'bg-muted'}`}> <Icon icon={item.icon || 'solar:widget-5-bold-duotone'} width={iconWidth} className={isActive ? 'text-primary' : 'text-foreground/70'} />
                </div>

                {/* Label */}
                <div className="flex-1 text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {item.name}
                    </p>
                </div>

                {/* Chevron */}
                <Icon icon="solar:alt-arrow-right-bold" className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
            </button>
        );
    };

    // ── Action rapide circulaire style app mobile native (Historique / Assistance / Paramètres) ──
    const renderQuickAction = (icon: string, label: string, onClick: () => void, key: string, variant: 'mobile' | 'desktop' = 'mobile') => {
        const circleSize = variant === 'desktop' ? 'w-11 h-11' : 'w-14 h-14';
        const iconWidth = variant === 'desktop' ? 19 : 24;
        return (
            <button key={key} onClick={onClick} className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
                <div className={`${circleSize} rounded-full bg-muted flex items-center justify-center`}>
                    <Icon icon={icon} width={iconWidth} className="text-foreground/80" />
                </div>
                <span className={`font-semibold text-foreground text-center ${variant === 'desktop' ? 'text-[10px]' : 'text-xs'}`}>{label}</span>
            </button>
        );
    };

    // ── Carte "Activer les notifications" — icône verte si activées, rouge sinon ──
    const renderNotificationRow = (variant: 'mobile' | 'desktop' = 'mobile') => {
        const circleSize = variant === 'desktop' ? 'w-8 h-8' : 'w-9 h-9';
        const iconWidth = variant === 'desktop' ? 16 : 19;
        return (
            <div className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                <button onClick={handleToggleNotifications} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-muted/60 transition-colors">
                    <div className={`${circleSize} rounded-full flex items-center justify-center shrink-0 ${isNotificationsEnabled ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                        <Icon icon="solar:bell-bold-duotone" width={iconWidth} className={isNotificationsEnabled ? 'text-green-500' : 'text-red-500'} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground">
                            {isNotificationsEnabled ? t("akwaba.sidebar.notifications_active") : t("akwaba.sidebar.enable_notifications")}
                        </p>
                    </div>
                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 shrink-0 text-muted-foreground" />
                </button>
            </div>
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

    const skeletonCount = menu.length || 6;

    return (
        <>
            <style jsx global>{`  @keyframes shimmer { 100% { transform: translateX(100%); } } `}</style>
            {/* ═══════════════════════════════
                DESKTOP SIDEBAR — même UI que mobile
            ═══════════════════════════════ */}
            <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-3 sticky top-24 overflow-y-auto max-h-[calc(100vh-7rem)] scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                    {/* Profil */}
                    <div className="flex flex-col items-center px-2 pb-3">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border shadow-lg shrink-0">
                            {user?.avatar ? (
                                <Image src={user.avatar} fill className="object-cover" alt="Avatar" unoptimized />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Icon icon="solar:user-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="mt-2 text-center">
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-28 bg-muted rounded-full animate-pulse mx-auto" />
                                    <div className="h-3 w-20 bg-muted/60 rounded-full animate-pulse mx-auto mt-1.5" />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-sm font-black text-foreground">
                                            {user?.fullName || t("akwaba.sidebar.my_account")}
                                        </span>
                                        <Icon icon="solar:arrow-right-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {user?.indicatif ? `${user.indicatif} ` : ''}{user?.phone || roleLabel}
                                    </p>
                                </>
                            )}
                        </div>
                        {user?.totalGain !== undefined && (
                            <div className="mt-2.5 bg-primary/10 px-4 py-1.5 rounded-xl text-center border border-primary/20">
                                <p className="text-primary font-black text-sm">{user.totalGain.toLocaleString()} FCFA</p>
                                <p className="text-[9px] text-primary/70 uppercase font-bold">{t("akwaba.sidebar.total_gains")}</p>
                            </div>
                        )}
                    </div>

                    {/* Actions rapides */}
                    {!isLoading && (
                        <div className="flex items-center justify-center gap-6 px-2 pb-4">
                            {menu.some(i => i.code === 'AKWABA_HISTORIQUE') && renderQuickAction("solar:clock-circle-bold-duotone", t("akwaba.sidebar.history"), () => onTabChange('Historique'), "history-desktop", 'desktop'
                            )}
                            {renderQuickAction("solar:headphones-round-bold-duotone", t("akwaba.sidebar.assistance"), handleOpenAssistance, "assistance-desktop", 'desktop'
                            )}
                            {menu.some(i => i.code === 'AKWABA_PARAMETRES') && renderQuickAction("solar:settings-bold-duotone", t("akwaba.sidebar.settings"), () => onTabChange('Paramètres'), "settings-desktop", 'desktop'
                            )}
                        </div>
                    )}

                    {/* Notifications */}
                    {!isLoading && (
                        <div className="pb-3">
                            {renderNotificationRow('desktop')}
                        </div>
                    )}

                    {/* Menu groupé — même style que mobile */}
                    <div className="space-y-2 pb-2">
                        {isLoading ? (
                            <MenuSkeleton count={skeletonCount} />
                        ) : (
                            <>
                                {menuGroups.map((groupItems, gi) => {
                                    return (
                                        <div key={gi} className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                            {groupItems.map((item, idx) => (
                                                <React.Fragment key={item.code}>
                                                    {renderMobileRow(item, idx === groupItems.length - 1, 'desktop')}
                                                    {idx < groupItems.length - 1 && (
                                                        <div className="h-px bg-border/40 mx-4" />
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    );
                                })}

                                {/* Déconnexion */}
                                <div className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-red-50/60 dark:active:bg-red-900/20 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0"><Icon icon="solar:logout-bold-duotone" width={16} className="text-red-500" />
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
                </div>
            </aside>
            {/* ═══════════════════════════════
                MOBILE — FAB trigger
            ═══════════════════════════════ */}
            <div className="md:hidden fixed bottom-20 left-6 z-40 mb-2">
                <button onClick={() => setOpen(true)} className="rounded-full h-14 w-14 flex items-center justify-center bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all">
                    <Icon icon="solar:widget-5-bold-duotone" width={26} className="text-white" />
                    {/* <Image src="/service.svg" alt="Menu" width={32} height={32} className="brightness-0 invert dark:brightness-100 dark:invert-0" style={{ height: 'auto' }} /> */}
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
                            className="fixed inset-0 z-[61] bg-background md:hidden overflow-y-auto flex flex-col scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {/* ── Header avec flèche retour ── */}
                            {/* pt-16 (au lieu de pt-10) : évite le chevauchement avec la rangée d'icônes
                                du Header mobile (fixed top-6, z-[100], au-dessus de ce panneau) */}
                            <div className="flex items-center px-4 pt-16 pb-2">
                                <button onClick={() => setOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-90 transition-all">
                                    <Icon icon="solar:alt-arrow-left-bold" className="w-6 h-6 text-foreground" />
                                </button>
                            </div>

                            {/* ── Profil centré ── */}
                            <div className="flex flex-col items-center px-6 pb-3">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border shadow-lg shrink-0">
                                    {user?.avatar ? (
                                        <Image src={user.avatar} fill className="object-cover" alt="Avatar" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Icon icon="solar:user-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-center">
                                    {isLoading ? (
                                        <>
                                            <div className="h-4 w-28 bg-muted rounded-full animate-pulse mx-auto" />
                                            <div className="h-3 w-20 bg-muted/60 rounded-full animate-pulse mx-auto mt-1.5" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center gap-1">
                                                <span className="text-sm font-black text-foreground">
                                                    {user?.fullName || t("akwaba.sidebar.my_account")}
                                                </span>
                                                <Icon icon="solar:arrow-right-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {user?.indicatif ? `${user.indicatif} ` : ''}{user?.phone || roleLabel}
                                            </p>
                                        </>
                                    )}
                                </div>

                                {user?.totalGain !== undefined && (
                                    <div className="mt-2.5 bg-primary/10 px-4 py-1.5 rounded-xl text-center border border-primary/20">
                                        <p className="text-primary font-black text-sm">{user.totalGain.toLocaleString()} FCFA</p>
                                        <p className="text-[9px] text-primary/70 uppercase font-bold">{t("akwaba.sidebar.total_gains")}</p>
                                    </div>
                                )}
                            </div>

                            {/* ── Actions rapides style app mobile native ── */}
                            {!isLoading && (
                                <div className="flex items-center justify-center gap-8 px-6 pb-5">
                                    {menu.some(i => i.code === 'AKWABA_HISTORIQUE') && renderQuickAction("solar:clock-circle-bold-duotone", t("akwaba.sidebar.history"), () => { onTabChange('Historique'); setOpen(false); }, "history"
                                    )}
                                    {renderQuickAction("solar:headphones-round-bold-duotone", t("akwaba.sidebar.assistance"), handleOpenAssistance, "assistance"
                                    )}
                                    {menu.some(i => i.code === 'AKWABA_PARAMETRES') && renderQuickAction("solar:settings-bold-duotone", t("akwaba.sidebar.settings"), () => { onTabChange('Paramètres'); setOpen(false); }, "settings"
                                    )}
                                </div>
                            )}

                            {/* ── Notifications ── */}
                            {!isLoading && (
                                <div className="px-4 pb-4">
                                    {renderNotificationRow()}
                                </div>
                            )}

                            {/* ── Menu groupé ── */}
                            <div className="flex-1 px-4 pb-4 space-y-2">
                                {isLoading ? (
                                    <MenuSkeleton count={skeletonCount} />
                                ) : (
                                    <>
                                        {menuGroups.map((groupItems, gi) => {
                                            return (
                                                <div key={gi} className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                                    {groupItems.map((item, idx) => (
                                                        <React.Fragment key={item.code}>
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
                                            <button onClick={onLogout} className="w-full flex items-center gap-4 px-4 py-3.5 active:bg-red-50/60 dark:active:bg-red-900/20 transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                                                    <Icon icon="solar:logout-bold-duotone" width={20} className="text-red-500" />
                                                </div>
                                                <span className="flex-1 text-left text-sm font-semibold text-red-500"> {t("akwaba.sidebar.logout")}</span>
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
