'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit2, Trash2 } from 'lucide-react';
import {
    adminListServiceFees,
    adminCreateServiceFee,
    adminUpdateServiceFee,
    adminDeleteServiceFee,
} from '@/api/wallet-api';
import { ServiceFeeConfig, CreateServiceFeeConfigDto, UpdateServiceFeeConfigDto } from '@/types/interface';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Modal } from '@/components/ui/MotionModal';
import { GenericTable, TableAction } from '@/components/ui/table/table';
import FormsServiceFeeConfig from '@/components/wallet/forms/FormsServiceFeeConfig';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
    return (
        <div className="bg-card border border-border/50 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                <Icon icon={icon} className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-2xl font-black text-foreground">{value}</p>
            </div>
        </div>
    );
}

const FEE_TYPE_LABEL: Record<string, string> = {
    PERCENTAGE: 'Pourcentage',
    FIXED: 'Montant fixe',
    FREE: 'Gratuit',
};

export default function AdminServiceFeesPage() {
    const { addNotification } = useNotification();
    const [fees, setFees] = useState<ServiceFeeConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedFee, setSelectedFee] = useState<ServiceFeeConfig | undefined>(undefined);
    const [search, setSearch] = useState('');

    const fetchFees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminListServiceFees();
            if (res.statusCode === 200 && res.data) setFees(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchFees(); }, [fetchFees]);

    const openCreate = () => {
        setSelectedFee(undefined);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEdit = (fee: ServiceFeeConfig) => {
        setSelectedFee(fee);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (data: CreateServiceFeeConfigDto | UpdateServiceFeeConfigDto) => {
        setIsSubmitting(true);
        try {
            const res = isEditing && selectedFee
                ? await adminUpdateServiceFee(selectedFee.id, data)
                : await adminCreateServiceFee(data as CreateServiceFeeConfigDto);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? 'Service facturable mis à jour' : 'Service facturable créé', 'success');
                setIsModalOpen(false);
                fetchFees();
            } else {
                addNotification(res.message || 'Erreur lors de l\'enregistrement', 'error');
            }
        } catch {
            addNotification('Erreur lors de l\'enregistrement', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleActive = async (fee: ServiceFeeConfig, value: boolean) => {
        try {
            const res = await adminUpdateServiceFee(fee.id, { isActive: value });
            if (res.statusCode === 200) {
                addNotification(value ? 'Service activé' : 'Service désactivé', 'success');
                fetchFees();
            }
        } catch {
            addNotification('Erreur lors de la mise à jour', 'error');
        }
    };

    const handleDelete = async (fee: ServiceFeeConfig) => {
        if (!confirm(`Supprimer le service "${fee.displayName}" ? Toute route qui le référence renverra une erreur tant qu'aucune configuration ne le remplace.`)) return;
        try {
            const res = await adminDeleteServiceFee(fee.id);
            if (res.statusCode === 200) {
                addNotification('Service facturable supprimé', 'success');
                fetchFees();
            } else {
                addNotification(res.message || 'Erreur lors de la suppression', 'error');
            }
        } catch {
            addNotification('Erreur lors de la suppression', 'error');
        }
    };

    const formatValue = (fee: ServiceFeeConfig) => {
        if (fee.feeType === 'FREE') return 'Gratuit';
        if (fee.feeType === 'PERCENTAGE') return `${fee.feeValue}%`;
        return `${fee.feeValue.toLocaleString()} ${fee.currency}`;
    };

    const columns: ColumnDef<ServiceFeeConfig>[] = [
        {
            accessorKey: 'displayName',
            header: 'Service',
            cell: ({ row }) => (
                <div>
                    <p className="font-bold text-foreground">{row.original.displayName}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{row.original.serviceName}</p>
                </div>
            ),
        },
        {
            accessorKey: 'feeType',
            header: 'Type',
            cell: ({ row }) => (
                <span className="text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 px-2 py-0.5 rounded-lg">
                    {FEE_TYPE_LABEL[row.original.feeType] ?? row.original.feeType}
                </span>
            ),
        },
        {
            id: 'value',
            header: 'Montant',
            cell: ({ row }) => <span className="font-black text-foreground">{formatValue(row.original)}</span>,
        },
        {
            id: 'bounds',
            header: 'Min / Max',
            cell: ({ row }) => {
                const fee = row.original;
                if (fee.feeType !== 'PERCENTAGE' || (!fee.minimumFee && !fee.maximumFee)) return <span className="text-muted-foreground text-xs">—</span>;
                return (
                    <span className="text-xs text-muted-foreground">
                        {fee.minimumFee ? `min ${fee.minimumFee.toLocaleString()}` : ''}
                        {fee.minimumFee && fee.maximumFee ? ' / ' : ''}
                        {fee.maximumFee ? `max ${fee.maximumFee.toLocaleString()}` : ''}
                    </span>
                );
            },
        },
        {
            accessorKey: 'updatedAt',
            header: 'Modifié le',
            cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.updatedAt).toLocaleDateString('fr-FR')}</span>,
        },
    ];

    const actions: TableAction<ServiceFeeConfig>[] = [
        { icon: Edit2, label: 'Modifier', value: 'edit' },
        { icon: Trash2, label: 'Supprimer', value: 'delete', variant: 'destructive' },
    ];

    const activeCount = fees.filter(f => f.isActive).length;
    const percentageCount = fees.filter(f => f.feeType === 'PERCENTAGE').length;

    const normalizedSearch = search.trim().toLowerCase();
    const filteredFees = normalizedSearch
        ? fees.filter(f => f.displayName.toLowerCase().includes(normalizedSearch) || f.serviceName.toLowerCase().includes(normalizedSearch))
        : fees;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-xl font-black text-foreground">Services facturables</h1>
                    <p className="text-sm text-muted-foreground">Le catalogue du moteur Wallet — chaque action payante de la plateforme est pilotée depuis ici, sans redéploiement.</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-secondary transition-all shadow-lg shadow-primary/20">
                    <Icon icon="solar:add-circle-bold-duotone" className="w-4 h-4" />
                    Ajouter un service
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard icon="solar:list-check-bold-duotone" label="Services au catalogue" value={fees.length} color="bg-primary/10 text-primary" />
                <StatCard icon="solar:check-circle-bold-duotone" label="Actifs" value={activeCount} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" />
                <StatCard icon="solar:percentage-square-bold-duotone" label="À la commission (%)" value={percentageCount} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30" />
            </div>

            <div className="relative">
                <Icon icon="solar:magnifer-linear" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom ou identifiant technique…"
                    className="w-full md:w-96 pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary transition-all"
                />
            </div>

            <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
                <GenericTable
                    columns={columns}
                    data={filteredFees}
                    loading={loading}
                    enableSwitch
                    getActive={(f) => f.isActive}
                    onToggleActive={handleToggleActive}
                    actions={actions}
                    onAction={(action, fee) => {
                        if (action === 'edit') openEdit(fee);
                        if (action === 'delete') handleDelete(fee);
                    }}
                    emptyMessage={normalizedSearch ? `Aucun service ne correspond à "${search}"` : "Aucun service facturable — ajoutez-en un pour commencer à monétiser une action."}
                    haveTitle={false}
                />
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-4">
                    <h2 className="text-base font-black text-foreground px-4 mb-4">
                        {isEditing ? 'Modifier le service facturable' : 'Nouveau service facturable'}
                    </h2>
                    <FormsServiceFeeConfig
                        initialData={selectedFee}
                        onSubmit={handleSubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsModalOpen(false)}
                    />
                </div>
            </Modal>
        </div>
    );
}
