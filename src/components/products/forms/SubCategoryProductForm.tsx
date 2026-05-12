"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { CategoryProd, SubCategoryProd } from "@/types/interface";
import { Switch } from "@/components/ui/switch";

interface SubCategoryProductFormProps {
    initialData?: SubCategoryProd;
    categories: CategoryProd[];
    onSubmit: (data: any) => void | Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function SubCategoryProductForm({
    initialData,
    categories,
    onSubmit,
    isSubmitting,
    isEditing = false,
    onClose,
}: SubCategoryProductFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [status, setStatus] = useState(initialData?.status ?? true);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 2) {
            setError("Le nom doit contenir au moins 2 caractères");
            return;
        }
        if (!categoryId) {
            setError("Veuillez sélectionner une catégorie parente");
            return;
        }
        setError("");
        
        // Generate slug from name
        const slug = name.trim().toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');

        await onSubmit({ 
            name: name.trim(), 
            categoryId, 
            status,
            slug
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
                <label className="text-xs font-bold">Catégorie parente *</label>
                <select
                    value={categoryId}
                    onChange={e => { setCategoryId(e.target.value); setError(""); }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium appearance-none"
                >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-xs font-bold">Nom de la sous-catégorie *</label>
                <input
                    value={name}
                    onChange={e => { setName(e.target.value); setError(""); }}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary transition-all font-medium"
                    placeholder="ex: Smartphones, Pantalons..."
                    autoFocus
                />
                {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                    <div className="text-xs font-bold">Statut de la sous-catégorie</div>
                    <div className="text-[10px] text-muted-foreground font-medium italic">
                        {status ? "Visible par les utilisateurs" : "Masqué pour le moment"}
                    </div>
                </div>
                <Switch
                    checked={status}
                    onCheckedChange={setStatus}
                    className="data-[state=checked]:bg-primary"
                />
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
                    {isEditing ? "Mettre à jour" : "Créer la sous-catégorie"}
                </button>
            </div>
        </form>
    );
}
