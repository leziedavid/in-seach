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

/* ─── Static data for charts & team ───────────────────────────── */

const weeklyData = [
    { day: 'Sun', primary: 30000, secondary: 19000 },
    { day: 'Mon', primary: 38000, secondary: 28000 },
    { day: 'Tue', primary: 43000, secondary: 32000 },
    { day: 'Wed', primary: 29000, secondary: 22000 },
    { day: 'Thu', primary: 35000, secondary: 26000 },
    { day: 'Fri', primary: 49000, secondary: 38000 },
    { day: 'Sat', primary: 50000, secondary: 43000 },
];

const teamMembers = [
    { name: 'Aneeta T rose', role: 'Project Manager', initials: 'AT', color: 'bg-rose-400' },
    { name: 'Safan Ahmed', role: 'Head Of Department', initials: 'SA', color: 'bg-blue-400' },
    { name: 'Karina', role: 'Co-ordinator', initials: 'KA', color: 'bg-emerald-400' },
    { name: 'Manuel', role: 'Co-ordinator', initials: 'MA', color: 'bg-amber-400' },
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
    const [stats, setStats] = React.useState([
        { label: 'Utilisateurs', value: '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: 'Comptes actifs' },
        { label: 'Produits', value: '0', growth: '+8%', icon: 'solar:bag-heart-bold-duotone', sub: 'En catalogue' },
        { label: 'Services', value: '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone', sub: 'Disponibles' },
        { label: 'Annonces', value: '0', growth: '+5%', icon: 'solar:eye-bold-duotone', sub: 'Publiées' },
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
                { label: 'Utilisateurs', value: users.data?.total?.toString() || '0', growth: '+12%', icon: 'solar:users-group-rounded-bold-duotone', sub: 'Comptes actifs' },
                { label: 'Produits', value: prods.data?.total?.toString() || '0', growth: '+8%', icon: 'solar:bag-heart-bold-duotone', sub: 'En catalogue' },
                { label: 'Services', value: servs.data?.total?.toString() || '0', growth: '+15%', icon: 'solar:hand-stars-bold-duotone', sub: 'Disponibles' },
                { label: 'Annonces', value: anns.data?.total?.toString() || '0', growth: '+5%', icon: 'solar:megaphone-bold-duotone', sub: 'Publiées' },
            ]);

            setRecentLogs(logs.data?.data || []);
        } catch {
            addNotification("Erreur lors de la mise à jour du tableau de bord", "error");
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
            header: 'Heure',
            cell: ({ row }) => (
                <span className="text-muted-foreground tabular-nums text-[10px]">
                    {row.original.timestamp.split('T')[1]?.substring(0, 8) || row.original.timestamp}
                </span>
            )
        },
        {
            accessorKey: 'level',
            header: 'Niveau',
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 py-0 ${row.original.level === 'error' ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-primary border-primary/20 bg-primary/5'}`}>
                    {row.original.level}
                </Badge>
            )
        },
        {
            accessorKey: 'message',
            header: 'Message',
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
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Analyse Hebdomadaire</h3>
                                <p className="text-xs text-muted-foreground font-medium">Comparaison des performances récentes</p>
                            </div>
                            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-2xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 uppercase tracking-widest">
                                Exporter
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={weeklyData} barGap={8} barCategoryGap="25%">
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

                    {/* Activity Table */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] shadow-sm overflow-hidden border border-border/50 backdrop-blur-md">
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Icon icon="solar:pulse-bold-duotone" width={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Activité Récente</h3>
                                    <p className="text-xs text-muted-foreground font-medium">Logs système en temps réel</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="font-black text-foreground hover:bg-muted rounded-2xl text-[10px] uppercase tracking-widest px-4"
                            >
                                Tout voir
                            </Button>
                        </div>
                        <div className="p-6">
                            <GenericTable
                                columns={logColumns}
                                data={recentLogs}
                                loading={loading}
                                haveTitle={false}
                                emptyMessage="Aucune activité récente"
                            />
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div className="space-y-5">

                    {/* Upgrade to Pro */}
                    <div className="bg-[#1a1a1a] dark:bg-white/[0.03] rounded-[2.5rem] p-8 relative overflow-hidden border border-white/5 shadow-2xl">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50" />
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl opacity-50" />
                        
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                                <Icon icon="solar:star-rainbow-bold-duotone" width={24} className="text-primary" />
                            </div>
                            <h3 className="text-white font-black text-2xl mb-2 tracking-tight">Admin Premium</h3>
                            <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-4xl font-black text-white">4.200</span>
                                <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">CFA</span>
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-8">Facturé par mois</p>
                            <button className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-[1.5rem] text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20 uppercase tracking-[0.2em]">
                                Passer au Pro
                            </button>
                        </div>
                    </div>

                    {/* More Analysis */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 shadow-sm border border-border/50 backdrop-blur-md">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-1">Analyses Avancées</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-8">Statistiques détaillées</p>
                        <div className="space-y-4">
                            <Link
                                href="/admin/products"
                                className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl hover:bg-white/[0.08] transition-all group border border-white/5"
                            >
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Icon icon="solar:shop-bold-duotone" width={20} className="text-emerald-500" />
                                </div>
                                <span className="flex-1 text-sm font-black text-foreground uppercase tracking-tight">Ratio de Ventes</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                            <Link
                                href="/admin/products"
                                className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-3xl hover:bg-white/[0.08] transition-all group border border-white/5"
                            >
                                <div className="w-10 h-10 bg-violet-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Icon icon="solar:medal-ribbon-bold-duotone" width={20} className="text-violet-500" />
                                </div>
                                <span className="flex-1 text-sm font-black text-foreground uppercase tracking-tight">Meilleures Ventes</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Daily Meeting */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 shadow-sm border border-border/50 backdrop-blur-md">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <Icon icon="solar:videocamera-record-bold-duotone" width={24} className="text-blue-500" />
                            </div>
                            <div>
                                <h4 className="font-black text-foreground text-sm uppercase tracking-tight">Réunion Quotidienne</h4>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">12+ pers · 09:30 AM</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-8">
                            <div className="flex -space-x-3 flex-shrink-0">
                                {[
                                    { color: 'bg-rose-400', letter: 'A' },
                                    { color: 'bg-blue-400', letter: 'S' },
                                    { color: 'bg-amber-400', letter: 'K' },
                                ].map((m, i) => (
                                    <div key={i} className={`w-9 h-9 ${m.color} rounded-full border-2 border-background dark:border-[#121212] flex items-center justify-center text-[10px] font-black text-white shadow-lg`}>
                                        {m.letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-tighter">Direction Technique</p>
                        </div>

                        <button className="w-full bg-foreground dark:bg-white text-background dark:text-black text-[10px] font-black py-4 rounded-[1.5rem] transition-all hover:opacity-90 active:scale-95 uppercase tracking-[0.2em] shadow-xl">
                            Rejoindre la réunion
                        </button>
                    </div>

                    {/* Team Members */}
                    <div className="bg-card/50 dark:bg-white/[0.02] rounded-[2.5rem] p-8 shadow-sm border border-border/50 backdrop-blur-md">
                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight mb-6">Équipe Admin</h3>
                        <div className="space-y-3">
                            {teamMembers.map((member, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 p-3 hover:bg-white/[0.05] rounded-2xl transition-all group cursor-pointer border border-transparent hover:border-white/5"
                                >
                                    <div className={`w-11 h-11 ${member.color} rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-lg ring-2 ring-white/5`}>
                                        {member.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-foreground truncate">{member.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">{member.role}</p>
                                    </div>
                                    <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground/30 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
