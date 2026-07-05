'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { ColumnDef } from '@tanstack/react-table';
import { RefreshCcw, Send, Search } from 'lucide-react';
import { adminGetWebPushNotifs, adminReplayWebPushNotif, adminGetWebPushSubscriptions } from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Badge } from '@/components/ui/badge';
import { PushNotificationModal } from '@/components/notifications/PushNotificationModal';
import { useDebounce } from '@/hooks/useDebounce';
import { WebPushNotifAdminItem, WebPushNotifStatus, NotificationSubscriptionAdminItem } from '@/types/interface';

const LIMIT = 10;

const STATUS_META: Record<WebPushNotifStatus, { label: string; color: string; badgeClass: string }> = {
    PENDING: { label: 'En attente', color: '#F59E0B', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    SENT: { label: 'Envoyée', color: '#3B82F6', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    READ: { label: 'Lue', color: '#10B981', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    FAILED: { label: 'Échec', color: '#EF4444', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const FILTERS: { value: WebPushNotifStatus | ''; label: string }[] = [
    { value: '', label: 'Toutes' },
    { value: 'PENDING', label: 'En attente' },
    { value: 'SENT', label: 'Envoyées' },
    { value: 'READ', label: 'Lues' },
    { value: 'FAILED', label: 'Échecs' },
];

/* ─── KPI Card (même style que /admin/kpi) ─────────────────── */
function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string; }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border shadow-sm flex items-start gap-3 min-w-0 overflow-hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon icon={icon} width={20} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-tight truncate">{label}</p>
                <p className="text-xl font-bold mt-0.5 text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

type TabType = 'historique' | 'abonnes';

export default function AdminWebPushPage() {
    const [activeTab, setActiveTab] = useState<TabType>('historique');

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Notifications WebPush</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Suivi, relance et envoi de notifications push (Firebase)</p>
                </div>
            </div>

            {/* ── Tabs ─────────────────────────────────────────── */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab('historique')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'historique' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Historique
                </button>
                <button
                    onClick={() => setActiveTab('abonnes')}
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === 'abonnes' ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    Abonnés
                </button>
            </div>

            {activeTab === 'historique' && <AdminWebPushHistoryTab />}
            {activeTab === 'abonnes' && <AdminWebPushSubscribersTab />}
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Historique (contenu existant, inchangé)
   ═══════════════════════════════════════════════════════════ */
function AdminWebPushHistoryTab() {
    const [statusFilter, setStatusFilter] = useState<WebPushNotifStatus | ''>('');
    const [items, setItems] = useState<WebPushNotifAdminItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [replayingId, setReplayingId] = useState<string | null>(null);

    // Compteurs par statut pour les cartes KPI — un appel léger (limit=1) par statut,
    // le total renvoyé par le backend vient d'un count() Prisma indépendant de la pagination.
    const [counts, setCounts] = useState<Record<'ALL' | WebPushNotifStatus, number>>({
        ALL: 0, PENDING: 0, SENT: 0, READ: 0, FAILED: 0,
    });

    const fetchCounts = useCallback(async () => {
        const statuses: (WebPushNotifStatus | undefined)[] = [undefined, 'PENDING', 'SENT', 'READ', 'FAILED'];
        const results = await Promise.all(
            statuses.map((s) => adminGetWebPushNotifs({ page: 1, limit: 1, status: s }).catch(() => null)),
        );
        const [all, pending, sent, read, failed] = results;
        setCounts({
            ALL: all?.data?.total ?? 0,
            PENDING: pending?.data?.total ?? 0,
            SENT: sent?.data?.total ?? 0,
            READ: read?.data?.total ?? 0,
            FAILED: failed?.data?.total ?? 0,
        });
    }, []);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetWebPushNotifs({ page, limit: LIMIT, status: statusFilter || undefined });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.items);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching admin WebPush notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);
    useEffect(() => { fetchList(); }, [fetchList]);

    const handleFilterChange = (value: WebPushNotifStatus | '') => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleRefresh = () => {
        fetchCounts();
        fetchList();
    };

    const handleReplay = async (row: WebPushNotifAdminItem) => {
        setReplayingId(row.id);
        try {
            const res = await adminReplayWebPushNotif(row.id);
            if (res.data?.success) {
                await Promise.all([fetchList(), fetchCounts()]);
            }
        } catch (err) {
            console.error('Error replaying WebPush notification:', err);
        } finally {
            setReplayingId(null);
        }
    };

    const columns: ColumnDef<WebPushNotifAdminItem>[] = [
        {
            accessorKey: 'title',
            header: 'Titre',
            cell: ({ row }) => (
                <div className="max-w-[180px]">
                    <p className="font-semibold text-foreground truncate">{row.original.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.body}</p>
                </div>
            ),
        },
        {
            id: 'user',
            header: 'Utilisateur',
            cell: ({ row }) => {
                const u = row.original.user;
                return (
                    <div className="min-w-0">
                        <p className="font-medium text-foreground truncate max-w-[160px]">{u?.fullName || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{u?.email || u?.phone || ''}</p>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }) => {
                const meta = STATUS_META[row.original.status];
                return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
            },
        },
        {
            accessorKey: 'sentCount',
            header: 'Tentatives',
            cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.sentCount}</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Créée le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="flex-shrink-0 p-2 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-muted transition-colors"
                >
                    <Icon icon="solar:refresh-bold-duotone" width={15} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── KPI Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <KpiCard icon="solar:bell-bing-bold-duotone" label="Total" value={counts.ALL} color="#6366F1" />
                <KpiCard icon="solar:clock-circle-bold-duotone" label={STATUS_META.PENDING.label} value={counts.PENDING} color={STATUS_META.PENDING.color} />
                <KpiCard icon="solar:letter-unread-bold-duotone" label={STATUS_META.SENT.label} value={counts.SENT} color={STATUS_META.SENT.color} />
                <KpiCard icon="solar:check-read-bold-duotone" label={STATUS_META.READ.label} value={counts.READ} color={STATUS_META.READ.color} />
                <KpiCard icon="solar:close-circle-bold-duotone" label={STATUS_META.FAILED.label} value={counts.FAILED} color={STATUS_META.FAILED.color} />
            </div>

            {/* ── Filtres ──────────────────────────────────────── */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide">
                {FILTERS.map((f) => (
                    <button
                        key={f.value || 'all'}
                        onClick={() => handleFilterChange(f.value)}
                        className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${statusFilter === f.value ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable<WebPushNotifAdminItem, string>
                    columns={columns}
                    data={items}
                    loading={loading || replayingId !== null}
                    emptyMessage="Aucune notification WebPush"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={setPage}
                    actions={[
                        {
                            icon: RefreshCcw,
                            label: 'Relancer',
                            value: 'replay',
                            disabled: (row) => row.status !== 'READ' && row.status !== 'FAILED',
                        },
                    ]}
                    onAction={(action, row) => {
                        if (action === 'replay') handleReplay(row);
                    }}
                />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   TAB : Abonnés (nouveau)
   ═══════════════════════════════════════════════════════════ */
const SORT_OPTIONS: { value: string; sortBy: 'createdAt' | 'updatedAt'; sortOrder: 'asc' | 'desc'; label: string }[] = [
    { value: 'recent', sortBy: 'createdAt', sortOrder: 'desc', label: 'Plus récents' },
    { value: 'old', sortBy: 'createdAt', sortOrder: 'asc', label: 'Plus anciens' },
    { value: 'updated', sortBy: 'updatedAt', sortOrder: 'desc', label: 'Dernière mise à jour' },
];

function EndpointCell({ endpoint }: { endpoint: string }) {
    const [copied, setCopied] = useState(false);
    const truncated = endpoint.length > 24 ? `${endpoint.slice(0, 10)}…${endpoint.slice(-8)}` : endpoint;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(endpoint);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error('Clipboard indisponible:', err);
        }
    };

    return (
        <button onClick={handleCopy} title="Copier l'endpoint" className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
            <span className="truncate max-w-[130px]">{truncated}</span>
            <Icon icon={copied ? 'solar:check-circle-bold-duotone' : 'solar:copy-bold-duotone'} className="w-3.5 h-3.5 shrink-0" />
        </button>
    );
}

function AdminWebPushSubscribersTab() {
    const [items, setItems] = useState<NotificationSubscriptionAdminItem[]>([]);
    const [total, setTotal] = useState(0);
    const [totalSubscribers, setTotalSubscribers] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [invalidCount, setInvalidCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState(SORT_OPTIONS[0].value);
    const debouncedSearch = useDebounce(search, 400);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'single' | 'broadcast'>('broadcast');
    const [selectedSubscriber, setSelectedSubscriber] = useState<NotificationSubscriptionAdminItem | undefined>(undefined);

    const sortConfig = SORT_OPTIONS.find((s) => s.value === sort) ?? SORT_OPTIONS[0];

    const fetchCounts = useCallback(async () => {
        const [all, active, invalid] = await Promise.all([
            adminGetWebPushSubscriptions({ page: 1, limit: 1 }).catch(() => null),
            adminGetWebPushSubscriptions({ page: 1, limit: 1, isActive: true }).catch(() => null),
            adminGetWebPushSubscriptions({ page: 1, limit: 1, isActive: false }).catch(() => null),
        ]);
        setTotalSubscribers(all?.data?.total ?? 0);
        setActiveCount(active?.data?.total ?? 0);
        setInvalidCount(invalid?.data?.total ?? 0);
    }, []);

    const fetchList = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetWebPushSubscriptions({
                page,
                limit: LIMIT,
                search: debouncedSearch || undefined,
                sortBy: sortConfig.sortBy,
                sortOrder: sortConfig.sortOrder,
            });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.items);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching WebPush subscriptions:', err);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, sortConfig.sortBy, sortConfig.sortOrder]);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);
    useEffect(() => { fetchList(); }, [fetchList]);
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const handleSent = () => {
        fetchList();
        fetchCounts();
    };

    const openSendToUser = (row: NotificationSubscriptionAdminItem) => {
        setSelectedSubscriber(row);
        setModalMode('single');
        setModalOpen(true);
    };

    const openBroadcast = () => {
        setSelectedSubscriber(undefined);
        setModalMode('broadcast');
        setModalOpen(true);
    };

    const columns: ColumnDef<NotificationSubscriptionAdminItem>[] = [
        {
            id: 'user',
            header: 'Utilisateur',
            cell: ({ row }) => {
                const u = row.original.user;
                const initial = (u.fullName || u.email || '?').charAt(0).toUpperCase();
                return (
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 relative">
                            {u.avatar ? (
                                <Image src={u.avatar} alt="" fill className="object-cover" unoptimized />
                            ) : (
                                <span className="text-xs font-black text-primary">{initial}</span>
                            )}
                        </div>
                        <p className="font-semibold text-foreground truncate max-w-[140px]">{u.fullName || '—'}</p>
                    </div>
                );
            },
        },
        {
            id: 'email',
            header: 'Email',
            cell: ({ row }) => <span className="text-xs text-muted-foreground truncate max-w-[160px] block">{row.original.user.email || '—'}</span>,
        },
        {
            id: 'phone',
            header: 'Téléphone',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{row.original.user.phone || '—'}</span>,
        },
        {
            accessorKey: 'browser',
            header: 'Navigateur',
            cell: ({ row }) => <span className="text-xs font-medium">{row.original.browser}</span>,
        },
        {
            accessorKey: 'platform',
            header: 'Plateforme',
            cell: ({ row }) => <span className="text-xs font-medium">{row.original.platform}</span>,
        },
        {
            id: 'endpoint',
            header: 'Endpoint',
            cell: ({ row }) => <EndpointCell endpoint={row.original.endpoint} />,
        },
        {
            accessorKey: 'createdAt',
            header: 'Souscrit le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
        },
        {
            accessorKey: 'updatedAt',
            header: 'MAJ le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.updatedAt)}</span>,
        },
        {
            accessorKey: 'isActive',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge className={row.original.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}>
                    {row.original.isActive ? 'Actif' : 'Invalide'}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            {/* ── KPI Cards ────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-3">
                <KpiCard icon="solar:users-group-rounded-bold-duotone" label="Total abonnés" value={totalSubscribers} color="#6366F1" />
                <KpiCard icon="solar:check-circle-bold-duotone" label="Actifs" value={activeCount} color="#10B981" />
                <KpiCard icon="solar:close-circle-bold-duotone" label="Invalides" value={invalidCount} color="#EF4444" />
            </div>

            {/* ── Barre d'actions ──────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher (nom, email, téléphone)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                        />
                    </div>
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                    >
                        {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <button
                    onClick={openBroadcast}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap"
                >
                    <Send className="w-4 h-4" />
                    Envoyer une notification
                </button>
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable<NotificationSubscriptionAdminItem, string>
                    columns={columns}
                    data={items}
                    loading={loading}
                    emptyMessage="Aucun abonné WebPush"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={setPage}
                    actions={[
                        { icon: Send, label: 'Envoyer', value: 'send' },
                    ]}
                    onAction={(action, row) => {
                        if (action === 'send') openSendToUser(row);
                    }}
                />
            </div>

            <PushNotificationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                mode={modalMode}
                subscriber={selectedSubscriber}
                onSent={handleSent}
            />
        </div>
    );
}
