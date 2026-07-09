"use client"

import { Icon } from "@iconify/react"

interface LiveStatCardProps {
    icon: string;
    value: number;
    label: string;
    color: string;
}

export default function LiveStatCard({ icon, value, label, color }: LiveStatCardProps) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon icon={icon} className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xl font-black text-foreground leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
        </div>
    );
}
