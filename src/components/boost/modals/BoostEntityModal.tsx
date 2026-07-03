"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/MotionModal";
import { useBoost } from "@/hooks/useBoost";
import { BoostEntityType, BoostPaymentMethod, BoostPricingOption } from "@/types/interface";
import { toast } from "sonner";

interface BoostEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityType: BoostEntityType;
    entityId: string;
    entityName?: string;
    onSuccess?: () => void;
}

type PaymentTab = "proof" | "mobile" | "card";

const ENTITY_LABELS: Record<BoostEntityType, string> = {
    PRODUCT: "Produit",
    SERVICE: "Service",
    ANNONCE: "Annonce",
    LOGISTIC_SERVICE: "Service logistique",
};

const OPERATORS = [
    { id: "ORANGE_MONEY" as BoostPaymentMethod, name: "Orange Money", icon: "simple-icons:orange", color: "bg-[#ff7900]" },
    { id: "MTN_MONEY"    as BoostPaymentMethod, name: "MTN Money",    icon: "simple-icons:mtn",    color: "bg-[#ffcc00]" },
    { id: "WAVE"         as BoostPaymentMethod, name: "Wave",         icon: "simple-icons:wave",   color: "bg-[#1ca9e1]" },
];

export default function BoostEntityModal({
    isOpen, onClose, entityType, entityId, entityName, onSuccess,
}: BoostEntityModalProps) {
    const { pricing, creating, uploading, fetchPricing, uploadProof, boost } = useBoost();

    const [step, setStep] = useState<"duration" | "payment" | "success">("duration");
    const [selectedOption, setSelectedOption] = useState<BoostPricingOption | null>(null);
    const [paymentTab, setPaymentTab] = useState<PaymentTab>("proof");
    const [selectedOperator, setSelectedOperator] = useState<BoostPaymentMethod | null>(null);
    const [proof, setProof] = useState<File | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPricing();
            setStep("duration");
            setSelectedOption(null);
            setProof(null);
        }
    }, [isOpen]);

    const isFormValid = () => {
        if (!selectedOption) return false;
        if (paymentTab === "proof") return !!proof;
        if (paymentTab === "mobile") return !!selectedOperator;
        return false;
    };

    const handleSubmit = async () => {
        if (!selectedOption) return;

        let proofUrl: string | undefined;

        if (paymentTab === "proof" && proof) {
            const url = await uploadProof(proof);
            if (!url) { toast.error("Erreur lors de l'upload de la preuve"); return; }
            proofUrl = url;
        }

        const method: BoostPaymentMethod = paymentTab === "proof"
            ? "PAYMENT_PROOF"
            : (selectedOperator ?? "ORANGE_MONEY");

        const ok = await boost({
            entityType,
            entityId,
            durationDays: selectedOption.days,
            paymentMethod: method,
            proofUrl,
        });

        if (ok) {
            setStep("success");
            onSuccess?.();
        } else {
            toast.error("Une erreur est survenue. Veuillez réessayer.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col h-full bg-background overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:rocket-bold-duotone" className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black">Booster ce {ENTITY_LABELS[entityType]}</h2>
                            {entityName && <p className="text-xs text-muted-foreground font-medium truncate max-w-[240px]">{entityName}</p>}
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Mettez votre contenu en avant et obtenez une visibilité maximale auprès de votre audience.
                    </p>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === "success" ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in zoom-in duration-500 py-12">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                <Icon icon="solar:rocket-bold-duotone" className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-black">Demande envoyée !</h3>
                            <p className="text-center text-muted-foreground font-medium max-w-xs text-sm">
                                Votre demande de boost a été enregistrée. Notre équipe va valider votre paiement et activer votre boost dans les plus brefs délais.
                            </p>
                            <button onClick={onClose} className="mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm active:scale-95 transition-all">
                                Fermer
                            </button>
                        </div>
                    ) : step === "duration" ? (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider mb-1">Choisir la durée</h3>
                                <p className="text-xs text-muted-foreground mb-4">Plus la durée est longue, plus le coût journalier est réduit.</p>
                            </div>

                            {!pricing ? (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="h-20 bg-muted/40 rounded-2xl animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {pricing.options.map((opt) => (
                                        <button
                                            key={opt.days}
                                            onClick={() => setSelectedOption(opt)}
                                            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${selectedOption?.days === opt.days ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40"}`}
                                        >
                                            <div className="text-left">
                                                <p className="font-black text-base">{opt.days} jours</p>
                                                <p className="text-xs text-muted-foreground">{opt.pricePerDay.toLocaleString()} {pricing.currency}/jour</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-primary">{opt.total.toLocaleString()}</p>
                                                <p className="text-[10px] font-black uppercase text-muted-foreground">{pricing.currency}</p>
                                            </div>
                                        </button>
                                    ))}

                                    {/* Durée personnalisée (future) */}
                                    <button
                                        disabled
                                        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-border opacity-50 cursor-not-allowed"
                                    >
                                        <div className="text-left">
                                            <p className="font-black text-sm">Durée personnalisée</p>
                                            <p className="text-xs text-muted-foreground">Bientôt disponible</p>
                                        </div>
                                        <Icon icon="solar:lock-bold-duotone" className="w-5 h-5 text-muted-foreground" />
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* step === "payment" */
                        (<div className="space-y-6">
                            {/* Récap */}
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Durée sélectionnée</p>
                                    <p className="font-black">{selectedOption?.days} jours</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total</p>
                                    <p className="text-xl font-black text-primary">{selectedOption?.total.toLocaleString()} {pricing?.currency}</p>
                                </div>
                            </div>
                            {/* Tabs paiement */}
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider mb-3">Moyen de paiement</h3>
                                <div className="flex gap-2 p-1 bg-muted rounded-2xl mb-4">
                                    {([
                                        { id: "proof" as PaymentTab, label: "Preuve", available: true },
                                        { id: "mobile" as PaymentTab, label: "Mobile Money", available: true },
                                        { id: "card" as PaymentTab, label: "Carte", available: false },
                                    ]).map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => tab.available && setPaymentTab(tab.id)}
                                            disabled={!tab.available}
                                            className={`flex-1 py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!tab.available ? "opacity-40 cursor-not-allowed text-muted-foreground" : paymentTab === tab.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                        >
                                            {tab.label}
                                            {!tab.available && <span className="block text-[8px] normal-case tracking-normal">Bientôt</span>}
                                        </button>
                                    ))}
                                </div>

                                {paymentTab === "proof" && (
                                    <div className="space-y-4">
                                        <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-amber-600 mb-1">Numéro de paiement</p>
                                                <p className="text-2xl font-black text-amber-700 font-mono">+225 0153686819</p>
                                            </div>
                                            <button
                                                onClick={() => { navigator.clipboard.writeText("+225 0153686819"); toast.success("Numéro copié !"); }}
                                                className="bg-amber-500 text-white p-3 rounded-xl active:scale-95 transition-transform"
                                            >
                                                <Icon icon="solar:copy-bold-duotone" className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1.5">Preuve de paiement *</label>
                                            <input type="file" accept="image/*,.pdf" onChange={e => setProof(e.target.files?.[0] ?? null)} className="hidden" id="boost-proof" />
                                            <label htmlFor="boost-proof" className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                                <Icon icon="solar:cloud-upload-bold-duotone" className="w-8 h-8 text-muted-foreground mb-2" />
                                                <p className="text-xs font-black max-w-[200px] truncate">{proof ? proof.name : "Choisir une image ou PDF"}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG ou PDF · max 5 MB</p>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {paymentTab === "mobile" && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {OPERATORS.map(op => (
                                            <button
                                                key={op.id}
                                                onClick={() => setSelectedOperator(op.id)}
                                                className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${selectedOperator === op.id ? "border-primary bg-primary/5 shadow-inner" : "border-border bg-card"}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white mb-2 ${op.color}`}>
                                                    <Icon icon={op.icon} className="w-5 h-5" />
                                                </div>
                                                <span className="text-[9px] font-black uppercase text-center leading-tight">{op.name}</span>
                                            </button>
                                        ))}
                                        <p className="col-span-3 text-[10px] text-muted-foreground text-center mt-1">
                                            Envoyez le montant sur le numéro ci-dessus avec la mention <strong>BOOST</strong>, puis uploadez votre reçu ci-dessous.
                                        </p>
                                        <div className="col-span-3">
                                            <input type="file" accept="image/*" onChange={e => setProof(e.target.files?.[0] ?? null)} className="hidden" id="boost-mobile-proof" />
                                            <label htmlFor="boost-mobile-proof" className="flex items-center gap-2 p-3 border border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                                                <Icon icon="solar:cloud-upload-bold-duotone" className="w-5 h-5 text-muted-foreground shrink-0" />
                                                <span className="text-xs font-medium truncate">{proof ? proof.name : "Joindre le reçu (optionnel)"}</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>)
                    )}
                </div>

                {/* Footer */}
                {step !== "success" && (
                    <div className="p-5 bg-muted/20 border-t border-border flex gap-3">
                        <button
                            onClick={() => step === "payment" ? setStep("duration") : onClose()}
                            className="flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-border hover:bg-muted transition-all"
                        >
                            {step === "payment" ? "Retour" : "Annuler"}
                        </button>
                        <button
                            onClick={() => step === "duration" ? setStep("payment") : handleSubmit()}
                            disabled={step === "duration" ? !selectedOption : (!isFormValid() || creating || uploading)}
                            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {(creating || uploading) ? (
                                <Icon icon="line-md:loading-twotone-loop" className="w-5 h-5" />
                            ) : step === "duration" ? (
                                <>Continuer <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-4 h-4" /></>
                            ) : (
                                "Confirmer le paiement"
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
