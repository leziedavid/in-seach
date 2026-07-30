"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { getSimilarProducts } from "@/api/api";
import { Product } from "@/types/interface";
import ProductCard from "@/components/products/cards/ProductCard";
import InfiniteScroll from "@/components/ui/InfiniteScroll";

interface SimilarProductsProps {
    productId: string;
    title?: string;
}

/**
 * Section "Autre chose ?" — produits de la même catégorie, grille paginée en défilement
 * infini : 3 par lot sur mobile, 4 sur desktop (chaque "loadMore" charge une ligne complète,
 * jamais une ligne à moitié vide). Réutilise ProductCard/InfiniteScroll déjà en place ailleurs
 * dans l'app — pas de nouveau composant de carte à maintenir.
 */
export default function SimilarProducts({ productId, title = "Autre chose ?" }: SimilarProductsProps) {
    const [isDesktop, setIsDesktop] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const loadingRef = useRef(false);

    useEffect(() => {
        const check = () => setIsDesktop(window.innerWidth >= 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const limit = isDesktop ? 4 : 3;

    const fetchPage = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const res = await getSimilarProducts(productId, { page: pageNum, limit });
            if (res.statusCode === 200 && res.data) {
                const newItems = res.data.data;
                setProducts(prev => {
                    const combined = isNewSearch ? newItems : [...prev, ...newItems];
                    return Array.from(new Map(combined.map(p => [p.id, p])).values());
                });
                setHasMore(pageNum < res.data.totalPages);
            } else {
                setHasMore(false);
            }
        } catch {
            setHasMore(false);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [productId, limit]);

    // Reset + fetch initial quand le produit ou la taille de lot (breakpoint) change.
    useEffect(() => {
        setPage(1);
        fetchPage(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, limit]);

    useEffect(() => {
        if (page > 1) fetchPage(page, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    if (!loading && products.length === 0) return null;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground">{title}</h3>
            <InfiniteScroll
                items={products}
                loadMore={() => setPage(p => p + 1)}
                hasMore={hasMore}
                isLoading={loading}
                skeletonType="product"
                skeletonCount={limit}
                gridClassName="grid grid-cols-3 gap-2 md:grid-cols-4 md:gap-4"
                renderItem={(product) => <ProductCard product={product} />}
            />
        </div>
    );
}
