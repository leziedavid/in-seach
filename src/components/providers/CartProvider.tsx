"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types/interface";
import { getUserId } from "@/lib/auth";
import { toast } from "sonner";
import AccompagnementPickerModal from "@/components/restaurant/modals/AccompagnementPickerModal";

interface CartItem extends Product {
    quantity: number;
    achatType?: 'UNITE' | 'GROS';
    accompagnementId?: string;
    accompagnementName?: string;
    accompagnementSupplement?: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, achatType?: 'UNITE' | 'GROS') => void;
    removeFromCart: (productId: string, achatType?: 'UNITE' | 'GROS', accompagnementId?: string) => void;
    updateQuantity: (productId: string, quantity: number, achatType?: 'UNITE' | 'GROS', accompagnementId?: string) => void;
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
    ) => {
        const itemPrice = (product.pricePromo !== undefined && product.pricePromo !== null && product.pricePromo > 0)
            ? product.pricePromo
            : product.price;

        const effectiveProduct = {
            ...product,
            price: itemPrice
        };

        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === effectiveProduct.id && item.achatType === achatType && item.accompagnementId === accompagnementId);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === effectiveProduct.id && item.achatType === achatType && item.accompagnementId === accompagnementId
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevCart, { ...effectiveProduct, quantity, achatType, accompagnementId, accompagnementName, accompagnementSupplement }];
        });
    }, []);

    const addToCart = useCallback((product: Product, quantity: number = 1, achatType: 'UNITE' | 'GROS' = 'UNITE') => {
        if (product.productType === 'SUPPLIER') {
            toast.error("Ce produit Fournisseur nécessite une demande de devis, il ne peut pas être ajouté au panier.");
            return;
        }

        const currentUserId = getUserId();
        if (currentUserId && product.userId === currentUserId) {
            toast.error("Vous ne pouvez pas acheter votre propre produit.");
            return;
        }

        // Plat proposant des accompagnements : on ne l'ajoute pas encore, on demande d'abord
        // au client d'en choisir un (un seul, voir AccompagnementPickerModal) — même entrée
        // "Ajouter" pour ProductCard/useProductDetail, aucun changement de leur côté.
        if (product.accompagnements && product.accompagnements.length > 0) {
            setPendingSelection({ product, quantity, achatType });
            return;
        }

        commitAddToCart(product, quantity, achatType);
    }, [commitAddToCart]);

    const removeFromCart = useCallback((productId: string, achatType: 'UNITE' | 'GROS' = 'UNITE', accompagnementId?: string) => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.achatType === achatType && item.accompagnementId === accompagnementId)));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, achatType: 'UNITE' | 'GROS' = 'UNITE', accompagnementId?: string) => {
        if (quantity <= 0) {
            setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.achatType === achatType && item.accompagnementId === accompagnementId)));
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === productId && item.achatType === achatType && item.accompagnementId === accompagnementId ? { ...item, quantity } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const totalAmount = useMemo(() => cart.reduce((sum, item) => {
        const supplement = item.accompagnementSupplement ?? 0;
        if (item.achatType === 'GROS' && item.typeVente === 'GROS' && item.prixVenteGros) {
            return sum + item.prixVenteGros + supplement;
        }
        const effectivePrice = (item.pricePromo !== undefined && item.pricePromo !== null && item.pricePromo > 0)
            ? item.pricePromo
            : item.price;
        return sum + (effectivePrice + supplement) * item.quantity;
    }, 0), [cart]);

    const value = useMemo(() => ({
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalAmount,
    }), [cart, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalAmount]);

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
