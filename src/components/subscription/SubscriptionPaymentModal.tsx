"use client";

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '../modal/MotionModal';
import { SubscriptionPlan, PaymentMethod as PaymentMethodEnum } from '@/types/interface';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { subscribeToPlan, uploadSubscriptionProof } from '@/api/api';
import { toast } from 'sonner';

interface SubscriptionPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    plan: SubscriptionPlan | null;
}

type PaymentMethod = 'card' | 'mobile' | 'admin';

export default function SubscriptionPaymentModal({ isOpen, onClose, plan }: SubscriptionPaymentModalProps) {
    const [activeTab, setActiveTab] = useState<PaymentMethod>('card');
    const [selectedOperator, setSelectedOperator] = useState<string>('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvv: '' });
    const [proof, setProof] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!plan) return null;

    const operators = [
        { id: 'wave', name: 'Wave', icon: 'simple-icons:wave', color: 'bg-[#1ca9e1]' },
        { id: 'orange', name: 'Orange Money', icon: 'simple-icons:orange', color: 'bg-[#ff7900]' },
        { id: 'mtn', name: 'MTN Money', icon: 'simple-icons:mtn', color: 'bg-[#ffcc00]' },
        { id: 'moov', name: 'Moov Money', icon: 'simple-icons:moov', color: 'bg-[#007a33]' },
    ];

    const getHelpMessage = () => {
        switch (activeTab) {
            case 'card': return "Veuillez entrer vos informations de carte pour effectuer le paiement sécurisé.";
            case 'mobile': return "Sélectionnez votre opérateur et saisissez votre numéro pour recevoir une demande de paiement.";
            case 'admin': return "Effectuez le paiement sur le numéro ci-dessous, puis ajoutez une preuve de transaction pour validation.";
            default: return "";
        }
    };

    const isFormValid = () => {
        if (loading) return false;
        if (activeTab === 'card') {
            return cardData.number && cardData.name && cardData.expiry && cardData.cvv;
        }
        if (activeTab === 'mobile') {
            return selectedOperator && phoneNumber.length >= 8;
        }
        if (activeTab === 'admin') {
            return !!proof;
        }
        return false;
    };

    const handlePayment = async () => {
        if (!plan) return;
        setLoading(true);

        try {

            let proofUrl = '';

            if (activeTab === 'admin' && proof) {
                const uploadRes = await uploadSubscriptionProof(proof);
                if (uploadRes.statusCode === 200 && uploadRes.data?.url) {
                    proofUrl = uploadRes.data.url;
                } else {
                    throw new Error('Erreur lors de l\'upload de la preuve');
                }
            }

            const paymentMethodMap: Record<PaymentMethod, PaymentMethodEnum> = {
                card: PaymentMethodEnum.CARD,
                mobile: PaymentMethodEnum.MOBILE_MONEY,
                admin: PaymentMethodEnum.ADMIN
            };

            const response = await subscribeToPlan({
                planId: plan.id,
                paymentMethod: paymentMethodMap[activeTab],
                paymentProof: proofUrl || undefined
            });

            if (response.statusCode === 201) {
                setSuccess(true);
                toast.success('Paiement initié avec succès !');
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setLoading(false);
                }, 3000);
            } else {
                toast.error(response.message || 'Une erreur est survenue');
                setLoading(false);
            }
        } catch (error: any) {
            toast.error(error.message || 'Une erreur est survenue lors du paiement');
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col h-full bg-background overflow-hidden ">
                {/* Header: Plan Summary */}
                <div className="p-6 bg-muted/30 border-b border-border space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black text-foreground">Détails du Plan</h2>
                            <p className="text-muted-foreground text-sm font-medium">Récapitulatif de votre sélection</p>
                        </div>
                        <Badge variant="default" className="px-3 py-1 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                            {plan.name}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Prix & Durée</p>
                            <p className="font-black text-lg">{plan.price} CFA <span className="text-xs text-muted-foreground font-bold">/ {plan.durationDays} jours</span></p>
                        </div>
                        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Limites</p>
                            <p className="font-black text-lg">{plan.serviceLimit === 999999 ? 'ILIMITÉ' : `${plan.serviceLimit} unités`}</p>
                        </div>
                    </div>
                </div>

                {/* Body: Payment Tabs */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
                                <Icon icon="solar:check-read-bold-duotone" className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-black text-foreground">Félicitations !</h3>
                            <p className="text-center text-muted-foreground font-medium max-w-xs">
                                {activeTab === 'admin'
                                    ? "Votre demande a été envoyée. Un administrateur validera votre paiement sous peu."
                                    : "Votre abonnement est maintenant actif. Profitez de vos nouveaux avantages !"}
                            </p>
                        </div>
                    ) : (
                        <div>
                            {/* ... (existing tabs logic) ... */}
                            <h3 className="text-lg font-black mb-1">Moyen de Paiement</h3>
                            <p className="text-muted-foreground text-xs font-medium mb-4">Choisissez la méthode qui vous convient le mieux</p>

                            {/* Tab Switcher */}
                            <div className="flex gap-2 p-1 bg-muted rounded-2xl mb-6">
                                {(['card', 'mobile', 'admin'] as PaymentMethod[]).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => !loading && setActiveTab(tab)}
                                        className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        {tab === 'card' && 'Carte'}
                                        {tab === 'mobile' && 'Mobile Money'}
                                        {tab === 'admin' && 'Admin'}
                                    </button>
                                ))}
                            </div>

                            {/* Help Alert */}
                            <div className="bg-primary/5 border border-primary/10 p-4 rounded-2xl flex items-start gap-3 mb-6">
                                <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-primary mt-0.5" />
                                <p className="text-[11px] font-semibold text-primary/80 leading-relaxed uppercase tracking-wider">{getHelpMessage()}</p>
                            </div>

                            {/* Tab Content */}
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                {activeTab === 'card' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de Carte</label>
                                            <div className="relative">
                                                <input
                                                    type="text" placeholder="0000 0000 0000 0000"
                                                    value={cardData.number}
                                                    onChange={e => setCardData({ ...cardData, number: e.target.value })}
                                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                />
                                                <Icon icon="solar:card-2-bold-duotone" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Titulaire</label>
                                            <input
                                                type="text" placeholder="JEAN DUPONT"
                                                value={cardData.name}
                                                onChange={e => setCardData({ ...cardData, name: e.target.value })}
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiration</label>
                                                <input
                                                    type="text" placeholder="MM/YY"
                                                    value={cardData.expiry}
                                                    onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CVV</label>
                                                <input
                                                    type="text" placeholder="123"
                                                    value={cardData.cvv}
                                                    onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'mobile' && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-4 gap-2">
                                            {operators.map((op) => (
                                                <button
                                                    key={op.id}
                                                    onClick={() => setSelectedOperator(op.id)}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${selectedOperator === op.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-border bg-card'
                                                        }`}
                                                >
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${op.color}`}>
                                                        <Icon icon={op.icon} className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[8px] font-black uppercase text-center">{op.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de Téléphone</label>
                                            <div className="relative">
                                                <input
                                                    type="tel" placeholder="01 02 03 04 05"
                                                    value={phoneNumber}
                                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                                />
                                                <Icon icon="solar:phone-bold-duotone" className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'admin' && (
                                    <div className="space-y-6">
                                        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Numéro Admin</p>
                                                <p className="text-3xl font-black text-amber-700 font-mono tracking-tighter">+225 0102030405</p>
                                            </div>
                                            <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-transform"
                                                onClick={() => {
                                                    navigator.clipboard.writeText('+225 0102030405');
                                                    toast.success('Numéro copié !');
                                                }}>
                                                <Icon icon="solar:copy-bold-duotone" className="w-6 h-6" />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Preuve de Paiement</label>
                                            <div className="relative group">
                                                <input
                                                    type="file"
                                                    onChange={(e) => setProof(e.target.files?.[0] || null)}
                                                    className="hidden" id="proof-upload"
                                                />
                                                <label htmlFor="proof-upload" className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                                    <div className="p-3 bg-muted group-hover:bg-primary/10 rounded-2xl transition-colors mb-4">
                                                        <Icon icon="solar:cloud-upload-bold-duotone" className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                    <p className="text-xs font-black uppercase tracking-widest max-w-[200px] truncate">{proof ? proof.name : 'Choisir une image'}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-2 font-medium">PNG, JPG ou PDF jusqu'à 5MB</p>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer: Actions */}
                {!success && (
                    <div className="p-6 bg-muted/20 border-t border-border flex flex-col md:flex-row gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handlePayment}
                            disabled={!isFormValid()}
                            className="flex-1 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 relative"
                        >
                            {loading ? (
                                <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                            ) : (
                                'Confirmer le Paiement'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
