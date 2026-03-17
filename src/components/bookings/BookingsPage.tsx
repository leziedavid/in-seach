"use client";

import { useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/types/interface";
import { getAllBookings, updateBookingStatus } from "@/api/api";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import AccountBookingRowSkeleton from "./AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import BookingDetail from "../home/BookingDetail";
import { useNotification } from "../toast/NotificationProvider";
import { getUserId } from "@/lib/auth";

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
    bookingType
}: BookingsPageProps) {
    const [internalPage, setInternalPage] = useState(1);
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [internalTotalPages, setInternalTotalPages] = useState(0);
    const [internalBookings, setInternalBookings] = useState<Booking[]>([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<Booking | null>(null);
    const [open, setOpen] = useState(false);

    const loading = propLoading ?? internalLoading;
    const bookings = propData ?? internalBookings;
    const totalPages = propTotalPages ?? internalTotalPages;
    const total = propTotal ?? (bookings.length > 0 ? totalPages * limit : 0);
    const { showNotification } = useNotification();

    /* ================= FETCH (Only if not controlled) ================= */
    const fetchBookings = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getAllBookings({ page, limit, type: bookingType });
            if (response?.statusCode === 200 && response?.data?.data) {
                setInternalBookings(response.data.data);
                setInternalTotalPages(Math.ceil(response.data.total / limit));
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

            if (response.statusCode === 200) {
                showNotification("Statut mis à jour avec succès", "success");
                if (propData) {
                    onSuccess?.();
                } else {
                    fetchBookings();
                }
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
            <h1 className="text-xl font-bold mb-4">
                {bookingType === 'ANNONCE' ? 'Rendez-vous Annonces' : 'Rendez-vous Services'}
            </h1>

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <AccountBookingRowSkeleton key={i} />
                    ))}

                {/* ========= EMPTY ========= */}
                {!loading && bookings.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Aucun rendez-vous {bookingType === 'ANNONCE' ? 'pour vos annonces' : 'pour vos services'}
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
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5"
                                                            onClick={() => handleChangeStatus(booking.id, BookingStatus.CANCELLED)}
                                                        >
                                                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Annuler</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {isBookingProvider && (
                                                <div className="flex items-center gap-2">
                                                    {booking.status === BookingStatus.PENDING && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                                                            onClick={() => handleChangeStatus(booking.id, BookingStatus.ACCEPTED)}
                                                        >
                                                            <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Accepter</span>
                                                        </Button>
                                                    )}
                                                    {booking.status === BookingStatus.ACCEPTED && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                                                            onClick={() => handleChangeStatus(booking.id, BookingStatus.IN_PROGRESS)}
                                                        >
                                                            <Icon icon="solar:play-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Démarrer</span>
                                                        </Button>
                                                    )}
                                                    {booking.status === BookingStatus.IN_PROGRESS && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-green-600 hover:bg-green-700 flex items-center gap-1.5"
                                                            onClick={() => handleChangeStatus(booking.id, BookingStatus.COMPLETED)}
                                                        >
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


                        {/* Booking Modal */}
                        <BookingDetail isOpen={!!selectedService} onClose={() => setSelectedService(null)} booking={selectedService} />
                    </>

                )}
            </div>
        </div>
    );
}

