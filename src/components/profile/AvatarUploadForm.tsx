"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface AvatarUploadFormProps {
    currentAvatar?: string;
    onSubmit: (file: File) => Promise<void>;
    onClose: () => void;
    isSubmitting: boolean;
}

export default function AvatarUploadForm({ currentAvatar, onSubmit, onClose, isSubmitting }: AvatarUploadFormProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatar || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                alert("Veuillez sélectionner une image PNG ou JPEG.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert("L'image ne doit pas dépasser 5 Mo.");
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedFile) {
            await onSubmit(selectedFile);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/10 bg-muted flex items-center justify-center">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Avatar Preview"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    ) : (
                        <Icon icon="solar:user-bold-duotone" className="w-16 h-16 text-muted-foreground" />
                    )}
                </div>

                <label className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full cursor-pointer hover:bg-primary/20 transition-all font-bold text-sm">
                    <Icon icon="solar:camera-bold-duotone" className="w-5 h-5" />
                    Choisir une photo
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-lg transition-all"
                >
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting || !selectedFile}
                    className="px-6 py-2 bg-primary text-white text-sm font-black rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-primary/25"
                >
                    {isSubmitting ? (
                        <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" />
                    ) : (
                        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                    )}
                    Mettre à jour
                </button>
            </div>
        </form>
    );
}
