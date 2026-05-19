'use client';

import React from 'react';
import { getAdminLogs, getAdminLogFiles, deleteAdminLogs, purgeAdminLogs } from '@/api/api';
import { ColumnDef } from '@tanstack/react-table';
import { Terminal, Search, Filter, Trash2, RefreshCw, FileText, AlertTriangle, Info, XCircle, Calendar, ShieldAlert } from 'lucide-react';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { AdminLog } from '@/types/interface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { GenericTable } from '@/components/ui/table/table';
import { useTranslation } from "@/utils/langue/hooks";

export default function AdminLogsPage() {
    const { t } = useTranslation();
    const [logs, setLogs] = React.useState<AdminLog[]>([]);
    const [logFiles, setLogFiles] = React.useState<string[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [total, setTotal] = React.useState(0);
    const [filters, setFilters] = React.useState({ level: '', startDate: '', endDate: '', page: 1, limit: 10 });
    const [purgeRange, setPurgeRange] = React.useState({ startDate: '', endDate: '' });
    const [purging, setPurging] = React.useState(false);
    const { addNotification } = useNotification();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [logsRes, filesRes] = await Promise.all([getAdminLogs(filters), getAdminLogFiles()]);

            if (logsRes.statusCode === 200 && logsRes.data) {
                setLogs(logsRes.data.data || []);
                setTotal(logsRes.data.total || 0);
            }
            if (filesRes.statusCode === 200) setLogFiles(filesRes.data || []);
        } catch (error) {
            addNotification(t("admin.logs.error_load"), "error");
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, [filters.page, filters.level, filters.startDate, filters.endDate]);

    const handleDelete = async (dates: string[]) => {
        if (!confirm(t("admin.logs.confirm_delete", { dates: dates.join(', ') }))) return;
        try {
            const res = await deleteAdminLogs(dates);
            if (res.statusCode === 200) {
                addNotification(t("admin.logs.success_delete"), "success");
                fetchData();
            }
        } catch (error) {
            addNotification(t("admin.logs.error_delete"), "error");
        }
    };

    const handlePurge = async () => {
            ? t("admin.logs.confirm_purge_range", { start: purgeRange.startDate, end: purgeRange.endDate })
            : t("admin.logs.confirm_purge_auto");
        
        if (!confirm(message)) return;

        setPurging(true);
        try {
            const res = await purgeAdminLogs(purgeRange);
            if (res.statusCode === 200) {
                addNotification(res.data?.message || t("admin.logs.success_purge"), "success");
                fetchData();
                setPurgeRange({ startDate: '', endDate: '' });
            }
        } catch (error) {
            addNotification(t("admin.logs.error_purge"), "error");
        } finally {
            setPurging(false);
        }
    };

    const getLevelBadge = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error':
                return <Badge variant="destructive" className="font-black uppercase tracking-widest gap-1.5 py-1 px-3 rounded-full"><XCircle className="w-3 h-3" /> {t("common.error")}</Badge>;
            case 'warn':
                return <Badge variant="link" className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase tracking-widest gap-1.5 py-1 px-3 rounded-full"><ShieldAlert className="w-3 h-3" /> {t("common.warning")}</Badge>;
            default:
                return <Badge variant="default" className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest gap-1.5 py-1 px-3 rounded-full"><Info className="w-3 h-3" /> {t("common.info")}</Badge>;
        }
    };

    const columns: ColumnDef<AdminLog>[] = [
        {
            header: t("common.time"),
            accessorKey: 'timestamp',
            cell: ({ row }) => (
                <span className="font-mono text-[10px] text-muted-foreground whitespace-nowrap">{row.original.timestamp}</span>
            )
        },
        {
            header: t("common.level"),
            accessorKey: 'level',
            cell: ({ row }) => getLevelBadge(row.original.level)
        },
        {
            header: t("common.context"),
            accessorKey: 'context',
            cell: ({ row }) => (
                <Badge variant="outline" className="font-mono text-[10px] border-primary/20 text-primary bg-primary/5 uppercase font-black">
                    {row.original.context || 'System'}
                </Badge>
            )
        },
        {
            header: t("common.message"),
            accessorKey: 'message',
            cell: ({ row }) => (
                <div className="max-w-md break-words font-mono text-[11px] leading-relaxed group-hover:text-foreground transition-colors duration-200">
                    {row.original.message}
                </div>
            )
        }
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Terminal className="text-primary w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">{t("admin.logs.title")}</h1>
                    </div>
                    <p className="text-muted-foreground font-medium text-sm">{t("admin.logs.subtitle")}</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchData()}
                        className={`rounded-xl border-border/50 bg-card ${loading ? 'opacity-50' : ''}`}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        variant="destructive"
                        className="rounded-xl font-bold gap-2 px-6 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                        onClick={handlePurge}
                        disabled={purging}
                    >
                        {purging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        {purgeRange.startDate ? t("admin.logs.confirm_purge") : t("admin.logs.purge")}
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <div className="xl:col-span-1 space-y-6">
                    <Card className="rounded-lg border-border/50 shadow-sm overflow-hidden">
                        <CardContent className="p-8 space-y-8">
                            <div>
                                <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest">
                                    <Filter className="w-4 h-4 text-primary" />
                                    {t("admin.logs.filter_level")}
                                </h3>
                                <div className="space-y-4">
                                    <Select
                                        value={filters.level}
                                        onValueChange={(val) => setFilters({ ...filters, level: val === 'all' ? '' : val, page: 1 })}
                                    >
                                        <SelectTrigger className="rounded-xl border-border/50 h-10 font-bold text-xs">
                                            <SelectValue placeholder="Tous les niveaux" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">{t("admin.logs.all_levels")}</SelectItem>
                                            <SelectItem value="info">{t("common.info")}</SelectItem>
                                            <SelectItem value="warn">{t("common.warning")}</SelectItem>
                                            <SelectItem value="error">{t("common.error")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-foreground mb-4 flex items-center gap-2 uppercase tracking-widest">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    {t("admin.logs.files_by_date")}
                                </h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {logFiles.map((file, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setFilters({ ...filters, startDate: file, endDate: file, page: 1 })}
                                            className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-3 active:scale-95 ${filters.startDate === file ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                                }`}
                                        >
                                            <Calendar className="w-3.5 h-3.5" />
                                            {file}
                                        </button>
                                    ))}
                                    {logFiles.length === 0 && (
                                        <div className="p-4 text-center border-2 border-dashed border-border/50 rounded-2xl">
                                            <p className="text-[10px] font-bold text-muted-foreground">{t("common.no_results")}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-border/50">
                                <h3 className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-widest">
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    {t("admin.logs.purge_period")}
                                </h3>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t("admin.logs.start")}</label>
                                        <Input 
                                            type="date" 
                                            className="rounded-xl h-10 text-xs font-bold bg-muted/30 border-border/50"
                                            value={purgeRange.startDate}
                                            onChange={(e) => setPurgeRange({...purgeRange, startDate: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{t("admin.logs.end")}</label>
                                        <Input 
                                            type="date" 
                                            className="rounded-xl h-10 text-xs font-bold bg-muted/30 border-border/50"
                                            value={purgeRange.endDate}
                                            onChange={(e) => setPurgeRange({...purgeRange, endDate: e.target.value})}
                                        />
                                    </div>
                                    {(purgeRange.startDate || purgeRange.endDate) && (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="text-[10px] font-bold h-8 hover:bg-rose-50 text-rose-500"
                                            onClick={() => setPurgeRange({ startDate: '', endDate: '' })}
                                        >
                                            {t("admin.logs.clear_selection")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg bg-card border-border/50 p-8 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
                        <h4 className="text-sm font-black mb-3 flex items-center gap-2 uppercase tracking-widest">
                            <Info className="w-4 h-4 text-primary" />
                            {t("admin.logs.retention")}
                        </h4>
                        <p className="text-muted-foreground text-xs font-medium leading-relaxed">
                            {t("admin.logs.retention_desc", { time: 48 })}
                        </p>
                    </Card>
                </div>

                <div className="xl:col-span-3">
                    <GenericTable
                        columns={columns}
                        data={logs}
                        loading={loading}
                        totalItems={total}
                        currentPage={filters.page}
                        itemsPerPage={filters.limit}
                        onPageChange={(page: number) => setFilters({ ...filters, page })}
                        emptyMessage={t("common.no_results")}
                    />
                </div>
            </div>
        </div>
    );
}
