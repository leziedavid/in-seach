"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { LogisticProvider } from "@/types/interface";
import { useRouter } from "next/navigation";
import { slugifyCompany } from "@/lib/utils";

interface LogisticProviderCardProps {
    provider: LogisticProvider;
}

export default function LogisticProviderCard({ provider }: LogisticProviderCardProps) {
    const router = useRouter();

    const handleNavigate = () => {
        const slug = slugifyCompany(provider.companyName);
        router.push(`/logistics/${slug}`);
    };

    return (
        <div onClick={handleNavigate} className="group rounded-2xl p-4 flex flex-col items-center text-center bg-card w-full transition-all duration-300 cursor-pointer border border-border/40 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
            {/* Logo Section */}
            <div className="relative w-full aspect-square mb-4 overflow-hidden rounded-2xl bg-muted/30">
                {provider.logo?.trim() ? (
                    <Image src={provider.logo} alt={provider.companyName} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors">
                        <Icon icon="solar:delivery-bold-duotone" className="w-12 h-12 text-primary/40 group-hover:text-primary transition-colors" />
                    </div>
                )}

                {/* Badge Overlay - Service Count */}
                <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-foreground uppercase tracking-tight shadow-sm flex items-center gap-1.5">
                    <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                    {provider.logisticServices?.length || 0} Services
                </div>
            </div>

            {/* Content Section */}
            <div className="w-full space-y-2">
                <h3 className="text-base font-black text-foreground line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                    {provider.companyName}
                </h3>

                {/* Info Pills */}
                {/* <div className="flex flex-wrap items-center justify-center gap-2">
                    <div className="flex items-center gap-1 text-primary">
                        <Icon icon="solar:star-bold-duotone" className="w-3 h-3" />
                        <span className="text-[10px] font-black tracking-tight italic">Partenaire Certifié</span>
                    </div>
                </div> */}

                {provider.siegeSocial && (
                    <div className="flex items-center justify-center gap-1.5 text-muted-foreground pt-1">
                        <Icon icon="solar:map-point-bold-duotone" className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                            {provider.siegeSocial}
                        </span>
                    </div>
                )}

                {/* Action Button */}
                <div className="pt-3 w-full">
                    <button className="flex items-center gap-1 md:gap-2 bg-secondary text-white px-2 py-1 md:px-3 md:py-2 rounded-full text-[10px] md:text-xs font-black hover:bg-primary transition-all active:scale-90 shadow-sm">
                        Voir les services
                        <Icon icon="solar:arrow-right-up-bold-duotone" className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
