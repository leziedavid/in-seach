"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

interface InfoProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
}

export default function Info({ isOpen, onClose, title, description }: InfoProps) {
    const containerVariants = {
        hidden: { opacity: 0, y: -50, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 150,
                damping: 18,
                staggerChildren: 0.08
            }
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -20,
            transition: { duration: 0.2, ease: "easeInOut" }
        }
    } as const;

    const itemVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0 }
    } as const;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="w-full max-w-xl mt-4 p-4 md:p-6 bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[24px] shadow-2xl relative overflow-visible flex items-center gap-4 group"
                >
                    {/* Floating Red Close Button (The 'Hat') */}
                    <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="absolute -top-3 -right-3 z-50"
                    >
                        <Button
                            variant="default"
                            size="icon-xs"
                            onClick={onClose}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full h-8 w-8 shadow-lg shadow-red-500/40 border-2 border-white dark:border-gray-800 transition-transform active:scale-90"
                        >
                            <Icon icon="solar:close-bold" className="w-4 h-4" />
                        </Button>
                    </motion.div>

                    {/* Left Icon Section */}
                    <motion.div
                        variants={itemVariants}
                        className="flex-shrink-0"
                    >
                        <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                            <Icon icon="solar:info-circle-bold-duotone" className="w-7 h-7 text-primary" />
                        </div>
                    </motion.div>

                    {/* Text Section */}
                    <div className="flex-1 flex flex-col gap-0.5">
                        <motion.h3
                            variants={itemVariants}
                            className="text-sm md:text-base font-black text-foreground italic uppercase tracking-wider"
                        >
                            {title}
                        </motion.h3>
                        <motion.p
                            variants={itemVariants}
                            className="text-xs md:text-sm text-foreground/70 font-bold leading-tight"
                        >
                            {description}
                        </motion.p>
                    </div>

                    {/* Subtle Internal Glow */}
                    <div className="absolute inset-0 pointer-events-none rounded-[24px] bg-gradient-to-br from-white/20 to-transparent" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
