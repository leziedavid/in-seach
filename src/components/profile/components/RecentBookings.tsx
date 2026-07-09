"use client"

import { Icon } from "@iconify/react"
import { Booking, BookingStatus } from "@/types/interface"

const BOOKING_STATUS_LABEL: Record<string, string> = {
    [BookingStatus.PENDING]: "EN ATTENTE",
    [BookingStatus.ACCEPTED]: "ACCEPTÉ",
    [BookingStatus.IN_PROGRESS]: "EN COURS",
    [BookingStatus.COMPLETED]: "TERMINÉ",
    [BookingStatus.CANCELLED]: "ANNULÉ",
    [BookingStatus.PAID]: "PAYÉ",
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
    [BookingStatus.PENDING]: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    [BookingStatus.ACCEPTED]: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    [BookingStatus.IN_PROGRESS]: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    [BookingStatus.COMPLETED]: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    [BookingStatus.CANCELLED]: "bg-red-500/10 text-red-600 dark:text-red-400",
    [BookingStatus.PAID]: "bg-green-500/10 text-green-600 dark:text-green-400",
};

interface RecentBookingsProps {
    bookings: Booking[];
    loading: boolean;
    onSelect: (booking: Booking) => void;
    onSeeAll?: () => void;
    /** Détermine le champ affiché comme libellé (service.title vs annonce.title) — défaut "SERVICE" */
    entityType?: 'SERVICE' | 'ANNONCE';
}

export default function RecentBookings({ bookings, loading, onSelect, onSeeAll, entityType = 'SERVICE' }: RecentBookingsProps) {
    const getLabel = (booking: Booking) => (entityType === 'ANNONCE' ? booking.annonce?.title : booking.service?.title) || (entityType === 'ANNONCE' ? "Annonce" : "Service");
    const emptyText = entityType === 'ANNONCE' ? "Aucune réservation reçue pour vos annonces pour le moment" : "Aucune réservation reçue pour le moment";

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">Réservations récentes</h3>
                {onSeeAll && bookings.length > 0 && (
                    <button onClick={onSeeAll} className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                        Voir tout
                        <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {loading && (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />
                    ))}
                </div>
            )}

            {!loading && bookings.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <div className="p-3 bg-muted/50 rounded-full">
                        <Icon icon="solar:clipboard-list-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">{emptyText}</p>
                </div>
            )}

            {!loading && bookings.length > 0 && (
                <div className="space-y-2">
                    {bookings.map((booking) => (
                        <button key={booking.id} onClick={() => onSelect(booking)} className="w-full flex items-center justify-between gap-4 py-3.5 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all text-left" >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{booking.code}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS_STYLE[booking.status] || "bg-muted text-muted-foreground"}`}>
                                        {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-card-foreground truncate">{getLabel(booking)}</p>
                                    {!!booking.price && (
                                        <>
                                            <span className="text-muted-foreground">•</span>
                                            <p className="text-xs text-muted-foreground">{booking.price.toLocaleString()} FCFA</p>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
