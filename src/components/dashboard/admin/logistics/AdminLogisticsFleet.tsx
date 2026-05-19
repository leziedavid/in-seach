"use client"

import React, { useState, useEffect } from "react"
import { Search, Loader2, Truck, Trash2, Edit2, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { adminGetLogisticsFleet } from "@/api/api"
import { Flote, FloteType, FloteStatus } from "@/types/interface"
import { toast } from "sonner"
import { TablePagination } from "@/components/ui/table/Pagination"
import { useTranslation } from "@/utils/langue/hooks"

export default function AdminLogisticsFleet() {
    const { t } = useTranslation()

    const TYPE_LABELS: Record<FloteType, string> = {
        VEHICULE: t("admin.logistics.fleet_types.VEHICULE"),
        CAMION: t("admin.logistics.fleet_types.CAMION"),
        AVION: t("admin.logistics.fleet_types.AVION"),
        AUTRE: t("admin.logistics.fleet_types.AUTRE"),
    };
    const [fleet, setFleet] = useState<Flote[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const limit = 10

    useEffect(() => {
        fetchFleet()
    }, [page, searchQuery])

    const fetchFleet = async () => {
        try {
            setLoading(true)
            const res = await adminGetLogisticsFleet({ page, limit, search: searchQuery })
            if (res.data) {
                setFleet(res.data.data)
                setTotalPages(res.data.totalPages)
                setTotalItems(res.data.total)
            }
        } catch (error) {
            toast.error(t("admin.logistics.errors.load_fleet"))
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
                        placeholder={t("admin.logistics.placeholders.search_fleet")}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("admin.logistics.counts.fleet", { count: totalItems })}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">{t("common.loading")}</p>
                        </div>
                    ) : fleet.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Truck className="w-12 h-12 text-zinc-300" />
                            <p className="text-zinc-500">{t("common.no_results")}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">{t("admin.logistics.tabs.fleet")}</th>
                                    <th className="px-6 py-4">{t("common.owner")}</th>
                                    <th className="px-6 py-4">{t("common.registration")}</th>
                                    <th className="px-6 py-4">{t("common.status")}</th>
                                    <th className="px-6 py-4 text-right">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {fleet.map((item) => (
                                    <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <Truck className="w-4 h-4 text-zinc-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tighter">
                                                        {TYPE_LABELS[item.type]}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                                {item.compagnie || "N/A"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                                                {item.immatriculation || "---"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.status === FloteStatus.ACTIF ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 text-[10px] font-bold">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    {t("admin.logistics.status.ACTIVE")}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-500 text-[10px] font-bold">
                                                    <AlertCircle className="w-3 h-3" />
                                                    {t("admin.logistics.status.INACTIVE")}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-2 text-zinc-400 hover:text-primary transition-colors hover:bg-primary/10 rounded-lg">
                                                    <Info className="w-4 h-4" />
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
