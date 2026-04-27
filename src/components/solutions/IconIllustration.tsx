"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface IconIllustrationProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export default function IconIllustration({
  icon,
  color = "text-primary",
  size = 64,
  className = "",
}: IconIllustrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 80, damping: 15 }}
      whileHover={{ scale: 1.05, rotate: 2 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Dynamic Background Glow - more sophisticated multi-layered */}
      <div 
        className={`absolute inset-0 blur-[100px] opacity-20 bg-current transition-all duration-700`}
        style={{ color: color.startsWith("text-") ? undefined : color }}
      />
      <div 
        className={`absolute inset-0 blur-[40px] opacity-30 bg-current transition-all duration-700 scale-75 animate-pulse`}
        style={{ color: color.startsWith("text-") ? undefined : color }}
      />
      
      {/* Premium Glassmorphic Container */}
      <div className="relative z-10 p-12 rounded-[48px] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-3xl border border-white/40 dark:border-white/10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] overflow-hidden group">
        <Icon 
          icon={icon} 
          width={size} 
          height={size} 
          className={`${color} transition-all duration-700 group-hover:scale-110 drop-shadow-2xl`}
        />
        
        {/* Animated Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        
        {/* Subtle inner border for premium feel */}
        <div className="absolute inset-0 rounded-[48px] border-2 border-white/10 dark:border-white/5 pointer-events-none" />
      </div>
    </motion.div>
  );
}
