'use client';

/**
 * Petit badge de statut réutilisé partout où un type de compte est proposé
 * (RoleSelectionModal, /register) — permet de voir en un coup d'œil quels
 * rôles sont ouverts à l'inscription et lesquels arrivent bientôt.
 */
export function RoleStatusBadge({ active }: { active: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide whitespace-nowrap ${active
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {active ? 'Disponible' : 'Bientôt'}
        </span>
    );
}
