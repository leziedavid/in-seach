"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { SupplierQuote, SupplierQuoteStatus } from "@/types/interface";
import { getSupplierQuotesReceived, updateSupplierQuote, updateSupplierQuoteStatus, createChatConversation } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import OnBack from "@/components/shared/OnBack";

const STATUS_CONFIG: Record<SupplierQuoteStatus, { label: string; color: string; icon: string }> = {
    PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: "solar:clock-circle-bold-duotone" },
    VALIDATED: { label: "Validé", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: "solar:check-circle-bold-duotone" },
    REJECTED: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: "solar:close-circle-bold-duotone" },
    CANCELLED: { label: "Annulé", color: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400", icon: "solar:forbidden-bold-duotone" },
};

interface FournisseurQuotesListProps {
    onBack: () => void;
}

/** "Demandes de devis" reçues côté Fournisseur — ajuste quantité/prix, contacte le client, valide/refuse. */
export default function FournisseurQuotesList({ onBack }: FournisseurQuotesListProps) {
    const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempQuantity, setTempQuantity] = useState<string>("");
    const [tempPrice, setTempPrice] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [isNegotiating, setIsNegotiating] = useState<Record<string, boolean>>({});

    const pendingAction = useRef<(() => Promise<void>) | null>(null);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string;
    }>({ isOpen: false, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "" });
    const [isConfirming, setIsConfirming] = useState(false);

    const { addNotification } = useNotification();
    const router = useRouter();

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

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const res = await getSupplierQuotesReceived();
            if (res.statusCode === 200) {
                setQuotes(res.data?.data || []);
            }
        } catch (error) {
            console.error("Error fetching supplier quotes:", error);
            addNotification("Erreur lors de la récupération des devis", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuotes(); }, []);

    const startEdit = (quote: SupplierQuote) => {
        setEditingId(quote.id);
        setTempQuantity(String(quote.quantity));
        setTempPrice(String(quote.unitPrice));
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTempQuantity("");
        setTempPrice("");
    };

    const saveEdit = async (id: string) => {
        const quantity = parseInt(tempQuantity, 10);
        const unitPrice = parseFloat(tempPrice);
        if (!quantity || quantity < 1 || isNaN(unitPrice) || unitPrice < 0) return;
        setIsSaving(true);
        try {
            const res = await updateSupplierQuote(id, { quantity, unitPrice });
            if (res.statusCode === 200) {
                addNotification("Devis ajusté", "success");
                cancelEdit();
                fetchQuotes();
            } else {
                addNotification(res.message || "Erreur lors de l'ajustement", "error");
            }
        } catch {
            addNotification("Erreur lors de l'ajustement", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: SupplierQuoteStatus) => {
        try {
            const res = await updateSupplierQuoteStatus(id, status);
            if (res.statusCode === 200) {
                addNotification(status === "VALIDATED" ? "Devis validé, commande créée" : "Devis refusé", "success");
                fetchQuotes();
            } else {
                addNotification(res.message || "Erreur lors de la mise à jour", "error");
            }
        } catch {
            addNotification("Erreur lors de la mise à jour", "error");
        }
    };

    const handleContact = async (quote: SupplierQuote) => {
        setIsNegotiating(prev => ({ ...prev, [quote.id]: true }));
        try {
            const res = await createChatConversation({ participant2Id: quote.buyerId });
            if (res.statusCode === 200 || res.statusCode === 201) {
                const message = `Bonjour, je vous contacte au sujet de votre demande de devis ${quote.code} pour "${quote.product?.name || 'votre produit'}".`;
                sessionStorage.setItem("pending_negotiation", JSON.stringify({
                    conversationId: res.data.id,
                    message,
                    quoteId: quote.id,
                }));
                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch {
            addNotification("Une erreur est survenue", "error");
        } finally {
            setIsNegotiating(prev => ({ ...prev, [quote.id]: false }));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Icon icon="solar:refresh-bold-duotone" className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Chargement des devis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full max-w-4xl mx-auto px-2 md:px-4">
            <OnBack label="Devis fournisseur" onBack={onBack} />
            {quotes.length > 0 ? (
                quotes.map((quote) => {
                    const status = STATUS_CONFIG[quote.status];
                    const isEditing = editingId === quote.id;
                    const stockOk = (quote.product?.stock ?? 0) >= quote.quantity;

                    return (
                        <div key={quote.id} className="bg-card hover:bg-muted/20 border border-border rounded-3xl p-5 transition-all shadow-sm hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                {/* Infos */}
                                <div className="space-y-3 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${status.color}`}>
                                            <Icon icon={status.icon} className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-black text-foreground uppercase tracking-tight truncate">{quote.code}</h4>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${status.color}`}>{status.label}</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                                {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pl-1">
                                        <p className="text-sm font-black text-foreground truncate">{quote.product?.name || "Produit"}</p>
                                        <p className={`text-[11px] font-bold ${stockOk ? "text-muted-foreground" : "text-red-500"}`}>
                                            Stock disponible : {quote.product?.stock ?? 0}
                                        </p>
                                    </div>

                                    <div className="pl-1 space-y-1">
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                            <Icon icon="solar:user-bold-duotone" className="w-3.5 h-3.5 text-primary shrink-0" />
                                            {quote.deliveryFullName} — {quote.deliveryPhone}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                            <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5 text-primary shrink-0" />
                                            {[quote.deliveryAddress, quote.deliveryDistrict, quote.deliveryCity].filter(Boolean).join(", ")}
                                        </p>
                                        {quote.comment && (
                                            <p className="text-[11px] text-muted-foreground italic">"{quote.comment}"</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quantité / Prix */}
                                <div className="px-0 md:px-6 md:border-l border-border/50 space-y-2 shrink-0">
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <input type="number" min={1} placeholder="Quantité" value={tempQuantity} onChange={e => setTempQuantity(e.target.value)}
                                                    className="w-24 h-10 px-3 rounded-xl border border-primary/30 bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary" />
                                                <input type="number" min={0} placeholder="Prix unitaire" value={tempPrice} onChange={e => setTempPrice(e.target.value)}
                                                    className="w-28 h-10 px-3 rounded-xl border border-primary/30 bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary" />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="rounded-xl h-9 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px]" disabled={isSaving} onClick={() => saveEdit(quote.id)}>
                                                    {isSaving ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : "Enregistrer"}
                                                </Button>
                                                <Button size="sm" variant="outline" className="rounded-xl h-9 font-black text-[10px]" onClick={cancelEdit}>Annuler</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-xs font-bold text-muted-foreground">{quote.quantity} x {quote.unitPrice.toLocaleString()} FCFA</p>
                                            <p className="text-lg font-black text-primary">{quote.totalAmount.toLocaleString()} <span className="text-xs">FCFA</span></p>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                {quote.status === "PENDING" && !isEditing && (
                                    <div className="flex flex-col gap-2 md:pl-6 md:border-l border-border/50 shrink-0">
                                        <Button size="sm" variant="outline" className="rounded-xl h-9 border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] gap-2" onClick={() => startEdit(quote)}>
                                            <Icon icon="solar:pen-bold" className="w-4 h-4" />
                                            Ajuster
                                        </Button>
                                        <Button size="sm" variant="outline" className="rounded-xl h-9 border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] gap-2" disabled={isNegotiating[quote.id]} onClick={() => handleContact(quote)}>
                                            {isNegotiating[quote.id] ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4" />}
                                            Contacter
                                        </Button>
                                        <div className="flex gap-2">
                                            <Button size="sm" className="rounded-xl h-9 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px]"
                                                disabled={!stockOk}
                                                onClick={() => openConfirm(() => handleUpdateStatus(quote.id, "VALIDATED"), {
                                                    title: "Valider le devis",
                                                    message: `Confirmez-vous la validation du devis ${quote.code} ? Une commande sera automatiquement créée.`,
                                                    confirmLabel: "Oui, valider", variant: "success", icon: "solar:check-circle-bold-duotone",
                                                })}>
                                                Valider
                                            </Button>
                                            <Button size="sm" variant="outline" className="rounded-xl h-9 border-red-100 text-red-500 hover:bg-red-50 font-black text-[10px]"
                                                onClick={() => openConfirm(() => handleUpdateStatus(quote.id, "REJECTED"), {
                                                    title: "Refuser le devis",
                                                    message: `Êtes-vous sûr de vouloir refuser le devis ${quote.code} ?`,
                                                    confirmLabel: "Oui, refuser", variant: "danger", icon: "solar:close-circle-bold-duotone",
                                                })}>
                                                Refuser
                                            </Button>
                                        </div>
                                        {!stockOk && (
                                            <p className="text-[10px] text-red-500 font-bold text-center">Stock insuffisant — ajustez la quantité avant de valider</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="bg-card/30 border border-dashed border-border rounded-3xl py-20 flex flex-col items-center justify-center text-center px-6">
                    <Icon icon="solar:document-text-bold-duotone" className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-black text-foreground/70 uppercase mb-2">Aucune demande de devis</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">Vous n'avez reçu aucune demande de devis pour le moment.</p>
                </div>
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
    );
}
