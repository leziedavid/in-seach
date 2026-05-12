"use client";

import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { getSliders } from "@/api/api";
import { Slider } from "@/types/interface";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function HomeSlider() {
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on("select", onSelect);
        emblaApi.on("reInit", onSelect);
    }, [emblaApi, onSelect]);

    useEffect(() => {
        const fetchSliders = async () => {
            try {
                const res = await getSliders();
                if (res.data && res.data.length > 0) {
                    setSliders(res.data);
                }
            } catch (error) {
                console.error("Failed to fetch sliders", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSliders();
    }, []);

    const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

    if (loading || sliders.length === 0) return null;

    return (
        <div className="relative w-full max-w-xl mx-auto group">

            <div className="overflow-hidden rounded-3xl border border-border/50 shadow-2xl" ref={emblaRef}>
                <div className="flex">
                    {sliders.map((slider) => (
                        <div key={slider.id} className="flex-[0_0_100%] min-w-0 relative aspect-[18/9] md:aspect-[21/9]">
                            <Image src={slider.file?.fileUrl || ""} alt={slider.title} fill className="object-cover" priority unoptimized />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
                                <motion.h2 initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white text-xl md:text-3xl font-black mb-2 drop-shadow-md" >
                                    {slider.title}
                                </motion.h2>
                                {slider.description && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="text-zinc-200 text-xs md:text-sm line-clamp-2 max-w-md drop-shadow-sm" >
                                        {slider.description}
                                    </motion.p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:flex" >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:flex" >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {sliders.map((_, index) => (
                    <button key={index} onClick={() => emblaApi?.scrollTo(index)} className={`h-1.5 rounded-full transition-all ${index === selectedIndex ? "w-6 bg-primary" : "w-1.5 bg-white/50"}`} />
                ))}
            </div>

        </div>
    );
}
