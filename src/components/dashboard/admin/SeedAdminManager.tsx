'use client';

import React, { useEffect, useState } from 'react';
import { Database, Play, Trash2, CheckCircle2, AlertCircle, Info, Layers, Loader2 } from 'lucide-react';
import { getSeedConfig, runSeed, runFullSeed, clearDatabase, SeedTableConfig } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from "@/utils/langue/hooks";

export default function SeedAdminManager() {
    const { t } = useTranslation();
    const { addNotification } = useNotification();
    const [configs, setConfigs] = useState<SeedTableConfig[]>([]);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(true);

    const fetchConfig = async () => {
        setIsRefreshing(true);
        try {
            const res = await getSeedConfig();
            if (res.statusCode === 200) {
                setConfigs((res.data || []).sort((a, b) => a.order - b.order));
            }
        } catch (error) {
            addNotification(t("akwaba.seed.error_config"), "error");
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const toggleTable = (key: string) => {
        setSelectedTables(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const handleRunSeed = async () => {
        if (selectedTables.length === 0) {
            addNotification(t("akwaba.seed.select_table"), "warning");
            return;
        }

        setLoading(true);
        setLogs(prev => [...prev, `🚀 ${t("akwaba.seed.launch_manual")} : ${new Date().toLocaleTimeString()}`]);
        try {
            const res = await runSeed(selectedTables);
            if (res.statusCode === 200) {
                setLogs(prev => [...prev, ...(res.data?.logs || []), `✅ ${t("akwaba.seed.operation_success")}`]);
                addNotification(t("akwaba.seed.seed_success"), "success");
            } else {
                addNotification(t("akwaba.seed.seed_error"), "error");
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ ERREUR: ${error.message}`]);
            addNotification(t("akwaba.seed.system_error_seed"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFullSeed = async () => {
        if (!confirm(t("akwaba.seed.confirm_full_seed"))) return;

        setLoading(true);
        setLogs(prev => [...prev, `🔥 ${t("akwaba.seed.launch_full")} : ${new Date().toLocaleTimeString()}`]);
        try {
            const res = await runFullSeed();
            if (res.statusCode === 200) {
                setLogs(prev => [...prev, ...(res.data || []), `✅ ${t("akwaba.seed.full_migration_done")}`]);
                addNotification(t("akwaba.seed.all_migrated"), "success");
            } else {
                addNotification(t("akwaba.seed.full_migration_error"), "error");
            }
        } catch (error: any) {
            setLogs(prev => [...prev, `❌ ERREUR: ${error.message}`]);
            addNotification(t("akwaba.seed.system_error_migration"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleClearDb = async () => {
        if (!confirm(t("akwaba.seed.confirm_clear_db"))) return;

        setLoading(true);
        try {
            const res = await clearDatabase();
            if (res.statusCode === 200) {
                setLogs(prev => [...prev, `🧹 ${t("akwaba.seed.db_cleaned_log")}`]);
                addNotification(t("akwaba.seed.db_cleaned_toast"), "success");
            }
        } catch (error) {
            addNotification(t("akwaba.seed.error_cleaning"), "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="rounded-lg border-border/50 shadow-xs overflow-hidden h-full flex flex-col">
            <CardHeader className="p-8 pb-4 bg-muted/20 border-b border-border/30 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-600">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-black">{t("akwaba.seed.title")}</CardTitle>
                        <CardDescription className="text-xs font-medium">{t("akwaba.seed.description")}</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" onClick={handleFullSeed} disabled={loading} className="rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md shadow-emerald-500/20">
                        <Play className="w-4 h-4 fill-current mr-2" />
                        {t("akwaba.seed.migrate_all")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchConfig} disabled={isRefreshing} className="rounded-lg font-bold">
                        {isRefreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-8 space-y-6 flex-1 overflow-hidden flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
                    <div className="space-y-4 flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary" />
                                {t("akwaba.seed.available_tables")}
                            </h3>
                            <Badge variant="outline" className="text-[10px] uppercase font-black">
                                {configs.length} {t("akwaba.seed.entities")}
                            </Badge>
                        </div>

                        <ScrollArea className="flex-1 rounded-xl border border-border/50 bg-muted/5 p-4">
                            <div className="space-y-3">
                                {configs.map((config) => (
                                    <div key={config.key} className={`p-3 rounded-xl border transition-all flex items-start gap-3 group cursor-pointer ${selectedTables.includes(config.key) ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-card border-border/40 hover:border-border/80'}`} onClick={() => toggleTable(config.key)}>
                                        <Checkbox checked={selectedTables.includes(config.key)} onCheckedChange={() => toggleTable(config.key)} className="mt-1 rounded-md border-2 border-primary/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-black uppercase tracking-tight">{config.name}</span>
                                                <Badge variant="secondary" className="text-[9px] h-4 font-black">
                                                    #{config.order}
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground font-medium line-clamp-1">{config.description}</p>
                                            {config.dependsOn && config.dependsOn.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {config.dependsOn.map(dep => (
                                                        <Badge key={dep} variant="outline" className="text-[8px] bg-muted/50 font-bold border-border/30">
                                                            {t("akwaba.seed.dependency")}: {dep}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="flex gap-3 pt-2">
                            <Button onClick={handleRunSeed} disabled={loading || selectedTables.length === 0} className="flex-1 rounded-xl font-black gap-2 h-11 shadow-lg shadow-primary/20">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                                {t("akwaba.seed.execute_seed")}
                            </Button>
                            <Button variant="outline" onClick={handleClearDb} disabled={loading} className="rounded-xl font-black text-destructive border-destructive/20 hover:bg-destructive/10 h-11">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col overflow-hidden">
                        <h3 className="text-sm font-black flex items-center gap-2">
                            <CodeIcon className="w-4 h-4 text-primary" />
                            {t("akwaba.seed.execution_logs")}
                        </h3>
                        <div className="flex-1 bg-slate-950 rounded-xl p-4 font-mono text-[10px] overflow-hidden flex flex-col border border-white/5 shadow-2xl">
                            <ScrollArea className="flex-1">
                                <div className="space-y-1.5">
                                    {logs.length === 0 ? (
                                        <span className="text-slate-500 italic">{t("akwaba.seed.wait_action")}</span>
                                    ) : (
                                        logs.map((log, i) => {
                                            const isSuccess = log.includes('✅') || log.includes('success') || log.includes('completed');
                                            const isError = log.includes('❌') || log.includes('failed') || log.includes('Error');
                                            const isWarning = log.includes('⚠️');

                                            return (
                                                <div key={i} className={`flex items-start gap-2 ${isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    <span className="opacity-30 shrink-0 select-none">{(i + 1).toString().padStart(2, '0')}.</span>
                                                    <span className="leading-relaxed">{log}</span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>
                            {logs.length > 0 && (
                                <button onClick={() => setLogs([])} className="mt-3 text-[9px] text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1.5 font-bold">
                                    <Trash2 className="w-3 h-3" />
                                    {t("akwaba.seed.clear_console")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Sub-components used
function CodeIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    );
}
