"use client";

import { useEffect, useState } from "react";
import { Booking, BookingStatus, BookingsCalendar } from "@/types/interface";
import { getAllBookings, getMyBookings, updateBookingStatus } from "@/api/api";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import AccountBookingRowSkeleton from "./AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import BookingDetail from "../home/BookingDetail";
import BookingModal from "../home/BookingModal";
import { useNotification } from "../toast/NotificationProvider";
import { getUserId, getUserRole } from "@/lib/auth";
import { Role } from "@/types/interface";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";

interface BookingsPageProps {
    data?: Booking[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
    bookingType?: 'SERVICE' | 'ANNONCE';
}

export default function BookingsPage({
    data: propData,
    page: propPage,
    limit: propLimit = 4,
    total: propTotal,
    totalPages: propTotalPages,
    loading: propLoading,
    onPageChange,
    onSuccess,
    bookingType }: BookingsPageProps) {

    const [internalPage, setInternalPage] = useState(1);
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [activeTab, setActiveTab] = useState<'recues' | 'passees'>('recues');
    const [bookingsReceived, setBookingsReceived] = useState<Booking[]>([]);
    const [bookingsPlaced, setBookingsPlaced] = useState<Booking[]>([]);
    const [receivedTotalPages, setReceivedTotalPages] = useState(0);
    const [placedTotalPages, setPlacedTotalPages] = useState(0);

    const [internalLoading, setInternalLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<Booking | BookingsCalendar | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [open, setOpen] = useState(false);

    const userRole: string | null = getUserRole();
    const isPrestataire = userRole === Role.PRESTATAIRE;

    const loading = propLoading ?? internalLoading;
    const bookings = propData ?? (activeTab === 'recues' ? bookingsReceived : bookingsPlaced);
    const totalPages = propTotalPages ?? (activeTab === 'recues' ? receivedTotalPages : placedTotalPages);
    const total = propTotal ?? (bookings.length > 0 ? totalPages * limit : 0);
    const { showNotification } = useNotification();

    // 🔄 SYNCHRONISATION TEMPS RÉEL
    useRealTimeUpdate('Booking', () => {
        if (!propData) fetchBookings();
    });

    /* ================= FETCH (Only if not controlled) getAllBookings  ================= */
    const fetchBookings = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getMyBookings({ page, limit, type: bookingType });
            if (response?.statusCode === 200 && response?.data) {
                setBookingsReceived(response.data.bookingsReceived.data);
                setReceivedTotalPages(response.data.bookingsReceived.totalPages);
                setBookingsPlaced(response.data.bookingsPlaced.data);
                setPlacedTotalPages(response.data.bookingsPlaced.totalPages);
                // If not prestataire, only placed bookings matter, set tab to passees
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

    /* ================= STATUS ================= */
    const handleChangeStatus = async (bookingId: string, newStatus: BookingStatus) => {
        try {
            let response;
            if (bookingType === 'ANNONCE') {
                response = await updateBookingStatus(bookingId, newStatus);
            } else {
                response = await updateBookingStatus(bookingId, newStatus);
            }

            if (response.statusCode === 200 || response.statusCode === 201) {
                showNotification("Statut mis à jour avec succès", "success");
                if (propData) {
                    onSuccess?.();
                }
                fetchBookings();
            } else {
                showNotification(response.message || "Erreur lors de la mise à jour", "error");
            }
        } catch (error: any) {
            showNotification(error.message || "Erreur de connexion", "error");
        }

    };

    /* ================= COLORS ================= */
    const getStatusStyle = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.PENDING:
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
            case BookingStatus.ACCEPTED:
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case BookingStatus.IN_PROGRESS:
                return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
            case BookingStatus.COMPLETED:
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case BookingStatus.CANCELLED:
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };


    const handleAction = (row: Booking) => {
        setSelectedService(row);
        setOpen(true);
    }

    /* ================= RENDER ================= */
    return (
        <div className="w-full mx-auto py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-xl font-bold">
                    {bookingType === 'ANNONCE' ? 'Rendez-vous Annonces' : 'Rendez-vous Services'}
                </h1>

                {/* <pre>{JSON.stringify(userRole, null, 2)}</pre> */}

                {isPrestataire && !propData && (
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border w-fit">
                        <button onClick={() => setActiveTab('recues')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'recues' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}  >
                            <Icon icon="solar:download-square-bold-duotone" className="w-4 h-4" />
                            RDV Reçus
                        </button>
                        <button onClick={() => setActiveTab('passees')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'passees' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}  >
                            <Icon icon="solar:upload-square-bold-duotone" className="w-4 h-4" />
                            RDV Passés
                        </button>
                    </div>
                )}
            </div>

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <AccountBookingRowSkeleton key={i} />
                    ))}

                {/* ========= EMPTY ========= */}
                {!loading && bookings.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>Aucun rendez-vous {activeTab === 'recues' ? 'reçu' : 'passé'} {bookingType === 'ANNONCE' ? 'pour vos annonces' : 'pour vos services'}</p>
                    </div>
                )}

                {/* ========= LIST ========= */}
                {!loading && bookings.length > 0 && (
                    <>
                        <div className="space-y-4">
                            {bookings.map((booking) => {
                                const isBookingClient = booking.clientId === getUserId();
                                const isBookingProvider = (booking.service?.userId === getUserId()) || (booking.annonce?.userId === getUserId());

                                return (
                                    <div key={booking.id} className="flex items-center justify-between gap-4 py-3 px-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/50 transition" >
                                        {/* LEFT INFO */}
                                        <div className="flex-1 min-w-0">
                                            <button onClick={() => { handleAction(booking) }} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline shrink-0 truncate"  >
                                                <Icon icon="solar:eye-bold-duotone" className="w-3.5 h-3.5" />
                                                {booking.service?.title || booking.annonce?.title || "Détails"}
                                            </button>

                                            <p className="text-xs text-muted-foreground truncate">
                                                {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "Non planifié"} •{" "}
                                                {booking.price ? `${booking.price.toLocaleString()} FCFA` : "-"}
                                            </p>
                                        </div>

                                        {/* RIGHT ACTIONS */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* STATUS BADGE */}
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${getStatusStyle(booking.status)}`}>
                                                {booking.status === BookingStatus.PENDING ? 'EN ATTENTE' :
                                                    booking.status === BookingStatus.ACCEPTED ? 'ACCEPTÉ' :
                                                        booking.status === BookingStatus.IN_PROGRESS ? 'EN COURS' :
                                                            booking.status === BookingStatus.COMPLETED ? 'TERMINÉ' :
                                                                booking.status === BookingStatus.CANCELLED ? 'ANNULÉ' : booking.status}
                                            </span>

                                            {/* Status specific actions */}
                                            {isBookingClient && (
                                                <div className="flex items-center gap-2">
                                                    {(booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ACCEPTED) && (
                                                        <Button size="sm" variant="destructive" className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5" onClick={() => handleChangeStatus(booking.id, BookingStatus.CANCELLED)} >
                                                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Annuler</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {isBookingProvider && (
                                                <div className="flex items-center gap-2">
                                                    {booking.status === BookingStatus.PENDING && (
                                                        <Button size="sm" className="h-8 px-3 text-[10px] font-black bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5" onClick={() => handleChangeStatus(booking.id, BookingStatus.ACCEPTED)} >
                                                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Accepter</span>
                                                        </Button>
                                                    )}
                                                    {booking.status === BookingStatus.ACCEPTED && (
                                                        <Button size="sm" className="h-8 px-3 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5" onClick={() => handleChangeStatus(booking.id, BookingStatus.IN_PROGRESS)} >
                                                            <Icon icon="solar:play-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Démarrer</span>
                                                        </Button>
                                                    )}
                                                    {booking.status === BookingStatus.IN_PROGRESS && (
                                                        <Button size="sm" className="h-8 px-3 text-[10px] font-black bg-green-600 hover:bg-green-700 flex items-center gap-1.5" onClick={() => handleChangeStatus(booking.id, BookingStatus.COMPLETED)} >
                                                            <Icon icon="solar:check-read-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Terminer</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* PAGINATION */}
                        <div className="w-full overflow-x-auto mt-4">
                            <TablePagination page={page} limit={limit} total={bookings.length} totalPages={totalPages} onPageChange={setPage} />
                        </div>


                        {/* Booking Details Modal */}
                        <BookingDetail 
                            isOpen={!!selectedService} 
                            onClose={() => setSelectedService(null)} 
                            booking={selectedService} 
                            onEditRdv={(b) => {
                                setSelectedService(b);
                                setIsEditModalOpen(true);
                            }}
                        />

                        {/* Booking Edit Modal */}
                        {selectedService && (
                            <BookingModal
                                isOpen={isEditModalOpen}
                                onClose={() => {
                                    setIsEditModalOpen(false);
                                    setSelectedService(null);
                                    fetchBookings(); // Refresh list after edit
                                }}
                                mode="edit"
                                booking={selectedService}
                                item={(selectedService.service || selectedService.annonce) as any}
                                type={(selectedService.bookingType || (selectedService.service ? 'SERVICE' : 'ANNONCE')) as 'SERVICE' | 'ANNONCE'}
                            />
                        )}
                    </>

                )}
            </div>
        </div>
    );
}

