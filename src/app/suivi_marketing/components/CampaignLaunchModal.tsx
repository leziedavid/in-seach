'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Modal } from '@/components/ui/MotionModal';
import {
    marketingGetMessageTemplates,
    marketingCreateMessageTemplate,
    marketingUpdateMessageTemplate,
    marketingArchiveMessageTemplate,
    marketingLaunchCampaign,
    type MarketingMessageTemplate,
} from '@/api/api';

interface CampaignLaunchModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionKey: string;
    campaignLabel: string;
    defaultBody: string;
    onLaunched: () => void;
}

export function CampaignLaunchModal({ isOpen, onClose, actionKey, campaignLabel, defaultBody, onLaunched }: CampaignLaunchModalProps) {
    const [templates, setTemplates] = useState<MarketingMessageTemplate[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [title, setTitle] = useState(campaignLabel ?? '');
    const [body, setBody] = useState(defaultBody ?? '');
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [archivingId, setArchivingId] = useState<string | null>(null);
    const [launching, setLaunching] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const fetchTemplates = useCallback(async () => {
        setLoadingTemplates(true);
        try {
            const res = await marketingGetMessageTemplates();
            setTemplates(res.data ?? []);
        } catch {
            /* ignore */
        }
        setLoadingTemplates(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setSelectedTemplateId('');
            setTitle(campaignLabel ?? '');
            setBody(defaultBody ?? '');
            setError('');
            setInfo('');
            fetchTemplates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const handleSelectTemplate = (id: string) => {
        setSelectedTemplateId(id);
        setInfo('');
        if (!id) return;
        const tpl = templates.find((t) => t.id === id);
        if (tpl) {
            setTitle(tpl.title);
            setBody(tpl.body);
        }
    };

    const handleSaveAsNewTemplate = async () => {
        if (!title.trim() || !body.trim()) return;
        setSavingTemplate(true);
        setError('');
        try {
            const res = await marketingCreateMessageTemplate({ title: title.trim(), body: body.trim() });
            if (res.data) {
                setInfo('Modèle enregistré dans la bibliothèque');
                setSelectedTemplateId(res.data.id);
                fetchTemplates();
            }
        } catch {
            setError("Impossible d'enregistrer le modèle");
        }
        setSavingTemplate(false);
    };

    const handleUpdateTemplate = async () => {
        if (!selectedTemplateId || !title.trim() || !body.trim()) return;
        setSavingTemplate(true);
        setError('');
        try {
            await marketingUpdateMessageTemplate(selectedTemplateId, { title: title.trim(), body: body.trim() });
            setInfo('Modèle mis à jour');
            fetchTemplates();
        } catch {
            setError('Impossible de mettre à jour le modèle');
        }
        setSavingTemplate(false);
    };

    const handleArchiveTemplate = async (id: string) => {
        setArchivingId(id);
        try {
            await marketingArchiveMessageTemplate(id);
            if (selectedTemplateId === id) {
                setSelectedTemplateId('');
            }
            setTemplates((prev) => prev.filter((t) => t.id !== id));
        } catch {
            setError("Impossible d'archiver ce modèle");
        }
        setArchivingId(null);
    };

    const handleLaunch = async () => {
        if (!title.trim() || !body.trim()) {
            setError('Le titre et le message sont requis');
            return;
        }
        setLaunching(true);
        setError('');
        try {
            const res = await marketingLaunchCampaign(actionKey, { title: title.trim(), body: body.trim() });
            if (res.statusCode === 200) {
                onLaunched();
                onClose();
            } else {
                setError(res.message || 'Échec du lancement');
            }
        } catch {
            setError('Erreur réseau');
        }
        setLaunching(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={campaignLabel}>
            <div className="p-4 sm:p-6 space-y-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Bibliothèque de messages</label>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm"
                    >
                        <option value="">— Nouveau message —</option>
                        {templates.map((t) => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                        ))}
                    </select>
                    {loadingTemplates && <p className="text-[11px] text-muted-foreground">Chargement des modèles…</p>}

                    {templates.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            {templates.map((t) => (
                                <span
                                    key={t.id}
                                    className={`inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-[10px] border ${
                                        selectedTemplateId === t.id ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'
                                    }`}
                                >
                                    <button type="button" onClick={() => handleSelectTemplate(t.id)} className="truncate max-w-[100px]">
                                        {t.title}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleArchiveTemplate(t.id)}
                                        disabled={archivingId === t.id}
                                        title="Archiver ce modèle"
                                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
                                    >
                                        <Icon icon={archivingId === t.id ? 'solar:refresh-bold-duotone' : 'solar:close-circle-bold'} width={11} className={archivingId === t.id ? 'animate-spin' : ''} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Titre</label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={150}
                        className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Message</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={4}
                        maxLength={2000}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleSaveAsNewTemplate}
                        disabled={savingTemplate || !title.trim() || !body.trim()}
                        className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        Enregistrer comme nouveau modèle
                    </button>
                    {selectedTemplateId && (
                        <button
                            type="button"
                            onClick={handleUpdateTemplate}
                            disabled={savingTemplate}
                            className="flex-1 h-9 rounded-lg border border-border text-xs font-semibold hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            Mettre à jour ce modèle
                        </button>
                    )}
                </div>

                {info && <p className="text-[11px] text-emerald-600">{info}</p>}
                {error && <p className="text-[11px] text-red-500">{error}</p>}

                <div className="flex gap-2 pt-1 pb-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="button"
                        onClick={handleLaunch}
                        disabled={launching}
                        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {launching && <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />}
                        Lancer la campagne
                    </button>
                </div>
            </div>
        </Modal>
    );
}
