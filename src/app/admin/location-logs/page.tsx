'use client';

import React from 'react';
import { getAllLocationLogs, deleteLocationLog } from '@/api/api';
import { MapPin, Calendar, Map as MapIcon, Trash2, User as UserIcon, Search, Phone } from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { LocationLog } from '@/types/interface';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AdminLocationLogsPage() {
    const [logs, setLogs] = React.useState<LocationLog[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const [phone, setPhone] = React.useState('');
    const { addNotification } = useNotification();

    const fetchLogs = async (p: number, phoneFilter?: string) => {
        setLoading(true);
        try {
            const res = await getAllLocationLogs({ page: p, limit: 10, phone: phoneFilter });
            if (res.statusCode === 200 && res.data) {
                setLogs(res.data.data);
                setTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des logs de position", "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchLogs(page, phone);
        }, 500);
        return () => clearTimeout(timer);
    }, [page, phone]);

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce log de position ?")) return;
        try {
            const res = await deleteLocationLog(id);
            if (res.statusCode === 200) {
                addNotification("Log supprimé avec succès", "success");
                fetchLogs(page);
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    const columns: ColumnDef<LocationLog>[] = [
        {
            accessorKey: 'user',
            header: 'Utilisateur',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-xs border border-primary/20">
                        <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.user?.fullName || "Utilisateur inconnu"}</div>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-mono">
                           <Phone className="w-2.5 h-2.5" />
                           {row.original.user?.phone || row.original.userId.substring(0, 8) + '...'}
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'coordinates',
            header: 'Coordonnées',
            cell: ({ row }) => (
                <div className="space-y-0.5">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        <MapPin className="w-3 h-3 text-primary" />
                        Lat: {row.original.lat.toFixed(6)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        Lng: {row.original.lng.toFixed(6)}
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'updatedAt',
            header: 'Dernière mise à jour',
            cell: ({ row }) => (
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(row.original.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                        {new Date(row.original.updatedAt).toLocaleTimeString()}
                    </div>
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-[10px] font-bold" asChild>
                        <Link href={`/location?id=${row.original.userId}`}>
                            <MapIcon className="w-3 h-3 mr-1.5" />
                            Voir carte
                        </Link>
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-xl h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(row.original.id)}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight">Logs de Position</h1>
                    <p className="text-muted-foreground font-medium">Suivi en temps réel des positions des utilisateurs.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Filtrer par téléphone..."
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value);
                                setPage(1);
                            }}
                            className="pl-10 h-11 rounded-xl bg-card border-border/50 shadow-sm focus:ring-primary/20 transition-all font-medium"
                        />
                    </div>
                    <Button 
                        variant="outline" 
                        className="h-11 px-5 rounded-xl font-bold border-border/50 bg-card shadow-sm hover:bg-muted/50 transition-colors"
                        onClick={() => fetchLogs(page, phone)}
                    >
                        Actualiser
                    </Button>
                </div>
            </header>

            <div className="p-2">
                <GenericTable
                    columns={columns}
                    data={logs}
                    loading={loading}
                    totalItems={total}
                    currentPage={page}
                    itemsPerPage={10}
                    onPageChange={setPage}
                    emptyMessage="Aucun log de position trouvé"
                />
            </div>
        </div>
    );
}
