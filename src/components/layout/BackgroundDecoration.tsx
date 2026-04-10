"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const DECORATION_ICONS = [
  "solar:shop-2-bold-duotone",
  "solar:cart-large-4-bold-duotone",
  "solar:tool-out-bold-duotone",
  "solar:user-hand-up-bold-duotone",
  "solar:delivery-bold-duotone",
  "solar:box-bold-duotone",
  "solar:globus-bold-duotone",
  "solar:bill-list-bold-duotone",
  "solar:tag-bold-duotone",
  "solar:shield-check-bold-duotone",
  "solar:qr-code-bold-duotone",
  "solar:chat-round-dots-bold-duotone",
  "solar:heart-bold-duotone",
  "solar:star-bold-duotone",
  "solar:medal-star-bold-duotone",
  "solar:routing-bold-duotone",
  "solar:crown-bold-duotone",
  "solar:code-bold-duotone",
];

interface FloatingIconProps {
  icon: string;
  initialX: number;
  initialY: number;
  duration: number;
  delay: number;
  size: number;
  color: string;
}

const FloatingIcon = ({ icon, initialX, initialY, duration, delay, size, color }: FloatingIconProps) => {
  return (
    <motion.div
      initial={{ left: `${initialX}%`, top: `${initialY}%`, opacity: 0 }}
      animate={{ 
        top: [`${initialY}%`, `${initialY - 5}%`, `${initialY}%`],
        left: [`${initialX}%`, `${initialX + 2}%`, `${initialX}%`],
        opacity: [0, 0.1, 0.1, 0],
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        delay,
        ease: "easeInOut" 
      }}
      className={`absolute pointer-events-none ${color}`}
    >
      <Icon icon={icon} width={size} height={size} />
    </motion.div>
  );
};

export default function BackgroundDecoration() {
  const [decorations, setDecorations] = useState<any[]>([]);

  useEffect(() => {
    const brandColors = ["text-primary", "text-blue-500", "text-amber-500", "text-indigo-500", "text-emerald-500", "text-rose-500"];
    
    // Balanced: 30 icons for good coverage without clutter
    const items = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      icon: DECORATION_ICONS[i % DECORATION_ICONS.length],
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: 25 + Math.random() * 25,
      delay: Math.random() * 15,
      size: 100 + Math.random() * 150, // Range: 100px - 250px
      color: brandColors[i % brandColors.length]
    }));
    setDecorations(items);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-[100]">
      {decorations.map((item) => (
        <FloatingIcon key={item.id} {...item} />
      ))}
      
      {/* Brand accent glows - even larger and more diffuse */}
      <div className="absolute top-[10%] left-[-10%] w-[60rem] h-[60rem] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[70rem] h-[70rem] bg-secondary/5 rounded-full blur-[180px] pointer-events-none" />
    </div>
  );
}
