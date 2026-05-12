"use client";

import React, { useState, useEffect } from "react";
import { Slider } from "@/types/interface";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface SliderFormProps {
    initialData?: Partial<Slider>;
    onSubmit: (formData: FormData) => Promise<void>;
    onCancel: () => void;
    isSubmitting: boolean;
}

export default function SliderForm({ initialData, onSubmit, onCancel, isSubmitting }: SliderFormProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [status, setStatus] = useState(initialData?.status ?? true);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(initialData?.file?.fileUrl || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onload = ev => {
                setPreview(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("status", String(status));
        formData.append("isActive", String(isActive));
        if (image) {
            formData.append("image", image);
        }
        await onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh]">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 custom-scrollbar">

                {/* Image Section - Match FormsProduit */}
                <div className="bg-card rounded-xl border border-border p-4">
                    <h3 className="text-sm font-black mb-3 flex items-center gap-2">
                        <Icon icon="solar:gallery-bold-duotone" className="w-5 h-5 text-primary" />
                        Image du Slider
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {preview ? (
                            <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-border group">
                                <Image src={preview} alt="preview" fill className="object-cover" unoptimized />
                                <button type="button" onClick={removeImage} className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <label className="w-full aspect-[21/9] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors bg-muted/30">
                                <Icon icon="solar:upload-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground font-black mt-2">AJOUTER UNE IMAGE</span>
                                <span className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-tighter">Recommandé: 1200x500</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                <div className="space-y-4 bg-card rounded-xl border border-border p-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Titre du Slider *</label>
                        <input required type="text" placeholder="Ex: Bienvenue sur Djamko" className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description (Optionnel)</label>
                        <textarea
                            placeholder="Brève description du slider..."
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium min-h-[100px]"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-end gap-3 bg-background flex-shrink-0">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? (
                        <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                    ) : (
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    )}
                    {initialData?.id ? "Mettre à jour" : "Ajouter le slider"}
                </button>
            </div>
        </form>
    );
}
