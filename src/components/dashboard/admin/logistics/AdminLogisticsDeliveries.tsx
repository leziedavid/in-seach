"use client"

import React, { useState, useEffect } from "react"
import { Search, Loader2, Truck, Trash2, ExternalLink, MapPin } from "lucide-react"
import { adminGetLogisticsDeliveries } from "@/api/api"
import { Delivery, DeliveryStatus } from "@/types/interface"
import { toast } from "sonner"
import { TablePagination } from "@/components/ui/table/Pagination"
import { useTranslation } from "@/utils/langue/hooks"

export default function AdminLogisticsDeliveries() {
    const { t } = useTranslation()

    const STATUS_LABELS: Record<DeliveryStatus, { label: string, color: string }> = {
        PREPARING: { label: t("admin.logistics.status.PREPARING"), color: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-500" },
        IN_TRANSIT: { label: t("admin.logistics.status.IN_TRANSIT"), color: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-500" },
        AT_CUSTOMS: { label: t("admin.logistics.status.AT_CUSTOMS"), color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-500" },
        OUT_FOR_DELIVERY: { label: t("admin.logistics.status.OUT_FOR_DELIVERY"), color: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-500" },
        DELIVERED: { label: t("admin.logistics.status.DELIVERED"), color: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500" },
        CANCELLED: { label: t("admin.logistics.status.CANCELLED"), color: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500" },
    };
    const [deliveries, setDeliveries] = useState<Delivery[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const limit = 10

    useEffect(() => {
        fetchDeliveries()
    }, [page, searchQuery])

    const fetchDeliveries = async () => {
        try {
            setLoading(true)
            const res = await adminGetLogisticsDeliveries({ page, limit, search: searchQuery })
            if (res.data) {
                setDeliveries(res.data.data)
                setTotalPages(res.data.totalPages)
                setTotalItems(res.data.total)
            }
        } catch (error) {
            toast.error(t("admin.logistics.errors.load_deliveries"))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder={t("admin.logistics.placeholders.search_deliveries")}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("admin.logistics.counts.deliveries", { count: totalItems })}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">{t("common.loading")}</p>
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Truck className="w-12 h-12 text-zinc-300" />
                            <p className="text-zinc-500">{t("common.no_results")}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">{t("common.code")} / Tracking</th>
                                    <th className="px-6 py-4">{t("common.client")}</th>
                                    <th className="px-6 py-4">{t("common.provider")}</th>
                                    <th className="px-6 py-4">{t("common.status")}</th>
                                    <th className="px-6 py-4 text-right">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {deliveries.map((delivery) => (
                                    <tr key={delivery.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-zinc-900 dark:text-white font-mono">
                                                    {delivery.trackingCode}
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {t("common.created_at", { date: new Date(delivery.createdAt).toLocaleDateString() })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                                {delivery.quote?.sender?.fullName || "N/A"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                                {delivery.quote?.prestataire?.companyName || delivery.quote?.prestataire?.fullName || "N/A"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_LABELS[delivery.status].color}`}>
                                                {STATUS_LABELS[delivery.status].label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 text-zinc-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <TablePagination
                            page={page}
                            limit={limit}
                            total={totalItems}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
