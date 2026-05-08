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


        <>

            <div onClick={handleNavigate} className="group rounded-lg p-0 md:p-4 flex flex-col md:items-center text-left md:text-center bg-card w-full transition-all duration-300 cursor-pointer border border-transparent">

                {/* Image Section - aspect square like ProductCard */}
                <div className="relative w-full aspect-square mb-1.5 overflow-hidden rounded-lg md:rounded-2xl">
                    <Image src={provider.logo || '/placeholder-logistic.jpg'} alt={provider.companyName} fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />

                    {/* Badge Overlay */}
                    <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-black/70 md:bg-background/95 backdrop-blur-sm px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-full text-[8px] md:text-[9px] font-black text-white md:text-foreground uppercase tracking-tighter flex items-center gap-1">
                        <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                        {provider.logisticServices?.length || 0} Services
                    </div>


                </div>

                {/* Content Section */}
                <div className="px-0.5 pb-0 md:px-0 md:pb-0 w-full">

                    <h3 className="text-xs md:text-base font-black text-foreground mb-1 line-clamp-2 md:line-clamp-1 group-hover:text-primary transition-colors w-full text-left leading-tight">
                        {provider.companyName}
                    </h3>

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

        </>


    );
}
