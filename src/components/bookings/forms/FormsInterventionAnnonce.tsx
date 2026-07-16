"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useTranslation } from "@/utils/langue/hooks";

// On conserve les mêmes valeurs internes que le formulaire Services
// pour rester compatible avec le backend (interventionType URGENCE|RDV),
// mais l'UI n'expose que deux modes : « Aujourd'hui » et « Sur rendez-vous ».
export type InterventionType = "urgence" | "rdv" | null;

interface FormsInterventionAnnonceProps {
    onSelectionChange?: (selectedType: InterventionType) => void;
    initialValue?: InterventionType;
}

export default function FormsInterventionAnnonce({
    onSelectionChange,
    initialValue = null,
}: FormsInterventionAnnonceProps) {
    const { t } = useTranslation();
    const [selectedType, setSelectedType] = useState<InterventionType>(initialValue);

    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedType);
        }
    }, [selectedType, onSelectionChange]);

    const handleSelect = (type: InterventionType) => {
        setSelectedType(type);
    };

    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="mb-2">
                <h3 className="text-sm font-bold text-foreground border-l-4 border-primary pl-3">
                    {t("akwaba.bookings.intervention_form_annonce.title")} <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 pl-4 uppercase tracking-wider font-bold">
                    {t("akwaba.bookings.intervention_form_annonce.subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Option Aujourd'hui */}
                <div
                    className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200 min-h-[90px] flex flex-col justify-between ${selectedType === "urgence" ? "border-primary bg-primary/10 shadow-md transform scale-[1.02]" : "border-border bg-card hover:border-primary/40 hover:bg-muted"}`}
                    onClick={() => handleSelect("urgence")}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedType === "urgence" ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                                    {selectedType === "urgence" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                                <Icon icon="solar:calendar-mark-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                            </div>
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                {t("akwaba.bookings.intervention_form_annonce.today_badge")}
                            </span>
                        </div>

                        <h4 className="text-sm font-black text-foreground mb-0.5">
                            {t("akwaba.bookings.intervention_form_annonce.today_title")}
                        </h4>

                        <p className="text-[10px] text-muted-foreground font-medium leading-tight mb-2">
                            {t("akwaba.bookings.intervention_form_annonce.today_desc")}
                        </p>

                        <div className="flex items-center gap-1 mt-auto">
                            <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary">{t("akwaba.bookings.intervention_form_annonce.today_note")}</span>
                        </div>
                    </div>
                </div>

                {/* Option Sur rendez-vous */}
                <div
                    className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200 min-h-[90px] flex flex-col justify-between ${selectedType === "rdv" ? "border-secondary bg-secondary/10 shadow-md transform scale-[1.02]" : "border-border bg-card hover:border-secondary/40 hover:bg-muted"}`}
                    onClick={() => handleSelect("rdv")}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedType === "rdv" ? "border-secondary bg-secondary" : "border-muted-foreground/30"}`}>
                                    {selectedType === "rdv" && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                </div>
                                <Icon icon="solar:clock-circle-bold-duotone" className="w-4 h-4 text-secondary flex-shrink-0" />
                            </div>
                            <span className="text-[9px] font-black bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                {t("akwaba.bookings.intervention_form_annonce.rdv_badge")}
                            </span>
                        </div>

                        <h4 className="text-sm font-black text-foreground mb-0.5">
                            {t("akwaba.bookings.intervention_form_annonce.rdv_title")}
                        </h4>

                        <p className="text-[10px] text-muted-foreground font-medium leading-tight mb-2">
                            {t("akwaba.bookings.intervention_form_annonce.rdv_desc")}
                        </p>

                        <div className="flex items-center gap-1 mt-auto">
                            <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] font-bold text-secondary italic">{t("akwaba.bookings.intervention_form_annonce.rdv_note")}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
