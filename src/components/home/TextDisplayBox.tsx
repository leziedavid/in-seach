"use client"

import { useState } from "react"

type TextDisplayBoxProps = {
    text?: string
    maxHeight?: string
    expandable?: boolean
    isHtml?: boolean
}

function sanitizeHtml(html: string): string {
    let result = html

    // 1. Extraire uniquement le contenu utile des <pre><code>
    result = result.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, (_, inner) => {
        const text = inner
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim()

        // Supprimer les doublons : si le texte est une concaténation répétée
        const half = Math.floor(text.length / 2)
        const firstHalf = text.slice(0, half).trim()
        const secondHalf = text.slice(half).trim()
        const deduped = secondHalf.startsWith(firstHalf) ? firstHalf : text

        return `<p>${deduped}</p>`
    })

    // 2. Supprimer les paragraphes génériques inutiles
    result = result.replace(/<p>Détails haute qualité[^<]*<\/p>/gi, "")

    // 3. Remplacer <h1> par <h2> pour une hiérarchie correcte
    result = result
        .replace(/<h1>/gi, "<h2>")
        .replace(/<\/h1>/gi, "</h2>")

    // 4. Supprimer les <p> vides
    result = result.replace(/<p>\s*<\/p>/gi, "")

    return result.trim()
}

export default function TextDisplayBox({ text = "", maxHeight = "160px", expandable = true, isHtml = false, }: TextDisplayBoxProps) {
    const [expanded, setExpanded] = useState(false)

    const safeText = text ?? ""
    const shouldShowToggle = expandable && safeText.length > 200
    const htmlContent = isHtml ? sanitizeHtml(safeText) : safeText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")

    return (
        <div className="w-full">
            {/* CARD */}
            <div className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl relative" style={{ maxHeight: expandable && !expanded ? maxHeight : "none", overflow: "hidden", }} >
                {/* CONTENT */}
                <div className="text-sm text-gray-500 dark:text-zinc-300 leading-relaxed prose prose-sm max-w-none break-words" dangerouslySetInnerHTML={{ __html: htmlContent }} />
                {/* Fade effect */}
                {expandable && !expanded && (
                    <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-gray-50 dark:from-zinc-800 to-transparent" />
                )}
            </div>

            {/* Toggle */}
            {shouldShowToggle && (
                <button onClick={() => setExpanded(!expanded)} className="mt-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 transition">{expanded ? "Voir moins" : "Voir plus"} </button>
            )}
        </div>
    )
}