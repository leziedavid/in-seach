"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { LogisticProvider } from "@/types/interface";
import { useRouter } from "next/navigation";
import { slugifyCompany } from "@/lib/utils";

import { ViewMode } from "@/components/shared/ViewToggle";

interface LogisticProviderCardProps {
    provider: LogisticProvider;
    viewMode?: ViewMode;
}

export default function LogisticProviderCard({ provider, viewMode = "grid" }: LogisticProviderCardProps) {
    const router = useRouter();

    const handleNavigate = () => {
        const slug = slugifyCompany(provider.companyName);
        router.push(`/logistics/${slug}`);
    };

    if (viewMode === 'list') {
        const servicesCount = provider.logisticServices?.length || 0;
        return (
            <div onClick={handleNavigate}
                className="group flex items-start gap-4 p-4 rounded-xl cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 transition-all">
                <div className="relative shrink-0 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-1 ring-border/40">
                    <Image
                        src={provider.logo || '/placeholder-logistic.jpg'}
                        alt={provider.companyName}
                        fill
                        unoptimized
                        className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon icon="solar:delivery-bold-duotone" className="w-3 h-3 text-primary" />
                        </span>
                        <span className="text-sm font-bold text-foreground truncate">{provider.companyName}</span>
                    </div>
                    {provider.siegeSocial && (
                        <p className="text-xs text-muted-foreground/70 truncate mb-1.5 ml-7">{provider.siegeSocial}</p>
                    )}
                    <h3 className="text-base md:text-lg font-black leading-snug mb-1 group-hover:text-primary transition-colors">
                        <span className="text-primary">Compagnie logistique</span> <span className="text-foreground">{provider.companyName}</span>
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {servicesCount > 0
                            ? `Propose ${servicesCount} service${servicesCount > 1 ? "s" : ""} de transport et logistique.`
                            : "Compagnie logistique partenaire."}
                    </p>
                    {servicesCount > 0 && (
                        <p className="text-xl font-black text-foreground">
                            {servicesCount} <span className="text-sm font-bold text-muted-foreground">service{servicesCount > 1 ? "s" : ""}</span>
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div onClick={handleNavigate}
            className="group rounded-2xl transition-all duration-300 cursor-pointer bg-muted/20 border border-border/30 hover:border-primary/30 hover:bg-muted/30 overflow-hidden p-2 md:p-4 flex flex-col md:items-center text-left md:text-center">

            {/* Image Section */}
            <div className="relative overflow-hidden rounded-lg md:rounded-2xl shrink-0 w-full aspect-square mb-1.5 ring-1 ring-border/40">
                <Image
                    src={provider.logo || '/placeholder-logistic.jpg'}
                    alt={provider.companyName}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-110 transition-transform duration-500" />

                {/* Badge Overlay */}
                <div className="absolute bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter flex items-center gap-1 top-1 left-1 md:top-2 md:left-2">
                    <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                    {provider.logisticServices?.length || 0} Services
                </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col flex-1 min-w-0 px-0.5 pb-0 md:px-0 md:pb-0 w-full">
                <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-wide mb-0.5">Compagnie logistique</span>
                <h3 className="font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate text-xs md:text-base line-clamp-2 md:line-clamp-1 text-left">
                    {provider.companyName}
                </h3>

                {provider.siegeSocial && (
                    <div className="flex items-center gap-1.5 text-muted-foreground pt-1 justify-center">
                        <Icon icon="solar:map-point-bold-duotone" className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                            {provider.siegeSocial}
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <div className="pt-3 w-full">
                    <button className="flex items-center gap-1 md:gap-2 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm px-2 py-1 md:px-3 md:py-2 text-[10px] md:text-xs mx-auto">
                        Voir les services
                        <Icon icon="solar:arrow-right-up-bold-duotone" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
