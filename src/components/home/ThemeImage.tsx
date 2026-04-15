"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ThemeImageProps {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

/**
 * Dynamic Theme Image Component
 * 
 * Solution 3: Optimized Production Version
 * - Prevents hydration mismatch with 'mounted' state check.
 * - Smooth fade transition with Framer Motion.
 * - Optimized with next/image.
 */
export default function ThemeImage({ lightSrc, darkSrc, alt, width, height, className = "", priority = false, }: ThemeImageProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by waiting for the component to mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder to avoid layout shift while mounting
    return <div style={{ width, height }} className={className} />;
  }

  const currentSrc = resolvedTheme === "dark" ? darkSrc : lightSrc;

  return (
    <div className={`relative flex justify-center items-center ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div key={resolvedTheme} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4, ease: "easeInOut" }} className="w-full flex justify-center">
          <Image src={currentSrc} alt={alt} width={width} height={height} className="w-full h-auto object-contain" priority unoptimized />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
