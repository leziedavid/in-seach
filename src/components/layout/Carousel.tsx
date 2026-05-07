// components/layout/Carousel.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { CarouselSlide } from "@/types/interface";
import Image from "next/image";
import { Icon } from "@iconify/react";

type CarouselProps = {
    slides: CarouselSlide[];
    autoScrollInterval?: number; // en ms
};

export default function Carousel({ slides, autoScrollInterval = 3000 }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

    // Auto-scroll
    useEffect(() => {
        timeoutRef.current = setTimeout(nextSlide, autoScrollInterval);
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex, autoScrollInterval]);

    return (
        <div className="relative w-full md:w-2xl group mx-auto px-1 md:px-0">
            {/* Slides Container */}
            <div className="overflow-hidden relative aspect-[21/9] w-full rounded-2xl">
                <div className="flex h-full transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                    {slides.map((slide) => (
                        <div key={slide.id} className="flex-shrink-0 w-full h-full relative">
                            <Image src={slide.imageUrl} alt={slide.alt} fill className="object-cover transition-scale duration-10000 hover:scale-110" unoptimized priority />
                        </div>
                    ))}
                </div>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Indicators (Dots) */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === i ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Arrows */}
            <button
                onClick={prevSlide}
                className="absolute top-1/2 -left-4 md:-left-6 -translate-y-1/2 bg-white/90 dark:bg-black/80 text-foreground p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-20 border border-border/20"
            >
                <Icon icon="solar:alt-arrow-left-linear" className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute top-1/2 -right-4 md:-right-6 -translate-y-1/2 bg-white/90 dark:bg-black/80 text-foreground p-2 md:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 z-20 border border-border/20"
            >
                <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5 md:w-6 md:h-6" />
            </button>
        </div>
    );
}