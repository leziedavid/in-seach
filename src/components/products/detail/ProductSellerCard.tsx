"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { StoreUserInfo } from "@/types/interface";
import { createStoreSlug } from "@/utils/storeSlug";

interface ProductSellerCardProps {
    storeInfo: StoreUserInfo | null;
}

/**
 * Carte boutique modernisée — remplace le bloc "Officielle/Boutique officielle" minimal
 * dupliqué 4x entre modal/page (mobile/desktop). Meilleure hiérarchie visuelle : logo plus
 * grand avec anneau dégradé, badge "Boutique vérifiée", stat articles en pilule dédiée.
 */
export default function ProductSellerCard({ storeInfo }: ProductSellerCardProps) {
    return (
        <Link href={`/shop/${createStoreSlug(storeInfo?.storeName || "boutique")}`} className="block group">
            <div className="flex items-center gap-3.5 p-4 bg-gradient-to-br from-muted/60 to-muted/20 rounded-3xl border border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300">
                <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden ring-2 ring-white dark:ring-zinc-900 shadow-md">
                        {storeInfo?.storeLogo ? (
                            <Image src={storeInfo.storeLogo} alt={storeInfo.storeName || "Boutique"} fill sizes="56px" className="object-cover" unoptimized />
                        ) : (
                            <Icon icon="solar:shop-bold-duotone" className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                        <Icon icon="solar:verified-check-bold" className="w-3 h-3 text-white" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-primary/70 mb-0.5">Vendu par</p>
                    <p className="text-sm font-black truncate text-foreground leading-tight">{storeInfo?.storeName || "Boutique officielle"}</p>
                    {storeInfo?.productCount !== undefined && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-primary/10 rounded-full">
                            <Icon icon="solar:box-bold-duotone" className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-black text-primary">{storeInfo.productCount} articles</span>
                        </div>
                    )}
                </div>

                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
                </div>
            </div>
        </Link>
    );
}
