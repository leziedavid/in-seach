'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminLogs, deleteAdminLogs } from '@/api/api';
import { Log } from '@/types/interface';
import { Terminal, RefreshCw, Trash2, Clock, Activity, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { GenericTable, TableAction } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { DeleteConfirmation } from '@/components/ui/delete-confirmation';
import { TablePagination } from '@/components/table/Pagination';

export default function LogsPage() {
    const { theme } = useTheme();
    const isDarkMode = theme === 'dark';

    const [logs, setLogs] = useState<Log[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });
    const [level, setLevel] = useState<string>('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Selection state
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                startDate: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                endDate: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                level: level || undefined,
                page,
                limit: 15
            };
            const res = await getAdminLogs(params);
            if (res.statusCode === 200 && res.data) {
                setLogs(res.data.data);
                setTotalPages(res.data.totalPages);
                setTotal(res.data.total);
            }
        } catch (error) {
            console.error('Failed to fetch logs', error);
            toast.error('Impossible de charger les logs');
        } finally {
            setLoading(false);
        }
    }, [dateRange, level, page]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (autoRefresh) {
            interval = setInterval(() => {
                fetchLogs();
            }, 10000);
        }
        return () => clearInterval(interval);
    }, [autoRefresh, fetchLogs]);

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            // In this version, we delete files by date. 
            // Since we select log entries, we extract unique dates from selected logs.
            const selectedDates = Array.from(selectedRows);
            const res = await deleteAdminLogs(selectedDates);

            if (res.statusCode === 200) {
                toast.success('Logs supprimés avec succès');
                setIsDeleteDialogOpen(false);
                setSelectedRows(new Set());
                fetchLogs();
            }
        } catch (error) {
            toast.error('Erreur lors de la suppression');
        } finally {
            setDeleteLoading(false);
        }
    };

    const columns: ColumnDef<Log>[] = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        table.toggleAllPageRowsSelected(isChecked);
                        if (isChecked) {
                            const dates = new Set(logs.map(l => format(new Date(l.timestamp), 'yyyy-MM-dd')));
                            setSelectedRows(dates);
                        } else {
                            setSelectedRows(new Set());
                        }
                    }}
                    className="rounded border-slate-300 dark:border-slate-700"
                />
            ),
            cell: ({ row }) => {
                const date = format(new Date(row.original.timestamp), 'yyyy-MM-dd');
                return (
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={(e) => {
                            row.toggleSelected(!!e.target.checked);
                            const newSelected = new Set(selectedRows);
                            if (e.target.checked) {
                                newSelected.add(date);
                            } else {
                                // Only remove if no other rows with the same date are selected
                                // Simplified for this UI: selecting a row selects the date-file
                                newSelected.delete(date);
                            }
                            setSelectedRows(newSelected);
                        }}
                        className="rounded border-slate-300 dark:border-slate-700"
                    />
                );
            },
        },
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-medium text-xs">
                        {format(new Date(row.original.timestamp), 'HH:mm:ss')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        {format(new Date(row.original.timestamp), 'yyyy-MM-dd')}
                    </span>
                </div>
            )
        },
        {
            accessorKey: 'level',
            header: 'Niveau',
            cell: ({ row }) => {
                const lvl = row.original.level.toUpperCase();
                let variant: "default" | "destructive" | "outline" | "secondary" = "default";
                let className = "";

                if (lvl === 'ERROR') {
                    variant = "destructive";
                    className = "bg-red-500/10 text-red-500 border-red-500/20";
                } else if (lvl === 'WARN') {
                    className = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
                } else if (lvl === 'INFO') {
                    className = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
                }

                return (
                    <Badge variant={variant} className={`font-bold transition-all ${className}`}>
                        {lvl}
                    </Badge>
                );
            }
        },
        {
            accessorKey: 'context',
            header: 'Contexte',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 text-[10px] font-mono border rounded bg-muted/50">
                    {row.original.context || 'Global'}
                </span>
            )
        },
        {
            accessorKey: 'message',
            header: 'Message',
            cell: ({ row }) => (
                <div className="max-w-md">
                    <p className="text-sm truncate hover:text-clip hover:whitespace-normal">
                        {row.original.message}
                    </p>
                    {row.original.metadata && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                            {JSON.stringify(row.original.metadata)}
                        </div>
                    )}
                </div>
            )
        }
    ], [logs, selectedRows]);

    if (!mounted) return null;

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20">
                                <Terminal className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500" />
                            <p className="text-sm text-muted-foreground">
                                Monitoring et gestion des activités backend
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${autoRefresh ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500' : 'bg-card/50 border-none'
                            }`}>
                            <Clock className={`w-4 h-4 ${autoRefresh ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-semibold">Live</span>
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`w-9 h-5 rounded-full relative transition-all ${autoRefresh ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-800'
                                    }`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${autoRefresh ? 'right-1' : 'left-1'
                                    }`} />
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchLogs()}
                            className="bg-card/50 border-none"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </header>

                {/* Filters & Actions */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                    <div className="flex flex-wrap items-center gap-4">
                        <DateRangePicker
                            date={dateRange}
                            setDate={(d) => {
                                setDateRange(d);
                                setPage(1);
                            }}
                        />

                        <div className="flex items-center bg-card/50 rounded-md overflow-hidden">
                            <div className="px-3 text-muted-foreground border-r border-slate-200 dark:border-slate-800">
                                <Activity className="w-4 h-4" />
                            </div>
                            <select
                                value={level}
                                onChange={(e) => { setLevel(e.target.value); setPage(1); }}
                                className="bg-transparent px-3 py-2 text-sm outline-none cursor-pointer font-medium min-w-[140px]"
                            >
                                <option value="">Tous les niveaux</option>
                                <option value="info">INFO</option>
                                <option value="warn">WARN</option>
                                <option value="error">ERROR</option>
                            </select>
                        </div>
                    </div>

                    {selectedRows.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="gap-2 shadow-lg shadow-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                            Supprimer {selectedRows.size} fichier{selectedRows.size > 1 ? 's' : ''}
                        </Button>
                    )}
                </div>

                {/* Main Table */}
                <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden shadow-sm">
                    <GenericTable
                        columns={columns}
                        data={logs}
                        loading={loading}
                        haveTitle={true}
                        emptyMessage="Aucun log trouvé pour cette configuration."
                    />

                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                            <TablePagination page={page} limit={15} total={total} totalPages={totalPages} onPageChange={setPage} />
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        SYSTEM READY
                    </div>
                    <div className="flex items-center gap-1">
                        AUTO-PURGE: 48H
                    </div>
                    <div className="flex items-center gap-1">
                        TOTAL: {total} ENTRIES
                    </div>
                </div>
            </div>

            <DeleteConfirmation
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDelete}
                loading={deleteLoading}
                title={`Supprimer ${selectedRows.size} fichiers de logs ?`}
                description="Cette action supprimera les fichiers JSON correspondant aux dates sélectionnées. Les logs système de ces journées seront définitivement perdus."
            />
        </div>
    );
}