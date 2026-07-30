"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/MotionModal";
import { Product } from "@/types/interface";

interface AccompagnementPickerModalProps {
    isOpen: boolean;
    product: Product | null;
    onClose: () => void;
    onConfirm: (accompagnementId: string, accompagnementName: string, accompagnementSupplement: number) => void;
}

/**
 * Sélection de l'accompagnement d'un plat avant ajout au panier (façon Glovo) — un seul choix
 * possible pour cette première version. Rendue par CartProvider.tsx, ouverte automatiquement
 * par addToCart() quand le produit propose des accompagnements (Product.accompagnements).
 */
export default function AccompagnementPickerModal({ isOpen, product, onClose, onConfirm }: AccompagnementPickerModalProps) {
    const options = product?.accompagnements || [];
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && options.length > 0) {
            setSelectedId(options.find(o => o.isDefault)?.id ?? options[0].id);
        }
    }, [isOpen, product?.id]);

    if (!product) return null;

    const basePrice = (product.pricePromo != null && product.pricePromo > 0) ? product.pricePromo : product.price;
    const selected = options.find(o => o.id === selectedId);
    const total = basePrice + (selected?.supplementPrice ?? 0);

    const handleConfirm = () => {
        if (!selected) return;
        onConfirm(selected.id, selected.name, selected.supplementPrice);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 space-y-5">
                <div>
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <Icon icon="solar:bowl-bold-duotone" className="w-5 h-5 text-primary" />
                        {product.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">{basePrice.toLocaleString()} FCFA</p>
                </div>

                <div className="space-y-2">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">Choisissez votre accompagnement</p>
                    {options.map(option => {
                        const isSelected = selectedId === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => setSelectedId(option.id)}
                                className={`w-full flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:border-primary/30'}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-primary' : 'border-muted-foreground/30'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                                    </div>
                                    <span className="text-sm font-bold text-foreground truncate">{option.name}</span>
                                </div>
                                {option.isDefault ? (
                                    <span className="text-[11px] font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400 shrink-0">Gratuit</span>
                                ) : (
                                    <span className="text-xs font-black text-primary shrink-0">+{option.supplementPrice.toLocaleString()} FCFA</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                    <span className="text-sm font-bold text-foreground">Total</span>
                    <span className="text-lg font-black text-primary">{total.toLocaleString()} FCFA</span>
                </div>

                <button
                    onClick={handleConfirm}
                    disabled={!selected}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="w-4 h-4" />
                    Ajouter au panier
                </button>
            </div>
        </Modal>
    );
}
