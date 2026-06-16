'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { adminGetBoosts, adminGetBoostStats, adminValidateBoost, adminRejectBoost, adminCancelBoost } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Boost, BoostStatus } from '@/types/interface';
import Image from 'next/image';

type TabType = 'boosts' | 'transactions';

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    PENDING:                    { label: 'En attente',          color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',     icon: 'solar:clock-circle-bold-duotone' },
    WAITING_PAYMENT_VALIDATION: { label: 'Validation paiement', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',  icon: 'solar:hourglass-bold-duotone' },
    ACTIVE:                     { label: 'Actif',               color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: 'solar:check-circle-bold-duotone' },
    EXPIRED:                    { label: 'Expiré',              color: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',         icon: 'solar:calendar-mark-bold-duotone' },
    REJECTED:                   { label: 'Rejeté',              color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400',          icon: 'solar:close-circle-bold-duotone' },
    CANCELLED:                  { label: 'Annulé',              color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400', icon: 'solar:forbidden-bold-duotone' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    PENDING:            { label: 'En attente',  color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
    WAITING_VALIDATION: { label: 'À valider',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
    PAID:               { label: 'Payé',        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    REJECTED:           { label: 'Rejeté',      color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
    REFUNDED:           { label: 'Remboursé',   color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' },
};

const ENTITY_LABELS: Record<string, string> = {
    PRODUCT: 'Produit',
    SERVICE: 'Service',
    ANNONCE: 'Annonce',
    LOGISTIC_SERVICE: 'Service Logistique',
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted text-muted-foreground', icon: 'solar:question-circle-bold-duotone' };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.color}`}>
            <Icon icon={cfg.icon} className="w-3.5 h-3.5" />
            {cfg.label}
        </span>
    );
}

function PaymentBadge({ status }: { status: string }) {
    const cfg = PAYMENT_STATUS_CONFIG[status] ?? { label: status, color: 'bg-muted text-muted-foreground' };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>{cfg.label}</span>;
}

// ── Stat card ──────────────────────────────────────────────────────────────
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

// ── Proof viewer modal ─────────────────────────────────────────────────────
function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="relative max-w-2xl w-full mx-4" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center z-10">
                    <Icon icon="solar:close-bold" className="w-4 h-4" />
                </button>
                <div className="rounded-2xl overflow-hidden bg-card border border-border">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}${url}`} alt="Preuve de paiement" className="w-full max-h-[80vh] object-contain" />
                </div>
            </div>
        </div>
    );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AdminBoostsPage() {
    const { addNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<TabType>('boosts');
    const [boosts, setBoosts] = useState<Boost[]>([]);
    const [stats, setStats] = useState<{ total: number; active: number; pending: number; totalRevenue: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [proofUrl, setProofUrl] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [boostRes, statsRes] = await Promise.all([
                adminGetBoosts({ page, limit: 15, ...(filterStatus ? { status: filterStatus } : {}) }),
                adminGetBoostStats(),
            ]);
            if (boostRes.statusCode === 200 && boostRes.data) {
                setBoosts(boostRes.data.data ?? []);
                setTotalPages(boostRes.data.totalPages ?? 1);
            }
            if (statsRes.statusCode === 200 && statsRes.data) setStats(statsRes.data);
        } finally {
            setLoading(false);
        }
    }, [page, filterStatus]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleValidate = async (id: string) => {
        setActionLoading(id + '_validate');
        try {
            const res = await adminValidateBoost(id);
            if (res.statusCode === 200) {
                addNotification('Boost activé — l\'utilisateur a été notifié', 'success');
                loadData();
            } else {
                addNotification('Erreur lors de la validation', 'error');
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        setActionLoading(id + '_reject');
        try {
            const res = await adminRejectBoost(id);
            if (res.statusCode === 200) {
                addNotification('Boost rejeté — l\'utilisateur a été notifié', 'info');
                loadData();
            } else {
                addNotification('Erreur lors du rejet', 'error');
            }
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancel = async (id: string) => {
        setActionLoading(id + '_cancel');
        try {
            const res = await adminCancelBoost(id);
            if (res.statusCode === 200) {
                addNotification('Boost annulé', 'info');
                loadData();
            } else {
                addNotification('Erreur lors de l\'annulation', 'error');
            }
        } finally {
            setActionLoading(null);
        }
    };

    // Toutes les transactions extraites des boosts
    const transactions = boosts.flatMap(b =>
        (b.transactions ?? []).map(tx => ({ ...tx, boost: b }))
    );

    const pendingCount = boosts.filter(b => b.status === 'WAITING_PAYMENT_VALIDATION').length;

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon="solar:rocket-bold-duotone"         label="Total boosts"   value={stats?.total ?? '—'}                                         color="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30" />
                <StatCard icon="solar:check-circle-bold-duotone"   label="Actifs"         value={stats?.active ?? '—'}                                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
                <StatCard icon="solar:hourglass-bold-duotone"      label="En attente"     value={stats?.pending ?? '—'}                                       color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
                <StatCard icon="solar:money-bag-bold-duotone"      label="Revenus (FCFA)" value={(stats?.totalRevenue ?? 0).toLocaleString()}                  color="bg-violet-100 text-violet-600 dark:bg-violet-900/30" />
            </div>

            {/* Tabs */}
            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <div className="flex border-b border-border/50">
                    {([
                        { key: 'boosts',       label: 'Boosts',       icon: 'solar:rocket-bold-duotone',            badge: pendingCount },
                        { key: 'transactions', label: 'Transactions',  icon: 'solar:card-transfer-bold-duotone',    badge: 0 },
                    ] as { key: TabType; label: string; icon: string; badge: number }[]).map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab.key ? 'border-fuchsia-500 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                            <Icon icon={tab.icon} className="w-4 h-4" />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">{tab.badge}</span>
                            )}
                        </button>
                    ))}

                    {/* Filtre statut */}
                    <div className="ml-auto flex items-center px-4">
                        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background text-foreground">
                            <option value="">Tous les statuts</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── TAB: BOOSTS ─────────────────────────────────────────────── */}
                {activeTab === 'boosts' && (
                    <div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Icon icon="solar:refresh-bold-duotone" className="w-8 h-8 text-fuchsia-500 animate-spin" />
                            </div>
                        ) : boosts.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                                <Icon icon="solar:rocket-bold-duotone" className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Aucun boost trouvé</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {boosts.map(boost => {
                                    const proof = boost.transactions?.[0]?.proofUrl ?? boost.proofUrl ?? boost.files?.[0]?.fileUrl;
                                    const tx = boost.transactions?.[0];
                                    const isValidating = actionLoading === boost.id + '_validate';
                                    const isRejecting  = actionLoading === boost.id + '_reject';
                                    const isCancelling = actionLoading === boost.id + '_cancel';

                                    return (
                                        <div key={boost.id} className="p-5 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-start gap-4 flex-wrap">
                                                {/* Infos principale */}
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 px-2 py-0.5 rounded-lg">
                                                            {ENTITY_LABELS[boost.entityType] ?? boost.entityType}
                                                        </span>
                                                        <StatusBadge status={boost.status} />
                                                        {tx && <PaymentBadge status={tx.paymentStatus} />}
                                                    </div>

                                                    <p className="text-xs text-muted-foreground font-mono truncate">ID: {boost.entityId}</p>

                                                    {boost.user && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Icon icon="solar:user-bold-duotone" className="w-3.5 h-3.5" />
                                                            <span className="font-semibold text-foreground">{boost.user.fullName}</span>
                                                            <span>•</span>
                                                            <span>{boost.user.phone}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Icon icon="solar:calendar-bold-duotone" className="w-3.5 h-3.5" />
                                                            {boost.durationDays}j
                                                        </span>
                                                        <span className="flex items-center gap-1 font-bold text-foreground">
                                                            <Icon icon="solar:money-bag-bold-duotone" className="w-3.5 h-3.5 text-fuchsia-500" />
                                                            {boost.amount.toLocaleString()} FCFA
                                                        </span>
                                                        {boost.startDate && (
                                                            <span>{new Date(boost.startDate).toLocaleDateString('fr-FR')} → {boost.endDate ? new Date(boost.endDate).toLocaleDateString('fr-FR') : '?'}</span>
                                                        )}
                                                        <span className="text-muted-foreground/60">
                                                            Créé le {new Date(boost.createdAt).toLocaleDateString('fr-FR')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 flex-wrap shrink-0">
                                                    {proof && (
                                                        <button onClick={() => setProofUrl(proof)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 transition-colors">
                                                            <Icon icon="solar:eye-bold-duotone" className="w-3.5 h-3.5" />
                                                            Preuve
                                                        </button>
                                                    )}

                                                    {(boost.status === 'WAITING_PAYMENT_VALIDATION' || boost.status === 'PENDING') && (
                                                        <button onClick={() => handleValidate(boost.id)} disabled={!!actionLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                                                            {isValidating ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:check-circle-bold-duotone" className="w-3.5 h-3.5" />}
                                                            Valider
                                                        </button>
                                                    )}

                                                    {boost.status !== 'REJECTED' && boost.status !== 'CANCELLED' && boost.status !== 'EXPIRED' && (
                                                        <button onClick={() => handleReject(boost.id)} disabled={!!actionLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-50">
                                                            {isRejecting ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:close-circle-bold-duotone" className="w-3.5 h-3.5" />}
                                                            Rejeter
                                                        </button>
                                                    )}

                                                    {boost.status === 'ACTIVE' && (
                                                        <button onClick={() => handleCancel(boost.id)} disabled={!!actionLoading}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-200 transition-colors disabled:opacity-50">
                                                            {isCancelling ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:forbidden-bold-duotone" className="w-3.5 h-3.5" />}
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
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
                )}

                {/* ── TAB: TRANSACTIONS ───────────────────────────────────────── */}
                {activeTab === 'transactions' && (
                    <div>
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Icon icon="solar:refresh-bold-duotone" className="w-8 h-8 text-fuchsia-500 animate-spin" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="flex flex-col items-center py-16 text-muted-foreground gap-2">
                                <Icon icon="solar:card-transfer-bold-duotone" className="w-10 h-10 opacity-30" />
                                <p className="text-sm">Aucune transaction</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/40">
                                {transactions.map(tx => {
                                    const proofFile = tx.proofUrl ?? tx.boost.files?.[0]?.fileUrl;
                                    const isValidating = actionLoading === tx.boost.id + '_validate';
                                    const isRejecting  = actionLoading === tx.boost.id + '_reject';

                                    return (
                                        <div key={tx.id} className="p-5 hover:bg-muted/20 transition-colors">
                                            <div className="flex items-start gap-4 flex-wrap">
                                                <div className="flex-1 min-w-0 space-y-1.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-lg">
                                                            {tx.paymentMethod?.replace('_', ' ') ?? 'Paiement'}
                                                        </span>
                                                        <PaymentBadge status={tx.paymentStatus} />
                                                        <StatusBadge status={tx.boost.status} />
                                                    </div>

                                                    {tx.boost.user && (
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                            <Icon icon="solar:user-bold-duotone" className="w-3.5 h-3.5" />
                                                            <span className="font-semibold text-foreground">{tx.boost.user.fullName}</span>
                                                            <span>•</span>
                                                            <span>{tx.boost.user.phone}</span>
                                                            <span>•</span>
                                                            <span>{tx.boost.user.email}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                        <span className="font-black text-foreground text-sm">{tx.amount.toLocaleString()} FCFA</span>
                                                        {tx.reference && <span className="font-mono">Réf: {tx.reference}</span>}
                                                        <span>{new Date(tx.createdAt).toLocaleDateString('fr-FR')} à {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                    {proofFile && (
                                                        <button onClick={() => setProofUrl(proofFile)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-200 transition-colors">
                                                            <Icon icon="solar:eye-bold-duotone" className="w-3.5 h-3.5" />
                                                            Voir preuve
                                                        </button>
                                                    )}

                                                    {tx.boost.status === 'WAITING_PAYMENT_VALIDATION' && (
                                                        <>
                                                            <button onClick={() => handleValidate(tx.boost.id)} disabled={!!actionLoading}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 transition-colors disabled:opacity-50">
                                                                {isValidating ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:check-circle-bold-duotone" className="w-3.5 h-3.5" />}
                                                                Valider paiement
                                                            </button>
                                                            <button onClick={() => handleReject(tx.boost.id)} disabled={!!actionLoading}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 transition-colors disabled:opacity-50">
                                                                {isRejecting ? <Icon icon="solar:refresh-bold-duotone" className="w-3.5 h-3.5 animate-spin" /> : <Icon icon="solar:close-circle-bold-duotone" className="w-3.5 h-3.5" />}
                                                                Rejeter
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Proof viewer */}
            {proofUrl && <ProofModal url={proofUrl} onClose={() => setProofUrl(null)} />}
        </div>
    );
}
