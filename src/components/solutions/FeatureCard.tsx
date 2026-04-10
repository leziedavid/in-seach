"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  description: string;
  utility: string;
  examples: string[];
  icon: string;
  iconColor?: string;
  delay?: number;
}

export default function FeatureCard({
  title,
  description,
  utility,
  examples,
  icon,
  iconColor = "text-primary",
  delay = 0,
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="group relative h-full bg-card/40 backdrop-blur-sm border border-border/50 hover:border-primary/30 rounded-3xl p-8 flex flex-col gap-6 shadow-sm hover:shadow-2xl transition-all overflow-hidden"
    >
      {/* Background soft glow on hover */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      
      <div className="flex items-center gap-6">
        <div className={`w-16 h-16 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon icon={icon} width={32} height={32} className={`${iconColor}`} />
        </div>
        <div>
          <h4 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</h4>
          <p className="text-sm text-muted-foreground line-clamp-1">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-grow">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary/70">Utilité</span>
          <p className="text-sm leading-relaxed text-muted-foreground">{utility}</p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-black tracking-widest text-primary/70">Exemples d'usage</span>
          <ul className="grid grid-cols-1 gap-2">
            {examples.map((ex, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-green-500/70" />
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Subtle bottom decoration */}
      <div className="absolute bottom-0 right-0 p-4 opacity-5 pointer-events-none">
         <Icon icon={icon} width={80} height={80} />
      </div>
    </motion.div>
  );
}
