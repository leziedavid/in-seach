'use client';

import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useNotification } from "@/components/notifications/NotificationProvider";

interface ShareProps {
    isOpen: boolean;
    onClose: () => void;
    url: string;
    title: string;
    description?: string;
    image?: string;
    price?: number | string;
    storeName?: string;
    storeLogo?: string;
}

export const Share = ({ isOpen, onClose, url, title, description, image, price, storeName, storeLogo }: ShareProps) => {

    const { addNotification } = useNotification();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            addNotification("Lien copié !", "success");
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            addNotification("Erreur lors de la copie", "error");
        }
    };

    const shareOptions = [
        {
            name: 'Facebook',
            icon: 'logos:facebook',
            color: '#1877F2',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        },
        {
            name: 'WhatsApp',
            icon: 'logos:whatsapp-icon',
            color: '#25D366',
            url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`
        },
        {
            name: 'Twitter',
            icon: 'logos:twitter',
            color: '#1DA1F2',
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
        },
        {
            name: 'LinkedIn',
            icon: 'logos:linkedin-icon',
            color: '#0A66C2',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        }
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    />


                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-[95%] max-w-[420px] max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-zinc-800/50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 md:p-6 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                Partager
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                            >
                                <Icon icon="solar:close-circle-bold" width={24} />
                            </button>
                        </div>

                        <div className="p-5 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
                            {/* Preview Card */}
                            <div className="flex flex-row gap-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800 items-center">
                                <div className="relative w-20 md:w-28 aspect-square rounded-2xl overflow-hidden shrink-0 bg-white dark:bg-zinc-900 shadow-sm">
                                    {image ? (
                                        <Image src={image} alt={title} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-300">
                                            <Icon icon="solar:box-bold" width={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    {storeName && (
                                        <div className="flex items-center gap-2 mb-1">
                                            {storeLogo && (
                                                <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0">
                                                    <Image src={storeLogo} alt={storeName} fill className="object-cover" unoptimized />
                                                </div>
                                            )}
                                            <span className="text-[10px] font-black uppercase text-zinc-400 truncate tracking-wider">
                                                {storeName}
                                            </span>
                                        </div>
                                    )}
                                    <h4 className="text-[13px] md:text-sm font-black text-secondary uppercase leading-tight mb-1 line-clamp-2">
                                        {title}
                                    </h4>
                                    {description && (
                                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium line-clamp-2 mb-2 leading-relaxed">
                                            {description}
                                        </p>
                                    )}
                                    {price && (
                                        <p className="text-base md:text-lg font-black text-zinc-900 dark:text-white">
                                            {typeof price === 'number' ? price.toLocaleString() : price} <span className="text-[10px] md:text-xs">FCFA</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Copy Link Section */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider ml-1">
                                    Par lien
                                </h5>
                                <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl p-1.5 border border-zinc-200/50 dark:border-zinc-700/50">
                                    <div className="flex-1 px-4 text-xs font-medium text-zinc-500 truncate select-all">
                                        {url}
                                    </div>
                                    <button onClick={handleCopy} className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-black text-xs transition-all active:scale-95 shadow-sm ${copied ? 'bg-secondary text-white' : 'bg-secondary hover:opacity-90 text-white'}`}>
                                        <Icon icon={copied ? "solar:check-read-bold" : "solar:copy-bold-duotone"} width={16} />
                                        {copied ? 'Copié' : 'Copier'}
                                    </button>
                                </div>
                            </div>

                            {/* Social Media Section */}
                            <div className="space-y-4">
                                <h5 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider ml-1">
                                    Sur vos réseaux sociaux
                                </h5>
                                <div className="flex flex-wrap gap-4 md:gap-6 justify-start items-center ml-1">
                                    {shareOptions.map((option) => (
                                        <a key={option.name} href={option.url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-1 active:scale-90">
                                            <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-100 dark:border-zinc-700 group-hover:border-zinc-200 dark:group-hover:border-zinc-600 transition-colors">
                                                <Icon icon={option.icon} width={24} />
                                            </div>
                                            <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                                {option.name}
                                            </span>
                                        </a>
                                    ))}
                                    {/* Plus Button */}
                                    <button
                                        onClick={async () => {
                                            if (navigator.share) {
                                                try {
                                                    await navigator.share({ title, text: description, url });
                                                } catch (err) {
                                                    // Silent catch for AbortError (user cancelled)
                                                    if (err instanceof Error && err.name !== 'AbortError') {
                                                        console.error('Share error:', err);
                                                    }
                                                }
                                            } else {
                                                handleCopy();
                                            }
                                        }}
                                        className="group flex flex-col items-center gap-2 transition-transform hover:-translate-y-1 active:scale-90"
                                    >
                                        <div className="w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200/50 dark:border-zinc-700 transition-colors">
                                            <Icon icon="solar:menu-dots-bold" width={24} className="text-zinc-400" />
                                        </div>
                                        <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                                            Plus
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Security Badge */}
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 flex justify-center border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                            <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] opacity-60">
                                <Icon icon="solar:shield-check-bold" width={12} />
                                <span>Partage sécurisé • Djamko</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
