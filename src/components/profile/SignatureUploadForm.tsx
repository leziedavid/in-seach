"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";

import { useTranslation } from "@/utils/langue/hooks";

interface SignatureUploadFormProps {
    currentSignature?: string;
    onSubmit: (file: File) => Promise<void>;
    onClose: () => void;
    isSubmitting: boolean;
}

export default function SignatureUploadForm({ currentSignature, onSubmit, onClose, isSubmitting }: SignatureUploadFormProps) {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentSignature || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
                alert(t("akwaba.settings.invalid_file_type"));
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert(t("akwaba.settings.file_too_large"));
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
                <div className="relative w-full aspect-[2/1] max-w-sm rounded-2xl overflow-hidden border-2 border-dashed border-border bg-muted flex items-center justify-center">
                    {previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt="Signature Preview"
                            fill
                            className="object-contain p-2"
                            unoptimized
                        />
                    ) : (
                        <div className="text-center p-8">
                            <Icon icon="solar:pen-new-square-bold-duotone" className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground font-medium">{t("akwaba.settings.no_doc")}</p>
                        </div>
                    )}
                </div>

                <label className="flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-xl cursor-pointer hover:bg-primary/20 transition-all font-black text-sm">
                    <Icon icon="solar:upload-minimalistic-bold-duotone" className="w-5 h-5" />
                    {t("akwaba.settings.upload_signature")}
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
                    {t("common.cancel")}
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
                    {t("akwaba.settings.save_doc")}
                </button>
            </div>
        </form>
    );
}
