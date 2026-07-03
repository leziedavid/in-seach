"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyDeliveryProfile, upsertDeliveryProfile, getDriverHistory, getDriverStats } from "@/api/api";
import { EasyDelivery, EasyDeliveryType, TypeEngin, HistoryDelivery, DriverStats } from "@/types/interface";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { useNotification } from "@/components/notifications/NotificationProvider";
import LiveTrackingView from "./LiveTrackingView";
import AccountBookingRowSkeleton from "@/components/bookings/ui/AccountBookingRowSkeleton";
import { EasyDeliveryStatus } from "@/types/interface";
import DeliverySettingsModal from "./DeliverySettings";
import Image from "next/image";
import { TablePagination } from "@/components/ui/table/Pagination";

const ENGIN_LABELS: Record<TypeEngin, string> = {
    VELO: "Vélo",
    VOITURE: "Voiture",
    MOTO: "Moto",
    CAMION: "Camion",
};

const ENGIN_ICONS: Record<TypeEngin, string> = {
    VELO: "solar:bicycle-bold-duotone",
    VOITURE: "solar:car-bold-duotone",
    MOTO: "solar:scooter-bold-duotone",
    CAMION: "solar:delivery-bold-duotone",
};

type ActiveTab = "en-cours" | "historique";

export default function EasyDeliveryPage() {

    const [activeTab, setActiveTab] = useState<ActiveTab>("en-cours");
    const [isEditing, setIsEditing] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState<HistoryDelivery | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false)

    const [activePage, setActivePage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const limit = 5;


    const { showNotification } = useNotification();
    const queryClient = useQueryClient();

    const { data: profileRes, isLoading: profileLoading } = useQuery({
        queryKey: ["easy-delivery-profile"],
        queryFn: getMyDeliveryProfile,
        retry: false,
    });

    const { data: activeRes, isLoading: activeLoading } = useQuery({
        queryKey: ["driver-history-active", activePage],
        queryFn: () => getDriverHistory({ page: activePage, limit, status: 'active' }),
        enabled: activeTab === "en-cours",
    });

    const { data: historyRes, isLoading: historyLoading } = useQuery({
        queryKey: ["driver-history-past", historyPage],
        queryFn: () => getDriverHistory({ page: historyPage, limit, status: 'history' }),
        enabled: activeTab === "historique",
    });

    const { data: statsRes } = useQuery({
        queryKey: ["driver-stats"],
        queryFn: getDriverStats,
    });

    const profile = profileRes?.data as EasyDelivery | undefined;
    const activeDeliveries = activeRes?.data?.data as HistoryDelivery[] | undefined || [];
    const pastDeliveries = historyRes?.data?.data as HistoryDelivery[] | undefined || [];
    const stats = statsRes?.data as DriverStats | undefined;

    const activeTotalPages = activeRes?.data?.totalPages || 0;
    const historyTotalPages = historyRes?.data?.totalPages || 0;


    const upsertMutation = useMutation({
        mutationFn: upsertDeliveryProfile,
        onSuccess: () => {
            showNotification("Profil livreur mis à jour", "success");
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["easy-delivery-profile"] });
        },
        onError: (err: any) => {
            showNotification(err?.message || "Erreur lors de la mise à jour", "error");
        },
    });

    const handleSave = (data: FormData) => {
        upsertMutation.mutate(data);
    };

    const getStatusBadge = (status: EasyDeliveryStatus) => {
        const map: Record<EasyDeliveryStatus, { label: string; className: string }> = {
            PENDING: { label: "En attente", className: "bg-yellow-500/10 text-yellow-600" },
            ACCEPTED: { label: "Acceptée", className: "bg-blue-500/10 text-blue-600" },
            PICKED_UP: { label: "Récupérée", className: "bg-orange-500/10 text-orange-600" },
            IN_TRANSIT: { label: "En transit", className: "bg-purple-500/10 text-purple-600" },
            ARRIVED: { label: "Arrivée", className: "bg-indigo-500/10 text-indigo-600" },
            DELIVERED: { label: "Livrée", className: "bg-green-500/10 text-green-600" },
            CANCELLED: { label: "Annulée", className: "bg-red-500/10 text-red-600" },
        };
        const s = map[status] || { label: status, className: "bg-muted text-muted-foreground" };
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.className}`}>
                {s.label}
            </span>
        );
    };

    if (selectedDelivery) {
        return (
            <LiveTrackingView delivery={selectedDelivery} onBack={() => setSelectedDelivery(null)} />
        );
    }

    return (
        <div className="w-full mx-auto py-4 space-y-6">
            <SectionHeader
                title="Mon Espace Livreur"
                subtitle="Gérez votre profil EasyDelivery, suivez vos livraisons en cours et consultez votre historique."
                className="mb-6"
            />
            {/* ── Profile Section (mirrors Store.tsx pattern) ── */}
            <div className="w-full max-w-4xl mx-auto mb-2 px-0 md:px-4 mb-6">
                <div className="group bg-card border-b p-6  flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden shrink-0">
                            {profile?.deliveryLogo ? (
                                <Image
                                    src={profile.deliveryLogo}
                                    alt={profile.companyName || "Service"}
                                    fill
                                    className="object-cover" />
                            ) : (
                                <Icon icon="solar:scooter-bold-duotone" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">EasyDelivery Pro</p>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate max-w-[150px] md:max-w-md">
                                {profile?.companyName || "Mon Service Livraison"}
                            </h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                    <Icon icon="solar:wallet-bold-duotone" className="w-3 h-3 text-primary" />
                                    {profile?.deliveryBasePrice ? `${profile.deliveryBasePrice.toLocaleString()} FCFA / livraison` : "Prix non défini"}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                    <Icon icon="solar:tag-bold-duotone" className="w-3 h-3 text-primary" />
                                    {profile?.type === EasyDeliveryType.ENTREPRISE ? "Entreprise" : "Particulier"}
                                </p>
                                {profile?.typeEngin && (
                                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Icon icon={ENGIN_ICONS[profile.typeEngin]} className="w-3 h-3 text-primary" />
                                        {ENGIN_LABELS[profile.typeEngin]}
                                    </p>
                                )}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${profile?.isActive ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                                    {profile?.isActive ? "Disponible" : "Indisponible"}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => { setIsEditing(true); setIsModalOpen(true) }} className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                        <Icon icon="solar:pen-bold-duotone" className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>
            {/* ── Stats Bar ── */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-0 md:px-4">
                    {[
                        { label: "Total", value: stats.total, icon: "solar:box-bold-duotone", color: "text-primary" },
                        { label: "Livrées", value: stats.delivered, icon: "solar:check-circle-bold-duotone", color: "text-green-600" },
                        { label: "En cours", value: stats.pending, icon: "solar:delivery-bold-duotone", color: "text-orange-500" },
                        { label: "Taux succès", value: `${stats.successRate}%`, icon: "solar:chart-bold-duotone", color: "text-blue-600" },
                    ].map((item) => (
                        <div key={item.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                            <div className="p-2 bg-muted rounded-xl">
                                <Icon icon={item.icon} className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <div>
                                <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{item.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* ── Tabs ── */}
            <div className="flex bg-muted/50 p-1 rounded-2xl w-full max-w-lg px-0 md:px-4">
                {([
                    { key: "en-cours", label: "En cours", icon: "solar:delivery-bold-duotone" },
                    { key: "historique", label: "Historique", icon: "solar:history-bold-duotone" },
                ] as { key: ActiveTab; label: string; icon: string }[]).map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.key ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                        <Icon icon={tab.icon} width={16} />
                        {tab.label}
                    </button>
                ))}
            </div>
            {/* ── Tab Content ── */}
            {activeTab === "en-cours" && (
                <div className="space-y-3">
                    {historyLoading && Array.from({ length: 3 }).map((_, i) => <AccountBookingRowSkeleton key={i} />)}
                    {!historyLoading && activeDeliveries.length === 0 && (
                        <div className="py-16 text-center flex flex-col items-center gap-3 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <Icon icon="solar:delivery-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-black">Aucune livraison en cours</p>
                            <p className="text-xs text-muted-foreground">Les livraisons assignées apparaîtront ici</p>
                        </div>
                    )}
                    {activeDeliveries.map((delivery) => (
                        <DeliveryCard
                            key={delivery.id}
                            delivery={delivery}
                            getStatusBadge={getStatusBadge}
                            onTrack={() => setSelectedDelivery(delivery)}
                        />
                    ))}

                    {/* PAGINATION EN COURS */}
                    {activeTotalPages > 1 && (
                        <div className="w-full overflow-x-auto mt-6">
                            <TablePagination page={activePage} limit={limit} total={activeRes?.data?.total || 0} totalPages={activeTotalPages} onPageChange={setActivePage} />
                        </div>
                    )}
                </div>
            )}
            {activeTab === "historique" && (
                <div className="space-y-3">
                    {historyLoading && Array.from({ length: 4 }).map((_, i) => <AccountBookingRowSkeleton key={i} />)}
                    {!historyLoading && pastDeliveries.length === 0 && (
                        <div className="py-16 text-center flex flex-col items-center gap-3 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                            <div className="p-4 bg-muted/50 rounded-full">
                                <Icon icon="solar:history-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-black">Aucune livraison dans l'historique</p>
                        </div>
                    )}
                    {pastDeliveries.map((delivery) => (
                        <DeliveryCard
                            key={delivery.id}
                            delivery={delivery}
                            getStatusBadge={getStatusBadge}
                            onTrack={() => setSelectedDelivery(delivery)}
                        />
                    ))}

                    {/* PAGINATION HISTORIQUE */}
                    {historyTotalPages > 1 && (
                        <div className="w-full overflow-x-auto mt-6">
                            <TablePagination page={historyPage} limit={limit} total={historyRes?.data?.total || 0} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
                        </div>
                    )}
                </div>
            )}
            <DeliverySettingsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={profile}
                onSave={handleSave}
                isLoading={upsertMutation.isPending}
            />
        </div>
    );
}

function DeliveryCard({ delivery, getStatusBadge, onTrack, }: {
    delivery: HistoryDelivery;
    getStatusBadge: (s: EasyDeliveryStatus) => React.ReactNode;
    onTrack: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden relative">
                    {delivery.easyDelivery?.deliveryLogo ? (
                        <Image
                            src={delivery.easyDelivery.deliveryLogo}
                            alt="Logo"
                            fill
                            className="object-cover" />
                    ) : (
                        <Icon icon="solar:scooter-bold-duotone" className="w-6 h-6 text-primary" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                            #{delivery.id.slice(0, 8).toUpperCase()}
                        </span>
                        {getStatusBadge(delivery.status)}
                    </div>
                    <div className="flex items-center gap-2">
                        {delivery.recipientName && (
                            <p className="text-sm font-black text-card-foreground truncate max-w-[140px]">
                                {delivery.recipientName}
                            </p>
                        )}
                        {delivery.deliveryPrice && (
                            <>
                                <span className="text-muted-foreground">•</span>
                                <p className="text-xs text-primary font-bold">{delivery.deliveryPrice.toLocaleString()} FCFA</p>
                            </>
                        )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(delivery.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                </div>
            </div>
            <button onClick={onTrack} className="p-2 md:p-3 bg-muted text-card-foreground rounded-xl transition hover:bg-primary hover:text-white active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm">
                <Icon icon="solar:map-point-wave-bold-duotone" className="w-5 h-5" />
                <span className="hidden sm:inline">Suivre</span>
            </button>
        </div>
    );
}
