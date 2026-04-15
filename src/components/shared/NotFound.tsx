"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface NotFoundProps {
    title?: string;
    description?: string;
    icon?: string;
    className?: string;
    action?: React.ReactNode;
}

export default function NotFound({
    title = "Aucun résultat trouvé",
    description = "Nous n'avons trouvé aucun élément correspondant à votre demande.",
    icon = "solar:box-minimalistic-bold-duotone",
    className = "",
    action
}: NotFoundProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`flex flex-col items-center justify-center py-16 px-6 text-center w-full max-w-md mx-auto ${className}`}
        >
            <div className="relative mb-8">
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150" />
                
                {/* Icon Container */}
                <div className="relative w-24 h-24 bg-card border-2 border-border/50 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-primary/5">
                    <Icon 
                        icon={icon} 
                        className="w-12 h-12 text-primary/40" 
                    />
                    
                    {/* Floating elements for "vibe" */}
                    <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-2 text-primary/20"
                    >
                        <Icon icon="solar:star-bold-duotone" width={20} />
                    </motion.div>
                    <motion.div 
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute -bottom-2 -left-4 text-primary/10"
                    >
                        <Icon icon="solar:star-bold-duotone" width={24} />
                    </motion.div>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                <h3 className="text-xl font-black text-foreground tracking-tight">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    {description}
                </p>
            </div>

            {action && (
                <div className="mt-8 relative z-10 w-full">
                    {action}
                </div>
            )}
        </motion.div>
    );
}
