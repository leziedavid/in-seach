"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { LogisticService, TransportType } from "@/types/interface";
import { createPortal } from "react-dom";
import { useNotification } from "@/components/toast/NotificationProvider";
import { useRouter } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation } from "@/api/api";

interface LogisticsServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: LogisticService | null;
    onRequestQuote?: (service: LogisticService) => void;
}

const TRANSPORT_TYPE_LABELS: Record<TransportType, { label: string; icon: string; color: string }> = {
    [TransportType.MARITIME]: { label: "Maritime", icon: "solar:ship-bold-duotone", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10" },
    [TransportType.AERIEN]: { label: "Aérien", icon: "solar:plain-bold-duotone", color: "text-sky-600 bg-sky-50 dark:bg-sky-500/10" },
    [TransportType.HORS_GABARIT]: { label: "Hors Gabarit", icon: "solar:truck-bold-duotone", color: "text-orange-600 bg-orange-50 dark:bg-orange-500/10" },
    [TransportType.SANTE]: { label: "Santé", icon: "solar:hospital-bold-duotone", color: "text-red-600 bg-red-50 dark:bg-red-500/10" },
    [TransportType.LOGISTIQUE_STOCKAGE]: { label: "Stockage", icon: "solar:box-bold-duotone", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    [TransportType.DOUANE]: { label: "Douane", icon: "solar:shield-user-bold-duotone", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10" },
};

export default function LogisticsServiceDetailModal({ isOpen, onClose, service, onRequestQuote }: LogisticsServiceDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const { addNotification } = useNotification();
    const router = useRouter();
    const [isNegotiating, setIsNegotiating] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!service || !mounted) return null;

    const transportInfo = TRANSPORT_TYPE_LABELS[service.transportType] || TRANSPORT_TYPE_LABELS[TransportType.MARITIME];

    const handleNegotiate = async () => {
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour négocier", "error");
            router.push("/login");
            return;
        }

        const currentUserId = getUserId();
        // const ownerId = service.company?.id; // Assuming company object has an id or link to user
        const ownerId = service.companyId; // Assuming company object has an id or link to user

        if (currentUserId === ownerId) {
            addNotification("Vous ne pouvez pas négocier votre propre service", "warning");
            return;
        }

        setIsNegotiating(true);
        try {
            const participant2Id = service.companyId;

            if (!participant2Id) {
                addNotification("Impossible d'identifier prestataire.", "error");
                return;
            }

            const res = await createChatConversation({
                participant2Id: participant2Id,
            });

            if (res.statusCode === 200 || res.statusCode === 201) {
                const initialMessage = `Bonjour, je suis intéressé par votre service logistique "${service.label}" (${transportInfo.label}). Pouvons-nous en discuter ?`;

                sessionStorage.setItem("pending_negotiation", JSON.stringify({
                    conversationId: res.data.id,
                    message: initialMessage,
                    serviceId: service.id
                }));

                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch (error) {
            console.error("Negotiation error:", error);
            addNotification("Une erreur est survenue", "error");
        } finally {
            setIsNegotiating(false);
        }
    };

    const handleQuoteRequest = () => {
        onClose();
        if (onRequestQuote) onRequestQuote(service);
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none">
                        <motion.div className="bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-3xl md:max-h-[85vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[85vh] md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 bg-muted rounded-full" /></div>

                            <div className="flex-1 overflow-y-auto">
                                <div className="grid md:grid-cols-2 gap-0 md:gap-6">
                                    {/* Image Section */}
                                    <div className="relative aspect-square md:aspect-auto md:h-full bg-muted min-h-[300px]">
                                        {service.images?.[0]?.url ? (
                                            <Image src={service.images[0].url} fill className="object-cover" alt={service.label} unoptimized />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                                <Icon icon="solar:delivery-bold-duotone" width={80} />
                                            </div>
                                        )}
                                        <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white transition hover:bg-black/40">
                                            <Icon icon="solar:alt-arrow-left-bold-duotone" width={24} />
                                        </button>
                                    </div>

                                    {/* Details Section */}
                                    <div className="p-6 md:p-8 space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${transportInfo.color}`}>
                                                    {transportInfo.label}
                                                </span>
                                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-full">Disponible</span>
                                            </div>

                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-black text-card-foreground leading-tight">{service.label}</h2>
                                                <p className="text-sm font-medium text-muted-foreground mt-2 italic">Transport Professionnel & Sécurisé</p>
                                            </div>

                                            {service.company && (
                                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                                        <Icon icon="solar:buildings-bold-duotone" width={20} />
                                                    </div>
                                                    <div>
                                                        {/* <pre>{JSON.stringify(service.company, null, 2)}</pre> */}
                                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Entreprise</p>
                                                        <p className="text-sm font-black">{service.company.companyName || service.company.fullName}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <h3 className="text-xs font-black uppercase text-muted-foreground px-1">Description du service</h3>
                                            <div className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-4 rounded-xl border border-border/50" dangerouslySetInnerHTML={{ __html: service.description || "Aucune description détaillée disponible." }}>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Type</p>
                                                <p className="text-xs font-black truncate">{transportInfo.label}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-xl">
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">Expertise</p>
                                                <p className="text-xs font-black">Vérifiée</p>
                                            </div>
                                            {service.company?.email && (
                                                <div className="p-3 bg-muted/50 rounded-xl col-span-2 sm:col-span-1">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Email</p>
                                                    <p className="text-xs font-black truncate">{service.company.email}</p>
                                                </div>
                                            )}
                                            {service.company?.phone && (
                                                <div className="p-3 bg-muted/50 rounded-xl col-span-2 sm:col-span-1">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Téléphone</p>
                                                    <p className="text-xs font-black truncate">{service.company.phone}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                                <button onClick={handleNegotiate} disabled={isNegotiating} className="flex-1 py-4 px-6 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
                                    {isNegotiating ? (
                                        <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    ) : (
                                        <Icon icon="solar:chat-round-dots-bold-duotone" width={20} />
                                    )}
                                    Discuter
                                </button>
                                <button onClick={handleQuoteRequest} className="flex-[2] py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <Icon icon="solar:document-bold-duotone" width={20} />
                                    Demander un devis
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
