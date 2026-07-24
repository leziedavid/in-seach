"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { DeliveryInfo } from "@/hooks/useDeliveryInfo";

interface DeliveryAddressFieldsProps {
    form: Partial<DeliveryInfo>;
    onChange: (key: keyof DeliveryInfo, value: any) => void;
}

/**
 * Champs de coordonnées de livraison (nom, téléphone, adresse, ville/commune, repère,
 * instructions) — extraits de DeliveryInfoModal pour être réutilisés tels quels par
 * d'autres flux (ex: demande de devis Fournisseur) sans dupliquer le JSX.
 */
export default function DeliveryAddressFields({ form, onChange }: DeliveryAddressFieldsProps) {
    return (
        <>
            {/* Nom du destinataire */}
            <div>
                <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                    Nom complet du destinataire <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Icon icon="solar:user-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={form.fullName ?? ""}
                        onChange={e => onChange("fullName", e.target.value)}
                        placeholder="Ex: Kouamé Jean-Pierre"
                        className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Téléphone livraison */}
            <div>
                <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                    Numéro de téléphone pour la livraison <span className="text-red-500">*</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-border bg-muted/30 cursor-pointer mb-2">
                    <div
                        onClick={() => onChange("usePersonalPhone", !form.usePersonalPhone)}
                        className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${form.usePersonalPhone ? "bg-primary" : "bg-muted-foreground/30"}`}
                    >
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.usePersonalPhone ? "translate-x-5" : "translate-x-0.5"}`} />
                    </div>
                    <span className="text-xs font-bold">Utiliser mon numéro de connexion</span>
                </label>
                {!form.usePersonalPhone && (
                    <div className="relative">
                        <Icon icon="solar:phone-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="tel"
                            value={form.deliveryPhone ?? ""}
                            onChange={e => onChange("deliveryPhone", e.target.value)}
                            placeholder="Ex: +225 07 00 00 00 00"
                            className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                        />
                    </div>
                )}
            </div>

            {/* Adresse */}
            <div>
                <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                    Adresse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Icon icon="solar:map-point-bold-duotone" width={16} className="absolute left-3 top-3.5 text-muted-foreground" />
                    <textarea
                        value={form.address ?? ""}
                        onChange={e => onChange("address", e.target.value)}
                        placeholder="Ex: Rue des Jardins, Imm. Soleil, Apt. 4B"
                        rows={2}
                        className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                    />
                </div>
            </div>

            {/* Ville + Commune */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                        Ville <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={form.city ?? ""}
                        onChange={e => onChange("city", e.target.value)}
                        placeholder="Ex: Abidjan"
                        className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                </div>
                <div>
                    <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                        Commune / Quartier
                    </label>
                    <input
                        type="text"
                        value={form.district ?? ""}
                        onChange={e => onChange("district", e.target.value)}
                        placeholder="Ex: Cocody"
                        className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Repère */}
            <div>
                <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                    Repère (optionnel)
                </label>
                <div className="relative">
                    <Icon icon="solar:flag-bold-duotone" width={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={form.landmark ?? ""}
                        onChange={e => onChange("landmark", e.target.value)}
                        placeholder="Ex: Près de la pharmacie Sainte-Marie"
                        className="w-full pl-9 pr-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Instructions */}
            <div>
                <label className="text-[11px] font-black uppercase text-muted-foreground mb-1.5 block">
                    Instructions supplémentaires (optionnel)
                </label>
                <textarea
                    value={form.instructions ?? ""}
                    onChange={e => onChange("instructions", e.target.value)}
                    placeholder="Ex: Appeler avant de venir, interphone cassé..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                />
            </div>
        </>
    );
}
