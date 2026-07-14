/**
 * Styles et libellés partagés pour les statuts de commande (Order.status et SubOrder.status).
 * Factorisé depuis Commandes.tsx / Historique-commandes.tsx / OrderDetailModal.tsx pour éviter
 * la duplication — toute nouvelle valeur de statut (ex: PARTIELLEMENT_EXPEDIEE) ne doit être
 * ajoutée qu'ici.
 */

export const ORDER_STATUS_BADGE_LABELS: Record<string, string> = {
    PAID: "PAYÉ",
    PENDING: "EN ATTENTE",
    PROCESSING: "EN COURS",
    VALIDATED: "VALIDÉ",
    SHIPPED: "EXPÉDIÉ",
    DELIVERED: "LIVRÉ",
    CANCELLED: "ANNULÉ",
    PARTIELLEMENT_EXPEDIEE: "PART. EXPÉDIÉE",
    PARTIELLEMENT_COMPLETE: "PART. COMPLÉTÉE",
};

export function getOrderStatusBadgeLabel(status: string): string {
    return ORDER_STATUS_BADGE_LABELS[status] ?? status;
}

export function getOrderStatusStyle(status: string): string {
    switch (status) {
        case "PAID":
            return "bg-green-500/10 text-green-600 dark:text-green-400";
        case "PENDING":
            return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
        case "PROCESSING":
            return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
        case "VALIDATED":
            return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
        case "CANCELLED":
            return "bg-red-500/10 text-red-600 dark:text-red-400";
        case "SHIPPED":
            return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
        case "DELIVERED":
            return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
        case "PARTIELLEMENT_EXPEDIEE":
            return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400";
        case "PARTIELLEMENT_COMPLETE":
            return "bg-teal-500/10 text-teal-600 dark:text-teal-400";
        default:
            return "bg-muted text-muted-foreground";
    }
}

export function getOrderStatusStyleObj(status: string): { bg: string; text: string } {
    switch (status) {
        case "PAID":
            return { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" };
        case "PENDING":
            return { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" };
        case "PROCESSING":
            return { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" };
        case "VALIDATED":
            return { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" };
        case "CANCELLED":
            return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" };
        case "SHIPPED":
            return { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
        case "DELIVERED":
            return { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" };
        case "PARTIELLEMENT_EXPEDIEE":
            return { bg: "bg-cyan-500/10", text: "text-cyan-600 dark:text-cyan-400" };
        case "PARTIELLEMENT_COMPLETE":
            return { bg: "bg-teal-500/10", text: "text-teal-600 dark:text-teal-400" };
        default:
            return { bg: "bg-muted", text: "text-muted-foreground" };
    }
}

export const ORDER_STATUS_DETAIL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    PENDING: { label: "En attente", color: "text-amber-600", bg: "bg-amber-500/10", icon: "solar:refresh-bold-duotone" },
    PROCESSING: { label: "En cours", color: "text-orange-600", bg: "bg-orange-500/10", icon: "solar:play-bold-duotone" },
    VALIDATED: { label: "Validé", color: "text-blue-600", bg: "bg-blue-500/10", icon: "solar:check-read-bold-duotone" },
    PAID: { label: "Payé", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: "solar:check-circle-bold-duotone" },
    SHIPPED: { label: "Expédié", color: "text-purple-600", bg: "bg-purple-500/10", icon: "solar:delivery-bold-duotone" },
    DELIVERED: { label: "Livré", color: "text-indigo-600", bg: "bg-indigo-500/10", icon: "solar:box-bold-duotone" },
    CANCELLED: { label: "Annulé", color: "text-red-600", bg: "bg-red-500/10", icon: "solar:close-circle-bold-duotone" },
    PARTIELLEMENT_EXPEDIEE: { label: "Partiellement expédiée", color: "text-cyan-600", bg: "bg-cyan-500/10", icon: "solar:delivery-bold-duotone" },
    PARTIELLEMENT_COMPLETE: { label: "Partiellement complétée", color: "text-teal-600", bg: "bg-teal-500/10", icon: "solar:box-bold-duotone" },
};
