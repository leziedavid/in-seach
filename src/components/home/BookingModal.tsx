"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import FormsIntervention, { InterventionType } from "./FormsIntervention";
import { Service } from "@/types/interface";
import { createBooking } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import RichTextEditor from "../rich-text-editor";
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
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
    serviceId: string;
    interventionType: string;
    scheduledDate: string;
    scheduledTime: string;
    description?: string;
}

export default function BookingModal({ isOpen, onClose, service }: BookingModalProps) {
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

    if (!service || !mounted) return null;

    const imageGallery = (() => {
        const images: { url: string }[] = [];
        if (service.imageUrls && typeof service.imageUrls === 'string') images.push({ url: service.imageUrls });
        if (service.files && Array.isArray(service.files)) {
            service.files.forEach((file: any) => { if (file.url) images.push({ url: file.url }); });
        }
        if (images.length === 0) {
            images.push({ url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop' });
        }
        return images;
    })();

    const handleBooking = async () => {
        if (!interventionType || (interventionType === "rdv" && (!selectedDate || !selectedTime))) return;
        const payload: BookingPayload = {
            serviceId: service.id,
            interventionType: interventionType.toUpperCase(),
            scheduledDate: selectedDate,
            scheduledTime: selectedTime,
            description: getValues().description,
        };
        try {
            const res = await createBooking(payload);
            if (res.statusCode === 201) {
                showNotification(res.message, "success");
                onClose();
            } else {
                showNotification(res.message || "Erreur", "error");
            }
        } catch {
            showNotification("Erreur lors de la réservation", "error");
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
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 block">Réservation premium</span>
                                    <h2 className="text-lg md:text-2xl font-black text-foreground line-clamp-1">{service.title}</h2>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 space-y-6 md:space-y-8">
                                {/* Image Gallery */}
                                {imageGallery.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border-2 border-white shadow-xl">
                                            <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt={service.title} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white">{activeImageIndex + 1}/{imageGallery.length}</div>
                                        </div>
                                        {/* Miniatures */}
                                        {imageGallery.length > 1 && (
                                            <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:absolute md:right-4 md:top-32 md:w-20 md:max-h-96">
                                                {imageGallery.map((image, index) => (
                                                    <button key={index} onClick={() => setActiveImageIndex(index)}
                                                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary' : 'border-transparent opacity-70'} `} >
                                                        <Image src={image.url} alt={`${service.title} - ${index + 1}`} fill unoptimized className="object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-3 p-3 bg-muted/30 rounded-2xl border border-border">
                                    <div className="flex-1"><p className="text-xl md:text-2xl font-black text-secondary">{service.price} <span className="text-[10px] font-bold">CFA</span></p></div>
                                    <div className="text-right"><p className="text-[10px] text-muted-foreground font-bold uppercase">Catégorie</p><p className="text-sm font-black">{service.category?.label || 'Service'}</p></div>
                                </div>

                                <div className="bg-muted/50 p-4 md:p-6 rounded-3xl"><FormsIntervention onSelectionChange={setInterventionType} initialValue={interventionType} /></div>

                                {interventionType === "rdv" && (
                                    <div className="space-y-6 bg-card rounded-3xl p-5 border border-border ">
                                        <div className="space-y-3"><label className="text-sm font-black">Date souhaitée</label><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-3 rounded-xl bg-muted border-2" /></div>
                                        <div className="space-y-3"><label className="text-sm font-black">Créneau horaire</label><div className="grid grid-cols-3 md:grid-cols-4 gap-2">{TIME_SLOTS.map(slot => (<button key={slot} onClick={() => setSelectedTime(slot)} className={`py-2 rounded-xl border-2 text-xs font-black ${selectedTime === slot ? 'bg-secondary text-white' : 'bg-card'} `}>{slot}</button>))}</div></div>
                                    </div>
                                )}

                                {interventionType === "urgence" && (
                                    <div className="p-4 bg-red-500/10 border border-red-500/20 flex items-center gap-3 rounded-2xl">
                                        <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-red-500"><Icon icon="solar:bolt-bold-duotone" width={24} /></div>
                                        <div className="flex-1"><p className="text-sm font-black">Intervention immédiate</p><p className="text-xs font-bold">Dès {selectedTime}</p></div>
                                    </div>
                                )}

                                <div className="bg-card p-6 border rounded-3xl border-border ">
                                    <label className="text-xs font-black mb-3 block">Description détaillée</label>
                                    <Controller name="description" control={control} render={({ field }: { field: any }) => (<RichTextEditor content={field.value || ""} onChange={field.onChange} editable={true} />)} />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 z-50 p-6 md:p-8 bg-card  border-border">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1"><p className="text-2xl font-black">{service.frais} <span className="text-sm">CFA</span></p></div>
                                    <button onClick={handleBooking} className={`w-full md:w-auto py-4 px-8 rounded-xl font-black ${interventionType ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`} disabled={!interventionType}>Confirmer la réservation</button>
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