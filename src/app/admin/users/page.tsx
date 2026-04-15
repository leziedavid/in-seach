'use client';

import React from 'react';
import { adminGetUsers, adminUpdateUser } from '@/api/api';
import { Users, Shield, UserX, Mail, Phone, Calendar, Edit2, MoreVertical } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { User, AdminUserUpdateDto, Role } from '@/types/interface';
import { Modal } from '@/components/modal/MotionModal';
import FormsUser from '@/components/Forms/FormsUser';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const { addNotification } = useNotification();

    // Modal state
    const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const fetchUsers = async (p: number) => {
        setLoading(true);
        try {
            const res = await adminGetUsers({ page: p, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setUsers(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des utilisateurs", "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchUsers(page);
    }, [page]);

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsOpen(true);
    };

    const handleUpdateUser = async (data: AdminUserUpdateDto) => {
        if (!selectedUser) return;
        setIsSubmitting(true);
        try {
            const res = await adminUpdateUser(selectedUser.id, data);
            if (res.statusCode === 200) {
                addNotification("Utilisateur mis à jour avec succès", "success");
                setIsOpen(false);
                fetchUsers(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la mise à jour de l'utilisateur", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'fullName',
            header: 'Utilisateur',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                        {row.original.fullName ? row.original.fullName[0].toUpperCase() : row.original.email[0].toUpperCase()}
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.fullName || "Sans nom"}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.id.substring(0, 8)}...</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'email',
            header: 'Contact',
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
            header: 'Rôle',
            cell: ({ row }) => (
                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${row.original.role === Role.ADMIN
                    ? 'text-rose-600 border-rose-200 bg-rose-50'
                    : row.original.role === Role.PRESTATAIRE
                        ? 'text-amber-600 border-amber-200 bg-amber-50'
                        : 'text-primary border-primary/20 bg-primary/5'
                    }`}>
                    {row.original.role}
                </Badge>
            )
        },
        {
            accessorKey: 'isPremium',
            header: 'Status',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.isPremium ? (
                        <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 text-[9px] font-black uppercase tracking-widest border-none">
                            <Shield className="w-3 h-3 mr-1" />
                            Premium
                        </Badge>
                    ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">Standard</span>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'createdAt',
            header: 'Inscription',
            cell: ({ row }) => (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Calendar className="w-3 h-3" />
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Utilisateurs</h1>
                    <p className="text-muted-foreground font-medium">Gestion globale des comptes et permissions de la plateforme.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-xl font-bold border-border/50 bg-card shadow-sm">
                        Exporter CSV
                    </Button>
                </div>
            </header>

            {/* <div className="bg-card rounded-[2.5rem] border border-border/50 shadow-sm overflow-hidden"> */}
            <div className="p-2">
                <GenericTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    searchKey="fullName"
                    actions={[
                        {
                            icon: Edit2,
                            label: "Modifier",
                            value: "edit"
                        }
                    ]}
                    onAction={(action, row) => {
                        if (action === "edit") handleEditClick(row);
                    }}
                    emptyMessage="Aucun utilisateur trouvé"
                />
            </div>
            {/* </div> */}

            {/* Edit User Modal */}
            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            >
                {selectedUser && (
                    <FormsUser
                        initialData={selectedUser}
                        onSubmit={handleUpdateUser}
                        isSubmitting={isSubmitting}
                        onClose={() => setIsOpen(false)}
                    />
                )}
            </Modal>
        </div>
    );
}
