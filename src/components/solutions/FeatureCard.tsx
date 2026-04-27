"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

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
  icon,
  iconColor = "text-primary",
  delay = 0,
}: Omit<FeatureCardProps, "examples">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative h-full bg-white dark:bg-zinc-900/50 border border-border/40 hover:border-primary/40 rounded-[32px] p-10 flex flex-col gap-8 shadow-sm hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.4)] transition-all ease-out duration-500"
    >
      {/* Background soft glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex flex-col gap-6 relative z-10">
        <div className={`w-16 h-16 rounded-2xl bg-muted/50 border border-border/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/5 transition-all duration-500`}>
          <Icon icon={icon} width={34} height={34} className={`${iconColor}`} />
        </div>
        
        <div className="space-y-4">
          <h4 className="text-2xl font-bold text-foreground leading-tight">{title}</h4>
          <p className="text-muted-foreground leading-relaxed font-medium">
            {utility}
          </p>
        </div>
      </div>

      <div className="mt-auto relative z-10">
        <div className="flex items-center gap-2 text-sm font-bold text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
          <span>En savoir plus</span>
          <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
        </div>
      </div>

      {/* Subtle corner decoration */}
      <div className="absolute top-6 right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none">
         <Icon icon={icon} width={120} height={120} />
      </div>
    </motion.div>
  );
}
