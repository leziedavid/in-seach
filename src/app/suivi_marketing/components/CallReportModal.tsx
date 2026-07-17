'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/MotionModal';
import { adminSearchUserByPhone, marketingCreateCall, marketingUpdateCall } from '@/api/api';
import { MODULE_LABELS, PRIORITY_CONFIG, STATUS_CONFIG } from './badges';

const reportSchema = z.object({
    module: z.string(),
    objet: z.string().min(3, "L'objet est trop court").max(200),
    commentaire: z.string().max(2000).optional().or(z.literal('')),
    decision: z.string().max(1000).optional().or(z.literal('')),
    actionsAFaire: z.string().max(1000).optional().or(z.literal('')),
    statut: z.string(),
    priorite: z.string(),
    dateRappel: z.string().optional().or(z.literal('')),
});

type ReportFormData = z.infer<typeof reportSchema>;

export interface ClientLite {
    id: string;
    fullName: string | null;
    phone: string;
    indicatif?: string;
    email?: string;
}

interface CallRecord {
    id: string;
    client: ClientLite;
    module: string;
    objet: string;
    commentaire?: string | null;
    decision?: string | null;
    actionsAFaire?: string | null;
    statut: string;
    priorite: string;
    dateRappel?: string | null;
}

interface CallReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    call?: CallRecord | null;
    /** Client préselectionné (ex : ouverture depuis la liste des utilisateurs) — masque la recherche par téléphone. */
    presetClient?: ClientLite | null;
    onSuccess: () => void;
}

export function CallReportModal({ isOpen, onClose, call, presetClient, onSuccess }: CallReportModalProps) {
    const isEditing = !!call;
    const lockedClient = call?.client ?? presetClient ?? null;
    const showClientSearch = !lockedClient;
    const [client, setClient] = useState<ClientLite | null>(lockedClient);
    const [phoneQuery, setPhoneQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ReportFormData>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            module: call?.module ?? 'AUTRE',
            objet: call?.objet ?? '',
            commentaire: call?.commentaire ?? '',
            decision: call?.decision ?? '',
            actionsAFaire: call?.actionsAFaire ?? '',
            statut: call?.statut ?? 'EN_ATTENTE',
            priorite: call?.priorite ?? 'NORMALE',
            dateRappel: call?.dateRappel ? call.dateRappel.slice(0, 10) : '',
        },
    });

    useEffect(() => {
        if (isOpen) {
            setClient(lockedClient);
            setPhoneQuery('');
            setSearchError('');
            setSubmitError('');
            reset({
                module: call?.module ?? 'AUTRE',
                objet: call?.objet ?? '',
                commentaire: call?.commentaire ?? '',
                decision: call?.decision ?? '',
                actionsAFaire: call?.actionsAFaire ?? '',
                statut: call?.statut ?? 'EN_ATTENTE',
                priorite: call?.priorite ?? 'NORMALE',
                dateRappel: call?.dateRappel ? call.dateRappel.slice(0, 10) : '',
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, call, presetClient]);

    const handleSearchClient = async () => {
        if (!phoneQuery.trim()) return;
        setSearching(true);
        setSearchError('');
        try {
            const res = await adminSearchUserByPhone(phoneQuery.trim());
            if (res.data) {
                setClient(res.data as unknown as ClientLite);
            } else {
                setSearchError('Aucun client trouvé pour ce numéro');
            }
        } catch {
            setSearchError('Erreur lors de la recherche');
        }
        setSearching(false);
    };

    const onSubmit: SubmitHandler<ReportFormData> = async (data) => {
        if (!isEditing && !client) {
            setSubmitError('Veuillez sélectionner un client avant d\'enregistrer');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        try {
            const payload = {
                module: data.module,
                objet: data.objet,
                commentaire: data.commentaire || undefined,
                decision: data.decision || undefined,
                actionsAFaire: data.actionsAFaire || undefined,
                statut: data.statut,
                priorite: data.priorite,
                dateRappel: data.dateRappel ? new Date(data.dateRappel).toISOString() : undefined,
            };
            const res = isEditing
                ? await marketingUpdateCall(call!.id, payload)
                : await marketingCreateCall({ ...payload, clientId: client!.id });

            if (res.statusCode === 200 || res.statusCode === 201) {
                onSuccess();
                onClose();
            } else {
                setSubmitError(res.message || 'Une erreur est survenue');
            }
        } catch {
            setSubmitError('Erreur réseau, veuillez réessayer');
        }
        setSubmitting(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Compte-rendu d\'appel' : 'Nouvel appel'}>
            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4">
                {/* Client */}
                {!showClientSearch ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon icon="solar:user-bold-duotone" width={18} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{client?.fullName ?? 'Client'}</p>
                            <p className="text-xs text-muted-foreground">{client?.indicatif}{client?.phone}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Client (recherche par téléphone)</label>
                        <div className="flex gap-2">
                            <input
                                type="tel"
                                value={phoneQuery}
                                onChange={(e) => setPhoneQuery(e.target.value)}
                                placeholder="Ex : 0102030405"
                                className="flex-1 h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                                type="button"
                                onClick={handleSearchClient}
                                disabled={searching}
                                className="px-3.5 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
                            >
                                <Icon icon={searching ? 'solar:refresh-bold-duotone' : 'solar:magnifer-bold-duotone'} width={14} className={searching ? 'animate-spin' : ''} />
                                Rechercher
                            </button>
                        </div>
                        {searchError && <p className="text-xs text-red-500">{searchError}</p>}
                        {client && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
                                <Icon icon="solar:check-circle-bold-duotone" width={18} className="text-green-600 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{client.fullName ?? 'Client'}</p>
                                    <p className="text-xs text-muted-foreground">{client.indicatif}{client.phone}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Module + Objet */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Module concerné</label>
                        <select {...register('module')} className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm">
                            {Object.entries(MODULE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Priorité</label>
                        <select {...register('priorite')} className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm">
                            {Object.entries(PRIORITY_CONFIG).map(([value, cfg]) => (
                                <option key={value} value={value}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Objet</label>
                    <input
                        {...register('objet')}
                        placeholder="Ex : Question sur une livraison"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {errors.objet && <p className="text-xs text-red-500">{errors.objet.message}</p>}
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Résumé de l&apos;appel</label>
                    <textarea
                        {...register('commentaire')}
                        rows={3}
                        placeholder="Résumé de la conversation..."
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Décision prise</label>
                    <input
                        {...register('decision')}
                        placeholder="Ex : Remboursement accepté"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Actions à effectuer</label>
                    <input
                        {...register('actionsAFaire')}
                        placeholder="Ex : Relancer le vendeur"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Statut</label>
                        <select {...register('statut')} className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm">
                            {Object.entries(STATUS_CONFIG).map(([value, cfg]) => (
                                <option key={value} value={value}>{cfg.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Date de rappel</label>
                        <input
                            type="date"
                            {...register('dateRappel')}
                            className="w-full h-10 px-3 rounded-xl border border-border bg-white dark:bg-zinc-900 text-sm"
                        />
                    </div>
                </div>

                {submitError && <p className="text-xs text-red-500">{submitError}</p>}

                <div className="flex gap-2 pt-2 pb-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {submitting && <Icon icon="solar:refresh-bold-duotone" width={16} className="animate-spin" />}
                        Enregistrer
                    </button>
                </div>
            </form>
        </Modal>
    );
}
