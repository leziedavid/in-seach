"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Quote, QuoteStatus, TransportType } from "@/types/interface";
import { getSentQuotes, getReceivedQuotes, updateQuoteStatus, createDeliveryFromQuote, createChatConversation } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { getUserId, isAuthenticated } from "@/lib/auth";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

import ClientsManager from "./ClientsManager";
import ManualQuoteModal from "./ManualQuoteModal";

interface QuotesListProps {
    role: "CLIENT" | "ENTREPRISE";
}

const STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string; icon: string }> = {
    [QuoteStatus.PENDING]: { label: "En attente", color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400", icon: "solar:clock-circle-bold-duotone" },
    [QuoteStatus.REVIEWING]: { label: "En examen", color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400", icon: "solar:eye-bold-duotone" },
    [QuoteStatus.PROPOSED]: { label: "Prix proposé", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400", icon: "solar:hand-money-bold-duotone" },
    [QuoteStatus.ACCEPTED]: { label: "Accepté", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", icon: "solar:check-circle-bold-duotone" },
    [QuoteStatus.REJECTED]: { label: "Refusé", color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400", icon: "solar:close-circle-bold-duotone" },
    [QuoteStatus.CANCELLED]: { label: "Annulé", color: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400", icon: "solar:forbidden-bold-duotone" },
};

export default function QuotesList({ role }: QuotesListProps) {
    const [activeTab, setActiveTab] = useState<"quotes" | "clients">("quotes");
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [proposingPriceId, setProposingPriceId] = useState<string | null>(null);
    const [tempPrice, setTempPrice] = useState<string>("");
    const [isNegotiating, setIsNegotiating] = useState<Record<string, boolean>>({});

    // Attachment Preview
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const { addNotification } = useNotification();
    const router = useRouter();
    const { checkEligibility, loading: checkLoading } = useSubscriptionCheck();

    const fetchQuotes = async () => {
        setLoading(true);
        try {
            const res = role === "CLIENT" ? await getSentQuotes() : await getReceivedQuotes();
            if (res.statusCode === 200) {
                const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
                setQuotes(data);
            }
        } catch (error) {
            console.error("Error fetching quotes:", error);
            addNotification("Erreur lors de la récupération des devis", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCurrentUserId(getUserId());
        fetchQuotes();
    }, [role]);

    const handleUpdateStatus = async (id: string, status: QuoteStatus, montant?: number) => {
        try {
            const res = await updateQuoteStatus(id, status, montant);
            if (res.statusCode === 200) {
                addNotification(`Devis ${status.toLowerCase()}`, "success");
                setProposingPriceId(null);
                setTempPrice("");
                fetchQuotes();
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour", "error");
        }
    };

    const handleCreateDelivery = async (quoteId: string) => {
        try {
            const res = await createDeliveryFromQuote(quoteId);
            if (res.statusCode === 201) {
                addNotification("Livraison initialisée avec succès !", "success");
                fetchQuotes(); // Refresh to show delivery link if any
            }
        } catch (error) {
            addNotification("Erreur lors de l'initialisation de la livraison", "error");
        }
    };


    const handleEdit = (quote: Quote) => {
        setEditingQuote(quote);
        setIsManualModalOpen(true);
    };

    const handleNegotiate = async (quote: Quote) => {

        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour négocier", "error");
            router.push("/login");
            return;
        }

        const currentUserId = getUserId();
        const participant2Id = role === "CLIENT" ? quote.receiverId : quote.senderId;

        if (!participant2Id) {
            addNotification("Impossible d'identifier l'interlocuteur.", "error");
            return;
        }

        if (currentUserId === participant2Id) {
            addNotification("Vous ne pouvez pas négocier avec vous-même.", "warning");
            return;
        }

        setIsNegotiating(prev => ({ ...prev, [quote.id]: true }));
        try {
            const res = await createChatConversation({
                participant2Id: participant2Id,
            });

            if (res.statusCode === 200 || res.statusCode === 201) {
                const transportLabel = quote.transportType;
                const initialMessage = role === "CLIENT" ? `Bonjour, je souhaiterais discuter de votre proposition pour mon devis #${quote.id.slice(0, 8)} (${transportLabel}).` : `Bonjour, j'ai bien reçu votre demande de devis #${quote.id.slice(0, 8)} (${transportLabel}). Discutons des détails.`;
                sessionStorage.setItem("pending_negotiation", JSON.stringify({
                    conversationId: res.data.id,
                    message: initialMessage,
                    quoteId: quote.id
                }));

                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch (error) {
            console.error("Negotiation error:", error);
            addNotification("Une erreur est survenue", "error");
        } finally {
            setIsNegotiating(prev => ({ ...prev, [quote.id]: false }));
        }
    };

    const handleAttachmentClick = (quote: Quote) => {
        const images = quote.images || [];
        const files = (quote as any).files || [];

        // Prioritize images for modal preview
        const firstImage = images[0];
        const firstFile = files[0];

        if (firstImage) {
            setPreviewImage(firstImage);
            setIsImageModalOpen(true);
        } else if (firstFile) {
            const isImg = firstFile.fileMimeType?.startsWith('image/');
            if (isImg) {
                setPreviewImage(firstFile.fileUrl);
                setIsImageModalOpen(true);
            } else {
                // PDF or other - open in new tab
                window.open(firstFile.fileUrl, '_blank');
            }
        }
    };

    if (loading && activeTab === "quotes") {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Icon icon="solar:refresh-bold-duotone" className="w-12 h-12 text-primary animate-spin" />
                <p className="font-bold text-muted-foreground uppercase tracking-widest text-[10px]">Chargement des devis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enterprise Tabs & Action Header */}
            {role === "ENTREPRISE" && (
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-card/50 backdrop-blur-md p-2 rounded-[2.5rem] border border-border/50 sticky top-4 z-40 shadow-xl shadow-black/5">

                    <div className="flex p-1.5 bg-muted/50 rounded-[2rem] w-full md:w-auto h-14">
                        <button onClick={() => setActiveTab("quotes")} className={`flex-1 md:flex-none px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "quotes" ? "bg-background text-primary shadow-lg shadow-black/5" : "text-muted-foreground hover:text-foreground"}`} >
                            Mes Devis
                        </button>
                        <button onClick={() => setActiveTab("clients")} className={`flex-1 md:flex-none px-8 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "clients" ? "bg-background text-primary shadow-lg shadow-black/5" : "text-muted-foreground hover:text-foreground"}`} >
                            Mes Clients
                        </button>
                    </div>

                    <button
                        disabled={checkLoading}
                        onClick={async () => {
                            const canAction = await checkEligibility('LogisticService');
                            if (canAction) {
                                setIsManualModalOpen(true);
                            }
                        }}
                        className="w-full md:w-auto h-14 bg-primary text-white pl-6 pr-8 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group disabled:opacity-50" >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
                            {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" /> : <Icon icon="solar:add-circle-bold" className="w-5 h-5" />}
                        </div>
                        Créer un devis
                    </button>

                </div>
            )}

            {activeTab === "clients" && role === "ENTREPRISE" ? (
                <ClientsManager />
            ) : (
                <div className="space-y-4">
                    {quotes.length > 0 ? (
                        quotes.map((quote) => {

                            const status = STATUS_CONFIG[quote.status];
                            const isEnterprise = role === "ENTREPRISE";
                            const isClient = role === "CLIENT";

                            // Permissions
                            const canEnterpriseAction = isEnterprise && (
                                (!quote.prestataireId && quote.receiverId === currentUserId) || (quote.prestataireId === currentUserId)
                            );
                            const canClientAction = isClient && quote.senderId === currentUserId;

                            return (
                                <div key={quote.id} className="bg-card hover:bg-muted/20 border border-border rounded-3xl p-5 transition-all group shadow-sm hover:shadow-md">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Left Side: Info */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${status.color}`}>
                                                    <Icon icon={status.icon} className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-black text-foreground uppercase tracking-tight">
                                                            Devis #{quote.id.slice(0, 8)}
                                                        </h4>

                                                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase  tracking-wider ${status.color}`}>
                                                            {status.label}
                                                        </span>

                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                                                        {new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>

                                                </div>
                                            </div>


                                            {/* Route Info */}
                                            <div className="flex items-center gap-4 py-2">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Icon icon="solar:map-point-wave-bold-duotone" className="text-emerald-500 w-4 h-4" />
                                                    <div className="w-0.5 h-6 bg-border border-dashed border-l" />
                                                    <Icon icon="solar:map-point-bold-duotone" className="text-primary w-4 h-4" />
                                                </div>
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Départ</p>
                                                        <p className="text-xs font-medium text-foreground line-clamp-1">{quote.departureAddress}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">Arrivée</p>
                                                        <p className="text-xs font-medium text-foreground line-clamp-1">{quote.arrivalAddress}</p>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {/* ajouter le bouton de modification enfion de la permission */}
                                                        {canEnterpriseAction && (
                                                            <Button onClick={() => handleEdit(quote)} disabled={quote.status !== QuoteStatus.PENDING && quote.status !== QuoteStatus.PROPOSED} size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-primary hover:bg-primary/5">
                                                                <Icon icon="solar:pen-bold" className="w-5 h-5" />
                                                            </Button>
                                                        )}

                                                        {canClientAction && (
                                                            <Button onClick={() => handleEdit(quote)} disabled={quote.status !== QuoteStatus.PENDING && quote.status !== QuoteStatus.PROPOSED} size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-primary hover:bg-primary/5">
                                                                <Icon icon="solar:pen-bold" className="w-5 h-5" />
                                                            </Button>
                                                        )}


                                                        {((quote.images && quote.images.length > 0) || ((quote as any).files && (quote as any).files.length > 0)) && (
                                                            <button onClick={() => handleAttachmentClick(quote)} className="flex items-center justify-center p-1 rounded-lg bg-primary/5 text-primary hover:bg-primary/10 transition-colors" title="Voir les pièces jointes" >
                                                                <Icon icon="solar:paperclip-bold-duotone" className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center: Details */}
                                        <div className="px-6 border-l border-border/50 hidden lg:block space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Icon icon="solar:box-bold-duotone" className="w-4 h-4" />
                                                <span>{quote.volume || 0} m³ / {quote.weight || 0} kg</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                <Icon icon="solar:plain-bold-duotone" className="w-4 h-4" />
                                                <span className="uppercase">{quote.transportType}</span>
                                            </div>
                                            {quote.montantTransac && (
                                                <div className="flex items-center gap-2 text-primary font-black pt-1">
                                                    <Icon icon="solar:tag-price-bold-duotone" className="w-4 h-4" />
                                                    <span className="text-sm">{quote.montantTransac.toLocaleString()} FCFA</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Side: Actions */}
                                        <div className="flex items-center gap-2 md:pl-6 md:border-l border-border/50">
                                            {(canEnterpriseAction && (quote.status === QuoteStatus.PENDING || quote.status === QuoteStatus.PROPOSED)) && (
                                                <div className="flex flex-col gap-2">
                                                    {proposingPriceId === quote.id ? (
                                                        <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
                                                            <input type="number" placeholder="Prix (FCFA)" value={tempPrice} onChange={(e) => setTempPrice(e.target.value)} className="w-28 h-10 px-3 rounded-xl border border-primary/30 bg-background text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary shadow-inner" autoFocus />
                                                            <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-emerald-500 hover:bg-emerald-50" onClick={() => handleUpdateStatus(quote.id, QuoteStatus.PROPOSED, parseFloat(tempPrice))} disabled={!tempPrice || isNaN(parseFloat(tempPrice))}>
                                                                <Icon icon="solar:check-read-bold" className="w-5 h-5" />
                                                            </Button>
                                                            <Button size="sm" variant="ghost" className="rounded-xl h-10 w-10 p-0 text-red-500 hover:bg-red-50" onClick={() => { setProposingPriceId(null); setTempPrice(""); }}>
                                                                <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="rounded-xl h-10 bg-primary hover:bg-secondary text-white font-black text-[10px] gap-2 px-6 shadow-lg shadow-primary/20 disabled:opacity-50"
                                                                disabled={checkLoading}
                                                                onClick={async () => {
                                                                    const canAction = await checkEligibility('LogisticService');
                                                                    if (canAction) {
                                                                        setProposingPriceId(quote.id);
                                                                        if (quote.montantTransac) setTempPrice(quote.montantTransac.toString());
                                                                    }
                                                                }}>
                                                                {checkLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : null}
                                                                {quote.status === QuoteStatus.PROPOSED ? "MODIFIER LE PRIX" : "PROPOSER UN PRIX"}
                                                            </Button>

                                                            {quote.status === QuoteStatus.PROPOSED && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl h-10 border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] gap-2 disabled:opacity-50"
                                                                    disabled={isNegotiating[quote.id] || checkLoading}
                                                                    onClick={async () => {
                                                                        const canAction = await checkEligibility('LogisticService');
                                                                        if (canAction) {
                                                                            handleNegotiate(quote);
                                                                        }
                                                                    }} >
                                                                    {isNegotiating[quote.id] || checkLoading ? (
                                                                        <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" />
                                                                    ) : (
                                                                        <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4" />
                                                                    )}
                                                                    DISCUTER
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {canClientAction && quote.status === QuoteStatus.PROPOSED && (
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex gap-2">
                                                        <Button size="sm" className="rounded-xl h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] gap-2 px-6 shadow-lg shadow-emerald-500/20" onClick={() => handleUpdateStatus(quote.id, QuoteStatus.ACCEPTED)} >
                                                            ACCEPTER
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="rounded-xl h-10 border-red-100 text-red-500 hover:bg-red-50 font-black text-[10px] px-4" onClick={() => handleUpdateStatus(quote.id, QuoteStatus.REJECTED)} >
                                                            REFUSER
                                                        </Button>
                                                    </div>
                                                    <Button variant="outline" size="sm" className="rounded-xl h-10 border-primary/20 text-primary hover:bg-primary/5 font-black text-[10px] gap-2" onClick={() => handleNegotiate(quote)} disabled={isNegotiating[quote.id]} >
                                                        {isNegotiating[quote.id] ? (
                                                            <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" />
                                                        ) : (
                                                            <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4" />
                                                        )}
                                                        DISCUTER LA PROPOSITION
                                                    </Button>
                                                </div>
                                            )}

                                            {canEnterpriseAction && quote.status === QuoteStatus.ACCEPTED && !quote.delivery && (
                                                <Button size="sm" className="rounded-xl h-10 bg-primary hover:bg-secondary text-white font-black text-[10px] gap-2 px-6 shadow-lg shadow-primary/20" onClick={() => handleCreateDelivery(quote.id)} >
                                                    <Icon icon="solar:delivery-bold-duotone" className="w-4 h-4" />
                                                    INITIALISER LIVRAISON
                                                </Button>
                                            )}

                                            {quote.delivery && (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[9px] font-black text-emerald-500 uppercase mb-1">Livraison en cours</span>
                                                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg text-emerald-600 text-[10px] font-black">
                                                        TRK: {quote.delivery.trackingCode}
                                                    </div>
                                                </div>
                                            )}

                                            {quote.status === QuoteStatus.REJECTED && (
                                                <span className="text-[10px] font-black text-red-500 uppercase opacity-50 italic px-4">Refusé</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mobile expansion for description or details */}
                                    <div className="mt-4 pt-4 border-t border-border/30">
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">   "{quote.description}"  </p>

                                        {role === "ENTREPRISE" && quote.sender && (
                                            <div className="mt-3 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                        {quote.sender.fullName.charAt(0)}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-foreground/80 uppercase tracking-tighter">
                                                        Client: {quote.sender.fullName}
                                                    </span>
                                                </div>
                                                <a href={`mailto:${quote.sender.email}`} className="text-[10px] text-primary font-bold hover:underline">
                                                    CONTACTER CLIENT
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            );
                        })
                    ) : (
                        <div className="bg-card/30 border border-dashed border-border rounded-3xl py-20 flex flex-col items-center justify-center text-center px-6">
                            <Icon icon="solar:document-text-bold-duotone" className="w-16 h-16 text-muted-foreground/30 mb-4" />
                            <h3 className="font-black text-foreground/70 uppercase mb-2">Aucun devis</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {role === "CLIENT" ? "Vous n'avez pas encore fait de demande de devis." : "Vous n'avez reçu aucun devis pour le moment."}
                            </p>
                        </div>
                    )}
                </div>
            )}

            <ManualQuoteModal
                isOpen={isManualModalOpen}
                initialData={editingQuote}
                onClose={() => {
                    setIsManualModalOpen(false);
                    setEditingQuote(null);
                }}
                onSuccess={() => {
                    fetchQuotes();
                    setActiveTab("quotes");
                }}
            />

            {/* Image Preview Modal */}
            {isImageModalOpen && previewImage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsImageModalOpen(false)} >
                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsImageModalOpen(false)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted transition-colors shadow-xl" >
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6" />
                        </button>

                        <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl bg-card">
                            <img src={previewImage} alt="Aperçu" className="w-full h-full object-contain max-h-[80vh]" />
                        </div>

                        <div className="mt-4 flex gap-4">
                            <a href={previewImage} download className="h-12 px-8 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2" >
                                <Icon icon="solar:download-bold-duotone" className="w-5 h-5" />
                                Télécharger
                            </a>
                            <button onClick={() => setIsImageModalOpen(false)} className="h-12 px-8 bg-background border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all" >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
