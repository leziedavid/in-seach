"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogisticService, TransportType, UserLocation } from "@/types/interface";
import { searchLocation, createQuote } from "@/api/api";
import ReportButton from "@/components/shared/ReportButton";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useUserLocation } from "@/utils/location";
import Image from "next/image";

const quoteSchema = z.object({
    departureAddress: z.string().min(5, "L'adresse de départ est requise"),
    arrivalAddress: z.string().min(5, "L'adresse d'arrivée est requise"),
    description: z.string().min(10, "Veuillez décrire votre besoin (marchandises, contraintes...)"),
    volume: z.number().positive().optional().or(z.literal(0)),
    weight: z.number().positive().optional().or(z.literal(0)),
    images: z.array(z.instanceof(File)).optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface QuoteRequestModalProps {
    service: LogisticService;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function QuoteRequestModal({ service, isOpen, onClose, onSuccess }: QuoteRequestModalProps) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<QuoteFormData>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            volume: 0,
            weight: 0,
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<"departure" | "arrival" | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [isGlobalDeparture, setIsGlobalDeparture] = useState(false);
    const [isGlobalArrival, setIsGlobalArrival] = useState(false);
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    const handleImageUpload = (files: FileList) => {
        const newFiles = Array.from(files);
        setImages(prev => [...prev, ...newFiles]);
        newFiles.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImagePreviews(prev => [...prev, e.target?.result as string]);
                };
                reader.readAsDataURL(file);
            } else {
                setImagePreviews(prev => [...prev, "pdf-placeholder"]);
            }
        });
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const initLocation = async () => {
            const loc = await getUserLocation();
            if (loc) setUserLocation(loc);
        };
        initLocation();
    }, []);

    const handleSearch = async (query: string, field: "departure" | "arrival") => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const isGlobal = field === "departure" ? isGlobalDeparture : isGlobalArrival;
                const countryCode = isGlobal ? undefined : userLocation?.countryCode;
                const res = await searchLocation(query, countryCode || undefined);
                if (res.statusCode === 200 && Array.isArray(res.data)) {
                    setSuggestions(res.data);
                    setActiveSearchField(field);
                }
            } catch (error) {
                console.error("Location search error:", error);
            } finally {
                setSearchLoading(false);
            }
        }, 1000);
    };

    const selectSuggestion = (suggestion: any) => {
        const address = suggestion.displayName;
        if (activeSearchField === "departure") {
            setValue("departureAddress", address);
        } else if (activeSearchField === "arrival") {
            setValue("arrivalAddress", address);
        }
        setSuggestions([]);
        setActiveSearchField(null);
    };

    const onSubmit = async (data: QuoteFormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('departureAddress', data.departureAddress);
            formData.append('arrivalAddress', data.arrivalAddress);
            formData.append('description', data.description);
            formData.append('serviceId', service.id);
            formData.append('transportType', service.transportType);

            if (data.volume) formData.append('volume', data.volume.toString());
            if (data.weight) formData.append('weight', data.weight.toString());

            images.forEach((image) => {
                formData.append('files', image);
            });

            const res = await createQuote(formData);

            if (res.statusCode && res.statusCode === 201) {
                addNotification("Demande de devis envoyée avec succès !", "success");
                onSuccess?.();
                onClose();
            } else {
                addNotification(res.message || "Erreur lors de l'envoi", "error");
            }
        } catch (error) {
            addNotification("Erreur serveur", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F2944]/30 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#FBFAF6] text-[#0F2944] border border-[#EEF1F4] w-2xl max-w-4xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,41,68,0.13)] overflow-visible animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:chat-round-money-bold-duotone" className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Demande de Devis</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Service: <span className="text-primary">{service.label.toUpperCase()}</span></p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">
                        {/* Addresses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            <div className="space-y-1 relative">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                        <Icon icon="solar:map-point-wave-bold-duotone" className="text-emerald-500 w-3 h-3" />
                                        Point de départ
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsGlobalDeparture(!isGlobalDeparture)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${isGlobalDeparture ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"}`}
                                    >
                                        <Icon icon={isGlobalDeparture ? "solar:global-bold-duotone" : "solar:city-bold-duotone"} className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">{isGlobalDeparture ? "Monde" : "Local"}</span>
                                    </button>
                                </div>
                                <input
                                    {...register("departureAddress", { onChange: (e) => handleSearch(e.target.value, "departure") })}
                                    placeholder="Adresse de collecte..."
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                                {activeSearchField === "departure" && (suggestions.length > 0 || searchLoading) && (
                                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1">
                                        {suggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => selectSuggestion(s)} className="w-full text-left px-3 py-2 hover:bg-muted transition-all rounded-lg text-[10px] font-bold border-b border-border/30 last:border-none">
                                                {s.displayName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.departureAddress && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.departureAddress.message}</p>}
                            </div>

                            <div className="space-y-1 relative">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                        <Icon icon="solar:map-point-bold-duotone" className="text-primary w-3 h-3" />
                                        Destination
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsGlobalArrival(!isGlobalArrival)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all ${isGlobalArrival ? "bg-primary/10 border-primary/20 text-primary" : "bg-muted border-border text-muted-foreground"}`}
                                    >
                                        <Icon icon={isGlobalArrival ? "solar:global-bold-duotone" : "solar:city-bold-duotone"} className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">{isGlobalArrival ? "Monde" : "Local"}</span>
                                    </button>
                                </div>
                                <input
                                    {...register("arrivalAddress", { onChange: (e) => handleSearch(e.target.value, "arrival") })}
                                    placeholder="Adresse de livraison..."
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                                {activeSearchField === "arrival" && (suggestions.length > 0 || searchLoading) && (
                                    <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1">
                                        {suggestions.map((s, i) => (
                                            <button key={i} type="button" onClick={() => selectSuggestion(s)} className="w-full text-left px-3 py-2 hover:bg-muted transition-all rounded-lg text-[10px] font-bold border-b border-border/30 last:border-none">
                                                {s.displayName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {errors.arrivalAddress && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.arrivalAddress.message}</p>}
                            </div>
                        </div>

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Volume (m³)</label>
                                <input type="number" step="any" {...register("volume", { valueAsNumber: true })} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Poids (kg)</label>
                                <input type="number" step="any" {...register("weight", { valueAsNumber: true })} className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Description & Instructions</label>
                            <textarea {...register("description")} rows={3} placeholder="Détails sur les marchandises..." className="w-full p-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm resize-none" />
                            {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.description.message}</p>}
                        </div>

                        {/* Images */}
                        <div className="bg-card rounded-[2rem] border border-border p-6 mt-4 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                    <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                                    Fichiers (Photos, PDF...)
                                </h3>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{images.length}/5</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${images.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer border-primary/20'}`}>
                                    <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-[10px] font-black text-muted-foreground mt-1 uppercase">Ajouter</span>
                                    <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} disabled={images.length >= 5} className="hidden" />
                                </label>

                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative h-24 rounded-2xl overflow-hidden group shadow-md border border-border">
                                        {preview === "pdf-placeholder" ? (
                                            <div className="w-full h-full bg-primary/5 flex flex-col items-center justify-center">
                                                <Icon icon="solar:file-text-bold-duotone" className="w-8 h-8 text-primary" />
                                                <span className="text-[10px] font-bold text-primary uppercase mt-1">PDF</span>
                                            </div>
                                        ) : (
                                            <Image src={preview} alt="Attachment" fill className="object-cover" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={() => removeImage(index)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform shadow-xl">
                                                <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                            <div className="flex flex-col gap-1.5 flex-1">
                                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider h-12 w-full">
                                    Annuler
                                </button>
                                <ReportButton entityType="LOGISTIC_SERVICE" entityId={service.id} className="justify-center" />
                            </div>
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12">
                                {isSubmitting ? (
                                    <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icon icon="solar:plain-bold-duotone" className="w-5 h-5" />
                                        Envoyer la demande
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
