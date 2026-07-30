'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import {
    getAccompagnements,
    adminCreateAccompagnement,
    adminUpdateAccompagnement,
    adminDeleteAccompagnement,
    adminToggleAccompagnementStatus,
} from '@/api/api';
import { Accompagnement } from '@/types/interface';
import { Modal } from '@/components/ui/MotionModal';
import CreateButton from '@/components/ui/CreateButton';
import ConfirmAction, { ConfirmVariant } from '@/components/ui/ConfirmAction';
import { Switch } from '@/components/ui/switch';
import { useNotification } from '@/components/notifications/NotificationProvider';

interface FormState {
    name: string;
    order: string;
    status: boolean;
}

const emptyForm = (): FormState => ({ name: '', order: '0', status: true });

/**
 * Onglet "Accompagnements" de l'admin (Types de cuisine → Accompagnements) — même pattern
 * liste + modal que AdminRestaurantTypesPage (page.tsx), sans le bloc icône (non demandé
 * pour les accompagnements).
 */
export default function AccompagnementsTab() {
    const { addNotification } = useNotification();
    const [items, setItems] = useState<Accompagnement[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<Accompagnement | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm());
    const [saving, setSaving] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: '', message: '', confirmLabel: 'Confirmer', variant: 'info', icon: '',
    });
    const openConfirm = (action: () => void, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, action, ...cfg });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAccompagnements(false);
            if (res.statusCode === 200 && res.data) setItems(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setIsModalOpen(true);
    };

    const openEdit = (item: Accompagnement) => {
        setEditing(item);
        setForm({ name: item.name, order: String(item.order ?? 0), status: item.status });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            addNotification("Le nom de l'accompagnement est requis", 'error');
            return;
        }
        setSaving(true);
        try {
            const data = { name: form.name.trim(), order: Number(form.order) || 0, status: form.status };
            const res = editing ? await adminUpdateAccompagnement(editing.id, data) : await adminCreateAccompagnement(data);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editing ? 'Accompagnement mis à jour avec succès' : 'Accompagnement créé avec succès', 'success');
                setIsModalOpen(false);
                fetchItems();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (item: Accompagnement, value: boolean) => {
        const res = await adminToggleAccompagnementStatus(item.id, value);
        if (res.statusCode === 200) {
            addNotification('Statut mis à jour', 'success');
            fetchItems();
        } else {
            addNotification(res.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const confirmDelete = (item: Accompagnement) => {
        openConfirm(async () => {
            const res = await adminDeleteAccompagnement(item.id);
            if (res.statusCode === 200) {
                addNotification('Accompagnement supprimé avec succès', 'success');
                fetchItems();
            } else {
                addNotification(res.message || 'Erreur lors de la suppression — des plats utilisent peut-être encore cet accompagnement', 'error');
            }
        }, {
            title: 'Supprimer cet accompagnement',
            message: `Voulez-vous vraiment supprimer "${item.name}" ? Cette action est impossible si des plats l'utilisent encore.`,
            confirmLabel: 'Oui, supprimer',
            variant: 'danger',
            icon: 'solar:trash-bin-trash-bold-duotone',
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-muted-foreground max-w-lg">
                    Gérez les accompagnements génériques (Attiéké, Frites, Alloco...) proposés aux restaurants. Le prix supplémentaire est défini par chaque restaurant, pour chaque plat — jamais ici.
                </p>
                <div className="w-full sm:w-auto">
                    <CreateButton label="Ajouter un accompagnement" onClick={openCreate} />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <Icon icon="solar:bowl-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Aucun accompagnement pour le moment</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs">Ajoutez des accompagnements (Attiéké, Frites, Alloco...) que les restaurants pourront proposer avec leurs plats.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                            <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:bowl-bold-duotone" className="w-5 h-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">Ordre : {item.order}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <Switch checked={item.status} onCheckedChange={(v) => handleToggleStatus(item, v)} />
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-muted transition" title="Modifier">
                                        <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => confirmDelete(item)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition" title="Supprimer">
                                        <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Icon icon={editing ? 'solar:pen-new-square-bold-duotone' : 'solar:add-square-bold-duotone'} className="text-primary w-6 h-6" />
                        {editing ? "Modifier l'accompagnement" : 'Nouvel accompagnement'}
                    </h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: Frites"
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ordre d&apos;affichage</label>
                        <input
                            type="number"
                            value={form.order}
                            onChange={e => setForm(f => ({ ...f, order: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                        />
                    </div>

                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                        <p className="text-sm font-bold text-foreground">Actif</p>
                        <Switch checked={form.status} onCheckedChange={(v) => setForm(f => ({ ...f, status: v }))} />
                    </div>

                    <button onClick={handleSave} disabled={saving} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {saving ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                        Enregistrer
                    </button>
                </div>
            </Modal>

            <ConfirmAction isOpen={confirmState.isOpen} onClose={closeConfirm} onConfirm={() => { confirmState.action?.(); closeConfirm(); }} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} icon={confirmState.icon} />
        </div>
    );
}
