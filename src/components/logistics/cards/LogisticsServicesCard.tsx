"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { LogisticService, TransportType } from "@/types/interface";
import { Switch } from "@/components/ui/switch";
import LogisticsServiceDetailModal from "@/components/logistics/modals/LogisticsServiceDetailModal";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { ViewMode } from "@/components/shared/ViewToggle";
import LiveButtonInline from "@/components/lives/LiveButtonInline";

interface LogisticsServicesCardProps {
    service: LogisticService;
    isOwner?: boolean;
    onEdit?: (id: string, formData: FormData) => void;
    onDelete?: (id: string) => void;
    onToggleStatus?: (id: string, value: boolean) => void;
    onRequestQuote?: (service: LogisticService) => void;
    onCreateLive?: (service: LogisticService) => void;
    isUpdating?: boolean;
    viewMode?: ViewMode;
}

const TRANSPORT_TYPE_LABELS: Record<TransportType, { label: string; icon: string; color: string }> = {
    [TransportType.MARITIME]: { label: "Maritime", icon: "solar:ship-bold-duotone", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    [TransportType.AERIEN]: { label: "Aérien", icon: "solar:plain-bold-duotone", color: "text-sky-600 bg-sky-50 dark:bg-sky-500/10" },
    [TransportType.HORS_GABARIT]: { label: "Hors Gabarit", icon: "solar:truck-bold-duotone", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
    [TransportType.SANTE]: { label: "Santé", icon: "solar:hospital-bold-duotone", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    [TransportType.LOGISTIQUE_STOCKAGE]: { label: "Stockage", icon: "solar:box-bold-duotone", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    [TransportType.DOUANE]: { label: "Douane", icon: "solar:shield-user-bold-duotone", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" },
};

export default function LogisticsServicesCard({ service, isOwner = false, onEdit, onDelete, onToggleStatus, onRequestQuote, onCreateLive, isUpdating = false, viewMode = "grid" }: LogisticsServicesCardProps) {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const transportInfo = TRANSPORT_TYPE_LABELS[service.transportType] || TRANSPORT_TYPE_LABELS[TransportType.MARITIME];
    const { withAuth } = useRequireAuth();

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onEdit) onEdit(service.id, new FormData()); // The actual data isn't needed here as List opens its own modal
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) onDelete(service.id);
    };

    const handleQuoteRequest = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRequestQuote) onRequestQuote(service);
    };

    return (
        <>
            <div onClick={() => setIsDetailModalOpen(true)} 
                className={`group rounded-xl transition-all duration-300 cursor-pointer bg-card border border-border/40 hover:border-primary/30 overflow-hidden ${
                    viewMode === 'grid' 
                    ? "p-0 md:p-4 flex flex-col md:items-center text-left md:text-center" 
                    : "p-2 md:p-4 flex flex-row items-center gap-4 text-left"
                }`}>

                {/* Image Section */}
                <div className={`relative overflow-hidden rounded-lg md:rounded-2xl shrink-0 ${
                    viewMode === 'grid' ? "w-full aspect-square mb-1.5" : "w-24 h-24 md:w-32 md:h-32"
                }`}>
                    <Image src={service.images?.[0]?.url || '/placeholder-logistic.jpg'} alt={service.label} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />

                    {/* Badge Overlay */}
                    <div className={`absolute bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter flex items-center gap-1 ${
                        viewMode === 'grid' ? "top-1 left-1 md:top-2 md:left-2" : "top-1 left-1"
                    }`}>
                        <Icon icon={transportInfo.icon} className="w-2 h-2 md:w-3 md:h-3" />
                        {transportInfo.label}
                    </div>
                    {/* Badge LIVE flottant — style TikTok */}
                    {isOwner && onCreateLive && (
                        <LiveButtonInline
                            onClick={e => { e.stopPropagation(); onCreateLive(service); }}
                            title="Créer un Live pour ce service"
                        />
                    )}
                </div>

                {/* Content Section */}
                <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "px-0.5 pb-0 md:px-0 md:pb-0 w-full" : "h-full justify-center"}`}>
                    <h3 className={`font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate ${
                        viewMode === 'grid' ? "text-xs md:text-base line-clamp-2 md:line-clamp-1 text-left" : "text-sm md:text-lg"
                    }`}>
                        {service.label}
                    </h3>

                    {/* Star Rating */}
                    <div className={`flex items-center gap-1 text-primary ${viewMode === 'grid' ? "justify-start md:justify-center mb-2 md:mb-4" : "justify-start mb-1 md:mb-2"}`}>
                        <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                        <span className="text-[9px] md:text-xs font-black tracking-tight">4.9 • <span className="text-muted-foreground">Logistique</span></span>
                    </div>

                    <div className={`text-left ${viewMode === 'grid' ? "mb-3" : "mb-1"}`}>
                        <p className={`text-secondary font-black truncate uppercase opacity-70 ${viewMode === 'grid' ? "text-[10px] md:text-sm" : "text-xs md:text-base"}`}>
                            {service.company?.companyName || "Service Pro"}
                        </p>
                    </div>

                    {isOwner ? (
                        <div className={`flex items-center w-full gap-1.5 ${viewMode === 'grid' ? "justify-center" : "justify-end mt-auto"}`}>
                            <Switch checked={service.isActive} onCheckedChange={(val) => onToggleStatus?.(service.id, val)} disabled={isUpdating} onClick={(e) => e.stopPropagation()} />
                            <button onClick={handleEdit} className="p-1.5 rounded-lg hover:bg-muted transition" title="Modifier">
                                <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />
                            </button>
                            <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition" title="Supprimer">
                                <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className={`flex w-full ${viewMode === 'grid' ? "justify-center" : "justify-end mt-auto"}`}>
                            <button onClick={() => withAuth(() => handleQuoteRequest)} 
                                className={`flex items-center gap-1 md:gap-2 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm ${
                                    viewMode === 'grid' ? "px-2 py-1 md:px-3 md:py-2 text-[10px] md:text-xs" : "px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm"
                                }`}>
                                <span className="whitespace-nowrap">demander un devis</span>
                                <Icon icon="solar:document-bold-duotone" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            <LogisticsServiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                service={service}
                onRequestQuote={onRequestQuote}
            />
        </>
    );
}
