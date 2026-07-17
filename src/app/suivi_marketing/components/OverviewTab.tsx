'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { marketingGetOverview, marketingGetModuleBreakdown, marketingGetTrend, type AnalyticsPeriod } from '@/api/api';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899'];

interface OverviewData {
    totalCalls: number;
    callsToday: number;
    resolutionRate: number;
    avgHandlingTime: number;
    abandonedCartsRelaunched: number;
    csat: number;
    pendingCallbacks: number;
    urgentTickets: number;
}

interface ModuleRow { module: string; count: number; }
interface TrendRow { date: string; count: number; }

const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
    { label: 'Auj.', value: 'today' },
    { label: '7j', value: 'week' },
    { label: '30j', value: 'month' },
    { label: '90j', value: 'quarter' },
    { label: '1 an', value: 'year' },
];

const MODULE_LABELS: Record<string, string> = {
    BOUTIQUE: 'Boutique',
    SERVICES: 'Services',
    ANNONCES: 'Annonces',
    GAZ: 'Gaz',
    LOGISTIQUE: 'Logistique',
    LIVE_SHOPPING: 'Live Shopping',
    AUTRE: 'Autre',
};

function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-3 sm:p-4 border border-border shadow-sm flex items-start gap-2 sm:gap-3 min-w-0 overflow-hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon icon={icon} width={20} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-tight truncate">{label}</p>
                <p className="text-xl font-bold mt-0.5 text-foreground truncate">{value}</p>
                {sub && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

function ChartCard({ title, icon, empty, children }: { title: string; icon: string; empty: boolean; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon icon={icon} width={16} className="text-primary" />
                {title}
            </h2>
            {empty ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
            ) : (
                children
            )}
        </div>
    );
}

export function OverviewTab() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [modules, setModules] = useState<ModuleRow[]>([]);
    const [trend7, setTrend7] = useState<TrendRow[]>([]);
    const [trend30, setTrend30] = useState<TrendRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [ov, mod, t7, t30] = await Promise.all([
                marketingGetOverview(period),
                marketingGetModuleBreakdown(period),
                marketingGetTrend('week'),
                marketingGetTrend('month'),
            ]);
            if (ov.data) setOverview(ov.data);
            setModules(Array.isArray(mod.data) ? mod.data : []);
            setTrend7(Array.isArray(t7.data) ? t7.data : []);
            setTrend30(Array.isArray(t30.data) ? t30.data : []);
        } catch {
            /* ignore */
        }
        setLoading(false);
    }, [period]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const fmt = (n?: number) => (n === undefined ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

    const moduleData = modules.map((m) => ({ name: MODULE_LABELS[m.module] ?? m.module, value: m.count }));

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Sélecteur de période */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
                {PERIODS.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => setPeriod(p.value)}
                        className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            period === p.value ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <KpiCard icon="solar:phone-calling-rounded-bold-duotone" label="Total appels" value={loading ? '…' : fmt(overview?.totalCalls)} color="#3B82F6" />
                <KpiCard icon="solar:calendar-mark-bold-duotone" label="Appels aujourd'hui" value={loading ? '…' : fmt(overview?.callsToday)} color="#8B5CF6" />
                <KpiCard icon="solar:check-circle-bold-duotone" label="Taux de résolution" value={loading ? '…' : `${overview?.resolutionRate ?? 0}%`} color="#10B981" />
                <KpiCard icon="solar:clock-circle-bold-duotone" label="Temps moyen" value={loading ? '…' : `${overview?.avgHandlingTime ?? 0}s`} sub="par appel traité" color="#F59E0B" />
                <KpiCard icon="solar:cart-large-4-bold-duotone" label="Paniers relancés" value={loading ? '…' : fmt(overview?.abandonedCartsRelaunched)} color="#06B6D4" />
                <KpiCard icon="solar:like-bold-duotone" label="Satisfaction (CSAT)" value={loading ? '…' : `${overview?.csat ?? 0}/5`} color="#EC4899" />
                <KpiCard icon="solar:bell-bing-bold-duotone" label="Rappels en attente" value={loading ? '…' : fmt(overview?.pendingCallbacks)} color="#3B82F6" />
                <KpiCard icon="solar:danger-triangle-bold-duotone" label="Tickets urgents" value={loading ? '…' : fmt(overview?.urgentTickets)} color="#EF4444" />
            </div>

            {/* Répartition par module */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <ChartCard title="Évolution des appels — 7 derniers jours" icon="solar:chart-2-bold-duotone" empty={!loading && trend7.length === 0}>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={trend7} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gTrend7" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }} />
                                <Area type="monotone" dataKey="count" name="Appels" stroke="#3B82F6" fill="url(#gTrend7)" strokeWidth={2} dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
                <ChartCard title="Répartition par module" icon="solar:pie-chart-2-bold-duotone" empty={!loading && moduleData.length === 0}>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={moduleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                                {moduleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Évolution 30 jours */}
            <ChartCard title="Évolution des appels — 30 derniers jours" icon="solar:chart-square-bold-duotone" empty={!loading && trend30.length === 0}>
                <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trend30} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gTrend30" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.18} />
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }} />
                        <Area type="monotone" dataKey="count" name="Appels" stroke="#8B5CF6" fill="url(#gTrend30)" strokeWidth={2} dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </ChartCard>
        </div>
    );
}
