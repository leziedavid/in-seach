"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/interface";
import { getMyOrders } from "@/api/api";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "../bookings/AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import OrderDetailModal from "./OrderDetailModal";
import ReceiptModal, { ReceiptData } from "../shared/ReceiptModal";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";

export default function HistoriqueCommandes() {
    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [orders, setOrders] = useState<Order[]>([]);
    const [ordersReceived, setOrdersReceived] = useState<Order[]>([]);
    const [ordersPlaced, setOrdersPlaced] = useState<Order[]>([]);
    const [receivedTotalPages, setReceivedTotalPages] = useState(0);
    const [placedTotalPages, setPlacedTotalPages] = useState(0);
    const [activeTab, setActiveTab] = useState<'recues' | 'passees'>('passees'); // Par défaut passées pour l'historique client
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [open, setOpen] = useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await getMyOrders({ page, limit });
            if (response?.statusCode === 200 && response?.data) {
                const { ordersReceived: received, ordersPlaced: placed } = response.data;

                setOrdersReceived(received.data || []);
                setReceivedTotalPages(received.totalPages || 0);

                setOrdersPlaced(placed.data || []);
                setPlacedTotalPages(placed.totalPages || 0);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [page]);

    const displayedOrders = activeTab === 'recues' ? ordersReceived : ordersPlaced;
    const totalPages = activeTab === 'recues' ? receivedTotalPages : placedTotalPages;

    // 🔄 SYNCHRONISATION TEMPS RÉEL
    useRealTimeUpdate('Order', () => {
        fetchOrders();
    });

    const handleViewReceipt = (order: Order) => {
        const data: ReceiptData = {
            title: `Commande #${order.code}`,
            code: order.code,
            date: new Date(order.createdAt).toLocaleDateString(),
            status: order.status,
            statusLabel: order.status === OrderStatus.PAID ? 'PAYÉ' :
                order.status === OrderStatus.PENDING ? 'EN ATTENTE' :
                    order.status === OrderStatus.PROCESSING ? 'EN COURS' :
                        order.status === OrderStatus.VALIDATED ? 'VALIDÉ' :
                            order.status === OrderStatus.SHIPPED ? 'EXPÉDIÉ' :
                                order.status === OrderStatus.DELIVERED ? 'LIVRÉ' :
                                    order.status === OrderStatus.CANCELLED ? 'ANNULÉ' : order.status,
            statusColor: getStatusStyleObj(order.status),
            clientName: order.user?.fullName || "Client Inconnu",
            clientEmail: order.user?.email,
            clientPhone: order.user?.phone,
            items: order.items.map(item => ({
                name: item.product?.name || "Produit inconnu",
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount: order.totalAmount,
            type: 'COMMANDE',
            paymentMethod: order.paymentMethod
        };

        setReceiptData(data);
        setIsReceiptOpen(true);
    };

    const getStatusStyleObj = (status: string) => {
        switch (status) {
            case "PAID":
                return { bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400" };
            case "PENDING":
                return { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400" };
            case "PROCESSING":
                return { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400" };
            case "VALIDATED":
                return { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" };
            case "CANCELLED":
                return { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400" };
            case "SHIPPED":
                return { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" };
            case "DELIVERED":
                return { bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400" };
            default:
                return { bg: "bg-muted", text: "text-muted-foreground" };
        }
    };

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
            <h1 className=" flex gap-2 text-xl sm:text-xl lg:text-2xl font-extrabold tracking-tight text-gray-900 ext-center">
                <Icon icon="solar:history-bold-duotone" className="text-primary w-6 h-6" />
                Historique des Commandes
            </h1>

            {/* TABS */}
            <div className="flex bg-muted/50 p-1 rounded-2xl mb-6 w-full max-w-md">
                <button
                    onClick={() => setActiveTab('recues')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'recues' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Icon icon="solar:cart-download-bold-duotone" width={18} />
                    Commandes reçues
                </button>
                <button
                    onClick={() => setActiveTab('passees')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'passees' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Icon icon="solar:cart-check-bold-duotone" width={18} />
                    Commandes passées
                </button>
            </div>

            <div className="gap-3">
                {loading && Array.from({ length: limit }).map((_, i) => <AccountBookingRowSkeleton key={i} />)}

                {!loading && displayedOrders.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Icon icon="solar:history-broken" className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-black text-card-foreground">
                            {activeTab === 'recues' ? 'Aucune commande reçue' : 'Aucun historique de commande'}
                        </p>
                    </div>
                )}

                {!loading && displayedOrders.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {displayedOrders.map((order) => (
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
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleViewReceipt(order)} className="p-2 bg-slate-50 text-slate-900 rounded-xl transition hover:bg-slate-100 active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm border border-slate-200" title="Voir le reçu" >
                                            <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                                        </button>
                                        <button onClick={() => { setSelectedOrder(order); setOpen(true); }} className="p-2 bg-muted hover:bg-primary hover:text-white rounded-xl transition active:scale-95 shadow-sm">
                                            <Icon icon="solar:eye-bold-duotone" className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className="mt-6">
                                <TablePagination page={page} limit={limit} total={displayedOrders.length} totalPages={totalPages} onPageChange={setPage} />
                            </div>
                        )}
                        <OrderDetailModal isOpen={open} onClose={() => { setOpen(false); setSelectedOrder(null); }} order={selectedOrder} />

                        {/* Receipt Modal */}
                        <ReceiptModal isOpen={isReceiptOpen} onClose={() => { setIsReceiptOpen(false); setReceiptData(null); }} data={receiptData} />
                    </>
                )}
            </div>
        </div>
    );
}