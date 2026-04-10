"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from 'next/image';
import { Booking, BookingStatus, BookingsCalendar } from "@/types/interface";
import { QRCodeSVG } from "qrcode.react";
import { getUserRole } from "@/lib/auth";
import jsQR from "jsqr";
import { scanBookingQr } from "@/lib/api";
import { toast } from "sonner";
import { createPortal } from "react-dom";

interface BookingDetailProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | BookingsCalendar | null;
    onEditRdv?: (booking: Booking | BookingsCalendar) => void;
}

const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING: { label: "En attente", color: "text-amber-600", bg: "bg-amber-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
    ACCEPTED: { label: "Accepté", color: "text-blue-600", bg: "bg-blue-500/10", icon: <Icon icon="solar:verified-check-bold-duotone" width={16} /> },
    IN_PROGRESS: { label: "En cours", color: "text-purple-600", bg: "bg-purple-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
    COMPLETED: { label: "Terminé", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: <Icon icon="solar:check-circle-bold-duotone" width={16} /> },
    CANCELLED: { label: "Annulé", color: "text-red-600", bg: "bg-red-500/10", icon: <Icon icon="solar:close-circle-bold-duotone" width={16} /> },
    PAID: { label: "Payé", color: "text-green-600", bg: "bg-green-500/10", icon: <Icon icon="solar:shield-check-bold-duotone" width={16} /> },
};

export default function BookingDetailModal({ isOpen, onClose, booking, onEditRdv }: BookingDetailProps) {
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<"provider" | "client">("provider");
    const [role, setRole] = useState<"CLIENT" | "PRESTATAIRE">("PRESTATAIRE");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { if (!isOpen) setActiveImageIndex(0); }, [isOpen]);
    useEffect(() => { const r = getUserRole() as any; if (r === "CLIENT") setRole("CLIENT"); else setRole("PRESTATAIRE"); }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if (videoRef.current) { videoRef.current.srcObject = stream; streamRef.current = stream; }
        } catch (err) { toast.error("Erreur caméra"); setIsCameraOpen(false); }
    };
    const stopCamera = () => { if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } };

    useEffect(() => { if (isCameraOpen) startCamera(); else stopCamera(); return () => stopCamera(); }, [isCameraOpen]);

    const scanQRCode = () => {
        if (!videoRef.current || !canvasRef.current || !isCameraOpen || isScanning) return;
        const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && ctx) {
            canvasRef.current.height = videoRef.current.videoHeight;
            canvasRef.current.width = videoRef.current.videoWidth;
            ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            const imgData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const code = jsQR(imgData.data, imgData.width, imgData.height);
            if (code) { handleScanSuccess(code.data); return; }
        }
        requestAnimationFrame(scanQRCode);
    };

    const handleScanSuccess = async (qrData: string) => {
        if (isScanning) return;
        setIsScanning(true);
        try { await scanBookingQr(qrData); toast.success("Validé !"); setIsCameraOpen(false); }
        catch { toast.error("Erreur scan"); } finally { setIsScanning(false); }
    };

    useEffect(() => { if (isCameraOpen) requestAnimationFrame(scanQRCode); }, [isCameraOpen]);

    if (!booking || !mounted) return null;

    const imageGallery = (() => {
        const imgs: { url: string }[] = [];
        if (booking.service?.imageUrls) {
            if (typeof booking.service.imageUrls === 'string') imgs.push({ url: booking.service.imageUrls });
            else if (Array.isArray(booking.service.imageUrls)) booking.service.imageUrls.forEach(url => imgs.push({ url }));
        }
        if (imgs.length === 0) imgs.push({ url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop' });
        return imgs;
    })();

    const status = statusConfig[booking.status];
    const canEdit = role === "CLIENT" && (booking.status === "PENDING" || booking.status === "ACCEPTED");


    const formatPhoneForWhatsApp = (phone: string) => { return phone.replace(/[^\d]/g, ""); };

    const phoneRaw = booking.provider?.phone || "";
    const phone = formatPhoneForWhatsApp(phoneRaw);

    const handleCall = () => {
        if (!phone) return;
        const confirmCall = window.confirm(`Voulez-vous appeler ${booking.provider?.fullName} ?`);
        if (confirmCall) {
            window.location.href = `tel:${phone}`;
        }
    };

    const handleWhatsApp = () => {
        if (!phone) return;
        const message = encodeURIComponent(`Bonjour ${booking.provider?.fullName}, je vous contacte concernant ma réservation.`);
        window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    };


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[1000]" />
                    <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-0 flex items-end md:items-center justify-center z-[1001]">
                        <motion.div className=" bg-card shadow-2xl overflow-hidden flex flex-col md:w-[90%] md:max-w-3xl md:max-h-[88vh] md:rounded-3xl rounded-t-[2.5rem] w-full h-[90vh] md:h-auto pb-safe " initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ delay: 0.1, type: "spring", damping: 25 }} >
                            <div className="flex justify-center pt-4 pb-2 shrink-0 md:hidden"><div className="w-12 h-1.5 bg-muted rounded-full" /></div>
                            <div className="sticky top-0 z-50 px-6 py-4 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-md">
                                <button onClick={onClose} className="p-2 md:p-3 bg-muted rounded-full transition hover:bg-accent"><Icon icon="solar:alt-arrow-left-bold-duotone" width={20} /></button>
                                <div className="flex-1 text-center"><h2 className="text-lg font-black">{booking.service?.title}</h2></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-card shadow-xl group">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeImageIndex}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="absolute inset-0"
                                        >
                                            <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt="Service" />
                                        </motion.div>
                                    </AnimatePresence>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                                    <div className="absolute top-4 left-4 z-20">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-xs font-black backdrop-blur-sm border border-white/10`}>
                                            {status.icon}
                                            <span>{status.label}</span>
                                        </div>
                                    </div>

                                    {/* Slider Controls */}
                                    {imageGallery.length > 1 && (
                                        <>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveImageIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length);
                                                }}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30"
                                            >
                                                <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveImageIndex((prev) => (prev + 1) % imageGallery.length);
                                                }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/50 active:scale-90 z-30"
                                            >
                                                <Icon icon="solar:alt-arrow-right-bold" className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}

                                    {/* Miniatures at bottom right */}
                                    {imageGallery.length > 1 && (
                                        <div className="absolute bottom-4 right-4 flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-20">
                                            {imageGallery.map((image, index) => (
                                                <button
                                                    key={index}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveImageIndex(index);
                                                    }}
                                                    className={`relative w-10 h-10 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-white/10 opacity-50 hover:opacity-100'} `}
                                                >
                                                    <Image src={image.url} alt={`Gallery - ${index + 1}`} fill unoptimized className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20">
                                        <span className="text-[10px] font-black text-white tabular-nums tracking-widest">{activeImageIndex + 1} / {imageGallery.length}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="p-3 bg-muted/50 rounded-xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Date</p><p className="text-sm font-black">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "ND"}</p></div>
                                    <div className="p-3 bg-muted/50 rounded-xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Heure</p><p className="text-sm font-black">{booking.scheduledTime || "ND"}</p></div>
                                    <div className="p-3 bg-muted/50 rounded-xl"><p className="text-[10px] font-black uppercase text-muted-foreground">Référence</p><p className="text-sm font-black">#{booking.code?.toUpperCase()}</p></div>
                                </div>

                                <div className="bg-muted/50 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
                                    <div className="p-4  rounded-2xl relative">
                                        <QRCodeSVG value={role === "CLIENT" ? booking.userQrCode || "" : booking.prestaQrCode || ""} size={160} level="H" includeMargin />
                                        <button onClick={() => setIsCameraOpen(true)} className="absolute -right-3 -bottom-3 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-lg active:scale-95"><Icon icon="solar:camera-bold-duotone" width={24} /></button>
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground">{role === "CLIENT" ? "Présentez ce code au prestataire." : "Scannez le code du client."}</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex bg-muted/50 p-1 rounded-xl">
                                        <button onClick={() => setActiveTab("provider")} className={`flex-1 py-2 rounded-lg text-xs font-black ${activeTab === "provider" ? 'bg-primary text-white' : ''}`}>Prestataire</button>
                                        <button onClick={() => setActiveTab("client")} className={`flex-1 py-2 rounded-lg text-xs font-black ${activeTab === "client" ? 'bg-primary text-white' : ''}`}>Client</button>
                                    </div>
                                    <div className="p-4 bg-muted/20 border border-border rounded-xl">
                                        {activeTab === "provider" ? (
                                            <>
                                                <p className="text-sm font-black">Nom : {booking.provider?.fullName || "Bientôt disponible"}</p>
                                                {/* ajouter une icon et une fonction pour lancer un applel vert le client ou l'ecrire sur whatsapp */}

                                                <div className="flex items-center gap-3 mt-2">

                                                    {/* Bouton Appel */}
                                                    <div className="relative group">
                                                        <button onClick={handleCall} disabled={!phone} aria-label="Appeler le prestataire" className="p-3 bg-primary text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg  active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <Icon icon="solar:phone-bold-duotone" width={22} />
                                                        </button>

                                                        {/* Tooltip */}
                                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 whitespace-nowrap">
                                                            Appeler
                                                        </span>
                                                    </div>

                                                    {/* Bouton WhatsApp */}
                                                    <div className="relative group">
                                                        <button onClick={handleWhatsApp} disabled={!phone} aria-label="Écrire sur WhatsApp" className="p-3 bg-green-500 text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <Icon icon="mingcute:whatsapp-line" width={22} />
                                                        </button>
                                                        {/* Tooltip */}
                                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 whitespace-nowrap">
                                                            whatsapp
                                                        </span>
                                                    </div>

                                                    {/* Numéro affiché */}
                                                    <p className="text-sm font-semibold ml-2"> {booking.provider?.phone || "Bientôt disponible"} </p>

                                                </div>

                                                {/* <p className="text-sm font-black">Email : {booking.provider?.email || "Bientôt disponible"}</p> */}
                                            </>
                                        ) : (
                                            <>

                                                <div className="flex items-center gap-3 mt-2">
                                                    <p className="text-sm font-black">Nom : {booking.client?.fullName || "Bientôt disponible"}</p>

                                                    {/* Bouton Appel */}
                                                    <div className="relative group">
                                                        <button onClick={handleCall} disabled={!booking.client?.phone} aria-label="Appeler le prestataire" className="p-3 bg-primary text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg  active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <Icon icon="solar:phone-bold-duotone" width={22} />
                                                        </button>

                                                        {/* Tooltip */}
                                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 whitespace-nowrap">
                                                            Appeler
                                                        </span>
                                                    </div>

                                                    {/* Bouton WhatsApp */}
                                                    <div className="relative group">
                                                        <button onClick={handleWhatsApp} disabled={!booking.client?.phone} aria-label="Écrire sur WhatsApp" className="p-3 bg-green-500 text-white rounded-full transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <Icon icon="mingcute:whatsapp-line" width={22} />
                                                        </button>
                                                        {/* Tooltip */}
                                                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition duration-200 whitespace-nowrap">
                                                            whatsapp
                                                        </span>
                                                    </div>

                                                    {/* Numéro affiché */}
                                                    <p className="text-sm font-semibold ml-2"> {booking.client?.phone || "Bientôt disponible"} </p>

                                                </div>

                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {canEdit && (
                                <div className="sticky bottom-0 p-6 bg-card border-t">
                                    <button 
                                        onClick={() => {
                                            if (onEditRdv) {
                                                onEditRdv(booking);
                                                onClose();
                                            }
                                        }} 
                                        className="w-full py-4 bg-primary text-white rounded-xl font-black text-sm active:scale-95 transition-all"
                                    >
                                        Modifier le rendez-vous
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Camera Modal inside Portal */}
                    <AnimatePresence>
                        {isCameraOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/90 p-4">
                                <div className="relative w-full max-w-lg aspect-square bg-black rounded-3xl overflow-hidden border border-white/20 shadow-2xl">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl animate-pulse" />
                                    </div>
                                    <button onClick={() => setIsCameraOpen(false)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white"><Icon icon="solar:close-circle-bold-duotone" width={28} /></button>
                                    <canvas ref={canvasRef} className="hidden" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}