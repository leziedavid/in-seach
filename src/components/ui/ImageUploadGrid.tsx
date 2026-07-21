"use client";

import { Icon } from "@iconify/react";
import Image from "next/image";

interface ImageUploadGridProps {
    title: string;
    icon?: string;
    max: number;
    previews: string[];
    onAdd: (files: File[]) => void;
    onRemove: (index: number) => void;
}

export default function ImageUploadGrid({ title, icon = "solar:gallery-bold-duotone", max, previews, onAdd, onRemove }: ImageUploadGridProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        if (previews.length + files.length > max) return;
        onAdd(files);
        e.target.value = "";
    };

    return (
        <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black flex items-center gap-2">
                    <Icon icon={icon} className="w-5 h-5 text-primary" />
                    {title}
                </h3>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{previews.length}/{max}</span>
            </div>
            <div className="flex flex-wrap gap-3">
                {previews.map((src, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
                        <Image
                            src={src}
                            alt={`preview-${i}`}
                            fill
                            className="object-cover"
                            unoptimized />
                        <button
                            type="button"
                            onClick={() => onRemove(i)}
                            className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                        >
                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <label className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors bg-muted ${previews.length >= max ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-primary cursor-pointer'}`}>
                    <Icon icon="solar:upload-bold-duotone" className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-black mt-1">AJOUTER</span>
                    <input type="file" accept="image/*" multiple={max > 1} onChange={handleChange} disabled={previews.length >= max} className="hidden" />
                </label>
            </div>
        </div>
    );
}
