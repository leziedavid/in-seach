"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/interface";
import { getMyOrders } from "@/api/api";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "../bookings/AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import OrderDetailModal from "./OrderDetailModal";

export default function HistoriqueCommandes() {
    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [totalPages, setTotalPages] = useState(0);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [open, setOpen] = useState(false);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getMyOrders({ page, limit });
            if (response?.statusCode === 200 && response?.data) {
                const pagination = response.data as any;
                setOrders(pagination.data || []);
                setTotalPages(pagination.totalPages || 0);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "PAID":
                return "bg-green-500/10 text-green-600 dark:text-green-400";
            case "PENDING":
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
            case "PROCESSING":
                return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
            case "VALIDATED":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
            case "CANCELLED":
                return "bg-red-500/10 text-red-600 dark:text-red-400";
            case "SHIPPED":
                return "bg-purple-500/10 text-purple-600 dark:text-purple-400";
            case "DELIVERED":
                return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    return (
        <div className="w-full mx-auto py-4">
            <h1 className="text-xl font-bold mb-4 italic flex items-center gap-2">
                <Icon icon="solar:history-bold-duotone" className="text-primary" />
                Historique des Commandes
            </h1>

            <div className="gap-3">
                {loading && Array.from({ length: limit }).map((_, i) => <AccountBookingRowSkeleton key={i} />)}

                {!loading && orders.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Icon icon="solar:history-broken" className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-black text-card-foreground">Aucun historique trouvé</p>
                    </div>
                )}

                {!loading && orders.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {orders.map((order) => (
                                <div key={order.id} className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group" >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{order.code}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                                                {order.status === OrderStatus.PAID ? 'PAYÉ' :
                                                    order.status === OrderStatus.PENDING ? 'EN ATTENTE' :
                                                        order.status === OrderStatus.PROCESSING ? 'EN COURS' :
                                                            order.status === OrderStatus.VALIDATED ? 'VALIDÉ' :
                                                                order.status === OrderStatus.SHIPPED ? 'EXPÉDIÉ' :
                                                                    order.status === OrderStatus.DELIVERED ? 'LIVRÉ' :
                                                                        order.status === OrderStatus.CANCELLED ? 'ANNULÉ' : order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-card-foreground">{order.totalAmount.toLocaleString()} FCFA</p>
                                            <span className="text-muted-foreground text-xs">•</span>
                                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { setSelectedOrder(order); setOpen(true); }} className="p-2 bg-muted hover:bg-primary hover:text-white rounded-xl transition active:scale-95 shadow-sm">
                                        <Icon icon="solar:eye-bold-duotone" className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6">
                                <TablePagination page={page} limit={limit} total={orders.length} totalPages={totalPages} onPageChange={setPage} />
                            </div>
                        )}
                        <OrderDetailModal isOpen={open} onClose={() => { setOpen(false); setSelectedOrder(null); }} order={selectedOrder} />
                    </>
                )}
            </div>
        </div>
    );
}