'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { Package, ShoppingCart, Bell, RefreshCcw, Search } from 'lucide-react';
import {
    adminGetStores,
    adminGetStoreProducts,
    adminGetStoreOrders,
    adminGetStoreNotifications,
    adminReplayWebPushNotif,
} from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { StoreUserInfo, Product, Order, OrderStatus, WebPushNotifAdminItem, WebPushNotifStatus } from '@/types/interface';

const LIMIT = 10;

type StoreRow = StoreUserInfo & { productCount: number };
type PanelType = 'products' | 'orders' | 'notifications' | null;

const NOTIF_STATUS_META: Record<WebPushNotifStatus, { label: string; badgeClass: string }> = {
    PENDING: { label: 'En attente', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    SENT: { label: 'Envoyée', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    READ: { label: 'Lue', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    FAILED: { label: 'Échec', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

const ORDER_STATUS_META: Record<OrderStatus, { label: string; badgeClass: string }> = {
    PENDING: { label: 'En attente', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    PROCESSING: { label: 'En traitement', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    VALIDATED: { label: 'Validée', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' },
    PAID: { label: 'Payée', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    SHIPPED: { label: 'Expédiée', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    DELIVERED: { label: 'Livrée', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    CANCELLED: { label: 'Annulée', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    PARTIELLEMENT_EXPEDIEE: { label: 'Part. expédiée', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
    PARTIELLEMENT_COMPLETE: { label: 'Part. complétée', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300' },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminStoresPage() {
    const [stores, setStores] = useState<StoreRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const [panel, setPanel] = useState<PanelType>(null);
    const [selectedStore, setSelectedStore] = useState<StoreRow | null>(null);

    const fetchStores = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetStores({ page, limit: LIMIT, storeName: debouncedSearch || undefined });
            if (res.statusCode === 200 && res.data) {
                setStores(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching stores:', err);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchStores(); }, [fetchStores]);
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const openPanel = (type: PanelType, store: StoreRow) => {
        if (!store.storeName) return;
        setSelectedStore(store);
        setPanel(type);
    };

    const closePanel = () => {
        setPanel(null);
        setSelectedStore(null);
    };

    const columns: ColumnDef<StoreRow>[] = [
        {
            id: 'store',
            header: 'Boutique',
            cell: ({ row }) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon icon="solar:shop-2-bold-duotone" width={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate max-w-[160px]">{row.original.storeName || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.fullName || row.original.companyName || ''}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'contact',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.email || '—'}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.original.phone || ''}</p>
                </div>
            ),
        },
        {
            accessorKey: 'productCount',
            header: 'Produits',
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.productCount}</span>,
        },
    ];

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Boutiques</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Boutiques, produits, commandes et notifications</p>
                </div>
            </div>

            {/* ── Recherche ────────────────────────────────────── */}
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Rechercher une boutique..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                />
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable<StoreRow, string>
                    columns={columns}
                    data={stores}
                    loading={loading}
                    emptyMessage="Aucune boutique"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={setPage}
                    actions={[
                        { icon: Package, label: 'Produits', value: 'products' },
                        { icon: ShoppingCart, label: 'Commandes', value: 'orders' },
                        { icon: Bell, label: 'Notifications', value: 'notifications' },
                    ]}
                    onAction={(action, row) => openPanel(action as PanelType, row)}
                />
            </div>

            <Modal isOpen={panel === 'products'} onClose={closePanel} title={selectedStore ? `Produits — ${selectedStore.storeName}` : undefined}>
                {selectedStore && <StoreProductsPanel store={selectedStore} />}
            </Modal>

            <Modal isOpen={panel === 'orders'} onClose={closePanel} title={selectedStore ? `Commandes — ${selectedStore.storeName}` : undefined}>
                {selectedStore && <StoreOrdersPanel store={selectedStore} />}
            </Modal>

            <Modal isOpen={panel === 'notifications'} onClose={closePanel} title={selectedStore ? `Notifications — ${selectedStore.storeName}` : undefined}>
                {selectedStore && <StoreNotificationsPanel store={selectedStore} />}
            </Modal>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Produits d'une boutique
   ═══════════════════════════════════════════════════════════ */
function StoreProductsPanel({ store }: { store: StoreRow }) {
    const [items, setItems] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        if (!store.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetStoreProducts(store.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching store products:', err);
        } finally {
            setLoading(false);
        }
    }, [store.storeName, page]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const columns: ColumnDef<Product>[] = [
        {
            id: 'name',
            header: 'Produit',
            cell: ({ row }) => (
                <div className="min-w-0 max-w-[200px]">
                    <p className="font-semibold text-foreground truncate">{row.original.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.sku}</p>
                </div>
            ),
        },
        {
            accessorKey: 'price',
            header: 'Prix',
            cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.price.toLocaleString('fr-FR')} F</span>,
        },
        {
            accessorKey: 'stock',
            header: 'Stock',
            cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.stock}</span>,
        },
        {
            accessorKey: 'isActive',
            header: 'Statut',
            cell: ({ row }) => (
                <Badge className={row.original.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}>
                    {row.original.isActive ? 'Actif' : 'Inactif'}
                </Badge>
            ),
        },
    ];

    return (
        <div className="p-4">
            <GenericTable<Product, string>
                columns={columns}
                data={items}
                loading={loading}
                emptyMessage="Aucun produit pour cette boutique"
                totalItems={total}
                currentPage={page}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Commandes d'une boutique
   ═══════════════════════════════════════════════════════════ */
function StoreOrdersPanel({ store }: { store: StoreRow }) {
    const [items, setItems] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        if (!store.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetStoreOrders(store.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching store orders:', err);
        } finally {
            setLoading(false);
        }
    }, [store.storeName, page]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const columns: ColumnDef<Order>[] = [
        {
            accessorKey: 'code',
            header: 'Commande',
            cell: ({ row }) => <span className="font-semibold text-foreground text-sm">{row.original.code}</span>,
        },
        {
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }) => {
                const meta = ORDER_STATUS_META[row.original.status];
                return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
            },
        },
        {
            accessorKey: 'totalAmount',
            header: 'Montant',
            cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.totalAmount.toLocaleString('fr-FR')} F</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
        },
    ];

    return (
        <div className="p-4">
            <GenericTable<Order, string>
                columns={columns}
                data={items}
                loading={loading}
                emptyMessage="Aucune commande pour cette boutique"
                totalItems={total}
                currentPage={page}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Notifications d'une boutique (avec relance)
   ═══════════════════════════════════════════════════════════ */
function StoreNotificationsPanel({ store }: { store: StoreRow }) {
    const [items, setItems] = useState<WebPushNotifAdminItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [replayingId, setReplayingId] = useState<string | null>(null);

    const fetchList = useCallback(async () => {
        if (!store.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetStoreNotifications(store.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.items);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching store notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [store.storeName, page]);

    useEffect(() => { fetchList(); }, [fetchList]);

    // Relance manuelle (voir WebPush.replayNotification côté backend) : disponible tant que la
    // notification n'a pas déjà été lue (statut READ) — même règle que /admin/webpush.
    const handleReplay = async (row: WebPushNotifAdminItem) => {
        setReplayingId(row.id);
        try {
            const res = await adminReplayWebPushNotif(row.id);
            if (res.data?.success) await fetchList();
        } catch (err) {
            console.error('Error replaying store notification:', err);
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
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }) => {
                const meta = NOTIF_STATUS_META[row.original.status];
                return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
            },
        },
        {
            accessorKey: 'createdAt',
            header: 'Créée le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
        },
    ];

    return (
        <div className="p-4">
            <GenericTable<WebPushNotifAdminItem, string>
                columns={columns}
                data={items}
                loading={loading || replayingId !== null}
                emptyMessage="Aucune notification pour cette boutique"
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
    );
}
