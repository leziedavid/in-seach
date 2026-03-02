"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

interface SimulationLoaderProps {
    status: string;
}

const SimulationLoader: React.FC<SimulationLoaderProps> = ({ status }) => {
    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-background/60 backdrop-blur-md overflow-hidden">
            <div className="relative flex flex-col items-center max-w-sm w-full px-8">

                {/* Deep Animated Rings */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 border-[3px] border-primary/20 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                        className="absolute inset-2 border-[2px] border-primary/40 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-4 border-t-2 border-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Central Logo Symbol */}
                    <div className="relative flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-4xl font-black text-primary tracking-tighter"
                        >
                            In
                        </motion.div>
                        <motion.div
                            animate={{ opacity: [0.4, 0.8, 0.4] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="h-1 w-8 bg-primary/50 rounded-full mt-1"
                        />
                    </div>
                </div>

                {/* Status Messaging */}
                <div className="mt-12 text-center space-y-3">
                    <motion.h3
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-foreground bg-clip-text"
                    >
                        Simulation de session
                    </motion.h3>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent"
                    />
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-muted-foreground text-sm font-medium tracking-wide flex items-center justify-center gap-2"
                    >
                        <Icon icon="solar:shield-warning-bold-duotone" className="w-4 h-4 text-primary animate-pulse" />
                        {status}
                    </motion.p>
                </div>

                {/* Micro-Interaction indicators */}
                <div className="absolute bottom-10 flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-primary"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimulationLoader;
