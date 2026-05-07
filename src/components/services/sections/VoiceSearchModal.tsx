"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface VoiceSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
}

export default function VoiceSearchModal({ isOpen, onClose, onResult }: VoiceSearchModalProps) {
    const { isListening, transcript, error, isSupported, startListening, stopListening } = useSpeechToText({
        onResult: (text) => {
            // Wait a tiny bit for the user to see the final text before auto-closing
            setTimeout(() => {
                onResult(text);
                onClose();
            }, 800);
        },
    });

    useEffect(() => {
        if (isOpen) {
            startListening();
        } else {
            stopListening();
        }
    }, [isOpen, startListening, stopListening]);

    if (!isSupported) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden p-8 flex flex-col items-center"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors"
                        >
                            <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                        </button>

                        <h3 className="text-xl font-black text-foreground mb-8 text-center italic">
                            Comment puis-je vous aider ?
                        </h3>

                        {/* Animated Microphone Area */}
                        <div className="relative mb-12 flex items-center justify-center">
                            {/* Listening Waves / Ripples */}
                            {isListening && (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute w-24 h-24 bg-primary/20 rounded-full"
                                    />
                                    <motion.div
                                        animate={{ scale: [1, 2, 1], opacity: [0.2, 0, 0.2] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                        className="absolute w-24 h-24 bg-primary/10 rounded-full"
                                    />
                                </>
                            )}

                            <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isListening ? 'bg-primary text-white scale-110 shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]' : 'bg-muted text-muted-foreground'}`}>
                                <Icon 
                                    icon={isListening ? "solar:microphone-bold-duotone" : "solar:microphone-bold"} 
                                    className={`w-10 h-10 ${isListening ? 'animate-pulse' : ''}`} 
                                />
                            </div>
                        </div>

                        {/* Transcript Display */}
                        <div className="w-full min-h-[100px] flex flex-col items-center justify-center">
                            {transcript ? (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-lg font-medium text-foreground text-center line-clamp-3 italic"
                                >
                                    "{transcript}"
                                </motion.p>
                            ) : (
                                <p className="text-muted-foreground animate-pulse text-sm font-medium">
                                    Écoute en cours...
                                </p>
                            )}

                            {error && (
                                <p className="mt-4 text-destructive text-xs font-bold bg-destructive/10 px-3 py-1 rounded-full">
                                    {error === 'no-speech' ? "Je n'ai rien entendu..." : "Une erreur est survenue"}
                                </p>
                            )}
                        </div>

                        {/* Visualizer Dots */}
                        <div className="mt-8 flex gap-1.5 items-center">
                            {[0, 1, 2, 3, 4].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={isListening ? {
                                        height: [4, 16, 4],
                                        opacity: [0.5, 1, 0.5]
                                    } : {
                                        height: 4,
                                        opacity: 0.3
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                        ease: "easeInOut"
                                    }}
                                    className="w-1 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
