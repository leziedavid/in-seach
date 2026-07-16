"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import FormsInterventionAnnonce, { InterventionType } from "@/components/bookings/forms/FormsInterventionAnnonce";
import { Annonce } from "@/types/interface";
import { createBooking, updateBooking, checkAnnonceAvailability } from "@/api/api";
import ReportButton from "@/components/shared/ReportButton";
import { useNotification } from "@/components/notifications/NotificationProvider";
import dynamic from 'next/dynamic';
const RichTextEditor = dynamic(() => import("@/components/ui/editor"), { ssr: false, loading: () => <div className="min-h-[200px] border rounded-lg animate-pulse bg-muted" /> });
const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});
import { useForm, Controller } from "react-hook-form";
import { createPortal } from "react-dom";
import { Booking, BookingsCalendar } from "@/types/interface";
import { hasValidPrice } from "@/utils/price";
import { useTranslation } from "@/utils/langue/hooks";

interface AnnonceBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: Annonce;
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

// Construit l'ISO envoyé au backend (identique pour la vérification et la création).
const buildIso = (date: string, time: string): string => {
    if (date && time) {
        try {
            const [hours, minutes] = time.split(":").map(Number);
            const dateObj = new Date(date);
            dateObj.setHours(hours, minutes, 0, 0);
            return dateObj.toISOString();
        } catch {
            return date;
        }
    }
    return date;
};

interface AvailabilityState {
    checking: boolean;
    available: boolean | null;
    message?: string;
    mode?: string;
    autoSelected?: boolean;
}

export default function AnnonceBookingModal({ isOpen, onClose, item, booking, mode = 'create' }: AnnonceBookingModalProps) {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const { control, getValues, reset: resetForm } = useForm({
        defaultValues: { description: "" }
    });

    const [interventionType, setInterventionType] = useState<InterventionType>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [availability, setAvailability] = useState<AvailabilityState>({ checking: false, available: null });
    const [submitting, setSubmitting] = useState(false);
    const autoAppliedRef = useRef<string>("");
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
            setAvailability({ checking: false, available: null });
            autoAppliedRef.current = "";
            resetForm({ description: "" });
        } else if (mode === 'edit' && booking) {
            setInterventionType((booking.interventionType?.toLowerCase() as InterventionType) || null);
            if (booking.scheduledDate) {
                const date = new Date(booking.scheduledDate);
                setSelectedDate(date.toISOString().split("T")[0]);
            }
            setSelectedTime(booking.scheduledTime || "");
            resetForm({ description: booking.description || "" });
        }
    }, [isOpen, resetForm, mode, booking]);

    // « Aujourd'hui » : calcule automatiquement la date/heure (maintenant + 1h, borné 08:00-19:00)
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

    // Vérification de disponibilité en temps réel (débounce 400ms)
    useEffect(() => {
        if (!isOpen || !item?.id) return;
        if (!selectedDate || !selectedTime) {
            setAvailability({ checking: false, available: null });
            return;
        }

        const iso = buildIso(selectedDate, selectedTime);
        let cancelled = false;
        setAvailability(a => ({ ...a, checking: true }));

        const handle = setTimeout(async () => {
            try {
                const excludeId = mode === 'edit' ? (booking as any)?.id : undefined;
                const res = await checkAnnonceAvailability(item.id, iso, selectedTime, excludeId);
                if (cancelled) return;

                const data = res.data;
                if (res.statusCode === 200 && data) {
                    // Conflit journalier → auto-sélection de la prochaine disponibilité (une seule fois)
                    if (!data.available && data.mode === 'DAY' && data.nextAvailableDate && data.nextAvailableTime) {
                        const nd = data.nextAvailableDate.split('T')[0];
                        const nt = data.nextAvailableTime;
                        const sig = `${nd}T${nt}`;
                        if ((nd !== selectedDate || nt !== selectedTime) && autoAppliedRef.current !== sig) {
                            autoAppliedRef.current = sig;
                            setSelectedDate(nd);
                            setSelectedTime(nt);
                            setAvailability({ checking: false, available: false, message: data.message, mode: data.mode, autoSelected: true });
                            return;
                        }
                    }
                    setAvailability({
                        checking: false,
                        available: data.available,
                        message: data.message,
                        mode: data.mode,
                        autoSelected: false,
                    });
                } else {
                    setAvailability({ checking: false, available: null, message: res.message });
                }
            } catch {
                if (!cancelled) setAvailability({ checking: false, available: null });
            }
        }, 400);

        return () => { cancelled = true; clearTimeout(handle); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedDate, selectedTime, item?.id, mode]);

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

    // Les champs sous la date/heure restent grisés pendant la vérification
    const fieldsLocked = availability.checking;
    const canSubmit =
        !!interventionType &&
        (interventionType !== "rdv" || (!!selectedDate && !!selectedTime)) &&
        !availability.checking &&
        availability.available !== false &&
        !submitting;

    const handleBooking = async () => {
        if (!canSubmit) return;
        const isoScheduledDate = buildIso(selectedDate, selectedTime);

        const payload: any = {
            bookingType: 'ANNONCE',
            interventionType: interventionType!.toUpperCase(),
            scheduledDate: isoScheduledDate,
            scheduledTime: selectedTime,
            description: getValues().description,
        };
        if (mode === 'create') {
            payload.annonceId = item.id;
        }

        setSubmitting(true);
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
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001]">
                        <motion.div className="bg-[#FBFAF6] text-[#0F2944] overflow-hidden flex flex-col md:w-[90%] md:max-w-3xl md:max-h-[88vh] md:rounded-3xl md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] rounded-none w-full h-dvh md:h-auto pb-safe" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >

                            {/* Header */}
                            <div className="sticky top-0 z-50 flex h-16 items-center gap-3 px-4 bg-[#FBFAF6]/95 backdrop-blur-md border-b border-[#EEF1F4] shrink-0">
                                <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] transition-all active:scale-90" >
                                    <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                                </button>
                                <div className="flex-1">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1 block">
                                        {mode === 'edit' ? 'Modification' : 'Réservation'} Annonce
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

                                        {imageGallery.length > 1 && (
                                            <>
                                                <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30">
                                                    <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % imageGallery.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30">
                                                    <Icon icon="solar:alt-arrow-right-bold" className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}

                                        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 z-20">
                                            <div className="flex-1">
                                                <span className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em] mb-1 block drop-shadow-md">Annonce Vérifiée</span>
                                                <h3 className="text-lg md:text-xl font-black text-white line-clamp-1 drop-shadow-lg">{item.title}</h3>
                                            </div>
                                            {imageGallery.length > 1 && (
                                                <div className="flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10">
                                                    {imageGallery.map((image, index) => (
                                                        <button key={index} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }} className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/10 opacity-50 hover:opacity-100'} `}>
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
                                        {hasValidPrice(item.price) && (
                                            <p className="text-xl md:text-2xl font-black text-secondary">
                                                {item.price!.toLocaleString()} CFA
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Catégorie</p>
                                        <p className="text-sm font-black">
                                            {((item as any).categorie?.label || (item as any).type?.label || item.realEstateOption?.name || item.vehicleType?.name) || 'Détails'}
                                        </p>
                                    </div>
                                </div>

                                {item.latitude != null && item.longitude != null && (
                                    <div className="space-y-3">
                                        <h3 className="text-xs font-black uppercase text-muted-foreground px-1 tracking-widest">Emplacement</h3>
                                        <div className="relative rounded-2xl overflow-hidden border border-border h-40">
                                            <UserMap lat={item.latitude} lng={item.longitude} userName={item.title} />
                                            <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`, "_blank")} className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-background/90 backdrop-blur-md rounded-xl border border-border text-[9px] font-black text-primary uppercase tracking-widest shadow-lg z-[500]">
                                                <Icon icon="solar:map-point-bold-duotone" className="w-3.5 h-3.5" />
                                                Google Maps
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-muted/50 p-4 md:p-6 rounded-3xl">
                                    <FormsInterventionAnnonce onSelectionChange={setInterventionType} initialValue={interventionType} />
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

                                {interventionType === "urgence" && selectedTime && (
                                    <div className="p-4 bg-primary/10 border border-primary/20 flex items-center gap-3 rounded-2xl">
                                        <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-primary">
                                            <Icon icon="solar:calendar-mark-bold-duotone" width={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black">Réservation aujourd'hui</p>
                                            <p className="text-xs font-bold">Dès {selectedTime}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Bandeau de disponibilité */}
                                {interventionType && selectedDate && selectedTime && (
                                    <div className="min-h-[52px]">
                                        {availability.checking ? (
                                            <div className="p-4 bg-muted border border-border flex items-center gap-3 rounded-2xl">
                                                <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5 text-primary" />
                                                <p className="text-sm font-bold text-muted-foreground">{t("akwaba.bookings.availability.checking")}</p>
                                            </div>
                                        ) : availability.available === true ? (
                                            <div className="p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3 rounded-2xl">
                                                <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 text-green-600" />
                                                <p className="text-sm font-bold text-green-700">{t("akwaba.bookings.availability.available")}</p>
                                            </div>
                                        ) : availability.available === false ? (
                                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 rounded-2xl">
                                                <Icon icon="solar:danger-triangle-bold-duotone" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-bold text-amber-700">{availability.message || t("akwaba.bookings.availability.unavailable")}</p>
                                                    {availability.autoSelected && (
                                                        <p className="text-xs font-medium text-amber-600 mt-1">{t("akwaba.bookings.availability.auto_selected")}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                <div className={`bg-card p-6 border rounded-3xl border-border transition-opacity ${fieldsLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <label className="text-xs font-black mb-3 block">Description détaillée</label>
                                    <Controller name="description" control={control} render={({ field }: { field: any }) => (
                                        <RichTextEditor content={field.value || ""} onChange={field.onChange} editable={!fieldsLocked} />
                                    )} />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="sticky bottom-0 z-50 p-6 md:p-8 bg-[#FBFAF6] border-t border-[#EEF1F4]">
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-2xl font-black">
                                            {('frais' in item ? (item as any).frais : 0) || 0} <span className="text-sm">CFA (Frais)</span>
                                        </p>
                                        <ReportButton entityType="ANNONCE" entityId={item.id} className="mt-1" />
                                    </div>
                                    <button onClick={handleBooking} className={`w-full md:w-auto py-4 px-8 rounded-xl font-black flex items-center justify-center gap-2 ${canSubmit ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`} disabled={!canSubmit}>
                                        {submitting && <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" />}
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
