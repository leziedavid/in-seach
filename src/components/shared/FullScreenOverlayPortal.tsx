"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";

// Portail plein écran générique, vers document.body — nécessaire car ce composant est
// destiné à être monté à l'intérieur du motion.div de PageTransition (ClientLayout.tsx),
// qui applique un `transform` Framer Motion. Un `transform` sur un ancêtre crée un
// nouveau "containing block" pour tout descendant `position: fixed`, qui se retrouve
// alors piégé dans la boîte de PageTransition au lieu de couvrir le vrai viewport
// (header/footer restent visibles au-dessus). Le portail sort l'overlay de cette
// hiérarchie DOM, comme les autres overlays plein écran du projet (voir Modal dans
// MotionModal.tsx).
//
// Centralise tout ce qui concerne l'affichage de l'overlay (fond, z-index, animation
// d'entrée/sortie) : les appelants ne fournissent que leur contenu et la condition
// `show` — ils n'ont plus à répéter `fixed inset-0 z-[9999] bg-background` eux-mêmes.
export default function FullScreenOverlayPortal({ show, children, className = "" }: {
    show: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background ${className}`}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
