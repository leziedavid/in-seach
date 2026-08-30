"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Switch } from "@/components/ui/switch";
import AccordionSection from "@/components/ui/AccordionSection";
import { ProductVariant, ProductOption } from "@/types/interface";

export type VariantRow = {
    _key: string;
    id?: string;
    title: string;
    sku: string;
    price: string;
    /** true dès que l'utilisateur a modifié le prix à la main — le prix cesse alors de suivre le prix de vente du produit. Purement UI, jamais envoyé au backend. */
    priceTouched?: boolean;
    option1: string;
    option2: string;
    option3: string;
};

export type OptionRow = {
    _key: string;
    id?: string;
    name: string;
    values: string[];
};

let uidCounter = 0;
const nextKey = () => `row-${Date.now()}-${uidCounter++}`;

export const emptyVariantRow = (defaultPrice?: string): VariantRow => ({
    _key: nextKey(),
    title: "",
    sku: "",
    price: defaultPrice || "",
    priceTouched: false,
    option1: "",
    option2: "",
    option3: "",
});

export const emptyOptionRow = (): OptionRow => ({
    _key: nextKey(),
    name: "",
    values: [],
});

export const toVariantRow = (v: ProductVariant): VariantRow => ({
    _key: v.id || nextKey(),
    id: v.id,
    title: v.title || "",
    sku: v.sku || "",
    price: v.price !== undefined && v.price !== null ? String(v.price) : "",
    // Prix déjà enregistré côté serveur : on ne le remplace pas silencieusement si le prix du
    // produit change en édition — l'utilisateur reste libre de le resynchroniser manuellement.
    priceTouched: true,
    option1: v.option1 || "",
    option2: v.option2 || "",
    option3: v.option3 || "",
});

export const toOptionRow = (o: ProductOption): OptionRow => ({
    _key: o.id || nextKey(),
    id: o.id,
    name: o.name || "",
    values: o.values || [],
});

/** Convertit les lignes du formulaire vers le contrat backend (ProductVariantDto[]) — ignore les lignes totalement vides. */
export const variantRowsToPayload = (rows: VariantRow[]) => rows
    .filter(r => r.title.trim() || r.sku.trim() || r.price.trim() || r.option1.trim() || r.option2.trim() || r.option3.trim())
    .map(r => ({
        title: r.title.trim(),
        sku: r.sku.trim() || undefined,
        price: r.price.trim() ? Number(r.price) : undefined,
        option1: r.option1.trim() || undefined,
        option2: r.option2.trim() || undefined,
        option3: r.option3.trim() || undefined,
    }));

/** Convertit les lignes du formulaire vers le contrat backend (ProductOptionDto[]) — ignore les lignes sans nom ni valeur. */
export const optionRowsToPayload = (rows: OptionRow[]) => rows
    .filter(r => r.name.trim() || r.values.length > 0)
    .map(r => ({
        name: r.name.trim(),
        values: r.values,
    }));

interface ProductVariantsOptionsSectionProps {
    hasVariants: boolean;
    onHasVariantsChange: (val: boolean) => void;
    variants: VariantRow[];
    onVariantsChange: (rows: VariantRow[]) => void;
    hasOptions: boolean;
    onHasOptionsChange: (val: boolean) => void;
    options: OptionRow[];
    onOptionsChange: (rows: OptionRow[]) => void;
    defaultPrice?: string;
}

/**
 * Section variantes/options du formulaire produit — deux switches indépendants qui révèlent
 * chacun une liste dynamique en accordéon (une seule carte ouverte à la fois, ajout/suppression
 * à la volée). Les données (hasVariants/variants/hasOptions/options) restent possédées par
 * FormsProduit — ce composant est purement contrôlé, seul l'état "quelle carte est ouverte"
 * est local (pure UI, sans intérêt pour le parent).
 */
export default function ProductVariantsOptionsSection({
    hasVariants,
    onHasVariantsChange,
    variants,
    onVariantsChange,
    hasOptions,
    onHasOptionsChange,
    options,
    onOptionsChange,
    defaultPrice,
}: ProductVariantsOptionsSectionProps) {
    const [openVariantKey, setOpenVariantKey] = useState<string | null>(null);
    const [openOptionKey, setOpenOptionKey] = useState<string | null>(null);
    const [valueInputs, setValueInputs] = useState<Record<string, string>>({});

    // Le prix de chaque variante suit le prix de vente du produit tant que l'utilisateur ne l'a
    // pas modifié à la main (priceTouched) — dépend volontairement uniquement de `defaultPrice`
    // (pas de `variants`) pour ne se déclencher qu'aux changements du prix produit, jamais en
    // réaction aux propres modifications de `variants`.
    useEffect(() => {
        if (defaultPrice === undefined) return;
        const needsSync = variants.some(v => !v.priceTouched && v.price !== defaultPrice);
        if (!needsSync) return;
        onVariantsChange(variants.map(v => (v.priceTouched ? v : { ...v, price: defaultPrice })));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [defaultPrice]);

    const handleToggleVariants = (checked: boolean) => {
        onHasVariantsChange(checked);
        if (checked && variants.length === 0) {
            const row = emptyVariantRow(defaultPrice);
            onVariantsChange([row]);
            setOpenVariantKey(row._key);
        }
    };

    const addVariant = () => {
        const row = emptyVariantRow(defaultPrice);
        onVariantsChange([...variants, row]);
        setOpenVariantKey(row._key);
    };

    const updateVariant = (key: string, field: keyof Omit<VariantRow, "_key" | "id" | "priceTouched">, value: string) => {
        onVariantsChange(variants.map(v => v._key === key
            ? { ...v, [field]: value, ...(field === "price" ? { priceTouched: true } : {}) }
            : v
        ));
    };

    const removeVariant = (key: string) => {
        onVariantsChange(variants.filter(v => v._key !== key));
        setOpenVariantKey(prev => (prev === key ? null : prev));
    };

    const handleToggleOptions = (checked: boolean) => {
        onHasOptionsChange(checked);
        if (checked && options.length === 0) {
            const row = emptyOptionRow();
            onOptionsChange([row]);
            setOpenOptionKey(row._key);
        }
    };

    const addOption = () => {
        const row = emptyOptionRow();
        onOptionsChange([...options, row]);
        setOpenOptionKey(row._key);
    };

    const updateOptionName = (key: string, name: string) => {
        onOptionsChange(options.map(o => o._key === key ? { ...o, name } : o));
    };

    const removeOption = (key: string) => {
        onOptionsChange(options.filter(o => o._key !== key));
        setOpenOptionKey(prev => (prev === key ? null : prev));
        setValueInputs(prev => { const next = { ...prev }; delete next[key]; return next; });
    };

    const addOptionValue = (key: string) => {
        const value = (valueInputs[key] || "").trim();
        if (!value) return;
        onOptionsChange(options.map(o => (o._key === key && !o.values.includes(value)) ? { ...o, values: [...o.values, value] } : o));
        setValueInputs(prev => ({ ...prev, [key]: "" }));
    };

    const removeOptionValue = (key: string, value: string) => {
        onOptionsChange(options.map(o => o._key === key ? { ...o, values: o.values.filter(v => v !== value) } : o));
    };

    return (
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black flex items-center gap-2 text-foreground/80">
                <Icon icon="solar:layers-minimalistic-bold-duotone" className="w-5 h-5 text-primary" />
                Variantes & Options
            </h3>

            {/* Variant du produit */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
                <div>
                    <p className="text-sm font-bold text-foreground">Variant du produit</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Couleur, taille... avec leur propre prix/SKU</p>
                </div>
                <Switch checked={hasVariants} onCheckedChange={handleToggleVariants} />
            </div>

            {hasVariants && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {variants.map((row, idx) => (
                        <AccordionSection
                            key={row._key}
                            id={row._key}
                            title={row.title.trim() || `Variante ${idx + 1}`}
                            icon="solar:layers-minimalistic-bold-duotone"
                            activeSection={openVariantKey}
                            onToggle={(id) => setOpenVariantKey(prev => (prev === id ? null : id))}
                            badge={
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); removeVariant(row._key); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeVariant(row._key); } }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                </span>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Titre</label>
                                    <input
                                        value={row.title}
                                        onChange={e => updateVariant(row._key, "title", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        placeholder="ex: Noir"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">SKU</label>
                                    <input
                                        value={row.sku}
                                        onChange={e => updateVariant(row._key, "sku", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        placeholder="ex: 10"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Prix (FCFA)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={row.price}
                                        onChange={e => updateVariant(row._key, "price", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        placeholder="0"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Indicatif — non facturé à l'achat, seul le prix de vente ci-dessus l'est.</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Option 1</label>
                                    <input
                                        value={row.option1}
                                        onChange={e => updateVariant(row._key, "option1", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        placeholder="ex: Taille M"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Option 2</label>
                                    <input
                                        value={row.option2}
                                        onChange={e => updateVariant(row._key, "option2", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Option 3</label>
                                    <input
                                        value={row.option3}
                                        onChange={e => updateVariant(row._key, "option3", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </AccordionSection>
                    ))}

                    <button
                        type="button"
                        onClick={addVariant}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm font-bold text-muted-foreground hover:text-primary transition-all"
                    >
                        <Icon icon="solar:add-circle-bold-duotone" className="w-4 h-4" />
                        Ajouter une variante
                    </button>
                </div>
            )}

            {/* Option du produit */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/60">
                <div>
                    <p className="text-sm font-bold text-foreground">Option du produit</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Ex: Couleur → Noir, Bleu, Rouge</p>
                </div>
                <Switch checked={hasOptions} onCheckedChange={handleToggleOptions} />
            </div>

            {hasOptions && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {options.map((row, idx) => (
                        <AccordionSection
                            key={row._key}
                            id={row._key}
                            title={row.name.trim() || `Option ${idx + 1}`}
                            icon="solar:list-bold-duotone"
                            activeSection={openOptionKey}
                            onToggle={(id) => setOpenOptionKey(prev => (prev === id ? null : id))}
                            badge={
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => { e.stopPropagation(); removeOption(row._key); }}
                                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeOption(row._key); } }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500/10 transition-colors"
                                >
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                </span>
                            }
                        >
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Nom</label>
                                    <input
                                        value={row.name}
                                        onChange={e => updateOptionName(row._key, e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        placeholder="ex: Couleur"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Valeurs</label>
                                    <div className="flex gap-2">
                                        <input
                                            value={valueInputs[row._key] || ""}
                                            onChange={e => setValueInputs(prev => ({ ...prev, [row._key]: e.target.value }))}
                                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOptionValue(row._key); } }}
                                            className="flex-1 px-3 py-2 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                            placeholder="ex: Noir"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => addOptionValue(row._key)}
                                            className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0"
                                        >
                                            <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {row.values.map(val => (
                                            <span key={val} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg flex items-center gap-1">
                                                {val}
                                                <Icon icon="solar:close-circle-bold" className="cursor-pointer w-3.5 h-3.5" onClick={() => removeOptionValue(row._key, val)} />
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </AccordionSection>
                    ))}

                    <button
                        type="button"
                        onClick={addOption}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 text-sm font-bold text-muted-foreground hover:text-primary transition-all"
                    >
                        <Icon icon="solar:add-circle-bold-duotone" className="w-4 h-4" />
                        Ajouter une option
                    </button>
                </div>
            )}
        </div>
    );
}
