"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Ship, FileText, Truck, Users, LayoutGrid } from "lucide-react"
import { useTranslation } from "@/utils/langue/hooks"
import AdminLogisticsServices from "@/components/dashboard/admin/logistics/AdminLogisticsServices"
import AdminLogisticsQuotes from "@/components/dashboard/admin/logistics/AdminLogisticsQuotes"
import AdminLogisticsDeliveries from "@/components/dashboard/admin/logistics/AdminLogisticsDeliveries"
import AdminLogisticsFleet from "@/components/dashboard/admin/logistics/AdminLogisticsFleet"

export default function AdminLogisticsPage() {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("services")

    const TABS = [
        { id: "services", label: t("admin.logistics.tabs.services"), icon: Ship },
        { id: "quotes", label: t("admin.logistics.tabs.quotes"), icon: FileText },
        { id: "deliveries", label: t("admin.logistics.tabs.deliveries"), icon: Truck },
        { id: "fleet", label: t("admin.logistics.tabs.fleet"), icon: LayoutGrid },
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("admin.logistics.title")}</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("admin.logistics.subtitle")}</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-800">
                {TABS.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                                ${isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="adminLogisticsTab"
                                    className="absolute inset-0 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className={`w-4 h-4 relative z-10 ${isActive ? "text-primary" : ""}`} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <div className="relative min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === "services" && <AdminLogisticsServices />}
                        {activeTab === "quotes" && <AdminLogisticsQuotes />}
                        {activeTab === "deliveries" && <AdminLogisticsDeliveries />}
                        {activeTab === "fleet" && <AdminLogisticsFleet />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}
