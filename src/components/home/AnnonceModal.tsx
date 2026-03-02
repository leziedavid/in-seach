"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Icon } from "@iconify/react";
import FormsIntervention, { InterventionType } from "./FormsIntervention";
import { Annonce } from "@/types/interface";
import { createPortal } from "react-dom";

interface AnnonceModalProps {
    isOpen: boolean;
    onClose: () => void;
    annonce: Annonce | null;
}

const generateTimeSlots = (startHour = 8, endHour = 19) => {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
    }
    slots.push(`${endHour.toString().padStart(2, "0")}:00`);
    return slots;
};

const getAnnonceType = (annonce: Annonce): 'reservation' | 'location' | 'vente' => {
    if (annonce.type?.slug === 'location') return 'location';
    if (annonce.type?.slug === 'vente') return 'vente';
    return 'reservation';
};

export default function AnnonceModal({ isOpen, onClose, annonce }: AnnonceModalProps) {
    const [mounted, setMounted] = useState(false);
    const [interventionType, setInterventionType] = useState<InterventionType>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const timeSlots = generateTimeSlots();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setInterventionType(null);
            setSelectedDate("");
            setSelectedTime("");
            setActiveImageIndex(0);
            setQuantity(1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (interventionType === "urgence") {
            const now = new Date();
            const targetTime = new Date(now.getTime() + 60 * 60 * 1000);
            const targetHour = targetTime.getHours();
            const targetTotalMinutes = targetHour * 60 + targetTime.getMinutes();
            const startDayMinutes = 8 * 60;
            const endDayMinutes = 19 * 60;
            let finalDate = new Date(targetTime);
            let finalTime = "08:00";

            if (targetTotalMinutes > endDayMinutes || targetTotalMinutes < startDayMinutes) {
                if (targetTotalMinutes > endDayMinutes) {
                    finalDate.setDate(finalDate.getDate() + 1);
                }
                finalTime = "08:00";
            } else {
                const nearestSlot = timeSlots.find(slot => {
                    const [h, m] = slot.split(":").map(Number);
                    return (h * 60 + m) >= targetTotalMinutes;
                }) || "08:00";
                finalTime = nearestSlot;
            }
            setSelectedDate(finalDate.toISOString().split("T")[0]);
            setSelectedTime(finalTime);
        }
    }, [interventionType, timeSlots]);

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
                                    <div className="space-y-3">
                                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                                            <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt={annonce.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <div className="flex items-center gap-2 text-white/90 text-xs font-bold uppercase tracking-wider mb-2">
                                                    {isSaleType ? <Icon icon="solar:cart-large-bold-duotone" className="w-3.5 h-3.5" /> : <Icon icon="solar:shield-check-bold-duotone" className="w-3.5 h-3.5" />}
                                                    <span>{isSaleType ? 'Article en vente' : 'Service premium'}</span>
                                                </div>
                                                <h3 className="text-xl md:text-2xl font-black text-white line-clamp-2 drop-shadow-lg">{annonce.title}</h3>
                                            </div>
                                            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                <span className="text-xs font-bold text-white">{activeImageIndex + 1}/{imageGallery.length}</span>
                                            </div>
                                        </div>
                                        {/* Miniatures */}
                                        {imageGallery.length > 1 && (
                                            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:absolute md:right-4 md:top-32 md:w-20 md:max-h-96 p-1 md:p-0">
                                                {imageGallery.map((image, index) => (
                                                    <button key={index} onClick={() => setActiveImageIndex(index)}
                                                        className={`flex-shrink-0 w-16 h-16 md:w-full md:h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary' : 'border-transparent opacity-70'} `} >
                                                        <Image src={image.url} alt={`${annonce.title} - ${index + 1}`} fill unoptimized className="object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
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

                                {isBookingType && (
                                    <>
                                        <div className="bg-muted rounded-3xl p-4 md:p-6 border border-border">
                                            <FormsIntervention onSelectionChange={setInterventionType} initialValue={interventionType} />
                                        </div>
                                        {interventionType === "rdv" && (
                                            <div className="space-y-6 bg-card rounded-3xl p-5 md:p-6 border border-border">
                                                <div className="space-y-3">
                                                    <label className="text-sm font-black text-foreground flex items-center gap-2">Date souhaitée</label>
                                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-4 rounded-2xl bg-muted border-2 border-border" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-sm font-black text-foreground">Créneau horaire</label>
                                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                        {timeSlots.map(slot => (
                                                            <button key={slot} onClick={() => setSelectedTime(slot)} className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${selectedTime === slot ? 'bg-secondary border-secondary text-white' : 'bg-card border-border'} `}>{slot}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {interventionType === "urgence" && (
                                            <div className="p-6 bg-destructive/10 rounded-3xl border-2 border-destructive flex items-center gap-4 text-destructive">
                                                <div className="w-14 h-14 bg-card rounded-2xl flex items-center justify-center"><Icon icon="solar:bolt-bold-duotone" className="w-7 h-7" /></div>
                                                <div className="flex-1"><p className="text-base font-black">Intervention immédiate</p><p className="text-xs font-bold">Disponible dès {selectedTime}</p></div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {isSaleType && (
                                    <div className="space-y-4">
                                        <div className="bg-card rounded-xl p-4 border border-border">
                                            <label className="text-sm font-black mb-3 block">Quantité</label>
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-muted">-</button>
                                                <span className="flex-1 text-center text-2xl font-black">{quantity}</span>
                                                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-muted">+</button>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="flex-1 bg-primary text-white py-4 rounded-xl font-black">Acheter</button>
                                            <button onClick={() => handleContact('whatsapp')} className="w-14 h-14 bg-green-500 text-white rounded-xl flex items-center justify-center"><Icon icon="solar:chat-round-dots-bold-duotone" width={24} /></button>
                                            <button onClick={() => handleContact('phone')} className="w-14 h-14 bg-blue-500 text-white rounded-xl flex items-center justify-center"><Icon icon="solar:phone-bold-duotone" width={24} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {isBookingType && (
                                <div className="sticky bottom-0 z-50 p-6 md:p-8 bg-card border-t border-border">
                                    <div className="flex flex-col md:flex-row items-center gap-4">
                                        <div className="flex-1">
                                            <p className="text-2xl font-black">{annonce.price?.toLocaleString()} CFA</p>
                                        </div>
                                        <button className={`w-full md:w-auto py-4 px-8 rounded-xl font-black ${interventionType ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`} disabled={!interventionType}>Confirmer la réservation</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}