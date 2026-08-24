"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";

interface IOSInstallGuideProps {
    open: boolean;
    onClose: () => void;
    // Permet de sauter l'écran de confirmation quand l'utilisateur a déjà confirmé son intention
    // ailleurs (ex: bouton "Installer" du rappel bas de page).
    startAt?: "confirm" | "wizard";
}

type Screen = "confirm" | "wizard";

// Icône Partager iOS reproduite fidèlement (carré + flèche vers le haut),
// plus fiable à reconnaître pour l'utilisateur que l'icône générique "share".
function ShareGlyph({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 3v12" />
            <path d="M8 7l4-4 4 4" />
            <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
        </svg>
    );
}

// Barre d'outils du navigateur avec le bouton Partager mis en évidence.
function ShareBarIllustration() {
    return (
        <div className="w-full rounded-[1.75rem] bg-white border border-[#EEF1F4] shadow-[0_8px_24px_rgba(15,41,68,0.08)] p-4">
            <div className="flex items-center justify-between px-2 pb-4 opacity-30">
                <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                <div className="h-2 w-24 rounded-full bg-[#0F2944]/20" />
                <Icon icon="solar:refresh-circle-bold-duotone" className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-around rounded-2xl py-3" style={{ backgroundColor: "#F2EFE7" }}>
                <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5 text-[#0F2944]/30" />
                <div className="relative">
                    <motion.div
                        className="absolute inset-0 rounded-2xl bg-primary/30"
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                    />
                    <div className="relative bg-primary text-white p-2.5 rounded-2xl shadow-lg shadow-primary/30">
                        <ShareGlyph className="w-6 h-6" />
                    </div>
                </div>
                <Icon icon="solar:bookmark-bold-duotone" className="w-5 h-5 text-[#0F2944]/30" />
            </div>
        </div>
    );
}

// Feuille de partage avec la ligne "Ajouter à l'écran d'accueil" à repérer en défilant.
function ScrollSheetIllustration() {
    return (
        <div className="w-full rounded-[1.75rem] bg-white border border-[#EEF1F4] shadow-[0_8px_24px_rgba(15,41,68,0.08)] p-4 overflow-hidden">
            <div className="flex justify-center mb-2">
                <div className="h-1 w-10 rounded-full bg-[#0F2944]/15" />
            </div>
            <div className="space-y-2 opacity-40">
                <div className="flex items-center gap-3 px-2 py-2">
                    <Icon icon="solar:copy-bold-duotone" className="w-5 h-5" />
                    <div className="h-2 w-20 rounded-full bg-[#0F2944]/20" />
                </div>
                <div className="flex items-center gap-3 px-2 py-2">
                    <Icon icon="solar:star-bold-duotone" className="w-5 h-5" />
                    <div className="h-2 w-28 rounded-full bg-[#0F2944]/20" />
                </div>
            </div>
            <motion.div
                className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-primary/10 border-2 border-primary/40 mt-1"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
            >
                <div className="bg-primary text-white p-1.5 rounded-lg shrink-0">
                    <Icon icon="solar:add-square-bold" className="w-5 h-5" />
                </div>
                {/* style inline : ce texte simule une capture d'écran iOS toujours claire, il ne doit pas suivre le dark mode de l'app */}
                <span className="text-sm font-black" style={{ color: "#0F2944" }}>Ajouter à l'écran d'accueil</span>
            </motion.div>
            <div className="flex justify-center mt-2">
                <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <Icon icon="solar:alt-arrow-down-bold-duotone" className="w-6 h-6 text-primary" />
                </motion.div>
            </div>
        </div>
    );
}

// Écran de confirmation d'ajout avec le bouton "Ajouter" mis en évidence.
function ConfirmSheetIllustration() {
    return (
        <div className="w-full rounded-[1.75rem] bg-white border border-[#EEF1F4] shadow-[0_8px_24px_rgba(15,41,68,0.08)] p-4">
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#0F2944]/40">Annuler</span>
                <span className="text-xs font-black" style={{ color: "#0F2944" }}>Ajouter à l'accueil</span>
                <motion.span
                    className="text-xs font-black text-primary"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity }}
                >
                    Ajouter
                </motion.span>
            </div>
            <div className="flex items-center gap-3 bg-[#F2EFE7]/60 rounded-2xl p-3">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Icon icon="solar:iphone-bold-duotone" className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1.5">
                    <div className="h-2.5 w-24 rounded-full bg-[#0F2944]/25" />
                    <div className="h-2 w-16 rounded-full bg-[#0F2944]/15" />
                </div>
            </div>
        </div>
    );
}

const STEPS = [
    {
        title: "Appuyez sur Partager",
        description: "En bas (ou en haut) de votre navigateur, appuyez sur l'icône Partager.",
        Illustration: ShareBarIllustration,
    },
    {
        title: "Faites défiler",
        description: "Dans le menu qui s'ouvre, cherchez « Ajouter à l'écran d'accueil ».",
        Illustration: ScrollSheetIllustration,
    },
    {
        title: "Appuyez sur Ajouter",
        description: "Confirmez en haut à droite. L'application apparaît sur votre écran d'accueil !",
        Illustration: ConfirmSheetIllustration,
    },
];

export default function IOSInstallGuide({ open, onClose, startAt = "confirm" }: IOSInstallGuideProps) {
    const [screen, setScreen] = useState<Screen>(startAt);
    const [stepIndex, setStepIndex] = useState(0);
    // Portail vers document.body — nécessaire ici même si InstallPWA.tsx (un des appelants)
    // porte déjà ce composant lui-même : FooterInstallButton.tsx (le bouton "Télécharger
    // l'application" du footer) le rend directement, sans portail, à l'intérieur du
    // motion.div de PageTransition — même piège `transform` que documenté dans
    // InstallPWA.tsx/CookieConsentModal.tsx. Le portail doit donc vivre ici, pas chez chaque
    // appelant, pour que ce guide s'affiche correctement au premier plan quel que soit
    // l'endroit d'où il est ouvert.
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        if (open) {
            setScreen(startAt);
            setStepIndex(0);
        }
    }, [open, startAt]);

    const isLastStep = stepIndex === STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onClose();
        } else {
            setStepIndex((s) => s + 1);
        }
    };

    const handleBack = () => {
        if (stepIndex === 0) {
            setScreen("confirm");
        } else {
            setStepIndex((s) => s - 1);
        }
    };

    const CurrentIllustration = STEPS[stepIndex].Illustration;

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                // z-[10001] : ce wizard peut s'ouvrir par-dessus la carte "Installer l'application"
                // (InstallPWA.tsx, z-[10000]) sans qu'elle se ferme — voir son commentaire pour
                // le contexte complet (Header fixed en z-[100], portail document.body requis).
                <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 sm:p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#0F2944]/30 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: { type: "spring", damping: 25, stiffness: 400 },
                        }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                        className="relative w-full max-w-sm bg-[#FBFAF6] text-[#0F2944] rounded-[2rem] shadow-[0_20px_50px_rgba(15,41,68,0.2)] border border-[#EEF1F4] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <AnimatePresence mode="wait">
                            {screen === "confirm" ? (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, x: -16 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -16 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-6 sm:p-8 flex flex-col items-center text-center"
                                >
                                    <div className="relative mb-5">
                                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                        <div className="relative bg-white border border-zinc-100 shadow-sm p-4 rounded-2xl text-primary">
                                            <Icon icon="solar:iphone-bold-duotone" className="w-9 h-9" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                                        Installer l'application ?
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#1F3A5F] leading-relaxed mb-6 px-1">
                                        Voulez-vous ajouter cette application à l'écran d'accueil de votre iPhone afin d'y accéder plus rapidement ?
                                    </p>

                                    <div className="flex w-full gap-2 sm:gap-3">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-3 px-4 bg-[#F2EFE7] text-[#0F2944] rounded-2xl font-bold text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98]"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={() => setScreen("wizard")}
                                            className="flex-1 py-3 px-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
                                        >
                                            Continuer
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={`wizard-${stepIndex}`}
                                    initial={{ opacity: 0, x: 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -24 }}
                                    transition={{ duration: 0.22 }}
                                    className="p-6 sm:p-8 flex flex-col items-center text-center"
                                >
                                    {/* Barre de progression */}
                                    <div className="flex items-center gap-2 mb-5 w-full justify-center">
                                        {STEPS.map((_, i) => (
                                            <div
                                                key={i}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? "w-8 bg-primary" : i < stepIndex ? "w-4 bg-primary/40" : "w-4 bg-[#EEF1F4]"
                                                    }`}
                                            />
                                        ))}
                                    </div>

                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3">
                                        Étape {stepIndex + 1} sur {STEPS.length}
                                    </span>

                                    <div className="w-full mb-5">
                                        <CurrentIllustration />
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">
                                        {STEPS[stepIndex].title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#1F3A5F] leading-relaxed mb-6 px-1">
                                        {STEPS[stepIndex].description}
                                    </p>

                                    <div className="flex w-full gap-2 sm:gap-3">
                                        <button
                                            onClick={handleBack}
                                            className="py-3 px-4 bg-[#F2EFE7] text-[#0F2944] rounded-2xl font-bold text-sm transition-all hover:bg-[#E8E2D6] active:scale-[0.98]"
                                            aria-label="Retour"
                                        >
                                            <Icon icon="solar:alt-arrow-left-bold-duotone" className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleNext}
                                            className="flex-1 py-3 px-4 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary/25 transition-all hover:opacity-90 active:scale-[0.98]"
                                        >
                                            {isLastStep ? "J'ai compris" : "Suivant"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
