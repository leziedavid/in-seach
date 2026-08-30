"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Product, CartSelection } from "@/types/interface";
import { getUserId } from "@/lib/auth";
import { toast } from "sonner";
import AccompagnementPickerModal from "@/components/restaurant/modals/AccompagnementPickerModal";

interface CartExtra { id: string; name: string; supplementPrice: number }

interface CartItem extends Product {
    quantity: number;
    achatType?: 'UNITE' | 'GROS';
    accompagnementId?: string;
    accompagnementName?: string;
    accompagnementSupplement?: number;
    // Suppléments additionnels (sélection multiple, en plus de l'accompagnement inclus
    // ci-dessus) — choisis inline sur products/detail pour un plat RESTAURANT.
    selectedExtras?: CartExtra[];
    // Variantes/options choisies pour un produit Marketplace générique (hasVariants/hasOptions
    // — indépendant de productType, jamais utilisé en même temps que les champs accompagnement
    // ci-dessus). {id, label} — id réel en base (voir CartSelection), purement informatif pour
    // le vendeur, sans impact sur le prix (voir MarketplaceVariantsOptionsSection).
    selectedVariants?: CartSelection[];
    selectedOptions?: CartSelection[];
}

// Clé stable pour comparer deux sélections d'extras (ordre indifférent) — deux mêmes plats
// avec des suppléments différents doivent rester deux lignes de panier distinctes.
function extrasSignature(extras?: CartExtra[]): string {
    return (extras ?? []).map((e) => e.id).slice().sort().join(',');
}

// Même idée que extrasSignature ci-dessus, pour les variantes/options sélectionnées (ordre
// indifférent) — deux mêmes produits avec des sélections différentes restent deux lignes de
// panier distinctes. Clé = id + label (pas juste id) : pour une option, `id` est celui du
// GROUPE (ex. ProductOption "Couleur") et peut se répéter entre deux valeurs différentes
// choisies dans ce même groupe (ex. Noir et Bleu) — label seul les distingue.
function selectionSignature(list?: CartSelection[]): string {
    return (list ?? []).map((s) => `${s.id}:${s.label}`).slice().sort().join(',');
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, achatType?: 'UNITE' | 'GROS', preSelected?: {
        accompagnementId?: string; accompagnementName?: string; accompagnementSupplement?: number; extras?: CartExtra[];
        selectedVariants?: CartSelection[]; selectedOptions?: CartSelection[];
    }) => void;
    removeFromCart: (productId: string, achatType?: 'UNITE' | 'GROS', accompagnementId?: string, extras?: CartExtra[], selectedVariants?: CartSelection[], selectedOptions?: CartSelection[]) => void;
    updateQuantity: (productId: string, quantity: number, achatType?: 'UNITE' | 'GROS', accompagnementId?: string, extras?: CartExtra[], selectedVariants?: CartSelection[], selectedOptions?: CartSelection[]) => void;
    // Retire une variante ou une option sélectionnée d'une ligne de panier déjà ajoutée, et
    // recalcule automatiquement sa quantité (max(variantes, options) restantes, ou 1 si plus
    // aucune sélection) — voir CartDetailModal.tsx. Si le résultat coïncide avec une ligne déjà
    // existante (mêmes sélections restantes), les deux fusionnent au lieu de dupliquer.
    removeSelectionFromCartItem: (item: CartItem, kind: 'variant' | 'option', selection: CartSelection) => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    // Plat proposant des accompagnements en attente du choix du client (voir addToCart) —
    // tant que non nul, la modale de sélection est ouverte et rien n'est encore dans le panier.
    const [pendingSelection, setPendingSelection] = useState<{ product: Product; quantity: number; achatType: 'UNITE' | 'GROS' } | null>(null);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart) as CartItem[];
                const mappedCart = parsedCart.map(item => ({
                    ...item,
                    price: (item.pricePromo !== undefined && item.pricePromo !== null && item.pricePromo > 0)
                        ? item.pricePromo
                        : item.price
                }));
                setCart(mappedCart);
            } catch (error) {
                console.error("Failed to parse cart from localStorage", error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cart));
    }, [cart]);

    // Ajout réel au panier — appelé directement pour un produit sans accompagnement, ou après
    // confirmation de la modale de sélection pour un plat qui en propose.
    const commitAddToCart = useCallback((
        product: Product, quantity: number, achatType: 'UNITE' | 'GROS',
        accompagnementId?: string, accompagnementName?: string, accompagnementSupplement?: number,
        extras?: CartExtra[], selectedVariants?: CartSelection[], selectedOptions?: CartSelection[],
    ) => {
        const itemPrice = (product.pricePromo !== undefined && product.pricePromo !== null && product.pricePromo > 0)
            ? product.pricePromo
            : product.price;

        const effectiveProduct = {
            ...product,
            price: itemPrice
        };
        const extrasKey = extrasSignature(extras);
        const variantsKey = selectionSignature(selectedVariants);
        const optionsKey = selectionSignature(selectedOptions);

        setCart((prevCart) => {
            const matches = (item: CartItem) => item.id === effectiveProduct.id && item.achatType === achatType && item.accompagnementId === accompagnementId && extrasSignature(item.selectedExtras) === extrasKey && selectionSignature(item.selectedVariants) === variantsKey && selectionSignature(item.selectedOptions) === optionsKey;
            const existingItem = prevCart.find(matches);
            if (existingItem) {
                return prevCart.map((item) =>
                    matches(item) ? { ...item, quantity: item.quantity + quantity } : item
                );
            }
            return [...prevCart, { ...effectiveProduct, quantity, achatType, accompagnementId, accompagnementName, accompagnementSupplement, selectedExtras: extras, selectedVariants, selectedOptions }];
        });
    }, []);

    const addToCart = useCallback((product: Product, quantity: number = 1, achatType: 'UNITE' | 'GROS' = 'UNITE', preSelected?: {
        accompagnementId?: string; accompagnementName?: string; accompagnementSupplement?: number; extras?: CartExtra[];
        selectedVariants?: CartSelection[]; selectedOptions?: CartSelection[];
    }) => {
        if (product.productType === 'SUPPLIER') {
            toast.error("Ce produit Fournisseur nécessite une demande de devis, il ne peut pas être ajouté au panier.");
            return;
        }

        const currentUserId = getUserId();
        if (currentUserId && product.userId === currentUserId) {
            toast.error("Vous ne pouvez pas acheter votre propre produit.");
            return;
        }

        // Sélection déjà faite en amont (page/modale de détail produit RESTAURANT ou Marketplace
        // avec variantes/options, voir useProductDetail.ts) — on ajoute directement, sans
        // repasser par la modale popup.
        if (preSelected) {
            commitAddToCart(product, quantity, achatType, preSelected.accompagnementId, preSelected.accompagnementName, preSelected.accompagnementSupplement, preSelected.extras, preSelected.selectedVariants, preSelected.selectedOptions);
            return;
        }

        // Plat proposant des accompagnements : on ne l'ajoute pas encore, on demande d'abord
        // au client d'en choisir un (un seul, voir AccompagnementPickerModal) — même entrée
        // "Ajouter" pour ProductCard, aucun changement de son côté.
        if (product.accompagnements && product.accompagnements.length > 0) {
            setPendingSelection({ product, quantity, achatType });
            return;
        }

        commitAddToCart(product, quantity, achatType);
    }, [commitAddToCart]);

    const removeFromCart = useCallback((productId: string, achatType: 'UNITE' | 'GROS' = 'UNITE', accompagnementId?: string, extras?: CartExtra[], selectedVariants?: CartSelection[], selectedOptions?: CartSelection[]) => {
        const extrasKey = extrasSignature(extras);
        const variantsKey = selectionSignature(selectedVariants);
        const optionsKey = selectionSignature(selectedOptions);
        setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.achatType === achatType && item.accompagnementId === accompagnementId && extrasSignature(item.selectedExtras) === extrasKey && selectionSignature(item.selectedVariants) === variantsKey && selectionSignature(item.selectedOptions) === optionsKey)));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, achatType: 'UNITE' | 'GROS' = 'UNITE', accompagnementId?: string, extras?: CartExtra[], selectedVariants?: CartSelection[], selectedOptions?: CartSelection[]) => {
        const extrasKey = extrasSignature(extras);
        const variantsKey = selectionSignature(selectedVariants);
        const optionsKey = selectionSignature(selectedOptions);
        const matches = (item: CartItem) => item.id === productId && item.achatType === achatType && item.accompagnementId === accompagnementId && extrasSignature(item.selectedExtras) === extrasKey && selectionSignature(item.selectedVariants) === variantsKey && selectionSignature(item.selectedOptions) === optionsKey;
        if (quantity <= 0) {
            setCart((prevCart) => prevCart.filter((item) => !matches(item)));
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) => matches(item) ? { ...item, quantity } : item)
        );
    }, []);

    // Retrait d'une variante/option depuis le panier — opération atomique en un seul setCart :
    // retire l'ancienne ligne (signature de sélection d'avant) et réinsère avec la sélection et
    // la quantité recalculées, en fusionnant avec une ligne existante si la nouvelle sélection
    // coïncide déjà avec une autre ligne du panier (même logique de fusion que commitAddToCart).
    const removeSelectionFromCartItem = useCallback((item: CartItem, kind: 'variant' | 'option', selection: CartSelection) => {
        // Comparaison id + label (pas juste id) : pour une option, deux valeurs différentes du
        // même groupe partagent le même id (voir selectionSignature) — label seul les distingue.
        const newVariants = kind === 'variant'
            ? (item.selectedVariants ?? []).filter((v) => !(v.id === selection.id && v.label === selection.label))
            : item.selectedVariants;
        const newOptions = kind === 'option'
            ? (item.selectedOptions ?? []).filter((o) => !(o.id === selection.id && o.label === selection.label))
            : item.selectedOptions;
        const hasSelection = !!(newVariants?.length || newOptions?.length);
        const newQuantity = hasSelection ? Math.max(newVariants?.length ?? 0, newOptions?.length ?? 0) : 1;

        const extrasKey = extrasSignature(item.selectedExtras);
        const oldVariantsKey = selectionSignature(item.selectedVariants);
        const oldOptionsKey = selectionSignature(item.selectedOptions);
        const newVariantsKey = selectionSignature(newVariants);
        const newOptionsKey = selectionSignature(newOptions);

        setCart((prevCart) => {
            const isOldLine = (i: CartItem) => i.id === item.id && i.achatType === item.achatType && i.accompagnementId === item.accompagnementId && extrasSignature(i.selectedExtras) === extrasKey && selectionSignature(i.selectedVariants) === oldVariantsKey && selectionSignature(i.selectedOptions) === oldOptionsKey;
            const withoutOld = prevCart.filter((i) => !isOldLine(i));
            const mergeTarget = withoutOld.find((i) => i.id === item.id && i.achatType === item.achatType && i.accompagnementId === item.accompagnementId && extrasSignature(i.selectedExtras) === extrasKey && selectionSignature(i.selectedVariants) === newVariantsKey && selectionSignature(i.selectedOptions) === newOptionsKey);
            if (mergeTarget) {
                return withoutOld.map((i) => i === mergeTarget ? { ...i, quantity: i.quantity + newQuantity } : i);
            }
            return [...withoutOld, { ...item, selectedVariants: newVariants, selectedOptions: newOptions, quantity: newQuantity }];
        });
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const totalAmount = useMemo(() => cart.reduce((sum, item) => {
        const supplement = item.accompagnementSupplement ?? 0;
        const extrasSum = (item.selectedExtras ?? []).reduce((s, e) => s + e.supplementPrice, 0);
        if (item.achatType === 'GROS' && item.typeVente === 'GROS' && item.prixVenteGros) {
            return sum + item.prixVenteGros + supplement + extrasSum;
        }
        const effectivePrice = (item.pricePromo !== undefined && item.pricePromo !== null && item.pricePromo > 0)
            ? item.pricePromo
            : item.price;
        return sum + (effectivePrice + supplement + extrasSum) * item.quantity;
    }, 0), [cart]);

    const value = useMemo(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        removeSelectionFromCartItem,
        clearCart,
        totalItems,
        totalAmount,
    }), [cart, addToCart, removeFromCart, updateQuantity, removeSelectionFromCartItem, clearCart, totalItems, totalAmount]);

    return (
        <CartContext.Provider value={value}>
            {children}
            <AccompagnementPickerModal
                isOpen={!!pendingSelection}
                product={pendingSelection?.product ?? null}
                onClose={() => setPendingSelection(null)}
                onConfirm={(accompagnementId, accompagnementName, accompagnementSupplement) => {
                    if (pendingSelection) {
                        commitAddToCart(pendingSelection.product, pendingSelection.quantity, pendingSelection.achatType, accompagnementId, accompagnementName, accompagnementSupplement);
                    }
                    setPendingSelection(null);
                }}
            />
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
};
