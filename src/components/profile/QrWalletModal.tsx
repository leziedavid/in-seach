"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useNotification } from "@/components/notifications/NotificationProvider";

interface QrWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrValue: string;
    title: string;
    subtitle: string;
    logoSrc: string;
    hasLogoImage: boolean;
}

/**
 * Version plein écran du QR du raccourci DashMenu — même carte "façon Wave"
 * (infos, QR + "Scanner" en pied de carte blanche, logo en coin bas-droit)
 * juste agrandie pour un scan confortable, avec téléchargement/impression
 * pour l'afficher en boutique physique.
 */
export default function QrWalletModal({ isOpen, onClose, qrValue, title, subtitle, logoSrc, hasLogoImage }: QrWalletModalProps) {
    const [mounted, setMounted] = useState(false);
    const { addNotification } = useNotification();
    const canvasId = `qr-wallet-canvas-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    // Canvas hors-écran reproduisant la carte affichée (dégradé, infos, QR +
    // "Scanner", logo en coin) — même technique que QRCodeCard.tsx.
    const buildCardCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const qrCanvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        if (!qrCanvas) return null;

        const W = 600;
        const H = 760;
        const c = document.createElement("canvas");
        c.width = W; c.height = H;
        const ctx = c.getContext("2d");
        if (!ctx) return null;

        // ── Fond dégradé (même teintes que .qr-card-surface) ──
        const bgGradient = ctx.createLinearGradient(0, 0, W, H);
        bgGradient.addColorStop(0, "#092E40");
        bgGradient.addColorStop(1, "#134F65");
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, W, H);

        // ── Titre ──
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 40px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        let displayTitle = title.toUpperCase();
        while (ctx.measureText(displayTitle).width > W - 100 && displayTitle.length > 3) {
            displayTitle = displayTitle.slice(0, -1);
        }
        if (displayTitle !== title.toUpperCase()) displayTitle += "…";
        ctx.fillText(displayTitle, W / 2, 90);

        // ── Sous-titre ──
        ctx.fillStyle = "rgba(255,255,255,0.65)";
        ctx.font = "600 18px 'Segoe UI', Arial, sans-serif";
        let displaySubtitle = subtitle;
        while (ctx.measureText(displaySubtitle).width > W - 120 && displaySubtitle.length > 3) {
            displaySubtitle = displaySubtitle.slice(0, -1);
        }
        if (displaySubtitle !== subtitle) displaySubtitle += "…";
        ctx.fillText(displaySubtitle, W / 2, 130);

        // ── Encadré blanc : QR puis "Scanner" en dessous, dans sa propre bande
        //    (pas la même zone que le QR — sinon le texte se confond avec le
        //    motif du code). ──
        const qrPad = 28;
        const qrSize = 344;
        const captionHeight = 64;
        const boxWidth = qrSize + qrPad * 2;
        const boxHeight = qrPad + qrSize + captionHeight;
        const boxX = (W - boxWidth) / 2;
        const boxY = 180;
        const boxRadius = 32;
        ctx.beginPath();
        ctx.moveTo(boxX + boxRadius, boxY);
        ctx.lineTo(boxX + boxWidth - boxRadius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + boxRadius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - boxRadius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - boxRadius, boxY + boxHeight);
        ctx.lineTo(boxX + boxRadius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - boxRadius);
        ctx.lineTo(boxX, boxY + boxRadius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + boxRadius, boxY);
        ctx.closePath();
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.drawImage(qrCanvas, boxX + qrPad, boxY + qrPad, qrSize, qrSize);

        ctx.fillStyle = "#0F172A";
        ctx.font = "800 24px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("Scanner", W / 2, boxY + qrPad + qrSize + captionHeight / 2);

        // ── Logo — cercle en coin bas-droit de la carte, à cheval sur le bord.
        //    object-contain (comme à l'écran) : un logo rectangulaire (wordmark)
        //    est redimensionné SANS être recadré, pas étiré/rogné en carré. ──
        const logoSize = 96;
        const logoCx = boxX + boxWidth;
        const logoCy = boxY + boxHeight;
        ctx.save();
        ctx.beginPath();
        ctx.arc(logoCx, logoCy, logoSize / 2 + 6, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.restore();

        await new Promise<void>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                if (hasLogoImage) {
                    // Vraie photo de logo (carrée) — remplit le cercle, comme object-cover.
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(logoCx, logoCy, logoSize / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(img, logoCx - logoSize / 2, logoCy - logoSize / 2, logoSize, logoSize);
                    ctx.restore();
                } else {
                    // Logo/wordmark de secours — object-contain : ratio conservé,
                    // centré, pas de recadrage même si l'image n'est pas carrée.
                    const maxDim = logoSize * 0.62;
                    const naturalW = img.naturalWidth || 1;
                    const naturalH = img.naturalHeight || 1;
                    const ratio = Math.min(maxDim / naturalW, maxDim / naturalH);
                    const dw = naturalW * ratio;
                    const dh = naturalH * ratio;
                    ctx.drawImage(img, logoCx - dw / 2, logoCy - dh / 2, dw, dh);
                }
                resolve();
            };
            img.onerror = () => resolve();
            img.src = logoSrc;
        });

        return c;
    };

    const handleDownload = async () => {
        const canvas = await buildCardCanvas();
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = `qr-code-${title.replace(/\s+/g, "-").toLowerCase()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        addNotification("QR Code téléchargé", "success");
    };

    const handlePrint = async () => {
        const canvas = await buildCardCanvas();
        if (!canvas) return;
        const dataUrl = canvas.toDataURL("image/png");
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`<!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="UTF-8"/>
        <title>QR Code – ${title}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
            body { background:#e0e0e0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
            img { width:420px; height:532px; object-fit:contain; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.18); display:block; }
            @media print { body { background:#fff; } img { box-shadow:none; } }
        </style>
        </head>
        <body>
        <img src="${dataUrl}" alt="QR Code ${title}" />
        <script>window.onload=()=>{ window.print(); }<\/script>
        </body>
        </html>`);
        win.document.close();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-[#0F2944]/60 backdrop-blur-md z-[1000]"
                    />
                    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-6 pointer-events-none">
                        <button
                            onClick={onClose}
                            aria-label="Fermer"
                            className="fixed top-6 left-6 z-[1002] w-10 h-10 rounded-full bg-white/15 border border-white/20 shadow-lg flex items-center justify-center text-white hover:bg-white/25 active:scale-90 transition-all pointer-events-auto"
                        >
                            <Icon icon="solar:close-circle-bold" width={22} />
                        </button>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 16 }}
                            transition={{ type: "spring", stiffness: 320, damping: 28 }}
                            className="w-full max-w-xs flex flex-col items-center gap-4 pointer-events-auto"
                        >
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full rounded-[2.5rem] qr-card-surface qr-card-pattern shadow-2xl shadow-secondary/30 overflow-visible"
                            >
                                <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-9">
                                    {/* Infos utilisateur */}
                                    <div className="text-center">
                                        <p className="text-white font-black text-lg uppercase tracking-wide leading-tight">{title}</p>
                                        <p className="text-white/60 text-[11px] font-semibold mt-0.5">{subtitle}</p>
                                    </div>

                                    {/* QR — grand format, "Scanner" en pied de carte blanche comme la
                                        référence Wave (pas une pastille séparée à côté) */}
                                    <div className="rounded-[1.75rem] bg-white shadow-lg overflow-hidden">
                                        <div className="p-4 pb-3">
                                            <QRCodeCanvas id={canvasId} value={qrValue} size={220} level="H" bgColor="#ffffff" fgColor="#111111" />
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5 pb-3">
                                            <Icon icon="solar:camera-bold" width={15} className="text-[#0F172A]" />
                                            <span className="text-[#0F172A] text-sm font-bold">Scanner</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logo — coin bas-droit de la carte, pas "chapeau" sur le QR */}
                                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                                    <Image
                                        src={logoSrc}
                                        alt={title}
                                        width={hasLogoImage ? 56 : 30}
                                        height={hasLogoImage ? 56 : 30}
                                        className={hasLogoImage ? "w-full h-full object-cover" : "object-contain"}
                                        unoptimized
                                    />
                                </div>
                            </div>

                            {/* Télécharger / Imprimer — pour afficher le QR en boutique physique */}
                            <div className="flex gap-2 w-full px-2">
                                <button
                                    onClick={handleDownload}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary hover:bg-secondary text-white font-black text-xs uppercase tracking-wide py-3 rounded-2xl shadow-lg shadow-primary/20 transition-all active:scale-95"
                                >
                                    <Icon icon="solar:download-bold-duotone" width={16} />
                                    Télécharger
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-black text-xs uppercase tracking-wide py-3 rounded-2xl transition-all active:scale-95"
                                >
                                    <Icon icon="solar:printer-bold-duotone" width={16} />
                                    Imprimer
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
