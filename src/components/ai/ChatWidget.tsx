"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Icon } from "@iconify/react"
import { isAuthenticated } from "@/lib/auth"
import { sendAiChatMessage, AiChatHistoryMessage } from "@/api/api"

interface DisplayMessage {
  role: "user" | "assistant"
  text: string
}

/** Extrait le texte affichable d'un message d'historique (ignore les blocs tool_use/tool_result). */
function toDisplayText(content: string | Record<string, any>[]): string {
  if (typeof content === "string") return content
  return content
    .filter((block) => block.type === "text")
    .map((block) => block.text as string)
    .join("\n")
    .trim()
}

/**
 * Widget de chat IA — bouton flottant. Conversation gérée côté frontend :
 * l'historique complet est renvoyé à chaque appel à POST /ai-mcp/chat (le
 * backend ne persiste rien pour l'instant).
 *
 * Pas de restriction de page ici : la visibilité dépend uniquement de
 * l'authentification. C'est au composant qui monte <ChatWidget /> de décider
 * où il doit apparaître (ex: layout.tsx pour la homepage, akwaba/page.tsx
 * pour qu'il reste accessible quel que soit l'onglet actif).
 *
 * Icônes Solar vérifiées une à une via l'API Iconify (api.iconify.design) —
 * `solar:close-bold` et `solar:send-bold-duotone` n'existent pas dans le set
 * et ne s'affichaient donc jamais ; remplacées par des noms confirmés.
 */
export default function ChatWidget() {
  const [show, setShow] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [history, setHistory] = useState<AiChatHistoryMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShow(isAuthenticated())
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isSending])

  if (!show) return null

  const openChat = () => setIsOpen(true)
  const closeChat = () => setIsOpen(false)

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isSending) return

    setInput("")
    setError(null)
    setMessages((prev) => [...prev, { role: "user", text }])
    setIsSending(true)

    try {
      const response = await sendAiChatMessage({ message: text, history })
      if (response.statusCode >= 400) throw new Error(response.message)

      const data = response.data!
      setHistory(data.history)
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }])
    } catch (err: any) {
      setError(err?.message || "L'assistant n'a pas pu répondre. Réessaie.")
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={openChat}
        className="fixed bottom-6 right-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-2xl transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Ouvrir l'assistant IA Djamko"
      >
        <Icon icon="solar:magic-stick-3-bold-duotone" width={24} height={24} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeChat}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm sm:hidden"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full sm:w-[380px] h-[85vh] sm:h-[560px] sm:max-h-[80vh] overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-border flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white shrink-0">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:magic-stick-3-bold-duotone" width={20} height={20} />
                  <span className="text-sm font-bold">Assistant Djamko</span>
                </div>
                <button onClick={closeChat} className="rounded-full bg-white/10 p-1.5 hover:bg-white/20 transition-colors">
                  <Icon icon="solar:close-circle-bold-duotone" width={18} height={18} />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 px-4">
                    <Icon icon="solar:chat-round-dots-bold-duotone" width={32} height={32} className="opacity-30" />
                    <p className="text-sm">
                      Pose-moi une question sur les produits, services ou annonces Djamko.
                    </p>
                  </div>
                )}

                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-primary text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`} >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2 flex items-center gap-1.5">
                      <Icon icon="solar:refresh-bold-duotone" width={14} height={14} className="animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">L'assistant réfléchit...</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs text-red-500 px-1">{error}</div>
                )}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2 px-3 py-3 border-t border-border shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Écris ton message..."
                  disabled={isSending}
                  className="flex-1 text-sm px-3.5 py-2.5 rounded-full border border-border bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !input.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                  aria-label="Envoyer"
                >
                  <Icon icon="solar:plain-2-bold-duotone" width={18} height={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
