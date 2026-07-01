"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Annonce, AnnonceStatus } from "@/types/interface";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useRouter, useParams } from "next/navigation";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation, getAnnonceById } from "@/api/api";
import ReportButton from "@/components/shared/ReportButton";
import { Share } from "@/components/shared/Share";
import TextDisplayBox from "@/components/home/TextDisplayBox";
import BookingModal from "@/components/bookings/modals/BookingModal";

const annonceStatusConfig: Record<AnnonceStatus, { label: string; color: string }> = {
    [AnnonceStatus.ACTIVE]: { label: "Active", color: "bg-emerald-500/10 text-emerald-600" },
    [AnnonceStatus.DRAFT]: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
    [AnnonceStatus.EXPIRED]: { label: "Expirée", color: "bg-red-500/10 text-red-500" },
    [AnnonceStatus.SOLD]: { label: "Vendue", color: "bg-amber-500/10 text-amber-600" },
    [AnnonceStatus.CANCELLED]: { label: "Annulée", color: "bg-red-500/10 text-red-500" },
};

function fmtDate(d?: string) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AnnonceDetailPage() {
    const params = useParams();
    const id = params.id as string;

    const [annonce, setAnnonce] = useState<Annonce | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isContacting, setIsContacting] = useState(false);
    const touchStartX = useRef<number>(0);

    const { addNotification } = useNotification();
    const router = useRouter();

    const resolveImages = (a: Annonce | null) => {
        if (!a) return [];
        if (a.files && a.files.length > 0) return a.files.map(f => f.fileUrl).filter(Boolean);
        if (a.imageUrls && a.imageUrls.length > 0) return a.imageUrls;
        if (a.images && a.images.length > 0) return a.images;
        return [];
    };

    const imagesList = resolveImages(annonce);

    const fetchAnnonce = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getAnnonceById(id);
            if (res.statusCode === 200 && res.data) setAnnonce(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchAnnonce(); }, [fetchAnnonce]);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => (p + 1) % imagesList.length);
    };
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentImageIndex(p => (p - 1 + imagesList.length) % imagesList.length);
    };

    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextImage() : prevImage();
    };

    const handleContact = async () => {
        if (!annonce) return;
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour contacter", "error");
            router.push("/login");
            return;
        }
        const currentUserId = getUserId();
        const ownerId = annonce.user?.id || annonce.userId;
        if (currentUserId === ownerId) {
            addNotification("Vous ne pouvez pas vous contacter vous-même", "warning");
            return;
        }
        setIsContacting(true);
        try {
            const participant2Id = annonce.user?.id || annonce.userId;
            if (!participant2Id) { addNotification("Impossible d'identifier l'annonceur.", "error"); return; }
            const res = await createChatConversation({ participant2Id });
            if (res.statusCode === 200 || res.statusCode === 201) {
                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch { addNotification("Une erreur est survenue", "error"); }
        finally { setIsContacting(false); }
    };

    const handleDemande = () => {
        if (!annonce) return;
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour faire une demande", "error");
            router.push("/login");
            return;
        }
        const currentUserId = getUserId();
        const ownerId = annonce.user?.id || annonce.userId;
        if (currentUserId === ownerId) {
            addNotification("Vous ne pouvez pas faire une demande sur votre propre annonce", "warning");
            return;
        }
        setIsBookingOpen(true);
    };

    // ── SKELETON ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <div className="md:hidden flex flex-col min-h-dvh">
                    <div className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur-md border-b border-border">
                        <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                        <div className="flex gap-2">
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                        </div>
                    </div>
                    <div className="h-[46vh] bg-muted animate-pulse" />
                    <div className="p-4 space-y-4 flex-1">
                        <div className="h-8 w-32 rounded-full bg-muted animate-pulse" />
                        <div className="h-5 w-3/4 rounded-full bg-muted animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-6 w-24 rounded-full bg-muted animate-pulse" />
                            <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
                        </div>
                        <div className="h-16 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-12 rounded-2xl bg-muted animate-pulse" />
                        <div className="h-24 rounded-2xl bg-muted animate-pulse" />
                        <div className="grid grid-cols-2 gap-2">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                        </div>
                    </div>
                </div>
                <div className="hidden md:block w-full max-w-4xl mx-auto px-4 py-6">
                    <div className="bg-card overflow-hidden">
                        <div className="h-14 flex items-center justify-between px-6 border-b border-border">
                            <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                            <div className="h-4 w-48 rounded-full bg-muted animate-pulse" />
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="h-[420px] bg-muted animate-pulse" />
                            <div className="p-6 space-y-4">
                                <div className="flex gap-2">
                                    <div className="h-6 w-32 rounded-full bg-muted animate-pulse" />
                                    <div className="h-6 w-20 rounded-full bg-muted animate-pulse" />
                                </div>
                                <div className="h-7 w-3/4 rounded-full bg-muted animate-pulse" />
                                <div className="h-10 w-36 rounded-full bg-muted animate-pulse" />
                                <div className="h-20 rounded-2xl bg-muted animate-pulse" />
                                <div className="h-16 rounded-2xl bg-muted animate-pulse" />
                                <div className="grid grid-cols-2 gap-2">
                                    {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
                                </div>
                            </div>
                        </div>
                        <div className="h-16 border-t border-border px-6 flex items-center gap-3">
                            <div className="h-10 w-28 rounded-2xl bg-muted animate-pulse" />
                            <div className="flex-1 h-10 rounded-2xl bg-muted animate-pulse" />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!annonce) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <Icon icon="solar:tag-bold-duotone" width={64} className="opacity-30" />
                <p className="font-black text-lg">Annonce introuvable</p>
                <button onClick={() => router.back()} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-black text-sm">
                    Retour
                </button>
            </div>
        );
    }

    const statusCfg = annonceStatusConfig[annonce.status] || { label: annonce.status, color: "bg-muted text-muted-foreground" };

    // ── IMAGE CAROUSEL ──────────────────────────────────────────────────
    const ImageCarousel = ({ className = "" }: { className?: string }) => (
        <div className={`relative overflow-hidden bg-muted/20 ${className}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <AnimatePresence mode="wait">
                {imagesList.length > 0 ? (
                    <motion.div key={currentImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-30 scale-110" alt="" aria-hidden />
                        <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain z-10 p-3 cursor-zoom-in" alt={`${annonce.title} - ${currentImageIndex + 1}`} onClick={() => setLightboxOpen(true)} />
                    </motion.div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                        <Icon icon="solar:tag-bold-duotone" width={80} />
                    </div>
                )}
            </AnimatePresence>
            {imagesList.length > 1 && (
                <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                        <Icon icon="solar:alt-arrow-left-bold" width={16} />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                        <Icon icon="solar:alt-arrow-right-bold" width={16} />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                        {imagesList.slice(0, 8).map((_, idx) => (
                            <button key={idx} onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }} className={`rounded-full transition-all duration-300 ${currentImageIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );

    // ── PROVIDER CARD ────────────────────────────────────────────────────
    const ProviderCard = () => (
        <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-2">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden shrink-0 ring-2 ring-primary/20">
                    {annonce.user?.avatar ? (
                        <Image src={annonce.user.avatar} alt={annonce.user.fullName || "Annonceur"} fill className="object-cover" unoptimized />
                    ) : (
                        <Icon icon="solar:user-bold-duotone" className="w-7 h-7 text-primary" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Annonceur</p>
                    <p className="text-sm font-black truncate">{annonce.user?.fullName || annonce.companyName || "—"}</p>
                    {annonce.user?.phone && (
                        <p className="text-xs text-muted-foreground">{annonce.user.indicatif || ""} {annonce.user.phone}</p>
                    )}
                </div>
            </div>
        </div>
    );

    // ── PRICE SECTION ─────────────────────────────────────────────────────
    const PriceSection = () => annonce.price ? (
        <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-emerald-600 leading-none">
                {annonce.price.toLocaleString()} <span className="text-base">FCFA</span>
            </span>
        </div>
    ) : null;

    // ── SPECS ─────────────────────────────────────────────────────────────
    const Specs = () => (
        <div className="grid grid-cols-2 gap-2">
            {annonce.type && (
                <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Type</p>
                    <p className="text-xs font-black truncate">{annonce.type.label}</p>
                </div>
            )}
            <div className="p-3 bg-muted/50 rounded-xl">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Statut</p>
                <p className={`text-xs font-black ${statusCfg.color.split(" ")[1]}`}>{statusCfg.label}</p>
            </div>
            {(annonce.categorie || (annonce.categories && annonce.categories.length > 0)) && (
                <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Catégorie</p>
                    <p className="text-xs font-black truncate">
                        {annonce.categorie?.label || annonce.categories?.[0]?.label || "—"}
                    </p>
                </div>
            )}
            {annonce.ville && (
                <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Ville</p>
                    <p className="text-xs font-black truncate">{annonce.ville}</p>
                </div>
            )}
            {annonce.startDate && (
                <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Début</p>
                    <p className="text-xs font-black">{fmtDate(annonce.startDate)}</p>
                </div>
            )}
            {annonce.endDate && (
                <div className="p-3 bg-muted/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Fin</p>
                    <p className="text-xs font-black">{fmtDate(annonce.endDate)}</p>
                </div>
            )}
        </div>
    );

    // ── EXTRAS (fiche technique, équipements, etc.) ────────────────────
    const Extras = () => (
        <div className="space-y-4">
            {annonce.vehicleType && (
                <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Type de véhicule</p>
                    <p className="text-sm font-black">{annonce.vehicleType.name}</p>
                </div>
            )}
            {annonce.realEstateOption && (
                <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Option immobilière</p>
                    <p className="text-sm font-black">{annonce.realEstateOption.name}</p>
                </div>
            )}
            {annonce.options && annonce.options.length > 0 && (
                <div>
                    <p className="text-xs font-black uppercase text-muted-foreground mb-2">Options</p>
                    <div className="flex flex-wrap gap-1.5">
                        {annonce.options.map((opt, i) => (
                            <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg">{opt}</span>
                        ))}
                    </div>
                </div>
            )}
            {annonce.equipments && annonce.equipments.length > 0 && (
                <div>
                    <p className="text-xs font-black uppercase text-muted-foreground mb-2">Équipements</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {annonce.equipments.map((eq, i) => (
                            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold ${eq.isAvailable ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                                <Icon icon={eq.isAvailable ? "solar:check-circle-bold" : "solar:close-circle-bold"} width={14} />
                                {eq.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {annonce.technicalSheets && annonce.technicalSheets.length > 0 && (
                <div>
                    <p className="text-xs font-black uppercase text-muted-foreground mb-2">Fiche technique</p>
                    <div className="space-y-1">
                        {annonce.technicalSheets.map((ts, i) => (
                            <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/40 last:border-0">
                                <span className="text-xs text-muted-foreground font-medium">{ts.key}</span>
                                <span className="text-xs font-black">{ts.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const hasExtras = !!(
        annonce.vehicleType ||
        annonce.realEstateOption ||
        (annonce.options && annonce.options.length > 0) ||
        (annonce.equipments && annonce.equipments.length > 0) ||
        (annonce.technicalSheets && annonce.technicalSheets.length > 0)
    );

    // ── ACTION FOOTER ─────────────────────────────────────────────────────
    const ActionFooter = ({ className = "" }: { className?: string }) => (
        <div className={`flex gap-3 ${className}`}>
            <button onClick={handleContact} disabled={isContacting}
                className="py-3 px-5 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all flex items-center gap-2 border border-border shrink-0">
                {isContacting ? <Icon icon="line-md:loading-twotone-loop" width={18} /> : <Icon icon="solar:chat-round-dots-bold-duotone" width={18} className="text-primary" />}
                <span className="hidden md:inline">Contacter</span>
            </button>
            <button onClick={handleDemande}
                className="flex-1 py-3 px-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                <Icon icon="solar:document-add-bold-duotone" width={18} />
                Faire une demande
            </button>
        </div>
    );

    return (
        <>
            {/* ══════════════════════ MOBILE ══════════════════════ */}
            <div className="md:hidden flex flex-col min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white">
                <div className="sticky top-0 z-50 h-14 flex items-center justify-between px-4 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-[#EEF1F4] dark:border-zinc-800">
                    <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent transition">
                        <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                    </button>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsShareOpen(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                            <Icon icon="solar:share-bold-duotone" width={18} />
                        </button>
                        <ReportButton entityType="ANNONCE" entityId={annonce.id} />
                    </div>
                </div>

                <div className="relative w-full" style={{ height: "46vh" }}>
                    <ImageCarousel className="h-full" />
                </div>

                <div className="flex-1 px-4 pt-4 pb-32 space-y-4">
                    <div className="space-y-1">
                        {annonce.price ? <PriceSection /> : null}
                        <h1 className="text-lg font-black leading-snug">{annonce.title}</h1>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {annonce.type && (
                            <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                {annonce.type.label}
                            </span>
                        )}
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${statusCfg.color}`}>
                            {statusCfg.label}
                        </span>
                    </div>
                    {annonce.user && <ProviderCard />}
                    <button onClick={handleContact} disabled={isContacting}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-accent border border-border font-black text-sm transition active:scale-95">
                        {isContacting ? <Icon icon="line-md:loading-twotone-loop" width={18} /> : <Icon icon="solar:chat-round-dots-bold-duotone" width={18} className="text-primary" />}
                        Contacter l&apos;annonceur
                    </button>
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-muted-foreground">Description</p>
                        <TextDisplayBox text={annonce.description || "Aucune description disponible."} expandable isHtml />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-muted-foreground">Détails</p>
                        <Specs />
                    </div>
                    {hasExtras && (
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase text-muted-foreground">Informations complémentaires</p>
                            <Extras />
                        </div>
                    )}
                    <div className="flex justify-end pb-2">
                        <ReportButton entityType="ANNONCE" entityId={annonce.id} />
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-[#EEF1F4] dark:border-zinc-800">
                    <button onClick={handleDemande}
                        className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                        <Icon icon="solar:document-add-bold-duotone" width={18} />
                        Faire une demande
                    </button>
                </div>
            </div>

            {/* ══════════════════════ DESKTOP ══════════════════════ */}
            <div className="hidden md:block w-full max-w-4xl mx-auto px-4 py-6">
                <div className="bg-card overflow-hidden">
                    <div className="h-14 flex items-center justify-between px-6 bg-card">
                        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted hover:bg-accent transition">
                            <Icon icon="solar:alt-arrow-left-bold-duotone" width={18} />
                        </button>
                        <h2 className="text-sm font-black truncate max-w-[50%]">{annonce.title}</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIsShareOpen(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                <Icon icon="solar:share-bold-duotone" width={18} />
                            </button>
                            <ReportButton entityType="ANNONCE" entityId={annonce.id} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2">
                        {/* Gauche : images */}
                        <div className="flex flex-col bg-muted/20">
                            <div className="relative w-full overflow-hidden" style={{ height: 420 }}>
                                <AnimatePresence mode="wait">
                                    {imagesList.length > 0 ? (
                                        <motion.div key={currentImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute inset-0">
                                            <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-30 scale-110" alt="" aria-hidden />
                                            <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain z-10 p-4 cursor-zoom-in" alt={annonce.title} onClick={() => setLightboxOpen(true)} />
                                        </motion.div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                                            <Icon icon="solar:tag-bold-duotone" width={80} />
                                        </div>
                                    )}
                                </AnimatePresence>
                                {imagesList.length > 1 && (
                                    <>
                                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                                            <Icon icon="solar:alt-arrow-left-bold" width={16} />
                                        </button>
                                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                                            <Icon icon="solar:alt-arrow-right-bold" width={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                            {imagesList.length > 1 && (
                                <div className="flex gap-2 p-3 flex-wrap">
                                    {imagesList.slice(0, 6).map((img, idx) => (
                                        <button key={idx} onClick={() => setCurrentImageIndex(idx)}
                                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative ${currentImageIndex === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
                                            <Image src={img} fill unoptimized className="object-cover" alt="" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Droite : détails */}
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(420px+56px)]">
                            <div className="flex items-center gap-2 flex-wrap">
                                {annonce.type && (
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                        {annonce.type.label}
                                    </span>
                                )}
                                <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${statusCfg.color}`}>
                                    {statusCfg.label}
                                </span>
                            </div>
                            <h1 className="text-2xl font-black leading-tight">{annonce.title}</h1>
                            {annonce.price ? <PriceSection /> : null}
                            {annonce.user && <ProviderCard />}
                            <TextDisplayBox text={annonce.description || "Aucune description disponible."} expandable isHtml />
                            <Specs />
                            {hasExtras && (
                                <div className="space-y-1">
                                    <p className="text-xs font-black uppercase text-muted-foreground">Informations complémentaires</p>
                                    <Extras />
                                </div>
                            )}
                            <div className="flex justify-end">
                                <ReportButton entityType="ANNONCE" entityId={annonce.id} />
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-card">
                        <ActionFooter />
                    </div>
                </div>
            </div>

            {/* ══════════════════════ LIGHTBOX ══════════════════════ */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center"
                        onClick={() => setLightboxOpen(false)}>
                        <button onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                            <Icon icon="solar:close-bold" width={20} />
                        </button>
                        {imagesList.length > 1 && (
                            <>
                                <button onClick={e => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-left-bold" width={20} />
                                </button>
                                <button onClick={e => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-right-bold" width={20} />
                                </button>
                            </>
                        )}
                        <motion.div key={currentImageIndex} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full h-full max-w-3xl max-h-[90vh] mx-4">
                            <Image src={imagesList[currentImageIndex]} fill unoptimized className="object-contain" alt={annonce.title} />
                        </motion.div>
                        {imagesList.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {imagesList.slice(0, 8).map((_, idx) => (
                                    <button key={idx} onClick={e => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                        className={`rounded-full transition-all ${currentImageIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30"}`} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <Share
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                url={`${process.env.NEXT_PUBLIC_BASE_URL}/annonce/${annonce.id}`}
                title={annonce.title}
                description={annonce.description || undefined}
                image={annonce.imageUrls?.[0] || annonce.files?.[0]?.fileUrl || undefined}
                price={annonce.price || undefined}
                storeName={annonce.user?.fullName || annonce.companyName || undefined}
                storeLogo={annonce.user?.avatar}
            />

            {isBookingOpen && (
                <BookingModal
                    isOpen={isBookingOpen}
                    onClose={() => setIsBookingOpen(false)}
                    item={annonce}
                    type="ANNONCE"
                />
            )}
        </>
    );
}
