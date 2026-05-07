"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

export type InterventionType = "urgence" | "rdv" | null;

interface FormsInterventionProps {
    onSelectionChange?: (selectedType: InterventionType) => void;
    initialValue?: InterventionType;
}

export default function FormsIntervention({
    onSelectionChange,
    initialValue = null
}: FormsInterventionProps) {
    const [selectedType, setSelectedType] = useState<InterventionType>(initialValue);

    // Notifie le parent lorsque la sélection change
    useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedType);
        }
    }, [selectedType, onSelectionChange]);

    const handleSelect = (type: InterventionType) => {
        setSelectedType(type);
    };

    // Version compacte ultra-optimisée pour modal (mobile-first)
    return (
        <div className="space-y-4">
            {/* En-tête */}
            <div className="mb-2">
                <h3 className="text-sm font-bold text-foreground border-l-4 border-primary pl-3">
                    Type d'intervention <span className="text-red-500">*</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 pl-4 uppercase tracking-wider font-bold">
                    Sélectionnez votre priorité
                </p>
            </div>


            {/* Options côte à côte - layout optimisé pour mobile */}
            <div className="grid grid-cols-2 gap-3">
                {/* Option Urgence */}
                <div
                    className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200 min-h-[90px] flex flex-col justify-between ${selectedType === "urgence" ? "border-red-500 bg-red-500/10 shadow-md transform scale-[1.02]" : "border-border bg-card hover:border-red-500/50 hover:bg-muted"}`}
                    onClick={() => handleSelect("urgence")}
                >
                    <div className="flex flex-col h-full">
                        {/* En-tête avec icône et badge */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedType === "urgence"
                                        ? "border-red-500 bg-red-500"
                                        : "border-muted-foreground/30"
                                        }`}
                                >
                                    {selectedType === "urgence" && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <Icon icon="solar:danger-bold-duotone" className="w-4 h-4 text-red-500 flex-shrink-0" />
                            </div>
                            <span className="text-[9px] font-black bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                Direct
                            </span>
                        </div>

                        {/* Titre principal */}
                        <h4 className="text-sm font-black text-foreground mb-0.5">
                            Urgence
                        </h4>

                        {/* Description ultra-courte */}
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight mb-2">
                            Dépannage en 40 min
                        </p>

                        {/* Indicateur de confirmation */}
                        <div className="flex items-center gap-1 mt-auto">
                            <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 text-red-600" />
                            <span className="text-[10px] font-bold text-red-600">24h/24 & 7j/7</span>
                        </div>
                    </div>
                </div>


                {/* Option Rendez-vous */}
                <div className={`relative border rounded-md p-3 cursor-pointer transition-all duration-200 min-h-[90px] flex flex-col justify-between ${selectedType === "rdv" ? "border-primary bg-primary/10 shadow-md transform scale-[1.02]" : "border-border bg-card hover:border-primary/20 hover:bg-muted"}`}
                    onClick={() => handleSelect("rdv")} >
                    <div className="flex flex-col h-full">
                        {/* En-tête avec icône et badge */}
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedType === "rdv"
                                        ? "border-primary bg-primary"
                                        : "border-muted-foreground/30"
                                        }`}
                                >
                                    {selectedType === "rdv" && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                    )}
                                </div>
                                <Icon icon="solar:clock-circle-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
                            </div>
                            <span className="text-[9px] font-black bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                                Libre
                            </span>
                        </div>

                        {/* Titre principal */}
                        <h4 className="text-sm font-black text-foreground mb-0.5">
                            Rendez-vous
                        </h4>

                        {/* Description ultra-courte */}
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight mb-2">
                            Selon vos disponibilités
                        </p>

                        {/* Indicateur de confirmation */}
                        <div className="flex items-center gap-1 mt-auto">
                            <Icon icon="solar:check-circle-bold-duotone" className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-primary italic">Planifié</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Note d'information - version très compacte */}
            <div className="pt-2 border-t border-border">
                <div className="bg-amber-500/10  border-amber-500/20 rounded-md p-3">
                    <div className="flex items-start gap-2">
                        <Icon icon="solar:danger-bold-duotone" className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-[11px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-tighter mb-1">
                                Infos 0h-6h
                            </h4>
                            <p className="text-[10px] text-amber-800 dark:text-amber-200/80 leading-tight font-medium">
                                Les interventions de nuit peuvent être sujettes à des ajustements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
