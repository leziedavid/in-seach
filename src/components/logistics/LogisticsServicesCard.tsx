"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { LogisticService, TransportType } from "@/types/interface";
import { Switch } from "../ui/switch";
import LogisticsServiceDetailModal from "./LogisticsServiceDetailModal";

interface LogisticsServicesCardProps {
    service: LogisticService;
    isOwner?: boolean;
    onEdit?: (id: string, formData: FormData) => void;
    onDelete?: (id: string) => void;
    onToggleStatus?: (id: string, value: boolean) => void;
    onRequestQuote?: (service: LogisticService) => void;
    isUpdating?: boolean;
}

const TRANSPORT_TYPE_LABELS: Record<TransportType, { label: string; icon: string; color: string }> = {
    [TransportType.MARITIME]: { label: "Maritime", icon: "solar:ship-bold-duotone", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    [TransportType.AERIEN]: { label: "Aérien", icon: "solar:plain-bold-duotone", color: "text-sky-600 bg-sky-50 dark:bg-sky-500/10" },
    [TransportType.HORS_GABARIT]: { label: "Hors Gabarit", icon: "solar:truck-bold-duotone", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
    [TransportType.SANTE]: { label: "Santé", icon: "solar:hospital-bold-duotone", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    [TransportType.LOGISTIQUE_STOCKAGE]: { label: "Stockage", icon: "solar:box-bold-duotone", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    [TransportType.DOUANE]: { label: "Douane", icon: "solar:shield-user-bold-duotone", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" },
};

export default function LogisticsServicesCard({ service, isOwner = false, onEdit, onDelete, onToggleStatus, onRequestQuote, isUpdating = false }: LogisticsServicesCardProps) {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const transportInfo = TRANSPORT_TYPE_LABELS[service.transportType] || TRANSPORT_TYPE_LABELS[TransportType.MARITIME];

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
            <div onClick={() => setIsDetailModalOpen(true)} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300 cursor-pointer border border-transparent">

                {/* Image Section - aspect square like ProductCard */}
                <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                    <Image src={service.images?.[0]?.url || '/placeholder-logistic.jpg'} alt={service.label} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />

                    {/* Badge Overlay */}
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter flex items-center gap-1">
                        <Icon icon={transportInfo.icon} className="w-2 h-2 md:w-3 md:h-3" />
                        {transportInfo.label}
                    </div>

                    {isOwner && (
                        <div className="absolute top-1 right-1 md:top-2 md:right-2" onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={service.isActive}
                                onCheckedChange={(val) => onToggleStatus?.(service.id, val)}
                                disabled={isUpdating}
                                className="scale-75 md:scale-90"
                            />
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                    <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                        {service.label}
                    </h3>

                    {/* Star Rating style like ProductCard */}
                    <div className="flex items-center justify-start gap-1 text-primary mb-2 md:mb-4 md:justify-center">
                        <Icon icon="solar:star-bold-duotone" className="w-2.5 h-2.5 fill-current md:w-3 md:h-3" />
                        <span className="text-[9px] md:text-xs font-black tracking-tight">4.9 • <span className="text-muted-foreground">Logistique</span></span>
                    </div>

                    {/* Bottom Info & Action */}
                    <div className="w-full flex items-center justify-between mt-auto gap-2">
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-secondary font-black text-[10px] md:text-xs truncate uppercase opacity-70">
                                {service.company?.companyName || "Service Pro"}
                            </p>
                        </div>

                        {isOwner ? (
                            <div className="flex items-center gap-1">
                                <button onClick={handleEdit} className="bg-blue-500 text-white p-1.5 md:p-2 rounded-full hover:bg-blue-600 transition-all active:scale-90 shadow-sm" title="Modifier">
                                    <Icon icon="solar:pen-bold-duotone" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                                <button onClick={handleDelete} className="bg-red-500 text-white p-1.5 md:p-2 rounded-full hover:bg-red-600 transition-all active:scale-90 shadow-sm" title="Supprimer">
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleQuoteRequest} className="bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                                <Icon icon="solar:document-bold-duotone" className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">Devis</span>
                            </button>
                        )}
                    </div>
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
