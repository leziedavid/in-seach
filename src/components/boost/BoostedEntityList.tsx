"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { TablePagination } from "@/components/ui/table/Pagination";
import { useBoostedEntities } from "@/hooks/useBoostedEntities";
import { Boost, BoostEntityType, BoostStatus } from "@/types/interface";
import BoostEntityModal from "@/components/boost/modals/BoostEntityModal";

interface BoostedEntityListProps {
    entityType: BoostEntityType;
    /** Libellé singulier affiché dans les messages, ex: "produit", "service", "annonce" */
    entityLabel: string;
}

const STATUS_STYLES: Record<BoostStatus, { label: string; className: string; icon: string }> = {
    ACTIVE: { label: "Actif", className: "bg-green-500/10 text-green-600 dark:text-green-400", icon: "solar:rocket-bold-duotone" },
    PENDING: { label: "En attente", className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: "solar:clock-circle-bold-duotone" },
    WAITING_PAYMENT_VALIDATION: { label: "Validation paiement", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: "solar:hourglass-bold-duotone" },
    EXPIRED: { label: "Boost expiré", className: "bg-red-500/10 text-red-600 dark:text-red-400", icon: "solar:close-circle-bold-duotone" },
    REJECTED: { label: "Rejeté", className: "bg-red-500/10 text-red-600 dark:text-red-400", icon: "solar:close-circle-bold-duotone" },
    CANCELLED: { label: "Annulé", className: "bg-muted text-muted-foreground", icon: "solar:close-circle-bold-duotone" },
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    WAITING_VALIDATION: "En attente de validation",
    PAID: "Payé",
    REJECTED: "Rejeté",
    REFUNDED: "Remboursé",
};

function formatDate(date?: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function BoostedEntityList({ entityType, entityLabel }: BoostedEntityListProps) {
    const { boosts, loading, page, setPage, total, totalPages, refetch } = useBoostedEntities(entityType);

    const [renewTarget, setRenewTarget] = useState<Boost | null>(null);

    const handleRenew = (boost: Boost) => {
        setRenewTarget(boost);
    };

    return (
        <div className="w-full">
            {loading && boosts.length === 0 && (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            )}
            {!loading && boosts.length === 0 && (
                <div className="py-16 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                    <div className="p-4 bg-muted/50 rounded-full">
                        <Icon icon="solar:rocket-2-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black text-card-foreground">Aucun {entityLabel} boosté</p>
                        <p className="text-xs text-muted-foreground max-w-xs px-4">
                            Boostez un {entityLabel} depuis l&apos;onglet &laquo; Mes {entityLabel}s &raquo; pour le mettre en avant.
                        </p>
                    </div>
                </div>
            )}
            {!loading && boosts.length > 0 && (
                <>
                    <div className="space-y-3">
                        {boosts.map((b) => {
                            const statusInfo = STATUS_STYLES[b.status];
                            const isExpired = b.status === "EXPIRED";
                            const entity = b.entity;

                            return (
                                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all">
                                    {/* Image + titre entité */}
                                    <div className="flex items-center gap-3 sm:w-56 shrink-0">
                                        <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                                            {entity?.image ? (
                                                <Image
                                                    src={entity.image}
                                                    alt={entity.title}
                                                    fill
                                                    unoptimized
                                                    className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Icon icon="solar:gallery-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black truncate">{entity?.title ?? "Contenu supprimé"}</p>
                                            {entity?.price !== undefined && (
                                                <p className="text-xs text-secondary font-bold">{entity.price.toLocaleString()} FCFA</p>
                                            )}
                                            {entity?.status && (
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">{entity.status}</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Statut boost */}
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black w-fit shrink-0 ${statusInfo.className}`}>
                                        <Icon icon={statusInfo.icon} className="w-3.5 h-3.5" />
                                        {statusInfo.label}
                                    </div>
                                    {/* Infos boost */}
                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-muted-foreground">
                                        <div>
                                            <p className="font-bold text-foreground/80">Début</p>
                                            <p>{formatDate(b.startDate)}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground/80">Fin</p>
                                            <p>{formatDate(b.endDate)}</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground/80">Durée</p>
                                            <p>{b.durationDays} jour(s)</p>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground/80">Montant</p>
                                            <p>{b.amount.toLocaleString()} FCFA</p>
                                        </div>
                                        {b.paymentStatus && (
                                            <div className="col-span-2 sm:col-span-4">
                                                Paiement : <span className="font-bold text-foreground/80">{PAYMENT_STATUS_LABELS[b.paymentStatus] ?? b.paymentStatus}</span>
                                            </div>
                                        )}
                                        {/* Statistiques sponsoring — additif, CTR calculé à la volée (jamais stocké côté backend) */}
                                        <div className="col-span-2 sm:col-span-4 flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 mt-1 border-t border-dashed border-border/60">
                                            <span className="flex items-center gap-1"><Icon icon="solar:eye-bold-duotone" width={12} /> {(b.impressions ?? 0).toLocaleString()} impr.</span>
                                            <span className="flex items-center gap-1"><Icon icon="solar:cursor-bold-duotone" width={12} /> {(b.views ?? 0).toLocaleString()} vues</span>
                                            <span className="flex items-center gap-1"><Icon icon="solar:mouse-bold-duotone" width={12} /> {(b.clicks ?? 0).toLocaleString()} clics</span>
                                            <span className="flex items-center gap-1 font-bold text-foreground/80">
                                                CTR : {b.impressions ? ((b.clicks ?? 0) / b.impressions * 100).toFixed(1) : "0.0"}%
                                            </span>
                                        </div>
                                    </div>
                                    {/* Renouvellement si expiré */}
                                    {isExpired && entity && (
                                        <button
                                            onClick={() => handleRenew(b)}
                                            className="shrink-0 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all w-full sm:w-auto"
                                        >
                                            <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4" />
                                            <span className="whitespace-nowrap">Renouveler le boost</span>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {totalPages > 1 && (
                        <div className="w-full overflow-x-auto mt-4">
                            <TablePagination page={page} limit={9} total={total} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    )}
                </>
            )}
            {/* Modal de renouvellement — réutilise le composant de boost existant, préremplie avec l'entité ciblée */}
            {renewTarget?.entity && (
                <BoostEntityModal
                    isOpen={!!renewTarget}
                    onClose={() => setRenewTarget(null)}
                    entityType={entityType}
                    entityId={renewTarget.entity.id}
                    entityName={renewTarget.entity.title}
                    onSuccess={() => { setRenewTarget(null); refetch(); }}
                />
            )}
        </div>
    );
}
