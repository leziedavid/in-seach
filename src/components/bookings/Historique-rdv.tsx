"use client";

import { useState, useEffect } from "react";
import { Booking, BookingStatus, Role, BookingsCalendar } from "@/types/interface";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "../bookings/AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import BookingDetail from "../home/BookingDetail";
import { getUserId, getUserRole } from "@/lib/auth";
import ReceiptModal, { ReceiptData } from "../shared/ReceiptModal";
import { getMyBookings } from "@/api/api";
import { useNotification } from "../toast/NotificationProvider";
import BookingModal from "../home/BookingModal";

interface HistoriqueRdvProps {
    type: 'history';
    data: Booking[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    loading: boolean;
    onPageChange: (page: number) => void;
    onSuccess?: () => void;
}

export default function HistoriqueRdv({ data: propData, page: propPage, limit: propLimit = 6, total: propTotal, totalPages: propTotalPages, loading: propLoading, onPageChange, onSuccess: _onSuccess }: HistoriqueRdvProps) {

    const [activeTab, setActiveTab] = useState<'recues' | 'passees'>('recues');
    const [bookingsReceived, setBookingsReceived] = useState<Booking[]>([]);
    const [bookingsPlaced, setBookingsPlaced] = useState<Booking[]>([]);
    const [receivedTotalPages, setReceivedTotalPages] = useState(0);
    const [placedTotalPages, setPlacedTotalPages] = useState(0);

    const [internalPage, setInternalPage] = useState(1);
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [internalLoading, setInternalLoading] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | BookingsCalendar | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

    const userRole: string | null = getUserRole();
    const isPrestataire = userRole === Role.PRESTATAIRE;

    const loading = propLoading ?? internalLoading;
    const bookings = propData ?? (activeTab === 'recues' ? bookingsReceived : bookingsPlaced);
    const totalPages = propTotalPages ?? (activeTab === 'recues' ? receivedTotalPages : placedTotalPages);
    const total = propTotal ?? (bookings.length > 0 ? totalPages * limit : 0);
    const { showNotification } = useNotification();

    const fetchBookings = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getMyBookings({ page, limit });
            if (response?.statusCode === 200 && response?.data) {
                setBookingsReceived(response.data.bookingsReceived.data);
                setReceivedTotalPages(response.data.bookingsReceived.totalPages);
                setBookingsPlaced(response.data.bookingsPlaced.data);
                setPlacedTotalPages(response.data.bookingsPlaced.totalPages);

                if (!isPrestataire && activeTab === 'recues') { setActiveTab('passees'); }
            }
        } finally {
            setInternalLoading(false);
        }
    };

    useEffect(() => {
        if (!propData) {
            fetchBookings();
        }
    }, [page, propData]);

    const handleViewDetail = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const handleViewReceipt = (booking: Booking) => {
        const data: ReceiptData = {
            title: booking.service?.title || booking.annonce?.title || "Prestation",
            code: booking.code || booking.id.slice(0, 8),
            date: booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : new Date().toLocaleDateString(),
            status: booking.status,
            statusLabel: booking.status === BookingStatus.COMPLETED ? 'TERMINÉ' : booking.status === BookingStatus.CANCELLED ? 'ANNULÉ' : booking.status === BookingStatus.PAID ? 'PAYÉ' : booking.status,
            statusColor: getStatusStyle(booking.status),
            clientName: booking.client?.fullName || "Client Inconnu",
            clientPhone: booking.client?.phone,
            providerName: booking.provider?.fullName,
            providerPhone: booking.provider?.phone,
            items: [{
                name: booking.service?.title || booking.annonce?.title || "Prestation",
                quantity: 1,
                price: booking.price || 0
            }],
            totalAmount: booking.price || 0,
            type: 'RDV',
            paymentMethod: booking.status === BookingStatus.PAID ? 'Wallet / Mobile Money' : undefined
        };

        setReceiptData(data);
        setIsReceiptOpen(true);
    };

    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.COMPLETED:
                return { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" };
            case BookingStatus.CANCELLED:
                return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" };
            case BookingStatus.PAID:
                return { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400" };
            default:
                return { bg: "bg-muted", text: "text-muted-foreground" };
        }
    };

    return (
        <div className="w-full mx-auto py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">

                <h1 className=" flex gap-2 text-xl sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900 ext-center">
                    <Icon icon="solar:history-bold-duotone" className="text-primary w-6 h-6" />
                    Historique des Rendez-vous
                </h1>

                {isPrestataire && !propData && (
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border w-fit">
                        <button
                            onClick={() => setActiveTab('recues')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recues'
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon icon="solar:download-square-bold-duotone" className="w-4 h-4" />
                            RDV Reçus
                        </button>
                        <button
                            onClick={() => setActiveTab('passees')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'passees'
                                ? 'bg-background text-primary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Icon icon="solar:upload-square-bold-duotone" className="w-4 h-4" />
                            RDV Passés
                        </button>
                    </div>
                )}
            </div>
            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading &&
                    Array.from({ length: limit }).map((_, i) => (
                        <AccountBookingRowSkeleton key={i} />
                    ))}

                {/* ========= EMPTY ========= */}
                {!loading && bookings.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Icon icon="solar:history-broken" className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-card-foreground">Aucun historique {activeTab === 'recues' ? 'reçu' : 'passé'}</p>
                            <p className="text-xs text-muted-foreground">Vous n&apos;avez pas encore de rendez-vous terminés ou annulés.</p>
                        </div>
                    </div>
                )}

                {/* ========= LIST ========= */}
                {!loading && bookings.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {bookings.map((booking) => {
                                const isClient = booking.clientId === getUserId();
                                return (
                                    <div key={booking.id} className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group" >
                                        {/* LEFT INFO */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{booking.code || booking.id.slice(0, 8)}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(booking.status).bg} ${getStatusStyle(booking.status).text}`}>
                                                    {booking.status === BookingStatus.COMPLETED ? 'TERMINÉ' :
                                                        booking.status === BookingStatus.CANCELLED ? 'ANNULÉ' :
                                                            booking.status === BookingStatus.PAID ? 'PAYÉ' : booking.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-black text-card-foreground truncate">
                                                    {booking.service?.title || booking.annonce?.title || "Prestation"}
                                                </p>
                                                <span className="text-muted-foreground text-xs">•</span>
                                                <p className="text-xs text-muted-foreground">
                                                    {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "Date inconnue"}
                                                </p>
                                            </div>
                                            {/* <p className="text-[10px] text-muted-foreground mt-1">
                                                {isClient ? `Prestataire: ${booking.provider?.fullName || 'N/A'}` : `Client: ${booking.client?.fullName || 'N/A'}`}
                                            </p> */}
                                        </div>

                                        {/* RIGHT ACTIONS */}
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => handleViewReceipt(booking)} className="p-2 bg-slate-50 text-slate-900 rounded-xl transition hover:bg-slate-100 active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm border border-slate-200" title="Voir le reçu" >
                                                <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                                            </button>
                                            <button onClick={() => handleViewDetail(booking)} className="p-2 bg-muted text-card-foreground rounded-xl transition hover:bg-primary hover:text-white active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm"  >
                                                <Icon icon="solar:eye-bold-duotone" className="w-5 h-5" />
                                                <span className="hidden sm:inline">Détails</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="w-full overflow-x-auto mt-6">
                                <TablePagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={onPageChange} />
                            </div>
                        )}

                        {/* Booking Detail Modal */}
                        <BookingDetail
                            isOpen={isModalOpen}
                            onClose={() => { setIsModalOpen(false); setSelectedBooking(null); }}
                            booking={selectedBooking}
                            onEditRdv={(b) => {
                                setSelectedBooking(b);
                                setIsEditModalOpen(true);
                            }}
                        />

                        {/* Booking Edit Modal */}
                        {selectedBooking && (
                            <BookingModal
                                isOpen={isEditModalOpen}
                                onClose={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedBooking(null);
                                    fetchBookings(); // Refresh list after edit
                                }}
                                mode="edit"
                                booking={selectedBooking}
                                item={(selectedBooking.service || selectedBooking.annonce) as any}
                                type={(selectedBooking.bookingType || (selectedBooking.service ? 'SERVICE' : 'ANNONCE')) as 'SERVICE' | 'ANNONCE'}
                            />
                        )}

                        {/* Receipt Modal */}
                        <ReceiptModal isOpen={isReceiptOpen} onClose={() => { setIsReceiptOpen(false); setReceiptData(null); }} data={receiptData} />
                    </>
                )}
            </div>
        </div>
    );
}