

import { Icon } from "@iconify/react"

type IconProps = {
    active?: boolean
    className?: string
}

// Icône blanche quand active, bleu/gris sinon
export const strokeColor = (active?: boolean) => (active ? "#ffffff" : "#94a3b8")

// Taille par défaut augmentée : mobile (30px) -> desktop (32px)
const defaultSizeClasses = "w-[30px] h-[30px] sm:w-[32px] sm:h-[32px] md:w-[34px] md:h-[34px]"

export function SearchIcon({ active, className }: IconProps) {
    return (
        <Icon icon="solar:magnifer-bold-duotone" className={`${defaultSizeClasses} ${className}`} style={{ color: strokeColor(active) }} />
    )
}

// Pour "Opportunités" : Utilisation d'un éclair ou d'une étoile montante
export function OpportunitiesIcon({ active, className }: IconProps) {
    return (
        <Icon icon="solar:lightbulb-bolt-bold-duotone" className={`${defaultSizeClasses} ${className}`} style={{ color: strokeColor(active) }} />
    )
}

// Pour "Boutique" : Utilisation d'un sac de shopping ou shop
export function BoutiqueIcon({ active, className }: IconProps) {
    return (
        <Icon icon="solar:bag-heart-bold-duotone" className={`${defaultSizeClasses} ${className}`} style={{ color: strokeColor(active) }} />
    )
}

export function LogisticsIcon({ active, className }: IconProps) {
    return (
        <Icon icon="solar:delivery-bold-duotone" className={`${defaultSizeClasses} ${className}`} style={{ color: strokeColor(active) }} />
    )
}

// Anciens exports pour compatibilité au cas où
export const HistoryIcon = OpportunitiesIcon;
export const AccountIcon = BoutiqueIcon;