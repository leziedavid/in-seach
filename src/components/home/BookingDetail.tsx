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
    const [currentTab, setCurrentTab] = useState("Validation");
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

    const getTargetInfo = () => {
        if (activeTab === "provider") {
            return {
                name: booking.provider?.fullName || "Prestataire",
                phone: booking.provider?.phone || ""
            };
        }
        return {
            name: booking.client?.fullName || "Client",
            phone: booking.client?.phone || ""
        };
    };

    const handleCall = () => {
        const target = getTargetInfo();
        if (!target.phone) return;
        const confirmCall = window.confirm(`Voulez-vous appeler ${target.name} ?`);
        if (confirmCall) {
            window.location.href = `tel:${formatPhoneForWhatsApp(target.phone)}`;
        }
    };

    const handleWhatsApp = () => {
        const target = getTargetInfo();
        if (!target.phone) return;
        const phoneFormatted = formatPhoneForWhatsApp(target.phone);
        const message = encodeURIComponent(`Bonjour ${target.name}, je vous contacte concernant ma réservation.`);
        window.open(`https://wa.me/${phoneFormatted}?text=${message}`, "_blank");
    };


    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1000]" />

                    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed inset-0 flex items-end justify-center z-[1001] pointer-events-none">
                        <motion.div className="bg-card w-full max-w-2xl h-[95vh] rounded-t-[3rem] overflow-hidden flex flex-col border-t border-x border-border pointer-events-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} >

                            {/* Scrollable Content Area */}
                            <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
                                {/* Hero Image Section */}
                                <div className="relative h-[40vh] md:h-[45vh] shrink-0 group">
                                    <AnimatePresence mode="wait">
                                        <motion.div key={activeImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                                            <Image src={imageGallery[activeImageIndex].url} fill unoptimized className="object-cover" alt="Service" />
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Overlay Controls */}
                                    <div className="absolute top-8 px-6 w-full flex items-center justify-between z-20">
                                        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-95">
                                            <Icon icon="solar:alt-arrow-left-outline" className="w-6 h-6" />
                                        </button>
                                        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                            <h2 className="text-sm font-black text-white truncate max-w-[150px]">{booking.service?.title || "Détails RDV"}</h2>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-95">
                                                <Icon icon="solar:share-outline" className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slider Arrows */}
                                    {imageGallery.length > 1 && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + imageGallery.length) % imageGallery.length); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 z-30">
                                                <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % imageGallery.length); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-black/40 z-30">
                                                <Icon icon="solar:alt-arrow-right-bold" className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}

                                    {/* Thumbnails Gallery - Bottom Right */}
                                    {imageGallery.length > 1 && (
                                        <div className="absolute bottom-16 right-6 flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 z-30">
                                            {imageGallery.slice(0, 4).map((image, index) => (
                                                <button key={index} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }} className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary scale-110' : 'border-white/10 opacity-60 hover:opacity-100'} `}>
                                                    <Image src={image.url} alt={`Gallery ${index}`} fill unoptimized className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Custom Pagination Dots - Bottom Left */}
                                    <div className="absolute bottom-16 left-6 flex justify-center gap-2 z-20">
                                        {imageGallery.map((_, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === i ? "bg-primary w-4" : "bg-white/40"}`} />
                                        ))}
                                    </div>

                                    {/* Status Badge Overlay */}
                                    <div className="absolute top-20 right-6 z-20">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-[10px] font-black border border-current/10 truncate`}>
                                            {status.icon}
                                            <span className="uppercase tracking-wider">{status.label}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Overlapping Content Container */}
                                <div className="relative bg-card rounded-t-[3rem] -mt-12 z-30 flex flex-col border-t border-border pt-4 pb-32">
                                    {/* Native Sheet Handle */}
                                    <div className="w-12 h-1.5 bg-muted/60 rounded-full mx-auto mb-6" />

                                    <div className="px-6">
                                        {/* Compact Profile Header */}
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border shrink-0">
                                                <Image src={booking.provider?.avatar || "/avatars/user2.png?q=80&w=200&auto=format&fit=crop"} fill className="object-cover" alt="Provider" unoptimized />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 truncate">{booking.service?.title || "SÉANCE"}</p>
                                                <h1 className="text-xl font-bold text-foreground truncate leading-tight">
                                                    {booking.provider?.fullName || "Prestataire"}
                                                </h1>
                                                <div className="flex items-center gap-1.5 text-foreground/50">
                                                    <Icon icon="solar:verified-check-bold" className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-xs font-semibold">Profil vérifié</span>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full ${status.bg} ${status.color} text-[10px] font-black uppercase tracking-wider h-fit`}>
                                                {status.label}
                                            </div>
                                        </div>

                                        {/* Sticky Modern Tabs (Segmented Control style) */}
                                        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md -mx-6 px-6 py-2 mb-8">
                                            <div className="flex bg-muted/50 p-1 rounded-2xl">
                                                {["Validation", "Détails", "Avis"].map((tab) => (
                                                    <button
                                                        key={tab}
                                                        onClick={() => setCurrentTab(tab)}
                                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative z-10 ${currentTab === tab ? "text-primary" : "text-foreground/40 hover:text-foreground"}`}
                                                    >
                                                        <span className="relative z-20">{tab}</span>
                                                        {currentTab === tab && (
                                                            <motion.div
                                                                layoutId="activeTabIndicator"
                                                                className="absolute inset-0 bg-card rounded-xl border border-border/50 z-0"
                                                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                                            />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Tab Content */}
                                        <AnimatePresence mode="wait">
                                            <motion.div
                                                key={currentTab}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="min-h-[300px]"
                                            >

                                                {currentTab === "Validation" && (
                                                    <div className="space-y-6">
                                                        {/* Digital Pass Card */}
                                                        <div className="relative bg-muted/30 rounded-[2.5rem] p-8 flex flex-col items-center text-center overflow-hidden border border-border">
                                                            {/* Decorative Pass Notch */}
                                                            <div className="absolute top-0 w-20 h-6 bg-card rounded-b-3xl -mt-0.5 border-x border-b border-border" />
                                                            
                                                            <div className="relative mt-4">
                                                                {/* Glowing background */}
                                                                <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
                                                                
                                                                <div className="relative p-5 bg-white rounded-3xl border border-border">
                                                                    <QRCodeSVG 
                                                                        value={role === "CLIENT" ? booking.userQrCode || "" : booking.prestaQrCode || ""} 
                                                                        size={160} 
                                                                        level="H" 
                                                                        includeMargin={false}
                                                                        className="rounded-lg"
                                                                    />
                                                                    <div className="absolute -top-3 -right-3 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center border-2 border-white transform rotate-12">
                                                                        <Icon icon="solar:ticket-bold-duotone" width={20} />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-8 space-y-2">
                                                                <h4 className="text-xl font-black text-foreground">Pass Digital</h4>
                                                                <p className="text-sm font-bold text-foreground/40 max-w-[240px] leading-relaxed">
                                                                    {role === "CLIENT" 
                                                                        ? "Présentez ce code au prestataire pour confirmer le démarrage de la prestation." 
                                                                        : "Scannez le code QR du client pour valider sa présence."}
                                                                </p>
                                                            </div>

                                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent my-6" />

                                                            <button 
                                                                onClick={() => setIsCameraOpen(true)}
                                                                className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm active:scale-95 transition-all hover:bg-secondary"
                                                            >
                                                                <Icon icon="solar:camera-bold-duotone" width={24} />
                                                                Scanner le Code
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {currentTab === "Avis" && (
                                                    <div className="space-y-6">
                                                        <div className="bg-muted/20 p-6 rounded-[2rem] border border-border flex items-center gap-4">
                                                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                                <Icon icon="solar:star-bold-duotone" width={28} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-foreground">Avis Clients</h4>
                                                                <p className="text-xs font-semibold text-foreground/40 leading-tight">Découvrez les retours d'expérience sur ce service</p>
                                                            </div>
                                                        </div>

                                                        {booking.comment ? (
                                                            <div className="p-6 rounded-[2.5rem] bg-muted/20 border border-foreground/5 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-primary">
                                                                            <Icon icon="solar:user-circle-bold-duotone" width={24} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-black text-foreground">Utilisateur vérifié</p>
                                                                            <div className="flex text-amber-500 gap-0.5 mt-0.5">
                                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                                    <Icon key={s} icon="solar:star-bold" className={`w-3 h-3 ${s > (booking.rating || 5) ? "text-foreground/20" : ""}`} />
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-1 rounded-lg">Récent</span>
                                                                </div>
                                                                <p className="text-sm text-foreground/70 leading-relaxed font-medium italic">
                                                                    "{booking.comment}"
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-40">
                                                                <Icon icon="solar:chat-round-line-bold" width={48} className="text-muted-foreground" />
                                                                <p className="text-sm font-bold">Aucun avis publié pour le moment.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {currentTab === "Détails" && (
                                                    <div className="space-y-6">
                                                        {/* Quick Grid Details */}
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="p-5 bg-card rounded-3xl border border-border">
                                                                <Icon icon="solar:calendar-date-bold-duotone" className="text-primary mb-3" width={24} />
                                                                <p className="text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-1">Date RDV</p>
                                                                <p className="text-sm font-black text-foreground">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : "—"}</p>
                                                                <p className="text-xs font-bold text-primary">{booking.scheduledTime || "—"}</p>
                                                            </div>
                                                            <div className="p-5 bg-card rounded-3xl border border-border">
                                                                <Icon icon="solar:hashtag-bold-duotone" className="text-primary mb-3" width={24} />
                                                                <p className="text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-1">Référence</p>
                                                                <p className="text-sm font-black text-foreground truncate">#{booking.code?.toUpperCase() || "N/A"}</p>
                                                                <p className="text-xs font-bold text-foreground/40 italic">ID Réservation</p>
                                                            </div>
                                                        </div>

                                                        {/* Contact Info Section */}
                                                        <div className="space-y-4">
                                                            <div className="flex bg-muted/30 p-1 rounded-2xl">
                                                                <button
                                                                    onClick={() => setActiveTab("provider")}
                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "provider" ? 'bg-card text-primary shadow-sm' : 'text-foreground/40 hove:text-foreground'}`}
                                                                >
                                                                    Prestataire
                                                                </button>
                                                                <button
                                                                    onClick={() => setActiveTab("client")}
                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "client" ? 'bg-card text-primary shadow-sm' : 'text-foreground/40 hover:text-foreground'}`}
                                                                >
                                                                    Client
                                                                </button>
                                                            </div>

                                                            <div className="p-5 bg-card rounded-3xl border border-border flex items-center justify-between">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                                        <Icon icon={activeTab === "provider" ? "solar:user-bold-duotone" : "solar:users-group-two-rounded-bold-duotone"} width={24} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-foreground">{activeTab === "provider" ? (booking.provider?.fullName || "Prestataire") : (booking.client?.fullName || "Client")}</p>
                                                                        <p className="text-[10px] font-bold text-foreground/40">{activeTab === "provider" ? (booking.provider?.phone || "Non renseigné") : (booking.client?.phone || "Non renseigné")}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={handleCall} className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center active:scale-95 transition-all">
                                                                        <Icon icon="solar:phone-bold" width={18} />
                                                                    </button>
                                                                    <button onClick={handleWhatsApp} className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center active:scale-95 transition-all">
                                                                        <Icon icon="mingcute:whatsapp-line" width={18} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Location Info (if any) */}
                                                        {booking.service?.location && (
                                                            <div className="p-5 bg-muted/20 rounded-[2rem] border border-foreground/5 flex items-start gap-4">
                                                                <div className="w-10 h-10 rounded-2xl bg-card flex items-center justify-center text-primary shrink-0">
                                                                    <Icon icon="solar:map-point-bold-duotone" width={20} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-0.5">Adresse de prestation</p>
                                                                    <p className="text-sm font-bold text-foreground/80 leading-snug">{booking.service.location}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                            </motion.div>
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Persistent Bottom Footer */}
                                <div className="sticky bottom-0 left-0 right-0 p-6 pt-4 pb-8 bg-card/90 backdrop-blur-xl border-t border-foreground/5 z-50 flex items-center justify-between gap-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-foreground">{booking.price || booking.service?.price || 0} XOF</span>
                                        </div>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">Disponibilité confirmée</p>
                                    </div>

                                    {canEdit && booking.status === BookingStatus.PENDING ? (
                                        <button onClick={() => { if (onEditRdv) { onEditRdv(booking); onClose(); } }} className="flex-1 max-w-[200px] py-4 bg-primary text-white rounded-2xl font-black text-sm active:scale-95 transition-all" > Modifier </button>
                                    ) : (
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                                            {status.label}
                                        </span>
                                    )}
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Camera Scanner Modal */}
                    <AnimatePresence>
                        {isCameraOpen && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/95 p-4"
                            >
                                <div className="relative w-full max-w-lg aspect-square bg-black rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-64 border-2 border-primary/40 rounded-[3rem] animate-pulse" />
                                    </div>
                                    <button
                                        onClick={() => setIsCameraOpen(false)}
                                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all"
                                    >
                                        <Icon icon="solar:close-circle-bold-duotone" width={28} />
                                    </button>
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
