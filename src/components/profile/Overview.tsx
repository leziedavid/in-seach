"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOverview } from "@/api/api";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Overview() {
    const { data: response, isLoading } = useQuery({
        queryKey: ["overview"],
        queryFn: getOverview,
    });

    const stats = response?.data;

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 md:h-32 w-full rounded-2xl md:rounded-[2rem]" />
                ))}
            </div>
        );
    }

    const renderStatCard = (title: string, value: string | number, icon: string, color: string) => {
        const colorVariants: any = {
            primary: "text-primary bg-primary/10",
            "green-500": "text-green-500 bg-green-500/10",
            "blue-500": "text-blue-500 bg-blue-500/10",
            "orange-500": "text-orange-500 bg-orange-500/10",
            "indigo-500": "text-indigo-500 bg-indigo-500/10",
        };

        const variant = colorVariants[color] || colorVariants.primary;
        const [textColor, bgIcon] = variant.split(" ");

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                className="group"
            >
                <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 transition-all hover:border-primary/30 shadow-sm">
                    <div className={`p-2.5 rounded-xl ${bgIcon} ${textColor} transition-transform duration-500`}>
                        <Icon icon={icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className={`text-lg font-black ${textColor} truncate`}>{value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold truncate">{title}</p>
                    </div>
                </div>
            </motion.div>
        );
    };

    const isAdmin = stats?.isAdmin;
    const role = stats?.role;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section */}
            <div className="flex items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight">Tableau de bord</h2>
                    <p className="text-sm text-muted-foreground">Résumé global de vos activités.</p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-muted/50 p-1 rounded-2xl border border-border/50">
                    <div className="px-4 py-2 bg-background rounded-xl shadow-sm border border-border/50 text-[10px] font-bold uppercase tracking-widest text-primary">Aujourd'hui</div>
                </div>
            </div>

            {/* Admin Stats */}
            {isAdmin && stats?.admin && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-primary rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">Administration Globale</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {renderStatCard("Utilisateurs", stats.admin.totalUsers || 0, "solar:users-group-rounded-bold-duotone", "primary")}
                        {renderStatCard("Revenu Global", `${(stats.admin.totalRevenue || 0).toLocaleString()} FCFA`, "solar:wad-of-money-bold-duotone", "green-500")}
                        {renderStatCard("Commandes", stats.admin.totalOrders || 0, "solar:cart-large-bold-duotone", "orange-500")}
                        {renderStatCard("Réservations", stats.admin.totalBookings || 0, "solar:clipboard-list-bold-duotone", "blue-500")}
                    </div>
                </div>
            )}

            {/* Prestataire Stats */}
            {(role === "PRESTATAIRE" || isAdmin) && stats?.prestataire && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-blue-500 rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">Espace Prestataire</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {renderStatCard("Gains RDV", `${(stats.prestataire.totalEarnings || 0).toLocaleString()} FCFA`, "solar:dollar-bold-duotone", "green-500")}
                        {renderStatCard("Ventes Boutique", `${(stats.prestataire.boutiqueRevenue || 0).toLocaleString()} FCFA`, "solar:wad-of-money-bold-duotone", "primary")}
                        {renderStatCard("Services", stats.prestataire.myServices || 0, "solar:box-bold-duotone", "blue-500")}
                        {renderStatCard("Annonces", stats.prestataire.myAnnonces || 0, "solar:eye-bold-duotone", "indigo-500")}
                        {renderStatCard("Produits", stats.prestataire.myProducts || 0, "solar:shop-bold-duotone", "orange-500")}
                        {renderStatCard("RDV Reçus", stats.prestataire.receivedBookings || 0, "solar:user-speak-bold-duotone", "primary")}
                        {renderStatCard("Commandes", stats.prestataire.receivedOrders || 0, "solar:cart-large-bold-duotone", "green-500")}
                    </div>
                </div>
            )}

            {/* Client Stats */}
            {(role === "CLIENT" || isAdmin) && stats?.client && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-orange-500 rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">Espace Client</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        {(stats.client.boutiqueRevenue || 0) > 0 && renderStatCard("Ventes Boutique", `${(stats.client.boutiqueRevenue || 0).toLocaleString()} FCFA`, "solar:wad-of-money-bold-duotone", "green-500")}
                        {renderStatCard("Mes RDV", stats.client.myBookings || 0, "solar:calendar-date-bold-duotone", "orange-500")}
                        {renderStatCard("Mes Commandes", stats.client.myOrders || 0, "solar:bag-bold-duotone", "primary")}
                        {renderStatCard("Mes Devis", stats.client.myQuotes || 0, "solar:chat-round-money-bold-duotone", "indigo-500")}
                        {renderStatCard("Mes Livraisons", stats.client.myDeliveries || 0, "solar:delivery-bold-duotone", "green-500")}
                    </div>
                </div>
            )}

            {/* Logistics/Fleet Stats */}
            {(role === "ENTREPRISE" || isAdmin) && stats?.entreprise && (
                <div className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">Logistique & Flotte</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                        {renderStatCard("Services Log.", stats.entreprise.myLogisticServices || 0, "solar:delivery-bold-duotone", "indigo-500")}
                        {renderStatCard("Ma Flotte", stats.entreprise.floteCount || 0, "solar:bus-bold-duotone", "primary")}
                        {renderStatCard("Devis Reçus", stats.entreprise.receivedQuotes || 0, "solar:chat-round-money-bold-duotone", "blue-500")}
                        {renderStatCard("En Attente", stats.entreprise.pendingQuotes || 0, "solar:clock-circle-bold-duotone", "orange-500")}
                        {renderStatCard("Livraisons", stats.entreprise.activeDeliveries || 0, "solar:map-point-wave-bold-duotone", "green-500")}
                    </div>
                </div>
            )}

            {/* Recent Activity (Admin) */}
            {isAdmin && stats?.admin?.recentBookings && (
                <div className="space-y-6 mt-12">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-zinc-500 rounded-full" />
                        <h3 className="font-bold text-base tracking-tight">Dernières Activités</h3>
                    </div>
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-xl">
                        <div className="p-4 md:p-6 border-b border-border/50 bg-muted/30">
                            <h4 className="font-bold text-sm md:text-base">Réservations Récentes</h4>
                        </div>
                        <div className="divide-y divide-border/50">
                            {stats.admin.recentBookings.map((booking: any) => (
                                <div key={booking.id} className="p-3 md:p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Icon icon="solar:calendar-add-bold-duotone" className="w-4 h-4 md:w-5 md:h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{booking.client?.fullName || "Client Inconnu"}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{booking.code}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-primary">{booking.price?.toLocaleString() || 0} FCFA</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                                            booking.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                                            booking.status === 'PENDING' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
