"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { useNotification } from "@/components/notifications/NotificationProvider"

/** Panneau de partage générique (lien + réseaux sociaux) — réutilisé par Store, Services, Annonces, Logistique... */
export default function SharePanel({ url, label }: { url: string; label: string }) {
    const { addNotification } = useNotification()
    const [copied, setCopied] = useState(false)

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            addNotification("Lien copié !", "success")
            setTimeout(() => setCopied(false), 2000)
        } catch {
            addNotification("Erreur lors de la copie", "error")
        }
    }

    const shareLinks = [
        { name: "WhatsApp", icon: "logos:whatsapp-icon", url: `https://api.whatsapp.com/send?text=${encodeURIComponent(label + " " + url)}` },
        { name: "Facebook", icon: "logos:facebook", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
        { name: "Twitter", icon: "logos:twitter", url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(label)}&url=${encodeURIComponent(url)}` },
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-2xl px-4 py-3">
                <p className="flex-1 text-xs font-bold text-muted-foreground truncate">{url}</p>
                <button onClick={handleCopyLink} className="shrink-0 flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest">
                    <Icon icon={copied ? "solar:check-circle-bold-duotone" : "solar:copy-bold-duotone"} className="w-4 h-4" />
                    {copied ? "Copié" : "Copier"}
                </button>
            </div>
            <div className="flex gap-2">
                {shareLinks.map(link => (
                    <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted hover:bg-primary/10 transition-colors text-xs font-bold">
                        <Icon icon={link.icon} className="w-4 h-4" />
                        {link.name}
                    </a>
                ))}
            </div>
        </div>
    );
}
