"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Annonce } from "@/types/interface";
import { createPortal } from "react-dom";
import { useNotification } from "@/components/notifications/NotificationProvider";
import BookingModal from "@/components/bookings/modals/BookingModal";
import TextDisplayBox from "./TextDisplayBox";
import { useTranslation } from "@/utils/langue/hooks";
import ReportButton from "@/components/shared/ReportButton";
import { hasValidPrice } from "@/utils/price";

interface AnnonceModalProps {
    isOpen: boolean;
    onClose: () => void;
    annonce: Annonce | null;
}

export default function AnnonceModal({ isOpen, onClose, annonce }: AnnonceModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const { t } = useTranslation();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !annonce) return null;
    const images = annonce.images && annonce.images.length > 0 ? annonce.images : (annonce.imageUrls && annonce.imageUrls.length > 0 ? annonce.imageUrls : []);
    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleContact = (type: 'whatsapp' | 'phone') => {
        const phone = annonce.user?.phone?.replace(/\D/g, '') || '';
        const indicatif = annonce.user?.indicatif || '';
        const message = `Bonjour, je suis intéressé par votre annonce "${annonce.title}" sur Djamko.`;
        if (type === 'whatsapp') {
            window.open(`https://wa.me/${indicatif}${phone}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
            window.location.href = `tel:+${indicatif}${phone}`;
        }
    };

    const statusBadge = (status: string) => {
        const config: Record<string, { label: string; color: string; icon: string }> = {
            'ACTIVE': { label: 'Active', color: 'bg-emerald-500', icon: 'solar:check-circle-bold' },
            'PENDING': { label: 'En attente', color: 'bg-amber-500', icon: 'solar:clock-circle-bold' },
            'SOLD': { label: 'Vendu', color: 'bg-blue-500', icon: 'solar:tag-bold' },
        };
        const s = config[status] || config['ACTIVE'];
        return (
            <div className={`flex items-center gap-1.5 px-3 py-1 ${s.color} text-white rounded-full text-[10px] font-black uppercase tracking-wider`}>
                <Icon icon={s.icon} className="w-3 h-3" />
                {s.label}
            </div>
        );
    };

    const isVehicule = annonce.categorie?.slug?.includes('vehicule') || annonce.categorie?.label?.toLowerCase().includes('auto');
    const isImmo = annonce.categorie?.slug?.includes('immobilier') || annonce.categorie?.label?.toLowerCase().includes('immo');
    const isBookingType = isImmo || annonce.type?.label?.toLowerCase().includes('location');

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]" />
                        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none">
                            <motion.div className="bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white overflow-hidden flex flex-col md:w-[90%] md:max-w-5xl md:max-h-[90vh] md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] rounded-none w-full h-dvh md:h-auto pb-safe pointer-events-auto" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >

                                <div className="flex-1 overflow-y-auto">
                                    <div className="grid md:grid-cols-2 gap-0 md:gap-x-6 md:[grid-template-areas:'gallery_top''bottom_top'] md:[grid-template-columns:1fr_1fr] md:[grid-template-rows:auto_1fr]">
                                        {/* Left Column: Gallery Section */}
                                        <div className="md:[grid-area:gallery]md:h-full">
                                            <div className="relative aspect-square w-full overflow-hidden group bg-muted/40">

                                                <AnimatePresence mode="wait">
                                                    <motion.div key={activeImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="absolute inset-0" >
                                                        {/* Blurred Ambient Background */}
                                                        {/* <Image src={images[activeImageIndex]} fill unoptimized className="object-cover blur-3xl opacity-40 scale-110" alt="" aria-hidden="true" /> */}
                                                        {/* Main Content Image */}
                                                        <Image src={images[activeImageIndex]} fill unoptimized className="object-contain relative z-10 p-4" alt={annonce.title} priority />
                                                    </motion.div>
                                                </AnimatePresence>

                                                <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white transition hover:bg-black/40 z-30">
                                                    <Icon icon="solar:alt-arrow-left-bold-duotone" width={24} />
                                                </button>

                                                {images.length > 1 && (
                                                    <>
                                                        <div className="absolute inset-y-0 left-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                            <button onClick={prevImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition">
                                                                <Icon icon="solar:alt-arrow-left-bold" width={20} />
                                                            </button>
                                                        </div>
                                                        <div className="absolute inset-y-0 right-0 flex items-center p-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                                            <button onClick={nextImage} className="p-1.5 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition">
                                                                <Icon icon="solar:alt-arrow-right-bold" width={20} />
                                                            </button>
                                                        </div>

                                                        {/* Vertical Dots Overlay */}
                                                        <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col gap-2 z-30">
                                                            {images.slice(0, 8).map((_, idx) => (
                                                                <button key={idx} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(idx); }}
                                                                    className={`w-1.5 rounded-full transition-all duration-500 ${activeImageIndex === idx ? "bg-primary h-8 ring-4 ring-primary/20" : "bg-white/30 hover:bg-white/60 h-1.5"}`}
                                                                />
                                                            ))}
                                                        </div>
                                                    </>
                                                )}

                                            </div>
                                        </div>

                                        {/* Right Column: Top Details Section */}
                                        <div className="md:[grid-area:top] p-6 md:p-8 space-y-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {statusBadge(annonce.status)}
                                                        <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-full">
                                                            {annonce.categorie?.label || 'Annonce'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                                            <Icon icon="solar:heart-bold-duotone" width={20} />
                                                        </button>
                                                        <button className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                                                            <Icon icon="solar:share-bold-duotone" width={20} />
                                                        </button>
                                                        <ReportButton entityType="ANNONCE" entityId={annonce.id} />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h2 className="text-2xl md:text-4xl font-black text-card-foreground leading-tight">{annonce.title}</h2>
                                                    <div className="flex items-center gap-2 text-muted-foreground mt-2 text-xs font-black uppercase tracking-tight">
                                                        <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary" />
                                                        <span>Abidjan, Côte d'Ivoire</span>
                                                    </div>
                                                    {hasValidPrice(annonce.price) && (
                                                        <div className="mt-4">
                                                            <p className="text-3xl font-black text-primary">{annonce.price.toLocaleString()} <span className="text-sm">FCFA</span></p>
                                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1 italic">Prix Marketplace</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {annonce.user && (
                                                    <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-2xl border border-border/50">
                                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary relative overflow-hidden">
                                                            {annonce.user.fullName ? <span className="text-lg font-black">{annonce.user.fullName[0]}</span> : <Icon icon="solar:user-bold-duotone" width={24} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Annonceur</p>
                                                            <p className="text-sm font-black">{annonce.user.fullName || "Utilisateur"}</p>
                                                            <p className="text-[9px] font-bold text-green-500 uppercase">Membre vérifié</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Dynamic Specs based on Category */}
                                            <div className="grid grid-cols-2 gap-3">
                                                {isVehicule ? (
                                                    <>
                                                        <div className="p-3 bg-muted/50 rounded-xl">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Modèle</p>
                                                            <p className="text-xs font-black truncate">{annonce.technicalSheets?.find(s => s.key === "Modèle")?.value || "N/A"}</p>
                                                        </div>
                                                        <div className="p-3 bg-muted/50 rounded-xl">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Énergie</p>
                                                            <p className="text-xs font-black truncate">{annonce.technicalSheets?.find(s => s.key === "Carburant")?.value || "N/A"}</p>
                                                        </div>
                                                    </>
                                                ) : isImmo && (
                                                    <>
                                                        <div className="p-3 bg-muted/50 rounded-xl">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Surface</p>
                                                            <p className="text-xs font-black truncate">{annonce.technicalSheets?.find(s => s.key.includes("Surface"))?.value || "N/A"} m²</p>
                                                        </div>
                                                        <div className="p-3 bg-muted/50 rounded-xl">
                                                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Chambres</p>
                                                            <p className="text-xs font-black truncate">{annonce.technicalSheets?.find(s => s.key.includes("chambre"))?.value || "N/A"}</p>
                                                        </div>
                                                    </>
                                                )}
                                                <div className="p-3 bg-muted/50 rounded-xl">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Type</p>
                                                    <p className="text-xs font-black truncate">{annonce.type?.label || "Offre"}</p>
                                                </div>
                                                <div className="p-3 bg-muted/50 rounded-xl">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">Expertise</p>
                                                    <p className="text-xs font-black truncate">Vérifiée</p>
                                                </div>
                                            </div>

                                            {/* Description moved back to right column */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Description</h3>
                                                <TextDisplayBox text={annonce.description || "Aucune description détaillée."} expandable={true} isHtml={true} />
                                            </div>

                                            {/* Safety Tips (Right Column on Desktop) */}
                                            <div className="p-5 bg-amber-500/5 rounded-3xl border border-amber-500/10">
                                                <div className="flex gap-3">
                                                    <Icon icon="solar:shield-warning-bold-duotone" className="w-6 h-6 text-amber-500 shrink-0" />
                                                    <div>
                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Conseil de sécurité</p>
                                                        <p className="text-[11px] font-medium text-amber-700/70 leading-relaxed">
                                                            Ne payez jamais à l'avance. Rencontrez toujours le vendeur dans un lieu public et vérifiez l'article avant tout paiement.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Details Section (Under Gallery on Desktop) */}
                                        {/* <pre>{JSON.stringify(annonce.equipments, null, 2)}</pre> */}

                                        <div className="md:[grid-area:bottom] p-6 md:p-8 md:pt-0 space-y-8">
                                            {/* Equipments Section */}
                                            {isImmo && annonce.equipments && annonce.equipments.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Équipements</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {annonce.equipments.map((eq, i) => (
                                                            <div key={i} className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${eq.isAvailable ? 'bg-primary/5 text-primary border-primary/20' : 'bg-muted text-muted-foreground/50 border-border opacity-50'}`}>
                                                                <Icon icon={eq.isAvailable ? "solar:check-circle-bold" : "solar:close-circle-bold"} className="w-4 h-4" />
                                                                {eq.name}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Technical Sheet Grid if exists */}
                                            {annonce.technicalSheets && annonce.technicalSheets.length > 2 && (
                                                <div className="space-y-3">
                                                    <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Fiche Technique</h3>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {annonce.technicalSheets.slice(0, 8).map((ts, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-xl border border-border/30">
                                                                <span className="text-[10px] font-bold text-muted-foreground uppercase">{t(ts.key as any)}</span>
                                                                <span className="text-xs font-black">{t(ts.value as any)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Location Preview (Left Column on Desktop) */}
                                            <div className="space-y-3">
                                                <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Emplacement</h3>
                                                <div className="relative h-40 rounded-2xl overflow-hidden border border-border bg-muted/40 flex items-center justify-center">
                                                    <Icon icon="solar:map-bold-duotone" className="w-12 h-12 text-muted-foreground/30" />
                                                    <div className="absolute bottom-3 left-3 right-3 p-2.5 bg-background/90 backdrop-blur-md rounded-xl border border-border flex items-center justify-between shadow-lg">
                                                        <span className="text-[10px] font-black uppercase tracking-tight">Abidjan, Côte d'Ivoire</span>
                                                        <button className="text-[9px] font-black text-primary uppercase tracking-widest">Ouvrir</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="sticky bottom-0 p-6 bg-[#FBFAF6] dark:bg-zinc-900 border-t border-[#EEF1F4] dark:border-zinc-800 flex flex-col md:flex-row gap-3">
                                    <div className="flex flex-1 gap-3">
                                        {/* <button onClick={() => handleContact('whatsapp')} className="flex-1 py-4 px-6 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
                                            <Icon icon="solar:chat-round-dots-bold-duotone" width={20} className="text-green-500" />
                                            WhatsApp
                                        </button> */}
                                        <button onClick={() => handleContact('phone')} className="flex-1 py-4 px-6 bg-muted hover:bg-accent text-card-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2">
                                            <Icon icon="solar:phone-bold-duotone" width={20} className="text-blue-500" />
                                            Appeler
                                        </button>
                                    </div>
                                    {isBookingType ? (
                                        <button onClick={() => setIsBookingModalOpen(true)} className="flex-1 py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                                            <Icon icon="solar:calendar-mark-bold-duotone" width={20} />
                                            Réserver maintenant
                                        </button>
                                    ) : (
                                        <button onClick={() => handleContact('whatsapp')} className="flex-1 py-4 px-6 bg-secondary hover:bg-secondary/90 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2">
                                            <Icon icon="solar:chat-round-dots-bold-duotone" width={20} />
                                            WhatsApp
                                        </button>
                                    )}
                                </div>

                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <BookingModal
                isOpen={isBookingModalOpen}
                onClose={() => setIsBookingModalOpen(false)}
                item={annonce}
                type="ANNONCE"
            />
        </>,
        document.body
    );
}
