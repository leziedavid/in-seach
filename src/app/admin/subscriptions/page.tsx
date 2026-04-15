'use client';

import React, { useState, useEffect } from 'react';
import {
    getSubscriptionPlansAdmin,
    createSubscriptionPlanAdmin,
    updateSubscriptionPlanAdmin,
    deleteSubscriptionPlanAdmin,
    isSubscriptionSystemEnabled,
    setSystemSubscriptionStatus,
    adminGetPlanEntities,
    adminCreatePlanEntity,
    adminUpdatePlanEntity,
    adminDeletePlanEntity,
    adminGetAllSubscriptions,
    adminAssignPlan,
    adminValidatePayment
} from '@/api/api';
import {
    CreditCard, Plus, Trash2, Edit3, CheckCircle2,
    ShieldCheck, Users, Settings2, Layout, Database,
    Search, Calendar, Mail, Phone, ExternalLink, MoreVertical, Edit2
} from 'lucide-react';
import { useNotification } from '@/components/toast/NotificationProvider';
import { Switch } from '@/components/ui/switch';
import {
    SubscriptionPlan,
    AdminSubscriptionPlanDto,
    PlanEntity,
    AdminUserSubscription
} from '@/types/interface';
import { Modal } from '@/components/modal/MotionModal';
import FormsSubscriptionPlan from '@/components/Forms/FormsSubscriptionPlan';
import { Icon } from '@iconify/react';
import { GenericTable } from '@/components/table/table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type TabType = 'overview' | 'plans' | 'entities' | 'users';

export default function AdminSubscriptionsPage() {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [entities, setEntities] = useState<PlanEntity[]>([]);
    const [userSubscriptions, setUserSubscriptions] = useState<AdminUserSubscription[]>([]);
    const [isSystemEnabled, setIsSystemEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subPage, setSubPage] = useState(1);
    const [subTotal, setSubTotal] = useState(0);
    const { addNotification } = useNotification();

    // Modal states
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Entity Form state
    const [entityForm, setEntityForm] = useState({ id: '', entityName: '' });

    // Assign Form state
    const [assignForm, setAssignForm] = useState({ userId: '', planId: '' });

    const fetchSubscriptions = async (p: number) => {
        try {
            const res = await adminGetAllSubscriptions({ page: p, limit: 10 });
            if (res.statusCode === 200 && res.data) {
                setUserSubscriptions(res.data.data);
                setSubTotal(res.data.total || 0);
            }
        } catch (error) {
            addNotification("Erreur lors du chargement des souscriptions", "error");
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, systemRes, entitiesRes] = await Promise.all([
                getSubscriptionPlansAdmin({}),
                isSubscriptionSystemEnabled(),
                adminGetPlanEntities(),
            ]);

            if (plansRes.statusCode === 200 && plansRes.data) setPlans(plansRes.data.data);
            if (systemRes.statusCode === 200) setIsSystemEnabled(!!systemRes.data);
            if (entitiesRes.statusCode === 200 && entitiesRes.data) setEntities(entitiesRes.data);

            await fetchSubscriptions(subPage);
        } catch (error) {
            addNotification("Erreur lors du chargement des données", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) fetchSubscriptions(subPage);
    }, [subPage]);

    // --- System Handlers ---
    const handleToggleSystem = async () => {
        try {
            const res = await setSystemSubscriptionStatus(!isSystemEnabled);
            if (res.statusCode === 200) {
                setIsSystemEnabled(!isSystemEnabled);
                addNotification(`Système d'abonnement ${!isSystemEnabled ? 'activé' : 'désactivé'}`, "success");
            }
        } catch (error) {
            addNotification("Erreur lors de la modification du système", "error");
        }
    };

    // --- Plan Handlers ---
    const handleCreatePlan = () => {
        setSelectedPlan(null);
        setIsEditing(false);
        setIsPlanModalOpen(true);
    };

    const handleEditPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setIsEditing(true);
        setIsPlanModalOpen(true);
    };

    const handlePlanSubmit = async (data: AdminSubscriptionPlanDto) => {
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing && selectedPlan) {
                res = await updateSubscriptionPlanAdmin(selectedPlan.id, data);
            } else {
                res = await createSubscriptionPlanAdmin(data);
            }

            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(isEditing ? "Plan mis à jour" : "Plan créé", "success");
                setIsPlanModalOpen(false);
                fetchData();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement du plan", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTogglePlanActive = async (plan: SubscriptionPlan) => {
        try {
            const res = await updateSubscriptionPlanAdmin(plan.id, { isActive: !plan.isActive });
            if (res.statusCode === 200) {
                addNotification(`Plan ${!plan.isActive ? 'activé' : 'désactivé'}`, "success");
                fetchData();
            }
        } catch (error) {
            addNotification("Erreur lors de la modification du statut", "error");
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Supprimer ce plan ?")) return;
        try {
            const res = await deleteSubscriptionPlanAdmin(id);
            if (res.statusCode === 200) {
                addNotification("Plan supprimé", "success");
                fetchData();
            }
        } catch (error) {
            addNotification("Erreur lors de la suppression", "error");
        }
    };

    // --- Entity Handlers ---
    const handleCreateEntity = () => {
        setEntityForm({ id: '', entityName: '' });
        setIsEditing(false);
        setIsEntityModalOpen(true);
    };

    const handleEditEntity = (entity: PlanEntity) => {
        setEntityForm({ id: entity.id, entityName: entity.entityName });
        setIsEditing(true);
        setIsEntityModalOpen(true);
    };

    const handleEntitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let res;
            if (isEditing) {
                res = await adminUpdatePlanEntity(entityForm.id, { entityName: entityForm.entityName });
            } else {
                res = await adminCreatePlanEntity({ entityName: entityForm.entityName });
            }

            if (res.statusCode === 201 || res.statusCode === 200) {
                addNotification(isEditing ? "Entité mise à jour" : "Entité créée", "success");
                setIsEntityModalOpen(false);
                fetchData();
            }
        } catch (error) {
            addNotification("Erreur lors de l'enregistrement de l'entité", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEntity = async (id: string) => {
        if (!confirm("Supprimer cette entité ? Cela pourrait impacter les plans existants.")) return;
        try {
            const res = await adminDeletePlanEntity(id);
            if (res.statusCode === 200) {
                addNotification("Entité supprimée", "success");
                fetchData();
            }
        } catch (error) {
            addNotification("Impossible de supprimer l'entité car elle est liée à des plans", "error");
        }
    };

    // --- User Subscription Handlers ---
    const handleValidatePayment = async (id: string, success: boolean) => {
        setIsSubmitting(true);
        try {
            const res = await adminValidatePayment(id, success);
            if (res.statusCode === 200) {
                addNotification(success ? "Paiement validé" : "Paiement rejeté", "success");
                fetchSubscriptions(subPage);
            }
        } catch (error) {
            addNotification("Erreur lors de la validation", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignPlan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignForm.userId || !assignForm.planId) return;
        setIsSubmitting(true);
        try {
            const res = await adminAssignPlan({ ...assignForm, paymentMethod: 'ADMIN' });
            if (res.statusCode === 201 || res.statusCode === 200) {
                addNotification("Plan assigné avec succès", "success");
                setIsAssignModalOpen(false);
                fetchData();
            }
        } catch (error) {
            addNotification("Erreur lors de l'assignation", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const subColumns: ColumnDef<AdminUserSubscription>[] = [
        {
            accessorKey: 'user.fullName',
            header: 'Utilisateur',
            cell: ({ row }) => (
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black text-[10px] border border-primary/20">
                        {row.original.user?.fullName?.[0] || <Users className="w-4 h-4" />}
                    </div>
                    <div>
                        <div className="font-black text-sm">{row.original.user?.fullName || 'Inconnu'}</div>
                        <div className="text-muted-foreground text-[10px] font-mono">{row.original.userId.substring(0, 8)}...</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'plan.name',
            header: 'Plan',
            cell: ({ row }) => (
                <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20 bg-indigo-500/5 text-indigo-500">
                    {row.original.plan?.name}
                </Badge>
            )
        },
        {
            accessorKey: 'startDate',
            header: 'Période',
            cell: ({ row }) => (
                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-primary" />
                        <span>Du {new Date(row.original.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-rose-400" />
                        <span>Au {new Date(row.original.endDate).toLocaleDateString()}</span>
                    </div>
                </div>
            )
        },
        {
            accessorKey: 'paymentMethod',
            header: 'Paiement',
            cell: ({ row }) => {
                const method = row.original.paymentMethod;
                const icon = method === 'CARD' ? 'solar:card-bold-duotone' : method === 'MOBILE_MONEY' ? 'solar:phone-bold-duotone' : 'solar:bank-bold-duotone';
                return (
                    <div className="flex items-center gap-2">
                        <Icon icon={icon} className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] font-bold uppercase tracking-tight">{method}</span>
                    </div>
                );
            }
        },
        {
            accessorKey: 'paymentStatus',
            header: 'État Paiement',
            cell: ({ row }) => (
                <div className="flex flex-col gap-2">
                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${row.original.paymentStatus === 'SUCCESS'
                        ? 'text-primary border-primary/20 bg-primary/5'
                        : row.original.paymentStatus === 'PENDING'
                            ? 'text-amber-600 border-amber-200 bg-amber-50'
                            : 'text-rose-600 border-rose-200 bg-rose-50'
                        }`}>
                        {row.original.paymentStatus}
                    </Badge>
                    {row.original.paymentProof && (
                        <a href={row.original.paymentProof} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[8px] font-black uppercase text-primary hover:underline">
                            <Icon icon="solar:eye-bold-duotone" width={10} /> Voir Preuve
                        </a>
                    )}
                </div>
            )
        },
        {
            accessorKey: 'status',
            header: 'Abonnement',
            cell: ({ row }) => (
                <div className="flex flex-col gap-3">
                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ${row.original.status === 'ACTIVE'
                        ? 'text-indigo-600 border-indigo-200 bg-indigo-50'
                        : 'text-slate-400 border-slate-200 bg-slate-50'
                        }`}>
                        {row.original.status === 'ACTIVE' ? 'Actif' : 'Expiré'}
                    </Badge>
                    
                    {row.original.paymentStatus === 'PENDING' && (
                        <div className="flex gap-1.5">
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 px-2 text-[8px] font-black bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                onClick={() => handleValidatePayment(row.original.id, true)}
                                disabled={isSubmitting}
                            >
                                <Icon icon="solar:check-circle-bold-duotone" className="mr-1" /> VALIDER
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-7 px-2 text-[8px] font-black bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                onClick={() => handleValidatePayment(row.original.id, false)}
                                disabled={isSubmitting}
                            >
                                <Icon icon="solar:close-circle-bold-duotone" className="mr-1" /> REJETER
                            </Button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <>
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1">Abonnements</h1>
                    <p className="text-muted-foreground font-medium text-sm">Gestion des revenus, plans tarifaires et limitations système.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('plans')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'plans' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('entities')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'entities' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Entités
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-card shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Souscriptions
                    </button>
                </div>
            </header>

            {loading && !plans.length && (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
                </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="space-y-8 animate-in cubic-bezier duration-500">
                    <Card className="rounded-lg border-border/50 shadow-xs overflow-hidden bg-gradient-to-br from-card to-muted/20">
                        <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className={`p-4 rounded-2xl border transition-all ${isSystemEnabled ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-muted border-border text-muted-foreground'}`}>
                                    <Settings2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black mb-1">Système de Restriction</CardTitle>
                                    <CardDescription className="max-w-md font-medium">Une fois activé, les quotas définis dans les plans s'appliquent automatiquement.</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={isSystemEnabled ? "default" : "secondary"} className="font-black uppercase tracking-widest text-[10px]">
                                    {isSystemEnabled ? 'Activé' : 'Désactivé'}
                                </Badge>
                                <Switch checked={isSystemEnabled} onCheckedChange={handleToggleSystem} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Plans Actifs', val: plans.filter(p => p.isActive).length, icon: CreditCard, color: 'text-primary' },
                            { label: 'Entités', val: entities.length, icon: Database, color: 'text-amber-500' },
                            { label: 'Abonnés', val: userSubscriptions.length, icon: Users, color: 'text-primary' },
                            { label: 'Chiffre d\'Affaires', val: '0 CFA', icon: ShieldCheck, color: 'text-rose-500' },
                        ].map((stat, i) => (
                            <Card key={i} className="rounded-3xl border-border/50 shadow-xs">
                                <CardContent className="p-6">
                                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-4`}>
                                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                    </div>
                                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
                                    <p className="text-2xl font-black tracking-tight">{stat.val}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: PLANS */}
            {activeTab === 'plans' && (
                <div className="space-y-8 animate-in cubic-bezier duration-500">
                    <div className="flex justify-end">
                        <Button onClick={handleCreatePlan} className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> Nouveau Plan
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                                    <div key={plan.id} className={`rounded-xl border border-border/50 shadow-sm overflow-hidden group transition-all flex flex-col ${!plan.isActive ? 'bg-muted/30 grayscale-[0.5] opacity-80' : 'bg-card hover:border-primary/50 hover:shadow-md'}`}>
                                        <CardHeader className="p-6 pb-4">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant={plan.isActive ? "default" : "secondary"} className="font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                                                        {plan.isActive ? 'Actif' : 'Inactif'}
                                                    </Badge>
                                                    <Switch 
                                                        checked={plan.isActive} 
                                                        onCheckedChange={() => handleTogglePlanActive(plan)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditPlan(plan)} className="h-8 w-8 rounded-lg"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)} className="h-8 w-8 rounded-lg hover:text-rose-500"><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black">{plan.name}</CardTitle>
                                    <div className="flex items-baseline gap-1 pt-2">
                                        <span className="text-3xl font-black text-primary">{plan.price} CFA</span>
                                        <span className="text-muted-foreground font-bold text-xs">/{plan.durationDays}j</span>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-8 pt-4 flex-1">
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <ShieldCheck className="w-4 h-4 text-primary" />
                                            <span>Limite: {plan.serviceLimit === 999999 ? 'ILLIMITÉ' : `${plan.serviceLimit} unités`}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {plan.entities?.map((ent) => (
                                                <Badge key={ent.id} variant="outline" className="text-[8px] font-black uppercase tracking-wider py-0 rounded-md bg-muted/50 border-border/50">
                                                    {ent.entityName}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>

                                <div className="px-8 py-5 border-t border-border/30 bg-muted/20 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground font-bold text-[10px] uppercase tracking-widest">
                                        <Users className="w-3.5 h-3.5" />
                                        {plan._count?.subscriptions || 0} Abonnés
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: ENTITIES */}
            {activeTab === 'entities' && (
                <div className="space-y-8 animate-in cubic-bezier duration-500">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-xl font-black">Modèles Restreints</h2>
                            <p className="text-muted-foreground text-sm font-medium">Configurez les tables Prisma soumises aux quotas.</p>
                        </div>
                        <Button onClick={handleCreateEntity} variant="outline" className="rounded-xl font-bold gap-2">
                            <Plus className="w-4 h-4" /> Nouvelle Entité
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {entities.map((entity) => (
                            <Card key={entity.id} className="rounded-3xl border-border/50 shadow-xs group hover:border-primary/30 transition-all">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border/50">
                                            <Database className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditEntity(entity)} className="h-7 w-7 rounded-lg"><Edit3 className="w-3 h-3" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteEntity(entity.id)} className="h-7 w-7 rounded-lg hover:text-rose-500"><Trash2 className="w-3 h-3" /></Button>
                                        </div>
                                    </div>
                                    <h3 className="font-black text-base">{entity.entityName}</h3>
                                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-1">{entity._count?.plans || 0} Plans Liés</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: USERS */}
            {activeTab === 'users' && (
                <div className="space-y-8 animate-in cubic-bezier duration-500">
                    <div className="flex justify-between items-end">
                        <div>
                            <h2 className="text-xl font-black">Clients & Souscriptions</h2>
                            <p className="text-muted-foreground text-sm font-medium">Historique et statut des abonnements utilisateurs.</p>
                        </div>
                        <Button onClick={() => setIsAssignModalOpen(true)} className="rounded-xl font-bold gap-2 bg-primary hover:bg-primary/90">
                            <ShieldCheck className="w-4 h-4" /> Attribution Manuelle
                        </Button>
                    </div>

                    <div className="bg-card rounded-lg border border-border/50 shadow-xs overflow-hidden p-2">
                        <GenericTable
                            columns={subColumns}
                            data={userSubscriptions}
                            loading={loading}
                            totalItems={subTotal}
                            currentPage={subPage}
                            itemsPerPage={10}
                            onPageChange={setSubPage}
                            searchKey="user_fullName"
                            emptyMessage="Aucune souscription active."
                        />
                    </div>
                </div>
            )}

            {/* MODALS */}
            <Modal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)}>
                <div className="p-4">
                    <h2 className="text-xl font-black px-2 pt-2 mb-1">{isEditing ? 'Éditer le Plan' : 'Nouveau Plan'}</h2>
                    <p className="text-muted-foreground px-2 mb-6 text-sm font-medium tracking-tight">Configuration des quotas de service.</p>
                    <FormsSubscriptionPlan
                        initialData={selectedPlan || undefined}
                        onSubmit={handlePlanSubmit}
                        isSubmitting={isSubmitting}
                        isEditing={isEditing}
                        onClose={() => setIsPlanModalOpen(false)}
                    />
                </div>
            </Modal>

            <Modal isOpen={isEntityModalOpen} onClose={() => setIsEntityModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">{isEditing ? 'Éditer l\'Entité' : 'Nouvelle Entité'}</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Nom technique du modèle (ex: Service, Annonce).</p>
                    <form onSubmit={handleEntitySubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Identifiant du modèle</label>
                            <input
                                value={entityForm.entityName}
                                onChange={(e) => setEntityForm({ ...entityForm, entityName: e.target.value })}
                                placeholder="ex: Service"
                                className="w-full bg-muted border-border/50 border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" type="button" onClick={() => setIsEntityModalOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="font-bold rounded-xl px-8">
                                {isSubmitting ? '...' : (isEditing ? 'Sauvegarder' : 'Créer')}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)}>
                <div className="p-6">
                    <h2 className="text-xl font-black mb-1">Assignation Manuelle</h2>
                    <p className="text-muted-foreground mb-6 text-sm font-medium tracking-tight">Forcer l'abonnement d'un utilisateur à un plan spécifique.</p>
                    <form onSubmit={handleAssignPlan} className="space-y-5">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block ml-1">UUID Utilisateur</label>
                                <input
                                    value={assignForm.userId}
                                    onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
                                    placeholder="ex: 550e8400-e29b..."
                                    className="w-full bg-muted border-border/50 border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 block ml-1">Sélection du Plan</label>
                                <select
                                    value={assignForm.planId}
                                    onChange={(e) => setAssignForm({ ...assignForm, planId: e.target.value })}
                                    className="w-full bg-muted border-border/50 border rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none transition-all appearance-none"
                                    required
                                >
                                    <option value="">Choisir un plan...</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.price} CFA)</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" type="button" onClick={() => setIsAssignModalOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting} className="font-bold rounded-xl px-8 bg-primary hover:bg-primary/90">
                                {isSubmitting ? '...' : 'Attribuer'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    </>
    );
}
