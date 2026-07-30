"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getProductCategories, getAccompagnements } from "@/api/api";
import { Select2 } from "@/components/ui/Select2";
import ImageUploadGrid from "@/components/ui/ImageUploadGrid";
import { Product, CategoryProd, Accompagnement } from "@/types/interface";

/** Sélection d'accompagnements en cours d'édition, keyée par accompagnementId — la présence
 * d'une clé = accompagnement coché. Un seul peut avoir isDefault=true (gratuit/inclus). */
type AccompSelection = Record<string, { supplement: string; isDefault: boolean }>;

interface FormsMenuItemProps {
    initialData?: Product;
    onSubmit: (formData: FormData) => void | Promise<void>;
    isSubmitting?: boolean;
    isEditMode?: boolean;
    onClose: () => void;
}

/**
 * Formulaire de plat de menu — inspiré de FormsProduit.tsx mais simplifié : pas d'état
 * du produit (NEUF/OCCASION...) ni de vente en gros, non pertinents pour la restauration.
 * Ajoute le temps de préparation. La disponibilité/quantité du jour réutilise le champ
 * générique Product.stock.
 */
export default function FormsMenuItem({ initialData, onSubmit, isSubmitting = false, isEditMode = false, onClose }: FormsMenuItemProps) {
    const [categories, setCategories] = useState<CategoryProd[]>([]);
    const [accompagnementCatalog, setAccompagnementCatalog] = useState<Accompagnement[]>([]);
    const [accompSelection, setAccompSelection] = useState<AccompSelection>(() =>
        Object.fromEntries((initialData?.accompagnements || []).map(a => [a.id, { supplement: String(a.supplementPrice), isDefault: a.isDefault }]))
    );
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [price, setPrice] = useState<string>(initialData?.price?.toString() || "");
    const [discountPercent, setDiscountPercent] = useState<string>(initialData?.discountPercent?.toString() || "");
    const [stock, setStock] = useState<string>(initialData?.stock?.toString() ?? "20");
    const [preparationTime, setPreparationTime] = useState<string>(initialData?.preparationTime?.toString() || "");
    const [categoryId, setCategoryId] = useState<string | null>(initialData?.categoryId || null);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        initialData?.files?.map(f => f.fileUrl) || initialData?.imageUrls || initialData?.images || []
    );
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let isMounted = true;
        getProductCategories(true, 'RESTAURANT').then(res => {
            if (isMounted && res.statusCode === 200 && res.data) setCategories(res.data);
        }).catch(() => { });
        getAccompagnements(true).then(res => {
            if (isMounted && res.statusCode === 200 && res.data) setAccompagnementCatalog(res.data);
        }).catch(() => { });
        return () => { isMounted = false; };
    }, []);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || "");
            setDescription(initialData.description || "");
            setPrice(initialData.price?.toString() || "");
            setDiscountPercent(initialData.discountPercent?.toString() || "");
            setStock(initialData.stock?.toString() ?? "20");
            setPreparationTime(initialData.preparationTime?.toString() || "");
            setCategoryId(initialData.categoryId || null);
            setIsActive(initialData.isActive ?? true);
            setImagePreviews(initialData.files?.map(f => f.fileUrl) || initialData.imageUrls || initialData.images || []);
            setAccompSelection(Object.fromEntries((initialData.accompagnements || []).map(a => [a.id, { supplement: String(a.supplementPrice), isDefault: a.isDefault }])));
        }
    }, [initialData]);

    const toggleAccompagnement = (id: string) => {
        setAccompSelection(prev => {
            if (prev[id]) {
                const { [id]: _removed, ...rest } = prev;
                return rest;
            }
            // Premier accompagnement coché = gratuit par défaut, les suivants démarrent à 0 FCFA de supplément.
            const isFirst = Object.keys(prev).length === 0;
            return { ...prev, [id]: { supplement: "0", isDefault: isFirst } };
        });
    };

    const setAccompSupplement = (id: string, supplement: string) => {
        setAccompSelection(prev => ({ ...prev, [id]: { ...prev[id], supplement } }));
    };

    const setAccompDefault = (id: string) => {
        setAccompSelection(prev => Object.fromEntries(
            Object.entries(prev).map(([key, val]) => [key, { supplement: key === id ? "0" : val.supplement, isDefault: key === id }])
        ));
    };

    const handleAddImages = (files: File[]) => {
        setImages(prev => [...prev, ...files]);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string]);
            reader.readAsDataURL(file);
        });
    };
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = "Le nom du plat est requis";
        if (!price || isNaN(Number(price)) || Number(price) <= 0) errs.price = "Le prix doit être positif";
        if (!categoryId) errs.categoryId = "Veuillez sélectionner une catégorie de menu";
        if (stock === "" || isNaN(Number(stock)) || Number(stock) < 0) errs.stock = "La quantité doit être ≥ 0";
        const accompEntries = Object.entries(accompSelection);
        if (accompEntries.length > 0 && !accompEntries.some(([, v]) => v.isDefault)) {
            errs.accompagnements = "Sélectionnez un accompagnement gratuit/inclus parmi ceux cochés";
        }
        if (accompEntries.some(([, v]) => !v.isDefault && (v.supplement === "" || isNaN(Number(v.supplement)) || Number(v.supplement) < 0))) {
            errs.accompagnements = "Le supplément de chaque accompagnement doit être un nombre ≥ 0";
        }
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }
        setErrors({});

        const formData = new FormData();
        formData.append("name", name.trim());
        if (description) formData.append("description", description);
        formData.append("price", price);
        if (discountPercent) formData.append("discountPercent", discountPercent);
        formData.append("stock", stock);
        if (preparationTime) formData.append("preparationTime", preparationTime);
        formData.append("categoryId", categoryId || "");
        formData.append("isActive", String(isActive));
        images.forEach(file => formData.append("files", file));

        // En édition, envoyer même un tableau vide (pour permettre de tout décocher) — en
        // création, omettre le champ si rien n'est sélectionné (comportement inchangé pour
        // un plat sans accompagnement).
        const accompEntries = Object.entries(accompSelection);
        if (isEditMode || accompEntries.length > 0) {
            formData.append("accompagnements", JSON.stringify(accompEntries.map(([accompagnementId, v]) => ({
                accompagnementId,
                supplementPrice: v.isDefault ? 0 : Number(v.supplement) || 0,
                isDefault: v.isDefault,
            }))));
        }

        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="px-4 space-y-5">
                <ImageUploadGrid title="Photo du plat" icon="solar:gallery-bold-duotone" max={3} previews={imagePreviews} onAdd={handleAddImages} onRemove={removeImage} />

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:chef-hat-bold-duotone" className="w-5 h-5 text-primary" />
                        Le plat
                    </h3>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom du plat *</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: Attiéké Poisson" />
                        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catégorie de menu *</label>
                        <Select2
                            options={categories}
                            labelExtractor={(cat) => cat.name}
                            valueExtractor={(cat) => cat.id}
                            selectedItem={categoryId}
                            onSelectionChange={(val) => setCategoryId(val)}
                            placeholder="ex: Plats, Entrées, Desserts, Boissons"
                        />
                        {errors.categoryId && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.categoryId}</p>}
                        {categories.length === 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1">Aucune catégorie de menu n&apos;existe encore — contactez l&apos;administrateur pour en créer.</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium resize-none" placeholder="Ingrédients, préparation..." />
                    </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                        <Icon icon="solar:wad-of-money-bold-duotone" className="w-5 h-5 text-primary" />
                        Prix & disponibilité
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Prix (FCFA) *</label>
                            <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="0" />
                            {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.price}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Réduction (%) (optionnel)</label>
                            <input type="number" min="0" max="100" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: 10" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quantité disponible aujourd&apos;hui *</label>
                            <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="20" />
                            {errors.stock && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.stock}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Temps de préparation (min)</label>
                            <input type="number" min="0" value={preparationTime} onChange={e => setPreparationTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" placeholder="ex: 20" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                        <div>
                            <p className="text-sm font-bold text-foreground">Disponible à la commande</p>
                            <p className="text-xs text-muted-foreground">Désactivez pour retirer temporairement ce plat du menu.</p>
                        </div>
                        <button type="button" onClick={() => setIsActive(v => !v)} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>

                {accompagnementCatalog.length > 0 && (
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                                <Icon icon="solar:bowl-bold-duotone" className="w-5 h-5 text-primary" />
                                Accompagnements du plat
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Choisissez les accompagnements proposés pour ce plat, marquez-en un comme gratuit/inclus, et définissez le supplément des autres.
                            </p>
                        </div>

                        <div className="space-y-2">
                            {accompagnementCatalog.map(accomp => {
                                const selected = accompSelection[accomp.id];
                                return (
                                    <div key={accomp.id} className={`rounded-xl border p-3 transition-all ${selected ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted/20'}`}>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={!!selected} onChange={() => toggleAccompagnement(accomp.id)} className="w-4 h-4 accent-primary shrink-0" />
                                            <span className="text-sm font-bold text-foreground flex-1">{accomp.name}</span>
                                        </label>
                                        {selected && (
                                            <div className="mt-2.5 ml-7 flex items-center gap-3 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setAccompDefault(accomp.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide transition-all ${selected.isDefault ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'}`}
                                                >
                                                    <Icon icon={selected.isDefault ? 'solar:check-circle-bold' : 'solar:circle-linear'} className="w-3.5 h-3.5" />
                                                    Gratuit / inclus
                                                </button>
                                                {!selected.isDefault && (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-muted-foreground">Supplément :</span>
                                                        <input
                                                            type="number" min="0" value={selected.supplement}
                                                            onChange={e => setAccompSupplement(accomp.id, e.target.value)}
                                                            className="w-24 px-2.5 py-1.5 rounded-lg border border-border bg-background text-xs font-bold outline-none focus:border-primary"
                                                            placeholder="0"
                                                        />
                                                        <span className="text-xs text-muted-foreground">FCFA</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {errors.accompagnements && <p className="text-[10px] text-red-500 font-bold">{errors.accompagnements}</p>}
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm p-4 border-t border-border flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                    {isEditMode ? "Mettre à jour" : "Ajouter au menu"}
                </button>
            </div>
        </form>
    );
}
