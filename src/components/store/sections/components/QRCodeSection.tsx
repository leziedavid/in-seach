"use client"

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import Image from "next/image"
import { QRCodeCanvas } from "qrcode.react"
import { AccordionSection } from "@/components/ui/AccordionSection"
import { useNotification } from "@/components/notifications/NotificationProvider"
import { StoreUserInfo } from "@/types/interface"

// Couleur secondary du projet (hsl(195, 69%, 27%))
const SECONDARY_HEX = "#0D4D6E"

interface QRCodeSectionProps {
    storeInfo: StoreUserInfo;
    activeSection: string | null;
    onToggle: (id: string) => void;
}

export default function QRCodeSection({ storeInfo, activeSection, onToggle }: QRCodeSectionProps) {
    const { addNotification } = useNotification()
    const [baseUrl, setBaseUrl] = useState("")

    useEffect(() => {
        setBaseUrl(typeof window !== "undefined" ? window.location.origin : "")
    }, [])

    const qrUrl = baseUrl ? `${baseUrl}/qr/store/${storeInfo.id}` : ""
    const storeName = storeInfo.storeName || "Ma Boutique"
    const logoSrc = storeInfo.storeLogo || "/logo.png"

    // Canvas Wave-style : fond secondary plein, encadré blanc avec QR noir centré
    const buildWaveCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const qrCanvas = document.getElementById("store-qr-canvas") as HTMLCanvasElement | null
        if (!qrCanvas) return null

        const W = 600
        const H = 800
        const c = document.createElement("canvas")
        c.width = W; c.height = H
        const ctx = c.getContext("2d")
        if (!ctx) return null

        // ── Fond secondary plein ──
        ctx.fillStyle = SECONDARY_HEX
        ctx.fillRect(0, 0, W, H)

        // ── Logo (cercle blanc) ──
        const logoSize = 80
        const logoX = W / 2 - logoSize / 2
        const logoY = 60
        ctx.save()
        ctx.beginPath()
        ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2 + 6, 0, Math.PI * 2)
        ctx.fillStyle = "rgba(255,255,255,0.2)"
        ctx.fill()
        ctx.restore()

        // Charger et dessiner le logo
        await new Promise<void>((resolve) => {
            const img = new window.Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                ctx.save()
                ctx.beginPath()
                ctx.arc(W / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2)
                ctx.closePath()
                ctx.clip()
                ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
                ctx.restore()
                resolve()
            }
            img.onerror = () => resolve()
            img.src = logoSrc
        })

        // ── Nom de la boutique ──
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        // Tronquer si trop long
        let displayName = storeName.toUpperCase()
        while (ctx.measureText(displayName).width > W - 80 && displayName.length > 3) {
            displayName = displayName.slice(0, -1)
        }
        if (displayName !== storeName.toUpperCase()) displayName += "…"
        ctx.fillText(displayName, W / 2, logoY + logoSize + 36)

        // ── Encadré blanc pour QR ──
        const qrBoxSize = 340
        const qrBoxX = (W - qrBoxSize) / 2
        const qrBoxY = logoY + logoSize + 80
        const radius = 24
        ctx.beginPath()
        ctx.moveTo(qrBoxX + radius, qrBoxY)
        ctx.lineTo(qrBoxX + qrBoxSize - radius, qrBoxY)
        ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY, qrBoxX + qrBoxSize, qrBoxY + radius)
        ctx.lineTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize - radius)
        ctx.quadraticCurveTo(qrBoxX + qrBoxSize, qrBoxY + qrBoxSize, qrBoxX + qrBoxSize - radius, qrBoxY + qrBoxSize)
        ctx.lineTo(qrBoxX + radius, qrBoxY + qrBoxSize)
        ctx.quadraticCurveTo(qrBoxX, qrBoxY + qrBoxSize, qrBoxX, qrBoxY + qrBoxSize - radius)
        ctx.lineTo(qrBoxX, qrBoxY + radius)
        ctx.quadraticCurveTo(qrBoxX, qrBoxY, qrBoxX + radius, qrBoxY)
        ctx.closePath()
        ctx.fillStyle = "#ffffff"
        ctx.fill()

        // ── QR noir centré dans l'encadré ──
        const qrPad = 24
        const qrSize = qrBoxSize - qrPad * 2
        ctx.drawImage(qrCanvas, qrBoxX + qrPad, qrBoxY + qrPad, qrSize, qrSize)

        // ── Tagline ──
        ctx.fillStyle = "rgba(255,255,255,0.85)"
        ctx.font = "600 18px 'Segoe UI', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Scannez pour découvrir notre boutique", W / 2, qrBoxY + qrBoxSize + 48)

        return c
    }

    const handleDownload = async () => {
        const canvas = await buildWaveCanvas()
        if (!canvas) return
        const link = document.createElement("a")
        link.download = `qr-boutique-${storeName.replace(/\s+/g, "-").toLowerCase()}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
        addNotification("QR Code téléchargé", "success")
    }

    const handlePrint = async () => {
        const canvas = await buildWaveCanvas()
        if (!canvas) return
        const dataUrl = canvas.toDataURL("image/png")
        const win = window.open("", "_blank")
        if (!win) return
        win.document.write(`<!DOCTYPE html>
        <html lang="fr">
        <head>
        <meta charset="UTF-8"/>
        <title>QR Code – ${storeName}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
            body { background:#e0e0e0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
            img { width:420px; height:560px; object-fit:contain; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.18); display:block; }
            @media print { body { background:#fff; } img { box-shadow:none; } }
        </style>
        </head>
        <body>
        <img src="${dataUrl}" alt="QR Code ${storeName}" />
        <script>window.onload=()=>{ window.print(); }<\/script>
        </body>
        </html>`)
        win.document.close()
    }

    if (!qrUrl) return null

    return (
        <AccordionSection id="qr-code"
            title="QR Code de votre boutique"
            subtitle="Affichage physique — à imprimer ou afficher en boutique"
            icon="solar:qr-code-bold-duotone"
            activeSection={activeSection}
            onToggle={onToggle} >
            <button onClick={() => onToggle("qr-code")} className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors mb-4">
                <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                Réduire
            </button>
            <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-stretch gap-6 md:gap-10">

                {/* ── Carte style Wave ── */}
                <div className="w-full md:flex-[3]">
                    <div className="w-full h-full rounded-3xl overflow-hidden shadow-lg flex flex-col items-center py-8 px-3 md:px-6 gap-3" style={{ backgroundColor: SECONDARY_HEX }} >
                        {/* Logo — sans fond, taille généreuse */}
                        <div className="w-28 h-28 relative shrink-0">
                            {storeInfo.storeLogo ? (
                                <Image src={storeInfo.storeLogo} alt={storeName} fill className="object-contain" unoptimized />
                            ) : (
                                <Image src="/logo.png" alt="Logo" fill className="object-contain" unoptimized />
                            )}
                        </div>

                        {/* Nom boutique */}
                        <p className="text-white font-black text-lg uppercase tracking-wide text-center leading-tight line-clamp-2">
                            {storeName}
                        </p>

                        {/* QR noir sur fond blanc — occupe tout l'espace dispo */}
                        <div className="bg-white rounded-2xl p-2 md:p-4 w-full flex items-center justify-center">
                            <QRCodeCanvas
                                id="store-qr-canvas"
                                value={qrUrl}
                                size={260}
                                level="H"
                                bgColor="#ffffff"
                                fgColor="#111111"
                                style={{ display: "block", width: "100%", height: "auto" }}
                            />
                        </div>

                        {/* Tagline */}
                        <p className="text-white/80 text-[11px] font-bold uppercase tracking-widest text-center">
                            Scannez pour découvrir notre boutique
                        </p>
                    </div>
                </div>

                {/* ── Info + boutons ── */}
                <div className="flex flex-col gap-4 w-full md:flex-[2]">
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 space-y-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-3 h-3" />
                            QR Code permanent
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Ce QR Code reste valide même si vous modifiez le nom, le logo ou la description de votre boutique.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={handleDownload} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-primary text-white font-black text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl shadow-sm shadow-primary/20 hover:bg-secondary transition-all active:scale-95">
                            <Icon icon="solar:download-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Télécharger</span>
                        </button>
                        <button onClick={handlePrint} className="flex-1 min-w-0 flex items-center justify-center gap-1.5 bg-muted text-foreground font-black text-[10px] uppercase tracking-wide py-2.5 px-2 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95">
                            <Icon icon="solar:printer-bold-duotone" className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Imprimer</span>
                        </button>
                    </div>
                </div>

            </div>
        </AccordionSection>
    );
}
