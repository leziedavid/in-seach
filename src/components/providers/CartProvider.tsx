"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types/interface";
import { getUserId } from "@/lib/auth";
import { toast } from "sonner";

interface CartItem extends Product {
    quantity: number;
    achatType?: 'UNITE' | 'GROS';
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, quantity?: number, achatType?: 'UNITE' | 'GROS') => void;
    removeFromCart: (productId: string, achatType?: 'UNITE' | 'GROS') => void;
    updateQuantity: (productId: string, quantity: number, achatType?: 'UNITE' | 'GROS') => void;
    clearCart: () => void;
    totalItems: number;
    totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);

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

    const addToCart = useCallback((product: Product, quantity: number = 1, achatType: 'UNITE' | 'GROS' = 'UNITE') => {
        const currentUserId = getUserId();
        if (currentUserId && product.userId === currentUserId) {
            toast.error("Vous ne pouvez pas acheter votre propre produit.");
            return;
        }

        const itemPrice = (product.pricePromo !== undefined && product.pricePromo !== null && product.pricePromo > 0)
            ? product.pricePromo
            : product.price;

        const effectiveProduct = {
            ...product,
            price: itemPrice
        };

        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === effectiveProduct.id && item.achatType === achatType);
            if (existingItem) {
                return prevCart.map((item) =>
                    item.id === effectiveProduct.id && item.achatType === achatType
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prevCart, { ...effectiveProduct, quantity, achatType }];
        });
    }, []);

    const removeFromCart = useCallback((productId: string, achatType: 'UNITE' | 'GROS' = 'UNITE') => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.achatType === achatType)));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number, achatType: 'UNITE' | 'GROS' = 'UNITE') => {
        if (quantity <= 0) {
            setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.achatType === achatType)));
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.id === productId && item.achatType === achatType ? { ...item, quantity } : item
            )
        );
    }, []);

    const clearCart = useCallback(() => {
        setCart([]);
    }, []);

    const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
    const totalAmount = useMemo(() => cart.reduce((sum, item) => {
        if (item.achatType === 'GROS' && item.typeVente === 'GROS' && item.prixVenteGros) {
            return sum + item.prixVenteGros;
        }
        const effectivePrice = (item.pricePromo !== undefined && item.pricePromo !== null && item.pricePromo > 0)
            ? item.pricePromo
            : item.price;
        return sum + effectivePrice * item.quantity;
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
