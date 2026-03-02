"use client";

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollProps {
    loadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    children: React.ReactNode;
    endMessage?: string;
    className?: string;
}

export default function InfiniteScroll({ loadMore, hasMore, isLoading, children, endMessage = "Vous avez tout vu !", className = "" }: InfiniteScrollProps) {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [loadMore, hasMore, isLoading]);

    return (
        <div className={`w-full ${className}`}>
            {children}

            {/* Target element for intersection observer */}
            <div ref={observerTarget} className="h-4 w-full" />

            {/* Loading & End State UI */}
            <div className="flex flex-col items-center justify-center py-8 w-full">
                {isLoading && (
                    <div className="flex flex-col items-center gap-3 animate-in fade-in duration-500">
                        <div className="relative">
                            <div className="w-10 h-10 border-4 border-primary/20 rounded-full" />
                            <Loader2 className="w-10 h-10 animate-spin text-primary absolute top-0 left-0" />
                        </div>
                        <p className="text-sm font-medium text-slate-400 italic">Chargement des pépites...</p>
                    </div>
                )}

                {!hasMore && !isLoading && (
                    <div className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-4 duration-700">
                        <div className="h-px w-12 bg-slate-200 mb-2" />
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest">{endMessage}</p>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20" />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

}
