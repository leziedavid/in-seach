'use client';

import React from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminGetUsers, adminGetProducts, adminGetServices, adminGetAnnonces, getAdminLogs } from '@/api/api';
import { useNotification } from '@/components/toast/NotificationProvider';
import { AdminLog } from '@/types/interface';
import { GenericTable } from '@/components/table/table';
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
        bg: 'bg-[#b3e4d2]',
        iconBg: 'bg-white/50',
        iconColor: 'text-emerald-700',
        text: 'text-emerald-900',
        sub: 'text-emerald-700/80',
        badge: 'bg-white/40 text-emerald-800',
    },
    {
        bg: 'bg-[#aecfed]',
        iconBg: 'bg-white/50',
        iconColor: 'text-blue-700',
        text: 'text-blue-900',
        sub: 'text-blue-700/80',
        badge: 'bg-white/40 text-blue-800',
    },
    {
        bg: 'bg-[#c4b5f4]',
        iconBg: 'bg-white/50',
        iconColor: 'text-violet-700',
        text: 'text-violet-900',
        sub: 'text-violet-700/80',
        badge: 'bg-white/40 text-violet-800',
    },
    {
        bg: 'bg-[#fcd9a0]',
        iconBg: 'bg-white/50',
        iconColor: 'text-amber-700',
        text: 'text-amber-900',
        sub: 'text-amber-700/80',
        badge: 'bg-white/40 text-amber-800',
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
        <div className="p-6 space-y-6 animate-in fade-in duration-500">

            {/* ── 1. Stats row ─────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {stats.map((stat, i) => {
                    const s = CARD_STYLES[i];
                    return (
                        <div
                            key={i}
                            className={`${s.bg} rounded-3xl p-6 relative overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-default`}
                        >
                            {/* Subtle background circle */}
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/20 rounded-full" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`${s.iconBg} w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm`}>
                                        <Icon icon={stat.icon} width={22} className={s.iconColor} />
                                    </div>
                                    <span className={`text-[11px] font-bold ${s.badge} flex items-center gap-0.5 px-2 py-1 rounded-full`}>
                                        <Icon icon="solar:arrow-right-up-bold-duotone" width={12} />
                                        {stat.growth}
                                    </span>
                                </div>

                                <p className={`text-[11px] font-bold ${s.sub} uppercase tracking-widest mb-1`}>{stat.label}</p>
                                <h3 className={`text-4xl font-black ${s.text} tabular-nums leading-none mb-1`}>{stat.value}</h3>
                                <p className={`text-[11px] ${s.sub}`}>{stat.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── 2. Main content + Right column ───────────────── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left — chart + table */}
                <div className="xl:col-span-2 space-y-6">

                    {/* Bar chart */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-foreground">Regular Sell</h3>
                            <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2 rounded-xl text-xs font-black transition-all">
                                Export
                            </button>
                        </div>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 600 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v / 1000}k`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb', radius: 8 }}
                                    formatter={(value: any) => [`${(Number(value) / 1000).toFixed(0)}k`, '']}
                                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700 }}
                                />
                                <Bar dataKey="primary" fill="#a8e6cf" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="secondary" fill="#c4b5f4" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Activity Table */}
                    <div className="bg-card rounded-3xl shadow-sm overflow-hidden border border-border">
                        <div className="p-6 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Icon icon="solar:pulse-bold-duotone" width={22} className="text-foreground" />
                                <div>
                                    <h3 className="text-base font-black text-foreground">Activité Récente</h3>
                                    <p className="text-[11px] text-muted-foreground">Logs système en temps réel</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="font-bold text-foreground hover:bg-muted rounded-xl text-xs"
                            >
                                Voir tout
                            </Button>
                        </div>
                        <div className="p-4">
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
                    <div className="bg-secondary rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-primary/10 rounded-full" />
                        <div className="absolute top-4 right-4">
                            <Icon icon="solar:menu-dots-bold-duotone" width={18} className="text-white/30" />
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-white font-black text-lg mb-3">Upgrade to Pro</h3>
                            <div className="flex items-baseline gap-1 mb-0.5">
                                <span className="text-3xl font-black text-white">$4.20</span>
                                <span className="text-slate-400 text-sm font-medium">/ month</span>
                            </div>
                            <p className="text-slate-500 text-xs mb-6">$50 Billed Annually</p>
                            <button className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3 rounded-2xl text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20">
                                Upgrade now
                            </button>
                        </div>
                    </div>

                    {/* More Analysis */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <h3 className="text-base font-black text-foreground mb-0.5">More Analysis</h3>
                        <p className="text-[11px] text-muted-foreground mb-5">There are more to view</p>
                        <div className="space-y-3">
                            <Link
                                href="/admin/products"
                                className="flex items-center gap-4 p-3.5 bg-muted rounded-2xl hover:bg-muted/80 transition-all group"
                            >
                                <div className="w-9 h-9 bg-card rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-border">
                                    <Icon icon="solar:shop-bold-duotone" width={18} className="text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-sm font-bold text-foreground">Store sell Ratio</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                            <Link
                                href="/admin/products"
                                className="flex items-center gap-4 p-3.5 bg-muted rounded-2xl hover:bg-muted/80 transition-all group"
                            >
                                <div className="w-9 h-9 bg-card rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all border border-border">
                                    <Icon icon="solar:medal-ribbon-bold-duotone" width={18} className="text-muted-foreground" />
                                </div>
                                <span className="flex-1 text-sm font-bold text-foreground">Top item sold</span>
                                <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                            </Link>
                        </div>
                    </div>

                    {/* Daily Meeting */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                <Icon icon="solar:videocamera-record-bold-duotone" width={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-black text-foreground text-sm">Daily Meeting</h4>
                                <p className="text-[10px] text-muted-foreground">12+ person · 9:30 pm</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 mb-5">
                            <div className="flex -space-x-2 flex-shrink-0">
                                {[
                                    { color: 'bg-rose-400', letter: 'A' },
                                    { color: 'bg-blue-400', letter: 'S' },
                                    { color: 'bg-amber-400', letter: 'K' },
                                ].map((m, i) => (
                                    <div key={i} className={`w-7 h-7 ${m.color} rounded-full border-2 border-card flex items-center justify-center text-[9px] font-black text-white`}>
                                        {m.letter}
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">They will conduct the meeting</p>
                        </div>

                        {/* Bouton dark fixe — élément de design identitaire */}
                        <button className="w-full bg-foreground hover:opacity-90 text-background text-xs font-bold py-3 rounded-2xl transition-all">
                            Click for meeting link
                        </button>
                    </div>

                    {/* Team Members */}
                    <div className="bg-card rounded-3xl p-6 shadow-sm border border-border">
                        <h3 className="text-base font-black text-foreground mb-4">Team Member</h3>
                        <div className="space-y-1.5">
                            {teamMembers.map((member, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-xl transition-all group cursor-pointer"
                                >
                                    <div className={`w-9 h-9 ${member.color} rounded-full flex items-center justify-center text-white font-black text-xs flex-shrink-0`}>
                                        {member.initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{member.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{member.role}</p>
                                    </div>
                                    <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
