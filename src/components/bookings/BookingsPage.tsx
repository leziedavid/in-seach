"use client";

import { useEffect, useState } from "react";
import { Booking, BookingStatus } from "@/types/interface";
import { getAllBookings } from "@/api/api";
import { Icon } from "@iconify/react";
import { Button } from "../ui/button";
import AccountBookingRowSkeleton from "./AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import BookingDetail from "../home/BookingDetail";

interface BookingsPageProps {
    data?: Booking[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
}

export default function BookingsPage({
    data: propData,
    page: propPage,
    limit: propLimit = 4,
    total: propTotal,
    totalPages: propTotalPages,
    loading: propLoading,
    onPageChange
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

    /* ================= FETCH (Only if not controlled) ================= */
    const fetchBookings = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getAllBookings({ page, limit });
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
    const handleChangeStatus = (bookingId: string, newStatus: BookingStatus) => {
        setInternalBookings((prev) =>
            prev.map((b) =>
                b.id === bookingId ? { ...b, status: newStatus } : b
            )
        );
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
            <h1 className="text-xl font-bold mb-4">Rendez-vous</h1>

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <AccountBookingRowSkeleton key={i} />
                    ))}

                {/* ========= EMPTY ========= */}
                {!loading && bookings.length === 0 && (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                        Aucun rendez-vous
                    </div>
                )}

                {/* ========= LIST ========= */}
                {!loading && bookings.length > 0 && (
                    <>
                        <div className="space-y-4">
                            {bookings.map((booking) => (
                                <div key={booking.id} className="flex items-center justify-between gap-4 py-3 px-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/50 transition" >
                                    {/* LEFT INFO */}
                                    <div className="flex-1 min-w-0">
                                        <button onClick={() => { handleAction(booking) }} className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline shrink-0 truncate"  >
                                            <Icon icon="solar:eye-bold-duotone" className="w-3.5 h-3.5" />
                                            {booking.service?.title || "Service"}
                                        </button>

                                        <p className="text-xs text-muted-foreground truncate">
                                            {booking.scheduledDate || "Non planifié"} •{" "}
                                            {booking.price ? `${booking.price.toLocaleString()} FCFA` : "-"}
                                        </p>
                                    </div>

                                    {/* RIGHT ACTIONS */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* STATUS BADGE */}
                                        <span
                                            className={`text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap ${getStatusStyle(
                                                booking.status
                                            )}`}
                                        >
                                            {booking.status}
                                        </span>

                                        {/* BUTTONS MINI RESPONSIVE */}
                                        {(booking.status === BookingStatus.PENDING ||
                                            booking.status === BookingStatus.ACCEPTED) && (
                                                <>
                                                    {booking.status === BookingStatus.PENDING && (
                                                        <Button size="icon" className="h-8 w-8 sm:h-9 sm:w-9"
                                                            onClick={() =>
                                                                handleChangeStatus(
                                                                    booking.id,
                                                                    BookingStatus.ACCEPTED
                                                                )
                                                            } >
                                                            <Icon icon="solar:check-circle-bold-duotone" className="w-4 h-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        size="icon"
                                                        variant="destructive"
                                                        className="h-8 w-8 sm:h-9 sm:w-9"
                                                        onClick={() =>
                                                            handleChangeStatus(
                                                                booking.id,
                                                                BookingStatus.CANCELLED
                                                            )
                                                        }
                                                    >
                                                        <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                    </div>
                                </div>
                            ))}
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

