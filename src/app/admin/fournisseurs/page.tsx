'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { Package, ShoppingCart, FileText, Search } from 'lucide-react';
import {
    adminGetFournisseurs,
    adminGetFournisseurProducts,
    adminGetFournisseurOrders,
    adminGetFournisseurQuotes,
} from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { useDebounce } from '@/hooks/useDebounce';
import { StoreUserInfo, Product, Order, OrderStatus, SupplierQuote, SupplierQuoteStatus } from '@/types/interface';

const LIMIT = 10;

type FournisseurRow = StoreUserInfo & { productCount: number };
type PanelType = 'products' | 'orders' | 'quotes' | null;

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

const QUOTE_STATUS_META: Record<SupplierQuoteStatus, { label: string; badgeClass: string }> = {
    PENDING: { label: 'En attente', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    VALIDATED: { label: 'Validé', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    REJECTED: { label: 'Refusé', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
    CANCELLED: { label: 'Annulé', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300' },
};

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminFournisseursPage() {
    const [fournisseurs, setFournisseurs] = useState<FournisseurRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const [panel, setPanel] = useState<PanelType>(null);
    const [selectedFournisseur, setSelectedFournisseur] = useState<FournisseurRow | null>(null);

    const fetchFournisseurs = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetFournisseurs({ page, limit: LIMIT, storeName: debouncedSearch || undefined });
            if (res.statusCode === 200 && res.data) {
                setFournisseurs(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching fournisseurs:', err);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchFournisseurs(); }, [fetchFournisseurs]);
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const openPanel = (type: PanelType, fournisseur: FournisseurRow) => {
        if (!fournisseur.storeName) return;
        setSelectedFournisseur(fournisseur);
        setPanel(type);
    };

    const closePanel = () => {
        setPanel(null);
        setSelectedFournisseur(null);
    };

    const columns: ColumnDef<FournisseurRow>[] = [
        {
            id: 'fournisseur',
            header: 'Fournisseur',
            cell: ({ row }) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon icon="mdi:warehouse" width={18} className="text-primary" />
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
            header: 'Produits B2B',
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.productCount}</span>,
        },
    ];

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Fournisseurs</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Catalogue B2B, commandes et devis — séparé de la marketplace classique</p>
                </div>
            </div>

            {/* ── Recherche ────────────────────────────────────── */}
            <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Rechercher un fournisseur..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                />
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable<FournisseurRow, string>
                    columns={columns}
                    data={fournisseurs}
                    loading={loading}
                    emptyMessage="Aucun fournisseur"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={setPage}
                    actions={[
                        { icon: Package, label: 'Produits', value: 'products' },
                        { icon: ShoppingCart, label: 'Commandes', value: 'orders' },
                        { icon: FileText, label: 'Devis', value: 'quotes' },
                    ]}
                    onAction={(action, row) => openPanel(action as PanelType, row)}
                />
            </div>

            <Modal isOpen={panel === 'products'} onClose={closePanel} title={selectedFournisseur ? `Produits — ${selectedFournisseur.storeName}` : undefined}>
                {selectedFournisseur && <FournisseurProductsPanel fournisseur={selectedFournisseur} />}
            </Modal>

            <Modal isOpen={panel === 'orders'} onClose={closePanel} title={selectedFournisseur ? `Commandes — ${selectedFournisseur.storeName}` : undefined}>
                {selectedFournisseur && <FournisseurOrdersPanel fournisseur={selectedFournisseur} />}
            </Modal>

            <Modal isOpen={panel === 'quotes'} onClose={closePanel} title={selectedFournisseur ? `Devis — ${selectedFournisseur.storeName}` : undefined}>
                {selectedFournisseur && <FournisseurQuotesPanel fournisseur={selectedFournisseur} />}
            </Modal>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Produits B2B d'un fournisseur
   ═══════════════════════════════════════════════════════════ */
function FournisseurProductsPanel({ fournisseur }: { fournisseur: FournisseurRow }) {
    const [items, setItems] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        if (!fournisseur.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetFournisseurProducts(fournisseur.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching fournisseur products:', err);
        } finally {
            setLoading(false);
        }
    }, [fournisseur.storeName, page]);

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
                emptyMessage="Aucun produit B2B pour ce fournisseur"
                totalItems={total}
                currentPage={page}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Commandes d'un fournisseur
   ═══════════════════════════════════════════════════════════ */
function FournisseurOrdersPanel({ fournisseur }: { fournisseur: FournisseurRow }) {
    const [items, setItems] = useState<Order[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        if (!fournisseur.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetFournisseurOrders(fournisseur.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching fournisseur orders:', err);
        } finally {
            setLoading(false);
        }
    }, [fournisseur.storeName, page]);

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
                emptyMessage="Aucune commande pour ce fournisseur"
                totalItems={total}
                currentPage={page}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
            />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PANEL : Devis (SupplierQuote) reçus par un fournisseur
   ═══════════════════════════════════════════════════════════ */
function FournisseurQuotesPanel({ fournisseur }: { fournisseur: FournisseurRow }) {
    const [items, setItems] = useState<SupplierQuote[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const fetchList = useCallback(async () => {
        if (!fournisseur.storeName) return;
        setLoading(true);
        try {
            const res = await adminGetFournisseurQuotes(fournisseur.storeName, { page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Error fetching fournisseur quotes:', err);
        } finally {
            setLoading(false);
        }
    }, [fournisseur.storeName, page]);

    useEffect(() => { fetchList(); }, [fetchList]);

    const columns: ColumnDef<SupplierQuote>[] = [
        {
            id: 'code',
            header: 'Devis',
            cell: ({ row }) => (
                <div className="min-w-0 max-w-[200px]">
                    <p className="font-semibold text-foreground text-sm">{row.original.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{row.original.product?.name || '—'}</p>
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Statut',
            cell: ({ row }) => {
                const meta = QUOTE_STATUS_META[row.original.status];
                return <Badge className={meta.badgeClass}>{meta.label}</Badge>;
            },
        },
        {
            id: 'quantity',
            header: 'Qté x P.U.',
            cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.quantity} x {row.original.unitPrice.toLocaleString('fr-FR')} F</span>,
        },
        {
            accessorKey: 'totalAmount',
            header: 'Montant',
            cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.totalAmount.toLocaleString('fr-FR')} F</span>,
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
        },
    ];

    return (
        <div className="p-4">
            <GenericTable<SupplierQuote, string>
                columns={columns}
                data={items}
                loading={loading}
                emptyMessage="Aucun devis pour ce fournisseur"
                totalItems={total}
                currentPage={page}
                itemsPerPage={LIMIT}
                onPageChange={setPage}
            />
        </div>
    );
}
