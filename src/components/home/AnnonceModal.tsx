"use client";
import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Annonce, AnnonceStatus, TechnicalSheet, Equipment } from "@/types/interface";
import { createPortal } from "react-dom";
import BookingModal from "./BookingModal";

interface AnnonceModalProps {
    isOpen: boolean;
    onClose: () => void;
    annonce: Annonce | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getAnnonceType = (annonce: Annonce): 'reservation' | 'location' | 'vente' => {
    if (annonce.type?.slug === 'location') return 'location';
    if (annonce.type?.slug === 'vente') return 'vente';
    return 'reservation';
};

const getCategoryInfo = (annonce: Annonce) => {
    const cats = annonce.categories || [];
    const isImmo = cats.some(c => c.slug?.includes('immo') || c.label?.toLowerCase().includes('immo') || c.label?.toLowerCase().includes('immobilier'));
    const isVehicule = cats.some(c => c.slug?.includes('vehicule') || c.label?.toLowerCase().includes('véhicule') || c.label?.toLowerCase().includes('voiture'));
    const isTerrain = cats.some(c => c.slug?.includes('terrain') || c.label?.toLowerCase().includes('terrain'));
    return { isImmo, isVehicule, isTerrain };
};

// ─── Sub-Components ──────────────────────────────────────────────────────────

const SectionHeader = ({ icon, title, subtitle }: { icon: string, title: string, subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon icon={icon} className="w-5 h-5" />
        </div>
        <div>
            <h4 className="text-sm font-black text-foreground uppercase tracking-tight">{title}</h4>
            {subtitle && <p className="text-[10px] font-bold text-muted-foreground uppercase">{subtitle}</p>}
        </div>
    </div>
);

const SpecItem = ({ label, value, icon }: { label: string, value: string | number | null | undefined, icon?: string }) => {
    if (value === null || value === undefined || value === "") return null;
    return (
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-2xl border border-border/50">
            {icon && <Icon icon={icon} className="w-6 h-6 text-primary shrink-0" />}
            <div className="min-w-0">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-black text-foreground truncate">{value}</p>
            </div>
        </div>
    );
};

export default function AnnonceModal({ isOpen, onClose, annonce }: AnnonceModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [showAllDescription, setShowAllDescription] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (!isOpen) {
            setActiveImageIndex(0);
            setIsBookingModalOpen(false);
            setShowAllDescription(false);
        }
    }, [isOpen]);

    const { isImmo, isVehicule, isTerrain } = useMemo(() => annonce ? getCategoryInfo(annonce) : { isImmo: false, isVehicule: false, isTerrain: false }, [annonce]);

    const images = useMemo(() => {
        const list = (annonce?.images || annonce?.imageUrls || []).filter(Boolean);
        return list.length > 0 ? list : ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'];
    }, [annonce]);

    if (!annonce || !mounted) return null;

    const annonceType = getAnnonceType(annonce);
    const isBookingType = annonceType === 'reservation' || annonceType === 'location';
    const isSaleType = annonceType === 'vente';

    const handleContact = (method: 'whatsapp' | 'phone') => {
        const phoneNumber = annonce.user?.phone || '+221000000000';
        if (method === 'whatsapp') {
            window.open(`https://wa.me/${phoneNumber}?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20votre%20annonce%20%3A%20${encodeURIComponent(annonce.title)}`, '_blank');
        } else {
            window.location.href = `tel:${phoneNumber}`;
        }
    };

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            [AnnonceStatus.ACTIVE]: "bg-green-500/10 text-green-600 border-green-500/20",
            [AnnonceStatus.SOLD]: "bg-secondary/10 text-secondary border-secondary/20",
            [AnnonceStatus.CANCELLED]: "bg-red-500/10 text-red-600 border-red-500/20",
            [AnnonceStatus.DRAFT]: "bg-muted text-muted-foreground border-border",
        };
        const labels: Record<string, string> = {
            [AnnonceStatus.ACTIVE]: "Disponible",
            [AnnonceStatus.SOLD]: "Vendu",
            [AnnonceStatus.CANCELLED]: "Annulée",
            [AnnonceStatus.DRAFT]: "Brouillon",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[status] || colors.ACTIVE}`}>
                {labels[status] || "Actif"}
            </span>
        );
    };

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[1000]" />
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-0 flex items-end md:items-center justify-center z-[1001] pointer-events-none"
                        >
                            <motion.div
                                className="bg-background shadow-2xl overflow-hidden flex flex-col md:w-[95%] md:max-w-5xl md:max-h-[92vh] md:rounded-[2.5rem] rounded-t-[2.5rem] w-full h-[95vh] md:h-auto pb-safe pointer-events-auto relative"
                                initial={{ scale: 0.95, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                            >
                                {/* HEADER CLOSE BUTTON */}
                                <div className="absolute top-4 right-4 z-[60]">
                                    <button onClick={onClose} className="p-3 bg-white/20 hover:bg-white/40 backdrop-blur-xl rounded-2xl text-white border border-white/20 transition-all active:scale-90 shadow-xl" >
                                        <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-hide">
                                    {/* ── GALLERY SECTION ────────────────────────────────────────── */}
                                    <div className="relative w-full h-[45vh] md:h-[60vh] group bg-muted overflow-hidden">
                                        <AnimatePresence mode="wait">
                                            <motion.div 
                                                key={activeImageIndex} 
                                                initial={{ opacity: 0, x: 20 }} 
                                                animate={{ opacity: 1, x: 0 }} 
                                                exit={{ opacity: 0, x: -20 }} 
                                                transition={{ duration: 0.4 }}
                                                className="absolute inset-0"
                                            >
                                                <Image src={images[activeImageIndex]} fill unoptimized className="object-cover" alt={annonce.title} priority />
                                            </motion.div>
                                        </AnimatePresence>
                                        
                                        {/* Overlays */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                                        {/* Navigation Arrows */}
                                        {images.length > 1 && (
                                            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between items-center z-10 pointer-events-none">
                                                <button 
                                                    onClick={prevImage}
                                                    className="p-4 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-2xl text-white border border-white/10 transition-all active:scale-90 shadow-2xl pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-0"
                                                >
                                                    <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-6 h-6" />
                                                </button>
                                                <button 
                                                    onClick={nextImage}
                                                    className="p-4 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-2xl text-white border border-white/10 transition-all active:scale-90 shadow-2xl pointer-events-auto opacity-0 group-hover:opacity-100 md:opacity-0"
                                                >
                                                    <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-6 h-6" />
                                                </button>
                                            </div>
                                        )}

                                        {/* Bottom Info Overlay */}
                                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 pointer-events-none">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {statusBadge(annonce.status)}
                                                    <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-wider border border-white/10">
                                                        {annonce.categorie?.label || 'Annonce'}
                                                    </span>
                                                    {images.length > 1 && (
                                                        <span className="px-2 py-1 bg-primary/20 backdrop-blur-md rounded-lg text-[9px] font-black text-primary uppercase tracking-wider border border-primary/20">
                                                            {activeImageIndex + 1} / {images.length}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="text-2xl md:text-5xl font-black text-white leading-tight drop-shadow-2xl max-w-2xl">
                                                    {annonce.title}
                                                </h2>
                                                <div className="flex items-center gap-2 text-white/80 mt-2 text-xs font-bold">
                                                    <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary" />
                                                    <span>Abidjan, Côte d'Ivoire</span>
                                                </div>
                                            </div>

                                            <div className="hidden md:flex flex-col items-end gap-3">
                                                <div className="bg-white/10 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/20 shadow-2xl text-right">
                                                    <p className="text-4xl font-black text-white">{annonce.price?.toLocaleString()} <span className="text-sm font-bold opacity-60 uppercase">CFA</span></p>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Prix Marketplace</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pagination Controls (Always visible on mobile) */}
                                        {images.length > 1 && (
                                            <div className="absolute top-1/2 right-6 -translate-y-1/2 flex flex-col gap-2 z-20">
                                                {images.slice(0, 8).map((_, idx) => (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => setActiveImageIndex(idx)} 
                                                        className={`w-1.5 rounded-full transition-all duration-500 ${activeImageIndex === idx ? "bg-primary h-8 ring-4 ring-primary/20" : "bg-white/30 hover:bg-white/60 h-1.5"}`} 
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* ── CONTENT BODY ────────────────────────────────────── */}
                                    <div className="p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-10">

                                        {/* Main Column */}
                                        <div className="lg:col-span-2 space-y-10">

                                            {/* Price Mobile Only */}
                                            <div className="md:hidden flex items-center justify-between p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                                                <div>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Prix de vente</p>
                                                    <p className="text-3xl font-black text-secondary">{annonce.price?.toLocaleString()} CFA</p>
                                                </div>
                                                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg">
                                                    <Icon icon="solar:tag-price-bold-duotone" className="w-6 h-6" />
                                                </div>
                                            </div>

                                            {/* Section: Overview Details */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {isVehicule ? (
                                                    <>
                                                        <SpecItem label="Marque/Modèle" value={annonce.technicalSheets?.find(s => s.key === "Modèle")?.value} icon="solar:wheel-bold-duotone" />
                                                        <SpecItem label="Carburant" value={annonce.technicalSheets?.find(s => s.key === "Carburant")?.value} icon="solar:gas-station-bold-duotone" />
                                                        <SpecItem label="Transmission" value={annonce.technicalSheets?.find(s => s.key === "Transmission")?.value} icon="solar:settings-bold-duotone" />
                                                    </>
                                                ) : isImmo && (
                                                    <>
                                                        <SpecItem label="Surface" value={annonce.technicalSheets?.find(s => s.key.includes("Surface"))?.value ? `${annonce.technicalSheets?.find(s => s.key.includes("Surface"))?.value} m²` : null} icon="solar:maximize-bold-duotone" />
                                                        <SpecItem label="Chambres" value={annonce.technicalSheets?.find(s => s.key.includes("chambre"))?.value} icon="solar:bed-bold-duotone" />
                                                        <SpecItem label="Pièces" value={annonce.technicalSheets?.find(s => s.key.includes("pièce"))?.value} icon="solar:home-2-bold-duotone" />
                                                    </>
                                                )}
                                                <SpecItem label="Type" value={annonce.type?.label} icon="solar:tag-bold-duotone" />
                                                {/* <SpecItem label="ID" value={annonce.id?.slice(-6).toUpperCase()} icon="solar:hashtag-bold-duotone" /> */}
                                            </div>

                                            {/* Section: Description */}
                                            <div className="space-y-4">
                                                <SectionHeader icon="solar:notes-bold-duotone" title="Description détaillée" />
                                                <div className={`text-md text-muted-foreground leading-relaxed transition-all relative ${!showAllDescription && "max-h-32 overflow-hidden"}`}>
                                                    <p dangerouslySetInnerHTML={{ __html: annonce.description }} className="whitespace-pre-line"></p>
                                                    {!showAllDescription && annonce.description.length > 200 && (
                                                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                                                    )}
                                                </div>
                                                {annonce.description.length > 200 && (
                                                    <button onClick={() => setShowAllDescription(!showAllDescription)} className="text-xs font-black text-primary uppercase tracking-widest hover:underline">
                                                        {showAllDescription ? "Réduire" : "Lire la suite"}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Section: Fiche Technique complète */}
                                            {annonce.technicalSheets && annonce.technicalSheets.length > 0 && (
                                                <div className="space-y-4">
                                                    <SectionHeader icon="solar:document-text-bold" title="Caractéristiques techniques" />
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {annonce.technicalSheets.map((ts, i) => (
                                                            <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40">
                                                                <span className="text-[12px] font-bold text-muted-foreground uppercase">{ts.key}</span>
                                                                <span className="text-sm font-black text-foreground">{ts.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Section: Équipements */}
                                            {annonce.equipments && annonce.equipments.some(e => e.isAvailable) && (
                                                <div className="space-y-4">
                                                    <SectionHeader icon="solar:checklist-bold-duotone" title="Équipements & Commodités" />
                                                    <div className="flex flex-wrap gap-2">
                                                        {annonce.equipments.filter(e => e.isAvailable).map((eq, i) => (
                                                            <span key={i} className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-xl text-xs font-bold text-primary flex items-center gap-2">
                                                                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
                                                                {eq.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Section: Localisation */}
                                            <div className="space-y-4">
                                                <SectionHeader icon="solar:map-point-bold-duotone" title="Emplacement" />
                                                <div className="relative h-48 rounded-3xl overflow-hidden border border-border shadow-inner bg-muted/40 group">
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                                                        <Icon icon="solar:map-bold-duotone" className="w-20 h-20 text-muted-foreground" />
                                                    </div>
                                                    <div className="absolute bottom-4 left-4 right-4 p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-border flex items-center justify-between shadow-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                                                                <Icon icon="solar:map-point-wave-bold-duotone" className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-xs font-black text-foreground uppercase tracking-tight">Abidjan, Côte d'Ivoire</span>
                                                        </div>
                                                        <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ouvrir Maps</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sidebar / Desktop Sticky Card */}
                                        <div className="hidden lg:block space-y-6">
                                            <div className="sticky top-10 space-y-6">
                                                {/* Contact Card */}
                                                <div className="bg-card rounded-[2.5rem] border border-border p-8 shadow-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150" />

                                                    <div className="flex items-center gap-4 mb-8">
                                                        <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center relative overflow-hidden ring-4 ring-primary/10">
                                                            {annonce.user?.fullName ? (
                                                                <span className="text-xl font-black text-foreground">{annonce.user.fullName[0]}</span>
                                                            ) : (
                                                                <Icon icon="solar:user-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-black text-foreground">{annonce.user?.fullName || 'Utilisateur'}</h5>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Membre vérifié</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        {isBookingType ? (
                                                            <button onClick={() => setIsBookingModalOpen(true)} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-[0_10px_20px_-5px_rgba(var(--primary-rgb),0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group">
                                                                <Icon icon="solar:calendar-mark-bold-duotone" className="w-6 h-6 animate-pulse" />
                                                                Réserver maintenant
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => handleContact('whatsapp')} className="w-full bg-secondary text-white py-4 rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                                                                <Icon icon="solar:chat-round-dots-bold-duotone" className="w-6 h-6" />
                                                                Contacter l'annonceur
                                                            </button>
                                                        )}

                                                        <div className="pt-2">
                                                            <button onClick={() => handleContact('phone')} className="w-full bg-blue-500/10 text-blue-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-500 hover:text-white transition-all">
                                                                <Icon icon="solar:phone-bold-duotone" className="w-4 h-4" />
                                                                Appeler l'annonceur
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Partager</span>
                                                            <div className="flex gap-2 mt-2">
                                                                <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary/20 transition-colors">
                                                                    <Icon icon="solar:share-bold-duotone" className="w-4 h-4 text-foreground" />
                                                                </button>
                                                                <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-pink-500/20 transition-colors">
                                                                    <Icon icon="solar:heart-bold-duotone" className="w-4 h-4 text-foreground" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sécurité</span>
                                                            <div className="flex items-center gap-1.5 text-green-500 mt-2 font-black text-[10px] uppercase">
                                                                <Icon icon="solar:verified-check-bold" className="w-3.5 h-3.5" />
                                                                Paiement sécurisé
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Safe Buy Alert */}
                                                <div className="p-5 bg-gradient-to-br from-amber-500/5 to-amber-500/10 rounded-[2rem] border border-amber-500/20">
                                                    <div className="flex gap-3">
                                                        <Icon icon="solar:shield-warning-bold-duotone" className="w-6 h-6 text-amber-500 shrink-0" />
                                                        <div>
                                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-tight mb-1">Conseil de sécurité</p>
                                                            <p className="text-[11px] font-medium text-amber-700/80 leading-relaxed">
                                                                Ne payez jamais avant d'avoir vu l'article ou le service. Restez vigilant face aux offres trop alléchantes.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Mobile Action Bar (Sticky) */}
                                <div className="md:hidden sticky bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border flex items-center gap-3 z-[70]">
                                    {isBookingType ? (
                                        <div className="flex w-full gap-3">
                                            <button onClick={() => setIsBookingModalOpen(true)} className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 text-sm">
                                                <Icon icon="solar:calendar-mark-bold-duotone" className="w-5 h-5" />
                                                Réserver
                                            </button>
                                            <button onClick={() => handleContact('phone')} className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                <Icon icon="solar:phone-bold-duotone" className="w-6 h-6" />
                                            </button>
                                            <button onClick={() => handleContact('whatsapp')} className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                <Icon icon="solar:chat-round-dots-bold-duotone" className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex w-full gap-3 items-center">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-secondary uppercase mb-0.5">{annonce.price?.toLocaleString()} CFA</p>
                                                <button onClick={() => handleContact('whatsapp')} className="w-full bg-secondary text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                                                    <Icon icon="solar:chat-round-dots-bold-duotone" className="w-4 h-4" />
                                                    WhatsApp
                                                </button>
                                            </div>
                                            <button onClick={() => handleContact('phone')} className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                                <Icon icon="solar:phone-bold-duotone" className="w-6 h-6" />
                                            </button>
                                        </div>
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
