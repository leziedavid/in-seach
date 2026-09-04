'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { GenericTable } from '@/components/ui/table/table';
import { adminGetUsers } from '@/api/api';
import { CallReportModal, type ClientLite } from './CallReportModal';
import { CallHistoryModal } from './CallHistoryModal';

const LIMIT = 10;

interface UserRow {
    id: string;
    fullName: string | null;
    phone: string;
    indicatif?: string;
    email: string;
    role: string;
    storeName?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
    CLIENT: 'Client',
    PRESTATAIRE: 'Prestataire',
    ENTREPRISE: 'Entreprise',
    CHAUFFEUR: 'Chauffeur',
    GAZIER: 'Gazier',
};

export function UsersSubTab() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [callModalOpen, setCallModalOpen] = useState(false);
    const [presetClient, setPresetClient] = useState<ClientLite | null>(null);

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyClient, setHistoryClient] = useState<{ id: string; name: string | null } | null>(null);

    const fetchUsers = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await adminGetUsers({ page: p, limit: LIMIT, roleNotIn: 'ADMIN,MARKETING', query: search || undefined });
            const data: any = res.data;
            setUsers(data?.data ?? []);
            setTotal(data?.total ?? 0);
        } catch {
            /* ignore */
        }
        setLoading(false);
    }, [search]);

    useEffect(() => {
        setPage(1);
        fetchUsers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handlePageChange = (p: number) => {
        setPage(p);
        fetchUsers(p);
    };

    const openNewCall = (user: UserRow) => {
        setPresetClient({ id: user.id, fullName: user.fullName, phone: user.phone, indicatif: user.indicatif, email: user.email });
        setCallModalOpen(true);
    };

    const openHistory = (user: UserRow) => {
        setHistoryClient({ id: user.id, name: user.fullName });
        setHistoryModalOpen(true);
    };

    const columns: ColumnDef<UserRow>[] = [
        {
            id: 'user',
            header: 'Utilisateur',
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground truncate max-w-[160px]">{row.original.fullName ?? row.original.storeName ?? '—'}</div>
                    <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">{row.original.email}</div>
                </div>
            ),
        },
        {
            id: 'phone',
            header: 'Téléphone',
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground whitespace-nowrap">{row.original.indicatif}{row.original.phone}</span>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Rôle',
            cell: ({ getValue }) => (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium whitespace-nowrap">
                    {ROLE_LABELS[getValue() as string] ?? (getValue() as string)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5">
                    <a
                        href={`tel:${row.original.indicatif ?? ''}${row.original.phone ?? ''}`}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 transition-colors"
                        title="Appeler"
                    >
                        <Icon icon="solar:phone-bold-duotone" width={15} />
                    </a>
                    <button
                        onClick={() => openNewCall(row.original)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        title="Nouvel appel"
                    >
                        <Icon icon="solar:add-circle-bold-duotone" width={15} />
                    </button>
                    <button
                        onClick={() => openHistory(row.original)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-muted text-muted-foreground hover:bg-muted/70 transition-colors"
                        title="Historique / Compte-rendu"
                    >
                        <Icon icon="solar:clipboard-list-bold-duotone" width={15} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-3 sm:p-4">
                <div className="relative">
                    <Icon icon="solar:magnifer-bold-duotone" width={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un utilisateur (nom, téléphone, email)..."
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-2 sm:p-5">
                <GenericTable<UserRow, string>
                    columns={columns}
                    data={users}
                    loading={loading}
                    emptyMessage="Aucun utilisateur trouvé"
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={LIMIT}
                    onPageChange={handlePageChange}
                />
            </div>

            <CallReportModal
                isOpen={callModalOpen}
                onClose={() => setCallModalOpen(false)}
                presetClient={presetClient}
                onSuccess={() => { /* rien à rafraîchir dans cette sous-liste */ }}
            />

            <CallHistoryModal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                clientId={historyClient?.id ?? null}
                clientName={historyClient?.name}
            />
        </div>
    );
}
