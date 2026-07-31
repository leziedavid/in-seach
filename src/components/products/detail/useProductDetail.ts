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
    // RESTAURANT uniquement — accompagnement inclus fixe (le défaut du plat), suppléments
    // en sélection multiple, quantité. Aucun effet sur les autres ProductType : leur
    // handleAddToCart continue d'envoyer une quantité de 1 comme aujourd'hui.
    const [selectedExtraIds, setSelectedExtraIds] = useState<Set<string>>(new Set());
    const [quantity, setQuantity] = useState(1);

    const { addToCart } = useCart();
    const { addNotification } = useNotification();
    const router = useRouter();

    const product = fetchedProduct ?? initialProduct ?? null;
    const imagesList = useMemo(() => resolveProductImages(product), [product]);

    const includedAccompagnement = useMemo(() => product?.accompagnements?.find(a => a.isDefault) ?? null, [product]);
    const extraOptions = useMemo(() => product?.accompagnements?.filter(a => !a.isDefault) ?? [], [product]);
    const toggleExtra = useCallback((optionId: string) => {
        setSelectedExtraIds(prev => {
            const next = new Set(prev);
            if (next.has(optionId)) next.delete(optionId); else next.add(optionId);
            return next;
        });
    }, []);
    const selectedExtras = useMemo(
        () => extraOptions.filter(o => selectedExtraIds.has(o.id)).map(o => ({ id: o.id, name: o.name, supplementPrice: o.supplementPrice })),
        [extraOptions, selectedExtraIds],
    );
    const extrasTotal = useMemo(() => selectedExtras.reduce((s, e) => s + e.supplementPrice, 0), [selectedExtras]);

    // Reset (nouvel id) + fetch de la version à jour du produit.
    useEffect(() => {
        if (!id) return;
        let cancelled = false;
        setAchatType('UNITE');
        setIsRevealed(false);
        setSelectedExtraIds(new Set());
        setQuantity(1);
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
        // Plat RESTAURANT avec accompagnements configurés : le choix (accompagnement inclus +
        // suppléments) a déjà été fait inline sur la page — on l'ajoute directement, sans
        // repasser par la modale popup (voir CartProvider.addToCart, param `preSelected`).
        if (product.productType === 'RESTAURANT' && product.accompagnements && product.accompagnements.length > 0) {
            addToCart(product, quantity, achatType, {
                accompagnementId: includedAccompagnement?.id,
                accompagnementName: includedAccompagnement?.name,
                accompagnementSupplement: 0,
                extras: selectedExtras,
            });
        } else {
            addToCart(product, 1, achatType);
        }
        addNotification(`"${product.name}" ajouté au panier${achatType === 'GROS' ? ' (Gros)' : ''}`, "success");
    }, [product, achatType, quantity, includedAccompagnement, selectedExtras, addToCart, addNotification]);

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
    // extrasTotal ajouté uniquement pour RESTAURANT — nul (0) pour tous les autres
    // ProductType, donc displayPrice reste strictement identique à avant pour eux.
    const displayPrice = product ? (achatType === 'GROS' && product.prixVenteGros ? product.prixVenteGros : product.pricePromo ?? product.price) + (product.productType === 'RESTAURANT' ? extrasTotal : 0) : 0;
    const originalPrice = product ? (achatType === 'GROS' ? null : (product.pricePromo ? product.price : null)) : null;
    const discount = product ? (achatType !== 'GROS' ? product.discountPercent : null) : null;

    return {
        product, loading, imagesList, storeInfo,
        achatType, setAchatType, isNegotiating, isRevealed, setIsRevealed,
        displayPrice, originalPrice, discount,
        handleAddToCart, handleNegotiate,
        // RESTAURANT uniquement
        includedAccompagnement, extraOptions, selectedExtraIds, toggleExtra, selectedExtras, extrasTotal,
        quantity, setQuantity,
    };
}
