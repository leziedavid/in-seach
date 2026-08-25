"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/MotionModal";
import { Button } from "@/components/ui/button";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { getMyWallet, getWalletHistory, rechargeWallet, uploadWalletRechargeProof } from "@/api/wallet-api";
import { WalletPaymentMethod, WalletTransaction } from "@/types/interface";

interface WalletProps {
    isOpen: boolean;
    onClose: () => void;
    /** Permet aux flux de paiement (modales produit/service/annonce/abonnement) d'ouvrir
     * directement l'onglet "Recharger" quand le solde est insuffisant. */
    initialTab?: "transactions" | "recharger";
}

// Opérateurs — logo réel uniquement pour Orange (seul disponible dans le set d'icônes),
// icônes Solar génériques mais distinctes pour les autres (Wave/MTN/Moov absents du set).
const OPERATORS: { id: WalletPaymentMethod; name: string; icon: string; color: string }[] = [
    { id: "WAVE", name: "Wave", icon: "solar:card-recive-bold-duotone", color: "bg-[#1ca9e1]" },
    { id: "ORANGE", name: "Orange Money", icon: "simple-icons:orange", color: "bg-[#ff7900]" },
    { id: "MTN", name: "MTN Money", icon: "solar:smartphone-2-bold-duotone", color: "bg-[#ffcc00]" },
    { id: "MOOV", name: "Moov Money", icon: "solar:wallet-2-bold-duotone", color: "bg-[#007a33]" },
];

const QUICK_AMOUNTS = [1000, 2500, 5000, 10000, 25000];

const TRANSACTION_LABELS: Record<string, string> = {
    WALLET_CREATED: "Création du Wallet",
    WELCOME_BONUS: "Offre de bienvenue",
    RECHARGE: "Recharge",
    ORDER_PAYMENT: "Achat produit",
    SERVICE_PAYMENT: "Paiement service",
    BOOST_PAYMENT: "Boost / mise en avant",
    SUBSCRIPTION_PAYMENT: "Abonnement",
    REFUND: "Remboursement",
    ADMIN_ADJUSTMENT: "Ajustement admin",
    OTHER: "Autre opération",
};

/**
 * Portefeuille — composant partagé (DashMenu.tsx, Sidebar.tsx, ...). Solde, historique et
 * recharge branchés sur l'API Wallet réelle (voir src/api/wallet-api.ts).
 */
export default function Wallet({ isOpen, onClose, initialTab = "transactions" }: WalletProps) {
    const { addNotification } = useNotification();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"transactions" | "recharger">(initialTab);
    const [amount, setAmount] = useState("");
    const [selectedOperator, setSelectedOperator] = useState<WalletPaymentMethod | "">("");
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) setActiveTab(initialTab);
    }, [isOpen, initialTab]);

    const { data: walletRes } = useQuery({
        queryKey: ["wallet"],
        queryFn: getMyWallet,
        enabled: isOpen,
    });
    const wallet = walletRes?.statusCode === 200 ? walletRes.data : undefined;
    const balance = wallet?.balance ?? 0;
    const pending = wallet?.pendingBalance ?? 0;

    const { data: historyRes, isLoading: historyLoading } = useQuery({
        queryKey: ["wallet-history"],
        queryFn: () => getWalletHistory({ page: 1, limit: 30 }),
        enabled: isOpen && activeTab === "transactions",
    });
    const transactions: WalletTransaction[] = historyRes?.statusCode === 200 ? historyRes.data?.data ?? [] : [];

    const handleRecharge = async () => {
        if (!amount || !selectedOperator || submitting) return;
        setSubmitting(true);
        try {
            let proofUrl: string | undefined;
            let fileId: string | undefined;
            if (proofFile) {
                const uploadRes = await uploadWalletRechargeProof(proofFile);
                if (uploadRes.statusCode === 200 && uploadRes.data) {
                    proofUrl = uploadRes.data.url;
                    fileId = uploadRes.data.fileId;
                } else {
                    addNotification(uploadRes.message || "Erreur lors de l'upload de la preuve", "error");
                    return;
                }
            }

            const res = await rechargeWallet({
                amount: Number(amount),
                paymentMethod: selectedOperator,
                proofUrl,
                fileId,
            });

            if (res.statusCode === 201 || res.statusCode === 200) {
                addNotification("Recharge soumise, en attente de validation", "success");
                setAmount("");
                setSelectedOperator("");
                setProofFile(null);
                setActiveTab("transactions");
                queryClient.invalidateQueries({ queryKey: ["wallet"] });
                queryClient.invalidateQueries({ queryKey: ["wallet-history"] });
            } else {
                addNotification(res.message || "Erreur lors de la recharge", "error");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mon Portefeuille">
            <div className="p-5 space-y-6">
                {/* Bannière offre de bienvenue — pilotée uniquement par le backend
                    (wallet.welcomeBonusVisible), jamais par un état local : elle disparaît
                    définitivement dès la première recharge validée, sur tous les appareils. */}
                {wallet?.welcomeBonusVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3"
                    >
                        <Icon icon="solar:gift-bold-duotone" width={24} className="text-primary shrink-0" />
                        <p className="text-xs font-bold text-foreground leading-snug">
                            Bienvenue ! La plateforme vous offre 1000 FCFA.
                        </p>
                    </motion.div>
                )}

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
                        >
                            {historyLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Icon icon="line-md:loading-twotone-loop" width={28} className="text-muted-foreground" />
                                </div>
                            ) : transactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                                        <Icon icon="solar:bill-list-bold-duotone" width={28} className="text-muted-foreground" />
                                    </div>
                                    <p className="font-bold text-foreground">Aucune transaction</p>
                                    <p className="text-xs text-muted-foreground">Vos transactions apparaîtront ici</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => {
                                        const isCredit = tx.direction === "CREDIT";
                                        const isPending = tx.status === "WAITING_VALIDATION" || tx.status === "PENDING";
                                        const isRejected = tx.status === "REJECTED";
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCredit ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                                                        <Icon icon={isCredit ? "solar:arrow-down-bold-duotone" : "solar:arrow-up-bold-duotone"} width={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground truncate">
                                                            {TRANSACTION_LABELS[tx.type] ?? tx.type}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {new Date(tx.createdAt).toLocaleDateString()}
                                                            {isPending && " · En attente"}
                                                            {isRejected && " · Rejetée"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`text-sm font-black tabular-nums shrink-0 ${isCredit ? "text-green-600" : "text-red-600"}`}>
                                                    {isCredit ? "+" : "-"}{tx.amount.toLocaleString()} F
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
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

                            {/* Preuve de paiement (optionnelle — accélère la validation admin) */}
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                    Preuve de paiement (optionnel)
                                </label>
                                <label className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-xs font-bold text-muted-foreground cursor-pointer hover:border-primary/40">
                                    <Icon icon="solar:gallery-add-bold-duotone" width={18} />
                                    {proofFile ? proofFile.name : "Ajouter une capture d'écran"}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                                    />
                                </label>
                            </div>

                            <Button
                                onClick={handleRecharge}
                                disabled={!amount || !selectedOperator || submitting}
                                className="w-full py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20"
                            >
                                {submitting ? "Envoi..." : amount ? `Recharger ${Number(amount).toLocaleString()} F` : "Recharger"}
                            </Button>
                        </motion.div>
                )}
            </div>
        </Modal>
    );
}
