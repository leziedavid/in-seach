"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { getMyProductReturns, updateProductReturnStatus, confirmReturnReception } from "@/api/api";
import { ProductReturn, ProductReturnStatus, ProductReturnReason, Role } from "@/types/interface";
import { getUserRole } from "@/lib/auth";
import { useNotification } from "@/components/notifications/NotificationProvider";
import OnBack from "@/components/shared/OnBack";
import AccountBookingRowSkeleton from "@/components/bookings/ui/AccountBookingRowSkeleton";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";

// ─── Config statuts ───────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<ProductReturnStatus, { label: string; color: string; bg: string; icon: string }> = {
    [ProductReturnStatus.PENDING]: { label: "En attente", color: "text-amber-600", bg: "bg-amber-500/10", icon: "solar:clock-circle-bold-duotone" },
    [ProductReturnStatus.APPROVED]: { label: "Accepté", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: "solar:check-circle-bold-duotone" },
    [ProductReturnStatus.EXCHANGE_PROPOSED]: { label: "Échange proposé", color: "text-blue-600", bg: "bg-blue-500/10", icon: "solar:refresh-bold-duotone" },
    [ProductReturnStatus.REJECTED]: { label: "Refusé", color: "text-red-600", bg: "bg-red-500/10", icon: "solar:close-circle-bold-duotone" },
    [ProductReturnStatus.REPLACEMENT_SENT]: { label: "Remplacement expédié", color: "text-purple-600", bg: "bg-purple-500/10", icon: "solar:delivery-bold-duotone" },
    [ProductReturnStatus.COMPLETED]: { label: "Terminé", color: "text-teal-600", bg: "bg-teal-500/10", icon: "solar:verified-check-bold-duotone" },
    [ProductReturnStatus.REFUNDED]: { label: "Remboursé", color: "text-indigo-600", bg: "bg-indigo-500/10", icon: "solar:wallet-money-bold-duotone" },
};

const REASON_LABELS: Record<ProductReturnReason, string> = {
    [ProductReturnReason.DEFECTIVE]: "Produit défectueux",
    [ProductReturnReason.WRONG_ITEM]: "Mauvais article",
    [ProductReturnReason.NOT_AS_DESCRIBED]: "Non conforme",
    [ProductReturnReason.DAMAGED_IN_TRANSIT]: "Endommagé (transport)",
    [ProductReturnReason.MISSING_PARTS]: "Pièces manquantes",
    [ProductReturnReason.OTHER]: "Autre",
};

// ─── Actions vendeur disponibles par statut ───────────────────────────────────
const SELLER_ACTIONS: Partial<Record<ProductReturnStatus, { status: ProductReturnStatus; label: string; icon: string; variant: "primary" | "danger" | "muted" }[]>> = {
    [ProductReturnStatus.PENDING]: [
        { status: ProductReturnStatus.APPROVED, label: "Accepter", icon: "solar:check-circle-bold-duotone", variant: "primary" },
        { status: ProductReturnStatus.EXCHANGE_PROPOSED, label: "Proposer échange", icon: "solar:refresh-bold-duotone", variant: "muted" },
        { status: ProductReturnStatus.REJECTED, label: "Refuser", icon: "solar:close-circle-bold-duotone", variant: "danger" },
    ],
    [ProductReturnStatus.APPROVED]: [
        { status: ProductReturnStatus.REPLACEMENT_SENT, label: "Confirmer expédition", icon: "solar:delivery-bold-duotone", variant: "primary" },
        { status: ProductReturnStatus.REFUNDED, label: "Rembourser", icon: "solar:wallet-money-bold-duotone", variant: "muted" },
    ],
    [ProductReturnStatus.EXCHANGE_PROPOSED]: [
        { status: ProductReturnStatus.REPLACEMENT_SENT, label: "Confirmer expédition", icon: "solar:delivery-bold-duotone", variant: "primary" },
        { status: ProductReturnStatus.REFUNDED, label: "Rembourser à la place", icon: "solar:wallet-money-bold-duotone", variant: "muted" },
    ],
};

// ─── Composant carte de retour ────────────────────────────────────────────────
function ReturnCard({ ret, role, onRefresh }: { ret: ProductReturn; role: Role; onRefresh: () => void }) {
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState(false);
    const [noteInput, setNoteInput] = useState("");
    const [expanded, setExpanded] = useState(false);
    const pendingAction = useRef<(() => Promise<void>) | null>(null);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string;
    }>({ isOpen: false, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "" });
    const [isConfirming, setIsConfirming] = useState(false);

    const openConfirm = (action: () => Promise<void>, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) => {
        pendingAction.current = action;
        setConfirmState({ isOpen: true, ...cfg });
    };
    const closeConfirm = () => {
        pendingAction.current = null;
        setConfirmState(s => ({ ...s, isOpen: false }));
    };
    const executeAction = async () => {
        if (isConfirming || !confirmState.isOpen || !pendingAction.current) return;
        setIsConfirming(true);
        await pendingAction.current();
        setIsConfirming(false);
        closeConfirm();
    };
    const status = STATUS_CONFIG[ret.status];
    const isClient = role === Role.CLIENT;
    const isSeller = role === Role.PRESTATAIRE || role === Role.ENTREPRISE;
    const isAdmin = role === Role.ADMIN;

    const handleAction = async (newStatus: ProductReturnStatus) => {
        setLoading(true);

        try {
            const res = await updateProductReturnStatus(ret.id, { status: newStatus, sellerNote: noteInput || undefined });
            if (res.statusCode === 200) {
                addNotification("Statut mis à jour", "success");
                onRefresh();
            } else {
                addNotification(res.message || "Erreur", "error");
            }
        } catch {
            addNotification("Une erreur est survenue", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReception = async () => {
        setLoading(true);
        try {
            const res = await confirmReturnReception(ret.id);
            if (res.statusCode === 200) {
                addNotification("Réception confirmée", "success");
                onRefresh();
            } else {
                addNotification(res.message || "Erreur", "error");
            }
        } catch {
            addNotification("Une erreur est survenue", "error");
        } finally {
            setLoading(false);
        }
    };

    const actions = (isSeller || isAdmin) ? (SELLER_ACTIONS[ret.status] || []) : [];
    const canConfirmReception = isClient && ret.status === ProductReturnStatus.REPLACEMENT_SENT;

    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* En-tête carte */}
            <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon icon="solar:box-bold-duotone" className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate">{ret.product?.name || "Produit"}</p>
                    <p className="text-[10px] text-muted-foreground">Commande #{ret.order?.code?.toUpperCase()} · {REASON_LABELS[ret.reason]}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black ${status.bg} ${status.color}`}>
                        <Icon icon={status.icon} className="w-3 h-3" />
                        {status.label}
                    </div>
                    <p className="text-[10px] font-bold text-primary">{ret.refundAmount.toLocaleString()} FCFA</p>
                </div>
                <Icon icon="solar:alt-arrow-down-bold-duotone" className={`w-4 h-4 text-muted-foreground transition-transform ml-1 shrink-0 ${expanded ? "rotate-180" : ""}`} />
            </button>
            {/* Détail expandé */}
            {expanded && (
                <div className="border-t border-border p-4 space-y-4">
                    {/* Infos */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 bg-muted/40 rounded-xl">
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Article</p>
                            <p className="text-xs font-bold">{ret.orderItem?.quantity} × {ret.orderItem?.price.toLocaleString()} FCFA</p>
                        </div>
                        <div className="p-2.5 bg-muted/40 rounded-xl">
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Date</p>
                            <p className="text-xs font-bold">{new Date(ret.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                        {isAdmin || isSeller ? (
                            <div className="p-2.5 bg-muted/40 rounded-xl col-span-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Client</p>
                                <p className="text-xs font-bold">{ret.customer?.fullName} · {ret.customer?.phone}</p>
                            </div>
                        ) : (
                            <div className="p-2.5 bg-muted/40 rounded-xl col-span-2">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Vendeur</p>
                                <p className="text-xs font-bold">{ret.seller?.storeName || ret.seller?.fullName}</p>
                            </div>
                        )}
                    </div>

                    {/* Description client */}
                    {ret.description && (
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/50">
                            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Description</p>
                            <p className="text-xs text-foreground">{ret.description}</p>
                        </div>
                    )}

                    {/* Note vendeur */}
                    {ret.sellerNote && (
                        <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl">
                            <p className="text-[9px] font-black uppercase text-primary mb-1">Note du vendeur</p>
                            <p className="text-xs text-foreground">{ret.sellerNote}</p>
                        </div>
                    )}

                    {/* Pièces justificatives */}
                    {ret.mediaFiles && ret.mediaFiles.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Preuves jointes</p>
                            <div className="flex flex-wrap gap-2">
                                {ret.mediaFiles.map(f => (
                                    <a key={f.id} href={f.fileUrl} target="_blank" rel="noreferrer"
                                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-border bg-muted block">
                                        {f.fileMimeType.startsWith("image/") ? (
                                            <Image
                                                src={f.fileUrl}
                                                alt={f.fileName}
                                                fill
                                                className="object-cover"
                                                unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Icon icon="solar:video-frame-bold-duotone" className="w-7 h-7 text-muted-foreground" />
                                            </div>
                                        )}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note vendeur (input) */}
                    {actions.length > 0 && (
                        <textarea rows={2} placeholder="Note pour le client (optionnelle)..." value={noteInput}
                            onChange={e => setNoteInput(e.target.value)}
                            className="w-full bg-muted/40 border border-border rounded-xl p-2.5 text-xs resize-none focus:border-primary outline-none transition-all placeholder:text-muted-foreground" />
                    )}

                    {/* Actions vendeur / admin */}
                    {actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {actions.map(a => (
                                <button key={a.status}
                                    onClick={(e) => { e.stopPropagation(); openConfirm(() => handleAction(a.status), { title: a.label, message: `Confirmez-vous l'action "${a.label}" pour ce retour produit ?`, confirmLabel: `Oui, ${a.label.toLowerCase()}`, variant: a.variant === "danger" ? "danger" : a.variant === "primary" ? "success" : "info", icon: a.icon }); }}
                                    disabled={loading}
                                    className={`flex-1 min-w-[120px] flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl font-black text-[11px] uppercase tracking-wide transition-all active:scale-95 disabled:opacity-50
                                    ${a.variant === "primary" ? "bg-primary text-white shadow-sm shadow-primary/20 hover:bg-secondary" :
                                            a.variant === "danger" ? "bg-red-500/10 text-red-600 hover:bg-red-500/20" :
                                                "bg-muted text-foreground hover:bg-muted/80"}`}>
                                    <Icon icon={a.icon} className="w-3.5 h-3.5 shrink-0" />
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Action client : confirmer réception */}
                    {canConfirmReception && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openConfirm(() => handleConfirmReception(), { title: "Confirmer la réception", message: "Confirmez-vous avoir bien reçu votre remplacement ? Cette action est définitive.", confirmLabel: "Oui, confirmer", variant: "success", icon: "solar:check-circle-bold-duotone" }); }}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-600 font-black text-xs uppercase tracking-wide rounded-xl hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />}
                            Confirmer la réception
                        </button>
                    )}

                    <ConfirmAction
                        isOpen={confirmState.isOpen}
                        onClose={closeConfirm}
                        onConfirm={executeAction}
                        title={confirmState.title}
                        message={confirmState.message}
                        confirmLabel={confirmState.confirmLabel}
                        variant={confirmState.variant}
                        icon={confirmState.icon}
                        isLoading={isConfirming}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Section principale ───────────────────────────────────────────────────────
interface RetoursSAVProps {
    onBack: () => void;
}

export default function RetoursSAV({ onBack }: RetoursSAVProps) {
    const [returns, setReturns] = useState<ProductReturn[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ProductReturnStatus | "ALL">("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [role, setRole] = useState<Role>(Role.CLIENT);

    useEffect(() => {
        setRole((getUserRole() as Role) || Role.CLIENT);
    }, []);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyProductReturns({
                status: activeFilter !== "ALL" ? activeFilter : undefined,
                page,
                limit: 10,
            });
            if (res.statusCode === 200 && res.data) {
                setReturns(res.data.data);
                setTotalPages(res.data.totalPages);
            }
        } finally {
            setLoading(false);
        }
    }, [activeFilter, page]);

    useEffect(() => {
        setPage(1);
    }, [activeFilter]);

    useEffect(() => {
        fetch();
    }, [fetch]);

    const filters: { value: ProductReturnStatus | "ALL"; label: string }[] = [
        { value: "ALL", label: "Tous" },
        { value: ProductReturnStatus.PENDING, label: "En attente" },
        { value: ProductReturnStatus.APPROVED, label: "Acceptés" },
        { value: ProductReturnStatus.EXCHANGE_PROPOSED, label: "Échanges" },
        { value: ProductReturnStatus.REPLACEMENT_SENT, label: "Expédiés" },
        { value: ProductReturnStatus.REFUNDED, label: "Remboursés" },
        { value: ProductReturnStatus.COMPLETED, label: "Terminés" },
        { value: ProductReturnStatus.REJECTED, label: "Refusés" },
    ];

    return (
        <div className="flex flex-col w-full max-w-4xl mx-auto gap-4">
            <OnBack
                label="Retours & SAV"
                onBack={onBack}
                subtitle="Gérez vos demandes de retour et suivez leur évolution"
                className="mb-2"
            />

            {/* Filtres */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {filters.map(f => (
                    <button key={f.value} onClick={() => setActiveFilter(f.value)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all
                        ${activeFilter === f.value ? "bg-primary text-white shadow-sm shadow-primary/20" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Liste */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <AccountBookingRowSkeleton key={i} />)}
                </div>
            ) : returns.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Icon icon="solar:box-minimalistic-broken" className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Aucune demande de retour</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {returns.map(r => (
                        <ReturnCard key={r.id} ret={r} role={role} onRefresh={fetch} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 disabled:opacity-40 transition-all">
                        <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-black">{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                        className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 disabled:opacity-40 transition-all">
                        <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
