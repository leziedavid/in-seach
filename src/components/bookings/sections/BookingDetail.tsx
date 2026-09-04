"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Booking, BookingStatus, BookingsCalendar } from "@/types/interface";
import { QRCodeSVG } from "qrcode.react";
import { getUserId } from "@/lib/auth";
import jsQR from "jsqr";
import { scanBookingQr } from "@/lib/api";
import { getBookingById } from "@/api/api";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { useTranslation } from "@/utils/langue/hooks";
import { hasValidPrice } from "@/utils/price";
import { Modal } from "@/components/ui/MotionModal";
import { Button } from "@/components/ui/button";
import ConfirmAction from "@/components/ui/ConfirmAction";
import ReportButton from "@/components/shared/ReportButton";
import { useBookingStatusAction } from "@/hooks/useBookingStatusAction";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";


interface BookingDetailProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | BookingsCalendar | null;
    onEditRdv?: (booking: Booking | BookingsCalendar) => void;
}

export default function BookingDetailModal({ isOpen, onClose, booking: initialBooking, onEditRdv }: BookingDetailProps) {
    const { t, language } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [currentTab, setCurrentTab] = useState("QR Code");
    const [activeTab, setActiveTab] = useState<"provider" | "client">("provider");
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Copie locale toujours à jour du booking affiché : synchronisée avec la prop à
    // chaque nouvelle sélection, et rafraîchie en direct (scan QR, événements temps
    // réel) sans dépendre d'un refetch de la liste parente.
    const [liveBooking, setLiveBooking] = useState<Booking | BookingsCalendar | null>(initialBooking);
    const [scanFeedback, setScanFeedback] = useState<"provider" | "client" | null>(null);

    useEffect(() => {
        setLiveBooking(initialBooking);
        setScanFeedback(null);
    }, [initialBooking]);

    useRealTimeUpdate('Booking', (data: any) => {
        if (!liveBooking || data?.entityId !== liveBooking.id) return;
        getBookingById(liveBooking.id)
            .then((res) => { if (res.statusCode === 200 && res.data) setLiveBooking(res.data); })
            .catch(() => { /* on garde le dernier état connu */ });
    });

    const { confirmState, isConfirming, requestAction, closeConfirm, execute } = useBookingStatusAction({
        onChanged: () => onClose(),
    });

    const statusConfig: Record<BookingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        PENDING: { label: t("akwaba.bookings.status.pending"), color: "text-amber-600", bg: "bg-amber-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
        ACCEPTED: { label: t("akwaba.bookings.status.accepted"), color: "text-blue-600", bg: "bg-blue-500/10", icon: <Icon icon="solar:verified-check-bold-duotone" width={16} /> },
        IN_PROGRESS: { label: t("akwaba.bookings.status.in_progress"), color: "text-purple-600", bg: "bg-purple-500/10", icon: <Icon icon="solar:refresh-bold-duotone" className="animate-spin" width={16} /> },
        COMPLETED: { label: t("akwaba.bookings.status.completed"), color: "text-emerald-600", bg: "bg-emerald-500/10", icon: <Icon icon="solar:check-circle-bold-duotone" width={16} /> },
        CANCELLED: { label: t("akwaba.bookings.status.cancelled"), color: "text-red-600", bg: "bg-red-500/10", icon: <Icon icon="solar:close-circle-bold-duotone" width={16} /> },
        PAID: { label: t("akwaba.bookings.status.paid", "PAYÉ"), color: "text-green-600", bg: "bg-green-500/10", icon: <Icon icon="solar:shield-check-bold-duotone" width={16} /> },
    };

    useEffect(() => { setMounted(true); }, []);

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
        try {
            const res: any = await scanBookingQr(qrData);
            const updated = res?.data;
            if (updated) {
                setLiveBooking(updated);
                if (updated.status === "IN_PROGRESS") {
                    setScanFeedback("provider");
                    toast.success(t("akwaba.details.booking.scan_success_provider"));
                } else if (updated.status === "COMPLETED") {
                    setScanFeedback("client");
                    toast.success(t("akwaba.details.booking.scan_success_client"));
                } else {
                    toast.success(t("akwaba.details.booking.scan_success_generic"));
                }
            } else {
                toast.success(t("akwaba.details.booking.scan_success_generic"));
            }
            setIsCameraOpen(false);
        } catch { toast.error("Erreur scan"); } finally { setIsScanning(false); }
    };

    useEffect(() => { if (isCameraOpen) requestAnimationFrame(scanQRCode); }, [isCameraOpen]);

    if (!liveBooking || !mounted) return null;

    // Le reste du composant utilise `booking` — toujours la version la plus à jour.
    const booking = liveBooking;
    const status = statusConfig[booking.status];

    // Rôle réel de l'utilisateur sur CETTE réservation (et non le rôle global du compte).
    // Indispensable pour qu'un PRESTATAIRE qui réserve chez un autre prestataire soit traité
    // comme le CLIENT de cette réservation (bon QR code, bons boutons, mêmes droits).
    const currentUserId = getUserId();
    const isBookingClient = booking.clientId === currentUserId;
    const isBookingProvider =
        booking.providerId === currentUserId ||
        booking.service?.userId === currentUserId ||
        booking.annonce?.userId === currentUserId;

    const canEdit = isBookingClient && (booking.status === "PENDING" || booking.status === "ACCEPTED");
    const canReport = booking.status === BookingStatus.ACCEPTED || booking.status === BookingStatus.IN_PROGRESS;

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


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={booking.service?.title || booking.annonce?.title || t("akwaba.details.booking.title")}>
            <div className="flex flex-col bg-neutral-50 dark:bg-neutral-950 min-h-full">

                {/* Sticky header: profile + tabs */}
                <div className="px-6 pt-4 sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-950">
                    {/* Receipt-style profile row */}
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800 shrink-0 bg-white">
                            <Image
                                src={booking.provider?.avatar || "/avatars/user2.png?q=80&w=200&auto=format&fit=crop"}
                                fill
                                className="object-cover"
                                alt="Provider"
                                unoptimized />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 truncate leading-tight">
                                {booking.provider?.fullName || t("akwaba.details.booking.labels.provider")}
                            </h1>
                            <div className="flex items-center gap-1.5 text-neutral-400">
                                <Icon icon="solar:verified-check-bold" className="w-3 h-3 text-emerald-500" />
                                <span className="text-[11px] font-medium">{t("akwaba.details.booking.labels.verified_profile")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs (Segmented Control style) */}
                    <div className="flex bg-muted/50 p-1 rounded-lg mb-4">
                        {["QR Code", "Contenu"].map((tab) => (
                            <button key={tab} onClick={() => setCurrentTab(tab)}
                                className={`flex-1 py-2 rounded-md text-[13px] font-semibold transition-all relative z-10 ${currentTab === tab ? "text-foreground" : "text-foreground/50 hover:text-foreground"}`}>
                                <span className="relative z-20">{tab}</span>
                                {currentTab === tab && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute inset-0 bg-card rounded-md border border-border shadow-sm z-0"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 px-6 pt-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.3 }}
                        >

                                            {currentTab === "QR Code" && booking.status === BookingStatus.PENDING && (
                                                <div className="space-y-4 flex flex-col items-center pb-8 pt-4">
                                                    <div className="w-full max-w-[360px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 flex flex-col items-center text-center">
                                                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
                                                            <Icon icon="solar:lock-keyhole-bold-duotone" width={32} />
                                                        </div>
                                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{t("akwaba.details.booking.qr_locked_title")}</p>
                                                        <p className="text-sm text-neutral-500 max-w-[280px] leading-relaxed">{t("akwaba.details.booking.qr_locked_desc")}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {currentTab === "QR Code" && (booking.status === BookingStatus.ACCEPTED || booking.status === BookingStatus.IN_PROGRESS) && (
                                                <div className="space-y-4 flex flex-col items-center pb-4">
                                                    {/* Bandeau de confirmation après un scan réussi dans cette session */}
                                                    {scanFeedback === "provider" && (
                                                        <div className="w-full max-w-[360px] p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                                                            <Icon icon="solar:check-circle-bold-duotone" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{t("akwaba.details.booking.scan_success_provider")}</p>
                                                                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-1">{t("akwaba.details.booking.scan_next_step_client")}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Receipt header card - mirrors invoice summary */}
                                                    <div className="w-full max-w-[360px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                                                        <p className="text-sm text-neutral-500">{t("akwaba.details.booking.digital_pass")}</p>
                                                        <div className="flex items-baseline gap-1 mt-1 mb-1">
                                                            {(() => {
                                                                const effectivePrice = booking.price || booking.service?.price || booking.annonce?.price;
                                                                return hasValidPrice(effectivePrice) ? (
                                                                    <span className="text-[2rem] font-bold text-neutral-900 dark:text-neutral-50 leading-none">{effectivePrice.toLocaleString()} XOF</span>
                                                                ) : (
                                                                    <span className="text-[2rem] font-bold text-neutral-900 dark:text-neutral-50 leading-none truncate">{booking.service?.title || booking.annonce?.title || "SÉANCE"}</span>
                                                                );
                                                            })()}
                                                        </div>
                                                        <p className="text-sm text-neutral-500 mb-5">
                                                            {status.label} · {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                                                        </p>

                                                        <div className="border-t border-neutral-100 dark:border-neutral-800 mb-5" />

                                                        <div className="flex flex-col items-center mb-5">
                                                            <div className="bg-white p-3 rounded-xl border border-neutral-200">
                                                                <QRCodeSVG value={isBookingClient ? booking.userQrCode || "" : booking.prestaQrCode || ""} size={130} level="H" includeMargin={false} className="rounded-sm" />
                                                            </div>
                                                            <p className="text-xs text-neutral-400 mt-3 text-center max-w-[260px] leading-relaxed">
                                                                {booking.status === BookingStatus.IN_PROGRESS
                                                                    ? (isBookingClient
                                                                        ? t("akwaba.details.booking.scan_instruction_client_step2")
                                                                        : t("akwaba.details.booking.scan_instruction_provider_step2"))
                                                                    : (isBookingClient
                                                                        ? t("akwaba.details.booking.scan_instruction_client")
                                                                        : t("akwaba.details.booking.scan_instruction_provider"))}
                                                            </p>
                                                        </div>

                                                        <div className="border-t border-neutral-100 dark:border-neutral-800 mb-3" />

                                                        <div className="flex items-center justify-between py-2">
                                                            <span className="text-sm text-neutral-500">{t("akwaba.details.booking.labels.reservation_id")}</span>
                                                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">#{booking.code?.toUpperCase() || "N/A"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between py-2">
                                                            <span className="text-sm text-neutral-500">{language === 'fr' ? 'Heure' : 'Time'}</span>
                                                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{booking.scheduledTime || "—"}</span>
                                                        </div>
                                                    </div>

                                                    {/* Scanner Button - site primary color */}
                                                    <button
                                                        onClick={() => setIsCameraOpen(true)}
                                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold text-sm active:scale-95 transition-all hover:bg-primary/90 w-full max-w-[360px] justify-center"
                                                    >
                                                        <Icon icon="solar:scanner-bold-duotone" width={20} />
                                                        {t("akwaba.details.booking.scan_button")}
                                                    </button>
                                                </div>
                                            )}

                                            {currentTab === "QR Code" && (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) && (
                                                <div className="space-y-4 flex flex-col items-center pb-8 pt-4">
                                                    <div className="w-full max-w-[360px] bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-8 flex flex-col items-center text-center">
                                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${booking.status === BookingStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                                            <Icon icon={booking.status === BookingStatus.COMPLETED ? "solar:check-circle-bold-duotone" : "solar:close-circle-bold-duotone"} width={32} />
                                                        </div>
                                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
                                                            {booking.status === BookingStatus.COMPLETED ? t("akwaba.details.booking.qr_completed_title") : t("akwaba.details.booking.qr_cancelled_title")}
                                                        </p>
                                                        <p className="text-sm text-neutral-500 max-w-[280px] leading-relaxed">
                                                            {booking.status === BookingStatus.COMPLETED ? t("akwaba.details.booking.qr_completed_desc") : t("akwaba.details.booking.qr_cancelled_desc")}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {currentTab === "Contenu" && (
                                                <div className="space-y-4 pb-6">

                                                    {/* Receipt-style line item card */}
                                                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                                                        <p className="text-base font-semibold text-neutral-900 dark:text-neutral-50 mb-1">{t("akwaba.details.booking.labels.reservation_id")} #{booking.code?.toUpperCase() || "N/A"}</p>
                                                        <p className="text-sm text-neutral-500 mb-5">
                                                            {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : "—"}
                                                            {booking.scheduledTime ? ` · ${booking.scheduledTime}` : ""}
                                                        </p>

                                                        <div className="flex items-start justify-between">
                                                            <div className="min-w-0 pr-4">
                                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{booking.service?.title || booking.annonce?.title || "SÉANCE"}</p>
                                                                <p className="text-sm text-neutral-400 mt-0.5">Qty 1</p>
                                                            </div>
                                                            {(() => {
                                                                const effectivePrice = booking.price || booking.service?.price || booking.annonce?.price;
                                                                return hasValidPrice(effectivePrice) && (
                                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 shrink-0">{effectivePrice.toLocaleString()} XOF</span>
                                                                );
                                                            })()}
                                                        </div>

                                                        <div className="border-t border-neutral-100 dark:border-neutral-800 my-4" />

                                                        {(() => {
                                                            const effectivePrice = booking.price || booking.service?.price || booking.annonce?.price;
                                                            if (!hasValidPrice(effectivePrice)) return null;
                                                            return (
                                                                <>
                                                                    <div className="flex items-center justify-between py-1">
                                                                        <span className="text-sm text-neutral-500">Total</span>
                                                                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{effectivePrice.toLocaleString()} XOF</span>
                                                                    </div>
                                                                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-3" />
                                                                    <div className="flex items-center justify-between py-1">
                                                                        <span className="text-sm text-neutral-900 dark:text-neutral-50 font-medium">{t("akwaba.details.booking.labels.confirmed_availability")}</span>
                                                                        <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{effectivePrice.toLocaleString()} XOF</span>
                                                                    </div>
                                                                </>
                                                            );
                                                        })()}

                                                        {booking.service?.location && (
                                                            <>
                                                                <div className="border-t border-neutral-100 dark:border-neutral-800 my-4" />
                                                                <div className="flex items-start justify-between py-1 gap-4">
                                                                    <span className="text-sm text-neutral-500 shrink-0">{t("akwaba.details.booking.labels.intervention_address")}</span>
                                                                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 text-right">{booking.service.location}</span>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Contact Info */}
                                                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                                                        <div className="flex border-b border-neutral-100 dark:border-neutral-800">
                                                            <button onClick={() => setActiveTab("provider")} className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${activeTab === "provider" ? 'text-neutral-900 dark:text-neutral-50 border-neutral-900 dark:border-neutral-50' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}>
                                                                {t("akwaba.details.booking.labels.provider")}
                                                            </button>
                                                            <button onClick={() => setActiveTab("client")} className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 ${activeTab === "client" ? 'text-neutral-900 dark:text-neutral-50 border-neutral-900 dark:border-neutral-50' : 'text-neutral-400 border-transparent hover:text-neutral-600'}`}>
                                                                {t("akwaba.details.booking.labels.client")}
                                                            </button>
                                                        </div>

                                                        <div className="px-5 py-4 flex items-center justify-between">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                                                                    <Icon icon={activeTab === "provider" ? "solar:user-bold-duotone" : "solar:users-group-two-rounded-bold-duotone"} width={22} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50 truncate">{activeTab === "provider" ? (booking.provider?.fullName || t("akwaba.details.booking.labels.provider")) : (booking.client?.fullName || t("akwaba.details.booking.labels.client"))}</p>
                                                                    <p className="text-xs text-neutral-500 truncate mt-0.5">{activeTab === "provider" ? (booking.provider?.phone || t("akwaba.details.booking.not_provided")) : (booking.client?.phone || t("akwaba.details.booking.not_provided"))}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 shrink-0">
                                                                <button onClick={handleCall} className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center hover:bg-primary hover:text-white active:scale-95 transition-all">
                                                                    <Icon icon="solar:phone-bold" width={16} />
                                                                </button>
                                                                <button onClick={handleWhatsApp} className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white active:scale-95 transition-all">
                                                                    <Icon icon="mingcute:whatsapp-fill" width={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Reviews Section */}
                                                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-5">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{t("akwaba.details.booking.tabs.reviews")}</h4>
                                                            {booking.rating && (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-base font-bold text-neutral-900 dark:text-neutral-50">{booking.rating.toFixed(1)}</span>
                                                                    <div className="flex text-amber-500 gap-0.5">
                                                                        {[1, 2, 3, 4, 5].map(s => (
                                                                            <Icon key={s} icon="solar:star-bold" className={`w-3.5 h-3.5 ${s > (booking.rating || 5) ? "text-neutral-200" : ""}`} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {booking.comment ? (
                                                            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden shrink-0">
                                                                        <Icon icon="solar:user-circle-bold-duotone" width={20} className="text-neutral-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{booking.client?.fullName || "Client"}</p>
                                                                        <p className="text-[11px] text-neutral-400 mt-0.5">{booking.updatedAt ? new Date(booking.updatedAt).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : ""}</p>
                                                                    </div>
                                                                </div>
                                                                <p className="text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed italic">
                                                                    "{booking.comment}"
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center py-6 text-center space-y-2 text-neutral-400">
                                                                <Icon icon="solar:chat-round-line-bold" width={24} />
                                                                <p className="text-xs font-medium">{t("akwaba.details.booking.labels.no_reviews")}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Persistent Bottom Footer */}
                <div className="sticky bottom-0 px-6 py-4 bg-card border-t border-border flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                        {(() => {
                            const effectivePrice = booking.price || booking.service?.price || booking.annonce?.price;
                            return hasValidPrice(effectivePrice) && (
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-bold text-foreground">{effectivePrice.toLocaleString()} XOF</span>
                                </div>
                            );
                        })()}
                        {canReport ? (
                            <div className="mt-0.5"><ReportButton entityType="BOOKING" entityId={booking.id} /></div>
                        ) : (
                            <p className="text-[11px] text-foreground/40 mt-0.5">{t("akwaba.details.booking.labels.confirmed_availability")}</p>
                        )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Actions client — annulation possible uniquement avant validation */}
                        {isBookingClient && booking.status === BookingStatus.PENDING && (
                            <Button size="sm" variant="destructive" className="h-9 px-3 text-xs font-black flex items-center gap-1.5"
                                onClick={() => requestAction(booking.id, 'cancel')}>
                                <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("akwaba.bookings.actions.cancel")}</span>
                            </Button>
                        )}

                        {/* Paiement Wallet — client, uniquement une fois la prestation terminée */}
                        {isBookingClient && booking.status === BookingStatus.COMPLETED && !!booking.price && (
                            <Button size="sm" className="h-9 px-3 text-xs font-black bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5"
                                onClick={() => requestAction(booking.id, 'pay')}>
                                <Icon icon="solar:wallet-money-bold" className="w-4 h-4" />
                                <span className="hidden sm:inline">Payer avec mon Wallet</span>
                            </Button>
                        )}

                        {/* Actions prestataire */}
                        {isBookingProvider && booking.status === BookingStatus.PENDING && (
                            <Button size="sm" disabled={isConfirming} className="h-9 px-3 text-xs font-black bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                                onClick={() => requestAction(booking.id, 'validate')}>
                                {isConfirming ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                                <span className="hidden sm:inline">{t("akwaba.bookings.actions.accept")}</span>
                            </Button>
                        )}
                        {isBookingProvider && booking.status === BookingStatus.ACCEPTED && (
                            <Button size="sm" disabled={isConfirming} className="h-9 px-3 text-xs font-black bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                                onClick={() => requestAction(booking.id, 'start')}>
                                {isConfirming ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:play-bold" className="w-4 h-4" />}
                                <span className="hidden sm:inline">{t("akwaba.bookings.actions.start")}</span>
                            </Button>
                        )}
                        {isBookingProvider && booking.status === BookingStatus.IN_PROGRESS && (
                            <Button size="sm" disabled={isConfirming} className="h-9 px-3 text-xs font-black bg-green-600 hover:bg-green-700 flex items-center gap-1.5"
                                onClick={() => requestAction(booking.id, 'finish')}>
                                {isConfirming ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                                <span className="hidden sm:inline">{t("akwaba.bookings.actions.finish")}</span>
                            </Button>
                        )}

                        {/* Édition (client, avant validation) */}
                        {canEdit && booking.status === BookingStatus.PENDING && (
                            <button onClick={() => { if (onEditRdv) { onEditRdv(booking); onClose(); } }} className="h-9 px-4 bg-primary text-white rounded-xl font-semibold text-xs active:scale-95 transition-all hover:bg-primary/90"> {t("akwaba.details.booking.labels.edit")} </button>
                        )}

                        {/* Badge de statut si aucune action disponible, ou processus terminé/annulé */}
                        {((!isBookingClient && !isBookingProvider) || booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) && (
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmAction
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={execute}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                icon={confirmState.icon}
                isLoading={isConfirming}
            />
            {/* Camera Scanner Modal */}
            {mounted && createPortal(
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
                </AnimatePresence>,
                document.body
            )}
        </Modal>
    );
}
