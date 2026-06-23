"use client";

import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface Stat {
  icon: string;
  value: string;
  label: string;
}

const stats: Stat[] = [
  { icon: "solar:map-point-bold-duotone", value: "1", label: "Pays actif" },
  { icon: "solar:shop-bold-duotone", value: "+5 000", label: "Prestataires & vendeurs" },
  { icon: "solar:widget-bold-duotone", value: "4", label: "Univers réunis en 1 app" },
  { icon: "solar:scooter-bold-duotone", value: "100%", label: "Suivi temps réel" },
];

export default function StatsBanner() {
  return (
    <section className="relative w-full bg-zinc-900 dark:bg-black overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
        <Icon icon="solar:globus-bold-duotone" width={500} height={500} className="absolute -right-20 -top-20 text-white" />
      </div>
      <div className="container mx-auto px-6 py-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon icon={s.icon} className="text-primary w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-white leading-none">{s.value}</p>
                <p className="text-[11px] text-zinc-400 leading-tight">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
