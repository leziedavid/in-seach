"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface VoiceSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult: (text: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
    "no-speech": "Je n'ai rien entendu. Réessayez.",
    "not-allowed": "Autorisez l'accès au micro pour utiliser la recherche vocale.",
    "audio-capture": "Aucun micro détecté sur cet appareil.",
    network: "Problème de connexion. Réessayez.",
};

/**
 * Recherche vocale — flux à un seul tour (écoute → transcription → résultat), façon barre de
 * recherche vocale d'une IA (pas un assistant conversationnel) : minimal, léger, sans historique
 * de messages à conserver ni synthèse vocale de réponse.
 */
export default function VoiceSearchModal({ isOpen, onClose, onResult }: VoiceSearchModalProps) {
    const [mounted, setMounted] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const { isListening, transcript, error, isSupported, startListening, stopListening } = useSpeechToText({
        onResult: (text, isFinal) => {
            if (isFinal && text.trim()) {
                setConfirming(true);
                confirmTimerRef.current = setTimeout(() => {
                    onResult(text.trim());
                    onClose();
                }, 550);
            }
        },
    });

    useEffect(() => {
        if (isOpen) {
            setConfirming(false);
            startListening();
        } else {
            stopListening();
            if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
        }
        return () => {
            if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!mounted) return null;

    const errorMessage = error ? (ERROR_MESSAGES[error] || "Une erreur est survenue. Réessayez.") : null;
    const statusLabel = confirming
        ? "C'est noté !"
        : isListening
            ? "Je vous écoute…"
            : errorMessage
                ? errorMessage
                : isSupported
                    ? "Prêt à vous écouter"
                    : "Recherche vocale non disponible sur ce navigateur.";

    const handleOrbClick = () => {
        if (confirming) return;
        if (isListening) stopListening();
        else if (isSupported) startListening();
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 12 }}
                        transition={{ type: "spring", damping: 26, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-xs flex flex-col items-center gap-5 py-6"
                    >
                        <button
                            onClick={onClose}
                            aria-label="Fermer"
                            className="absolute -top-2 right-0 w-8 h-8 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center transition-colors active:scale-90"
                        >
                            <Icon icon="solar:close-circle-bold" width={18} className="text-muted-foreground" />
                        </button>

                        {/* Orbe animé */}
                        <div className="relative flex items-center justify-center w-28 h-28">
                            {isListening && !confirming && (
                                <>
                                    <motion.span
                                        animate={{ scale: [1, 1.6, 1], opacity: [0.35, 0, 0.35] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 rounded-full bg-primary/30"
                                    />
                                    <motion.span
                                        animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                        className="absolute inset-0 rounded-full bg-primary/20"
                                    />
                                </>
                            )}
                            <motion.button
                                onClick={handleOrbClick}
                                aria-label={isListening ? "Arrêter l'écoute" : "Démarrer l'écoute"}
                                animate={
                                    confirming
                                        ? { scale: [1, 1.15, 1] }
                                        : isListening
                                            ? { scale: [1, 1.05, 1] }
                                            : { scale: 1 }
                                }
                                transition={{
                                    duration: isListening ? 1.1 : 0.3,
                                    repeat: isListening && !confirming ? Infinity : 0,
                                    ease: "easeInOut",
                                }}
                                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${confirming
                                        ? "bg-emerald-500"
                                        : errorMessage
                                            ? "bg-red-500/90"
                                            : isListening
                                                ? "bg-primary"
                                                : "bg-muted"
                                    }`}
                            >
                                <Icon
                                    icon={
                                        confirming
                                            ? "solar:check-circle-bold"
                                            : errorMessage
                                                ? "solar:microphone-off-bold"
                                                : "solar:microphone-bold"
                                    }
                                    width={32}
                                    className={confirming || errorMessage || isListening ? "text-white" : "text-muted-foreground"}
                                />
                            </motion.button>
                        </div>

                        {/* Transcript en direct, ou statut */}
                        <div className="min-h-14 flex items-center justify-center px-2">
                            {transcript && !confirming ? (
                                <p className="text-foreground text-lg font-semibold text-center leading-snug">
                                    {transcript}
                                </p>
                            ) : (
                                <p className={`text-sm font-medium text-center ${errorMessage ? "text-red-500" : "text-muted-foreground"}`}>
                                    {statusLabel}
                                </p>
                            )}
                        </div>

                        {(errorMessage || !isSupported) && (
                            <button
                                onClick={isSupported ? startListening : onClose}
                                className="flex items-center gap-2 bg-primary text-white font-bold text-sm px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
                            >
                                <Icon icon={isSupported ? "solar:refresh-bold-duotone" : "solar:close-circle-bold-duotone"} width={18} />
                                {isSupported ? "Réessayer" : "Fermer"}
                            </button>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
