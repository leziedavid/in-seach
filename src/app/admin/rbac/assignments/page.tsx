'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { getAllUsers, searchUserByPhoneAdmin, getRoles, getUserDynamicRoles, assignRolesToUser } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { TablePagination } from '@/components/ui/table/Pagination';

interface UserRow {
    id: string;
    fullName: string | null;
    email: string;
    phone: string;
    role: string;
}

interface RoleOption {
    id: string;
    code: string;
    name: string;
}

export default function AdminAssignmentsPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const { addNotification } = useNotification();

    const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
    const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set());
    const [loadingUserRoles, setLoadingUserRoles] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAllUsers({ page, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setUsers(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch {
            addNotification('Erreur lors du chargement des utilisateurs', 'error');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    useEffect(() => {
        (async () => {
            const res = await getRoles({ limit: 100 });
            setRoleOptions(res?.data?.data ?? []);
        })();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!search.trim()) { fetchUsers(); return; }
        try {
            const res = await searchUserByPhoneAdmin(search.trim());
            if (res.statusCode === 200 && res.data) {
                setUsers([res.data]);
                setTotal(1);
            } else {
                addNotification('Aucun utilisateur trouvé', 'info');
            }
        } catch {
            addNotification('Erreur lors de la recherche', 'error');
        }
    };

    const openAssignment = async (user: UserRow) => {
        setSelectedUser(user);
        setLoadingUserRoles(true);
        try {
            const res = await getUserDynamicRoles(user.id);
            const current = (res?.data ?? []).map((ur: any) => ur.role.id);
            setSelectedRoleIds(new Set(current));
        } finally {
            setLoadingUserRoles(false);
        }
    };

    const toggleRole = (id: string) => {
        setSelectedRoleIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setSaving(true);
        try {
            await assignRolesToUser(selectedUser.id, Array.from(selectedRoleIds));
            addNotification('Rôles affectés avec succès', 'success');
            setSelectedUser(null);
        } catch {
            addNotification("Erreur lors de l'affectation", 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">Affectation des rôles</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Attribuez un ou plusieurs rôles dynamiques à chaque utilisateur</p>
            </div>

            <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                <Icon icon="solar:magnifer-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="tel"
                    placeholder="Rechercher par téléphone…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                />
            </form>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">Chargement…</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground">Aucun utilisateur trouvé.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {users.map((user) => (
                            <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                        {(user.fullName || user.email)[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate">{user.fullName || 'Sans nom'}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{user.email} • {user.phone}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => openAssignment(user)}
                                    className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all whitespace-nowrap"
                                >
                                    Gérer les rôles
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {total > 10 && (
                    <div className="p-3 border-t border-border">
                        <TablePagination page={page} limit={10} total={total} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelectedUser(null)}>
                    <div className="bg-card rounded-2xl border border-border max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div>
                            <h3 className="text-lg font-black text-foreground">Rôles de {selectedUser.fullName || selectedUser.email}</h3>
                            <p className="text-xs text-muted-foreground">Rôle historique (legacy) : {selectedUser.role}</p>
                        </div>

                        {loadingUserRoles ? (
                            <p className="text-sm text-muted-foreground">Chargement…</p>
                        ) : (
                            <div className="space-y-1 max-h-72 overflow-y-auto">
                                {roleOptions.map((role) => (
                                    <label key={role.id} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/30">
                                        <input
                                            type="checkbox"
                                            checked={selectedRoleIds.has(role.id)}
                                            onChange={() => toggleRole(role.id)}
                                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                                        />
                                        <span className="text-sm font-semibold text-foreground">{role.name}</span>
                                        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{role.code}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setSelectedUser(null)} className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase">
                                Annuler
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex-[2] h-11 rounded-xl bg-primary text-white text-xs font-black hover:bg-secondary transition-all uppercase">
                                {saving ? '...' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
