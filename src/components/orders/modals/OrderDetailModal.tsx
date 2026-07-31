"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Order, OrderItem, OrderStatus, SubOrder } from "@/types/interface";
import ReturnRequestModal from "@/components/returns/modals/ReturnRequestModal";
import { Modal } from "@/components/ui/MotionModal";
import { ORDER_STATUS_DETAIL_CONFIG } from "@/components/orders/utils/orderStatus";
import { getUserId } from "@/lib/auth";
import { removeSubOrderItems } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import ConfirmAction from "@/components/ui/ConfirmAction";

interface OrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    /** Appelé après un retrait d'article réussi, pour que le parent rafraîchisse ses données. */
    onItemRemoved?: () => void;
}

const statusConfig = ORDER_STATUS_DETAIL_CONFIG;

function InfoRow({ label, value }: { icon?: string; label: string; value?: string | null }) {
    if (!value?.trim()) return null;
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-sm text-neutral-500 shrink-0">{label}</span>
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50 text-right break-words">{value}</span>
        </div>
    );
}

export default function OrderDetailModal({ isOpen, onClose, order, onItemRemoved }: OrderDetailModalProps) {
    const [mounted, setMounted] = useState(false);
    const [returnItem, setReturnItem] = useState<OrderItem | null>(null);
    const [removingItem, setRemovingItem] = useState<{ subOrderId: string; item: OrderItem } | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);
    const { showNotification } = useNotification();

    useEffect(() => { setMounted(true); }, []);

    if (!order || !mounted) return null;

    // Commande moderne (avec SubOrder) : le retour est possible dès que LA sous-commande
    // du vendeur concerné est livrée, même si d'autres vendeurs de la même commande ne le
    // sont pas encore. Commande legacy (sans SubOrder) : comportement inchangé (order.status).
    const canReturnFor = (subOrderStatus?: OrderStatus) => (subOrderStatus ?? order.status) === OrderStatus.DELIVERED;

    const handleConfirmRemove = async () => {
        if (!removingItem || isRemoving) return;
        setIsRemoving(true);
        try {
            const res = await removeSubOrderItems(removingItem.subOrderId, [removingItem.item.id]);
            if (res.statusCode === 200) {
                showNotification("Article retiré avec succès", "success");
                onItemRemoved?.();
            } else {
                showNotification(res.message || "Erreur lors du retrait", "error");
            }
        } catch (error: any) {
            showNotification(error.message || "Erreur de connexion", "error");
        } finally {
            setIsRemoving(false);
            setRemovingItem(null);
        }
    };

    const renderItemRow = (item: OrderItem, canReturnItem: boolean, canRemoveItem: boolean = false, subOrderId?: string) => (
        <div key={item.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                    {item.product?.imageUrl ? (
                        <Image src={item.product.imageUrl} fill className="object-cover" alt={item.product.name} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400"><Icon icon="solar:box-bold-duotone" width={24} /></div>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${item.removed ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-50"}`}>{item.product?.name || "Produit inconnu"}</p>
                    <p className="text-sm text-neutral-400 mt-0.5">Qty {item.quantity}</p>
                    {item.accompagnementName && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                            Accompagnement : {item.accompagnementName}
                            {!!item.accompagnementSupplement && ` (+${item.accompagnementSupplement.toLocaleString()} FCFA)`}
                        </p>
                    )}
                    {!!item.extras?.length && (
                        <p className="text-xs text-neutral-400 mt-0.5">
                            {item.extras.map(e => `+ ${e.name} (+${e.supplementPrice.toLocaleString()} FCFA)`).join(', ')}
                        </p>
                    )}
                </div>
                <span className={`text-sm font-medium shrink-0 ${item.removed ? "line-through text-neutral-400" : "text-neutral-900 dark:text-neutral-50"}`}>{(item.price * item.quantity).toLocaleString()} FCFA</span>
            </div>
            {item.removed ? (
                <p className="mt-2 text-[10px] font-semibold text-red-500 flex items-center gap-1">
                    <Icon icon="solar:close-circle-bold" width={12} />
                    Article retiré{item.removedAt ? ` le ${new Date(item.removedAt).toLocaleDateString()}` : ""}
                </p>
            ) : (
                <>
                    {canReturnItem && (
                        <button onClick={() => setReturnItem(item)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all text-xs font-semibold active:scale-95">
                            <Icon icon="solar:refresh-back-bold-duotone" className="w-3.5 h-3.5" />
                            Retourner l&apos;article
                        </button>
                    )}
                    {canRemoveItem && subOrderId && (
                        <button onClick={() => setRemovingItem({ subOrderId, item })} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all text-xs font-semibold active:scale-95">
                            <Icon icon="solar:trash-bin-minimalistic-bold-duotone" className="w-3.5 h-3.5" />
                            Retirer l&apos;article (indisponible)
                        </button>
                    )}
                </>
            )}
        </div>
    );

    const { user } = order as any;
    const hasDeliveryInfo = user && (user.deliveryAddress || user.deliveryCity || user.deliveryFullName);
    const effectivePhone = user?.usePersonalPhone ? user?.phone : (user?.deliveryPhone || user?.phone);
    const effectiveName = user?.deliveryFullName || user?.fullName;

    const returnModal = returnItem ? (
        <ReturnRequestModal isOpen={!!returnItem} onClose={() => setReturnItem(null)} orderId={order.id} item={returnItem} onSuccess={() => setReturnItem(null)} />
    ) : null;

    const status = statusConfig[order.status] || statusConfig.PENDING;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title="Détail de la commande">
                <div className="flex flex-col bg-neutral-50 dark:bg-neutral-950 min-h-full px-6 py-4 space-y-4">

                    {/* Receipt header card - order summary */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                        <p className="text-sm text-neutral-500">Commande</p>
                        <p className="text-[2rem] font-bold text-neutral-900 dark:text-neutral-50 leading-none mt-1 mb-1">#{order.code.toUpperCase()}</p>
                        <p className="text-sm text-neutral-500 mb-5 flex items-center gap-1.5">
                            <Icon icon={status.icon} width={14} className={status.color} />
                            {status.label} · {new Date(order.createdAt).toLocaleDateString()}
                        </p>

                        <div className="border-t border-neutral-100 dark:border-neutral-800 mb-1" />

                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            <div className="flex items-center justify-between py-3">
                                <span className="text-sm text-neutral-500">Date</span>
                                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-50">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between py-3">
                                <span className="text-sm text-neutral-500">Total</span>
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{order.totalAmount.toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    </div>

                    {/* Bloc client + livraison — visible si les données user sont incluses */}
                    {user && (
                        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm divide-y divide-neutral-100 dark:divide-neutral-800">
                            {/* Infos client */}
                            <div className="px-6 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">Informations client</p>
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <InfoRow label="Nom" value={user.fullName} />
                                    <InfoRow label="Email" value={user.email} />
                                    <InfoRow label="Téléphone" value={user.indicatif ? `${user.indicatif} ${user.phone}` : user.phone} />
                                </div>
                            </div>

                            {/* Infos livraison */}
                            <div className="px-6 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-1">Informations de livraison</p>
                                {hasDeliveryInfo ? (
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        <InfoRow label="Destinataire" value={effectiveName} />
                                        <InfoRow label="Téléphone de livraison" value={effectivePhone} />
                                        <InfoRow label="Adresse" value={user.deliveryAddress} />
                                        <InfoRow label="Ville" value={user.deliveryCity} />
                                        <InfoRow label="Commune / Quartier" value={user.deliveryDistrict} />
                                        <InfoRow label="Repère" value={user.deliveryLandmark} />
                                        <InfoRow label="Instructions" value={user.deliveryInstructions} />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 py-2 text-neutral-400">
                                        <Icon icon="solar:info-circle-bold-duotone" width={15} className="shrink-0" />
                                        <p className="text-xs">Aucune adresse de livraison renseignée par le client.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Items List - receipt line items */}
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Articles ({order.items?.length || 0})</p>

                        {order.subOrders && order.subOrders.length > 0 ? (
                            // Commande moderne : regroupement visuel par vendeur (SubOrder), chacun avec son propre statut.
                            <div className="space-y-5">
                                {order.subOrders.map((subOrder: SubOrder) => {
                                    const subStatus = statusConfig[subOrder.status] || statusConfig.PENDING;
                                    // Un même vendeur peut posséder plusieurs restaurants — le nom du restaurant précis
                                    // (quand présent) distingue mieux la provenance que storeName/fullName seuls.
                                    const vendorLabel = subOrder.restaurant?.name || subOrder.vendor?.storeName || subOrder.vendor?.fullName || "Vendeur";
                                    const isMyVendorSubOrder = subOrder.vendorId === getUserId();
                                    const canRemoveFromThisSubOrder = isMyVendorSubOrder
                                        && subOrder.status !== OrderStatus.CANCELLED
                                        && subOrder.status !== OrderStatus.DELIVERED;
                                    return (
                                        <div key={subOrder.id} className="border border-neutral-100 dark:border-neutral-800 rounded-xl overflow-hidden">
                                            <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/50">
                                                <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-200 flex items-center gap-1.5">
                                                    <Icon icon={subOrder.restaurant ? "solar:chef-hat-bold-duotone" : "solar:shop-bold-duotone"} width={15} />
                                                    {vendorLabel}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${subStatus.bg} ${subStatus.color}`}>
                                                    {subStatus.label}
                                                </span>
                                            </div>
                                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800 px-4">
                                                {subOrder.items.map((item) => renderItemRow(item, canReturnFor(subOrder.status), canRemoveFromThisSubOrder, subOrder.id))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // Commande legacy (sans SubOrder) : rendu à plat inchangé.
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {order.items?.map((item: OrderItem) => renderItemRow(item, canReturnFor()))}
                            </div>
                        )}

                        <div className="border-t border-neutral-100 dark:border-neutral-800 mt-4 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-900 dark:text-neutral-50 font-medium">Total</span>
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">{order.totalAmount.toLocaleString()} FCFA</span>
                            </div>
                        </div>
                    </div>

                    <button onClick={onClose} className="w-full py-3.5 bg-card hover:bg-accent text-card-foreground border border-border rounded-xl font-semibold text-sm active:scale-95 transition-all">Fermer</button>
                </div>
            </Modal>
            {returnModal}
            <ConfirmAction
                isOpen={!!removingItem}
                onClose={() => setRemovingItem(null)}
                onConfirm={handleConfirmRemove}
                title="Retirer l'article"
                message={`Confirmez-vous le retrait de « ${removingItem?.item.product?.name || "cet article"} » ? Le client sera notifié. Cette action est irréversible.`}
                confirmLabel="Oui, retirer"
                variant="warning"
                icon="solar:trash-bin-minimalistic-bold-duotone"
                isLoading={isRemoving}
            />
        </>
    );
}
