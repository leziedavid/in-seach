'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { RefreshCcw } from 'lucide-react';
import { adminGetWebPushNotifs, adminReplayWebPushNotif } from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Badge } from '@/components/ui/badge';
import { WebPushNotifAdminItem, WebPushNotifStatus } from '@/types/interface';

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

export default function AdminWebPushPage() {
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
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Notifications WebPush</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Suivi et relance des notifications push (Firebase)</p>
                </div>
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
