'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { getPolicies, createPolicy, updatePolicy, deletePolicy, getAuthorizations } from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Edit2, Trash2 } from 'lucide-react';

interface PolicyRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    authorizationId: string;
    authorization?: { id: string; name: string; code: string };
    _count?: { roles: number };
}

interface AuthorizationOption {
    id: string;
    name: string;
    code: string;
}

function PolicyForm({ initial, authorizations, onSubmit, onClose, isSubmitting }: {
    initial?: Partial<PolicyRow>;
    authorizations: AuthorizationOption[];
    onSubmit: (data: any) => void;
    onClose: () => void;
    isSubmitting: boolean;
}) {
    const [code, setCode] = useState(initial?.code ?? '');
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [authorizationId, setAuthorizationId] = useState(initial?.authorizationId ?? authorizations[0]?.id ?? '');

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit({ code, name, description, authorizationId }); }}
            className="space-y-4 p-6"
        >
            <h3 className="text-lg font-black text-foreground">{initial?.id ? 'Modifier la policy' : 'Nouvelle policy'}</h3>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required placeholder="PRODUCT_CREATE"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Créer un produit"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Autorisation (module)</label>
                <select
                    value={authorizationId}
                    onChange={(e) => setAuthorizationId(e.target.value)}
                    required
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                >
                    {authorizations.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                    ))}
                </select>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Description</label>
                <textarea value={description ?? ''} onChange={(e) => setDescription(e.target.value)} rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-11 rounded-xl bg-primary text-white text-xs font-black hover:bg-secondary transition-all uppercase">
                    {isSubmitting ? '...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}

export default function AdminPoliciesPage() {
    const [items, setItems] = useState<PolicyRow[]>([]);
    const [authorizations, setAuthorizations] = useState<AuthorizationOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editing, setEditing] = useState<PolicyRow | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPolicies({ page, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch {
            addNotification('Erreur lors du chargement des policies', 'error');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    useEffect(() => {
        (async () => {
            const res = await getAuthorizations({ limit: 200 });
            setAuthorizations(res?.data?.data ?? []);
        })();
    }, []);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const res = editing ? await updatePolicy(editing.id, data) : await createPolicy(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editing ? 'Policy mise à jour' : 'Policy créée', 'success');
                setIsFormOpen(false);
                setEditing(null);
                fetchItems();
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification("Erreur lors de l'enregistrement", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item: PolicyRow) => {
        if (!confirm(`Supprimer la policy "${item.name}" ?`)) return;
        try {
            const res = await deletePolicy(item.id);
            if (res.statusCode === 200) {
                addNotification('Policy supprimée', 'success');
                fetchItems();
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification('Erreur lors de la suppression', 'error');
        }
    };

    const columns: ColumnDef<PolicyRow>[] = [
        {
            accessorKey: 'name',
            header: 'Policy',
            cell: ({ row }) => (
                <div>
                    <span className="font-black text-sm">{row.original.name}</span>
                    <div className="text-[10px] text-muted-foreground font-mono">{row.original.code}</div>
                </div>
            ),
        },
        {
            accessorKey: 'authorization',
            header: 'Module',
            cell: ({ row }) => <Badge variant="outline" className="text-[9px]">{row.original.authorization?.name ?? '—'}</Badge>,
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.description || '—'}</span>,
        },
        {
            accessorKey: '_count',
            header: 'Rôles',
            cell: ({ row }) => <Badge variant="outline" className="text-[9px]">{row.original._count?.roles ?? 0}</Badge>,
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Policies</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Privilèges accordés sur une autorisation</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setIsFormOpen(true); }}
                    disabled={authorizations.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap disabled:opacity-50"
                >
                    <Icon icon="solar:add-circle-bold-duotone" width={18} />
                    Nouvelle policy
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable
                    columns={columns}
                    data={items}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="name"
                    actions={[
                        { icon: Edit2, label: 'Modifier', value: 'edit' },
                        { icon: Trash2, label: 'Supprimer', value: 'delete', className: 'text-rose-700' },
                    ]}
                    onAction={(action, row) => {
                        if (action === 'edit') { setEditing(row); setIsFormOpen(true); }
                        if (action === 'delete') handleDelete(row);
                    }}
                    emptyMessage="Aucune policy trouvée."
                />
            </div>

            <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); }}>
                <PolicyForm
                    initial={editing ?? undefined}
                    authorizations={authorizations}
                    onSubmit={handleSubmit}
                    onClose={() => { setIsFormOpen(false); setEditing(null); }}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
}
