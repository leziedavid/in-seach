"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogisticService, LogisticsClient, UserLocation } from "@/types/interface";
import { searchLocation, createQuote, updateQuote, getCompanyClients, getMyLogisticServices } from "@/api/api";
import { Quote } from "@/types/interface";
import { useNotification } from "../toast/NotificationProvider";
import { useUserLocation } from "@/utils/location";
import Image from "next/image";
import { Select2 } from "../Forms/Select2";

const quoteSchema = z.object({
    clientId: z.string().min(1, "Veuillez sélectionner un client"),
    serviceId: z.string().min(1, "Veuillez sélectionner un service"),
    departureAddress: z.string().min(5, "L'adresse de départ est requise"),
    arrivalAddress: z.string().min(5, "L'adresse d'arrivée est requise"),
    description: z.string().min(10, "Veuillez décrire votre besoin"),
    volume: z.number().positive().optional().or(z.literal(0)),
    weight: z.number().positive().optional().or(z.literal(0)),
    images: z.array(z.instanceof(File)).optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

interface ManualQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    initialData?: Quote | null;
}

export default function ManualQuoteModal({ isOpen, onClose, onSuccess, initialData }: ManualQuoteModalProps) {
    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<QuoteFormData>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            volume: 0,
            weight: 0,
            clientId: "",
            serviceId: "",
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<"departure" | "arrival" | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [clients, setClients] = useState<LogisticsClient[]>([]);
    const [services, setServices] = useState<LogisticService[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [selectedServiceId, setSelectedServiceId] = useState<string>("");
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Image/File support
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                const [clientsRes, servicesRes, loc] = await Promise.all([
                    getCompanyClients({ limit: 100 }),
                    getMyLogisticServices({ limit: 100 }),
                    getUserLocation()
                ]);

                if (clientsRes.statusCode === 200) {
                    setClients(clientsRes.data?.data || []);
                }
                console.log("clientsRes", clientsRes);

                if (servicesRes.statusCode === 200) {
                    setServices(servicesRes.data?.data || servicesRes.data || []);
                }
                console.log("servicesRes", servicesRes);
                if (loc) setUserLocation(loc);
            };
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (selectedClientId) setValue("clientId", selectedClientId, { shouldValidate: true });
    }, [selectedClientId, setValue]);

    useEffect(() => {
        if (selectedServiceId) setValue("serviceId", selectedServiceId, { shouldValidate: true });
    }, [selectedServiceId, setValue]);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                reset({
                    clientId: initialData.senderId || "",
                    serviceId: initialData.serviceId || "",
                    departureAddress: initialData.departureAddress,
                    arrivalAddress: initialData.arrivalAddress,
                    description: initialData.description,
                    volume: initialData.volume || 0,
                    weight: initialData.weight || 0,
                });
                setSelectedClientId(initialData.senderId || "");
                setSelectedServiceId(initialData.serviceId || "");
                setExistingImageUrls(initialData.images || []);
            } else {
                reset({
                    volume: 0,
                    weight: 0,
                    clientId: "",
                    serviceId: "",
                    departureAddress: "",
                    arrivalAddress: "",
                    description: "",
                });
                setSelectedClientId("");
                setSelectedServiceId("");
                setImages([]);
                setImagePreviews([]);
                setExistingImageUrls([]);
            }
        }
    }, [isOpen, initialData, reset]);

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

    const removeImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
        } else {
            setImages(prev => prev.filter((_, i) => i !== index));
            setImagePreviews(prev => prev.filter((_, i) => i !== index));
        }
    };

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
                    setSuggestions(res.data);
                    setActiveSearchField(field);
                }
            } catch (error) {
                console.error("Location search error:", error);
            } finally {
                setSearchLoading(false);
            }
        }, 500);
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
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            const selectedService = services.find(s => s.id === data.serviceId);

            formData.append('senderId', data.clientId);
            formData.append('serviceId', data.serviceId);
            formData.append('departureAddress', data.departureAddress);
            formData.append('arrivalAddress', data.arrivalAddress);
            formData.append('description', data.description);
            formData.append('transportType', selectedService?.transportType || "");

            if (data.volume) formData.append('volume', data.volume.toString());
            if (data.weight) formData.append('weight', data.weight.toString());

            images.forEach((image) => {
                formData.append('files', image);
            });

            const res = initialData
                ? await updateQuote(initialData.id, formData)
                : await createQuote(formData);

            if (res.statusCode === 201 || res.statusCode === 200) {
                addNotification(initialData ? "Dévis mis à jour avec succès !" : "Dévis créé avec succès !", "success");
                onSuccess?.();
                onClose();
            } else {
                addNotification(res.message || "Erreur lors de l'opération", "error");
            }
        } catch (error) {
            addNotification("Erreur serveur", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-4xl max-w-7xl rounded-[2.5rem] shadow-2xl overflow-visible animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:chat-round-money-bold-duotone" className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">{initialData ? 'Modifier le Devis' : 'Nouveau Devis Manuel'}</h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{initialData ? 'Mettre à jour les informations du devis' : 'Créer un devis pour un client'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6  overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Sélectionner un Client</label>
                                <Select2<LogisticsClient>
                                    options={clients}
                                    labelExtractor={(c) => `${c.fullName} (${c.phone})`}
                                    valueExtractor={(c) => c.id}
                                    selectedItem={selectedClientId}
                                    onSelectionChange={(val) => setSelectedClientId(val as string)}
                                    placeholder="Chercher un client..."
                                />
                                {errors.clientId && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.clientId.message}</p>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Sélectionner un Service</label>
                                <Select2<LogisticService>
                                    options={services}
                                    labelExtractor={(s) => s.label.toUpperCase()}
                                    valueExtractor={(s) => s.id}
                                    selectedItem={selectedServiceId}
                                    onSelectionChange={(val) => setSelectedServiceId(val as string)}
                                    placeholder="Choisir un service..."
                                />
                                {errors.serviceId && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.serviceId.message}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                            <div className="space-y-1 relative">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Point de départ</label>
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
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Destination</label>
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

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Description & Instructions</label>
                            <textarea {...register("description")} rows={3} placeholder="Contenu du chargement, fragilité, etc..." className="w-full p-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm resize-none" />
                            {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.description.message}</p>}
                        </div>

                        <div className="bg-card rounded-3xl border border-border p-6 mt-4 ">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                                    <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                                    Documents & Photos (Optionnel)
                                </h3>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{existingImageUrls.length + images.length}/5 fichiers</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                <label className={`h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/30 transition-colors ${(existingImageUrls.length + images.length) >= 5 ? 'opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer'}`}>
                                    <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-[10px] font-black uppercase mt-1">Ajouter</span>
                                    <input type="file" accept="image/*,application/pdf" multiple onChange={(e) => e.target.files && handleImageUpload(e.target.files)} disabled={(existingImageUrls.length + images.length) >= 5} className="hidden" />
                                </label>

                                {existingImageUrls.map((url, index) => (
                                    <div key={`ex-${index}`} className="relative h-24 rounded-2xl overflow-hidden group shadow-lg">
                                        <Image src={url} alt="Existing attachment" fill className="object-cover" unoptimized />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={() => removeImage(index, true)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform shadow-xl">
                                                <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {imagePreviews.map((preview, index) => (
                                    <div key={`pre-${index}`} className="relative h-24 rounded-2xl overflow-hidden group border-2 border-primary/30 shadow-lg">
                                        {preview === "pdf-placeholder" ? (
                                            <div className="w-full h-full bg-primary/5 flex flex-col items-center justify-center">
                                                <Icon icon="solar:file-text-bold-duotone" className="w-8 h-8 text-primary" />
                                                <span className="text-[10px] font-bold text-primary uppercase mt-1">PDF</span>
                                            </div>
                                        ) : (
                                            <Image src={preview} alt="New attachment" fill className="object-cover" unoptimized />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button type="button" onClick={() => removeImage(index, false)} className="bg-red-500 text-white rounded-xl p-2 hover:scale-110 transition-transform shadow-xl">
                                                <Icon icon="solar:trash-bin-trash-bold" className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider flex-1 h-12">
                                Annuler
                            </button>
                            <button type="submit" disabled={isSubmitting} className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12">
                                {isSubmitting ? (
                                    <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icon icon={initialData ? "solar:pen-bold" : "solar:plain-bold-duotone"} className="w-5 h-5" />
                                        {initialData ? 'Mettre à jour' : 'Créer le devis'}
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
