"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { CategoryProd } from "@/types/interface";

interface CategoryProductFormProps {
    initialData?: CategoryProd;
    onSubmit: (data: { name: string }) => void | Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function CategoryProductForm({
    initialData,
    onSubmit,
    isSubmitting,
    isEditing = false,
    onClose,
}: CategoryProductFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 2) {
            setError("Le nom doit contenir au moins 2 caractères");
            return;
        }
        setError("");
        await onSubmit({ name: name.trim() });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs font-bold">Nom de la catégorie *</label>
                <input
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                    placeholder="ex: Électronique, Vêtements..."
                    autoFocus
                />
                {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2"
                >
                    {isSubmitting
                        ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                        : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    }
                    {isEditing ? "Mettre à jour" : "Créer la catégorie"}
                </button>
            </div>
        </form>
    );
}
