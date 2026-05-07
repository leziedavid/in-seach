"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from 'framer-motion';

export type SkeletonType = 'product' | 'service' | 'annonce' | 'logistics' | 'default';

interface InfiniteScrollProps<T> {
    items: T[];
    renderItem: (item: T, index: number) => React.ReactNode;
    loadMore: () => Promise<void> | void;
    hasMore: boolean;
    isLoading: boolean;
    windowSize?: number; // Max items in DOM at once
    batchSize?: number; // Number of items per "lot"
    skeletonType?: SkeletonType;
    skeletonCount?: number;
    SkeletonComponent?: React.ReactNode;
    endMessage?: string;
    className?: string;
    gridClassName?: string;
}

// Internal Skeleton Component
const ListingSkeleton = ({ type, count = 3 }: { type: SkeletonType; count?: number }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-2xl md:rounded-[2rem] overflow-hidden border border-border/50 flex flex-col stagger-item">
                    {/* Image Placeholder */}
                    <div className={`w-full bg-muted/40 ${type === 'product' ? 'aspect-[4/5]' : 'aspect-square'}`} />

                    {/* Content Placeholder */}
                    <div className="p-4 space-y-3">
                        <div className="h-3 bg-muted/40 rounded-full w-3/4" />
                        <div className="h-3 bg-muted/20 rounded-full w-1/2" />
                        <div className="pt-2 flex justify-between items-center">
                            <div className="h-5 bg-muted/30 rounded-lg w-1/3" />
                            <div className="h-8 bg-muted/40 rounded-full w-24 md:w-32" />
                        </div>
                    </div>
                </div>
            ))}
        </>
    );
};


export default function InfiniteScroll<T extends { id: string | number }>({
    items = [],
    renderItem,
    loadMore,
    hasMore,
    isLoading,
    windowSize = 30,
    batchSize = 10,
    skeletonType = 'default',
    skeletonCount = 3,
    SkeletonComponent,
    endMessage = "Fin du catalogue",
    className = "",
    gridClassName = "grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6"
}: InfiniteScrollProps<T>) {

    const [startIndex, setStartIndex] = useState(0);
    const endIndex = useMemo(() => Math.min(startIndex + windowSize, items.length), [startIndex, windowSize, items.length]);

    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevScrollTop = useRef(0);
    // Ref pour éviter que loadMore instable (inline arrow) ne reconnecte l'observer à chaque render
    const loadMoreRef = useRef(loadMore);
    useEffect(() => {
        loadMoreRef.current = loadMore;
    }, [loadMore]);

    // Handle Infinite Scroll Down
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMoreRef.current();
                }
            },
            { threshold: 0.1, rootMargin: '200px' }
        );

        if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading]); // loadMore retiré : le ref garantit la valeur fraîche sans reconnexion

    // Handle Windowing memory management
    useEffect(() => {
        const handleScroll = () => {
            if (!containerRef.current) return;
            const currentScrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollingDown = currentScrollTop > prevScrollTop.current;
            prevScrollTop.current = currentScrollTop;

            if (scrollingDown && items.length - startIndex > windowSize + batchSize) {
                const containerRect = containerRef.current.getBoundingClientRect();
                if (containerRect.top < -1000) {
                    setStartIndex(prev => prev + batchSize);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [items.length, startIndex, windowSize, batchSize]);

    const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

    return (
        <div ref={containerRef} className={`w-full ${className} transition-all duration-500`}>

            {/* Top Reveal for bidirectional feel */}
            {startIndex > 0 && (
                <div className="w-full flex justify-center py-6">
                    <button
                        onClick={() => setStartIndex(Math.max(0, startIndex - batchSize))}
                        className="group flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                        <div className="p-2 bg-primary/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                            <Icon icon="solar:alt-arrow-up-bold-duotone" width={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">Voir les précédents</span>
                    </button>
                </div>
            )}

            <div className={gridClassName}>
                <AnimatePresence mode="popLayout">
                    {visibleItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, delay: (index % 5) * 0.05 }}
                        >
                            {renderItem(item, startIndex + index)}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Centralized Skeleton Logic */}
            {isLoading && (
                <div className={gridClassName + " mt-4 md:mt-6"}>
                    {SkeletonComponent ? SkeletonComponent : <ListingSkeleton type={skeletonType} count={skeletonCount} />}
                </div>
            )}

            {/* Bottom Sentinel */}
            <div ref={bottomSentinelRef} className="h-24 w-full flex flex-col items-center justify-center pt-8">
                {isLoading && !SkeletonComponent && skeletonType === 'default' && (
                    <Icon icon="line-md:loading-twotone-loop" className="w-8 h-8 text-primary" />
                )}

                {!hasMore && items.length > 0 && (
                    <div className="flex flex-col items-center gap-2 py-8 group">
                        <div className="h-px w-10 bg-primary/20 group-hover:w-20 transition-all duration-700" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">{endMessage}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
