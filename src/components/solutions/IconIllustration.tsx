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
      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 10 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      {/* Background Glow */}
      <div 
        className={`absolute inset-0 blur-3xl opacity-20 bg-current transition-all duration-500`}
        style={{ color: color.startsWith("text-") ? undefined : color }}
      />
      
      {/* Glassmorphic Container */}
      <div className="relative z-10 p-6 rounded-3xl bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden group">
        <Icon 
          icon={icon} 
          width={size} 
          height={size} 
          className={`${color} transition-all duration-500 group-hover:scale-110`}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
    </motion.div>
  );
}
