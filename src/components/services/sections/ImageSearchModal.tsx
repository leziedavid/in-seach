"use client";

import React, { useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/utils/langue/hooks";

import { createPortal } from "react-dom";

interface ImageSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (file: File) => void;
    isLoading?: boolean;
}

export default function ImageSearchModal({ isOpen, onClose, onSearch, isLoading }: ImageSearchModalProps) {
    const { t } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'selection' | 'preview'>('selection');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    React.useEffect(() => { setMounted(true); }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleSelectedFile(file);
        }
    };

    const handleSelectedFile = (file: File) => {
        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setMode('preview');
        stopCamera();
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert(t("home.image_search.camera_error"));
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
            setIsCameraActive(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(videoRef.current, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    handleSelectedFile(file);
                }
            }, 'image/jpeg');
        }
    };

    const handleConfirm = () => {
        if (selectedFile) {
            onSearch(selectedFile);
        }
    };

    const reset = () => {
        setPreviewUrl(null);
        setSelectedFile(null);
        setMode('selection');
        stopCamera();
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1001] flex items-end md:items-center justify-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="hidden md:block fixed inset-0 bg-[#0F2944]/40 backdrop-blur-sm z-[1000]"
                    />

                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full md:w-[90%] md:max-w-lg bg-[#FBFAF6] text-[#0F2944] rounded-none md:rounded-3xl overflow-hidden md:shadow-[0_8px_48px_rgba(15,41,68,0.16)] h-dvh md:h-auto z-[1001] flex flex-col"
                    >
                        {/* Header */}
                        <div className="sticky top-0 z-10 flex h-16 items-center justify-between px-4 border-b border-[#EEF1F4] bg-[#FBFAF6]/95 backdrop-blur-md">
                            <h2 className="text-[15px] font-extrabold text-[#0F2944]">{t("home.image_search.title")}</h2>
                            <button onClick={handleClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EFE7] text-[#0F2944] hover:bg-[#E8E2D6] transition-all active:scale-90">
                                <Icon icon="solar:close-circle-bold-duotone" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto overscroll-contain">
                            {mode === 'selection' ? (
                                <div className="space-y-4">
                                    {!isCameraActive ? (
                                        <>
                                            <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer" >
                                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                    <Icon icon="solar:upload-bold-duotone" className="w-8 h-8" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-bold text-foreground">{t("home.image_search.choose_image")}</p>
                                                    <p className="text-sm text-muted-foreground">{t("home.image_search.choose_desc")}</p>
                                                </div>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                            </div>

                                            <button onClick={startCamera} className="w-full py-4 flex items-center justify-center gap-3 bg-primary text-white rounded-2xl font-bold hover:bg-secondary transition-all active:scale-95 shadow-lg" >
                                                <Icon icon="solar:camera-bold-duotone" className="w-5 h-5" />
                                                {t("home.image_search.use_camera")}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center">
                                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4">
                                                <button onClick={stopCamera} className="p-4 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white/30 transition-all" >
                                                    <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6" />
                                                </button>
                                                <button onClick={capturePhoto} className="p-6 bg-primary text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all" >
                                                    <Icon icon="solar:camera-bold-duotone" className="w-8 h-8" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary shadow-inner bg-muted">
                                        {previewUrl && (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={(previewUrl && previewUrl !== "") ? previewUrl : 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'}
                                                    fill
                                                    unoptimized
                                                    className="object-contain"
                                                    alt="Preview" />
                                            </div>
                                        )}
                                        {isLoading && (
                                            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                                                <Icon icon="solar:refresh-bold-duotone" className="w-12 h-12 text-primary animate-spin" />
                                                <p className="font-black text-primary animate-pulse italic">{t("home.image_search.analyzing")}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                        <button disabled={isLoading} onClick={reset} className="flex-1 py-4 text-sm sm:text-base md:text-lg bg-muted text-foreground rounded-xl sm:rounded-2xl font-bold hover:bg-accent transition-all disabled:opacity-50" >
                                            {t("home.image_search.retry")}
                                        </button>

                                        <button disabled={isLoading} onClick={handleConfirm} className="flex-1 py-4 text-sm sm:text-base md:text-lg bg-primary text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all shadow-md sm:shadow-lg active:scale-95 disabled:opacity-50">
                                            {isLoading
                                                ? <Icon icon="solar:refresh-bold-duotone" className="animate-spin w-5 h-5" />
                                                : <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5" />
                                            }
                                            {t("home.image_search.start_search")}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
