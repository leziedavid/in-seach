'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    getRoles, createRole, updateRole, deleteRole,
    getRole, assignPoliciesToRole, getPolicies,
} from '@/api/api';
import { GenericTable } from '@/components/ui/table/table';
import { Modal } from '@/components/ui/MotionModal';
import { Badge } from '@/components/ui/badge';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Edit2, Trash2, ShieldCheck } from 'lucide-react';

interface RoleRow {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    order: number;
    _count?: { users: number; policies: number };
}

interface PolicyRow {
    id: string;
    code: string;
    name: string;
    authorization: { id: string; name: string; code: string };
}

function RoleForm({ initial, onSubmit, onClose, isSubmitting }: {
    initial?: Partial<RoleRow>;
    onSubmit: (data: { code: string; name: string; description?: string; order?: number }) => void;
    onClose: () => void;
    isSubmitting: boolean;
}) {
    const [code, setCode] = useState(initial?.code ?? '');
    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [order, setOrder] = useState(initial?.order ?? 0);

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit({ code, name, description, order }); }}
            className="space-y-5 p-6"
        >
            <h3 className="text-lg font-black text-foreground">{initial?.id ? 'Modifier le rôle' : 'Nouveau rôle'}</h3>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Code</label>
                <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                    disabled={!!initial?.isSystem}
                    required
                    placeholder="COMPTABLE"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm disabled:opacity-50"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Nom</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Comptable"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Description</label>
                <textarea
                    value={description ?? ''}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all text-sm"
                />
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Ordre</label>
                <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm"
                />
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

function PoliciesAssignment({ role, onClose, onSaved }: { role: RoleRow; onClose: () => void; onSaved: () => void }) {
    const [allPolicies, setAllPolicies] = useState<PolicyRow[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [policiesRes, roleRes] = await Promise.all([
                    getPolicies({ limit: 200 }),
                    getRole(role.id),
                ]);
                setAllPolicies(policiesRes?.data?.data ?? []);
                const current = (roleRes?.data?.policies ?? []).map((rp: any) => rp.policy.id);
                setSelected(new Set(current));
            } finally {
                setLoading(false);
            }
        })();
    }, [role.id]);

    const grouped = React.useMemo(() => {
        const map = new Map<string, PolicyRow[]>();
        for (const p of allPolicies) {
            const key = p.authorization?.name ?? 'Autres';
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }
        return Array.from(map.entries());
    }, [allPolicies]);

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await assignPoliciesToRole(role.id, Array.from(selected));
            addNotification('Policies affectées au rôle', 'success');
            onSaved();
            onClose();
        } catch {
            addNotification("Erreur lors de l'affectation", 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-4 max-h-[80vh] flex flex-col">
            <div>
                <h3 className="text-lg font-black text-foreground">Policies du rôle {role.name}</h3>
                <p className="text-xs text-muted-foreground">Sélectionnez les policies accordées à ce rôle.</p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {loading ? (
                    <p className="text-sm text-muted-foreground">Chargement…</p>
                ) : grouped.map(([authName, policies]) => (
                    <div key={authName} className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-muted/50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">{authName}</div>
                        <div className="divide-y divide-border/60">
                            {policies.map((p) => (
                                <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/30">
                                    <input
                                        type="checkbox"
                                        checked={selected.has(p.id)}
                                        onChange={() => toggle(p.id)}
                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                    />
                                    <span className="text-sm font-semibold text-foreground">{p.name}</span>
                                    <span className="text-[10px] text-muted-foreground font-mono ml-auto">{p.code}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-3 pt-2 border-t border-border">
                <button onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase">
                    Annuler
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-[2] h-11 rounded-xl bg-primary text-white text-xs font-black hover:bg-secondary transition-all uppercase">
                    {saving ? '...' : 'Enregistrer'}
                </button>
            </div>
        </div>
    );
}

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<RoleRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const { addNotification } = useNotification();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editing, setEditing] = useState<RoleRow | null>(null);
    const [policiesRole, setPoliciesRole] = useState<RoleRow | null>(null);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getRoles({ page, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setRoles(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch {
            addNotification('Erreur lors du chargement des rôles', 'error');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const handleSubmit = async (data: { code: string; name: string; description?: string; order?: number }) => {
        setIsSubmitting(true);
        try {
            const res = editing ? await updateRole(editing.id, data) : await createRole(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editing ? 'Rôle mis à jour' : 'Rôle créé', 'success');
                setIsFormOpen(false);
                setEditing(null);
                fetchRoles();
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification('Erreur lors de l\'enregistrement', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (role: RoleRow) => {
        if (role.isSystem) {
            addNotification('Les rôles système ne peuvent pas être supprimés', 'error');
            return;
        }
        if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return;
        try {
            const res = await deleteRole(role.id);
            if (res.statusCode === 200) {
                addNotification('Rôle supprimé', 'success');
                fetchRoles();
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification('Erreur lors de la suppression', 'error');
        }
    };

    const columns: ColumnDef<RoleRow>[] = [
        {
            accessorKey: 'name',
            header: 'Rôle',
            cell: ({ row }) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{row.original.name}</span>
                        {row.original.isSystem && (
                            <Badge variant="outline" className="text-[8px] font-black uppercase">Système</Badge>
                        )}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{row.original.code}</div>
                </div>
            ),
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.description || '—'}</span>,
        },
        {
            accessorKey: '_count',
            header: 'Utilisateurs / Policies',
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px]">{row.original._count?.users ?? 0} utilisateurs</Badge>
                    <Badge variant="outline" className="text-[9px]">{row.original._count?.policies ?? 0} policies</Badge>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Rôles</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gestion des rôles dynamiques (RBAC)</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setIsFormOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap"
                >
                    <Icon icon="solar:add-circle-bold-duotone" width={18} />
                    Nouveau rôle
                </button>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable
                    columns={columns}
                    data={roles}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="name"
                    actions={[
                        { icon: ShieldCheck, label: 'Gérer les policies', value: 'policies' },
                        { icon: Edit2, label: 'Modifier', value: 'edit' },
                        { icon: Trash2, label: 'Supprimer', value: 'delete', className: 'text-rose-700', disabled: (row) => row.isSystem },
                    ]}
                    onAction={(action, row) => {
                        if (action === 'edit') { setEditing(row); setIsFormOpen(true); }
                        if (action === 'delete') handleDelete(row);
                        if (action === 'policies') setPoliciesRole(row);
                    }}
                    emptyMessage="Aucun rôle trouvé."
                />
            </div>

            <Modal isOpen={isFormOpen} onClose={() => { setIsFormOpen(false); setEditing(null); }}>
                <RoleForm
                    initial={editing ?? undefined}
                    onSubmit={handleSubmit}
                    onClose={() => { setIsFormOpen(false); setEditing(null); }}
                    isSubmitting={isSubmitting}
                />
            </Modal>

            <Modal isOpen={!!policiesRole} onClose={() => setPoliciesRole(null)}>
                {policiesRole && (
                    <PoliciesAssignment role={policiesRole} onClose={() => setPoliciesRole(null)} onSaved={fetchRoles} />
                )}
            </Modal>
        </div>
    );
}
