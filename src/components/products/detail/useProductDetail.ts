"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, StoreUserInfo } from "@/types/interface";
import { useCart } from "@/components/providers/CartProvider";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { isAuthenticated, getUserId } from "@/lib/auth";
import { createChatConversation, getPublicStoreInfo, getProductById } from "@/api/api";

export function resolveProductImages(p: Product | null | undefined): string[] {
    if (!p) return [];
    if (p.files && p.files.length > 0) return p.files.map(f => f.fileUrl).filter(Boolean);
    if (p.images && p.images.length > 0) return p.images;
    if (p.imageUrl) return [p.imageUrl];
    return [];
}

/**
 * État + logique partagés entre ProductDetailModal.tsx et produit/[id]/page.tsx (ex-duplication
 * ~90% identique entre les deux). `initialProduct` permet un affichage instantané côté modal
 * (donnée déjà en main via ProductCard) pendant que la version fraîche se charge en fond ; la
 * page dédiée n'a pas de donnée initiale et affiche son propre skeleton tant que rien n'est chargé.
 */
export function useProductDetail(id: string | undefined, initialProduct?: Product | null) {
    const [fetchedProduct, setFetchedProduct] = useState<Product | null>(null);
    const [storeInfo, setStoreInfo] = useState<StoreUserInfo | null>(null);
    const [achatType, setAchatType] = useState<'UNITE' | 'GROS'>('UNITE');
    const [isNegotiating, setIsNegotiating] = useState(false);
    const [isRevealed, setIsRevealed] = useState(false);
    const [loading, setLoading] = useState(!initialProduct);

    const { addToCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();

    const product = fetchedProduct ?? initialProduct ?? null;
    const imagesList = useMemo(() => resolveProductImages(product), [product]);

    // Reset (nouvel id) + fetch de la version à jour du produit.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setAchatType('UNITE');
        setIsRevealed(false);
        setLoading(!initialProduct);
        (async () => {
            try {
                const res = await getProductById(id);
                if (!cancelled && res.statusCode === 200 && res.data) setFetchedProduct(res.data);
            } catch { /* silent */ }
            finally { if (!cancelled) setLoading(false); }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        const storeName = product?.user?.storeName;
        if (!storeName) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await getPublicStoreInfo(storeName);
                if (!cancelled && res.statusCode === 200 && res.data) setStoreInfo(res.data);
            } catch { /* silent */ }
        })();
        return () => { cancelled = true; };
    }, [product?.user?.storeName]);

    const handleAddToCart = useCallback(() => {
        if (!product) return;
        addToCart(product, 1, achatType);
        addNotification(`"${product.name}" ajouté au panier${achatType === 'GROS' ? ' (Gros)' : ''}`, "success");
    }, [product, achatType, addToCart, addNotification]);

    const handleNegotiate = useCallback(async () => {
        if (!product) return;
        if (!isAuthenticated()) {
            addNotification("Veuillez vous connecter pour négocier", "error");
            router.push("/login");
            return;
        }
        const currentUserId = getUserId();
        const ownerId = product.user?.id || product.userId;
        if (currentUserId === ownerId) {
            addNotification("Vous ne pouvez pas négocier votre propre produit", "warning");
            return;
        }
        setIsNegotiating(true);
        try {
            const participant2Id = product.user?.id || product.userId;
            if (!participant2Id) { addNotification("Impossible d'identifier le propriétaire.", "error"); return; }
            const res = await createChatConversation({ participant2Id });
            if (res.statusCode === 200 || res.statusCode === 201) {
                const initialMessage = `Bonjour, je suis intéressé par votre produit "${product.name}" (Prix: ${product.price.toLocaleString()} FCFA). Pouvons-nous en discuter ?`;
                sessionStorage.setItem("pending_negotiation", JSON.stringify({ conversationId: res.data.id, message: initialMessage, productId: product.id }));
                router.push("/chat-ia");
            } else {
                addNotification("Erreur lors de la création de la conversation", "error");
            }
        } catch { addNotification("Une erreur est survenue", "error"); }
        finally { setIsNegotiating(false); }
    }, [product, router, addNotification]);

    // ── Prix affiché ─────────────────────────────────────────────────────
    const displayPrice = product ? (achatType === 'GROS' && product.prixVenteGros ? product.prixVenteGros : product.pricePromo ?? product.price) : 0;
    const originalPrice = product ? (achatType === 'GROS' ? null : (product.pricePromo ? product.price : null)) : null;
    const discount = product ? (achatType !== 'GROS' ? product.discountPercent : null) : null;

    return {
        product, loading, imagesList, storeInfo,
        achatType, setAchatType, isNegotiating, isRevealed, setIsRevealed,
        displayPrice, originalPrice, discount,
        handleAddToCart, handleNegotiate,
    };
}
