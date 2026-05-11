"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Role } from "@/types/interface";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export type TabType =
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
    label: string;
    icon: string;
    roles: Role[];
}

export const TABS_CONFIG: TabConfig[] = [
    { label: 'Calendrier', icon: "solar:calendar-date-bold-duotone", key: 'Calendrier', roles: [Role.PRESTATAIRE, Role.ADMIN, Role.CLIENT] },
    { label: 'Mes Services', icon: "solar:box-bold-duotone", key: 'Services', roles: [Role.PRESTATAIRE, Role.ADMIN] },
    { label: 'Mes Annonces', icon: "solar:eye-bold-duotone", key: 'Annonces', roles: [Role.PRESTATAIRE, Role.ADMIN] },
    { label: 'RDV Services', icon: "solar:clipboard-list-bold-duotone", key: 'Rendez-vous', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { label: 'RDV Annonces', icon: "solar:clipboard-check-bold-duotone", key: 'Rendez-vous-annonces', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { label: 'Historique RDV', icon: "solar:history-bold-duotone", key: 'Historique-rdv', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { label: 'Boutique', icon: "solar:shop-bold-duotone", key: 'Boutique', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE] },
    { label: 'Commandes', icon: "solar:cart-large-bold-duotone", key: 'Commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { label: 'Historique-commandes', icon: "solar:history-bold-duotone", key: 'Historique-commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE, Role.ENTREPRISE, Role.CHAUFFEUR] },
    { label: 'Services logistiques', icon: "solar:delivery-bold-duotone", key: 'Services-logistiques', roles: [Role.CLIENT, Role.ADMIN] },
    { label: 'Mes devis', icon: "solar:chat-round-money-bold-duotone", key: 'Mes-devis', roles: [Role.CLIENT, Role.ADMIN] },
    { label: 'Mes livraisons', icon: "solar:map-point-wave-bold-duotone", key: 'Mes-livraisons', roles: [Role.CLIENT, Role.ADMIN] },
    { label: 'Mes services', icon: "solar:box-bold-duotone", key: 'Mes-services-logistiques', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { label: 'Devis reçus', icon: "solar:chat-round-money-bold-duotone", key: 'Devis-recus', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { label: 'Livraisons', icon: "solar:delivery-bold-duotone", key: 'Livraisons', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { label: 'Mes livraisons', icon: "solar:delivery-bold-duotone", key: 'Livraisons-chauffeur', roles: [Role.CHAUFFEUR] },
    { label: 'Ma flotte', icon: "solar:bus-bold-duotone", key: 'Ma-flotte', roles: [Role.ENTREPRISE, Role.ADMIN] },
    { label: 'Tarifs', icon: "solar:bill-list-bold-duotone", key: 'Tarifs', roles: [Role.ENTREPRISE, Role.ADMIN, Role.PRESTATAIRE, Role.CLIENT] },
    { label: 'Documentation API', icon: "solar:document-bold-duotone", key: 'Documentation-API', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE] },
    { label: 'Paramètres', icon: "solar:settings-bold-duotone", key: 'Paramètres', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN, Role.ENTREPRISE, Role.CHAUFFEUR, Role.LIVREUR] },
    { label: 'Mon Espace Livreur', icon: "solar:delivery-bold-duotone", key: 'Livreur-dashboard', roles: [Role.LIVREUR, Role.ADMIN] },
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
            <button key={item.key} onClick={() => { onTabChange(item.key); setOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-300 ${isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" : "hover:bg-muted text-muted-foreground hover:text-foreground"}`} >
                <Icon icon={item.icon} width={18} />
                {item.label}
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
                                    <p className="font-bold text-center text-foreground">{user?.fullName || "Mon compte"}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {userRole === Role.PRESTATAIRE ? "Prestataire" : userRole === Role.ENTREPRISE ? "Entreprise Logistique" : userRole === Role.CHAUFFEUR ? "Chauffeur" : userRole === Role.LIVREUR ? "Livreur EasyDelivery" : "Client"}
                                    </p>
                                </>
                            )}
                        </div>

                        {user?.totalGain !== undefined && (
                            <div className="mt-4 bg-primary/10 px-4 py-2 rounded-xl text-center border border-primary/20">
                                <p className="text-primary font-black">{user.totalGain.toLocaleString()} FCFA</p>
                                <p className="text-[10px] text-primary/70 uppercase font-bold">Total Gains</p>
                            </div>
                        )}
                    </div>

                    {/* Menu */}
                    <div className="space-y-2">
                        {isLoading ? <MenuSkeleton count={skeletonCount} /> : menu.map(renderMenuItem)}
                    </div>

                    {/* Logout */}
                    <div className="mt-8 pt-6 border-t border-border">
                        <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all duration-300">
                            <Icon icon="solar:logout-bold-duotone" width={18} />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE FLOATING BUTTON & DRAWER */}
            <div className="md:hidden fixed bottom-20 left-6 z-40">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" className="rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all">
                            <Image src="/service.svg" alt="Menu" width={32} height={32} className="brightness-0 invert dark:brightness-100 dark:invert-0" style={{ height: 'auto' }} />
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Mon Espace</SheetTitle>
                            <SheetDescription>Menu de navigation de votre compte</SheetDescription>
                        </SheetHeader>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center text-lg font-bold text-primary bg-primary/5">
                                {user?.fullName?.charAt(0) || "P"}
                            </div>
                            <p className="mt-2 font-semibold text-foreground">Mon compte</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {isLoading ? <MenuSkeleton count={skeletonCount} /> : menu.map(renderMenuItem)}
                            </div>

                            <div className="pt-2 border-t border-border mt-2">
                                <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-xl text-sm text-red-500 bg-red-50/50 hover:bg-red-50 transition-all font-bold">
                                    <Icon icon="solar:logout-bold-duotone" width={18} />
                                    Déconnexion
                                </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
