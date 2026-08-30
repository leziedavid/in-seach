"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { io, Socket } from "socket.io-client";
import { importShopifyStore, ShopifyImportResult } from "@/api/api";

type StepKey = "vendor" | "fetch" | "import" | "done";
type PhaseKey = "form" | "connecting" | StepKey | "error";

interface ProgressEvent {
    step: StepKey | "error";
    message: string;
    current?: number;
    total?: number;
    data?: unknown;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

const STEPS: { key: StepKey; label: string; icon: string; description: string }[] = [
    { key: "vendor", label: "Vendeur", icon: "solar:user-check-bold-duotone", description: "Recherche ou création du compte" },
    { key: "fetch", label: "Récupération", icon: "solar:cloud-download-bold-duotone", description: "Téléchargement du catalogue" },
    { key: "import", label: "Import", icon: "solar:box-bold-duotone", description: "Création des produits" },
    { key: "done", label: "Terminé", icon: "solar:check-circle-bold-duotone", description: "Boutique prête" },
];

function formatElapsed(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ImportPage() {
    // ── Formulaire ────────────────────────────────────────────────
    const [phone, setPhone] = useState("");
    const [storeName, setStoreName] = useState("");
    const [storeEmail, setStoreEmail] = useState("");
    const [storeProductUrl, setStoreProductUrl] = useState("");
    const [category, setCategory] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // ── Suivi de l'import ─────────────────────────────────────────
    const [phase, setPhase] = useState<PhaseKey>("form");
    const [log, setLog] = useState<ProgressEvent[]>([]);
    const [currentEvent, setCurrentEvent] = useState<ProgressEvent | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState<ShopifyImportResult | null>(null);
    const [errorMessage, setErrorMessage] = useState("");

    const socketRef = useRef<Socket | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const logEndRef = useRef<HTMLDivElement>(null);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const cleanupSocket = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
    }, []);

    useEffect(() => () => { stopTimer(); cleanupSocket(); }, [stopTimer, cleanupSocket]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [log]);

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!phone.trim()) errs.phone = "Le numéro de téléphone est requis";
        if (!storeProductUrl.trim()) errs.storeProductUrl = "L'URL des produits est requise";
        else {
            try { new URL(storeProductUrl); } catch { errs.storeProductUrl = "URL invalide"; }
        }
        if (storeEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(storeEmail)) errs.storeEmail = "Email invalide";
        return errs;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setFormErrors({});

        const importId = crypto.randomUUID();
        setLog([]);
        setResult(null);
        setErrorMessage("");
        setElapsed(0);
        setPhase("connecting");

        timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);

        const socket = io(SOCKET_URL, { query: { jobId: importId }, transports: ["websocket", "polling"] });
        socketRef.current = socket;

        // Garde-fous : `connect` et `connect_error` peuvent tous les deux se déclencher (retries
        // socket.io) — l'import HTTP ne doit partir qu'une seule fois. `socketConnected` indique
        // si des événements "shopify:import:progress" sont à attendre ou si, faute de socket, il
        // faut finaliser directement depuis la réponse HTTP (sinon l'UI resterait bloquée à
        // attendre un événement "done" qui n'arrivera jamais).
        let launched = false;
        let socketConnected = false;

        const launchImport = async () => {
            if (launched) return;
            launched = true;
            try {
                const res = await importShopifyStore({
                    phone: phone.trim(),
                    storeName: storeName.trim() || undefined,
                    storeEmail: storeEmail.trim() || undefined,
                    storeProductUrl: storeProductUrl.trim(),
                    category: category.trim() || undefined,
                    importId,
                });
                if (res.statusCode >= 400) {
                    stopTimer();
                    cleanupSocket();
                    setErrorMessage(res.message || "L'import a échoué");
                    setPhase("error");
                    return;
                }
                if (!socketConnected && res.data) {
                    stopTimer();
                    cleanupSocket();
                    setResult(res.data);
                    setPhase("done");
                }
                // Sinon, le succès/l'échec est piloté par les événements socket ci-dessous.
            } catch {
                stopTimer();
                cleanupSocket();
                setErrorMessage("Impossible de contacter le serveur");
                setPhase("error");
            }
        };

        // On attend que le socket soit bien connecté (donc que le backend ait enregistré ce
        // jobId) avant d'envoyer la requête — sinon les tout premiers événements de progression
        // seraient émis dans le vide.
        socket.on("connect", () => {
            socketConnected = true;
            setPhase("vendor");
            launchImport();
        });

        socket.on("connect_error", () => {
            // Le socket peut échouer (réseau, pare-feu...) sans empêcher l'import HTTP classique
            // de fonctionner — on lance quand même la requête, juste sans suivi live détaillé
            // (voir `!socketConnected` ci-dessus pour la finalisation directe depuis la réponse).
            setPhase("vendor");
            launchImport();
        });

        socket.on("shopify:import:progress", (evt: ProgressEvent) => {
            setLog((prev) => [...prev, evt]);
            setCurrentEvent(evt);

            if (evt.step === "error") {
                stopTimer();
                cleanupSocket();
                setErrorMessage(evt.message);
                setPhase("error");
                return;
            }

            if (evt.step === "done") {
                stopTimer();
                cleanupSocket();
                setResult((evt.data as ShopifyImportResult) ?? null);
                setPhase("done");
                return;
            }

            setPhase(evt.step);
        });
    };

    const resetToForm = () => {
        stopTimer();
        cleanupSocket();
        setPhase("form");
        setLog([]);
        setCurrentEvent(null);
        setResult(null);
        setErrorMessage("");
    };

    const activeStepIndex = STEPS.findIndex((s) => s.key === phase);
    const isRunning = phase !== "form" && phase !== "error" && phase !== "done";

    return (
        <div className="min-h-dvh bg-gradient-to-b from-primary/5 via-background to-background flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 text-primary mb-4 shadow-inner">
                        <Icon icon="solar:shop-2-bold-duotone" className="w-9 h-9" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">Importer votre boutique</h1>
                    <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                        Rejoignez la marketplace en quelques secondes — donnez-nous juste l&apos;URL de votre catalogue Shopify.
                    </p>
                </div>

                <div className="bg-card rounded-3xl border border-border shadow-xl shadow-primary/5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {/* ══ FORMULAIRE ══ */}
                        {phase === "form" && (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="p-6 md:p-8 space-y-5"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Téléphone *</label>
                                    <input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0700000000"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                    />
                                    {formErrors.phone && <p className="text-[11px] text-red-500 font-bold">{formErrors.phone}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">URL des produits Shopify *</label>
                                    <input
                                        value={storeProductUrl}
                                        onChange={(e) => setStoreProductUrl(e.target.value)}
                                        placeholder="https://maboutique.com/collections/all/products.json"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                    />
                                    {formErrors.storeProductUrl && <p className="text-[11px] text-red-500 font-bold">{formErrors.storeProductUrl}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom de la boutique</label>
                                        <input
                                            value={storeName}
                                            onChange={(e) => setStoreName(e.target.value)}
                                            placeholder="Beto Store"
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                                        <input
                                            value={storeEmail}
                                            onChange={(e) => setStoreEmail(e.target.value)}
                                            placeholder="contact@boutique.com"
                                            className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                        />
                                        {formErrors.storeEmail && <p className="text-[11px] text-red-500 font-bold">{formErrors.storeEmail}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Catégorie</label>
                                    <input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Accessoires & Gadgets (par défaut)"
                                        className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-primary hover:bg-secondary text-white text-sm font-black rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                                >
                                    <Icon icon="solar:magic-stick-3-bold-duotone" className="w-4 h-4" />
                                    Importer ma boutique
                                </button>
                            </motion.form>
                        )}

                        {/* ══ PROGRESSION ══ */}
                        {isRunning && (
                            <motion.div
                                key="progress"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="p-6 md:p-8 space-y-6"
                            >
                                {/* Timer */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Import en cours</span>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/50 text-xs font-black tabular-nums">
                                        <Icon icon="solar:clock-circle-bold-duotone" className="w-3.5 h-3.5 text-primary animate-pulse" />
                                        {formatElapsed(elapsed)}
                                    </div>
                                </div>

                                {/* Stepper vertical */}
                                <div className="space-y-0">
                                    {STEPS.map((step, i) => {
                                        // `phase` ne peut jamais valoir "done" dans cette branche (voir le
                                        // rendu séparé plus bas) — l'étape à activeStepIndex est donc
                                        // toujours la seule active, jamais déjà "terminée" ici.
                                        const isDone = i < activeStepIndex;
                                        const isActive = i === activeStepIndex;
                                        const isLast = i === STEPS.length - 1;
                                        return (
                                            <div key={step.key} className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <motion.div
                                                        animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                                                        transition={{ duration: 1.4, repeat: isActive ? Infinity : 0 }}
                                                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-300 ${isDone ? "bg-emerald-500 text-white" : isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground/50"
                                                            }`}
                                                    >
                                                        {isDone ? (
                                                            <Icon icon="solar:check-bold" className="w-5 h-5" />
                                                        ) : (
                                                            <Icon icon={step.icon} className="w-5 h-5" />
                                                        )}
                                                    </motion.div>
                                                    {!isLast && (
                                                        <div className={`w-0.5 flex-1 min-h-[28px] transition-colors duration-500 ${isDone ? "bg-emerald-500" : "bg-border"}`} />
                                                    )}
                                                </div>
                                                <div className="pb-7 pt-1.5 flex-1 min-w-0">
                                                    <p className={`text-sm font-black transition-colors ${isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground/60"}`}>
                                                        {step.label}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground">{step.description}</p>

                                                    {/* Barre de progression + message live, seulement sur l'étape active */}
                                                    {isActive && currentEvent && (
                                                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-2 space-y-1.5">
                                                            <p className="text-xs text-foreground/80 font-medium truncate">{currentEvent.message}</p>
                                                            {typeof currentEvent.current === "number" && typeof currentEvent.total === "number" && currentEvent.total > 0 && (
                                                                <div className="h-1.5 w-full max-w-[220px] bg-muted rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        className="h-full bg-primary rounded-full"
                                                                        animate={{ width: `${Math.min(100, (currentEvent.current / currentEvent.total) * 100)}%` }}
                                                                        transition={{ ease: "easeOut", duration: 0.4 }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Journal défilant */}
                                <div className="rounded-2xl bg-muted/30 border border-border/50 p-3 max-h-32 overflow-y-auto space-y-1">
                                    {log.slice(-6).map((evt, i) => (
                                        <p key={i} className="text-[11px] text-muted-foreground font-mono truncate">
                                            <span className="text-primary">›</span> {evt.message}
                                        </p>
                                    ))}
                                    <div ref={logEndRef} />
                                </div>
                            </motion.div>
                        )}

                        {/* ══ SUCCÈS ══ */}
                        {phase === "done" && result && (
                            <motion.div
                                key="done"
                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="p-6 md:p-8 space-y-6 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto"
                                >
                                    <Icon icon="solar:check-circle-bold-duotone" className="w-12 h-12" />
                                </motion.div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">Boutique importée !</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {result.vendorCreated
                                            ? "Votre compte a été créé — vos identifiants vous ont été envoyés sur WhatsApp."
                                            : "Les produits ont été ajoutés à votre compte existant."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="p-3 rounded-2xl bg-muted/40">
                                        <p className="text-2xl font-black text-foreground">{result.totalFetched}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Trouvés</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-emerald-500/10">
                                        <p className="text-2xl font-black text-emerald-600">{result.totalImported}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Importés</p>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-amber-500/10">
                                        <p className="text-2xl font-black text-amber-600">{result.totalSkipped}</p>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Ignorés</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={resetToForm}
                                        className="flex-1 py-3 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:bg-muted transition-all"
                                    >
                                        Nouvel import
                                    </button>
                                    <a
                                        href="/login"
                                        className="flex-1 py-3 rounded-xl bg-primary hover:bg-secondary text-white text-sm font-black transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        <Icon icon="solar:login-3-bold-duotone" className="w-4 h-4" />
                                        Me connecter
                                    </a>
                                </div>
                            </motion.div>
                        )}

                        {/* ══ ERREUR ══ */}
                        {phase === "error" && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                                className="p-6 md:p-8 space-y-6 text-center"
                            >
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 text-red-500 mx-auto">
                                    <Icon icon="solar:danger-triangle-bold-duotone" className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-foreground">L&apos;import a échoué</h2>
                                    <p className="text-sm text-muted-foreground mt-1 break-words">{errorMessage}</p>
                                </div>
                                <button
                                    onClick={resetToForm}
                                    className="w-full py-3.5 bg-primary hover:bg-secondary text-white text-sm font-black rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <Icon icon="solar:restart-bold-duotone" className="w-4 h-4" />
                                    Réessayer
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
