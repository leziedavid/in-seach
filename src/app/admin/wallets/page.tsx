'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, Ban, CheckCircle2 } from 'lucide-react';
import {
    adminListWallets,
    adminGetWalletHistory,
    adminRechargeWallet,
    adminAdjustWallet,
    adminSuspendWallet,
    adminReactivateWallet,
} from '@/api/wallet-api';
import { Wallet, WalletTransaction } from '@/types/interface';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { useDebounce } from '@/hooks/useDebounce';
import { Modal } from '@/components/ui/MotionModal';
import { GenericTable, TableAction } from '@/components/ui/table/table';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon icon={icon} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-black text-foreground">{value}</p>
            </div>
        </div>
    );
}

const TX_TYPE_LABEL: Record<string, string> = {
    WALLET_CREATED: 'Création wallet',
    WELCOME_BONUS: 'Bonus de bienvenue',
    RECHARGE: 'Recharge',
    ORDER_PAYMENT: 'Paiement commande',
    SERVICE_PAYMENT: 'Paiement service',
    BOOST_PAYMENT: 'Boost',
    SUBSCRIPTION_PAYMENT: 'Abonnement',
    REFUND: 'Remboursement',
    ADMIN_ADJUSTMENT: 'Ajustement admin',
    SERVICE_FEE: 'Frais de service',
    PLATFORM_FEE_INCOME: 'Revenu plateforme',
    OTHER: 'Autre',
};

// ── Wallet detail modal ──────────────────────────────────────────────────────
function WalletDetailModal({ wallet, onClose, onChanged }: { wallet: Wallet; onClose: () => void; onChanged: () => void }) {
    const { addNotification } = useNotification();
    const [history, setHistory] = useState<WalletTransaction[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [direction, setDirection] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [mode, setMode] = useState<'recharge' | 'adjust'>('recharge');
    const [submitting, setSubmitting] = useState(false);
    const [busyAction, setBusyAction] = useState(false);

    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await adminGetWalletHistory(wallet.userId, { page: 1, limit: 20 });
            if (res.statusCode === 200 && res.data) setHistory(res.data.data ?? []);
        } finally {
            setLoadingHistory(false);
        }
    }, [wallet.userId]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    const submit = async () => {
        const amt = Number(amount);
        if (!amt || amt <= 0) { addNotification('Montant invalide', 'error'); return; }
        if (mode === 'adjust' && !note.trim()) { addNotification('Une note est requise pour un ajustement', 'error'); return; }

        setSubmitting(true);
        try {
            const res = mode === 'recharge'
                ? await adminRechargeWallet(wallet.userId, { amount: amt, note: note || undefined })
                : await adminAdjustWallet(wallet.userId, { amount: amt, direction, note });
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification('Wallet mis à jour', 'success');
                setAmount('');
                setNote('');
                fetchHistory();
                onChanged();
            } else {
                addNotification(res.message || 'Erreur lors de la mise à jour', 'error');
            }
        } catch {
            addNotification('Erreur lors de la mise à jour', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSuspend = async () => {
        setBusyAction(true);
        try {
            const res = wallet.isSuspended ? await adminReactivateWallet(wallet.userId) : await adminSuspendWallet(wallet.userId);
            if (res.statusCode === 200) {
                addNotification(wallet.isSuspended ? 'Wallet réactivé' : 'Wallet suspendu', 'success');
                onChanged();
                onClose();
            }
        } finally {
            setBusyAction(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose}>
            <div className="p-4 space-y-5 max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between px-4">
                    <div>
                        <h2 className="text-base font-black text-foreground">{wallet.user?.fullName || 'Utilisateur'}</h2>
                        <p className="text-xs text-muted-foreground">{wallet.user?.phone} • {wallet.user?.email}</p>
                    </div>
                    <button onClick={toggleSuspend} disabled={busyAction}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 ${wallet.isSuspended ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200'}`}>
                        {wallet.isSuspended ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                        {wallet.isSuspended ? 'Réactiver' : 'Suspendre'}
                    </button>
                </div>

                <div className="px-4">
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Solde actuel</p>
                            <p className="text-2xl font-black text-primary">{wallet.balance.toLocaleString()} FCFA</p>
                        </div>
                        {wallet.isSuspended && (
                            <span className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2.5 py-1 rounded-full">
                                <Icon icon="solar:danger-triangle-bold-duotone" className="w-3.5 h-3.5" />
                                Suspendu
                            </span>
                        )}
                    </div>
                </div>

                {/* Recharge / Ajustement */}
                <div className="px-4 space-y-3">
                    <div className="flex bg-muted/30 p-1 rounded-xl border border-border w-fit">
                        <button onClick={() => setMode('recharge')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'recharge' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}>Recharger</button>
                        <button onClick={() => setMode('adjust')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'adjust' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}>Ajuster</button>
                    </div>

                    <div className="flex items-end gap-2 flex-wrap">
                        {mode === 'adjust' && (
                            <select value={direction} onChange={(e) => setDirection(e.target.value as 'CREDIT' | 'DEBIT')}
                                className="px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none">
                                <option value="CREDIT">Créditer</option>
                                <option value="DEBIT">Débiter</option>
                            </select>
                        )}
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Montant (FCFA)"
                            className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary" />
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'adjust' ? 'Raison (obligatoire)' : 'Note (optionnel)'}
                            className="flex-[2] min-w-[160px] px-3 py-2 rounded-lg border border-border bg-muted text-sm outline-none focus:border-primary" />
                        <button onClick={submit} disabled={submitting}
                            className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-secondary transition-all disabled:opacity-50 flex items-center gap-2">
                            {submitting ? <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 animate-spin" /> : <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                            Valider
                        </button>
                    </div>
                </div>

                {/* Historique */}
                <div className="px-4">
                    <p className="text-xs font-bold text-foreground mb-2">Historique récent</p>
                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-8">
                            <Icon icon="solar:refresh-bold-duotone" className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    ) : history.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-8">Aucune transaction</p>
                    ) : (
                        <div className="divide-y divide-border/40 border border-border/50 rounded-xl overflow-hidden">
                            {history.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 text-xs">
                                    <div>
                                        <p className="font-bold text-foreground">{TX_TYPE_LABEL[tx.type] ?? tx.type}</p>
                                        <p className="text-muted-foreground">{new Date(tx.createdAt).toLocaleString('fr-FR')}{tx.note ? ` — ${tx.note}` : ''}</p>
                                    </div>
                                    <span className={`font-black ${tx.direction === 'CREDIT' ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {tx.direction === 'CREDIT' ? '+' : '-'}{tx.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminWalletsPage() {
    const { addNotification } = useNotification();
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 400);

    const fetchWallets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminListWallets({ page, limit: 15, search: debouncedSearch || undefined });
            if (res.statusCode === 200 && res.data) {
                setWallets(res.data.data ?? []);
                setTotalPages(res.data.totalPages ?? 1);
                setTotalItems(res.data.total ?? 0);
            }
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch]);

    useEffect(() => { fetchWallets(); }, [fetchWallets]);

    // Toute nouvelle recherche repart de la page 1 — sinon on peut se retrouver sur une page
    // qui n'existe plus pour les résultats filtrés.
    useEffect(() => { setPage(1); }, [debouncedSearch]);

    const platformWallet = wallets.find(w => w.isPlatformWallet);
    const suspendedCount = wallets.filter(w => w.isSuspended).length;

    const handleToggleSuspend = async (wallet: Wallet, shouldBeActive: boolean) => {
        try {
            const res = shouldBeActive ? await adminReactivateWallet(wallet.userId) : await adminSuspendWallet(wallet.userId);
            if (res.statusCode === 200) {
                addNotification(shouldBeActive ? 'Wallet réactivé' : 'Wallet suspendu', 'success');
                fetchWallets();
            }
        } catch {
            addNotification('Erreur lors de la mise à jour', 'error');
        }
    };

    const columns: ColumnDef<Wallet>[] = [
        {
            id: 'user',
            header: 'Utilisateur',
            cell: ({ row }) => (
                <div>
                    <p className="font-bold text-foreground">{row.original.user?.fullName || '—'}</p>
                    <p className="text-[10px] text-muted-foreground">{row.original.user?.phone}</p>
                </div>
            ),
        },
        {
            accessorKey: 'balance',
            header: 'Solde',
            cell: ({ row }) => (
                <span className="font-black text-foreground">
                    {row.original.balance.toLocaleString()} FCFA
                    {row.original.isPlatformWallet && (
                        <span className="ml-2 text-[9px] font-bold uppercase bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-1.5 py-0.5 rounded">Plateforme</span>
                    )}
                </span>
            ),
        },
        {
            id: 'status',
            header: 'Statut',
            cell: ({ row }) => row.original.isSuspended ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">Suspendu</span>
            ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Actif</span>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: 'Créé le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString('fr-FR')}</span>,
        },
    ];

    const actions: TableAction<Wallet>[] = [
        { icon: Eye, label: 'Voir / Gérer', value: 'view' },
        { icon: Ban, label: 'Suspendre', value: 'suspend', variant: 'destructive', disabled: (w) => w.isSuspended },
        { icon: CheckCircle2, label: 'Réactiver', value: 'reactivate', disabled: (w) => !w.isSuspended },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-black text-foreground">Wallets</h1>
                <p className="text-sm text-muted-foreground">Portefeuilles utilisateurs, revenus de la plateforme et opérations manuelles.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon="solar:wallet-money-bold-duotone" label="Wallets (page courante)" value={totalItems} color="bg-primary/10 text-primary" />
                <StatCard icon="solar:hand-money-bold-duotone" label="Revenus plateforme (FCFA)" value={platformWallet ? platformWallet.balance.toLocaleString() : '—'} color="bg-violet-100 text-violet-600 dark:bg-violet-900/30" />
                <StatCard icon="solar:danger-triangle-bold-duotone" label="Suspendus (page)" value={suspendedCount} color="bg-red-100 text-red-600 dark:bg-red-900/30" />
            </div>

            <div className="relative">
                <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou numéro de téléphone…"
                    className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary transition-all"
                />
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <GenericTable
                    columns={columns}
                    data={wallets}
                    loading={loading}
                    actions={actions}
                    onAction={(action, wallet) => {
                        if (action === 'view') setSelectedWallet(wallet);
                        if (action === 'suspend') handleToggleSuspend(wallet, false);
                        if (action === 'reactivate') handleToggleSuspend(wallet, true);
                    }}
                    emptyMessage={debouncedSearch ? `Aucun wallet ne correspond à "${debouncedSearch}"` : 'Aucun wallet trouvé'}
                    haveTitle={false}
                    totalItems={totalItems}
                    currentPage={page}
                    itemsPerPage={15}
                    onPageChange={setPage}
                />
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border/40">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                            ← Préc.
                        </button>
                        <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors">
                            Suiv. →
                        </button>
                    </div>
                )}
            </div>

            {selectedWallet && (
                <WalletDetailModal wallet={selectedWallet} onClose={() => setSelectedWallet(null)} onChanged={fetchWallets} />
            )}
        </div>
    );
}
