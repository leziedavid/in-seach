"use client"

import { Icon } from "@iconify/react"
import { Order } from "@/types/interface"

const ORDER_STATUS_LABEL: Record<string, string> = {
    PENDING: "EN ATTENTE",
    PROCESSING: "EN COURS",
    VALIDATED: "VALIDÉ",
    PAID: "PAYÉ",
    SHIPPED: "EXPÉDIÉ",
    DELIVERED: "LIVRÉ",
    CANCELLED: "ANNULÉ",
};

const ORDER_STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    PROCESSING: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    VALIDATED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PAID: "bg-green-500/10 text-green-600 dark:text-green-400",
    SHIPPED: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    DELIVERED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

interface RecentOrdersProps {
    orders: Order[];
    loading: boolean;
    onSelect: (order: Order) => void;
    onSeeAll?: () => void;
}

export default function RecentOrders({ orders, loading, onSelect, onSeeAll }: RecentOrdersProps) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-foreground">Commandes récentes</h3>
                {onSeeAll && orders.length > 0 && (
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

            {!loading && orders.length === 0 && (
                <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <div className="p-3 bg-muted/50 rounded-full">
                        <Icon icon="solar:cart-large-minimalistic-broken" className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-bold text-muted-foreground">Aucune commande reçue pour le moment</p>
                </div>
            )}

            {!loading && orders.length > 0 && (
                <div className="space-y-2">
                    {orders.map((order) => (
                        <button key={order.id} onClick={() => onSelect(order)} className="w-full flex items-center justify-between gap-4 py-3.5 px-4 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:bg-muted/5 transition-all text-left" >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">#{order.code}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ORDER_STATUS_STYLE[order.status] || "bg-muted text-muted-foreground"}`}>
                                        {ORDER_STATUS_LABEL[order.status] || order.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-black text-card-foreground">{order.totalAmount.toLocaleString()} FCFA</p>
                                    <span className="text-muted-foreground">•</span>
                                    <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
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
