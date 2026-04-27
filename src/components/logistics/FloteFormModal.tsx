"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "../modal/MotionModal";
import { createFleetItem, updateFleetItem } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import { Select2 } from "../Forms/Select2";

interface FloteFormModalProps {
    isOpen: boolean;
    item: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

const FLOTE_TYPES = [
    { value: 'VEHICULE', label: 'VÉHICULE' },
    { value: 'CAMION', label: 'CAMION' },
    { value: 'AVION', label: 'AVION' },
    { value: 'AUTRE', label: 'AUTRE' },
];

const FUEL_TYPES = [
    { value: 'DIESEL', label: 'DIESEL' },
    { value: 'ESSENCE', label: 'ESSENCE' },
    { value: 'ELECTRIQUE', label: 'ÉLECTRIQUE' },
    { value: 'HYBRIDE', label: 'HYBRIDE' },
];

export default function FloteFormModal({ isOpen, item, onClose, onSuccess }: FloteFormModalProps) {
    const { addNotification } = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "VEHICULE",
        description: "",
        marque: "",
        modele: "",
        immatriculation: "",
        capacite: "",
        typeCarburant: "",
        consommation: "",
        assurance: "",
        dateMiseEnCirculation: "",
        autonomie: "",
        compagnie: "",
    });

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || "",
                type: item.type || "VEHICULE",
                description: item.description || "",
                marque: item.marque || "",
                modele: item.modele || "",
                immatriculation: item.immatriculation || "",
                capacite: item.capacite || "",
                typeCarburant: item.typeCarburant || "",
                consommation: item.consommation || "",
                assurance: item.assurance || "",
                dateMiseEnCirculation: item.dateMiseEnCirculation ? new Date(item.dateMiseEnCirculation).toISOString().split('T')[0] : "",
                autonomie: item.autonomie || "",
                compagnie: item.compagnie || "",
            });
        } else {
            setFormData({
                name: "",
                type: "VEHICULE",
                description: "",
                marque: "",
                modele: "",
                immatriculation: "",
                capacite: "",
                typeCarburant: "",
                consommation: "",
                assurance: "",
                dateMiseEnCirculation: "",
                autonomie: "",
                compagnie: "",
            });
        }
    }, [item, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = item 
                ? await updateFleetItem(item.id, formData)
                : await createFleetItem(formData);

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(item ? "Engin mis à jour" : "Engin ajouté", "success");
                onSuccess();
                onClose();
            } else {
                addNotification(res.message || "Une erreur est survenue", "error");
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-card border border-border w-2xl max-w-4xl rounded-[2.5rem] shadow-2xl overflow-visible animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Icon icon={item ? "solar:pen-bold" : "solar:add-circle-bold"} className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                                    {item ? "Modifier l'engin" : "Ajouter un engin"}
                                </h2>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                    Détails techniques de votre actif logistique
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
                            <Icon icon="solar:close-circle-bold" className="w-6 h-6 text-muted-foreground" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[70vh] px-1 scrollbar-hide">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Champ Type */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Type d'engin</label>
                                <Select2
                                    mode="single"
                                    options={FLOTE_TYPES}
                                    selectedItem={formData.type}
                                    onSelectionChange={(val) => setFormData(prev => ({ ...prev, type: val as string }))}
                                    labelExtractor={(t) => t.label}
                                    valueExtractor={(t) => t.value}
                                    placeholder="Choisir le type..."
                                />
                            </div>

                            {/* Nom de l'engin */}
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom / Identifiant interne</label>
                                <input
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="ex: Camion Benne 01"
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                            </div>

                            {/* Champs spécifiques : ROUTE (Vehicule/Camion) */}
                            {(formData.type === 'VEHICULE' || formData.type === 'CAMION') && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Marque</label>
                                        <input
                                            name="marque"
                                            value={formData.marque}
                                            onChange={handleChange}
                                            placeholder="ex: Toyota"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Modèle</label>
                                        <input
                                            name="modele"
                                            value={formData.modele}
                                            onChange={handleChange}
                                            placeholder="ex: Hilux"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Immatriculation</label>
                                        <input
                                            name="immatriculation"
                                            value={formData.immatriculation}
                                            onChange={handleChange}
                                            placeholder="ex: AA-123-BB"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Carburant</label>
                                        <Select2
                                            mode="single"
                                            options={FUEL_TYPES}
                                            selectedItem={formData.typeCarburant}
                                            onSelectionChange={(val) => setFormData(prev => ({ ...prev, typeCarburant: val as string }))}
                                            labelExtractor={(f) => f.label}
                                            valueExtractor={(f) => f.value}
                                            placeholder="Sélectionner..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Champs spécifiques : AVION */}
                            {formData.type === 'AVION' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Compagnie / Opérateur</label>
                                        <input
                                            name="compagnie"
                                            value={formData.compagnie}
                                            onChange={handleChange}
                                            placeholder="ex: Air Ivoire"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Autonomie</label>
                                        <input
                                            name="autonomie"
                                            value={formData.autonomie}
                                            onChange={handleChange}
                                            placeholder="ex: 5000 km"
                                            className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Capacités communes */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Capacité (Poids/Volume)</label>
                                <input
                                    name="capacite"
                                    value={formData.capacite}
                                    onChange={handleChange}
                                    placeholder="ex: 20 Tonnes / 40 m3"
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Assurance / Validité</label>
                                <input
                                    name="assurance"
                                    value={formData.assurance}
                                    onChange={handleChange}
                                    placeholder="ex: Valide jusqu'au 31/12/2026"
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Date de mise en circulation</label>
                                <input
                                    type="date"
                                    name="dateMiseEnCirculation"
                                    value={formData.dateMiseEnCirculation}
                                    onChange={handleChange}
                                    className="w-full h-12 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                                />
                            </div>

                            <div className="space-y-1 md:col-span-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Description / Notes</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Notes complémentaires sur l'engin..."
                                    className="w-full p-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm resize-none"
                                />
                            </div>
                        </div>

                        <div className="sticky bottom-0 p-6 bg-card border-t border-border flex flex-col md:flex-row gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 rounded-2xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase tracking-wider flex-1 h-12"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="bg-primary text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-secondary transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase tracking-widest flex-[2] h-12"
                            >
                                {isLoading ? (
                                    <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Icon icon={item ? "solar:pen-bold" : "solar:add-circle-bold"} className="w-5 h-5" />
                                        {item ? "Enregistrer" : "Ajouter à la flotte"}
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
