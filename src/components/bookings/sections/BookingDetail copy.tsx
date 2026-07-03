"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Booking, BookingStatus, BookingsCalendar } from "@/types/interface";
import { QRCodeSVG } from "qrcode.react";
import { getUserRole } from "@/lib/auth";
import jsQR from "jsqr";
import { scanBookingQr } from "@/lib/api";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useTranslation } from "@/utils/langue/hooks";
import { hasValidPrice } from "@/utils/price";

interface BookingDetailProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | BookingsCalendar | null;
    onEditRdv?: (booking: Booking | BookingsCalendar) => void;
}

export default function BookingDetailModal({ isOpen, onClose, booking, onEditRdv }: BookingDetailProps) {
    const { t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [currentTab, setCurrentTab] = useState("QR Code");
    const [activeTab, setActiveTab] = useState<"provider" | "client">("provider");
    const [role, setRole] = useState<"CLIENT" | "PRESTATAIRE">("PRESTATAIRE");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        PENDING: { label: t("akwaba.bookings.status.pending"), color: "text-amber-600", bg: "bg-amber-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
        ACCEPTED: { label: t("akwaba.bookings.status.accepted"), color: "text-blue-600", bg: "bg-blue-500/10", icon: <Icon icon="solar:verified-check-bold-duotone" width={16} /> },
        IN_PROGRESS: { label: t("akwaba.bookings.status.in_progress"), color: "text-purple-600", bg: "bg-purple-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
        COMPLETED: { label: t("akwaba.bookings.status.completed"), color: "text-emerald-600", bg: "bg-emerald-500/10", icon: <Icon icon="solar:check-circle-bold-duotone" width={16} /> },
        CANCELLED: { label: t("akwaba.bookings.status.cancelled"), color: "text-red-600", bg: "bg-red-500/10", icon: <Icon icon="solar:close-circle-bold-duotone" width={16} /> },
        PAID: { label: t("akwaba.bookings.status.paid", "PAYÉ"), color: "text-green-600", bg: "bg-green-500/10", icon: <Icon icon="solar:shield-check-bold-duotone" width={16} /> },
    };

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => { if (!isOpen) setActiveImageIndex(0); }, [isOpen]);
    useEffect(() => { const r = getUserRole() as any; if (r === "CLIENT") setRole("CLIENT"); else setRole("PRESTATAIRE"); }, []);

    useEffect(() => {
        setCurrentTab("QR Code");
    }, [language]);

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
                name: booking.provider?.fullName || t("akwaba.details.booking.labels.provider"),
                phone: booking.provider?.phone || ""
            };
        }
        return {
            name: booking.client?.fullName || t("akwaba.details.booking.labels.client"),
            phone: booking.client?.phone || ""
        };
    };

    const handleCall = () => {
        const target = getTargetInfo();
        if (!target.phone) return;
        const confirmCall = window.confirm(`${t("akwaba.details.booking.labels.client") === "Client" ? "Voulez-vous appeler" : "Do you want to call"} ${target.name} ?`);
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
                        <motion.div className="bg-card w-full max-w-2xl h-[90vh] rounded-t-[3rem] overflow-hidden flex flex-col border-t border-x border-border pointer-events-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} >

                            {/* Hero Image Section - fixed height, direct child */}
                            <div className="relative h-[28vh] shrink-0 group">
                                <AnimatePresence mode="wait">
                                    <motion.div key={activeImageIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="absolute inset-0">
                                        <Image
                                            src={imageGallery[activeImageIndex].url}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            alt="Service" />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Overlay Controls */}
                                <div className="absolute top-6 px-6 w-full flex items-center justify-between z-20">
                                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-all active:scale-95">
                                        <Icon icon="solar:alt-arrow-left-outline" className="w-6 h-6" />
                                    </button>
                                    <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                        <h2 className="text-sm font-black text-white truncate max-w-[150px]">{booking.service?.title || t("akwaba.details.booking.title")}</h2>
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
                                    <div className="absolute bottom-12 right-6 flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-xl rounded-sm border border-white/10 z-30">
                                        {imageGallery.slice(0, 4).map((image, index) => (
                                            <button key={index} onClick={(e) => { e.stopPropagation(); setActiveImageIndex(index); }} className={`relative w-8 h-8 rounded-sm overflow-hidden border-2 transition-all ${activeImageIndex === index ? 'border-primary scale-110' : 'border-white/10 opacity-60 hover:opacity-100'} `}>
                                                <Image
                                                    src={image.url}
                                                    alt={`Gallery ${index}`}
                                                    fill
                                                    unoptimized
                                                    className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Custom Pagination Dots - Bottom Left */}
                                <div className="absolute bottom-12 left-6 flex justify-center gap-2 z-20">
                                    {imageGallery.map((_, i) => (
                                        <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${activeImageIndex === i ? "bg-primary w-4" : "bg-white/40"}`} />
                                    ))}
                                </div>

                                {/* Status Badge Overlay */}
                                <div className="absolute top-[4.5rem] right-6 z-20">
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${status.bg} ${status.color} text-[10px] font-black border border-current/10 truncate`}>
                                        {status.icon}
                                        <span className="uppercase tracking-wider">{status.label}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Overlapping Content Container - flex-1, structured layout */}
                            <div className="relative bg-card rounded-t-[3rem] -mt-10 z-30 flex flex-col flex-1 border-t border-border overflow-hidden">
                                {/* Native Sheet Handle */}
                                <div className="w-12 h-1.5 bg-muted/60 rounded-full mx-auto mt-3 mb-2 shrink-0" />

                                {/* Fixed header: profile + tabs */}
                                <div className="px-6 shrink-0">
                                    {/* Compact Profile Header */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-border shrink-0">
                                            <Image
                                                src={booking.provider?.avatar || "/avatars/user2.png?q=80&w=200&auto=format&fit=crop"}
                                                fill
                                                className="object-cover"
                                                alt="Provider"
                                                unoptimized />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5 truncate">{booking.service?.title || "SÉANCE"}</p>
                                            <h1 className="text-lg font-bold text-foreground truncate leading-tight">
                                                {booking.provider?.fullName || t("akwaba.details.booking.labels.provider")}
                                            </h1>
                                            <div className="flex items-center gap-1.5 text-foreground/50">
                                                <Icon icon="solar:verified-check-bold" className="w-3.5 h-3.5 text-emerald-500" />
                                                <span className="text-xs font-semibold">{t("akwaba.details.booking.labels.verified_profile")}</span>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full ${status.bg} ${status.color} text-[10px] font-black uppercase tracking-wider h-fit`}>
                                            {status.label}
                                        </div>
                                    </div>

                                    {/* Tabs (Segmented Control style) */}
                                    <div className="flex bg-muted/60 p-1.5 rounded-sm mb-3">
                                        {["QR Code", "Contenu"].map((tab) => (
                                            <button key={tab} onClick={() => setCurrentTab(tab)}
                                                className={`flex-1 py-2.5 rounded-sm text-[13px] font-black transition-all relative z-10 ${currentTab === tab ? "text-primary" : "text-foreground/50 hover:text-foreground"}`}>
                                                <span className="relative z-20">{tab}</span>
                                                {currentTab === tab && (
                                                    <motion.div
                                                        layoutId="activeTabIndicator"
                                                        className="absolute inset-0 bg-card rounded-sm border border-border/50 z-0"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                                    />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Scrollable Tab Content - only this area scrolls */}
                                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-2">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentTab}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ duration: 0.3 }}
                                        >

                                            {currentTab === "QR Code" && (
                                                <div className="space-y-4 flex flex-col items-center justify-center pb-4">
                                                    {/* Digital Pass Ticket Card */}
                                                    <div className="w-full max-w-[320px] bg-muted/10 rounded-[2.5rem] border border-border overflow-hidden shadow-xl shadow-foreground/5 relative">

                                                        {/* Cutout notches */}
                                                        <div className="absolute top-[110px] -left-5 w-10 h-10 bg-card rounded-full border-r border-border shadow-inner" />
                                                        <div className="absolute top-[110px] -right-5 w-10 h-10 bg-card rounded-full border-l border-border shadow-inner" />

                                                        {/* Dashed line */}
                                                        <div className="absolute top-[130px] left-8 right-8 h-px bg-transparent border-t-2 border-dashed border-border/60" />

                                                        <div className="p-6 pt-8 text-center flex flex-col items-center">
                                                            <h3 className="text-xl font-black text-foreground mb-1">{t("akwaba.details.booking.digital_pass")}</h3>
                                                            <p className="text-[11px] font-bold text-foreground/50 mb-12 max-w-[200px] leading-relaxed">
                                                                {role === "CLIENT"
                                                                    ? t("akwaba.details.booking.scan_instruction_client")
                                                                    : t("akwaba.details.booking.scan_instruction_provider")}
                                                            </p>

                                                            <div className="bg-white p-4 rounded-[2rem] border border-border mb-6 mt-2 relative group">
                                                                <div className="absolute inset-0 bg-primary/10 blur-[30px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                                                                <QRCodeSVG value={role === "CLIENT" ? booking.userQrCode || "" : booking.prestaQrCode || ""} size={140} level="H" includeMargin={false} className="rounded-sm relative z-10" />
                                                            </div>

                                                            <p className="text-sm font-black text-foreground/80 mb-6 w-full truncate px-4">{booking.service?.title || "SÉANCE"}</p>

                                                            <div className="w-full h-px bg-transparent border-t-2 border-dashed border-border/60 mb-4" />

                                                            <div className="flex items-center justify-between w-full text-[11px] font-bold text-foreground/60 px-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Icon icon="solar:calendar-date-bold" className="text-primary" width={16} />
                                                                    <span>{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon icon="solar:clock-circle-bold" className="text-primary" width={16} />
                                                                    <span>{booking.scheduledTime || "—"}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Scanner Button - site primary color */}
                                                    <button
                                                        onClick={() => setIsCameraOpen(true)}
                                                        className="flex items-center gap-3 px-8 py-3.5 bg-primary text-white rounded-sm font-black text-sm active:scale-95 transition-all hover:bg-primary/90 w-full max-w-[320px] justify-center"
                                                    >
                                                        <Icon icon="solar:scanner-bold-duotone" width={22} />
                                                        {t("akwaba.details.booking.scan_button")}
                                                    </button>
                                                </div>
                                            )}

                                            {currentTab === "Contenu" && (
                                                <div className="space-y-4 pb-6">

                                                    {/* Quick Grid Details */}
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="p-4 bg-card rounded-[2rem] border border-border flex flex-col items-center justify-center text-center">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                                                                <Icon icon="solar:calendar-date-bold-duotone" width={22} />
                                                            </div>
                                                            <p className="text-base font-black text-foreground">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short' }) : "—"}</p>
                                                            <p className="text-xs font-bold text-foreground/50 mt-0.5">{booking.scheduledTime || "—"}</p>
                                                        </div>
                                                        <div className="p-4 bg-card rounded-[2rem] border border-border flex flex-col items-center justify-center text-center">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                                                                <Icon icon="solar:hashtag-bold-duotone" width={22} />
                                                            </div>
                                                            <p className="text-sm font-black text-foreground truncate w-full px-2">#{booking.code?.toUpperCase() || "N/A"}</p>
                                                            <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider mt-1">{t("akwaba.details.booking.labels.reservation_id")}</p>
                                                        </div>
                                                    </div>

                                                    {/* Location Info */}
                                                    {booking.service?.location && (
                                                        <div className="p-4 bg-card rounded-[2rem] border border-border flex items-start gap-4">
                                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                <Icon icon="solar:map-point-bold-duotone" width={22} />
                                                            </div>
                                                            <div className="min-w-0 pt-0.5">
                                                                <p className="text-[10px] font-black uppercase text-foreground/40 tracking-widest mb-1">{t("akwaba.details.booking.labels.intervention_address")}</p>
                                                                <p className="text-sm font-bold text-foreground leading-snug">{booking.service.location}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Contact Info */}
                                                    <div className="bg-card rounded-[2rem] border border-border p-2">
                                                        <div className="flex bg-muted/40 p-1.5 rounded-[1.5rem] mb-2">
                                                            <button onClick={() => setActiveTab("provider")} className={`flex-1 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "provider" ? 'bg-card text-primary' : 'text-foreground/50 hover:text-foreground'}`}>
                                                                {t("akwaba.details.booking.labels.provider")}
                                                            </button>
                                                            <button onClick={() => setActiveTab("client")} className={`flex-1 py-2.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === "client" ? 'bg-card text-primary' : 'text-foreground/50 hover:text-foreground'}`}>
                                                                {t("akwaba.details.booking.labels.client")}
                                                            </button>
                                                        </div>

                                                        <div className="p-3 flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                                    <Icon icon={activeTab === "provider" ? "solar:user-bold-duotone" : "solar:users-group-two-rounded-bold-duotone"} width={26} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-base font-black text-foreground truncate">{activeTab === "provider" ? (booking.provider?.fullName || t("akwaba.details.booking.labels.provider")) : (booking.client?.fullName || t("akwaba.details.booking.labels.client"))}</p>
                                                                    <p className="text-xs font-bold text-foreground/50 truncate mt-0.5">{activeTab === "provider" ? (booking.provider?.phone || t("akwaba.details.booking.not_provided")) : (booking.client?.phone || t("akwaba.details.booking.not_provided"))}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0">
                                                                <button onClick={handleCall} className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white active:scale-95 transition-all">
                                                                    <Icon icon="solar:phone-bold" width={18} />
                                                                </button>
                                                                <button onClick={handleWhatsApp} className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white active:scale-95 transition-all">
                                                                    <Icon icon="mingcute:whatsapp-fill" width={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Section Divider */}
                                                    <div className="w-full h-px bg-border" />

                                                    {/* Reviews Section */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-base font-black text-foreground">{t("akwaba.details.booking.tabs.reviews")}</h4>
                                                            {booking.rating && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xl font-black text-foreground">{booking.rating.toFixed(1)}</span>
                                                                    <div className="flex text-amber-500 gap-1">
                                                                        {[1, 2, 3, 4, 5].map(s => (
                                                                            <Icon key={s} icon="solar:star-bold" className={`w-4 h-4 ${s > (booking.rating || 5) ? "text-foreground/20" : ""}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-foreground/40 mb-3">Recent Review</p>

                                                        {booking.comment ? (
                                                            <div className="p-5 rounded-[2rem] bg-card border border-border space-y-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
                                                                        <Icon icon="solar:user-circle-bold-duotone" width={24} className="text-foreground/40" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-foreground">{booking.client?.fullName || "Client"}</p>
                                                                        <p className="text-[10px] font-bold text-foreground/40 mt-0.5">{booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}</p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[13px] text-foreground/80 leading-relaxed font-medium italic">
                                                                    "{booking.comment}"
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 opacity-50 bg-muted/20 rounded-[2rem] border border-border border-dashed">
                                                                <div className="w-14 h-14 rounded-full bg-card flex items-center justify-center">
                                                                    <Icon icon="solar:chat-round-line-bold" width={28} className="text-muted-foreground" />
                                                                </div>
                                                                <p className="text-xs font-bold">{t("akwaba.details.booking.labels.no_reviews")}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Persistent Bottom Footer - outside scroll, always visible */}
                            <div className="shrink-0 px-6 py-4 bg-card/90 backdrop-blur-xl border-t border-foreground/5 z-50 flex items-center justify-between gap-6">
                                <div className="flex flex-col">
                                    {(() => {
                                        const effectivePrice = booking.price || booking.service?.price;
                                        return hasValidPrice(effectivePrice) && (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xl font-black text-foreground">{effectivePrice.toLocaleString()} XOF</span>
                                            </div>
                                        );
                                    })()}
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">{t("akwaba.details.booking.labels.confirmed_availability")}</p>
                                </div>

                                {canEdit && booking.status === BookingStatus.PENDING ? (
                                    <button onClick={() => { if (onEditRdv) { onEditRdv(booking); onClose(); } }} className="flex-1 max-w-[200px] py-3.5 bg-primary text-white rounded-sm font-black text-sm active:scale-95 transition-all hover:bg-primary/90"> {t("akwaba.details.booking.labels.edit")} </button>
                                ) : (
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                                        {status.label}
                                    </span>
                                )}
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
                                    <button onClick={() => setIsCameraOpen(false)}
                                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all">
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
