'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { Modal } from '@/components/ui/MotionModal';
import { Select2 } from '@/components/ui/Select2';
import { useSocket } from '@/components/providers/SocketProvider';
import { useDebounce } from '@/hooks/useDebounce';
import {
    adminGetWebPushSubscriptions,
    adminSendWebPushToAll,
    adminSendWebPushToUser,
    adminSendWebPushToUsers,
} from '@/api/api';
import {
    NotificationSubscriptionAdminItem,
    PushNotificationPayload,
    SendPushProgressEvent,
    SendPushResult,
} from '@/types/interface';

/* ─── Validation ─────────────────────────────────────────────
   vibrate/data sont saisis en texte libre (input "200,100,200" / textarea JSON) puis
   parsés/validés ici — évite d'imposer un éditeur JSON/array dédié pour un besoin ponctuel. */
const urlField = z.string().trim().url('URL invalide').optional().or(z.literal(''));

const notificationFormSchema = z.object({
    title: z.string().trim().min(1, 'Le titre est requis').max(100, '100 caractères maximum'),
    body: z.string().trim().min(1, 'Le message est requis').max(500, '500 caractères maximum'),
    icon: urlField,
    badge: urlField,
    image: urlField,
    clickAction: urlField,
    tag: z.string().trim().optional(),
    lang: z.string().trim().optional(),
    dir: z.enum(['ltr', 'rtl', 'auto']),
    vibrate: z.string().trim().optional().refine((v) => !v || /^\d+(\s*,\s*\d+)*$/.test(v), 'Format attendu : 200,100,200'),
    requireInteraction: z.boolean(),
    silent: z.boolean(),
    renotify: z.boolean(),
    priority: z.enum(['high', 'normal']),
    ttl: z.string().trim().optional().refine((v) => !v || /^\d+$/.test(v), 'Nombre de secondes attendu'),
    collapseKey: z.string().trim().optional(),
    dataJson: z.string().trim().optional().refine((v) => {
        if (!v) return true;
        try { const parsed = JSON.parse(v); return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed); } catch { return false; }
    }, 'JSON invalide (objet attendu, ex: {"cle":"valeur"})'),
    audience: z.enum(['all', 'manual']),
    recipientIds: z.array(z.string()),
});

type NotificationFormData = z.infer<typeof notificationFormSchema>;

const DEFAULT_VALUES: NotificationFormData = {
    title: '',
    body: '',
    icon: '',
    badge: '',
    image: '',
    clickAction: '',
    tag: '',
    lang: 'fr',
    dir: 'auto',
    vibrate: '',
    requireInteraction: false,
    silent: false,
    renotify: false,
    priority: 'high',
    ttl: '',
    collapseKey: '',
    dataJson: '',
    audience: 'all',
    recipientIds: [],
};

function buildPayload(data: NotificationFormData): PushNotificationPayload {
    const payload: PushNotificationPayload = {
        title: data.title,
        body: data.body,
        icon: data.icon || undefined,
        badge: data.badge || undefined,
        image: data.image || undefined,
        clickAction: data.clickAction || undefined,
        tag: data.tag || undefined,
        lang: data.lang || undefined,
        dir: data.dir,
        requireInteraction: data.requireInteraction || undefined,
        silent: data.silent || undefined,
        renotify: data.renotify || undefined,
        priority: data.priority,
        collapseKey: data.collapseKey || undefined,
    };
    if (data.vibrate) payload.vibrate = data.vibrate.split(',').map((v) => Number(v.trim()));
    if (data.ttl) payload.ttl = Number(data.ttl);
    if (data.dataJson) {
        try { payload.data = JSON.parse(data.dataJson); } catch { /* validé par zod, ne devrait pas arriver */ }
    }
    return payload;
}

type Step = 'form' | 'confirm' | 'sending' | 'result';

interface PushNotificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'single' | 'broadcast';
    subscriber?: NotificationSubscriptionAdminItem;
    onSent?: () => void;
}

export function PushNotificationModal({ isOpen, onClose, mode, subscriber, onSent }: PushNotificationModalProps) {
    const { socket } = useSocket();
    const [step, setStep] = useState<Step>('form');
    const [progress, setProgress] = useState<SendPushProgressEvent>({ total: 0, processed: 0, successCount: 0, failureCount: 0 });
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [result, setResult] = useState<SendPushResult | null>(null);
    const [recipientSearch, setRecipientSearch] = useState('');
    const [recipientOptions, setRecipientOptions] = useState<NotificationSubscriptionAdminItem[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(false);
    const debouncedSearch = useDebounce(recipientSearch, 400);

    const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<NotificationFormData>({
        resolver: zodResolver(notificationFormSchema),
        defaultValues: DEFAULT_VALUES,
    });

    useEffect(() => {
        if (isOpen) {
            reset(DEFAULT_VALUES);
            setStep('form');
            setResult(null);
            setProgress({ total: 0, processed: 0, successCount: 0, failureCount: 0 });
        }
    }, [isOpen, reset]);

    // Liste des abonnés pour la sélection manuelle — chargée une fois (recherche client-side via
    // Select2) puis rafraîchie sur recherche serveur debouncée pour couvrir les abonnés au-delà
    // de la première page.
    useEffect(() => {
        if (!isOpen || mode !== 'broadcast') return;
        let cancelled = false;
        setLoadingRecipients(true);
        adminGetWebPushSubscriptions({ page: 1, limit: 300, isActive: true, search: debouncedSearch || undefined })
            .then((res) => {
                if (!cancelled && res.statusCode === 200 && res.data) setRecipientOptions(res.data.items);
            })
            .finally(() => { if (!cancelled) setLoadingRecipients(false); });
        return () => { cancelled = true; };
    }, [isOpen, mode, debouncedSearch]);

    const watched = watch();
    const audience = watch('audience');
    const recipientIds = watch('recipientIds');

    const recipientCount = useMemo(() => {
        if (mode === 'single') return 1;
        if (audience === 'manual') return recipientIds.length;
        return null; // "tous les abonnés" — quantité inconnue tant que l'envoi n'a pas résolu la liste côté serveur
    }, [mode, audience, recipientIds]);

    // Filtre côté socket : ne réagit qu'aux évènements de CE batch (évite toute interférence si
    // un autre envoi était lancé en parallèle depuis un autre onglet du même admin).
    useEffect(() => {
        if (!socket || step !== 'sending') return;
        const handler = (event: SendPushProgressEvent) => {
            setProgress((prev) => (event.total >= prev.total || event.processed >= prev.processed ? event : prev));
        };
        socket.on('webpush:progress', handler);
        return () => { socket.off('webpush:progress', handler); };
    }, [socket, step]);

    const elapsedSeconds = startedAt ? (Date.now() - startedAt) / 1000 : 0;
    const eta = useMemo(() => {
        if (!progress.processed || !progress.total || progress.processed >= progress.total) return null;
        const rate = progress.processed / Math.max(elapsedSeconds, 0.5);
        if (!rate) return null;
        return Math.max(0, Math.round((progress.total - progress.processed) / rate));
    }, [progress, elapsedSeconds]);

    const onSubmit = () => setStep('confirm');

    const performSend = async (data: NotificationFormData) => {
        const payload = buildPayload(data);
        const batchId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
        setStep('sending');
        setStartedAt(Date.now());
        setProgress({ total: mode === 'single' ? 1 : (data.audience === 'manual' ? data.recipientIds.length : 0), processed: 0, successCount: 0, failureCount: 0 });

        try {
            let res;
            if (mode === 'single' && subscriber) {
                res = await adminSendWebPushToUser(subscriber.id, payload, batchId);
            } else if (data.audience === 'manual') {
                res = await adminSendWebPushToUsers(data.recipientIds, payload, batchId);
            } else {
                res = await adminSendWebPushToAll(payload, batchId);
            }
            if (res.data) {
                setProgress({ total: res.data.total, processed: res.data.processed, successCount: res.data.successCount, failureCount: res.data.failureCount });
                setResult(res.data);
            }
        } catch (err) {
            console.error('[PushNotificationModal] send failed:', err);
            setResult({ total: progress.total, processed: progress.total, successCount: 0, failureCount: progress.total });
        } finally {
            setStep('result');
        }
    };

    const handleClose = () => {
        onClose();
        if (step === 'result') onSent?.();
    };

    const previewTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const progressPct = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : (step === 'sending' ? 30 : 0);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={mode === 'single' ? `Envoyer à ${subscriber?.user.fullName || 'cet abonné'}` : 'Envoyer une notification'}>
            <div className="p-4 sm:p-6">
                {step === 'form' && (
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ── Colonne formulaire ─────────────────────── */}
                        <div className="space-y-5">
                            {mode === 'broadcast' && (
                                <div className="space-y-3 p-3 rounded-2xl bg-muted/50 border border-border">
                                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Destinataires</p>
                                    <div className="flex gap-2">
                                        <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${audience === 'all' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                                            <input type="radio" value="all" {...register('audience')} className="accent-primary" />
                                            Tous les abonnés
                                        </label>
                                        <label className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border-2 cursor-pointer text-sm font-medium transition-all ${audience === 'manual' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                                            <input type="radio" value="manual" {...register('audience')} className="accent-primary" />
                                            Sélection manuelle
                                        </label>
                                    </div>
                                    {audience === 'manual' && (
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Rechercher un abonné (nom, email, téléphone)..."
                                                value={recipientSearch}
                                                onChange={(e) => setRecipientSearch(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl bg-card border border-border text-sm outline-none focus:border-primary transition-all"
                                            />
                                            <Controller
                                                name="recipientIds"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select2
                                                        options={recipientOptions}
                                                        mode="multiple"
                                                        disabled={loadingRecipients}
                                                        labelExtractor={(o) => `${o.user.fullName || o.user.phone || 'Sans nom'} — ${o.user.email || ''}`}
                                                        valueExtractor={(o) => o.id}
                                                        selectedItem={field.value}
                                                        onSelectionChange={(v) => field.onChange(v || [])}
                                                        placeholder={loadingRecipients ? 'Chargement...' : 'Sélectionner des abonnés...'}
                                                    />
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Titre *</label>
                                <input {...register('title')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" placeholder="Nouvelle promotion !" />
                                {errors.title && <p className="text-[10px] text-red-500">{errors.title.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Corps du message *</label>
                                <textarea {...register('body')} rows={3} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all resize-none" placeholder="Profitez de -20% sur toute la boutique." />
                                {errors.body && <p className="text-[10px] text-red-500">{errors.body.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Icône (URL)</label>
                                    <input {...register('icon')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" placeholder="https://..." />
                                    {errors.icon && <p className="text-[10px] text-red-500">{errors.icon.message}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Badge (URL)</label>
                                    <input {...register('badge')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" placeholder="https://..." />
                                    {errors.badge && <p className="text-[10px] text-red-500">{errors.badge.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">Image (URL)</label>
                                <input {...register('image')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" placeholder="https://..." />
                                {errors.image && <p className="text-[10px] text-red-500">{errors.image.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-foreground">URL d&apos;ouverture (click)</label>
                                <input {...register('clickAction')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" placeholder="https://djamko.com/..." />
                                {errors.clickAction && <p className="text-[10px] text-red-500">{errors.clickAction.message}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Tag</label>
                                    <input {...register('tag')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Langue</label>
                                    <input {...register('lang')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-foreground">Direction</label>
                                    <select {...register('dir')} className="w-full h-10 px-2 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all">
                                        <option value="auto">auto</option>
                                        <option value="ltr">ltr</option>
                                        <option value="rtl">rtl</option>
                                    </select>
                                </div>
                            </div>

                            <details className="group">
                                <summary className="cursor-pointer text-xs font-bold text-primary flex items-center gap-1 select-none">
                                    <Icon icon="solar:tuning-2-bold-duotone" className="w-4 h-4" />
                                    Options avancées
                                </summary>
                                <div className="mt-3 space-y-3 pl-1">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground">Vibrations (ms)</label>
                                            <input {...register('vibrate')} placeholder="200,100,200" className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" />
                                            {errors.vibrate && <p className="text-[10px] text-red-500">{errors.vibrate.message}</p>}
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground">TTL (secondes)</label>
                                            <input {...register('ttl')} placeholder="86400" className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" />
                                            {errors.ttl && <p className="text-[10px] text-red-500">{errors.ttl.message}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground">Priorité</label>
                                            <select {...register('priority')} className="w-full h-10 px-2 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all">
                                                <option value="high">high</option>
                                                <option value="normal">normal</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-foreground">Collapse Key</label>
                                            <input {...register('collapseKey')} className="w-full h-10 px-3 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all" />
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 pt-1">
                                        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" {...register('requireInteraction')} className="rounded accent-primary h-4 w-4" />Require Interaction</label>
                                        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" {...register('silent')} className="rounded accent-primary h-4 w-4" />Silencieux</label>
                                        <label className="flex items-center gap-2 text-xs font-medium"><input type="checkbox" {...register('renotify')} className="rounded accent-primary h-4 w-4" />Renotify</label>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-foreground">Données personnalisées (JSON)</label>
                                        <textarea {...register('dataJson')} rows={2} placeholder='{"url":"/promotions"}' className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm outline-none focus:border-primary transition-all resize-none font-mono" />
                                        {errors.dataJson && <p className="text-[10px] text-red-500">{errors.dataJson.message}</p>}
                                    </div>
                                </div>
                            </details>
                        </div>

                        {/* ── Colonne aperçu ─────────────────────────── */}
                        <div className="space-y-3">
                            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Aperçu en temps réel</p>
                            <NotificationPreview
                                title={watched.title || 'Titre de la notification'}
                                body={watched.body || 'Le corps du message apparaîtra ici...'}
                                icon={watched.icon}
                                image={watched.image}
                                time={previewTime}
                            />
                            <div className="rounded-2xl border border-border bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
                                Rendu indicatif : l&apos;apparence réelle varie selon le navigateur/l&apos;OS de l&apos;abonné (Chrome, Android, iOS...).
                            </div>

                            <button
                                type="submit"
                                disabled={mode === 'broadcast' && audience === 'manual' && recipientIds.length === 0}
                                className="w-full mt-4 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-secondary transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Icon icon="solar:plain-bold-duotone" className="w-4 h-4" />
                                Envoyer
                            </button>
                        </div>
                    </form>
                )}

                {step === 'confirm' && (
                    <div className="flex flex-col items-center text-center gap-4 py-6">
                        <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Icon icon="solar:danger-triangle-bold-duotone" className="w-7 h-7 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-bold text-foreground">Confirmer l&apos;envoi ?</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {mode === 'single'
                                    ? <>Cette notification sera envoyée à <b>{subscriber?.user.fullName || subscriber?.user.email}</b>.</>
                                    : audience === 'manual'
                                        ? <>Cette notification sera envoyée à <b>{recipientCount}</b> abonné(s) sélectionné(s).</>
                                        : <>Cette notification sera envoyée à <b>tous les abonnés actifs</b>.</>}
                            </p>
                        </div>
                        <div className="flex gap-3 w-full mt-2">
                            <button onClick={() => setStep('form')} className="flex-1 px-6 py-3 rounded-2xl border border-border text-sm font-bold hover:bg-muted transition-all">Retour</button>
                            <button onClick={handleSubmit(performSend)} className="flex-[2] px-6 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-secondary transition-all">Confirmer l&apos;envoi</button>
                        </div>
                    </div>
                )}

                {step === 'sending' && (
                    <div className="flex flex-col items-center text-center gap-5 py-8">
                        <Icon icon="solar:refresh-bold-duotone" className="w-10 h-10 text-primary animate-spin" />
                        <p className="font-bold text-foreground">Envoi en cours...</p>
                        <div className="w-full max-w-sm">
                            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progressPct}%` }} />
                            </div>
                            {progress.total > 1 && (
                                <div className="flex justify-between text-[11px] text-muted-foreground mt-2 font-medium">
                                    <span>{progress.processed}/{progress.total} traités</span>
                                    <span className="text-emerald-600">{progress.successCount} succès</span>
                                    <span className="text-red-500">{progress.failureCount} erreurs</span>
                                    {eta !== null && <span>~{eta}s restantes</span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 'result' && result && (
                    <div className="flex flex-col items-center text-center gap-4 py-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${result.failureCount === 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                            <Icon icon={result.failureCount === 0 ? 'solar:check-circle-bold-duotone' : 'solar:danger-triangle-bold-duotone'} className={`w-7 h-7 ${result.failureCount === 0 ? 'text-emerald-600' : 'text-amber-600'}`} />
                        </div>
                        <p className="font-bold text-foreground">Envoi terminé</p>
                        <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                            <div className="rounded-xl bg-muted/60 p-3">
                                <p className="text-lg font-black text-foreground">{result.total}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Total</p>
                            </div>
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
                                <p className="text-lg font-black text-emerald-600">{result.successCount}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Succès</p>
                            </div>
                            <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3">
                                <p className="text-lg font-black text-red-500">{result.failureCount}</p>
                                <p className="text-[10px] text-muted-foreground font-semibold uppercase">Échecs</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-full mt-2 px-6 py-3 rounded-2xl bg-primary text-white text-sm font-black hover:bg-secondary transition-all">Fermer</button>
                    </div>
                )}
            </div>
        </Modal>
    );
}

function NotificationPreview({ title, body, icon, image, time }: { title: string; body: string; icon?: string; image?: string; time: string }) {
    return (
        <div className="rounded-2xl border border-border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 p-3">
                <div className="relative shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-muted">
                    {icon ? <Image src={icon} alt="" fill className="object-cover" unoptimized /> : <div className="w-full h-full flex items-center justify-center"><Icon icon="solar:bell-bing-bold-duotone" className="w-4 h-4 text-muted-foreground" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-bold text-foreground truncate">{title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{time}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 mt-0.5">{body}</p>
                </div>
            </div>
            {image && (
                <div className="relative w-full h-32 bg-muted">
                    <Image src={image} alt="" fill className="object-cover" unoptimized />
                </div>
            )}
        </div>
    );
}

export default PushNotificationModal;
