"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Annonce } from "@/types/interface";
import { createPortal } from "react-dom";
import BookingModal from "./BookingModal";

interface AnnonceModalProps {
    isOpen: boolean;
    onClose: () => void;
    annonce: Annonce | null;
}

const getAnnonceType = (annonce: Annonce): 'reservation' | 'location' | 'vente' => {
    if (annonce.type?.slug === 'location') return 'location';
    if (annonce.type?.slug === 'vente') return 'vente';
    return 'reservation';
};

export default function AnnonceModal({ isOpen, onClose, annonce }: AnnonceModalProps) {
    const [mounted, setMounted] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setActiveImageIndex(0);
            setIsBookingModalOpen(false);
        }
    }, [isOpen]);

    if (!annonce || !mounted) return null;

    const imageGallery = (() => {
        const images: { url: string }[] = [];
        if (annonce.images && Array.isArray(annonce.images)) {
            annonce.images.forEach((url: string) => { if (url) images.push({ url }); });
        }
        if (images.length === 0) {
            images.push({ url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop' });
        }
        return images;
    })();

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

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]" />
                        <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-0 flex items-end md:items-center justify-center z-[1001]">
                            <motion.div className=" bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-3xl md:max-h-[88vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[90vh] md:h-auto pb-safe " initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                                {/* Drag Handle - Mobile only */}
                                <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden">
                                    <div className="w-12 h-1.5 bg-muted rounded-full" />
                                </div>

                                {/* Header */}
                                <div className="sticky top-0 z-50 px-6 md:px-8 py-4 md:py-6 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md shrink-0">
                                    <button onClick={onClose} className="p-2 md:p-3 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all active:scale-90 flex items-center justify-center" >
                                        <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                                    </button>

                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary md:hidden">
                                            {isSaleType ? <Icon icon="solar:cart-large-bold-duotone" className="w-6 h-6" /> : <Icon icon="solar:stars-bold-duotone" className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 block flex items-center gap-1">
                                                <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3" />
                                                {isSaleType ? 'Achat sécurisé' : 'Réservation premium'}
                                            </span>
                                            <h2 className="text-lg md:text-2xl font-black text-foreground line-clamp-1">
                                                {annonce.title}
                                            </h2>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 space-y-6 md:space-y-8">
                                    {/* Image Gallery */}
                                    {imageGallery.length > 0 && (
                                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-card shadow-xl group">
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={activeImageIndex}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    className="absolute inset-0"
                                                >
                                                    <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt={annonce.title} />
                                                </motion.div>
                                            </AnimatePresence>

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                            {/* Slider Controls */}
                                            {imageGallery.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length);
                                                        }}
                                                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-20"
                                                    >
                                                        <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveImageIndex((prev) => (prev + 1) % imageGallery.length);
                                                        }}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-20"
                                                    >
                                                        <Icon icon="solar:alt-arrow-right-bold" className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}

                                            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-10">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-white/90 text-[10px] font-black uppercase tracking-widest mb-1.5">
                                                        {isSaleType ? <Icon icon="solar:cart-large-bold-duotone" className="w-3.5 h-3.5" /> : <Icon icon="solar:shield-check-bold-duotone" className="w-3.5 h-3.5" />}
                                                        <span>{isSaleType ? 'Article en vente' : 'Service premium'}</span>
                                                    </div>
                                                    <h3 className="text-lg md:text-xl font-black text-white line-clamp-1 drop-shadow-lg">{annonce.title}</h3>
                                                </div>

                                                {/* Miniatures at bottom right */}
                                                {imageGallery.length > 1 && (
                                                    <div className="flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
                                                        {imageGallery.map((image, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveImageIndex(index);
                                                                }}
                                                                className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/10 opacity-50 hover:opacity-100'} `}>
                                                                <Image src={image.url} alt={`${annonce.title} - ${index + 1}`} fill unoptimized className="object-cover" />
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-10">
                                                <span className="text-[10px] font-black text-white tabular-nums tracking-widest">{activeImageIndex + 1} / {imageGallery.length}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="bg-muted/30 rounded-3xl p-5 border border-border">
                                        <h4 className="text-sm font-black text-foreground mb-3">Description</h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{annonce.description}</p>
                                        {annonce.options && annonce.options.length > 0 && (
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {annonce.options.map((option, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-card border border-border rounded-full text-[10px] font-black text-foreground/80 uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />{option}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info Card */}
                                    <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-3xl border border-border shadow-sm">
                                        <div className="flex-1">
                                            <p className="text-2xl font-black text-secondary">{annonce.price?.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">CFA</span></p>
                                            <div className="flex items-center gap-1.5 text-primary mt-1.5">
                                                <Icon icon="solar:shield-check-bold-duotone" className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 px-2 py-1 rounded-full">{isSaleType ? 'Vendeur vérifié' : 'Expert vérifié'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {isSaleType && (
                                        <div className="space-y-4">
                                            <div className="flex gap-3">
                                                <button className="flex-1 bg-primary text-white py-4 rounded-xl font-black shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                                    <Icon icon="solar:cart-large-bold-duotone" className="w-5 h-5" />
                                                    <span className="hidden sm:inline">Acheter maintenant</span>
                                                    <span className="sm:hidden">Acheter</span>
                                                </button>
                                                <button onClick={() => handleContact('whatsapp')} className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-green-600 transition-all">
                                                    <Icon icon="solar:chat-round-dots-bold-duotone" width={24} />
                                                </button>
                                                <button onClick={() => handleContact('phone')} className="w-14 h-14 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-600 transition-all">
                                                    <Icon icon="solar:phone-bold-duotone" width={24} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer for Booking */}
                                {isBookingType && (
                                    <div className="sticky bottom-0 z-50 p-6 md:p-8 bg-card border-t border-border">
                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:block flex-1">
                                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">Prix total</p>
                                                <p className="text-2xl font-black text-secondary">{annonce.price?.toLocaleString()} CFA</p>
                                            </div>
                                            <button onClick={() => setIsBookingModalOpen(true)} className="flex-1 sm:flex-none bg-primary text-white py-4 px-10 rounded-xl font-black shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                                <Icon icon="solar:calendar-date-bold-duotone" className="w-5 h-5" />
                                                Prendre rendez-vous
                                            </button>
                                            <div className="flex gap-2 sm:hidden">
                                                <button onClick={() => handleContact('whatsapp')} className="w-12 h-12 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-md">
                                                    <Icon icon="solar:chat-round-dots-bold-duotone" width={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
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