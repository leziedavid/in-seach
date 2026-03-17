"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/interface";
import { getMyOrders, updateOrderStatus } from "@/api/api";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "../bookings/AccountBookingRowSkeleton";
import { TablePagination } from "../table/Pagination";
import OrderDetailModal from "./OrderDetailModal";
import { getUserRole } from "@/lib/auth";
import { Role } from "@/types/interface";
import { useNotification } from "../toast/NotificationProvider";
import { Button } from "../ui/button";
import { getUserId } from "@/lib/auth";

interface CommandesProps {
    data?: Order[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
}

export default function Commandes({
    data: propData,
    page: propPage,
    limit: propLimit = 6,
    total: propTotal,
    totalPages: propTotalPages,
    loading: propLoading,
    onPageChange,
    onSuccess
}: CommandesProps) {
    const [internalPage, setInternalPage] = useState(1);
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [internalTotalPages, setInternalTotalPages] = useState(0);
    const [internalOrders, setInternalOrders] = useState<Order[]>([]);
    const [internalLoading, setInternalLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [open, setOpen] = useState(false);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        setUserRole(getUserRole() as Role);
    }, []);

    const loading = propLoading ?? internalLoading;
    const orders = propData ?? internalOrders;
    const totalPages = propTotalPages ?? internalTotalPages;

    const fetchOrders = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getMyOrders({ page, limit });
            if (response?.statusCode === 200 && response?.data) {
                const pagination = response.data as any;
                setInternalOrders(pagination.data || []);
                setInternalTotalPages(pagination.totalPages || 0);
            }
        } finally {
            setInternalLoading(false);
        }
    };

    useEffect(() => {
        if (!propData) {
            fetchOrders();
        }
    }, [page, propData]);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const response = await updateOrderStatus(orderId, newStatus);
            if (response.statusCode === 200) {
                showNotification("Statut mis à jour avec succès", "success");
                if (propData) {
                    onSuccess?.();
                } else {
                    fetchOrders();
                }
            } else {
                showNotification(response.message || "Erreur lors de la mise à jour", "error");
            }
        } catch (error: any) {
            showNotification(error.message || "Erreur de connexion", "error");
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

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setOpen(true);
    };

    return (
        <div className="w-full mx-auto py-4">
            <h1 className="text-xl font-bold mb-4">Mes Commandes</h1>

            <div className="gap-3">
                {/* ========= LOADING ========= */}
                {loading &&
                    Array.from({ length: limit }).map((_, i) => (
                        <AccountBookingRowSkeleton key={i} />
                    ))}

                {/* ========= EMPTY ========= */}
                {!loading && orders.length === 0 && (
                    <div className="py-20 text-center flex flex-col items-center justify-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <div className="p-4 bg-muted/50 rounded-full">
                            <Icon icon="solar:cart-large-minimalistic-broken" className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-black text-card-foreground">Aucune commande</p>
                            <p className="text-xs text-muted-foreground">Vous n'avez pas encore passé de commande dans la boutique.</p>
                        </div>
                    </div>
                )}

                {/* ========= LIST ========= */}
                {!loading && orders.length > 0 && (
                    <>
                        <div className="space-y-3">
                            {orders.map((order) => {
                                const isOrderClient = order.userId === getUserId();
                                // Check if current user is owner of ALL products in this order (simplified for now, or check items)
                                const ownsSomeProducts = order.items?.some(item => item.product?.userId === getUserId());

                                return (
                                    <div key={order.id} className="flex items-center justify-between gap-4 py-4 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all group" >
                                        {/* LEFT INFO */}
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
                                                <p className="text-sm font-black text-card-foreground">
                                                    {order.totalAmount.toLocaleString()} FCFA
                                                </p>
                                                <span className="text-muted-foreground">•</span>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {order.items?.length || 0} article(s)
                                            </p>
                                        </div>

                                        {/* RIGHT ACTIONS */}
                                        <div className="flex items-center gap-2">
                                            {/* Status specific actions */}

                                            {/* 1. Client Actions: Only Cancellation and Payment */}
                                            {isOrderClient && (
                                                <div className="flex items-center gap-2">
                                                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.CANCELLED)}
                                                        >
                                                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Annuler</span>
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.VALIDATED && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.PAID)}
                                                        >
                                                            <Icon icon="solar:wallet-2-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Payer</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* 2. Provider Actions: Status transitions */}
                                            {ownsSomeProducts && (
                                                <div className="flex items-center gap-2">
                                                    {order.status === OrderStatus.PENDING && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-orange-600 hover:bg-orange-700 flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.PROCESSING)}
                                                        >
                                                            <Icon icon="solar:play-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Traiter</span>
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.PROCESSING && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.VALIDATED)}
                                                        >
                                                            <Icon icon="solar:check-read-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Valider</span>
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.PAID && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.SHIPPED)}
                                                        >
                                                            <Icon icon="solar:delivery-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Expédier</span>
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.SHIPPED && (
                                                        <Button
                                                            size="sm"
                                                            className="h-8 px-3 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                                                            onClick={() => handleStatusChange(order.id, OrderStatus.DELIVERED)}
                                                        >
                                                            <Icon icon="solar:box-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Livrer</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            <button onClick={() => handleViewOrder(order)} className="p-2 md:p-3 bg-muted text-card-foreground rounded-xl transition hover:bg-primary hover:text-white active:scale-95 flex items-center gap-2 text-xs font-black shadow-sm" >
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
                                <TablePagination page={page} limit={limit} total={orders.length} totalPages={totalPages} onPageChange={setPage} />
                            </div>
                        )}

                        {/* Order Detail Modal */}
                        <OrderDetailModal isOpen={open} onClose={() => { setOpen(false); setSelectedOrder(null); }} order={selectedOrder} />
                    </>
                )}
            </div>
        </div>
    );
}