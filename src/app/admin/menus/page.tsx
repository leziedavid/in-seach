'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import {
    DndContext, DragEndEvent, PointerSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Edit2, Trash2, GripVertical, Plus } from 'lucide-react';
import {
    getMenuTypes,
    getMenuGroups, createMenuGroup, updateMenuGroup, deleteMenuGroup, reorderMenuGroups,
    getAuthorizations, createAuthorization, updateAuthorization, deleteAuthorization, reorderAuthorizations,
    getMenusAdmin, createMenu, updateMenu, deleteMenu, reorderMenus,
    getPolicies,
} from '@/api/api';
import { Modal } from '@/components/ui/MotionModal';
import { Switch } from '@/components/ui/switch';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { MenuTypeNode, MenuGroupNode } from '@/types/interface';

// Ligne normalisée, quelle que soit la source (Authorization pour AKWABA/ADMIN,
// Menu pour HOME/... — voir le plan "Menus dynamiques (DB-driven)"). `raw`
// garde l'objet backend d'origine pour préremplir le formulaire d'édition.
type Row = {
    id: string;
    code: string;
    label: string;
    icon: string | null;
    route: string | null;
    order: number;
    groupId: string | null;
    isActive: boolean;
    permission: string | null;
    raw: any;
};

const NO_GROUP = '__none__';

function RowForm({ source, groups, policies, initial, onSubmit, onClose, isSubmitting }: {
    source: 'MENU' | 'AUTHORIZATION';
    groups: MenuGroupNode[];
    policies: { code: string; name: string }[];
    initial?: Partial<Row>;
    onSubmit: (data: any) => void;
    onClose: () => void;
    isSubmitting: boolean;
}) {
    const raw = initial?.raw ?? {};
    const [code, setCode] = useState(initial?.code ?? '');
    const [label, setLabel] = useState(initial?.label ?? '');
    const [icon, setIcon] = useState(initial?.icon ?? '');
    const [route, setRoute] = useState(initial?.route ?? '');
    const [backendRoute, setBackendRoute] = useState(raw?.backendRoute ?? '');
    const [groupId, setGroupId] = useState(initial?.groupId ?? '');
    const [permission, setPermission] = useState(initial?.permission ?? '');
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                const groupValue = groupId || null;
                if (source === 'AUTHORIZATION') {
                    onSubmit({ code, name: label, icon, frontendRoute: route, backendRoute, groupId: groupValue, isActive });
                } else {
                    onSubmit({ code, label, icon, route, groupId: groupValue, permissionCode: permission || null, isActive });
                }
            }}
            className="space-y-4 p-6 max-h-[85vh] overflow-y-auto"
        >
            <h3 className="text-lg font-black text-foreground">{initial?.id ? 'Modifier le menu' : 'Nouveau menu'}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Code</label>
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required placeholder="HOME_SEARCH"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Libellé</label>
                    <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Recherche"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Icône (Iconify)</label>
                    <div className="flex items-center gap-2">
                        {icon && <Icon icon={icon} width={20} className="text-primary shrink-0" />}
                        <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="solar:box-bold-duotone"
                            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Groupe</label>
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm">
                        <option value="">Sans groupe</option>
                        {groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Route frontend</label>
                    <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="/admin/products"
                        className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-mono text-xs" />
                </div>
                {source === 'AUTHORIZATION' ? (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Route backend</label>
                        <input value={backendRoute} onChange={(e) => setBackendRoute(e.target.value)} placeholder="/product-admin"
                            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-mono text-xs" />
                    </div>
                ) : (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Permission (optionnelle)</label>
                        <select value={permission} onChange={(e) => setPermission(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm">
                            <option value="">Public (aucune)</option>
                            {policies.map((p) => <option key={p.code} value={p.code}>{p.name} ({p.code})</option>)}
                        </select>
                    </div>
                )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-[10px] font-black text-muted-foreground uppercase">Actif (visible dans le menu)</span>
            </label>

            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-11 rounded-xl bg-primary text-white text-xs font-black hover:bg-secondary transition-all uppercase">
                    {isSubmitting ? '...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}

function GroupForm({ initial, onSubmit, onClose, isSubmitting }: {
    initial?: Partial<MenuGroupNode>;
    onSubmit: (data: any) => void;
    onClose: () => void;
    isSubmitting: boolean;
}) {
    const [code, setCode] = useState(initial?.code ?? '');
    const [label, setLabel] = useState(initial?.label ?? '');
    const [isActive, setIsActive] = useState(initial?.isActive ?? true);

    return (
        <form
            onSubmit={(e) => { e.preventDefault(); onSubmit({ code, label, isActive }); }}
            className="space-y-4 p-6"
        >
            <h3 className="text-lg font-black text-foreground">{initial?.id ? 'Modifier le groupe' : 'Nouveau groupe'}</h3>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Code</label>
                <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required placeholder="VENTE"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Libellé</label>
                <input value={label} onChange={(e) => setLabel(e.target.value)} required placeholder="Vente"
                    className="w-full h-11 px-4 rounded-xl border border-border bg-muted/30 outline-none focus:border-primary transition-all font-bold text-sm" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
                <span className="text-[10px] font-black text-muted-foreground uppercase">Actif</span>
            </label>
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 h-11 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-all uppercase">
                    Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] h-11 rounded-xl bg-primary text-white text-xs font-black hover:bg-secondary transition-all uppercase">
                    {isSubmitting ? '...' : 'Enregistrer'}
                </button>
            </div>
        </form>
    );
}

function SortableRow({ row, onEdit, onDelete, onToggleActive }: { row: Row; onEdit: () => void; onDelete: () => void; onToggleActive: (value: boolean) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-zinc-900 border-b border-border/40 last:border-b-0">
            <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0 touch-none select-none">
                <GripVertical size={16} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon icon={row.icon || 'solar:widget-5-bold-duotone'} width={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{row.label}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{row.code}{row.permission ? ` · ${row.permission}` : ''}</p>
            </div>
            <Switch checked={row.isActive} onCheckedChange={onToggleActive} className="shrink-0" />
            <button type="button" onClick={onEdit} className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0"><Edit2 size={14} /></button>
            <button type="button" onClick={onDelete} className="p-2 rounded-lg hover:bg-muted text-rose-600 shrink-0"><Trash2 size={14} /></button>
        </div>
    );
}

function ItemList({ items, onReorder, onEdit, onDelete, onToggleActive }: {
    items: Row[];
    onReorder: (orderedIds: string[]) => void;
    onEdit: (row: Row) => void;
    onDelete: (row: Row) => void;
    onToggleActive: (row: Row, value: boolean) => void;
}) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        onReorder(arrayMove(items, oldIndex, newIndex).map((i) => i.id));
    };

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="rounded-xl border border-border/40 overflow-hidden">
                    {items.map((row) => (
                        <SortableRow key={row.id} row={row} onEdit={() => onEdit(row)} onDelete={() => onDelete(row)} onToggleActive={(value) => onToggleActive(row, value)} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableGroupBlock({ group, items, onReorderItems, onEditItem, onDeleteItem, onToggleItemActive, onEditGroup, onDeleteGroup }: {
    group: MenuGroupNode | { id: string; label: string; isActive: boolean };
    items: Row[];
    onReorderItems: (orderedIds: string[]) => void;
    onEditItem: (row: Row) => void;
    onDeleteItem: (row: Row) => void;
    onToggleItemActive: (row: Row, value: boolean) => void;
    onEditGroup?: () => void;
    onDeleteGroup?: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };

    return (
        <div ref={setNodeRef} style={style} className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/60">
                <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-muted-foreground shrink-0 touch-none select-none">
                    <GripVertical size={16} />
                </button>
                <span className="flex-1 text-xs font-black uppercase tracking-wide text-foreground">{group.label}</span>
                <span className="text-[10px] text-muted-foreground font-bold">{items.length}</span>
                {onEditGroup && <button type="button" onClick={onEditGroup} className="p-1.5 rounded-lg hover:bg-background text-muted-foreground"><Edit2 size={13} /></button>}
                {onDeleteGroup && <button type="button" onClick={onDeleteGroup} className="p-1.5 rounded-lg hover:bg-background text-rose-600"><Trash2 size={13} /></button>}
            </div>
            <div className="p-2">
                {items.length > 0 ? (
                    <ItemList items={items} onReorder={onReorderItems} onEdit={onEditItem} onDelete={onDeleteItem} onToggleActive={onToggleItemActive} />
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">Aucun menu dans ce groupe</p>
                )}
            </div>
        </div>
    );
}

export default function AdminMenusPage() {
    const { addNotification } = useNotification();

    const [types, setTypes] = useState<MenuTypeNode[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [groups, setGroups] = useState<MenuGroupNode[]>([]);
    const [items, setItems] = useState<Row[]>([]);
    const [policies, setPolicies] = useState<{ code: string; name: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRowFormOpen, setIsRowFormOpen] = useState(false);
    const [editingRow, setEditingRow] = useState<Row | null>(null);
    const [isGroupFormOpen, setIsGroupFormOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<MenuGroupNode | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedType = useMemo(() => types.find((t) => t.id === selectedTypeId) ?? null, [types, selectedTypeId]);
    const usesGroups = selectedType?.source === 'AUTHORIZATION' && groups.length > 0;

    useEffect(() => {
        (async () => {
            const [typesRes, policiesRes] = await Promise.all([getMenuTypes(), getPolicies({ limit: 500 })]);
            if (typesRes.statusCode === 200 && typesRes.data?.length) {
                setTypes(typesRes.data);
                setSelectedTypeId(typesRes.data[0].id);
            }
            if (policiesRes.statusCode === 200) {
                setPolicies((policiesRes.data?.data ?? []).map((p: any) => ({ code: p.code, name: p.name })));
            }
        })();
    }, []);

    const loadData = useCallback(async (type: MenuTypeNode) => {
        setLoading(true);
        try {
            const groupsRes = await getMenuGroups(type.id);
            setGroups(groupsRes.statusCode === 200 ? (groupsRes.data ?? []) : []);

            if (type.source === 'AUTHORIZATION') {
                const res = await getAuthorizations({ limit: 500 });
                const all = res.statusCode === 200 ? (res.data?.data ?? []) : [];
                setItems(
                    all
                        .filter((a: any) => a.typeMenuId === type.id)
                        .map((a: any): Row => ({
                            id: a.id, code: a.code, label: a.name, icon: a.icon, route: a.frontendRoute,
                            order: a.order, groupId: a.groupId ?? null, isActive: a.isActive, permission: null, raw: a,
                        })),
                );
            } else {
                const res = await getMenusAdmin(type.id);
                const all = res.statusCode === 200 ? (res.data ?? []) : [];
                setItems(
                    all.map((m: any): Row => ({
                        id: m.id, code: m.code, label: m.label, icon: m.icon, route: m.route,
                        order: m.order, groupId: m.groupId, isActive: m.isActive, permission: m.permissionCode, raw: m,
                    })),
                );
            }
        } catch {
            addNotification('Erreur lors du chargement des menus', 'error');
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    useEffect(() => { if (selectedType) loadData(selectedType); }, [selectedType, loadData]);

    const sortedItems = useMemo(() => [...items].sort((a, b) => a.order - b.order), [items]);
    const groupedItems = useMemo(() => {
        const byGroup = new Map<string, Row[]>();
        for (const item of sortedItems) {
            const key = item.groupId ?? NO_GROUP;
            if (!byGroup.has(key)) byGroup.set(key, []);
            byGroup.get(key)!.push(item);
        }
        return byGroup;
    }, [sortedItems]);

    const sortedGroups = useMemo(() => [...groups].sort((a, b) => a.order - b.order), [groups]);

    const persistReorder = async (reordered: { id: string; order: number; groupId?: string | null }[]) => {
        if (!selectedType) return;
        const fn = selectedType.source === 'AUTHORIZATION' ? reorderAuthorizations : reorderMenus;
        const res = await fn(reordered);
        if (res.statusCode !== 200) addNotification(res.message || 'Erreur lors du réordonnancement', 'error');
    };

    // ── Réordonnancement des menus enfants (dans un groupe, ou liste plate pour HOME) ──
    const handleReorderItemsInGroup = (groupKey: string, orderedIds: string[]) => {
        setItems((prev) => {
            const idToOrder = new Map(orderedIds.map((id, idx) => [id, idx * 10]));
            return prev.map((it) => (idToOrder.has(it.id) ? { ...it, order: idToOrder.get(it.id)! } : it));
        });
        persistReorder(orderedIds.map((id, idx) => ({ id, order: idx * 10 })));
    };

    // ── Réordonnancement des groupes ──
    const handleReorderGroups = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sortedGroups.findIndex((g) => g.id === active.id);
        const newIndex = sortedGroups.findIndex((g) => g.id === over.id);
        const reordered = arrayMove(sortedGroups, oldIndex, newIndex);
        setGroups(reordered.map((g, idx) => ({ ...g, order: idx * 10 })));
        reorderMenuGroups(reordered.map((g, idx) => ({ id: g.id, order: idx * 10 }))).then((res) => {
            if (res.statusCode !== 200) addNotification(res.message || 'Erreur lors du réordonnancement des groupes', 'error');
        });
    };
    const groupSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleSubmitRow = async (data: any) => {
        if (!selectedType) return;
        setIsSubmitting(true);
        try {
            const createFn = selectedType.source === 'AUTHORIZATION' ? createAuthorization : createMenu;
            const updateFn = selectedType.source === 'AUTHORIZATION' ? updateAuthorization : updateMenu;
            const payload = { ...data, typeMenuId: selectedType.id };
            const res = editingRow ? await updateFn(editingRow.id, payload) : await createFn(payload);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingRow ? 'Menu mis à jour' : 'Menu créé', 'success');
                setIsRowFormOpen(false);
                setEditingRow(null);
                loadData(selectedType);
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification("Erreur lors de l'enregistrement", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRow = async (row: Row) => {
        if (!selectedType) return;
        if (!confirm(`Supprimer le menu "${row.label}" ?`)) return;
        const fn = selectedType.source === 'AUTHORIZATION' ? deleteAuthorization : deleteMenu;
        const res = await fn(row.id);
        if (res.statusCode === 200) {
            addNotification('Menu supprimé', 'success');
            loadData(selectedType);
        } else {
            addNotification(res.message || 'Erreur', 'error');
        }
    };

    // Activation/désactivation rapide (Switch) — optimiste, sans passer par le
    // formulaire de modification (qui reste disponible pour les autres champs).
    const handleToggleActive = async (row: Row, value: boolean) => {
        if (!selectedType) return;
        setItems((prev) => prev.map((it) => (it.id === row.id ? { ...it, isActive: value } : it)));
        const updateFn = selectedType.source === 'AUTHORIZATION' ? updateAuthorization : updateMenu;
        const res = await updateFn(row.id, { isActive: value });
        if (res.statusCode === 200) {
            addNotification(value ? 'Menu activé' : 'Menu désactivé', 'success');
        } else {
            setItems((prev) => prev.map((it) => (it.id === row.id ? { ...it, isActive: !value } : it)));
            addNotification(res.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const handleSubmitGroup = async (data: any) => {
        if (!selectedType) return;
        setIsSubmitting(true);
        try {
            const payload = { ...data, typeMenuId: selectedType.id };
            const res = editingGroup ? await updateMenuGroup(editingGroup.id, payload) : await createMenuGroup(payload);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingGroup ? 'Groupe mis à jour' : 'Groupe créé', 'success');
                setIsGroupFormOpen(false);
                setEditingGroup(null);
                loadData(selectedType);
            } else {
                addNotification(res.message || 'Erreur', 'error');
            }
        } catch {
            addNotification("Erreur lors de l'enregistrement du groupe", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGroup = async (group: MenuGroupNode) => {
        if (!selectedType) return;
        if (!confirm(`Supprimer le groupe "${group.label}" ? Ses menus deviendront "sans groupe".`)) return;
        const res = await deleteMenuGroup(group.id);
        if (res.statusCode === 200) {
            addNotification('Groupe supprimé', 'success');
            loadData(selectedType);
        } else {
            addNotification(res.message || 'Erreur', 'error');
        }
    };

    const noGroupItems = groupedItems.get(NO_GROUP) ?? [];

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des menus</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Menus dynamiques HOME / AKWABA / ADMIN — labels, ordre, activation, groupes</p>
                </div>
                <div className="flex items-center gap-2">
                    {usesGroups && (
                        <button onClick={() => { setEditingGroup(null); setIsGroupFormOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-bold hover:bg-muted transition-all whitespace-nowrap">
                            <Plus size={16} /> Groupe
                        </button>
                    )}
                    <button onClick={() => { setEditingRow(null); setIsRowFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-secondary transition-all whitespace-nowrap">
                        <Icon icon="solar:add-circle-bold-duotone" width={18} /> Nouveau menu
                    </button>
                </div>
            </div>

            {/* Tabs par TypeMenu */}
            <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-hide">
                {types.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTypeId(t.id)}
                        className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${selectedTypeId === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Icon icon="svg-spinners:ring-resize" width={28} className="text-primary" />
                    </div>
                ) : usesGroups ? (
                    <DndContext sensors={groupSensors} collisionDetection={closestCenter} onDragEnd={handleReorderGroups}>
                        <SortableContext items={sortedGroups.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {sortedGroups.map((group) => (
                                    <SortableGroupBlock
                                        key={group.id}
                                        group={group}
                                        items={groupedItems.get(group.id) ?? []}
                                        onReorderItems={(ids) => handleReorderItemsInGroup(group.id, ids)}
                                        onEditItem={(row) => { setEditingRow(row); setIsRowFormOpen(true); }}
                                        onDeleteItem={handleDeleteRow}
                                        onToggleItemActive={handleToggleActive}
                                        onEditGroup={() => { setEditingGroup(group); setIsGroupFormOpen(true); }}
                                        onDeleteGroup={() => handleDeleteGroup(group)}
                                    />
                                ))}
                                {noGroupItems.length > 0 && (
                                    <SortableGroupBlock
                                        group={{ id: NO_GROUP, label: 'Sans groupe', isActive: true }}
                                        items={noGroupItems}
                                        onReorderItems={(ids) => handleReorderItemsInGroup(NO_GROUP, ids)}
                                        onEditItem={(row) => { setEditingRow(row); setIsRowFormOpen(true); }}
                                        onDeleteItem={handleDeleteRow}
                                        onToggleItemActive={handleToggleActive}
                                    />
                                )}
                            </div>
                        </SortableContext>
                    </DndContext>
                ) : sortedItems.length > 0 ? (
                    <ItemList
                        items={sortedItems}
                        onReorder={(ids) => handleReorderItemsInGroup(NO_GROUP, ids)}
                        onEdit={(row) => { setEditingRow(row); setIsRowFormOpen(true); }}
                        onDelete={handleDeleteRow}
                        onToggleActive={handleToggleActive}
                    />
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">Aucun menu pour ce type.</p>
                )}
            </div>

            <Modal isOpen={isRowFormOpen} onClose={() => { setIsRowFormOpen(false); setEditingRow(null); }}>
                {selectedType && (
                    <RowForm
                        source={selectedType.source}
                        groups={sortedGroups}
                        policies={policies}
                        initial={editingRow ?? undefined}
                        onSubmit={handleSubmitRow}
                        onClose={() => { setIsRowFormOpen(false); setEditingRow(null); }}
                        isSubmitting={isSubmitting}
                    />
                )}
            </Modal>

            <Modal isOpen={isGroupFormOpen} onClose={() => { setIsGroupFormOpen(false); setEditingGroup(null); }}>
                <GroupForm
                    initial={editingGroup ?? undefined}
                    onSubmit={handleSubmitGroup}
                    onClose={() => { setIsGroupFormOpen(false); setEditingGroup(null); }}
                    isSubmitting={isSubmitting}
                />
            </Modal>
        </div>
    );
}
