"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface VoiceSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
}

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

export default function VoiceSearchModal({ isOpen, onClose, onResult }: VoiceSearchModalProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { speak, stop: stopSpeaking, isSpeaking } = useTextToSpeech({
        onEnd: () => {
            // Start listening after the assistant finishes speaking
            if (!isProcessing) {
                startListening();
            }
        }
    });

    const { isListening, transcript, error, isSupported, startListening, stopListening } = useSpeechToText({
        onResult: (text) => {
            handleUserMessage(text);
        },
        onError: (e) => {
            if (e.error === 'no-speech') {
                handleAssistantResponse("Je n'ai pas bien entendu, pouvez-vous répéter ?");
            }
        }
    });

    useEffect(() => {
        if (isOpen) {
            // Prevent scrolling on body
            document.body.style.overflow = 'hidden';
            // Reset conversation
            setMessages([]);
            setIsProcessing(false);
            // Initial greeting
            const welcomeMsg = "Comment puis-je vous aider ?";
            addMessage("assistant", welcomeMsg);
            speak(welcomeMsg);
        } else {
            document.body.style.overflow = 'unset';
            stopListening();
            stopSpeaking();
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, transcript]);

    const addMessage = (role: "user" | "assistant", content: string) => {
        setMessages(prev => [...prev, { id: Math.random().toString(36), role, content }]);
    };

    const handleUserMessage = (text: string) => {
        if (!text.trim()) return;
        
        stopListening();
        addMessage("user", text);
        setIsProcessing(true);

        // Simple logic to determine next step
        setTimeout(() => {
            if (text.length < 3) {
                handleAssistantResponse("Pouvez-vous reformuler votre demande ?");
            } else {
                handleAssistantResponse("Recherche en cours...");
                // Final action
                setTimeout(() => {
                    onResult(text);
                    onClose();
                }, 1500);
            }
        }, 800);
    };

    const handleAssistantResponse = (text: string) => {
        addMessage("assistant", text);
        speak(text);
        setIsProcessing(false);
    };

    if (!isSupported || !mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 md:p-6"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-auto max-h-[90vh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-card/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon icon="solar:mask-h-bold-duotone" className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">Assistant Vocal</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Siri Mode Active</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-muted transition-colors"
                            >
                                <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>

                        {/* Conversation Area */}
                        <div 
                            ref={scrollRef}
                            className="overflow-y-auto p-6 space-y-4 scroll-smooth max-h-[400px]"
                        >
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                                        msg.role === 'user' 
                                            ? 'bg-primary text-primary-foreground rounded-tr-none shadow-lg' 
                                            : 'bg-muted text-foreground rounded-tl-none border border-border/50'
                                    }`}>
                                        <p className="text-sm font-medium leading-relaxed italic">
                                            {msg.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {/* Current Transcript */}
                            {isListening && transcript && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-end"
                                >
                                    <div className="max-w-[80%] p-4 rounded-2xl bg-primary/50 text-primary-foreground/90 rounded-tr-none italic border border-primary/20 backdrop-blur-sm">
                                        <p className="text-sm font-medium">
                                            "{transcript}..."
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Footer / Interaction Area */}
                        <div className="p-8 border-t border-border bg-card/50 flex flex-col items-center">
                            <div className="relative mb-6 flex items-center justify-center">
                                {/* Listening/Speaking Waves */}
                                {(isListening || isSpeaking || isProcessing) && (
                                    <>
                                        <motion.div
                                            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className={`absolute w-20 h-20 rounded-full ${isSpeaking ? 'bg-secondary/20' : isProcessing ? 'bg-accent/20' : 'bg-primary/20'}`}
                                        />
                                        <motion.div
                                            animate={{ scale: [1, 2.2, 1], opacity: [0.2, 0, 0.2] }}
                                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                            className={`absolute w-20 h-20 rounded-full ${isSpeaking ? 'bg-secondary/10' : isProcessing ? 'bg-accent/10' : 'bg-primary/10'}`}
                                        />
                                    </>
                                )}

                                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isListening 
                                        ? 'bg-primary text-primary-foreground scale-110 shadow-lg' 
                                        : isSpeaking 
                                            ? 'bg-secondary text-secondary-foreground scale-105'
                                            : isProcessing
                                                ? 'bg-accent text-accent-foreground animate-bounce'
                                                : 'bg-muted text-muted-foreground'
                                }`}>
                                    <Icon 
                                        icon={isListening ? "solar:microphone-bold-duotone" : isSpeaking ? "solar:soundwave-bold-duotone" : isProcessing ? "solar:refresh-circle-bold-duotone" : "solar:microphone-bold"} 
                                        className={`w-8 h-8 ${isListening || isSpeaking || isProcessing ? 'animate-pulse' : ''}`} 
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-center">
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 h-4">
                                    {isListening ? "Je vous écoute..." : isSpeaking ? "L'assistant parle..." : isProcessing ? "Traitement..." : "Prêt"}
                                </p>

                                {/* Siri-style Visualizer */}
                                <div className="flex gap-1.5 items-center h-4">
                                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={(isListening || isSpeaking || isProcessing) ? {
                                                height: [4, 16, 4],
                                                opacity: [0.5, 1, 0.5]
                                            } : {
                                                height: 4,
                                                opacity: 0.3
                                            }}
                                            transition={{
                                                duration: 0.4,
                                                repeat: Infinity,
                                                delay: i * 0.05,
                                                ease: "easeInOut"
                                            }}
                                            className={`w-1 rounded-full ${isSpeaking ? 'bg-secondary' : isProcessing ? 'bg-accent' : 'bg-primary'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}


