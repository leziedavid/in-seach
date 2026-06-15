"use client";

import { useEffect, useState } from "react";
import { Order, OrderStatus } from "@/types/interface";
import { getMyOrders, updateOrderStatus } from "@/api/api";
import { Icon } from "@iconify/react";
import AccountBookingRowSkeleton from "@/components/bookings/ui/AccountBookingRowSkeleton";
import { TablePagination } from "@/components/ui/table/Pagination";
import OrderDetailModal from "@/components/orders/modals/OrderDetailModal";
import { getUserRole } from "@/lib/auth";
import { Role } from "@/types/interface";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { Button } from "@/components/ui/button";
import { getUserId } from "@/lib/auth";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";
import { SectionHeader } from "@/components/shared/SectionHeader";
import DriverSelectorModal from "@/components/delivery/modals/DriverSelectorModal";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";

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

export default function Commandes({ data: propData, page: propPage, limit: propLimit = 6, total: propTotal, totalPages: propTotalPages, loading: propLoading, onPageChange, onSuccess }: CommandesProps) {

    const [internalPage, setInternalPage] = useState(1);
    const page = propPage ?? internalPage;
    const limit = propLimit;
    const setPage = onPageChange ?? setInternalPage;

    const [internalLoading, setInternalLoading] = useState(false);
    const [ordersReceived, setOrdersReceived] = useState<Order[]>([]);
    const [ordersPlaced, setOrdersPlaced] = useState<Order[]>([]);
    const [receivedTotalPages, setReceivedTotalPages] = useState(0);
    const [placedTotalPages, setPlacedTotalPages] = useState(0);
    const [activeTab, setActiveTab] = useState<'recues' | 'passees'>('recues');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [open, setOpen] = useState(false);
    const [driverModalOpen, setDriverModalOpen] = useState(false);
    const [orderForDriver, setOrderForDriver] = useState<Order | null>(null);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const { showNotification } = useNotification();
    const { checkFeatureAccess, loading: subscriptionLoading } = useSubscriptionCheck();
    const [isConfirming, setIsConfirming] = useState(false);

    // ── Confirmation dialog state ─────────────────────────────────
    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; orderId: string; newStatus: string; requiresSubscription: boolean; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string; }>({
        isOpen: false, orderId: "", newStatus: "", requiresSubscription: false, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: ""
    });

    const openConfirm = (orderId: string, newStatus: string, requiresSubscription: boolean,
        cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, orderId, newStatus, requiresSubscription, ...cfg });


    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const executeStatusChange = async () => {
        if (isConfirming || !confirmState.isOpen || !confirmState.orderId) return;
        setIsConfirming(true);
        await handleStatusChange(confirmState.orderId, confirmState.newStatus, confirmState.requiresSubscription);
        setIsConfirming(false);
        closeConfirm();
    };

    useEffect(() => {
        setUserRole(getUserRole() as Role);
    }, []);

    const loading = propLoading ?? internalLoading;
    const orders = propData ?? (activeTab === 'recues' ? ordersReceived : ordersPlaced);
    const totalPages = propTotalPages ?? (activeTab === 'recues' ? receivedTotalPages : placedTotalPages);

    // 🔄 SYNCHRONISATION TEMPS RÉEL
    useRealTimeUpdate('Order', () => { if (!propData) fetchOrders(); });

    const fetchOrders = async () => {
        if (propData) return;
        try {
            setInternalLoading(true);
            const response = await getMyOrders({ page, limit });
            if (response?.statusCode === 200 && response?.data) {
                const { ordersReceived: received, ordersPlaced: placed } = response.data;

                setOrdersReceived(received.data || []);
                setReceivedTotalPages(received.totalPages || 0);

                setOrdersPlaced(placed.data || []);
                setPlacedTotalPages(placed.totalPages || 0);
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

    const handleStatusChange = async (orderId: string, newStatus: string, requiresSubscription = false) => {
        if (requiresSubscription) {
            const canProceed = await checkFeatureAccess();
            if (!canProceed) return;
        }

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

    const getMobileHint = (order: Order, isClient: boolean, isSeller: boolean): { text: string; color: string } | null => {
        if (isClient) {
            if (order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING)
                return { text: "Cliquez sur l'icône 🔴 pour annuler la commande", color: "text-red-500" };
        }
        if (isSeller) {
            if (order.status === OrderStatus.PENDING)
                return { text: "Cliquez sur l'icône 🟠 pour accepter la commande", color: "text-orange-500" };
            if (order.status === OrderStatus.VALIDATED)
                return { text: "Cliquez sur l'icône 🔵 pour traiter la commande", color: "text-blue-500" };
            if (order.status === OrderStatus.PROCESSING || order.status === OrderStatus.PAID)
                return { text: "Cliquez sur l'icône 🟣 pour expédier la commande", color: "text-purple-500" };
            if (order.status === OrderStatus.SHIPPED)
                return { text: "Cliquez sur l'icône 📦 pour livrer la commande", color: "text-indigo-500" };
        }
        return null;
    };

    const handleViewOrder = (order: Order) => {
        setSelectedOrder(order);
        setOpen(true);
    };

    return (
        <div className="w-full mx-auto py-4">

            <SectionHeader
                title="Mes Commandes"
                subtitle="Consultez et suivez l'historique de vos commandes passées et reçues."
                className="mb-8"
            />

            {/* TABS */}
            <div className="flex bg-muted/50 p-1 rounded-2xl mb-6 w-full max-w-md">
                <button onClick={() => setActiveTab('recues')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'recues' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon icon="solar:cart-download-bold-duotone" width={18} />
                    Commandes reçues
                </button>
                <button onClick={() => setActiveTab('passees')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'passees' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon icon="solar:cart-check-bold-duotone" width={18} />
                    Commandes passées
                </button>
            </div>

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
                                                <p className="text-sm font-black text-card-foreground">{order.totalAmount.toLocaleString()} FCFA</p>
                                                <span className="text-muted-foreground">•</span>
                                                <p className="text-xs text-muted-foreground">  {new Date(order.createdAt).toLocaleDateString()}  </p>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1">  {order.items?.length || 0} article(s)  </p>
                                            {(() => {
                                                const hint = getMobileHint(order, isOrderClient, ownsSomeProducts);
                                                return hint ? (
                                                    <p className={`text-[8.5px] font-semibold mt-0.5 sm:hidden flex items-center gap-0.5 whitespace-nowrap ${hint.color}`}>
                                                        {hint.text}
                                                        <Icon icon="solar:arrow-right-up-bold" className="w-2.5 h-2.5 shrink-0" />
                                                    </p>
                                                ) : null;
                                            })()}
                                        </div>

                                        {/* RIGHT ACTIONS */}
                                        <div className="flex items-center gap-2">
                                            {/* Status specific actions */}

                                            {/* 1. Client Actions: Only Cancellation and Payment */}
                                            {isOrderClient && (
                                                <div className="flex items-center gap-2">
                                                    {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PROCESSING) && (
                                                        <Button size="sm" variant="destructive" className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5"
                                                            onClick={(e) => { e.stopPropagation(); openConfirm(order.id, OrderStatus.CANCELLED, false, { title: "Annuler la commande", message: "Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.", confirmLabel: "Oui, annuler", variant: "danger", icon: "solar:close-circle-bold-duotone" }); }}>
                                                            <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Annuler la commande</span>
                                                        </Button>
                                                    )}

                                                    {/* {order.status === OrderStatus.VALIDATED && (
                                                        <Button size="sm" className="h-8 px-3 text-[10px] font-black flex items-center gap-1.5" onClick={() => handleStatusChange(order.id, OrderStatus.PAID)} >
                                                            <Icon icon="solar:wallet-2-bold" className="w-4 h-4" />
                                                            <span className="hidden sm:inline">Payer la commande</span>
                                                        </Button>
                                                    )} */}

                                                </div>
                                            )}

                                            {/* 2. Provider Actions: Status transitions — subscription check required */}
                                            {ownsSomeProducts && (
                                                <div className="flex items-center gap-2">
                                                    {order.status === OrderStatus.PENDING && (
                                                        <Button size="sm" disabled={subscriptionLoading} className="h-8 px-3 text-[10px] font-black bg-orange-600 hover:bg-orange-700 flex items-center gap-1.5"
                                                            onClick={(e) => { e.stopPropagation(); openConfirm(order.id, OrderStatus.VALIDATED, true, { title: "Accepter la commande", message: "Confirmez-vous l'acceptation de cette commande ? L'acheteur sera notifié.", confirmLabel: "Oui, accepter", variant: "warning", icon: "solar:bag-check-bold-duotone" }); }}>
                                                            {subscriptionLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:play-bold" className="w-4 h-4" />}
                                                            <span className="hidden sm:inline">Accepter la commande</span>
                                                        </Button>
                                                    )}
                                                    {order.status === OrderStatus.VALIDATED && (
                                                        <Button size="sm" disabled={subscriptionLoading} className="h-8 px-3 text-[10px] font-black bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                                                            onClick={(e) => { e.stopPropagation(); openConfirm(order.id, OrderStatus.PROCESSING, true, { title: "Traiter la commande", message: "Confirmez-vous le début du traitement de cette commande ?", confirmLabel: "Oui, traiter", variant: "info", icon: "solar:settings-bold-duotone" }); }}>
                                                            {subscriptionLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                                                            <span className="hidden sm:inline"> Traiter la commande</span>
                                                        </Button>
                                                    )}

                                                    {/* {order.status === OrderStatus.PROCESSING  && (
                                                        <Button size="sm" disabled={subscriptionLoading} className="h-8 px-3 text-[10px] font-black bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5" onClick={() => handleStatusChange(order.id, OrderStatus.PAID, true)} >
                                                            {subscriptionLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:wallet-2-bold" className="w-4 h-4" />}
                                                            <span className="hidden sm:inline">Traiter la commande</span>
                                                        </Button>
                                                    )} */}

                                                    {order.status === OrderStatus.PROCESSING || order.status === OrderStatus.PAID && (
                                                        <>
                                                            <Button size="sm" disabled={subscriptionLoading} className="h-8 px-3 text-[10px] font-black bg-purple-600 hover:bg-purple-700 flex items-center gap-1.5"
                                                                onClick={(e) => { e.stopPropagation(); openConfirm(order.id, OrderStatus.SHIPPED, true, { title: "Expédier la commande", message: "Confirmez-vous l'expédition de cette commande ? L'acheteur sera notifié.", confirmLabel: "Oui, expédier", variant: "indigo", icon: "solar:delivery-bold-duotone" }); }}>
                                                                {subscriptionLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:delivery-bold" className="w-4 h-4" />}
                                                                <span className="hidden sm:inline">Expédier la commande</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                    {order.status === OrderStatus.SHIPPED && (
                                                        <Button size="sm" disabled={subscriptionLoading} className="h-8 px-3 text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                                                            onClick={(e) => { e.stopPropagation(); openConfirm(order.id, OrderStatus.DELIVERED, true, { title: "Marquer comme livré", message: "Confirmez-vous que cette commande a bien été livrée au client ?", confirmLabel: "Oui, livré", variant: "success", icon: "solar:box-bold-duotone" }); }}>
                                                            {subscriptionLoading ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:box-bold" className="w-4 h-4" />}
                                                            <span className="hidden sm:inline">Commande livrée</span>
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

                        <OrderDetailModal isOpen={open} onClose={() => { setOpen(false); setSelectedOrder(null); }} order={selectedOrder} />
                        {/* Driver Selector Modal */}
                        <DriverSelectorModal isOpen={driverModalOpen} onClose={() => { setDriverModalOpen(false); setOrderForDriver(null); }} orderId={orderForDriver?.id} onSuccess={() => { setDriverModalOpen(false); setOrderForDriver(null); fetchOrders(); }} />
                    </>
                )}
            </div>

            {/* ConfirmAction HORS du bloc conditionnel — sinon loading=true le démonte */}
            <ConfirmAction
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={executeStatusChange}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                icon={confirmState.icon}
                isLoading={isConfirming}
            />
        </div>
    );
}