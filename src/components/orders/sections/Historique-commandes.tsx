"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus, SubOrder } from "@/types/interface";
import { getMyOrders } from "@/api/api";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "@/components/bookings/ui/AccountBookingRowSkeleton";
import { TablePagination } from "@/components/ui/table/Pagination";
import OrderDetailModal from "@/components/orders/modals/OrderDetailModal";
import ReceiptModal, { ReceiptData } from "@/components/shared/ReceiptModal";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getUserId } from "@/lib/auth";
import { getOrderStatusStyle, getOrderStatusStyleObj, getOrderStatusBadgeLabel } from "@/components/orders/utils/orderStatus";

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
        // Commande moderne (vendeur, avec SubOrder) : le bon de préparation ne contient
        // que les articles de la sous-commande du vendeur connecté. Commande legacy ou
        // vue "passées" (client) : comportement inchangé, tous les items de l'Order.
        const mySubOrder: SubOrder | undefined = activeTab === 'recues'
            ? order.subOrders?.find(so => so.vendorId === getUserId())
            : undefined;

        const items = mySubOrder ? mySubOrder.items : order.items;
        const totalAmount = mySubOrder ? mySubOrder.totalPrice : order.totalAmount;
        const status = mySubOrder ? mySubOrder.status : order.status;

        const data: ReceiptData = {
            title: `Commande #${order.code}`,
            code: order.code,
            date: new Date(order.createdAt).toLocaleDateString(),
            status,
            statusLabel: getOrderStatusBadgeLabel(status),
            statusColor: getOrderStatusStyleObj(status),
            clientName: order.user?.fullName || "Client Inconnu",
            clientEmail: order.user?.email,
            clientPhone: order.user?.phone,
            items: items.map(item => ({
                name: item.product?.name || "Produit inconnu",
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount,
            type: 'COMMANDE',
            paymentMethod: order.paymentMethod
        };

        setReceiptData(data);
        setIsReceiptOpen(true);
    };

    return (
        <div className="w-full mx-auto py-4">
            <SectionHeader 
                title="Historique des Commandes" 
                subtitle="Retrouvez ici tous les détails de vos transactions passées."
                className="mb-8"
            />

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
                            {displayedOrders.map((order) => {
                                // Vue "reçues" (vendeur) sur une commande moderne : affiche le statut de SA
                                // sous-commande plutôt que le statut global mélangé. Sinon comportement inchangé.
                                const mySubOrder: SubOrder | undefined = activeTab === 'recues'
                                    ? order.subOrders?.find(so => so.vendorId === getUserId())
                                    : undefined;
                                const displayStatus: OrderStatus = mySubOrder ? mySubOrder.status : order.status;

                                return (
                                <div key={order.id} className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all group" >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{order.code}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getOrderStatusStyle(displayStatus)}`}>
                                                {getOrderStatusBadgeLabel(displayStatus)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black text-card-foreground">{order.totalAmount.toLocaleString()} FCFA</p>
                                            <span className="text-muted-foreground text-xs">•</span>
                                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleViewReceipt(order)} className="p-2 bg-slate-50 dark:bg-muted text-slate-900 dark:text-foreground rounded-xl transition hover:bg-slate-100 dark:hover:bg-muted/80 active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm border border-slate-200 dark:border-border" title="Voir le reçu" >
                                            <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                                        </button>
                                        <button onClick={() => { setSelectedOrder(order); setOpen(true); }} className="p-2 bg-muted hover:bg-primary hover:text-white rounded-xl transition active:scale-95 shadow-sm">
                                            <Icon icon="solar:eye-bold-duotone" className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                );
                            })}
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