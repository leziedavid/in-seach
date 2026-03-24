import React from "react"
import { Icon } from "@iconify/react"

type IconProps = {
    active?: boolean
}

// Icône blanche quand active, bleu/gris sinon
export const strokeColor = (active?: boolean) => (active ? "#ffffff" : "#94a3b8")

export function ServicesIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:shop-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}

export function OrdersIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:clipboard-list-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}

export function HistoryIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:history-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}

export function AccountIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:user-circle-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}

export function SearchIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:magnifer-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}

export function LogisticsIcon({ active }: IconProps) {
    return (
        <Icon
            icon="solar:delivery-bold-duotone"
            className="w-[26px] h-[26px]"
            style={{ color: strokeColor(active) }}
        />
    )
}
