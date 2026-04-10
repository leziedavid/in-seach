"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionBlockProps {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  illustration?: ReactNode;
  reversed?: boolean;
  className?: string;
}

export default function SectionBlock({
  id,
  title,
  subtitle,
  children,
  illustration,
  reversed = false,
  className = "",
}: SectionBlockProps) {
  return (
    <section id={id} className={`w-full py-24 px-6 md:px-12 flex flex-col items-center gap-16 ${className}`}>
      <div className={`w-full max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-24 ${reversed ? "lg:flex-row-reverse" : ""}`}>
        
        {/* Content Side */}
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: reversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4 text-center lg:text-left"
          >
            {subtitle && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest">
                {subtitle}
              </span>
            )}
            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-[1.1]">
              {title}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            {children}
          </motion.div>
        </div>

        {/* Illustration Side */}
        {illustration && (
          <div className="flex-1 flex justify-center items-center">
            {illustration}
          </div>
        )}
      </div>
    </section>
  );
}
