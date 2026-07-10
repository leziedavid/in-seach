import { GasBottleFormat } from "@/types/interface";

/** Icône et libellé par format de bouteille — partagé entre le dashboard prestataire et le marketplace client. */
export const GAS_BOTTLE_FORMAT_CONFIG: Record<GasBottleFormat, { label: string; icon: string }> = {
    [GasBottleFormat.B6]: { label: "B6", icon: "mdi:propane-tank-outline" },
    [GasBottleFormat.B12]: { label: "B12", icon: "mdi:propane-tank" },
    [GasBottleFormat.B15]: { label: "B15", icon: "solar:flame-bold-duotone" },
    [GasBottleFormat.B28]: { label: "B28", icon: "solar:fire-bold-duotone" },
    [GasBottleFormat.B38]: { label: "B38", icon: "mdi:silo" },
};
