'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { getAuthorizations, createAuthorization, updateAuthorization, deleteAuthorization } from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Edit2, Trash2 } from 'lucide-react';

interface AuthorizationRow {
    id: string;
    code: string;
    name: string;
    icon: string | null;
    description: string | null;
    category: string | null;
    frontendRoute: string | null;
    backendRoute: string | null;
    order: number;
    isActive: boolean;
    parent?: { id: string; name: string } | null;
    _count?: { policies: number; children: number };
}

function AuthorizationForm({ initial, onSubmit, onClose, isSubmitting }: {
    initial?: Partial<AuthorizationRow>;
    onSubmit: (data: any) => void;
    onClose: () => void;
    isSubmitting: boolean;
}) {
    const [code, setCode] = useState(initial?.code ?? '');
    const [name, setName] = useState(initial?.name ?? '');
    const [icon, setIcon] = useState(initial?.icon ?? '');
    const [category, setCategory] = useState(initial?.category ?? '');
    const [frontendRoute, setFrontendRoute] = useState(initial?.frontendRoute ?? '');
    const [backendRoute, setBackendRoute] = useState(initial?.backendRoute ?? '');
    const [order, setOrder] = useState(initial?.order ?? 0);
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                onSubmit({ code, name, icon, category, frontendRoute, backendRoute, order, isActive });
            }}
            className="space-y-4 p-6 max-h-[85vh] overflow-y-auto"
        >
            <h3 className="text-lg font-black text-foreground">{initial?.id ? "Modifier l'autorisation" : 'Nouvelle autorisation'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Code</label>
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required placeholder="PRODUCTS"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Produits"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Icône (Iconify)</label>
                    <div className="flex items-center gap-2">
                        {icon && <Icon icon={icon} width={20} className="text-primary shrink-0" />}
                        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="solar:box-bold-duotone"
                            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Catégorie (regroupement menu)</label>
                    <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Utilisateurs & Contenu"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Route frontend</label>
                    <input value={frontendRoute} onChange={(e) => setFrontendRoute(e.target.value)} placeholder="/admin/products"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-mono text-xs" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Route backend</label>
                    <input value={backendRoute} onChange={(e) => setBackendRoute(e.target.value)} placeholder="/product-admin"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-mono text-xs" />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Ordre</label>
                    <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))}
                        className="w-28 h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase">Actif</span>
                </label>
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

export default function AdminAuthorizationsPage() {
    const [items, setItems] = useState<AuthorizationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editing, setEditing] = useState<AuthorizationRow | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAuthorizations({ page, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setItems(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch {
            addNotification('Erreur lors du chargement des autorisations', 'error');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const res = editing ? await updateAuthorization(editing.id, data) : await createAuthorization(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editing ? 'Autorisation mise à jour' : 'Autorisation créée', 'success');
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

    const handleDelete = async (item: AuthorizationRow) => {
        if (!confirm(`Supprimer l'autorisation "${item.name}" ? Les policies associées seront aussi supprimées.`)) return;
        try {
            const res = await deleteAuthorization(item.id);
            if (res.statusCode === 200) {
                addNotification('Autorisation supprimée', 'success');
                fetchItems();
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification('Erreur lors de la suppression', 'error');
        }
    };

    const columns: ColumnDef<AuthorizationRow>[] = [
        {
            accessorKey: 'name',
            header: 'Autorisation',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    {row.original.icon && (
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon icon={row.original.icon} width={16} className="text-primary" />
                        </div>
                    )}
                    <div>
                        <span className="font-black text-sm">{row.original.name}</span>
                        <div className="text-[10px] text-muted-foreground font-mono">{row.original.code}</div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'category',
            header: 'Catégorie',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.category || '—'}</span>,
        },
        {
            accessorKey: 'frontendRoute',
            header: 'Route',
            cell: ({ row }) => <span className="text-[10px] font-mono text-muted-foreground">{row.original.frontendRoute || '—'}</span>,
        },
        {
            accessorKey: '_count',
            header: 'Policies',
            cell: ({ row }) => <Badge variant="outline" className="text-[9px]">{row.original._count?.policies ?? 0}</Badge>,
        },
        {
            accessorKey: 'isActive',
            header: 'Statut',
            cell: ({ row }) => row.original.isActive
                ? <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[9px] font-black uppercase">Actif</Badge>
                : <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50 text-[9px] font-black uppercase">Inactif</Badge>,
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Autorisations</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Modules / fonctionnalités pilotant les menus dynamiques</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setIsFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap"
                >
                    <Icon icon="solar:add-circle-bold-duotone" width={18} />
                    Nouvelle autorisation
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
                    emptyMessage="Aucune autorisation trouvée."
                />
            </div>

            <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); }}>
                <AuthorizationForm
                    initial={editing ?? undefined}
                    onSubmit={handleSubmit}
                    onClose={() => { setIsFormOpen(false); setEditing(null); }}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
}
