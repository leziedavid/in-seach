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
    analyticsGetRevenue,
    analyticsGetTopProducts,
    analyticsGetTopSellers,
    analyticsGetTopServices,
    analyticsGetTopAnnonces,
    analyticsSiteVisitGetOverview,
    analyticsSiteVisitGetTrend,
    analyticsSiteVisitGetDevices,
    analyticsSiteVisitGetTopUsers,
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

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];

/* ─── Types ────────────────────────────────────────────────── */
interface OverviewData { totalEvents: number; uniqueUsers: number; errorCount: number; errorRate: number; avgDuration: number; }
interface RouteRow  { route: string | null; method: string | null; count: number; avgDuration: number; }
interface UserRow   { userId: string | null; count: number; user: { id: string; fullName: string | null; email: string; role: string } | null; }
interface EventRow  { id: string; module: string; eventType: string; route: string | null; method: string | null; statusCode: number | null; userId: string | null; browser: string | null; os: string | null; device: string | null; duration: number | null; createdAt: string; }
interface ProductRow { productId: string; count: number; totalQty: number; totalRevenue: number; product: { id: string; name: string; price: number; code: string } | null; }
interface SellerRow  { userId: string; fullName: string | null; email: string; storeName: string | null; orderCount: number; totalRevenue: number; }
interface ServiceRow { serviceId: string | null; count: number; avgPrice: number; service: { id: string; title: string; type: string; price: number | null } | null; }
interface AnnonceRow { annonceId: string | null; count: number; avgPrice: number; annonce: { id: string; title: string; price: number | null; status: string } | null; }
interface VisitOverviewData {
    totalVisits: number; uniqueVisitors: number; connectedVisitors: number; anonymousVisitors: number;
    visitsToday: number; visitsWeek: number; visitsMonth: number;
}

/* ─── KPI Card ──────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string; }) {
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
    { accessorKey: 'route',       header: 'Route',      cell: ({ getValue }) => <span className="font-mono text-xs block truncate max-w-[180px]">{getValue() as string ?? '—'}</span> },
    { accessorKey: 'method',      header: 'Méthode',    cell: ({ getValue }) => <MethodBadge method={getValue() as string} /> },
    { accessorKey: 'count',       header: 'Hits',       cell: ({ getValue }) => <span className="font-semibold text-xs">{getValue() as number}</span> },
    { accessorKey: 'avgDuration', header: 'Durée moy.', cell: ({ getValue }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{getValue() as number}ms</span> },
];

const userColumns: ColumnDef<UserRow>[] = [
    { id: 'rank',  header: '#',            cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span> },
    { id: 'user',  header: 'Utilisateur',  cell: ({ row }) => (
        <div className="min-w-0">
            <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{row.original.user?.fullName ?? 'Anonyme'}</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{row.original.user?.email ?? row.original.userId}</div>
        </div>
    )},
    { id: 'role',  header: 'Rôle',         cell: ({ row }) => <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium whitespace-nowrap">{row.original.user?.role ?? '—'}</span> },
    { accessorKey: 'count', header: 'Événements', cell: ({ getValue }) => <span className="text-xs font-semibold">{getValue() as number}</span> },
];

const productColumns: ColumnDef<ProductRow>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span> },
    { id: 'product', header: 'Produit', cell: ({ row }) => (
        <div className="min-w-0">
            <div className="text-xs font-medium truncate max-w-[180px]">{row.original.product?.name ?? row.original.productId}</div>
            <div className="text-[10px] text-muted-foreground font-mono">{row.original.product?.code ?? ''}</div>
        </div>
    )},
    { accessorKey: 'count',        header: 'Commandes', cell: ({ getValue }) => <span className="text-xs font-semibold">{getValue() as number}</span> },
    { accessorKey: 'totalQty',     header: 'Qté vendue', cell: ({ getValue }) => <span className="text-xs font-semibold text-primary">{getValue() as number}</span> },
    { accessorKey: 'totalRevenue', header: 'CA (FCFA)',  cell: ({ getValue }) => <span className="text-xs font-semibold text-emerald-600">{(getValue() as number).toLocaleString('fr-FR')}</span> },
];

const sellerColumns: ColumnDef<SellerRow>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span> },
    { id: 'seller', header: 'Vendeur', cell: ({ row }) => (
        <div className="min-w-0">
            <div className="text-xs font-medium truncate max-w-[160px]">{row.original.storeName ?? row.original.fullName ?? '—'}</div>
            <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{row.original.email}</div>
        </div>
    )},
    { accessorKey: 'orderCount',   header: 'Commandes', cell: ({ getValue }) => <span className="text-xs font-semibold">{getValue() as number}</span> },
    { accessorKey: 'totalRevenue', header: 'CA (FCFA)',  cell: ({ getValue }) => <span className="text-xs font-semibold text-emerald-600">{Math.round(getValue() as number).toLocaleString('fr-FR')}</span> },
];

const serviceColumns: ColumnDef<ServiceRow>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span> },
    { id: 'service', header: 'Service', cell: ({ row }) => (
        <div className="min-w-0">
            <div className="text-xs font-medium truncate max-w-[180px]">{row.original.service?.title ?? row.original.serviceId ?? '—'}</div>
            {row.original.service?.type && <span className="text-[10px] text-muted-foreground uppercase">{row.original.service.type}</span>}
        </div>
    )},
    { accessorKey: 'count',    header: 'Bookings',    cell: ({ getValue }) => <span className="text-xs font-semibold text-violet-600">{getValue() as number}</span> },
    { accessorKey: 'avgPrice', header: 'Prix moy.',   cell: ({ getValue }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{(getValue() as number).toLocaleString('fr-FR')} FCFA</span> },
];

const annonceColumns: ColumnDef<AnnonceRow>[] = [
    { id: 'rank', header: '#', cell: ({ row }) => <span className="text-xs font-bold text-muted-foreground">{row.index + 1}</span> },
    { id: 'annonce', header: 'Annonce', cell: ({ row }) => (
        <div className="min-w-0">
            <div className="text-xs font-medium truncate max-w-[180px]">{row.original.annonce?.title ?? row.original.annonceId ?? '—'}</div>
            {row.original.annonce?.status && <span className="text-[10px] text-muted-foreground uppercase">{row.original.annonce.status}</span>}
        </div>
    )},
    { accessorKey: 'count',    header: 'Bookings',  cell: ({ getValue }) => <span className="text-xs font-semibold text-amber-600">{getValue() as number}</span> },
    { accessorKey: 'avgPrice', header: 'Prix moy.', cell: ({ getValue }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{(getValue() as number).toLocaleString('fr-FR')} FCFA</span> },
];

/* ─── Period Selector ───────────────────────────────────────── */
const PERIODS: { label: string; value: AnalyticsPeriod }[] = [
    { label: "Auj.", value: 'today' },
    { label: '7j',   value: 'week' },
    { label: '30j',  value: 'month' },
    { label: '90j',  value: 'quarter' },
    { label: '1 an', value: 'year' },
];

/* ─── Composant partagé (réutilisé par /admin/kpi et l'onglet Live KPI de /suivi_marketing) ─── */
export function KpiDashboard() {
    const [period, setPeriod] = useState<AnalyticsPeriod>('week');
    const [loading, setLoading]     = useState(true);
    const [tab, setTab]             = useState<'overview' | 'visites' | 'commerce' | 'realtime'>('overview');

    // Non-paginated (overview)
    const [overview, setOverview]   = useState<OverviewData | null>(null);
    const [traffic, setTraffic]     = useState<any[]>([]);
    const [modules, setModules]     = useState<any[]>([]);
    const [devices, setDevices]     = useState<any>(null);

    // Visites — non-paginated
    const [visitOverview, setVisitOverview] = useState<VisitOverviewData | null>(null);
    const [visitTrend, setVisitTrend]       = useState<any[]>([]);
    const [visitDevices, setVisitDevices]   = useState<any>(null);
    const [loadingVisits, setLoadingVisits] = useState(false);

    // Visites — top utilisateurs, paginé
    const [visitUsers, setVisitUsers]           = useState<UserRow[]>([]);
    const [visitUsersPage, setVisitUsersPage]   = useState(1);
    const [visitUsersTotal, setVisitUsersTotal] = useState(0);
    const [loadingVisitUsers, setLoadingVisitUsers] = useState(false);

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

    // Commerce — revenue
    const [revenue, setRevenue]     = useState<any>(null);
    const [loadingRevenue, setLoadingRevenue] = useState(false);

    // Commerce — top products
    const [products, setProducts]           = useState<ProductRow[]>([]);
    const [productsPage, setProductsPage]   = useState(1);
    const [productsTotal, setProductsTotal] = useState(0);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Commerce — top sellers
    const [sellers, setSellers]           = useState<SellerRow[]>([]);
    const [sellersPage, setSellersPage]   = useState(1);
    const [sellersTotal, setSellersTotal] = useState(0);
    const [loadingSellers, setLoadingSellers] = useState(false);

    // Commerce — top services
    const [services, setServices]           = useState<ServiceRow[]>([]);
    const [servicesPage, setServicesPage]   = useState(1);
    const [servicesTotal, setServicesTotal] = useState(0);
    const [loadingServices, setLoadingServices] = useState(false);

    // Commerce — top annonces
    const [annonces, setAnnonces]           = useState<AnnonceRow[]>([]);
    const [annoncesPage, setAnnoncesPage]   = useState(1);
    const [annoncesTotal, setAnnoncesTotal] = useState(0);
    const [loadingAnnonces, setLoadingAnnonces] = useState(false);

    const { socket } = useSocket() as any;

    /* ── Helpers ────────────────────────────────────────────── */
    // Normalise both paginated { data: [], total } and plain array responses
    function extractList<T>(raw: any): T[] {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw as T[];
        if (Array.isArray(raw.data)) return raw.data as T[];
        return [];
    }
    function extractTotal(raw: any): number {
        if (!raw) return 0;
        if (Array.isArray(raw)) return raw.length;
        return typeof raw.total === 'number' ? raw.total : 0;
    }

    /* ── Fetchers indépendants ──────────────────────────────── */
    const fetchRoutes = useCallback(async (page: number) => {
        setLoadingRoutes(true);
        try {
            const res = await analyticsGetRoutes({ period, page, limit: LIMIT });
            setRoutes(extractList<RouteRow>(res.data));
            setRoutesTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingRoutes(false);
    }, [period]);

    const fetchUsers = useCallback(async (page: number) => {
        setLoadingUsers(true);
        try {
            const res = await analyticsGetTopUsers({ period, page, limit: LIMIT });
            setUsers(extractList<UserRow>(res.data));
            setUsersTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingUsers(false);
    }, [period]);

    const fetchRealtime = useCallback(async (page: number) => {
        setLoadingRealtime(true);
        try {
            const res = await analyticsGetRealtime({ page, limit: LIMIT });
            setRealtime(extractList<EventRow>(res.data));
            setRealtimeTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingRealtime(false);
    }, [period]);

    const fetchRevenue = useCallback(async () => {
        setLoadingRevenue(true);
        try {
            const res = await analyticsGetRevenue({ period });
            if (res.data && !Array.isArray(res.data)) setRevenue(res.data);
        } catch { /* ignore */ }
        setLoadingRevenue(false);
    }, [period]);

    const fetchProducts = useCallback(async (page: number) => {
        setLoadingProducts(true);
        try {
            const res = await analyticsGetTopProducts({ period, page, limit: LIMIT });
            setProducts(extractList<ProductRow>(res.data));
            setProductsTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingProducts(false);
    }, [period]);

    const fetchSellers = useCallback(async (page: number) => {
        setLoadingSellers(true);
        try {
            const res = await analyticsGetTopSellers({ period, page, limit: LIMIT });
            setSellers(extractList<SellerRow>(res.data));
            setSellersTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingSellers(false);
    }, [period]);

    const fetchServices = useCallback(async (page: number) => {
        setLoadingServices(true);
        try {
            const res = await analyticsGetTopServices({ period, page, limit: LIMIT });
            setServices(extractList<ServiceRow>(res.data));
            setServicesTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingServices(false);
    }, [period]);

    const fetchAnnonces = useCallback(async (page: number) => {
        setLoadingAnnonces(true);
        try {
            const res = await analyticsGetTopAnnonces({ period, page, limit: LIMIT });
            setAnnonces(extractList<AnnonceRow>(res.data));
            setAnnoncesTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingAnnonces(false);
    }, [period]);

    const fetchVisits = useCallback(async () => {
        setLoadingVisits(true);
        try {
            const [ov, tr, dv] = await Promise.all([
                analyticsSiteVisitGetOverview({ period }),
                analyticsSiteVisitGetTrend({ period }),
                analyticsSiteVisitGetDevices({ period }),
            ]);
            if (ov.data && !Array.isArray(ov.data)) setVisitOverview(ov.data);
            setVisitTrend(extractList(tr.data));
            if (dv.data && !Array.isArray(dv.data)) setVisitDevices(dv.data);
        } catch { /* ignore */ }
        setLoadingVisits(false);
    }, [period]);

    const fetchVisitUsers = useCallback(async (page: number) => {
        setLoadingVisitUsers(true);
        try {
            const res = await analyticsSiteVisitGetTopUsers({ period, page, limit: LIMIT });
            setVisitUsers(extractList<UserRow>(res.data));
            setVisitUsersTotal(extractTotal(res.data));
        } catch { /* ignore */ }
        setLoadingVisitUsers(false);
    }, [period]);

    /* ── fetchAll : reset pages + reload tout ──────────────── */
    const fetchAll = useCallback(async () => {
        setLoading(true);
        setRoutesPage(1); setUsersPage(1); setRealtimePage(1);
        setProductsPage(1); setSellersPage(1); setServicesPage(1); setAnnoncesPage(1);
        setVisitUsersPage(1);
        try {
            const [ov, tr, mod, dv] = await Promise.all([
                analyticsGetOverview({ period }),
                analyticsGetTraffic({ period }),
                analyticsGetModules({ period }),
                analyticsGetDevices({ period }),
            ]);
            if (ov.data && !Array.isArray(ov.data)) setOverview(ov.data);
            setTraffic(extractList(tr.data));
            setModules(extractList(mod.data));
            if (dv.data && !Array.isArray(dv.data)) setDevices(dv.data);
        } catch { /* ignore */ }
        setLoading(false);
        fetchRoutes(1); fetchUsers(1); fetchRealtime(1);
        fetchRevenue(); fetchProducts(1); fetchSellers(1); fetchServices(1); fetchAnnonces(1);
        fetchVisits(); fetchVisitUsers(1);
    }, [period, fetchRoutes, fetchUsers, fetchRealtime, fetchRevenue, fetchProducts, fetchSellers, fetchServices, fetchAnnonces, fetchVisits, fetchVisitUsers]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    /* Page changes */
    const handleRoutesPage   = (p: number) => { setRoutesPage(p);   fetchRoutes(p); };
    const handleUsersPage    = (p: number) => { setUsersPage(p);    fetchUsers(p); };
    const handleRealtimePage = (p: number) => { setRealtimePage(p); fetchRealtime(p); };
    const handleProductsPage = (p: number) => { setProductsPage(p); fetchProducts(p); };
    const handleSellersPage  = (p: number) => { setSellersPage(p);  fetchSellers(p); };
    const handleServicesPage = (p: number) => { setServicesPage(p); fetchServices(p); };
    const handleAnnoncesPage = (p: number) => { setAnnoncesPage(p); fetchAnnonces(p); };
    const handleVisitUsersPage = (p: number) => { setVisitUsersPage(p); fetchVisitUsers(p); };

    /* Real-time socket push */
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

    const fmtCfa = (n?: number) =>
        n === undefined ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M FCFA`
            : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k FCFA` : `${n} FCFA`;

    /* Top 8 products pour le bar chart (depuis la liste actuelle) */
    const productChartData = products.slice(0, 8).map((p) => ({
        name: p.product?.name ? (p.product.name.length > 14 ? p.product.name.slice(0, 14) + '…' : p.product.name) : p.productId.slice(0, 8),
        ventes: p.count,
        quantite: p.totalQty,
    }));

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
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide">
                {(['overview', 'visites', 'commerce', 'realtime'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                            tab === t ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {t === 'overview' ? 'Vue globale' : t === 'visites' ? 'Visites' : t === 'commerce' ? '🛒 Commerce' : 'Temps réel'}
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

                    {/* Top Routes */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Top routes</h2>
                        <GenericTable<RouteRow, string>
                            columns={routeColumns} data={routes} loading={loadingRoutes}
                            emptyMessage="Aucune route pour cette période"
                            totalItems={routesTotal} currentPage={routesPage} itemsPerPage={LIMIT} onPageChange={handleRoutesPage}
                        />
                    </div>

                    {/* Top Users */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Top utilisateurs actifs</h2>
                        <GenericTable<UserRow, string>
                            columns={userColumns} data={users} loading={loadingUsers}
                            emptyMessage="Aucun utilisateur pour cette période"
                            totalItems={usersTotal} currentPage={usersPage} itemsPerPage={LIMIT} onPageChange={handleUsersPage}
                        />
                    </div>
                </div>
            )}

            {/* ══ Visites ═════════════════════════════════════════ */}
            {tab === 'visites' && (
                <div className="space-y-4 md:space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        <KpiCard icon="solar:eye-bold-duotone"                  label="Total visites"       value={fmt(visitOverview?.totalVisits)}       color="#3B82F6" />
                        <KpiCard icon="solar:users-group-two-rounded-bold-duotone" label="Visiteurs uniques" value={fmt(visitOverview?.uniqueVisitors)}    color="#8B5CF6" />
                        <KpiCard icon="solar:user-check-rounded-bold-duotone"   label="Connectés"           value={fmt(visitOverview?.connectedVisitors)} color="#10B981" />
                        <KpiCard icon="solar:user-id-bold-duotone"              label="Anonymes"            value={fmt(visitOverview?.anonymousVisitors)} color="#F59E0B" />
                        <KpiCard icon="solar:calendar-mark-bold-duotone"        label="Aujourd'hui"         value={fmt(visitOverview?.visitsToday)}       color="#EF4444" />
                        <KpiCard icon="solar:calendar-bold-duotone"             label="Cette semaine"       value={fmt(visitOverview?.visitsWeek)}        color="#06B6D4" />
                        <KpiCard icon="solar:calendar-search-bold-duotone"      label="Ce mois"             value={fmt(visitOverview?.visitsMonth)}       color="#8B5CF6" />
                    </div>

                    {/* Évolution des visites */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Évolution des visites</h2>
                        {visitTrend.length === 0 ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                                {loadingVisits ? <Icon icon="solar:refresh-bold-duotone" width={20} className="animate-spin" /> : 'Aucune donnée'}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={visitTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }} />
                                    <Area type="monotone" dataKey="visits" name="Visites" stroke="#3B82F6" fill="url(#gVisits)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Navigateur / OS / Appareil */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Navigateurs, OS & appareils</h2>
                        {!visitDevices ? (
                            <div className="h-28 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {([
                                    { title: 'Navigateur', data: visitDevices.browsers },
                                    { title: 'Système',    data: visitDevices.os },
                                    { title: 'Appareil',   data: visitDevices.devices },
                                ] as const).map((block) => (
                                    <div key={block.title}>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">{block.title}</p>
                                        <ResponsiveContainer width="100%" height={140}>
                                            <BarChart data={block.data} margin={{ left: -10, right: 4 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                                <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                                <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                                                <Bar dataKey="value" name="Visites" radius={[4, 4, 0, 0]}>
                                                    {block.data.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* PWA vs Navigateur */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">PWA vs Navigateur</h2>
                        {!visitDevices?.pwa?.length ? (
                            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">Aucune donnée</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={visitDevices.pwa} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} paddingAngle={2}>
                                        {visitDevices.pwa.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Visiteurs connectés les plus actifs */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Visiteurs connectés les plus actifs</h2>
                        <GenericTable<UserRow, string>
                            columns={userColumns} data={visitUsers} loading={loadingVisitUsers}
                            emptyMessage="Aucun visiteur connecté pour cette période"
                            totalItems={visitUsersTotal} currentPage={visitUsersPage} itemsPerPage={LIMIT} onPageChange={handleVisitUsersPage}
                        />
                    </div>
                </div>
            )}

            {/* ══ Commerce ════════════════════════════════════════ */}
            {tab === 'commerce' && (
                <div className="space-y-4 md:space-y-6">

                    {/* KPI Revenus */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KpiCard icon="solar:dollar-minimalistic-bold-duotone"  label="Chiffre d'affaires"  value={fmtCfa(revenue?.totalRevenue)}                             color="#10B981" />
                        <KpiCard icon="solar:bag-smile-bold-duotone"            label="Commandes"           value={fmt(revenue?.totalOrders)}     sub="hors annulées"        color="#3B82F6" />
                        <KpiCard icon="solar:cart-large-4-bold-duotone"         label="Panier moyen"        value={fmtCfa(revenue?.avgOrderValue)}                           color="#8B5CF6" />
                        <KpiCard icon="solar:calendar-mark-bold-duotone"        label="Bookings"            value={fmt(revenue?.totalBookings)}   sub="services + annonces"  color="#F59E0B" />
                    </div>

                    {/* Revenue trend */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">Évolution du chiffre d'affaires</h2>
                        {!revenue?.trend?.length ? (
                            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                                {loadingRevenue ? <Icon icon="solar:refresh-bold-duotone" width={20} className="animate-spin" /> : 'Aucune commande sur la période'}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={200}>
                                <AreaChart data={revenue.trend} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gCA" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" />
                                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="ca"     orientation="left"  tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                                    <YAxis yAxisId="orders" orientation="right" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid rgba(0,0,0,.08)' }} formatter={(v: any, name) => name === 'CA' ? [`${Math.round(Number(v)).toLocaleString('fr-FR')} FCFA`] : [v]} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                                    <Area yAxisId="ca"     type="monotone" dataKey="revenue" name="CA"        stroke="#10B981" fill="url(#gCA)"     strokeWidth={2} dot={false} />
                                    <Area yAxisId="orders" type="monotone" dataKey="orders"  name="Commandes" stroke="#3B82F6" fill="url(#gOrders)" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Top produits — bar chart + table */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Icon icon="solar:bag-heart-bold-duotone" width={16} className="text-primary" />
                            Produits les plus vendus
                        </h2>
                        {productChartData.length > 0 && (
                            <div className="mb-4">
                                <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={productChartData} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.06)" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 11 }} />
                                        <Bar dataKey="ventes" name="Commandes" radius={[4, 4, 0, 0]}>
                                            {productChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        <GenericTable<ProductRow, string>
                            columns={productColumns} data={products} loading={loadingProducts}
                            emptyMessage="Aucune vente sur la période"
                            totalItems={productsTotal} currentPage={productsPage} itemsPerPage={LIMIT} onPageChange={handleProductsPage}
                        />
                    </div>

                    {/* Top vendeurs */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Icon icon="solar:star-bold-duotone" width={16} className="text-amber-500" />
                            Meilleurs vendeurs
                        </h2>
                        <GenericTable<SellerRow, string>
                            columns={sellerColumns} data={sellers} loading={loadingSellers}
                            emptyMessage="Aucun vendeur sur la période"
                            totalItems={sellersTotal} currentPage={sellersPage} itemsPerPage={LIMIT} onPageChange={handleSellersPage}
                        />
                    </div>

                    {/* Services + Annonces */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Icon icon="solar:hand-stars-bold-duotone" width={16} className="text-violet-500" />
                                Services les plus demandés
                            </h2>
                            <GenericTable<ServiceRow, string>
                                columns={serviceColumns} data={services} loading={loadingServices}
                                emptyMessage="Aucun booking service sur la période"
                                totalItems={servicesTotal} currentPage={servicesPage} itemsPerPage={LIMIT} onPageChange={handleServicesPage}
                            />
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Icon icon="solar:megaphone-bold-duotone" width={16} className="text-amber-500" />
                                Annonces les plus bookées
                            </h2>
                            <GenericTable<AnnonceRow, string>
                                columns={annonceColumns} data={annonces} loading={loadingAnnonces}
                                emptyMessage="Aucun booking annonce sur la période"
                                totalItems={annoncesTotal} currentPage={annoncesPage} itemsPerPage={LIMIT} onPageChange={handleAnnoncesPage}
                            />
                        </div>
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
                                            <td className="py-1.5 font-medium text-foreground"><span className="block truncate max-w-[90px]">{e.module}</span></td>
                                            <td className="py-1.5"><MethodBadge method={e.method} /></td>
                                            <td className="py-1.5 font-mono text-foreground"><span className="block truncate max-w-[160px] md:max-w-[220px]">{e.route ?? '—'}</span></td>
                                            <td className="py-1.5 text-center">
                                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${isErr ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>{e.statusCode ?? '—'}</span>
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

                    {realtimeTotal > LIMIT && (
                        <div className="border-t border-border/50 mt-2">
                            <TablePagination
                                page={realtimePage} limit={LIMIT} total={realtimeTotal}
                                totalPages={Math.ceil(realtimeTotal / LIMIT)} onPageChange={handleRealtimePage}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
