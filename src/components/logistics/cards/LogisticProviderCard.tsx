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

    return (


        <>

            <div onClick={handleNavigate} 
                className={`group rounded-xl transition-all duration-300 cursor-pointer bg-card border border-border/40 hover:border-primary/30 overflow-hidden ${
                    viewMode === 'grid' 
                    ? "p-0 md:p-4 flex flex-col md:items-center text-left md:text-center" 
                    : "p-2 md:p-4 flex flex-row items-center gap-4 text-left"
                }`}>

                {/* Image Section */}
                <div className={`relative overflow-hidden rounded-lg md:rounded-2xl shrink-0 ${
                    viewMode === 'grid' ? "w-full aspect-square mb-1.5" : "w-24 h-24 md:w-32 md:h-32"
                }`}>
                    <Image src={provider.logo || '/placeholder-logistic.jpg'} alt={provider.companyName} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />

                    {/* Badge Overlay */}
                    <div className={`absolute bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter flex items-center gap-1 ${
                        viewMode === 'grid' ? "top-1 left-1 md:top-2 md:left-2" : "top-1 left-1"
                    }`}>
                        <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                        {provider.logisticServices?.length || 0} Services
                    </div>
                </div>

                {/* Content Section */}
                <div className={`flex flex-col flex-1 min-w-0 ${viewMode === 'grid' ? "px-0.5 pb-0 md:px-0 md:pb-0 w-full" : "h-full justify-center"}`}>
                    <h3 className={`font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-tight truncate ${
                        viewMode === 'grid' ? "text-xs md:text-base line-clamp-2 md:line-clamp-1 text-left" : "text-sm md:text-lg"
                    }`}>
                        {provider.companyName}
                    </h3>

                    {provider.siegeSocial && (
                        <div className={`flex items-center gap-1.5 text-muted-foreground pt-1 ${viewMode === 'grid' ? "justify-center" : "justify-start"}`}>
                            <Icon icon="solar:map-point-bold-duotone" className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                                {provider.siegeSocial}
                            </span>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className={`${viewMode === 'grid' ? "pt-3 w-full" : "mt-2 md:mt-4"}`}>
                        <button className={`flex items-center gap-1 md:gap-2 bg-secondary text-white rounded-full font-black hover:bg-primary transition-all active:scale-90 shadow-sm ${
                            viewMode === 'grid' ? "px-2 py-1 md:px-3 md:py-2 text-[10px] md:text-xs mx-auto" : "px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm mr-auto"
                        }`}>
                            Voir les services
                            <Icon icon="solar:arrow-right-up-bold-duotone" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

        </>


    );
}
