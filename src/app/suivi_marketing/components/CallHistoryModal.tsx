'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '@/components/ui/MotionModal';
import { marketingGetCalls } from '@/api/api';
import { StatusBadge, PriorityBadge, MODULE_LABELS } from './badges';

interface CallHistoryRow {
    id: string;
    module: string;
    objet: string;
    statut: string;
    priorite: string;
    dateAppel: string;
    agent: { fullName: string | null };
}

interface CallHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientId: string | null;
    clientName?: string | null;
}

export function CallHistoryModal({ isOpen, onClose, clientId, clientName }: CallHistoryModalProps) {
    const [calls, setCalls] = useState<CallHistoryRow[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const res = await marketingGetCalls({ clientId, limit: 50 });
            setCalls(res.data?.data ?? []);
        } catch {
            /* ignore */
        }
        setLoading(false);
    }, [clientId]);

    useEffect(() => {
        if (isOpen) fetchHistory();
    }, [isOpen, fetchHistory]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Historique — ${clientName ?? 'Client'}`}>
            <div className="p-4 sm:p-6 space-y-3">
                {loading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : calls.length === 0 ? (
                    <div className="py-10 flex flex-col items-center gap-2 text-center">
                        <Icon icon="solar:inbox-line-bold-duotone" width={28} className="text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Aucun appel enregistré pour ce client</p>
                    </div>
                ) : (
                    calls.map((c) => (
                        <div key={c.id} className="p-3 rounded-xl border border-border/60 bg-muted/30 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium text-foreground truncate">{c.objet}</span>
                                <StatusBadge status={c.statut} />
                            </div>
                            <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                    <Icon icon="solar:widget-2-bold-duotone" width={12} />
                                    {MODULE_LABELS[c.module] ?? c.module}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Icon icon="solar:user-bold-duotone" width={12} />
                                    {c.agent?.fullName ?? '—'}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Icon icon="solar:calendar-mark-bold-duotone" width={12} />
                                    {new Date(c.dateAppel).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </span>
                                <PriorityBadge priority={c.priorite} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
