'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { getAllUsers, getSuspendedUsersAdmin, getRecoveryRequestsAdmin, suspendUserAdmin, reactivateUserAdmin, deleteUserAdmin, updateUser, resetFreePlanForUserAdmin, resetFreePlanForAllUsersAdmin, createUserAdmin } from '@/api/api';
import { Mail, Phone, Calendar, Edit2, RotateCcw, Ban, Trash2, Search, RefreshCcw, UserPlus } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { User, Role } from '@/types/interface';
import { Modal } from '@/components/ui/MotionModal';
import FormsUser from '@/components/profile/forms/FormsUser';
import FormsUserCreate, { CreateUserFormData } from '@/components/profile/forms/FormsUserCreate';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from "@/utils/langue/hooks";
import type { TKey } from '@/utils/langue';

type ViewMode = 'all' | 'suspended' | 'recovery';

/* ─── KPI Card (même composant/style que /admin/kpi et /admin/webpush) ─── */
function KpiCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string; }) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 border border-border shadow-sm flex items-start gap-3 min-w-0 overflow-hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                <Icon icon={icon} width={20} style={{ color }} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-tight truncate">{label}</p>
                <p className="text-xl font-bold mt-0.5 text-foreground truncate">{value}</p>
            </div>
        </div>
    );
}

const TABS: { value: ViewMode; labelKey: TKey }[] = [
    { value: 'all', labelKey: 'admin.users.all_users' },
    { value: 'suspended', labelKey: 'admin.users.suspended_users' },
    { value: 'recovery', labelKey: 'admin.users.recovery_requests' },
];

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchPhone, setSearchPhone] = useState('');
    const { addNotification } = useNotification();

    // Modal state (édition)
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modal state (création)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Statistiques (cartes en haut de page) — même pattern que /admin/webpush : appels légers
    // limit=1 sur les endpoints déjà utilisés par cette page, le `total` paginé suffit comme compteur.
    const [counts, setCounts] = useState({ all: 0, suspended: 0, recovery: 0 });

    const fetchCounts = useCallback(async () => {
        const [allRes, suspendedRes, recoveryRes] = await Promise.all([
            getAllUsers({ page: 1, limit: 1 }).catch(() => null),
            getSuspendedUsersAdmin({ page: 1, limit: 1 }).catch(() => null),
            getRecoveryRequestsAdmin({ page: 1, limit: 1 }).catch(() => null),
        ]);
        setCounts({
            all: allRes?.data?.total ?? 0,
            suspended: suspendedRes?.data?.total ?? 0,
            recovery: recoveryRes?.data?.total ?? 0,
        });
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let res;
            const params = { page, limit: 10 };

            if (viewMode === 'suspended') {
                res = await getSuspendedUsersAdmin(params);
            } else if (viewMode === 'recovery') {
                res = await getRecoveryRequestsAdmin(params);
            } else {
                res = await getAllUsers(params);
            }

            if (res.statusCode === 200 && res.data) {
                setUsers(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification(t("admin.products.error_load"), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page, viewMode]);

    useEffect(() => { fetchCounts(); }, [fetchCounts]);

    const handleSuspend = async (user: User) => {
        if (!confirm(t("admin.users.suspend_confirm", { name: user.fullName || user.email }))) return;
        try {
            const res = await suspendUserAdmin(user.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.users.success_suspend"), "success");
                fetchUsers();
                fetchCounts();
            }
        } catch (error) {
            addNotification(t("admin.users.error_suspend"), "error");
        }
    };

    const handleReactivate = async (user: User) => {
        try {
            const res = await reactivateUserAdmin(user.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.users.success_reactivate"), "success");
                fetchUsers();
                fetchCounts();
            }
        } catch (error) {
            addNotification(t("admin.users.error_reactivate"), "error");
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(t("admin.users.delete_confirm", { name: user.fullName || user.email }))) return;
        try {
            const res = await deleteUserAdmin(user.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.users.success_delete"), "success");
                fetchUsers();
                fetchCounts();
            }
        } catch (error) {
            addNotification(t("admin.users.error_delete"), "error");
        }
    };

    const handleResetFreePlan = async (user: User) => {
        if (!confirm(`Voulez-vous réinitialiser le plan gratuit pour ${user.fullName || user.email} ?`)) return;
        try {
            const res = await resetFreePlanForUserAdmin(user.id);
            if (res.statusCode === 200) {
                addNotification("Plan gratuit réinitialisé avec succès", "success");
                fetchUsers();
            }
        } catch (error) {
            addNotification("Erreur lors de la réinitialisation du plan", "error");
        }
    };

    const handleResetAllFreePlans = async () => {
        if (!confirm(`Attention : Voulez-vous vraiment réinitialiser le plan gratuit pour TOUS les utilisateurs ? Cette action est irréversible.`)) return;
        try {
            const res = await resetFreePlanForAllUsersAdmin();
            if (res.statusCode === 200) {
                addNotification("Tous les plans gratuits ont été réinitialisés", "success");
                fetchUsers();
            }
        } catch (error) {
            addNotification("Erreur lors de la réinitialisation globale", "error");
        }
    };

    const handleUpdateUser = async (data: any) => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const res = await updateUser(selectedUser.id, data);
            if (res.statusCode === 200) {
                addNotification(t("admin.users.success_update"), "success");
                setIsEditOpen(false);
                fetchUsers();
            }
        } catch (error) {
            addNotification(t("admin.users.error_update"), "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateUser = async (data: CreateUserFormData) => {
        setIsCreating(true);
        try {
            const res = await createUserAdmin(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification("Utilisateur créé avec succès", "success");
                setIsCreateOpen(false);
                setPage(1);
                fetchUsers();
                fetchCounts();
            } else {
                addNotification(res.message || "Erreur lors de la création de l'utilisateur", "error");
            }
        } catch (error: any) {
            addNotification(error?.message || "Erreur lors de la création de l'utilisateur", "error");
        } finally {
            setIsCreating(false);
        }
    };

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'fullName',
            header: t("common.user"),
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs border transition-colors", row.original.isSuspended ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-primary/10 text-primary border-primary/20")}>
                        {row.original.fullName ? row.original.fullName[0].toUpperCase() : row.original.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm">{row.original.fullName || t("admin.users.unnamed")}</span>
                            {row.original.recoveryRequested && (
                                <Badge className="bg-amber-500 text-[8px] h-4 px-1.5 font-black uppercase tracking-tighter">
                                    {t("admin.users.recovery_badge")}
                                </Badge>
                            )}
                        </div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.id.substring(0, 8)}...</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'email',
            header: t("admin.users.role_contact"),
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        {row.original.email}
                    </div>
                    {row.original.phone && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {row.original.phone}
                        </div>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'role',
            header: t("common.role"),
            cell: ({ row }) => (
                <Badge variant="outline" className={cn(
                    "font-black text-[9px] uppercase tracking-widest",
                    row.original.role === Role.ADMIN ? 'text-rose-600 border-rose-200 bg-rose-50' :
                        row.original.role === Role.PRESTATAIRE ? 'text-amber-600 border-amber-200 bg-amber-50' :
                            'text-primary border-primary/20 bg-primary/5'
                )}>
                    {row.original.role}
                </Badge>
            )
        },
        {
            accessorKey: 'isSuspended',
            header: t("common.status"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.isSuspended ? (
                        <Badge className="bg-rose-500 hover:bg-rose-600 text-[9px] font-black uppercase tracking-widest border-none">
                            <Ban className="w-3 h-3 mr-1" />
                            {t("admin.users.status_suspended")}
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[9px] font-black uppercase tracking-widest">
                            {t("admin.users.status_active")}
                        </Badge>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: t("common.created_at"),
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
            {/* ── Header ───────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{t("admin.users.title")}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("admin.users.subtitle")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap"
                    >
                        <UserPlus className="w-4 h-4" />
                        Nouvel utilisateur
                    </button>
                    <button
                        onClick={handleResetAllFreePlans}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold transition-all whitespace-nowrap"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        <span className="hidden lg:inline">Réinitialiser TOUS les plans Free</span>
                        <span className="lg:hidden">Reset Free</span>
                    </button>
                </div>
            </div>

            {/* ── Statistiques (même style que /admin/kpi) ────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiCard icon="solar:users-group-rounded-bold-duotone" label="Total utilisateurs" value={counts.all} color="#3B82F6" />
                <KpiCard icon="solar:forbidden-circle-bold-duotone" label="Comptes suspendus" value={counts.suspended} color="#EF4444" />
                <KpiCard icon="solar:refresh-circle-bold-duotone" label="Demandes de récupération" value={counts.recovery} color="#F59E0B" />
            </div>

            {/* ── Recherche + Tabs (même composant/design que /admin/kpi) ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (searchPhone) {
                            import('@/api/api').then(api => {
                                api.searchUserByPhoneAdmin(searchPhone).then(res => {
                                    if (res.statusCode === 200 && res.data) {
                                        setUsers([res.data]);
                                        setTotal(1);
                                    } else {
                                        addNotification(t("admin.users.no_users"), "info");
                                    }
                                });
                            });
                        } else {
                            fetchUsers();
                        }
                    }}>
                        <input
                            type="tel"
                            placeholder={t("admin.users.search_placeholder")}
                            value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white dark:bg-zinc-900 border border-border text-sm outline-none focus:border-primary transition-all"
                        />
                    </form>
                </div>

                <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto scrollbar-hide">
                    {TABS.map((tab) => (
                        <button
                            key={tab.value}
                            onClick={() => { setViewMode(tab.value); setPage(1); }}
                            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${viewMode === tab.value ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ────────────────────────────────────────── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                <GenericTable
                    columns={columns.filter(c => (c as any).accessorKey !== 'isSuspended')}
                    data={users}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="fullName"
                    enableSwitch={true}
                    getActive={(row) => !row.isSuspended}
                    onToggleActive={(row, value) => {
                        if (value) handleReactivate(row);
                        else handleSuspend(row);
                    }}
                    actions={[
                        { icon: RefreshCcw, label: "Réinitialiser Plan Free", value: "reset-free-plan", className: "text-amber-600" },
                        { icon: Edit2, label: t("common.edit"), value: "edit" },
                        { icon: Ban, label: t("admin.users.suspend"), value: "suspend", className: "text-rose-600", disabled: (row) => row.isSuspended },
                        { icon: RotateCcw, label: t("admin.users.reactivate"), value: "reactivate", className: "text-green-600", disabled: (row) => !row.isSuspended },
                        { icon: Trash2, label: t("common.delete"), value: "delete", className: "text-rose-700" }
                    ]}
                    onAction={(action, row) => {
                        if (action === "reset-free-plan") handleResetFreePlan(row);
                        if (action === "edit") { setSelectedUser(row); setIsEditOpen(true); }
                        if (action === "suspend") handleSuspend(row);
                        if (action === "reactivate") handleReactivate(row);
                        if (action === "delete") handleDelete(row);
                    }}
                    emptyMessage={
                        viewMode === 'recovery' ? t("admin.users.no_recovery") :
                            viewMode === 'suspended' ? t("admin.users.no_suspended") :
                                t("admin.users.no_users")
                    }
                />
            </div>

            {/* Modals */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}>
                {selectedUser && (
                    <FormsUser
                        initialData={selectedUser}
                        onSubmit={handleUpdateUser}
                        isSubmitting={isSubmitting}
                        onClose={() => setIsEditOpen(false)}
                    />
                )}
            </Modal>

            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
                <FormsUserCreate
                    onSubmit={handleCreateUser}
                    isSubmitting={isCreating}
                    onClose={() => setIsCreateOpen(false)}
                />
            </Modal>
        </div>
    );
}
