"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogisticService, TransportType } from "@/types/interface";
import { searchLocation, createQuote } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";

const quoteSchema = z.object({
    departureAddress: z.string().min(5, "L'adresse de départ est requise"),
    arrivalAddress: z.string().min(5, "L'adresse d'arrivée est requise"),
    description: z.string().min(10, "Veuillez décrire votre besoin (marchandises, contraintes...)"),
    volume: z.number().positive().optional().or(z.literal(0)),
    weight: z.number().positive().optional().or(z.literal(0)),
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
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<"departure" | "arrival" | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const { addNotification } = useNotification();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    const handleSearch = async (query: string, field: "departure" | "arrival") => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const res = await searchLocation(query);
                if (res.statusCode === 200 && Array.isArray(res.data)) {
                    // Extract display names from Nominatim response
                    const names = res.data.map((item: any) => item.display_name);
                    setSuggestions(names);
                    setActiveSearchField(field);
                }
            } catch (error) {
                console.error("Location search error:", error);
            } finally {
                setSearchLoading(false);
            }
        }, 500);
    };

    const selectSuggestion = (suggestion: string) => {
        if (activeSearchField === "departure") {
            setValue("departureAddress", suggestion);
        } else if (activeSearchField === "arrival") {
            setValue("arrivalAddress", suggestion);
        }
        setSuggestions([]);
        setActiveSearchField(null);
    };

    const onSubmit = async (data: QuoteFormData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...data,
                serviceId: service.id,
                transportType: service.transportType,
            };
            const res = await createQuote(payload);
            if (res.statusCode === 201) {
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
        <div className="p-1 md:p-6 space-y-6">
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon icon="solar:chat-round-money-bold-duotone" className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-foreground">Demande de Devis</h2>
                    <p className="text-sm text-muted-foreground">Service: <span className="font-bold text-primary uppercase">{service.label}</span></p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-20 overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">

                {/* Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    <div className="space-y-2 relative">
                        <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                            <Icon icon="solar:map-point-wave-bold-duotone" className="text-emerald-500 w-4 h-4" />
                            Point de départ
                        </label>
                        <input
                            {...register("departureAddress")}
                            onChange={(e) => handleSearch(e.target.value, "departure")}
                            placeholder="Adresse de collecte..."
                            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                        />
                        {activeSearchField === "departure" && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-background border border-border rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => selectSuggestion(s)}
                                        className="w-full text-left px-4 py-2.5 text-[11px] hover:bg-muted transition-colors font-medium border-b border-border/50 last:border-none"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.departureAddress && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.departureAddress.message}</p>}
                    </div>

                    <div className="space-y-2 relative">
                        <label className="text-xs font-black text-muted-foreground uppercase flex items-center gap-2">
                            <Icon icon="solar:map-point-bold-duotone" className="text-primary w-4 h-4" />
                            Destination
                        </label>
                        <input
                            {...register("arrivalAddress")}
                            onChange={(e) => handleSearch(e.target.value, "arrival")}
                            placeholder="Adresse de livraison..."
                            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all font-medium"
                        />
                        {activeSearchField === "arrival" && suggestions.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-background border border-border rounded-2xl shadow-2xl max-h-48 overflow-y-auto overflow-x-hidden">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => selectSuggestion(s)}
                                        className="w-full text-left px-4 py-2.5 text-[11px] hover:bg-muted transition-colors font-medium border-b border-border/50 last:border-none"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}
                        {errors.arrivalAddress && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.arrivalAddress.message}</p>}
                    </div>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase">Volume estimé (m³)</label>
                        <input
                            type="number"
                            step="any"
                            {...register("volume", { valueAsNumber: true })}
                            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none font-medium text-foreground"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase">Poids total (kg)</label>
                        <input
                            type="number"
                            step="any"
                            {...register("weight", { valueAsNumber: true })}
                            className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none font-medium text-foreground"
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-muted-foreground uppercase">Description des marchandises & Instructions</label>
                    <textarea
                        {...register("description")}
                        rows={4}
                        placeholder="Qu'est-ce que nous transportons ? Y a-t-il des objets fragiles ou des contraintes de temps ?"
                        className="w-full bg-muted border border-border rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none font-medium text-foreground resize-none"
                    />
                    {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase">{errors.description.message}</p>}
                </div>

                {/* Submit Container */}
                <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider">
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center gap-2 uppercase tracking-widest"
                    >
                        {isSubmitting ? (
                            <>
                                <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                                Envoi en cours...
                            </>
                        ) : (
                            <>
                                <Icon icon="solar:plain-bold-duotone" className="w-4 h-4" />
                                Envoyer la demande
                            </>
                        )}
                    </button>
                </div>

            </form>
        </div>
    );
}
