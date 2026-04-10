"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import FormsIntervention, { InterventionType } from "./FormsIntervention";
import { Service, Annonce } from "@/types/interface";
import { createBooking, updateBooking } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import RichTextEditor from "../rich-text-editor";
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";
import { Booking, BookingsCalendar } from "@/types/interface";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Service | Annonce;
    type: 'SERVICE' | 'ANNONCE';
    booking?: Booking | BookingsCalendar | null;
    mode?: 'create' | 'edit';
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

const TIME_SLOTS = generateTimeSlots();

interface BookingPayload {
    serviceId?: string;
    annonceId?: string;
    bookingType: string;
    interventionType: string;
    scheduledDate: string;
    scheduledTime: string;
    description?: string;
}

export default function BookingModal({ isOpen, onClose, item, type, booking, mode = 'create' }: BookingModalProps) {
    const [mounted, setMounted] = useState(false);
    const { control, formState: { errors }, getValues, reset: resetForm } = useForm({
        defaultValues: { description: "" }
    });

    const [interventionType, setInterventionType] = useState<InterventionType>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const { showNotification } = useNotification();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setInterventionType(null);
            setSelectedDate("");
            setSelectedTime("");
            setActiveImageIndex(0);
            resetForm({ description: "" });
        } else if (mode === 'edit' && booking) {
            setInterventionType(booking.interventionType?.toLowerCase() as InterventionType || null);
            if (booking.scheduledDate) {
                const date = new Date(booking.scheduledDate);
                setSelectedDate(date.toISOString().split("T")[0]);
            }
            setSelectedTime(booking.scheduledTime || "");
            resetForm({ description: booking.description || "" });
        }
    }, [isOpen, resetForm, mode, booking]);

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
                if (targetTotalMinutes > endDayMinutes) finalDate.setDate(finalDate.getDate() + 1);
                finalTime = "08:00";
            } else {
                const nearestSlot = TIME_SLOTS.find(slot => {
                    const [h, m] = slot.split(":").map(Number);
                    return (h * 60 + m) >= targetTotalMinutes;
                }) || "08:00";
                finalTime = nearestSlot;
            }
            setSelectedDate(finalDate.toISOString().split("T")[0]);
            setSelectedTime(finalTime);
        }
    }, [interventionType]);

    if (!item || !mounted) return null;

    const imageGallery = (() => {
        const images: { url: string }[] = [];
        if (item.imageUrls && Array.isArray(item.imageUrls)) {
            item.imageUrls.forEach(url => images.push({ url }));
        } else if (item.imageUrls && typeof item.imageUrls === 'string') {
            images.push({ url: item.imageUrls });
        }

        if (item.files && Array.isArray(item.files)) {
            item.files.forEach((file: any) => {
                if (file.url) images.push({ url: file.url });
            });
        }
        if (images.length === 0) {
            images.push({ url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop' });
        }
        return images;
    })();

    const handleBooking = async () => {
        if (!interventionType || (interventionType === "rdv" && (!selectedDate || !selectedTime))) return;
        // Combine date and time into a full ISO string for the backend
        let isoScheduledDate = selectedDate;
        if (selectedDate && selectedTime) {
            try {
                const [hours, minutes] = selectedTime.split(':').map(Number);
                const dateObj = new Date(selectedDate);
                dateObj.setHours(hours, minutes, 0, 0);
                isoScheduledDate = dateObj.toISOString();
            } catch (e) {
                console.error("Error formatting date:", e);
            }
        }

        const payload: any = {
            bookingType: type,
            interventionType: interventionType.toUpperCase(),
            scheduledDate: isoScheduledDate,
            scheduledTime: selectedTime,
            description: getValues().description,
        };

        if (mode === 'create') {
            if (type === 'SERVICE') {
                payload.serviceId = item.id;
            } else {
                payload.annonceId = item.id;
            }
        }

        try {
            const res = mode === 'create' 
                ? await createBooking(payload)
                : await updateBooking((booking as any).id, payload);

            if (res.statusCode === 201 || res.statusCode === 200) {
                showNotification(res.message || (mode === 'create' ? "Réservation réussie" : "Réservation mise à jour"), "success");
                onClose();
            } else {
                showNotification(res.message || "Erreur", "error");
            }
        } catch {
            showNotification(`Erreur lors de la ${mode === 'create' ? 'réservation' : 'mise à jour'}`, "error");
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
                            <div className="sticky top-0 z-50 px-6 md:px-8 py-4 md:py-6 flex items-center gap-3 border-b border-border bg-gradient-to-r from-card to-muted/50 backdrop-blur-md shrink-0">
                                <button onClick={onClose} className="p-2 md:p-3 bg-muted hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all active:scale-90 flex items-center justify-center" >
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 block">
                                        {mode === 'edit' ? 'Modification' : 'Réservation'} {type === 'SERVICE' ? 'Service' : 'Annonce'}
                                    </span>
                                    <h2 className="text-lg md:text-2xl font-black text-foreground line-clamp-1">{item.title}</h2>
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
                                                <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt={item.title} />
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
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30"
                                                >
                                                    <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex((prev) => (prev + 1) % imageGallery.length);
                                                    }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30"
                                                >
                                                    <Icon icon="solar:alt-arrow-right-bold" className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-20">
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] mb-1 block drop-shadow-md">
                                                    {type === 'SERVICE' ? 'Service Premium' : 'Annonce Vérifiée'}
                                                </span>
                                                <h3 className="text-lg md:text-xl font-black text-white line-clamp-1 drop-shadow-lg">{item.title}</h3>
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
                                                            className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/10 opacity-50 hover:opacity-100'} `}
                                                        >
                                                            <Image src={image.url} alt={`${item.title} - ${index + 1}`} fill unoptimized className="object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                                            <span className="text-[10px] font-black text-white tabular-nums tracking-widest">{activeImageIndex + 1} / {imageGallery.length}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 p-3 bg-muted/30 rounded-2xl border border-border">
                                    <div className="flex-1">
                                        <p className="text-xl md:text-2xl font-black text-secondary">
                                            {item.price ? `${item.price.toLocaleString()} CFA` : 'Prix sur demande'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Catégorie</p>
                                        <p className="text-sm font-black">
                                            {((item as any).category?.label || (item as any).categorie?.label || (item as any).type?.label) || 'Détails'}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted/50 p-4 md:p-6 rounded-3xl">
                                    <FormsIntervention onSelectionChange={setInterventionType} initialValue={interventionType} />
                                </div>

                                {interventionType === "rdv" && (
                                    <div className="space-y-6 bg-card rounded-3xl p-5 border border-border ">
                                        <div className="space-y-3">
                                            <label className="text-sm font-black">Date souhaitée</label>
                                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-3 rounded-xl bg-muted border-2" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-black">Créneau horaire</label>
                                            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                {TIME_SLOTS.map(slot => (
                                                    <button key={slot} onClick={() => setSelectedTime(slot)} className={`py-2 rounded-xl border-2 text-xs font-black ${selectedTime === slot ? 'bg-secondary text-white' : 'bg-card'} `}>
                                                        {slot}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {interventionType === "urgence" && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 rounded-2xl">
                                        <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-red-500">
                                            <Icon icon="solar:bolt-bold-duotone" width={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black">Intervention immédiate</p>
                                            <p className="text-xs font-bold">Dès {selectedTime}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-card p-6 border rounded-3xl border-border ">
                                    <label className="text-xs font-black mb-3 block">Description détaillée</label>
                                    <Controller name="description" control={control} render={({ field }: { field: any }) => (
                                        <RichTextEditor content={field.value || ""} onChange={field.onChange} editable={true} />
                                    )} />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 z-50 p-6 md:p-8 bg-card border-border">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-2xl font-black">
                                            {('frais' in item ? item.frais : 0) || 0} <span className="text-sm">CFA (Frais)</span>
                                        </p>
                                    </div>
                                    <button onClick={handleBooking} className={`w-full md:w-auto py-4 px-8 rounded-xl font-black ${interventionType ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`} disabled={!interventionType}>
                                        {mode === 'edit' ? 'Enregistrer les modifications' : 'Confirmer la réservation'}
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}