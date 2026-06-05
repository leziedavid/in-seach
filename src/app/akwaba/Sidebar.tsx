"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Role } from "@/types/interface";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
    // { labelKey: 'akwaba.sidebar.logistics_services', icon: "solar:delivery-bold-duotone", key: 'Services-logistiques', roles: [Role.CLIENT, Role.ADMIN] },
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
    'Services-logistiques',
    'Mes-devis',
    'Mes-livraisons',
    'Mes-services-logistiques',
    'Devis-recus',
    'Livraisons',
    'Livraisons-chauffeur',
    'Ma-flotte',
    'Livreur-dashboard',
];

export default function Sidebar({ activeTab, onTabChange, user, onLogout }: SidebarProps) {
    const { t } = useTranslation();
    const userRole = user?.role as Role;

    // Base menu filtered by role
    const baseMenu = TABS_CONFIG.filter(item => item.roles.includes(userRole));

    // Intelligent reordering: Logistics first for CHAUFFEUR and ENTREPRISE
    const menu = React.useMemo(() => {
        if (userRole === Role.CHAUFFEUR || userRole === Role.ENTREPRISE || userRole === Role.LIVREUR) {
            const logisticsItems = baseMenu.filter(item => LOGISTICS_KEYS.includes(item.key));
            const otherItems = baseMenu.filter(item => !LOGISTICS_KEYS.includes(item.key));
            return [...logisticsItems, ...otherItems];
        }
        return baseMenu;
    }, [baseMenu, userRole]);

    const [open, setOpen] = React.useState(false);

    const renderMenuItem = (item: TabConfig) => {
        const isActive = activeTab === item.key;
        return (
            <button key={item.key} onClick={() => { onTabChange(item.key); setOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-300 ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-muted text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white"}`} >
                <Icon icon={item.icon} width={18} />
                {t(item.labelKey as any)}
            </button>
        );
    };

    const MenuSkeleton = ({ count }: { count: number }) => (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-muted/40 relative overflow-hidden border border-border/5">
                    {/* Icon Placeholder */}
                    <div className="w-6 h-6 rounded-lg bg-muted/80 shrink-0" />

                    {/* Text Placeholder with variable width for realism */}
                    <div className={`h-3 bg-muted/80 rounded-full ${i % 3 === 0 ? 'w-32' : i % 3 === 1 ? 'w-24' : 'w-28'}`} />

                    {/* Premium Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
            ))}
        </div>
    );

    const isLoading = !user;
    const skeletonCount = userRole ? TABS_CONFIG.filter(item => item.roles.includes(userRole)).length : 6;

    return (
        <>
            <style jsx global>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-6 sticky top-24">
                    {/* Profil */}
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
                                    <p className="text-sm text-muted-foreground dark:text-zinc-400">
                                        {userRole === Role.PRESTATAIRE ? t("akwaba.sidebar.roles.prestataire") :
                                            userRole === Role.ENTREPRISE ? t("akwaba.sidebar.roles.entreprise") :
                                                userRole === Role.CHAUFFEUR ? t("akwaba.sidebar.roles.chauffeur") :
                                                    userRole === Role.LIVREUR ? t("akwaba.sidebar.roles.livreur") :
                                                        t("akwaba.sidebar.roles.client")}
                                    </p>
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

                    {/* Menu */}
                    <div className="space-y-2">
                        {isLoading ? <MenuSkeleton count={skeletonCount} /> : menu.map(renderMenuItem)}
                    </div>

                    {/* Logout */}
                    <div className="mt-8 pt-6 border-t border-border">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300">
                            <Icon icon="solar:logout-bold-duotone" width={18} />
                            {t("akwaba.sidebar.logout")}
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE FLOATING BUTTON & DRAWER */}
            <div className="md:hidden fixed bottom-20 left-6 z-40">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" className="rounded-full h-14 w-14 flex items-center justify-center bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all mb-2">
                            <Image src="/service.svg" alt="Menu" width={32} height={32} className="brightness-0 invert dark:brightness-100 dark:invert-0" style={{ height: 'auto' }} />
                        </Button>
                        {/* <Button size="icon" className="relative rounded-full h-14 w-14 bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all mb-2 overflow-hidden">
                            <Icon icon="solar:folder-with-files-bold-duotone" className="absolute inset-0 m-auto w-11 h-11 text-white/90 pointer-events-none" />
                        </Button> */}
                    </SheetTrigger>

                    <SheetContent side="bottom" className="rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <SheetHeader className="sr-only">
                            <SheetTitle>{t("akwaba.sidebar.my_account")}</SheetTitle>
                            <SheetDescription>Menu de navigation de votre compte</SheetDescription>
                        </SheetHeader>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center text-lg font-bold text-primary bg-primary/5">
                                {user?.fullName?.charAt(0) || "P"}
                            </div>
                            <p className="mt-2 font-semibold text-foreground dark:text-white">{t("akwaba.sidebar.my_account")}</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {isLoading ? <MenuSkeleton count={skeletonCount} /> : menu.map(renderMenuItem)}
                            </div>

                            <div className="pt-2 border-t border-border mt-2">
                                <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-xl text-sm text-red-500 bg-red-50/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold">
                                    <Icon icon="solar:logout-bold-duotone" width={18} />
                                    {t("akwaba.sidebar.logout")}
                                </button>
                            </div>
                        </div>
                    </SheetContent>

                </Sheet>
            </div>
        </>
    );
}
