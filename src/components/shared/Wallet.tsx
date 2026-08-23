"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/MotionModal";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/NotificationProvider";

interface WalletProps {
    isOpen: boolean;
    onClose: () => void;
}

// Opérateurs — logo réel uniquement pour Orange (seul disponible dans le set d'icônes),
// icônes Solar génériques mais distinctes pour les autres (Wave/MTN/Moov absents du set).
const OPERATORS = [
    { id: "wave", name: "Wave", icon: "solar:card-recive-bold-duotone", color: "bg-[#1ca9e1]" },
    { id: "orange", name: "Orange Money", icon: "simple-icons:orange", color: "bg-[#ff7900]" },
    { id: "mtn", name: "MTN Money", icon: "solar:smartphone-2-bold-duotone", color: "bg-[#ffcc00]" },
    { id: "moov", name: "Moov Money", icon: "solar:wallet-2-bold-duotone", color: "bg-[#007a33]" },
];

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

/**
 * Portefeuille — composant partagé (DashMenu.tsx, Sidebar.tsx, ...). UI complète (solde,
 * historique, formulaire de recharge) mais sans branchement API pour l'instant : aucune
 * action réelle n'est effectuée tant que le backend "wallet" n'est pas disponible.
 */
export default function Wallet({ isOpen, onClose }: WalletProps) {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<"transactions" | "recharger">("transactions");
    const [amount, setAmount] = useState("");
    const [selectedOperator, setSelectedOperator] = useState<string>("");

    // Placeholders — remplacés par les vraies données dès que l'API wallet existera.
    const balance = 0;
    const pending = 0;

    const handleRecharge = () => {
        addNotification("Recharge du portefeuille : bientôt disponible", "info");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mon Portefeuille">
            <div className="p-5 space-y-6">
                {/* Carte solde — même dégradé que la carte gains de DashMenu.tsx, pour l'uniformité */}
                <div className="relative rounded-3xl bg-gradient-to-br from-[#092E40] to-secondary p-5 shadow-lg shadow-secondary/20 overflow-hidden">
                    <Icon icon="solar:wallet-bold-duotone" className="absolute -bottom-4 -right-4 w-28 h-28 text-white/5" />

                    <div className="flex items-center gap-1.5 text-white/70 text-[11px] font-bold uppercase tracking-wide mb-4">
                        <Icon icon="solar:wallet-bold-duotone" width={15} />
                        Mon Portefeuille
                    </div>

                    <p className="text-white/70 text-xs font-semibold mb-1">Solde disponible</p>
                    <p className="text-3xl font-black text-white tabular-nums mb-4">
                        {balance.toLocaleString()} F CFA
                    </p>

                    <div className="h-px bg-white/15 mb-4" />

                    <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-white/70 text-xs font-semibold">
                            <Icon icon="solar:hourglass-line-bold-duotone" width={16} />
                            En attente de validation
                        </span>
                        <span className="text-white font-bold text-sm tabular-nums">
                            {pending.toLocaleString()} F CFA
                        </span>
                    </div>
                </div>

                {/* Bascule Transactions / Recharger */}
                <div className="flex gap-2 p-1 bg-muted rounded-2xl">
                    <button
                        onClick={() => setActiveTab("transactions")}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "transactions" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Transactions
                    </button>
                    <button
                        onClick={() => setActiveTab("recharger")}
                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "recharger" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        Recharger
                    </button>
                </div>

                {activeTab === "transactions" ? (
                        <motion.div
                            key="transactions"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                <Icon icon="solar:bill-list-bold-duotone" width={28} className="text-muted-foreground" />
                            </div>
                            <p className="font-bold text-foreground">Aucune transaction</p>
                            <p className="text-xs text-muted-foreground">Vos transactions apparaîtront ici</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="recharger"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-5"
                        >
                            {/* Montant */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                    Montant
                                </label>
                                <div className="relative mb-3">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-2xl px-4 py-4 text-2xl font-black text-center focus:ring-1 focus:ring-primary outline-none"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                                        FCFA
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_AMOUNTS.map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setAmount(String(v))}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${amount === String(v) ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}
                                        >
                                            {v.toLocaleString()} F
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Opérateur */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                    Moyen de paiement
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {OPERATORS.map((op) => (
                                        <button
                                            key={op.id}
                                            onClick={() => setSelectedOperator(op.id)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${selectedOperator === op.id ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card"}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${op.color}`}>
                                                <Icon icon={op.icon} className="w-4 h-4" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase text-center">{op.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleRecharge}
                                disabled={!amount || !selectedOperator}
                                className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                            >
                                {amount ? `Recharger ${Number(amount).toLocaleString()} F` : "Recharger"}
                            </Button>
                        </motion.div>
                )}
            </div>
        </Modal>
    );
}
