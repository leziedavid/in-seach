"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { Product, productConditionLabels } from "@/types/interface";
import TextDisplayBox from "@/components/home/TextDisplayBox";
import { AccordionSection } from "@/components/ui/AccordionSection";
import NegotiateButton from "@/components/products/detail/NegotiateButton";

/**
 * Petits blocs de présentation partagés entre ProductDetailModal.tsx et produit/[id]/page.tsx —
 * évite de dupliquer une seconde fois ces fragments après extraction des gros morceaux
 * (galerie, carte vendeur, hook) dans leurs propres fichiers.
 */

export function CategoryChip({ category, inStock }: { category?: string; inStock: boolean }) {
    return (
        <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-[11px] font-black uppercase tracking-tight rounded-full">
                {category || "Produit"}
                <Icon icon="solar:alt-arrow-right-bold" className="w-3 h-3 opacity-60" />
            </span>
            <span className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-tight rounded-full ${inStock ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500"}`}>
                {inStock ? "En stock" : "Épuisé"}
            </span>
        </div>
    );
}

export function PriceBlock({ achatType, setAchatType, typeVente, displayPrice, originalPrice, prixVenteGros }: {
    achatType: 'UNITE' | 'GROS'; setAchatType: (t: 'UNITE' | 'GROS') => void;
    typeVente?: string; displayPrice: number; originalPrice: number | null; prixVenteGros?: number | null;
}) {
    return (
        <div className="space-y-3">
            {typeVente === 'GROS' && (
                <div className="flex gap-2">
                    {(['UNITE', 'GROS'] as const).map(t => (
                        <label key={t} className={`flex items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-all flex-1 ${achatType === t ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'}`}>
                            <input type="radio" name="achatType" value={t} checked={achatType === t} onChange={() => setAchatType(t)} className="hidden" />
                            <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${achatType === t ? 'border-primary' : 'border-muted-foreground'}`}>
                                {achatType === t && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <span className="text-xs font-bold">{t === 'UNITE' ? "À l'unité" : "En gros"}</span>
                        </label>
                    ))}
                </div>
            )}
            <div className="flex items-end gap-3 flex-wrap">
                <span className="text-3xl font-black text-emerald-600 leading-none">
                    {displayPrice.toLocaleString()} <span className="text-base">FCFA</span>
                </span>
                {originalPrice && (
                    <span className="text-base font-bold text-muted-foreground/60 line-through leading-none">
                        {originalPrice.toLocaleString()} FCFA
                    </span>
                )}
                {achatType === 'GROS' && prixVenteGros && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg">PRIX GROS</span>
                )}
            </div>
        </div>
    );
}

export function Spec({ label, value, upper, tone }: { label: string; value: string; upper?: boolean; tone?: "success" | "danger" }) {
    return (
        <div className="p-3 bg-muted/50 rounded-xl">
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-0.5">{label}</p>
            <p className={`text-xs font-black ${upper ? "uppercase truncate" : "truncate"} ${tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-red-500" : ""}`}>{value}</p>
        </div>
    );
}

export function DetailAccordions({ activeAccordion, onToggle, description, product }: {
    activeAccordion: string | null; onToggle: (id: string) => void; description?: string | null; product: Product;
}) {
    return (
        <div className="space-y-2">
            <AccordionSection id="description" title="Description" icon="solar:document-text-bold-duotone" activeSection={activeAccordion} onToggle={onToggle}>
                <TextDisplayBox text={description || "Aucune description disponible."} isHtml />
            </AccordionSection>
            <AccordionSection id="specs" title="Détails du produit" icon="solar:widget-5-bold-duotone" activeSection={activeAccordion} onToggle={onToggle}>
                <div className="grid grid-cols-2 gap-2">
                    <Spec label="État" value={productConditionLabels[product.etat] || product.etat} />
                    <Spec label="Référence" value={product.sku || product.id.slice(0, 8)} upper />
                    <Spec label="Catégorie" value={product.category?.name || "—"} />
                    <Spec label="Stock" value={product.stock > 0 ? `${product.stock} dispo` : "Épuisé"} tone={product.stock > 0 ? "success" : "danger"} />
                </div>
            </AccordionSection>
        </div>
    );
}

export function ProductFooter({ displayPrice, isSupplierProduct, isNegotiating, onNegotiate, onAddToCart, onRequestQuote }: {
    displayPrice: number; isSupplierProduct: boolean; isNegotiating: boolean;
    onNegotiate: () => void; onAddToCart: () => void; onRequestQuote: () => void;
}) {
    return (
        <div className="shrink-0 px-4 py-3 bg-[#FBFAF6] dark:bg-zinc-900 border-t border-[#EEF1F4] dark:border-zinc-800 flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total</p>
                <p className="text-xl md:text-2xl font-black leading-none truncate">{displayPrice.toLocaleString()} <span className="text-xs font-bold text-muted-foreground">FCFA</span></p>
            </div>
            <NegotiateButton onClick={onNegotiate} loading={isNegotiating} variant="compact" />
            {isSupplierProduct ? (
                <button onClick={onRequestQuote}
                    className="py-3.5 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 shrink-0">
                    <Icon icon="solar:delivery-bold-duotone" width={18} />
                    <span className="hidden sm:inline">Je souhaite être livré</span>
                    <span className="sm:hidden">Livraison</span>
                </button>
            ) : (
                <button onClick={onAddToCart}
                    className="w-14 h-14 shrink-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground active:scale-90 transition-all shadow-lg shadow-primary/30 flex items-center justify-center">
                    <Icon icon="solar:add-circle-bold" width={26} />
                </button>
            )}
        </div>
    );
}
