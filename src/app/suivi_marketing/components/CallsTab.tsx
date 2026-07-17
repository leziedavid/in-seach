'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { GenericTable } from '@/components/ui/table/table';
import { marketingGetCalls } from '@/api/api';
import { StatusBadge, PriorityBadge, MODULE_LABELS } from './badges';
import { CallReportModal } from './CallReportModal';

const LIMIT = 10;

interface ClientLite {
    id: string;
    fullName: string | null;
    phone: string;
    indicatif?: string;
    email?: string;
}

interface CallRow {
    id: string;
    client: ClientLite;
    agent: { id: string; fullName: string | null };
    module: string;
    objet: string;
    commentaire?: string | null;
    decision?: string | null;
    actionsAFaire?: string | null;
    statut: string;
    priorite: string;
    dateAppel: string;
    dateRappel?: string | null;
}

const STATUS_FILTERS = [
    { value: '', label: 'Tous les statuts' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'TRAITE', label: 'Traité' },
    { value: 'A_RAPPELER', label: 'À rappeler' },
    { value: 'URGENT', label: 'Urgent' },
];

const PRIORITY_FILTERS = [
    { value: '', label: 'Toutes priorités' },
    { value: 'BASSE', label: 'Basse' },
    { value: 'NORMALE', label: 'Normale' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'URGENTE', label: 'Urgente' },
];

const MODULE_FILTERS = [{ value: '', label: 'Tous les modules' }, ...Object.entries(MODULE_LABELS).map(([value, label]) => ({ value, label }))];

export function CallsTab() {
    const [calls, setCalls] = useState<CallRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [statut, setStatut] = useState('');
    const [priorite, setPriorite] = useState('');
    const [module, setModule] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingCall, setEditingCall] = useState<CallRow | null>(null);

    const fetchCalls = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await marketingGetCalls({
                page: p,
                limit: LIMIT,
                search: search || undefined,
                statut: statut || undefined,
                priorite: priorite || undefined,
                module: module || undefined,
            });
            setCalls(res.data?.data ?? []);
            setTotal(res.data?.total ?? 0);
        } catch {
            /* ignore */
        }
        setLoading(false);
    }, [search, statut, priorite, module]);

    useEffect(() => {
        setPage(1);
        fetchCalls(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statut, priorite, module]);

    const handlePageChange = (p: number) => {
        setPage(p);
        fetchCalls(p);
    };

    const openCreate = () => {
        setEditingCall(null);
        setModalOpen(true);
    };

    const openEdit = (call: CallRow) => {
        setEditingCall(call);
        setModalOpen(true);
    };

    const columns: ColumnDef<CallRow>[] = [
        {
            id: 'client',
            header: 'Client',
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate max-w-[140px]">{row.original.client?.fullName ?? '—'}</div>
                </div>
            ),
        },
        {
            id: 'phone',
            header: 'Téléphone',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {row.original.client?.indicatif}{row.original.client?.phone}
                </span>
            ),
        },
        {
            accessorKey: 'module',
            header: 'Module',
            cell: ({ getValue }) => <span className="text-xs">{MODULE_LABELS[getValue() as string] ?? (getValue() as string)}</span>,
        },
        {
            accessorKey: 'objet',
            header: 'Motif',
            cell: ({ getValue }) => <span className="text-xs block truncate max-w-[160px]">{getValue() as string}</span>,
        },
        {
            id: 'agent',
            header: 'Agent',
            cell: ({ row }) => <span className="text-xs text-muted-foreground truncate max-w-[100px] block">{row.original.agent?.fullName ?? '—'}</span>,
        },
        {
            accessorKey: 'priorite',
            header: 'Priorité',
            cell: ({ getValue }) => <PriorityBadge priority={getValue() as string} />,
        },
        {
            accessorKey: 'statut',
            header: 'Statut',
            cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
        },
        {
            accessorKey: 'dateAppel',
            header: 'Date',
            cell: ({ getValue }) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(getValue() as string).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <a
                        href={`tel:${row.original.client?.indicatif ?? ''}${row.original.client?.phone ?? ''}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors"
                        title="Appeler"
                    >
                        <Icon icon="solar:phone-bold-duotone" width={15} />
                    </a>
                    <button
                        onClick={() => openEdit(row.original)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Compte-rendu"
                    >
                        <Icon icon="solar:clipboard-text-bold-duotone" width={15} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-3 sm:p-4 flex flex-col sm:flex-row gap-2 sm:items-center">
                <div className="relative flex-1 min-w-[180px]">
                    <Icon icon="solar:magnifer-bold-duotone" width={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un client, un motif..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
                <select value={statut} onChange={(e) => setStatut(e.target.value)} className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium">
                    {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={priorite} onChange={(e) => setPriorite(e.target.value)} className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium">
                    {PRIORITY_FILTERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
                <select value={module} onChange={(e) => setModule(e.target.value)} className="w-full sm:w-auto h-10 px-3 rounded-xl border border-border bg-background text-xs font-medium">
                    {MODULE_FILTERS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <button
                    onClick={openCreate}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap hover:opacity-90 transition-opacity"
                >
                    <Icon icon="solar:add-circle-bold-duotone" width={16} />
                    Nouvel appel
                </button>
            </div>

            {/* Tableau */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-2 sm:p-5">
                <GenericTable<CallRow, string>
                    columns={columns}
                    data={calls}
                    loading={loading}
                    emptyMessage="Aucun appel enregistré"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={handlePageChange}
                />
            </div>

            <CallReportModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                call={editingCall}
                onSuccess={() => fetchCalls(page)}
            />
        </div>
    );
}
