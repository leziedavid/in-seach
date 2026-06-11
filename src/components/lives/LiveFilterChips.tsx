"use client";

import { Icon } from "@iconify/react";
import { LiveEntityType } from "@/types/interface";

export interface LiveFilter {
    value: LiveEntityType | "";
    label: string;
    icon: string;
}

export const LIVE_FILTERS: LiveFilter[] = [
    { value: "",                              label: "Tous",       icon: "solar:play-circle-bold-duotone" },
    { value: LiveEntityType.PRODUCT,          label: "Produits",   icon: "solar:box-bold-duotone" },
    { value: LiveEntityType.ANNONCE,          label: "Annonces",   icon: "solar:eye-bold-duotone" },
    { value: LiveEntityType.SERVICE,          label: "Services",   icon: "solar:widget-bold-duotone" },
    { value: LiveEntityType.SERVICE_LOGISTIQUE, label: "Logistique", icon: "solar:delivery-bold-duotone" },
    { value: LiveEntityType.PROFILE,          label: "Profils",    icon: "solar:user-bold-duotone" },
];

interface LiveFilterChipsProps {
    active: LiveEntityType | "";
    onChange: (value: LiveEntityType | "") => void;
}

export default function LiveFilterChips({ active, onChange }: LiveFilterChipsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
            <style>{`.lfc::-webkit-scrollbar{display:none}`}</style>
            {LIVE_FILTERS.map(f => {
                const isActive = f.value === active;
                return (
                    <button
                        key={f.value}
                        onClick={() => onChange(f.value)}
                        className={`
                            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                            whitespace-nowrap transition-all duration-200 shrink-0 active:scale-95
                            ${isActive
                                ? "bg-white text-black shadow-md shadow-black/20"
                                : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm"
                            }
                        `}
                    >
                        <Icon icon={f.icon} className="w-3.5 h-3.5" />
                        {f.label}
                    </button>
                );
            })}
        </div>
    );
}
