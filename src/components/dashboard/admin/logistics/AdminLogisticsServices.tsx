"use client"

import React, { useState, useEffect } from "react"
import { Search, Loader2, Ship, Trash2, Edit2, CheckCircle2, AlertCircle } from "lucide-react"
import { adminGetLogisticsServices } from "@/api/api"
import { LogisticService, TransportType } from "@/types/interface"
import { toast } from "sonner"
import { TablePagination } from "@/components/ui/table/Pagination"
import { useTranslation } from "@/utils/langue/hooks"

export default function AdminLogisticsServices() {
    const { t } = useTranslation()

    const TRANSPORT_LABELS: Record<TransportType, string> = {
        MARITIME: t("admin.logistics.transport.MARITIME"),
        AERIEN: t("admin.logistics.transport.AERIEN"),
        HORS_GABARIT: t("admin.logistics.transport.HORS_GABARIT"),
        SANTE: t("admin.logistics.transport.SANTE"),
        LOGISTIQUE_STOCKAGE: t("admin.logistics.transport.LOGISTIQUE_STOCKAGE"),
        DOUANE: t("admin.logistics.transport.DOUANE"),
    };
    const [services, setServices] = useState<LogisticService[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalItems, setTotalItems] = useState(0)
    const limit = 10

    useEffect(() => {
        fetchServices()
    }, [page, searchQuery])

    const fetchServices = async () => {
        try {
            setLoading(true)
            const res = await adminGetLogisticsServices({ page, limit, search: searchQuery })
            if (res.data) {
                setServices(res.data.data)
                setTotalPages(res.data.totalPages)
                setTotalItems(res.data.total)
            }
        } catch (error) {
            toast.error(t("admin.logistics.errors.load_services"))
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
                        placeholder={t("admin.logistics.placeholders.search_services")}
                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setPage(1)
                        }}
                    />
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("admin.logistics.counts.services", { count: totalItems })}
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">{t("common.loading")}</p>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Ship className="w-12 h-12 text-zinc-300" />
                            <p className="text-zinc-500">{t("common.no_results")}</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">{t("admin.logistics.tabs.services")}</th>
                                    <th className="px-6 py-4">{t("common.company")}</th>
                                    <th className="px-6 py-4">{t("admin.logistics.tabs.fleet")}</th>
                                    <th className="px-6 py-4">{t("common.status")}</th>
                                    <th className="px-6 py-4 text-right">{t("common.actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {services.map((service) => (
                                    <tr key={service.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                                                    {service.label}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 line-clamp-1">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                                                {service.company?.companyName || service.company?.fullName || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                                                {TRANSPORT_LABELS[service.transportType]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {service.isActive ? (
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
                                                    <Edit2 className="w-4 h-4" />
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
