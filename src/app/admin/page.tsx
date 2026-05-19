'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminGetUsers, adminGetProducts, adminGetServices, adminGetAnnonces, getAdminLogs } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { AdminLog } from '@/types/interface';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from "@/utils/langue/hooks";

/* ─── Static data for charts & team ───────────────────────────── */

const weeklyData = (t: any) => [
    { day: t("admin.dashboard.weekly.sun"), primary: 30000, secondary: 19000 },
    { day: t("admin.dashboard.weekly.mon"), primary: 38000, secondary: 28000 },
    { day: t("admin.dashboard.weekly.tue"), primary: 43000, secondary: 32000 },
    { day: t("admin.dashboard.weekly.wed"), primary: 29000, secondary: 22000 },
    { day: t("admin.dashboard.weekly.thu"), primary: 35000, secondary: 26000 },
    { day: t("admin.dashboard.weekly.fri"), primary: 49000, secondary: 38000 },
    { day: t("admin.dashboard.weekly.sat"), primary: 50000, secondary: 43000 },
];

const teamMembers = (t: any) => [
    { name: 'Aneeta T rose', role: t("common.role"), initials: 'AT', color: 'bg-rose-400' },
    { name: 'Safan Ahmed', role: t("common.role"), initials: 'SA', color: 'bg-blue-400' },
    { name: 'Karina', role: t("common.role"), initials: 'KA', color: 'bg-emerald-400' },
    { name: 'Manuel', role: t("common.role"), initials: 'MA', color: 'bg-amber-400' },
];

/* ─── Card colour map ──────────────────────────────────────────── */

const CARD_STYLES = [
    {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
        iconBg: 'bg-emerald-500/20',
        iconColor: 'text-emerald-500',
        text: 'text-emerald-500',
        sub: 'text-emerald-500/60',
        badge: 'bg-emerald-500/10 text-emerald-500',
        border: 'border-emerald-500/20'
    },
    {
        bg: 'bg-blue-500/10 dark:bg-blue-500/5',
        iconBg: 'bg-blue-500/20',
        iconColor: 'text-blue-500',
        text: 'text-blue-500',
        sub: 'text-blue-500/60',
        badge: 'bg-blue-500/10 text-blue-500',
        border: 'border-blue-500/20'
    },
    {
        bg: 'bg-violet-500/10 dark:bg-violet-500/5',
        iconBg: 'bg-violet-500/20',
        iconColor: 'text-violet-500',
        text: 'text-violet-500',
        sub: 'text-violet-500/60',
        badge: 'bg-violet-500/10 text-violet-500',
        border: 'border-violet-500/20'
    },
    {
        bg: 'bg-amber-500/10 dark:bg-amber-500/5',
        iconBg: 'bg-amber-500/20',
        iconColor: 'text-amber-500',
        text: 'text-amber-500',
        sub: 'text-amber-500/60',
        badge: 'bg-amber-500/10 text-amber-500',
        border: 'border-amber-500/20'
    },
];

/* ─── Component ────────────────────────────────────────────────── */

export default function AdminPage() {
    const { t } = useTranslation();
    const [stats, setStats] = React.useState([
        { label: t("admin.menu.users"), value: '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: t("admin.dashboard.active_accounts") },
        { label: t("admin.menu.products"), value: '0', growth: '+8%', icon: 'solar:bag-heart-bold-duotone', sub: t("admin.dashboard.in_catalog") },
        { label: t("admin.menu.services"), value: '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone', sub: t("admin.dashboard.available") },
        { label: t("admin.menu.annonces"), value: '0', growth: '+5%', icon: 'solar:eye-bold-duotone', sub: t("admin.dashboard.published") },
    ]);
    const [recentLogs, setRecentLogs] = React.useState<AdminLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const { addNotification } = useNotification();

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [users, prods, servs, anns, logs] = await Promise.all([
                adminGetUsers({ limit: 1 }),
                adminGetProducts({ limit: 1 }),
                adminGetServices({ limit: 1 }),
                adminGetAnnonces({ limit: 1 }),
                getAdminLogs({ limit: 10 })
            ]);

            setStats([
                { label: t("admin.menu.users"), value: users.data?.total?.toString() || '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: t("admin.dashboard.active_accounts") },
                { label: t("admin.menu.products"), value: prods.data?.total?.toString() || '0', growth: '+8%', icon: 'solar:bag-heart-bold-duotone', sub: t("admin.dashboard.in_catalog") },
                { label: t("admin.menu.services"), value: servs.data?.total?.toString() || '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone', sub: t("admin.dashboard.available") },
                { label: t("admin.menu.annonces"), value: anns.data?.total?.toString() || '0', growth: '+5%', icon: 'solar:megaphone-bold-duotone', sub: t("admin.dashboard.published") },
            ]);

            setRecentLogs(logs.data?.data || []);
        } catch {
            addNotification(t("admin.dashboard.error_dashboard"), "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchDashboardData();
    }, []);

    const logColumns: ColumnDef<AdminLog>[] = [
        {
            accessorKey: 'timestamp',
            header: t("common.time"),
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-[10px]">
                    {row.original.timestamp.split('T')[1]?.substring(0, 8) || row.original.timestamp}
                </span>
            )
        },
        {
            accessorKey: 'level',
            header: t("common.level"),
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 py-0 ${row.original.level === 'error' ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-primary border-primary/20 bg-primary/5'}`}>
                    {row.original.level}
                </Badge>
            )
        },
        {
            accessorKey: 'message',
            header: t("common.message"),
            cell: ({ row }) => (
                <span className="text-xs font-medium truncate max-w-[200px] block">{row.original.message}</span>
            )
        }
    ];

    /* ── JSX ──────────────────────────────────────────────────── */

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">


            {/* ── 1. Stats row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {stats.map((stat, i) => {
                    const s = CARD_STYLES[i];
                    return (
                        <div
                            key={i}
                            className={`${s.bg} border ${s.border} rounded-[2rem] p-6 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-default backdrop-blur-sm`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`${s.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner`}>
                                        <Icon icon={stat.icon} width={24} className={s.iconColor} />
                                    </div>
                                    <div className={`text-[10px] font-black ${s.badge} flex items-center gap-1 px-2.5 py-1 rounded-full uppercase tracking-tighter`}>
                                        {stat.growth}
                                        <Icon icon="solar:arrow-right-up-bold-duotone" width={12} />
                                    </div>
                                </div>

                                <p className={`text-[10px] font-black ${s.sub} uppercase tracking-[0.2em] mb-2`}>{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-4xl font-black ${s.text} tabular-nums leading-none tracking-tight`}>{stat.value}</h3>
                                    <p className={`text-[11px] font-bold ${s.sub} opacity-70`}>{stat.sub}</p>
                                </div>
                            </div>

                            {/* Background decorative element */}
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/[0.03] rounded-full blur-2xl group-hover:bg-white/[0.08] transition-all duration-500" />
                        </div>
                    );
                })}
            </div>

            {/* ── 2. Main content + Right column ───────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left — chart + table */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Bar chart */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 shadow-sm border border-border/50 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t("admin.dashboard.weekly_analysis")}</h3>
                                <p className="text-xs text-muted-foreground font-medium">{t("admin.dashboard.performance_comparison")}</p>
                            </div>
                            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest">
                                {t("common.export")}
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={weeklyData(t)} barGap={8} barCategoryGap="25%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#888" vertical={false} strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#888', fontWeight: 700 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 12 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background/90 backdrop-blur-xl border border-border/50 p-3 rounded-2xl shadow-2xl">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{payload[0].payload.day}</p>
                                                    <div className="space-y-1">
                                                        {payload.map((entry: any, index: number) => (
                                                            <div key={index} className="flex items-center gap-3">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                <p className="text-xs font-black text-foreground">{(Number(entry.value) / 1000).toFixed(1)}k CFA</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="primary" fill="#10b981" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="secondary" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>


                {/* Right column */}
                <div className="space-y-5">

                    {/* More Analysis */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 shadow-sm border border-border/50 backdrop-blur-md">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-1">{t("admin.dashboard.advanced_analysis")}</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-8">{t("admin.dashboard.detailed_stats")}</p>
                        <div className="space-y-4">
                            <Link href="/admin/products" className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl hover:bg-white/[0.08] transition-all group border border-white/5">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Icon icon="solar:shop-bold-duotone" width={20} className="text-emerald-500" />
                                </div>
                                <span className="flex-1 text-sm font-black text-foreground uppercase tracking-tight">{t("admin.dashboard.sales_ratio")}</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                            <Link href="/admin/products" className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl hover:bg-white/[0.08] transition-all group border border-white/5">
                                <div className="w-10 h-10 bg-violet-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Icon icon="solar:medal-ribbon-bold-duotone" width={20} className="text-violet-500" />
                                </div>
                                <span className="flex-1 text-sm font-black text-foreground uppercase tracking-tight">{t("admin.dashboard.best_sellers")}</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        </div>
                    </div>

                </div>

            </div>

            {/* Activity Table */}
            <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] shadow-sm overflow-hidden border border-border/50 backdrop-blur-md">
                <div className="p-8 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Icon icon="solar:pulse-bold-duotone" width={24} className="text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t("admin.dashboard.recent_activity")}</h3>
                            <p className="text-xs text-muted-foreground font-medium">{t("admin.dashboard.real_time_logs")}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="font-black text-foreground hover:bg-muted rounded-2xl text-[10px] uppercase tracking-widest px-4">
                        {t("common.see_all")}
                    </Button>
                </div>
                <div className="p-6">
                    <GenericTable columns={logColumns} data={recentLogs} loading={loading} haveTitle={false} emptyMessage={t("admin.dashboard.no_recent_activity")} />
                </div>
            </div>
        </div>
    );
}
