'use client';

import React from 'react';
import { Users, Briefcase, CreditCard, ShoppingBag, Radio, TrendingUp, Activity, ArrowUpRight, ArrowDownRight, Clock, Shield, Globe, MoreVertical, Calendar, DollarSign, Target, Zap } from 'lucide-react';
import { adminGetUsers, adminGetProducts, adminGetServices, adminGetAnnonces, getAdminLogs } from '@/api/api';
import { useNotification } from '@/components/toast/NotificationProvider';
import { AdminLog } from '@/types/interface';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
    const [stats, setStats] = React.useState([
        { label: 'Utilisateurs', value: '0', growth: '+12%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Produits', value: '0', growth: '+8%', icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'Services', value: '0', growth: '+15%', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Annonces', value: '0', growth: '+5%', icon: Radio, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                { label: 'Utilisateurs', value: users.data?.total?.toString() || '0', growth: '+12%', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-500/10' },
                { label: 'Produits', value: prods.data?.total?.toString() || '0', growth: '+8%', icon: ShoppingBag, color: 'text-rose-600', bg: 'bg-rose-500/10' },
                { label: 'Services', value: servs.data?.total?.toString() || '0', growth: '+15%', icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                { label: 'Annonces', value: anns.data?.total?.toString() || '0', growth: '+5%', icon: Radio, color: 'text-amber-600', bg: 'bg-amber-500/10' },
            ]);

            setRecentLogs(logs.data?.data || []);
        } catch (error) {
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
            cell: ({ row }) => <span className="text-muted-foreground tabular-nums text-[10px]">{row.original.timestamp.split('T')[1]?.substring(0, 8) || row.original.timestamp}</span>
        },
        {
            accessorKey: 'level',
            header: 'Niveau',
            cell: ({ row }) => (
                <Badge variant="outline" className={`text-[9px] uppercase font-black px-2 py-0 ${row.original.level === 'error' ? 'text-rose-500 border-rose-200 bg-rose-50' : 'text-primary border-primary/20 bg-primary/5'
                    }`}>
                    {row.original.level}
                </Badge>
            )
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => <span className="text-xs font-medium truncate max-w-[200px] block">{row.original.message}</span>
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Dashboard</h1>
                    <p className="text-muted-foreground font-medium">Bon retour, voici l'activité de votre plateforme.</p>
                </div>
                <div className="flex items-center gap-2 bg-card border border-border/50 p-1 rounded-xl shadow-sm">
                    <button className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground shadow-sm">Aujourd'hui</button>
                    <button className="px-4 py-2 text-xs font-bold rounded-lg text-muted-foreground hover:bg-muted transition-colors">7J</button>
                    <button className="px-4 py-2 text-xs font-bold rounded-lg text-muted-foreground hover:bg-muted transition-colors">30J</button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-2 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.bg} ${stat.color} p-3 rounded-2xl group-hover:scale-110 transition-transform`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">{stat.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-3xl font-black tabular-nums">{stat.value}</h3>
                                <span className="text-[10px] font-black text-emerald-500 flex items-center gap-0.5">
                                    <ArrowUpRight className="w-3 h-3" />
                                    {stat.growth}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Announcement Card (Inspired by "Update" in image) */}
                    <div className="bg-[#022c22] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/30 inline-flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    Mise à jour système
                                </span>
                                <h2 className="text-3xl font-black leading-tight">
                                    Les performances ont augmenté de <span className="text-emerald-400">24%</span> cette semaine
                                </h2>
                                <p className="text-emerald-100/70 font-medium">
                                    De nouveaux outils d'analyse sont disponibles dans votre espace d'administration.
                                </p>
                                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl px-8 h-12 shadow-xl shadow-emerald-900/20 border-none transition-all hover:-translate-y-1">
                                    Consulter les stats
                                </Button>
                            </div>
                            <div className="w-48 h-48 bg-emerald-900/50 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shadow-inner">
                                <TrendingUp className="w-24 h-24 text-emerald-400 opacity-50" />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-border/50 flex items-center justify-between">
                            <h3 className="text-lg font-black flex items-center gap-3">
                                <Activity className="w-5 h-5 text-primary" />
                                Activité Récente
                            </h3>
                            <Button variant="ghost" size="sm" className="font-bold text-primary hover:text-primary/80">
                                Voir tout
                            </Button>
                        </div>
                        <div className="p-4 pt-0">
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

                {/* Right Summary Column */}
                <div className="space-y-8">
                    {/* Performance Widget */}
                    <div className="bg-card rounded-[2.5rem] border border-border/50 p-8 shadow-sm space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-lg">Performance</h3>
                            <Target className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <div className="relative flex items-center justify-center py-4">
                            {/* Simple SVG Donut Chart */}
                            <svg className="w-48 h-48 -rotate-90">
                                <circle cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="24" className="text-muted/10" />
                                <circle cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="24" strokeDasharray="502" strokeDashoffset="150" className="text-primary" />
                                <circle cx="96" cy="96" r="80" fill="transparent" stroke="currentColor" strokeWidth="24" strokeDasharray="502" strokeDashoffset="400" className="text-emerald-500" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-3xl font-black">78%</span>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Score Global</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Conversion', val: '68%', color: 'bg-primary' },
                                { label: 'Rétention', val: '24%', color: 'bg-emerald-500' },
                                { label: 'Rejet', val: '8%', color: 'bg-rose-500' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                                        <span className="text-sm font-bold">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black tabular-nums">{item.val}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upsell Card */}
                    <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <Zap className="w-10 h-10 text-primary mb-6" />
                        <h4 className="text-xl font-black mb-2">Passez au niveau supérieur</h4>
                        <p className="text-sm text-muted-foreground font-medium mb-8 leading-relaxed">
                            Débloquez des rapports avancés et une gestion multisite avec l'option Admin Gold.
                        </p>
                        <Button className="w-full bg-foreground text-background font-black h-12 rounded-2xl shadow-lg transition-transform active:scale-95">
                            Mettre à niveau
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
