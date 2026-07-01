'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminGetUsers, adminGetProducts, adminGetServices, adminGetAnnonces, getAdminLogs } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { AdminLog } from '@/types/interface';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from "@/utils/langue/hooks";

const LOGS_LIMIT = 10;

const weeklyData = (t: any) => [
    { day: t("admin.dashboard.weekly.sun"), primary: 30000, secondary: 19000 },
    { day: t("admin.dashboard.weekly.mon"), primary: 38000, secondary: 28000 },
    { day: t("admin.dashboard.weekly.tue"), primary: 43000, secondary: 32000 },
    { day: t("admin.dashboard.weekly.wed"), primary: 29000, secondary: 22000 },
    { day: t("admin.dashboard.weekly.thu"), primary: 35000, secondary: 26000 },
    { day: t("admin.dashboard.weekly.fri"), primary: 49000, secondary: 38000 },
    { day: t("admin.dashboard.weekly.sat"), primary: 50000, secondary: 43000 },
];

const QUICK_LINKS = [
    { href: '/admin/products', icon: 'solar:shop-bold-duotone',                   color: '#10B981', label: 'Ratio ventes / catalogue' },
    { href: '/admin/services', icon: 'solar:medal-ribbon-bold-duotone',            color: '#8B5CF6', label: 'Meilleurs prestataires' },
    { href: '/admin/kpi',      icon: 'solar:chart-2-bold-duotone',                 color: '#3B82F6', label: 'Analytics & KPI temps réel' },
    { href: '/admin/users',    icon: 'solar:users-group-rounded-bold-duotone',     color: '#F59E0B', label: 'Gestion utilisateurs' },
];

/* ─── Stat Card (compact) ───────────────────────────────────── */
function StatCard({ icon, label, value, sub, growth, color }: {
    icon: string; label: string; value: string; sub: string; growth: string; color: string;
}) {
    const isPositive = growth.startsWith('+');
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-border shadow-sm flex items-center gap-3 min-w-0 overflow-hidden hover-lift">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon icon={icon} width={18} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate leading-tight">{label}</p>
                <p className="text-lg font-bold text-foreground tabular-nums truncate leading-tight mt-0.5">{value}</p>
                <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-semibold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>{growth}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{sub}</span>
                </div>
            </div>
        </div>
    );
}

/* ─── Component ─────────────────────────────────────────────── */
export default function AdminPage() {
    const { t } = useTranslation();

    const [stats, setStats] = React.useState([
        { label: t("admin.menu.users"),    value: '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: t("admin.dashboard.active_accounts"), color: '#3B82F6' },
        { label: t("admin.menu.products"), value: '0', growth: '+8%',  icon: 'solar:bag-heart-bold-duotone',           sub: t("admin.dashboard.in_catalog"),       color: '#10B981' },
        { label: t("admin.menu.services"), value: '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone',          sub: t("admin.dashboard.available"),        color: '#8B5CF6' },
        { label: t("admin.menu.annonces"), value: '0', growth: '+5%',  icon: 'solar:megaphone-bold-duotone',           sub: t("admin.dashboard.published"),        color: '#F59E0B' },
    ]);

    const [recentLogs, setRecentLogs]     = React.useState<AdminLog[]>([]);
    const [logsPage, setLogsPage]         = React.useState(1);
    const [logsTotal, setLogsTotal]       = React.useState(0);
    const [loadingLogs, setLoadingLogs]   = React.useState(false);
    const [loadingStats, setLoadingStats] = React.useState(true);

    const { addNotification } = useNotification();

    /* Fetch stats once */
    const fetchStats = React.useCallback(async () => {
        setLoadingStats(true);
        try {
            const [users, prods, servs, anns] = await Promise.all([
                adminGetUsers({ limit: 1 }),
                adminGetProducts({ limit: 1 }),
                adminGetServices({ limit: 1 }),
                adminGetAnnonces({ limit: 1 }),
            ]);
            setStats([
                { label: t("admin.menu.users"),    value: users.data?.total?.toString() || '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: t("admin.dashboard.active_accounts"), color: '#3B82F6' },
                { label: t("admin.menu.products"), value: prods.data?.total?.toString() || '0', growth: '+8%',  icon: 'solar:bag-heart-bold-duotone',           sub: t("admin.dashboard.in_catalog"),       color: '#10B981' },
                { label: t("admin.menu.services"), value: servs.data?.total?.toString() || '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone',          sub: t("admin.dashboard.available"),        color: '#8B5CF6' },
                { label: t("admin.menu.annonces"), value: anns.data?.total?.toString() || '0',  growth: '+5%',  icon: 'solar:megaphone-bold-duotone',           sub: t("admin.dashboard.published"),        color: '#F59E0B' },
            ]);
        } catch {
            addNotification(t("admin.dashboard.error_dashboard"), "error");
        } finally {
            setLoadingStats(false);
        }
    }, [t]);

    /* Fetch logs — paginated */
    const fetchLogs = useCallback(async (page: number) => {
        setLoadingLogs(true);
        try {
            const res = await getAdminLogs({ page, limit: LOGS_LIMIT });
            setRecentLogs(res.data?.data || []);
            setLogsTotal(res.data?.total || 0);
        } catch {
            /* silently ignore */
        } finally {
            setLoadingLogs(false);
        }
    }, []);

    React.useEffect(() => { fetchStats(); }, [fetchStats]);
    React.useEffect(() => { fetchLogs(logsPage); }, [fetchLogs, logsPage]);

    const logColumns: ColumnDef<AdminLog>[] = [
        {
            accessorKey: 'timestamp',
            header: t("common.time"),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-[10px] font-mono whitespace-nowrap">
                    {row.original.timestamp.split('T')[1]?.substring(0, 8) || row.original.timestamp}
                </span>
            ),
        },
        {
            accessorKey: 'level',
            header: t("common.level"),
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-[9px] uppercase font-bold px-2 py-0 whitespace-nowrap ${
                    row.original.level === 'error'
                        ? 'text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                        : 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                }`}>
                    {row.original.level}
                </Badge>
            ),
        },
        {
            accessorKey: 'message',
            header: t("common.message"),
            cell: ({ row }) => (
                <span className="text-xs text-foreground truncate max-w-[200px] sm:max-w-sm block">{row.original.message}</span>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-5">

            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Vue globale</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Tableau de bord administrateur</p>
                </div>
                <button
                    onClick={() => { fetchStats(); fetchLogs(logsPage); }}
                    disabled={loadingStats}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-xs font-medium hover:bg-muted transition-colors"
                >
                    <Icon icon="solar:refresh-bold-duotone" width={14} className={loadingStats ? 'animate-spin' : ''} />
                    Actualiser
                </button>
            </div>

            {/* ── Stat Cards ───────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-parent">
                {stats.map((s, i) => (
                    <div key={i} className="stagger-item">
                        <StatCard {...s} />
                    </div>
                ))}
            </div>

            {/* ── Chart + Quick links ──────────────────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

                {/* Bar chart */}
                <div className="xl:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{t("admin.dashboard.weekly_analysis")}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{t("admin.dashboard.performance_comparison")}</p>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Primaire</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Secondaire</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={weeklyData(t)} barGap={6} barCategoryGap="28%">
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" vertical={false} />
                            <XAxis dataKey="day" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={6} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                            <Tooltip
                                cursor={{ fill: 'rgba(0,0,0,.04)', radius: 8 }}
                                contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }}
                                formatter={(v: any) => [`${(Number(v) / 1000).toFixed(1)}k CFA`]}
                            />
                            <Bar dataKey="primary"   fill="#10b981" radius={[5, 5, 0, 0]} />
                            <Bar dataKey="secondary" fill="#8b5cf6" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Quick links */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-0.5">{t("admin.dashboard.advanced_analysis")}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{t("admin.dashboard.detailed_stats")}</p>
                    <div className="space-y-1.5">
                        {QUICK_LINKS.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${l.color}18` }}>
                                    <Icon icon={l.icon} width={16} style={{ color: l.color }} />
                                </div>
                                <span className="flex-1 text-xs font-medium text-foreground truncate">{l.label}</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={13} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Recent Activity (paginated) ──────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-5 py-3.5 border-b border-border flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#3B82F618' }}>
                            <Icon icon="solar:pulse-bold-duotone" width={16} style={{ color: '#3B82F6' }} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-foreground">{t("admin.dashboard.recent_activity")}</h3>
                            <p className="text-xs text-muted-foreground hidden sm:block">{t("admin.dashboard.real_time_logs")}</p>
                        </div>
                    </div>
                    <Link
                        href="/admin/logs"
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border text-xs font-medium hover:bg-muted transition-colors whitespace-nowrap"
                    >
                        {t("common.see_all")}
                        <Icon icon="solar:alt-arrow-right-bold-duotone" width={11} />
                    </Link>
                </div>

                {/* Table — responsive + paginated via GenericTable */}
                <div className="p-4 sm:p-5">
                    <GenericTable
                        columns={logColumns}
                        data={recentLogs}
                        loading={loadingLogs}
                        haveTitle={false}
                        emptyMessage={t("admin.dashboard.no_recent_activity")}
                        totalItems={logsTotal}
                        currentPage={logsPage}
                        itemsPerPage={LOGS_LIMIT}
                        onPageChange={(p) => setLogsPage(p)}
                    />
                </div>
            </div>
        </div>
    );
}
