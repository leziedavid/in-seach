"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import SensitiveMedia from "@/components/shared/SensitiveMedia";

interface ProductImageGalleryProps {
    images: string[];
    alt: string;
    isSensitive: boolean;
    isRevealed: boolean;
    onToggleReveal: () => void;
    discount?: number | null;
    /** Miniatures sous l'image principale — utile en desktop, superflu en feuille mobile. */
    showThumbnails?: boolean;
    /** Hauteur de la zone image (mobile: "46vh", desktop: 420px...). Par défaut pleine hauteur du parent. */
    heightClassName?: string;
    /** Bouton retour superposé (mobile modal uniquement, ferme le modal). */
    onBack?: () => void;
    className?: string;
}

/**
 * Carrousel image + lightbox, partagé entre ProductDetailModal et produit/[id]/page.tsx
 * (les deux dupliquaient exactement la même logique de navigation/swipe/lightbox).
 */
export default function ProductImageGallery({
    images, alt, isSensitive, isRevealed, onToggleReveal, discount,
    showThumbnails = false, heightClassName = "h-full", onBack, className = "",
}: ProductImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const touchStartX = useRef(0);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(p => (p + 1) % images.length);
    };
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex(p => (p - 1 + images.length) % images.length);
    };
    const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? nextImage() : prevImage();
    };

    const renderImage = (variant: "cover" | "contain", extraClassName = "") => {
        if (images.length === 0) {
            return (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                    <Icon icon="solar:box-bold-duotone" width={80} />
                </div>
            );
        }
        const objectFit = variant === "cover" ? "object-cover" : "object-contain";
        const inner = (
            <Image src={images[currentIndex]} fill sizes="(max-width: 768px) 100vw, 50vw" className={`${objectFit} z-10 cursor-zoom-in ${extraClassName}`} alt={`${alt} - ${currentIndex + 1}`} onClick={() => setLightboxOpen(true)} unoptimized />
        );
        return isSensitive ? (
            <SensitiveMedia revealed={isRevealed} onToggle={onToggleReveal} variant="full">{inner}</SensitiveMedia>
        ) : inner;
    };

    return (
        <>
            <div className={`relative overflow-hidden bg-muted/20 ${heightClassName} ${className}`} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                <AnimatePresence mode="wait">
                    {images.length > 0 && (
                        <motion.div key={currentIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0">
                            {/* Fond flouté décoratif — jamais affiché net, une petite taille suffit largement
                                (sizes="100vw" ici forcerait à télécharger l'image en pleine résolution pour
                                un simple flou d'arrière-plan). */}
                            <Image src={images[currentIndex]} unoptimized fill sizes="200px" className="object-cover blur-2xl opacity-25 scale-110" alt="" aria-hidden />
                            {renderImage("contain", "p-4")}
                        </motion.div>
                    )}
                </AnimatePresence>

                {discount ? (
                    <div className="absolute top-3 left-3 z-20 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">-{discount}%</div>
                ) : null}

                {onBack && (
                    <button onClick={onBack} className="absolute top-3 left-3 z-30 w-9 h-9 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition active:scale-90">
                        <Icon icon="solar:alt-arrow-left-bold-duotone" width={20} />
                    </button>
                )}

                {images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                            <Icon icon="solar:alt-arrow-left-bold" width={16} />
                        </button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/25 backdrop-blur-md rounded-full text-white flex items-center justify-center hover:bg-black/40 transition">
                            <Icon icon="solar:alt-arrow-right-bold" width={16} />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                            {images.slice(0, 8).map((_, idx) => (
                                <button key={idx} onClick={e => { e.stopPropagation(); setCurrentIndex(idx); }} className={`rounded-full transition-all duration-300 ${currentIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40"}`} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {showThumbnails && images.length > 1 && (
                <div className="flex gap-2 p-3 flex-wrap">
                    {images.slice(0, 6).map((img, idx) => (
                        <button key={idx} onClick={() => setCurrentIndex(idx)}
                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 relative ${currentIndex === idx ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}>
                            {isSensitive ? (
                                <SensitiveMedia revealed={isRevealed} onToggle={onToggleReveal} variant="static">
                                    <Image src={img} fill sizes="48px" className="object-cover" unoptimized alt="" />
                                </SensitiveMedia>
                            ) : (
                                <Image src={img} fill sizes="48px" className="object-cover" unoptimized alt="" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* ── LIGHTBOX ── */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/95 flex items-center justify-center"
                        onClick={() => setLightboxOpen(false)}>
                        <button onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}
                            className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                            <Icon icon="solar:close-bold" width={20} />
                        </button>
                        {images.length > 1 && (
                            <>
                                <button onClick={e => { e.stopPropagation(); prevImage(); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-left-bold" width={20} />
                                </button>
                                <button onClick={e => { e.stopPropagation(); nextImage(); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition z-10">
                                    <Icon icon="solar:alt-arrow-right-bold" width={20} />
                                </button>
                            </>
                        )}
                        <motion.div key={currentIndex} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                            className="relative w-full h-full max-w-3xl max-h-[90vh] mx-4">
                            {isSensitive ? (
                                <SensitiveMedia revealed={isRevealed} onToggle={onToggleReveal} variant="full">
                                    <Image src={images[currentIndex]} fill sizes="90vw" className="object-contain" alt={alt} unoptimized />
                                </SensitiveMedia>
                            ) : (
                                <Image src={images[currentIndex]} fill sizes="90vw" className="object-contain" alt={alt} unoptimized />
                            )}
                        </motion.div>
                        {images.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {images.slice(0, 8).map((_, idx) => (
                                    <button key={idx} onClick={e => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`rounded-full transition-all ${currentIndex === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30"}`} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
