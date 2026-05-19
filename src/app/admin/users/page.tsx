'use client';

import React, { useState, useEffect } from 'react';
import { getAllUsers, getSuspendedUsersAdmin, getRecoveryRequestsAdmin, suspendUserAdmin, reactivateUserAdmin, deleteUserAdmin, updateUser } from '@/api/api';
import { Users, Shield, UserX, Mail, Phone, Calendar, Edit2, RotateCcw, Ban, Trash2, Search, AlertCircle } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { User, Role } from '@/types/interface';
import { Modal } from '@/components/ui/MotionModal';
import FormsUser from '@/components/profile/forms/FormsUser';
import { GenericTable } from '@/components/ui/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from "@/utils/langue/hooks";

type ViewMode = 'all' | 'suspended' | 'recovery';

export default function AdminUsersPage() {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<ViewMode>('all');
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchPhone, setSearchPhone] = useState('');
    const { addNotification } = useNotification();

    // Modal state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const handleSuspend = async (user: User) => {
        if (!confirm(t("admin.users.suspend_confirm", { name: user.fullName || user.email }))) return;
        try {
            const res = await suspendUserAdmin(user.id);
            if (res.statusCode === 200) {
                addNotification(t("admin.users.success_suspend"), "success");
                fetchUsers();
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
            }
        } catch (error) {
            addNotification(t("admin.users.error_delete"), "error");
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

    const TabButton = ({ mode, label, icon: Icon, count }: { mode: ViewMode, label: string, icon: any, count?: number }) => (
        <button
            onClick={() => { setViewMode(mode); setPage(1); }}
            className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all border-2", viewMode === mode ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-card border-border/50 text-muted-foreground hover:border-primary/30")}>
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                    viewMode === mode ? "bg-white text-primary" : "bg-primary/10 text-primary"
                )}>
                    {count}
                </span>
            )}
        </button>
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">{t("admin.users.title")}</h1>
                    <p className="text-muted-foreground font-medium">{t("admin.users.subtitle")}</p>
                </div>

            </header>

            <div className="flex flex-col sm:flex-row items-center gap-4">
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
                            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-card border border-border/50 outline-none focus:border-primary text-xs font-bold transition-all"
                        />
                    </form>
                </div>

                <div className="flex flex-wrap gap-2">
                    <TabButton mode="all" label={t("admin.users.all_users")} icon={Users} />
                    <TabButton mode="suspended" label={t("admin.users.suspended_users")} icon={Ban} />
                    <TabButton mode="recovery" label={t("admin.users.recovery_requests")} icon={RotateCcw} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm p-4">
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
                                { icon: Edit2, label: t("common.edit"), value: "edit" },
                                { icon: Ban, label: t("admin.users.suspend"), value: "suspend", className: "text-rose-600", disabled: (row) => row.isSuspended },
                                { icon: RotateCcw, label: t("admin.users.reactivate"), value: "reactivate", className: "text-green-600", disabled: (row) => !row.isSuspended },
                                { icon: Trash2, label: t("common.delete"), value: "delete", className: "text-rose-700" }
                            ]}
                            onAction={(action, row) => {
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
                </div>
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
        </div>
    );
}
