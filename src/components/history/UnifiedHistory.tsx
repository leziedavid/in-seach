"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Order, OrderStatus, Booking, BookingStatus, GasDelivery, GasDeliveryStatus } from "@/types/interface";
import { getMyActivityHistory, ActivityHistoryType, ActivityHistoryBookingType } from "@/api/api";
import AccountBookingRowSkeleton from "@/components/bookings/ui/AccountBookingRowSkeleton";
import { TablePagination } from "@/components/ui/table/Pagination";
import { SectionHeader } from "@/components/shared/SectionHeader";
import OrderDetailModal from "@/components/orders/modals/OrderDetailModal";
import BookingDetail from "@/components/bookings/sections/BookingDetail";

const LIMIT = 6;

const FILTERS: { key: ActivityHistoryType; label: string; icon: string }[] = [
    { key: "commandes", label: "Commandes", icon: "solar:cart-large-bold-duotone" },
    { key: "booking", label: "Booking", icon: "solar:clipboard-list-bold-duotone" },
    { key: "gas-delivery", label: "Gaz", icon: "solar:fire-bold-duotone" },
];

const BOOKING_SUB_FILTERS: { key: ActivityHistoryBookingType; label: string; icon: string }[] = [
    { key: "SERVICE", label: "Services", icon: "solar:box-bold-duotone" },
    { key: "ANNONCE", label: "Annonces", icon: "solar:eye-bold-duotone" },
];

const ORDER_STATUS_STYLE: Record<string, string> = {
    PAID: "bg-green-500/10 text-green-600 dark:text-green-400",
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    PROCESSING: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    VALIDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
    SHIPPED: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    DELIVERED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
    PAID: "PAYÉ", PENDING: "EN ATTENTE", PROCESSING: "EN COURS", VALIDATED: "VALIDÉ",
    CANCELLED: "ANNULÉ", SHIPPED: "EXPÉDIÉ", DELIVERED: "LIVRÉ",
};

const BOOKING_STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    ACCEPTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    IN_PROGRESS: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    COMPLETED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
    PAID: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const BOOKING_STATUS_LABEL: Record<string, string> = {
    PENDING: "EN ATTENTE", ACCEPTED: "ACCEPTÉ", IN_PROGRESS: "EN COURS",
    COMPLETED: "TERMINÉ", CANCELLED: "ANNULÉ", PAID: "PAYÉ",
};

const GAS_STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    ACCEPTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    DELIVERED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const GAS_STATUS_LABEL: Record<string, string> = {
    PENDING: "EN ATTENTE", ACCEPTED: "ACCEPTÉE", DELIVERED: "LIVRÉE", CANCELED: "ANNULÉE",
};

export default function UnifiedHistory() {
    const [filterType, setFilterType] = useState<ActivityHistoryType>("commandes");
    const [bookingSubType, setBookingSubType] = useState<ActivityHistoryBookingType>("SERVICE");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [orders, setOrders] = useState<Order[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [gasDeliveries, setGasDeliveries] = useState<GasDelivery[]>([]);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

    useEffect(() => {
        setPage(1);
    }, [filterType, bookingSubType]);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await getMyActivityHistory({
                    type: filterType,
                    bookingType: filterType === "booking" ? bookingSubType : undefined,
                    page,
                    limit: LIMIT,
                });
                if (res.statusCode === 200 && res.data) {
                    if (filterType === "commandes") setOrders(res.data.data as Order[]);
                    else if (filterType === "booking") setBookings(res.data.data as Booking[]);
                    else setGasDeliveries(res.data.data as GasDelivery[]);
                    setTotal(res.data.total || 0);
                    setTotalPages(res.data.totalPages || 0);
                } else {
                    setTotal(0);
                    setTotalPages(0);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [filterType, bookingSubType, page]);

    const items = filterType === "commandes" ? orders : filterType === "booking" ? bookings : gasDeliveries;

    return (
        <div className="w-full mx-auto py-4">
            <SectionHeader
                title="Mes courses et commandes"
                subtitle="Retrouvez l'historique de toutes vos activités : commandes, réservations et livraisons de gaz."
                className="mb-6"
            />

            {/* Filtres principaux */}
            <div className="flex bg-muted/50 p-1 rounded-2xl mb-4 w-full max-w-lg">
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFilterType(f.key)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${filterType === f.key ? "bg-white dark:bg-zinc-800 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Icon icon={f.icon} width={16} />
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Sous-filtres Booking : Services / Annonces */}
            {filterType === "booking" && (
                <div className="flex gap-2 mb-4">
                    {BOOKING_SUB_FILTERS.map(sf => (
                        <button
                            key={sf.key}
                            onClick={() => setBookingSubType(sf.key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${bookingSubType === sf.key ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"}`}
                        >
                            <Icon icon={sf.icon} width={16} />
                            {sf.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading && Array.from({ length: LIMIT }).map((_, i) => <AccountBookingRowSkeleton key={i} />)}

                {/* ========= EMPTY ========= */}
                {!loading && items.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Icon icon="solar:history-broken" className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-black text-card-foreground">Aucun historique pour le moment</p>
                    </div>
                )}

                {/* ========= LISTE COMMANDES ========= */}
                {!loading && filterType === "commandes" && orders.length > 0 && (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <button key={order.id} onClick={() => { setSelectedOrder(order); setIsOrderModalOpen(true); }} className="w-full flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all text-left">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{order.code}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS_STYLE[order.status] || "bg-muted text-muted-foreground"}`}>
                                            {ORDER_STATUS_LABEL[order.status] || order.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-card-foreground">{order.totalAmount.toLocaleString()} FCFA</p>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ========= LISTE BOOKING ========= */}
                {!loading && filterType === "booking" && bookings.length > 0 && (
                    <div className="space-y-3">
                        {bookings.map(booking => (
                            <button key={booking.id} onClick={() => { setSelectedBooking(booking); setIsBookingModalOpen(true); }} className="w-full flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all text-left">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{booking.code || booking.id.slice(0, 8)}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${BOOKING_STATUS_STYLE[booking.status] || "bg-muted text-muted-foreground"}`}>
                                            {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-black text-card-foreground truncate">{booking.service?.title || booking.annonce?.title || "Prestation"}</p>
                                        <span className="text-muted-foreground text-xs">•</span>
                                        <p className="text-xs text-muted-foreground">{booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : "Date inconnue"}</p>
                                    </div>
                                </div>
                                <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-muted-foreground shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {/* ========= LISTE GAZ ========= */}
                {!loading && filterType === "gas-delivery" && gasDeliveries.length > 0 && (
                    <div className="space-y-3">
                        {gasDeliveries.map(delivery => (
                            <div key={delivery.id} className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                        <Icon icon="solar:fire-bold-duotone" className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${GAS_STATUS_STYLE[delivery.status] || "bg-muted text-muted-foreground"}`}>
                                                {GAS_STATUS_LABEL[delivery.status] || delivery.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-card-foreground truncate">{delivery.bottle?.brand} — {delivery.bottle?.weight}kg</p>
                                        {delivery.provider && <p className="text-xs text-muted-foreground truncate">Livré par {delivery.provider.companyName}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PAGINATION */}
                {!loading && totalPages > 1 && (
                    <div className="w-full overflow-x-auto mt-6">
                        <TablePagination page={page} limit={LIMIT} total={total} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <OrderDetailModal isOpen={isOrderModalOpen} onClose={() => { setIsOrderModalOpen(false); setSelectedOrder(null); }} order={selectedOrder} />
            <BookingDetail isOpen={isBookingModalOpen} onClose={() => { setIsBookingModalOpen(false); setSelectedBooking(null); }} booking={selectedBooking} />
        </div>
    );
}
