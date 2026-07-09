"use client"

import { Icon } from "@iconify/react"
import { AnnonceStats } from "@/types/interface"

export default function AnnoncePerformance({ stats }: { stats: AnnonceStats | null }) {
    const tiles = [
        {
            icon: "solar:lightbulb-bolt-bold-duotone",
            label: "Annonces actives",
            value: stats ? `${stats.activeAnnonces}/${stats.totalAnnonces}` : "—",
        },
        {
            icon: "solar:clipboard-list-bold-duotone",
            label: "Réservations reçues",
            value: stats ? stats.bookingsReceivedCount : "—",
        },
        {
            icon: "solar:wallet-money-bold-duotone",
            label: "Chiffre d'affaires",
            value: stats ? `${stats.totalRevenue.toLocaleString()} FCFA` : "—",
        },
        {
            icon: "solar:rocket-bold-duotone",
            label: "Annonces boostées",
            value: stats ? stats.boostedAnnoncesCount : "—",
        },
    ];

    return (
        <>
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-black text-foreground">Performances de mes annonces</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tiles.map((tile) => (
                    <div key={tile.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                        <div className="p-2 bg-primary/10 rounded-xl w-fit">
                            <Icon icon={tile.icon} className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xl md:text-2xl font-black text-foreground truncate">{tile.value}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tile.label}</p>
                    </div>
                ))}
            </div>
        </>
    );
}
