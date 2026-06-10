'use client';

import React, { useState, useEffect } from 'react';
import { getReports, updateReport, deleteReport, UpdateReportDto } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';
import { Calendar, Trash2, Eye } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'IGNORED' | 'ARCHIVED';
type ReportAction = 'NO_ACTION' | 'WARNING_SENT' | 'CONTENT_DISABLED' | 'CONTENT_DELETED' | 'USER_BANNED' | 'ARCHIVED';

interface Report {
    id: string;
    entityType: string;
    entityId: string;
    reason: string;
    description?: string;
    status: ReportStatus;
    adminNote?: string;
    adminAction?: ReportAction;
    createdAt: string;
    reporter?: { id: string; fullName?: string; email?: string };
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<ReportStatus, string> = {
    PENDING: 'En attente',
    UNDER_REVIEW: 'En cours',
    RESOLVED: 'Traité',
    IGNORED: 'Ignoré',
    ARCHIVED: 'Archivé',
};

const STATUS_BADGE_CLASS: Record<ReportStatus, string> = {
    PENDING: 'bg-amber-500/10 text-amber-600 border-amber-200',
    UNDER_REVIEW: 'bg-blue-500/10 text-blue-600 border-blue-200',
    RESOLVED: 'bg-green-500/10 text-green-600 border-green-200',
    IGNORED: 'bg-gray-500/10 text-gray-500 border-gray-200',
    ARCHIVED: 'bg-purple-500/10 text-purple-600 border-purple-200',
};

const REASON_LABELS: Record<string, string> = {
    SPAM: 'Spam',
    INAPPROPRIATE_CONTENT: 'Contenu inapproprié',
    FAKE_PROFILE: 'Profil fictif',
    FRAUD: 'Arnaque',
    VIOLENCE: 'Violence',
    HARASSMENT: 'Harcèlement',
    COPYRIGHT: 'Droits d\'auteur',
    OTHER: 'Autre',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
    USER: 'Utilisateur',
    SERVICE: 'Service',
    ANNONCE: 'Annonce',
    PRODUCT: 'Produit',
    LOGISTIC_SERVICE: 'Logistique',
    EASY_DELIVERY: 'Livraison',
};

const ACTION_OPTIONS: { value: ReportAction; label: string }[] = [
    { value: 'NO_ACTION', label: 'Aucune action' },
    { value: 'WARNING_SENT', label: 'Avertissement envoyé' },
    { value: 'CONTENT_DISABLED', label: 'Contenu désactivé' },
    { value: 'CONTENT_DELETED', label: 'Contenu supprimé' },
    { value: 'USER_BANNED', label: 'Utilisateur banni' },
    { value: 'ARCHIVED', label: 'Archivé' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const { addNotification } = useNotification();

    // Note modal state
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [actionSelect, setActionSelect] = useState<ReportAction>('NO_ACTION');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const LIMIT = 10;

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await getReports({ status: statusFilter || undefined, page, limit: LIMIT });
            if (res.statusCode === 200 && res.data) {
                const data = res.data;
                // Handle both paginated and plain array responses
                if (Array.isArray(data)) {
                    setReports(data);
                    setTotal(data.length);
                } else {
                    setReports(data.data || []);
                    setTotal(data.total || data.data?.length || 0);
                }
            }
        } catch {
            addNotification('Erreur lors du chargement des signalements.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, statusFilter]);

    const handleResolve = async (report: Report) => {
        try {
            const res = await updateReport(report.id, { status: 'RESOLVED' });
            if (res.statusCode === 200) {
                addNotification('Signalement marqué comme traité.', 'success');
                fetchReports();
            }
        } catch {
            addNotification('Erreur lors de la mise à jour.', 'error');
        }
    };

    const handleIgnore = async (report: Report) => {
        try {
            const res = await updateReport(report.id, { status: 'IGNORED' });
            if (res.statusCode === 200) {
                addNotification('Signalement ignoré.', 'success');
                fetchReports();
            }
        } catch {
            addNotification('Erreur lors de la mise à jour.', 'error');
        }
    };

    const handleDelete = async (report: Report) => {
        if (!confirm('Supprimer définitivement ce signalement ?')) return;
        try {
            const res = await deleteReport(report.id);
            if (res.statusCode === 200) {
                addNotification('Signalement supprimé.', 'success');
                fetchReports();
            }
        } catch {
            addNotification('Erreur lors de la suppression.', 'error');
        }
    };

    const openNoteModal = (report: Report) => {
        setSelectedReport(report);
        setNoteText(report.adminNote || '');
        setActionSelect(report.adminAction || 'NO_ACTION');
        setIsNoteOpen(true);
    };

    const handleSaveNote = async () => {
        if (!selectedReport) return;
        setIsSubmitting(true);
        try {
            const payload: UpdateReportDto = {
                status: 'UNDER_REVIEW',
                adminNote: noteText.trim() || undefined,
                adminAction: actionSelect,
            };
            const res = await updateReport(selectedReport.id, payload);
            if (res.statusCode === 200) {
                addNotification('Note et action enregistrées.', 'success');
                setIsNoteOpen(false);
                fetchReports();
            }
        } catch {
            addNotification('Erreur lors de la sauvegarde.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* ── Header ── */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Signalements</h1>
                    <p className="text-muted-foreground text-sm font-medium">
                        {total} signalement{total !== 1 ? 's' : ''} au total
                    </p>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="appearance-none bg-card border border-border rounded-2xl px-4 py-2.5 pr-9 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                            <option value="">Tous les statuts</option>
                            {(Object.keys(STATUS_LABELS) as ReportStatus[]).map((s) => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                        <Icon icon="solar:alt-arrow-down-bold-duotone" width={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                    <button
                        onClick={() => fetchReports()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border text-xs font-bold hover:border-primary/30 transition-all"
                    >
                        <Icon icon="solar:refresh-bold-duotone" width={14} />
                        Actualiser
                    </button>
                </div>
            </header>

            {/* ── Table ── */}
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Icon icon="solar:refresh-bold-duotone" width={32} className="animate-spin text-primary" />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                        <Icon icon="solar:flag-bold-duotone" width={48} className="opacity-20" />
                        <p className="font-black text-sm">Aucun signalement trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border/50 bg-muted/30">
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Entité ID</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Auteur</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Motif</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</th>
                                    <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-muted/20 transition-colors group">
                                        {/* Type */}
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider">
                                                {ENTITY_TYPE_LABELS[report.entityType] || report.entityType}
                                            </Badge>
                                        </td>

                                        {/* Entity ID */}
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono text-muted-foreground">
                                                {report.entityId.substring(0, 8)}…
                                            </span>
                                        </td>

                                        {/* Reporter */}
                                        <td className="px-6 py-4">
                                            {report.reporter ? (
                                                <div>
                                                    <p className="text-xs font-black">{report.reporter.fullName || 'Anonyme'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">{report.reporter.id.substring(0, 8)}…</p>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">—</span>
                                            )}
                                        </td>

                                        {/* Reason */}
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold">
                                                {REASON_LABELS[report.reason] || report.reason}
                                            </span>
                                        </td>

                                        {/* Description */}
                                        <td className="px-6 py-4 max-w-[200px]">
                                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                                                {report.description || '—'}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={cn(
                                                'text-[9px] font-black uppercase tracking-wider',
                                                STATUS_BADGE_CLASS[report.status] || ''
                                            )}>
                                                {STATUS_LABELS[report.status] || report.status}
                                            </Badge>
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Note / action */}
                                                <button
                                                    onClick={() => openNoteModal(report)}
                                                    title="Note admin + action"
                                                    className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                {/* Resolve */}
                                                {report.status !== 'RESOLVED' && (
                                                    <button
                                                        onClick={() => handleResolve(report)}
                                                        title="Marquer traité"
                                                        className="w-8 h-8 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                                                    >
                                                        <Icon icon="solar:check-circle-bold-duotone" width={14} />
                                                    </button>
                                                )}

                                                {/* Ignore */}
                                                {report.status !== 'IGNORED' && (
                                                    <button
                                                        onClick={() => handleIgnore(report)}
                                                        title="Ignorer"
                                                        className="w-8 h-8 rounded-xl bg-gray-500/10 text-gray-500 flex items-center justify-center hover:bg-gray-500/20 transition-colors"
                                                    >
                                                        <Icon icon="solar:eye-closed-bold-duotone" width={14} />
                                                    </button>
                                                )}

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(report)}
                                                    title="Supprimer"
                                                    className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-40 transition-all"
                    >
                        <Icon icon="solar:alt-arrow-left-bold-duotone" width={16} />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const p = i + 1;
                        return (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={cn(
                                    "w-10 h-10 rounded-2xl text-xs font-black transition-all border",
                                    page === p
                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-card border-border text-muted-foreground hover:border-primary/30"
                                )}
                            >
                                {p}
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 disabled:opacity-40 transition-all"
                    >
                        <Icon icon="solar:alt-arrow-right-bold-duotone" width={16} />
                    </button>
                </div>
            )}

            {/* ── Admin Note Modal ── */}
            <Modal isOpen={isNoteOpen} onClose={() => setIsNoteOpen(false)} title="Note & action admin">
                <div className="p-6 space-y-5">
                    {selectedReport && (
                        <div className="p-4 bg-muted/30 rounded-2xl border border-border space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Signalement</p>
                            <p className="text-sm font-black">
                                {ENTITY_TYPE_LABELS[selectedReport.entityType]} — {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
                            </p>
                            {selectedReport.description && (
                                <p className="text-xs text-muted-foreground">{selectedReport.description}</p>
                            )}
                        </div>
                    )}

                    {/* Action select */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Action</label>
                        <div className="relative">
                            <select
                                value={actionSelect}
                                onChange={(e) => setActionSelect(e.target.value as ReportAction)}
                                className="w-full appearance-none bg-background border border-border rounded-2xl px-4 py-3 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                {ACTION_OPTIONS.map((a) => (
                                    <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                            </select>
                            <Icon icon="solar:alt-arrow-down-bold-duotone" width={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    {/* Note textarea */}
                    <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Note interne</label>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                            placeholder="Ajoutez une note interne..."
                            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSaveNote}
                        disabled={isSubmitting}
                        className="w-full bg-primary text-white rounded-2xl py-4 text-[13px] font-extrabold tracking-wide hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />
                        ) : (
                            <Icon icon="solar:diskette-bold-duotone" width={16} />
                        )}
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </Modal>
        </div>
    );
}
