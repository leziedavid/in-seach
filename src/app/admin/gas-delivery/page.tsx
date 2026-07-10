'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { adminGetGasOverview, adminGetGasProviders, adminSetGasProviderAvailability } from '@/api/api';
import { GasAdminOverview, GasProviderAdminRow } from '@/types/interface';
import { TablePagination } from '@/components/ui/table/Pagination';

const LIMIT = 10;

/* ─── KPI Card — mêmes proportions/styles que /admin/kpi ─────────────── */
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

export default function AdminGasDeliveryPage() {
    const [overview, setOverview] = useState<GasAdminOverview | null>(null);
    const [loadingOverview, setLoadingOverview] = useState(true);

    const [providers, setProviders] = useState<GasProviderAdminRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    const fetchOverview = useCallback(async () => {
        setLoadingOverview(true);
        try {
            const res = await adminGetGasOverview();
            if (res.statusCode === 200 && res.data) setOverview(res.data);
        } catch {
            toast.error('Erreur lors du chargement des statistiques');
        } finally {
            setLoadingOverview(false);
        }
    }, []);

    const fetchProviders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminGetGasProviders({ page, limit: LIMIT, search: search || undefined });
            if (res.statusCode === 200 && res.data) {
                setProviders(res.data.data);
                setTotalPages(res.data.totalPages);
                setTotalItems(res.data.total);
            }
        } catch {
            toast.error('Erreur lors du chargement des prestataires');
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchOverview(); }, [fetchOverview]);
    useEffect(() => { fetchProviders(); }, [fetchProviders]);

    const handleToggleAvailability = async (provider: GasProviderAdminRow) => {
        setTogglingId(provider.id);
        try {
            const res = await adminSetGasProviderAvailability(provider.id, !provider.isAvailable);
            if (res.statusCode === 200) {
                toast.success(provider.isAvailable ? 'Prestataire désactivé' : 'Prestataire réactivé');
                setProviders(prev => prev.map(p => p.id === provider.id ? { ...p, isAvailable: !provider.isAvailable } : p));
                fetchOverview();
            } else {
                toast.error(res.message || 'Erreur lors de la mise à jour');
            }
        } catch {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setTogglingId(null);
        }
    };

    const fmt = (n?: number) =>
        n === undefined ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
            : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k` : String(n);

    const fmtCfa = (n?: number) =>
        n === undefined ? '—' : n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M FCFA`
            : n >= 1_000 ? `${(n / 1_000).toFixed(0)}k FCFA` : `${n} FCFA`;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Recharge de gaz</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Vue d'ensemble et gestion des prestataires de gaz</p>
                </div>
                <button
                    onClick={() => { fetchOverview(); fetchProviders(); }}
                    disabled={loadingOverview || loading}
                    className="flex-shrink-0 p-2 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-muted transition-colors"
                >
                    <Icon icon="solar:refresh-bold-duotone" width={16} className={(loadingOverview || loading) ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                <KpiCard icon="solar:shop-bold-duotone" label="Prestataires" value={fmt(overview?.totalProviders)} sub={`${fmt(overview?.activeProviders)} actifs`} color="#3B82F6" />
                <KpiCard icon="mdi:propane-tank" label="Bouteilles au catalogue" value={fmt(overview?.totalBottles)} color="#8B5CF6" />
                <KpiCard icon="solar:clock-circle-bold-duotone" label="Livraisons en attente" value={fmt(overview?.pendingDeliveries)} color="#F59E0B" />
                <KpiCard icon="solar:wallet-money-bold-duotone" label="Chiffre d'affaires" value={fmtCfa(overview?.totalRevenue)} sub={`${fmt(overview?.deliveredDeliveriesCount)} livrées / ${fmt(overview?.totalDeliveries)} au total`} color="#10B981" />
            </div>

            {/* ── Table de gestion des prestataires ── */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un prestataire (nom, email)..."
                            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {totalItems} prestataire{totalItems > 1 ? 's' : ''}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Icon icon="solar:refresh-bold-duotone" width={28} className="text-primary animate-spin" />
                            <p className="text-sm text-zinc-500">Chargement...</p>
                        </div>
                    ) : providers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Icon icon="mdi:propane-tank" width={40} className="text-zinc-300" />
                            <p className="text-zinc-500">Aucun résultat</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                                    <th className="px-6 py-4">Prestataire</th>
                                    <th className="px-6 py-4">Contact</th>
                                    <th className="px-6 py-4">Catalogue</th>
                                    <th className="px-6 py-4">Livraisons</th>
                                    <th className="px-6 py-4">Statut</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {providers.map((provider) => (
                                    <tr key={provider.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/10 shrink-0">
                                                    <Icon icon="mdi:propane-tank" className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[180px]">{provider.companyName}</p>
                                                    <p className="text-[10px] text-zinc-500 truncate max-w-[180px] uppercase font-black">{provider.user?.fullName || '—'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate max-w-[160px]">{provider.user?.email || '—'}</span>
                                                <span className="text-[10px] text-zinc-500">{provider.phone || provider.whatsapp || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{provider._count?.bottles ?? 0} bouteille{(provider._count?.bottles ?? 0) > 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{provider._count?.deliveries ?? 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {provider.isAvailable ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-500 text-[10px] font-bold">
                                                    <Icon icon="solar:check-circle-bold" width={12} />
                                                    Actif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-500 text-[10px] font-bold">
                                                    <Icon icon="solar:close-circle-bold" width={12} />
                                                    Inactif
                                                </span>
                                            )}
                                            {provider.user?.isSuspended && (
                                                <span className="ml-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-500 text-[10px] font-bold">
                                                    Compte suspendu
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleAvailability(provider)}
                                                disabled={togglingId === provider.id}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-colors disabled:opacity-50 ${provider.isAvailable ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10' : 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-500/10'}`}
                                            >
                                                {togglingId === provider.id ? <Icon icon="solar:refresh-bold-duotone" width={14} className="animate-spin" /> : provider.isAvailable ? 'Désactiver' : 'Réactiver'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                        <TablePagination
                            page={page}
                            limit={LIMIT}
                            total={totalItems}
                            totalPages={totalPages}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
