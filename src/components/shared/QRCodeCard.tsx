"use client"

import { useState, useEffect, useId } from "react"
import { Icon } from "@iconify/react"
import Image from "next/image"
import { QRCodeCanvas } from "qrcode.react"
import { useNotification } from "@/components/notifications/NotificationProvider"

// Couleur secondary du projet (hsl(195, 69%, 27%))
const SECONDARY_HEX = "#0D4D6E"

interface QRCodeCardProps {
    /** Chemin relatif de la page publique à encoder (ex: "/qr/store/123", "/restaurant/mon-slug") */
    path: string;
    /** Nom affiché sur la carte et utilisé dans le nom de fichier */
    name: string;
    logoSrc?: string | null;
    tagline?: string;
    infoText?: string;
    /** Préfixe du nom de fichier téléchargé/imprimé */
    filenamePrefix?: string;
}

/**
 * Carte QR Code générique "façon Wave" (logo + nom + QR + tagline) avec téléchargement/impression.
 * Extraite de Store.tsx pour être réutilisée telle quelle (Boutique, Restaurant, ...) sans duplication —
 * paramétrée par `path`/`name`/`logoSrc` plutôt que liée à une entité précise.
 */
export default function QRCodeCard({
    path,
    name,
    logoSrc,
    tagline = "Scannez pour découvrir",
    infoText = "Ce QR Code reste valide même si vous modifiez vos informations.",
    filenamePrefix = "qr-code",
}: QRCodeCardProps) {
    const { addNotification } = useNotification()
    const [baseUrl, setBaseUrl] = useState("")
    const canvasId = `qr-canvas-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

    useEffect(() => {
        setBaseUrl(typeof window !== "undefined" ? window.location.origin : "")
    }, [])

    const qrUrl = baseUrl ? `${baseUrl}${path}` : ""
    const displayName = name || "Ma page"
    const logo = logoSrc || "/logo.png"

    // Canvas Wave-style : fond secondary plein, encadré blanc avec QR noir centré
    const buildWaveCanvas = async (): Promise<HTMLCanvasElement | null> => {
        const qrCanvas = document.getElementById(canvasId) as HTMLCanvasElement | null
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
            img.src = logo
        })

        // ── Nom ──
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        // Tronquer si trop long
        let displayText = displayName.toUpperCase()
        while (ctx.measureText(displayText).width > W - 80 && displayText.length > 3) {
            displayText = displayText.slice(0, -1)
        }
        if (displayText !== displayName.toUpperCase()) displayText += "…"
        ctx.fillText(displayText, W / 2, logoY + logoSize + 36)

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
        ctx.fillText(tagline, W / 2, qrBoxY + qrBoxSize + 48)

        return c
    }

    const handleDownload = async () => {
        const canvas = await buildWaveCanvas()
        if (!canvas) return
        const link = document.createElement("a")
        link.download = `${filenamePrefix}-${displayName.replace(/\s+/g, "-").toLowerCase()}.png`
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
        <title>QR Code – ${displayName}</title>
        <style>
            * { margin:0; padding:0; box-sizing:border-box; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
            body { background:#e0e0e0; display:flex; align-items:center; justify-content:center; min-height:100vh; }
            img { width:420px; height:560px; object-fit:contain; border-radius:20px; box-shadow:0 8px 40px rgba(0,0,0,0.18); display:block; }
            @media print { body { background:#fff; } img { box-shadow:none; } }
        </style>
        </head>
        <body>
        <img src="${dataUrl}" alt="QR Code ${displayName}" />
        <script>window.onload=()=>{ window.print(); }<\/script>
        </body>
        </html>`)
        win.document.close()
    }

    if (!qrUrl) return null

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row items-stretch gap-6 md:gap-10">

            {/* ── Carte QR — même style que le raccourci d'accueil (DashMenu) : QR nu + logo "chapeau" ── */}
            <div className="w-full md:flex-[3]">
                <div className="w-full h-full rounded-3xl border border-border bg-card shadow-sm flex flex-col items-center py-8 px-3 md:px-6 gap-4">
                    <div className="relative pt-6">
                        <div className="p-2 rounded-2xl bg-background border border-border shadow-sm">
                            <QRCodeCanvas
                                id={canvasId}
                                value={qrUrl}
                                size={196}
                                level="H"
                                bgColor="#ffffff"
                                fgColor="#111111"
                            />
                        </div>
                        {/* Logo "chapeau" — chevauche le bord supérieur du QR */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-card border-2 border-background shadow-md flex items-center justify-center overflow-hidden">
                            <Image
                                src={logo}
                                alt={displayName}
                                width={logoSrc ? 56 : 32}
                                height={logoSrc ? 56 : 32}
                                className={logoSrc ? "w-full h-full object-cover" : "object-contain"}
                                unoptimized
                            />
                        </div>
                    </div>

                    {/* Nom */}
                    <p className="text-foreground font-black text-lg uppercase tracking-wide text-center leading-tight line-clamp-2">
                        {displayName}
                    </p>

                    {/* Tagline */}
                    <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest text-center">
                        {tagline}
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
                        {infoText}
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
    );
}
