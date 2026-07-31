"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { CategoryProd } from "@/types/interface";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type CategoryScope = 'MARKETPLACE' | 'RESTAURANT';

interface CategoryProductFormProps {
    initialData?: CategoryProd;
    /** Portée par défaut à la création — pré-remplit le Select avec l'onglet actif (MARKETPLACE ou RESTAURANT). */
    defaultScope?: CategoryScope;
    onSubmit: (data: { name: string; status: boolean; scope: CategoryScope }) => void | Promise<void>;
    isSubmitting: boolean;
    isEditing?: boolean;
    onClose: () => void;
}

export default function CategoryProductForm({
    initialData,
    defaultScope = 'MARKETPLACE',
    onSubmit,
    isSubmitting,
    isEditing = false,
    onClose,
}: CategoryProductFormProps) {
    const [name, setName] = useState(initialData?.name || "");
    const [status, setStatus] = useState(initialData?.status ?? true);
    const [scope, setScope] = useState<CategoryScope>(initialData?.scope ?? defaultScope);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 2) {
            setError("Le nom doit contenir au moins 2 caractères");
            return;
        }
        setError("");
        await onSubmit({ name: name.trim(), status, scope });
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

            <div className="space-y-1">
                <label className="text-xs font-bold">Portée de la catégorie *</label>
                <Select value={scope} onValueChange={(val) => setScope(val as CategoryScope)}>
                    <SelectTrigger className="w-full rounded-lg border-border/50 h-10 font-bold text-xs">
                        <SelectValue placeholder="Choisir la portée" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MARKETPLACE">Marketplace (catégories marchandises)</SelectItem>
                        <SelectItem value="RESTAURANT">Restaurant (catégories de menu)</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground font-medium italic">
                    {scope === 'RESTAURANT'
                        ? "Utilisée pour catégoriser les plats de menu (Entrées, Plats, Desserts...)."
                        : "Utilisée pour catégoriser les produits de la boutique classique."}
                </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                <div className="space-y-0.5">
                    <div className="text-xs font-bold">Statut de la catégorie</div>
                    <div className="text-[10px] text-muted-foreground font-medium italic">
                        {status ? "Visible par les utilisateurs" : "Masquée pour le moment"}
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
                    {isEditing ? "Mettre à jour" : "Créer la catégorie"}
                </button>
            </div>
        </form>
    );
}
