'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
    analyticsGetOverview,
    analyticsGetTraffic,
    analyticsGetModules,
    analyticsGetRoutes,
    analyticsGetDevices,
    analyticsGetTopUsers,
    analyticsGetRealtime,
    getBaseUrl,
    type AnalyticsPeriod,
} from '@/api/api';
import { useSocket } from '@/components/providers/SocketProvider';
import { GenericTable } from '@/components/ui/table/table';
import { TablePagination } from '@/components/ui/table/Pagination';

const LIMIT = 10;

function buildExportUrl(period: AnalyticsPeriod): string {
    return `${getBaseUrl()}/analytics/export?period=${period}`;
}

/* ─── Palette ──────────────────────────────────────────────── */
const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

/* ─── Types ────────────────────────────────────────────────── */
interface OverviewData {
    totalEvents: number;
    uniqueUsers: number;
    errorCount: number;
    errorRate: number;
    avgDuration: number;
}

interface RouteRow { route: string | null; method: string | null; count: number; avgDuration: number; }
interface UserRow  { userId: string | null; count: number; user: { id: string; fullName: string | null; email: string; role: string } | null; }
interface EventRow { id: string; module: string; eventType: string; route: string | null; method: string | null; statusCode: number | null; userId: string | null; browser: string | null; os: string | null; device: string | null; duration: number | null; createdAt: string; }

/* ─── KPI Card ──────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color }: {
    icon: string; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border shadow-sm flex items-start gap-3 min-w-0 overflow-hidden">
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

/* ─── Method Badge ──────────────────────────────────────────── */
function MethodBadge({ method }: { method?: string | null }) {
    const cls =
        method === 'GET'    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
        method === 'POST'   ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
        method === 'DELETE' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300';
    return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${cls}`}>{method ?? '—'}</span>;
}

/* ─── Column definitions ────────────────────────────────────── */
const routeColumns: ColumnDef<RouteRow>[] = [
    {
        accessorKey: 'route',
        header: 'Route',
        cell: ({ getValue }) => (
            <span className="font-mono text-xs block truncate max-w-[180px]">{getValue() as string ?? '—'}</span>
        ),
    },
    {
        accessorKey: 'method',
        header: 'Méthode',
        cell: ({ getValue }) => <MethodBadge method={getValue() as string} />,
    },
    {
        accessorKey: 'count',
        header: 'Hits',
        cell: ({ getValue }) => <span className="font-semibold text-xs">{getValue() as number}</span>,
    },
    {
        accessorKey: 'avgDuration',
        header: 'Durée moy.',
        cell: ({ getValue }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{getValue() as number}ms</span>,
    },
];

const userColumns: ColumnDef<UserRow>[] = [
    {
        id: 'rank',
        header: '#',
        cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span>,
    },
    {
        id: 'user',
        header: 'Utilisateur',
        cell: ({ row }) => (
            <div className="min-w-0">
                <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{row.original.user?.fullName ?? 'Anonyme'}</div>
                <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{row.original.user?.email ?? row.original.userId}</div>
            </div>
        ),
    },
    {
        id: 'role',
        header: 'Rôle',
        cell: ({ row }) => (
            <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium whitespace-nowrap">
                {row.original.user?.role ?? '—'}
            </span>
        ),
    },
    {
        accessorKey: 'count',
        header: 'Événements',
        cell: ({ getValue }) => <span className="text-xs font-semibold">{getValue() as number}</span>,
    },
];

/* ─── Period Selector ───────────────────────────────────────── */
const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
    { label: "Auj.", value: 'today' },
    { label: '7j',   value: 'week' },
    { label: '30j',  value: 'month' },
    { label: '90j',  value: 'quarter' },
    { label: '1 an', value: 'year' },
];

/* ─── Main Page ─────────────────────────────────────────────── */
export default function KpiPage() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const [loading, setLoading]     = useState(true);
    const [tab, setTab]             = useState<'overview' | 'realtime'>('overview');

    // Non-paginated
    const [overview, setOverview]   = useState<OverviewData | null>(null);
    const [traffic, setTraffic]     = useState<any[]>([]);
    const [modules, setModules]     = useState<any[]>([]);
    const [devices, setDevices]     = useState<any>(null);

    // Routes — paginated
    const [routes, setRoutes]           = useState<RouteRow[]>([]);
    const [routesPage, setRoutesPage]   = useState(1);
    const [routesTotal, setRoutesTotal] = useState(0);
    const [loadingRoutes, setLoadingRoutes] = useState(false);

    // Users — paginated
    const [users, setUsers]           = useState<UserRow[]>([]);
    const [usersPage, setUsersPage]   = useState(1);
    const [usersTotal, setUsersTotal] = useState(0);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Realtime — paginated
    const [realtime, setRealtime]           = useState<EventRow[]>([]);
    const [realtimePage, setRealtimePage]   = useState(1);
    const [realtimeTotal, setRealtimeTotal] = useState(0);
    const [loadingRealtime, setLoadingRealtime] = useState(false);

    const { socket } = useSocket() as any;

    /* ── Fetchers indépendants ──────────────────────────────── */
    const fetchRoutes = useCallback(async (page: number) => {
        setLoadingRoutes(true);
        try {
            const res = await analyticsGetRoutes({ period, page, limit: LIMIT });
            if (res.data) { setRoutes(res.data.data); setRoutesTotal(res.data.total); }
        } catch { /* ignore */ }
        setLoadingRoutes(false);
    }, [period]);

    const fetchUsers = useCallback(async (page: number) => {
        setLoadingUsers(true);
        try {
            const res = await analyticsGetTopUsers({ period, page, limit: LIMIT });
            if (res.data) { setUsers(res.data.data); setUsersTotal(res.data.total); }
        } catch { /* ignore */ }
        setLoadingUsers(false);
    }, [period]);

    const fetchRealtime = useCallback(async (page: number) => {
        setLoadingRealtime(true);
        try {
            const res = await analyticsGetRealtime({ page, limit: LIMIT });
            if (res.data) { setRealtime(res.data.data); setRealtimeTotal(res.data.total); }
        } catch { /* ignore */ }
        setLoadingRealtime(false);
    }, [period]);

    /* ── fetchAll : données non-paginées + reset pages ─────── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setRoutesPage(1);
        setUsersPage(1);
        setRealtimePage(1);
        try {
            const [ov, tr, mod, dv] = await Promise.all([
                analyticsGetOverview({ period }),
                analyticsGetTraffic({ period }),
                analyticsGetModules({ period }),
                analyticsGetDevices({ period }),
            ]);
            if (ov.data)  setOverview(ov.data);
            if (tr.data)  setTraffic(tr.data);
            if (mod.data) setModules(mod.data);
            if (dv.data)  setDevices(dv.data);
        } catch { /* ignore */ }
        setLoading(false);
        fetchRoutes(1);
        fetchUsers(1);
        fetchRealtime(1);
    }, [period, fetchRoutes, fetchUsers, fetchRealtime]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* Page changes */
    const handleRoutesPage = (p: number) => { setRoutesPage(p); fetchRoutes(p); };
    const handleUsersPage  = (p: number) => { setUsersPage(p);  fetchUsers(p); };
    const handleRealtimePage = (p: number) => { setRealtimePage(p); fetchRealtime(p); };

    /* Real-time socket push — inject dans la page 1 si on y est */
    useEffect(() => {
        if (!socket) return;
        const handler = (event: any) => {
            if (realtimePage === 1) {
                setRealtime((prev) => [event, ...prev].slice(0, LIMIT));
                setRealtimeTotal((t) => t + 1);
            }
        };
        socket.on('analytics:event', handler);
        return () => socket.off('analytics:event', handler);
    }, [socket, realtimePage]);

    const fmt = (n?: number) =>
        n === undefined ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
            : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n);

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">

            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">KPI & Analytics</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Suivi en temps réel de toute l'activité plateforme</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide">
                        {PERIODS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value)}
                                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                    period === p.value
                                        ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    <a
                        href={buildExportUrl(period)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-xs font-medium hover:bg-muted transition-colors"
                    >
                        <Icon icon="solar:download-bold-duotone" width={14} />
                        <span className="hidden sm:inline">Export CSV</span>
                    </a>
                    <button
                        onClick={fetchAll}
                        disabled={loading}
                        className="flex-shrink-0 p-2 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-muted transition-colors"
                    >
                        <Icon icon="solar:refresh-bold-duotone" width={15} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
                {(['overview', 'realtime'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            tab === t ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {t === 'overview' ? 'Vue globale' : 'Temps réel'}
                        {t === 'realtime' && (
                            <span className="ml-2 inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping-slow" />
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* ══ Overview ════════════════════════════════════════ */}
            {tab === 'overview' && (
                <div className="space-y-4 md:space-y-6">

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                        <KpiCard icon="solar:chart-bold-duotone"                label="Total événements"    value={fmt(overview?.totalEvents)}                                   color="#3B82F6" />
                        <KpiCard icon="solar:users-group-rounded-bold-duotone"  label="Utilisateurs uniques" value={fmt(overview?.uniqueUsers)}                                  color="#8B5CF6" />
                        <KpiCard icon="solar:danger-triangle-bold-duotone"      label="Erreurs"             value={fmt(overview?.errorCount)} sub={`${overview?.errorRate ?? 0}% taux`} color="#EF4444" />
                        <KpiCard icon="solar:clock-circle-bold-duotone"         label="Durée moyenne"       value={`${overview?.avgDuration ?? 0}ms`}                            color="#10B981" />
                        <KpiCard icon="solar:pulse-bold-duotone"                label="Événements live"     value={fmt(realtimeTotal)}        sub="total en base"               color="#F59E0B" />
                    </div>

                    {/* Traffic + Modules */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-4">Tendance du trafic</h2>
                            {traffic.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={traffic} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }} />
                                        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                        <Area type="monotone" dataKey="requests" name="Requêtes" stroke="#3B82F6" fill="url(#gReq)" strokeWidth={2} dot={false} />
                                        <Area type="monotone" dataKey="errors"   name="Erreurs"   stroke="#EF4444" fill="url(#gErr)" strokeWidth={2} dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-4">Activité par module</h2>
                            {modules.length === 0 ? (
                                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie data={modules.slice(0, 8)} dataKey="count" nameKey="module" cx="50%" cy="50%" outerRadius={70} paddingAngle={2}>
                                            {modules.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                                        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Devices */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Navigateurs & appareils</h2>
                        {!devices ? (
                            <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                <ResponsiveContainer width="100%" height={100}>
                                    <BarChart data={devices.browsers} margin={{ left: -10, right: 4 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                                        <Bar dataKey="value" name="Sessions" radius={[4, 4, 0, 0]}>
                                            {devices.browsers.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                    {devices.devices.map((d: any, i: number) => (
                                        <span key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground whitespace-nowrap">
                                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                            {d.name} ({d.value})
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Routes — GenericTable paginé */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Top routes</h2>
                        <GenericTable<RouteRow, string>
                            columns={routeColumns}
                            data={routes}
                            loading={loadingRoutes}
                            emptyMessage="Aucune route pour cette période"
                            totalItems={routesTotal}
                            currentPage={routesPage}
                            itemsPerPage={LIMIT}
                            onPageChange={handleRoutesPage}
                        />
                    </div>

                    {/* Top Users — GenericTable paginé */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Top utilisateurs actifs</h2>
                        <GenericTable<UserRow, string>
                            columns={userColumns}
                            data={users}
                            loading={loadingUsers}
                            emptyMessage="Aucun utilisateur pour cette période"
                            totalItems={usersTotal}
                            currentPage={usersPage}
                            itemsPerPage={LIMIT}
                            onPageChange={handleUsersPage}
                        />
                    </div>
                </div>
            )}

            {/* ══ Realtime ════════════════════════════════════════ */}
            {tab === 'realtime' && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping-slow" />
                            Événements en temps réel
                        </h2>
                        <span className="text-xs text-muted-foreground">{fmt(realtimeTotal)} total</span>
                    </div>

                    <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <table className="w-full text-xs min-w-[520px]">
                            <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                                <tr className="border-b border-border">
                                    <th className="text-left py-2 pl-4 sm:pl-0 font-medium text-muted-foreground whitespace-nowrap w-20">Heure</th>
                                    <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap w-24">Module</th>
                                    <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap w-16">Méth.</th>
                                    <th className="text-left py-2 font-medium text-muted-foreground">Route</th>
                                    <th className="text-center py-2 font-medium text-muted-foreground whitespace-nowrap w-14">Status</th>
                                    <th className="text-left py-2 font-medium text-muted-foreground whitespace-nowrap hidden md:table-cell">Appareil</th>
                                    <th className="text-right py-2 pr-4 sm:pr-0 font-medium text-muted-foreground whitespace-nowrap w-16">Durée</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingRealtime ? (
                                    Array.from({ length: LIMIT }).map((_, i) => (
                                        <tr key={i} className="border-b border-border/40">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <td key={j} className="py-2"><div className="h-3 bg-muted rounded animate-pulse" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : realtime.map((e, i) => {
                                    const isErr = (e.statusCode ?? 0) >= 400;
                                    const time = new Date(e.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    return (
                                        <tr key={e.id ?? i} className={`border-b border-border/40 transition-colors ${isErr ? 'bg-red-50/40 dark:bg-red-900/10' : 'hover:bg-muted/30'}`}>
                                            <td className="py-1.5 pl-4 sm:pl-0 font-mono text-muted-foreground whitespace-nowrap">{time}</td>
                                            <td className="py-1.5 font-medium text-foreground">
                                                <span className="block truncate max-w-[90px]">{e.module}</span>
                                            </td>
                                            <td className="py-1.5"><MethodBadge method={e.method} /></td>
                                            <td className="py-1.5 font-mono text-foreground">
                                                <span className="block truncate max-w-[160px] md:max-w-[220px]">{e.route ?? '—'}</span>
                                            </td>
                                            <td className="py-1.5 text-center">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                                                    isErr ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                }`}>{e.statusCode ?? '—'}</span>
                                            </td>
                                            <td className="py-1.5 text-muted-foreground whitespace-nowrap hidden md:table-cell">
                                                {[e.device, e.browser].filter(Boolean).join(' / ') || '—'}
                                            </td>
                                            <td className="py-1.5 text-right pr-4 sm:pr-0 text-muted-foreground whitespace-nowrap">
                                                {e.duration != null ? `${e.duration}ms` : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {!loadingRealtime && realtime.length === 0 && (
                                    <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">En attente d'événements…</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination realtime */}
                    {realtimeTotal > LIMIT && (
                        <div className="border-t border-border/50 mt-2">
                            <TablePagination
                                page={realtimePage}
                                limit={LIMIT}
                                total={realtimeTotal}
                                totalPages={Math.ceil(realtimeTotal / LIMIT)}
                                onPageChange={handleRealtimePage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
