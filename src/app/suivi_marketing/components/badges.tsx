'use client';

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    TRAITE: { label: 'Traité', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    EN_ATTENTE: { label: 'En attente', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    URGENT: { label: 'Urgent', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    A_RAPPELER: { label: 'À rappeler', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
};

export const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
    BASSE: { label: 'Basse', className: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300' },
    NORMALE: { label: 'Normale', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    HAUTE: { label: 'Haute', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
    URGENTE: { label: 'Urgente', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export const MODULE_LABELS: Record<string, string> = {
    BOUTIQUE: 'Boutique',
    SERVICES: 'Services',
    ANNONCES: 'Annonces',
    GAZ: 'Gaz',
    LOGISTIQUE: 'Logistique',
    LIVE_SHOPPING: 'Live Shopping',
    AUTRE: 'Autre',
};

export function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.className}`}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
    const cfg = PRIORITY_CONFIG[priority] ?? { label: priority, className: 'bg-muted text-muted-foreground' };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${cfg.className}`}>{cfg.label}</span>;
}
