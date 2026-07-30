'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import {
    getRestaurantTypes,
    adminCreateRestaurantType,
    adminUpdateRestaurantType,
    adminDeleteRestaurantType,
    adminToggleRestaurantTypeStatus,
} from '@/api/api';
import { RestaurantType } from '@/types/interface';
import { Modal } from '@/components/ui/MotionModal';
import CreateButton from '@/components/ui/CreateButton';
import ConfirmAction, { ConfirmVariant } from '@/components/ui/ConfirmAction';
import ImageUploadGrid from '@/components/ui/ImageUploadGrid';
import { Switch } from '@/components/ui/switch';
import { useNotification } from '@/components/notifications/NotificationProvider';

interface TypeFormState {
    name: string;
    order: string;
    status: boolean;
    iconFile: File | null;
    iconPreview: string | null;
}

const emptyForm = (): TypeFormState => ({ name: '', order: '0', status: true, iconFile: null, iconPreview: null });

export default function AdminRestaurantTypesPage() {
    const { addNotification } = useNotification();
    const [types, setTypes] = useState<RestaurantType[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editing, setEditing] = useState<RestaurantType | null>(null);
    const [form, setForm] = useState<TypeFormState>(emptyForm());
    const [saving, setSaving] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: '', message: '', confirmLabel: 'Confirmer', variant: 'info', icon: '',
    });
    const openConfirm = (action: () => void, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, action, ...cfg });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getRestaurantTypes(false);
            if (res.statusCode === 200 && res.data) setTypes(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchTypes(); }, [fetchTypes]);

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setIsModalOpen(true);
    };

    const openEdit = (type: RestaurantType) => {
        setEditing(type);
        setForm({ name: type.name, order: String(type.order ?? 0), status: type.status, iconFile: null, iconPreview: type.icon || null });
        setIsModalOpen(true);
    };

    const addIcon = (files: File[]) => {
        const file = files[0];
        if (!file) return;
        setForm(f => ({ ...f, iconFile: file }));
        const reader = new FileReader();
        reader.onload = ev => setForm(f => ({ ...f, iconPreview: ev.target?.result as string }));
        reader.readAsDataURL(file);
    };
    const removeIcon = () => setForm(f => ({ ...f, iconFile: null, iconPreview: null }));

    const handleSave = async () => {
        if (!form.name.trim()) {
            addNotification('Le nom du type est requis', 'error');
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('name', form.name.trim());
            fd.append('order', form.order || '0');
            fd.append('status', String(form.status));
            if (form.iconFile) fd.append('icon', form.iconFile);

            const res = editing ? await adminUpdateRestaurantType(editing.id, fd) : await adminCreateRestaurantType(fd);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editing ? 'Type mis à jour avec succès' : 'Type créé avec succès', 'success');
                setIsModalOpen(false);
                fetchTypes();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (type: RestaurantType, value: boolean) => {
        const res = await adminToggleRestaurantTypeStatus(type.id, value);
        if (res.statusCode === 200) {
            addNotification('Statut mis à jour', 'success');
            fetchTypes();
        } else {
            addNotification(res.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const confirmDelete = (type: RestaurantType) => {
        openConfirm(async () => {
            const res = await adminDeleteRestaurantType(type.id);
            if (res.statusCode === 200) {
                addNotification('Type supprimé avec succès', 'success');
                fetchTypes();
            } else {
                addNotification(res.message || 'Erreur lors de la suppression — des restaurants utilisent peut-être encore ce type', 'error');
            }
        }, {
            title: 'Supprimer ce type de cuisine',
            message: `Voulez-vous vraiment supprimer "${type.name}" ? Cette action est impossible si des restaurants l'utilisent encore.`,
            confirmLabel: 'Oui, supprimer',
            variant: 'danger',
            icon: 'solar:trash-bin-trash-bold-duotone',
        });
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-foreground flex items-center gap-3">
                        <Icon icon="solar:chef-hat-bold-duotone" className="w-7 h-7 text-primary" />
                        Types de cuisine
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Gérez les types de cuisine proposés aux restaurants (Ivoirien, Libanais, Asiatique...) — un restaurant peut en avoir plusieurs.
                    </p>
                </div>
                <div className="w-full sm:w-auto">
                    <CreateButton label="Ajouter un type" onClick={openCreate} />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}
                </div>
            ) : types.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <Icon icon="solar:chef-hat-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Aucun type de cuisine pour le moment</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs">Ajoutez des types (Ivoirien, Libanais...) pour permettre aux restaurants de se catégoriser.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {types.map(type => (
                        <div key={type.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                {type.icon ? <img src={type.icon} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:widget-5-bold-duotone" className="w-6 h-6 text-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{type.name}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">Ordre : {type.order}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <Switch checked={type.status} onCheckedChange={(v) => handleToggleStatus(type, v)} />
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openEdit(type)} className="p-1.5 rounded-lg hover:bg-muted transition" title="Modifier">
                                        <Icon icon="solar:pen-bold-duotone" className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => confirmDelete(type)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition" title="Supprimer">
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
                        {editing ? 'Modifier le type' : 'Nouveau type de cuisine'}
                    </h2>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nom du type</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium"
                            placeholder="ex: Libanais"
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

                    <ImageUploadGrid
                        title="Icône"
                        icon="solar:widget-5-bold-duotone"
                        max={1}
                        previews={form.iconPreview ? [form.iconPreview] : []}
                        onAdd={addIcon}
                        onRemove={removeIcon}
                    />

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
