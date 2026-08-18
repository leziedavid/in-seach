"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { StoreUserInfo } from "@/types/interface";
import { getAllStores } from "@/api/api";
import InfiniteScroll from "@/components/ui/InfiniteScroll";
import SearchInput from "@/components/shared/SearchInput";
import { createStoreSlug } from "@/utils/storeSlug";

type Store = StoreUserInfo & { productCount: number; id: string };

const LIMIT = 12;

// ── Composants stables (hors du composant principal) ─────────────────────────

const StoreCard = ({ store, viewMode = 'grid' }: { store: Store; viewMode?: 'grid' | 'list' }) => {
    const isList = viewMode === 'list';
    return (
        <Link href={`/shop/${createStoreSlug(store.storeName || "boutique")}`}>
            <div className={`bg-card rounded-2xl hover:shadow-md transition-all duration-200 cursor-pointer group border border-transparent hover:border-primary/20 h-full ${isList ? "flex items-center gap-3 p-3" : "p-4 space-y-3"}`}>
                <div className={`flex items-center gap-3 ${isList ? "flex-1 min-w-0" : ""}`}>
                    <div className={`rounded-full bg-primary/10 relative overflow-hidden shrink-0 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all ${isList ? "w-11 h-11" : "w-14 h-14"}`}>
                        {store.storeLogo ? (
                            <Image src={store.storeLogo} alt={store.storeName || "Boutique"} fill className="object-cover" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Icon icon="solar:shop-2-bold-duotone" className={isList ? "w-5 h-5 text-primary" : "w-7 h-7 text-primary"} />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-black text-sm truncate group-hover:text-primary transition-colors">
                            {store.storeName}
                        </p>
                        {store.fullName && (
                            <p className="text-xs text-muted-foreground truncate">{store.fullName}</p>
                        )}
                    </div>
                    {!isList && <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />}
                </div>
                {isList ? (
                    <div className="flex items-center gap-2 shrink-0 pl-3 border-l border-border/40">
                        <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                            <strong className="text-foreground font-black">{store.productCount}</strong> art.
                        </span>
                        <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <Icon icon="solar:box-bold-duotone" className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-xs text-muted-foreground">
                            <strong className="text-foreground font-black">{store.productCount}</strong> article{store.productCount !== 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>
        </Link>
    );
};

const ViewToggle = ({ viewMode, setViewMode }: { viewMode: 'grid' | 'list'; setViewMode: (v: 'grid' | 'list') => void }) => (
    <div className="flex items-center bg-card border border-border/50 rounded-xl p-1 shadow-sm shrink-0">
        <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Grille">
            <Icon icon="solar:widget-5-bold-duotone" className="w-5 h-5" />
        </button>
        <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`} title="Vue Liste">
            <Icon icon="solar:list-bold-duotone" className="w-5 h-5" />
        </button>
    </div>
);

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
        <Icon icon="solar:shop-bold-duotone" width={56} className="opacity-20" />
        <p className="font-black">Aucune boutique trouvée</p>
    </div>
);

// ── Page principale ───────────────────────────────────────────────────────────

export default function ShopSellersContent() {
    const [mounted, setMounted] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => { setMounted(true); }, []);
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isResetting = useRef(false);

    // Debounce search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [search]);

    const fetchPage = useCallback(async (targetPage: number, query: string) => {
        setIsLoading(true);
        try {
            const res = await getAllStores({
                page: targetPage,
                limit: LIMIT,
                ...(query ? { storeName: query } : {}),
            });
            if (res.statusCode === 200 && res.data) {
                const pagination = res.data;
                const newItems: Store[] = Array.isArray(pagination.data) ? pagination.data as Store[] : [];
                setStores(prev => targetPage === 1 ? newItems : [...prev, ...newItems]);
                setHasMore(targetPage < (pagination.totalPages ?? 1));
                setPage(targetPage + 1);
            } else {
                setHasMore(false);
            }
        } catch {
            setHasMore(false);
        } finally {
            setIsLoading(false);
            isResetting.current = false;
        }
    }, []);

    // Chargement initial
    useEffect(() => {
        fetchPage(1, "");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Rechargement quand la recherche change
    useEffect(() => {
        if (isResetting.current) return;
        isResetting.current = true;
        setStores([]);
        setPage(1);
        setHasMore(true);
        fetchPage(1, debouncedSearch);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch]);

    const loadMore = useCallback(() => {
        if (!isLoading && hasMore) fetchPage(page, debouncedSearch);
    }, [isLoading, hasMore, page, debouncedSearch, fetchPage]);

    if (!mounted) return null;

    const showEmpty = !isLoading && stores.length === 0;

    const grid = (gridCols: string, listCols: string) => (
        showEmpty ? <EmptyState /> : (
            <InfiniteScroll
                items={stores}
                renderItem={(store) => <StoreCard store={store as Store} viewMode={viewMode} />}
                loadMore={loadMore}
                hasMore={hasMore}
                isLoading={isLoading}
                viewMode={viewMode}
                gridClassName={viewMode === 'grid' ? gridCols : listCols}
                endMessage="Fin des boutiques"
            />
        )
    );

    return (
        <>
            {/* ══════════════════════ MOBILE ══════════════════════ */}
            <div className="md:hidden flex flex-col min-h-dvh bg-[#FBFAF6] dark:bg-zinc-900 text-[#0F2944] dark:text-white">
                <div className="sticky top-0 z-50 h-14 flex items-center px-4 bg-[#FBFAF6]/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-[#EEF1F4] dark:border-zinc-800">
                    <h1 className="font-black text-sm mx-auto">Toutes les boutiques</h1>
                </div>
                <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                    <div className="flex-1">
                        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une boutique..." sticky={false} />
                    </div>
                    <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                </div>
                <div className="flex-1 px-4 pb-24">
                    {grid("grid grid-cols-2 gap-2 pt-2", "flex flex-col gap-2 pt-2")}
                </div>
            </div>

            {/* ══════════════════════ DESKTOP ══════════════════════ */}
            <div className="hidden md:block w-full max-w-4xl mx-auto px-4 py-6">
                <div className="bg-card overflow-hidden">
                    <div className="h-14 flex items-center justify-between px-6">
                        <h1 className="font-black text-lg">Toutes les boutiques</h1>
                        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                    <div className="px-6 pb-4">
                        <SearchInput value={search} onChange={setSearch} placeholder="Rechercher une boutique..." sticky={false} />
                    </div>
                    <div className="px-6 pb-6">
                        {grid("grid grid-cols-2 gap-4", "flex flex-col gap-2")}
                    </div>
                </div>
            </div>
        </>
    );
}
