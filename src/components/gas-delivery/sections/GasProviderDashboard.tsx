"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { getMyGasProvider, upsertGasProvider, getGasProviderStats, getMyGasBottles, createGasBottle, updateGasBottle, deleteGasBottle, getPendingGasDeliveries, getAssignedGasDeliveries, acceptGasDelivery, updateGasDeliveryStatus, getMe, } from "@/api/api";
import { GasProvider, GasBottle, GasBottleFormat, GasDelivery, GasDeliveryStatus, GasProviderStats, User } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/MotionModal";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import CreateButton from "@/components/ui/CreateButton";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { GAS_BOTTLE_FORMAT_CONFIG } from "@/components/gas-delivery/gasBottleFormat";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";

const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});

const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    ACCEPTED: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    DELIVERED: "bg-green-500/10 text-green-600 dark:text-green-400",
    CANCELED: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = {
    PENDING: "EN ATTENTE",
    ACCEPTED: "ACCEPTÉE",
    DELIVERED: "LIVRÉE",
    CANCELED: "ANNULÉE",
};


export default function GasProviderDashboard() {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();
    const { checkEligibility, checkFeatureAccess, loading: checkLoading } = useSubscriptionCheck();

    const [activeSection, setActiveSection] = useState<string | null>("profil");
    const toggleSection = (id: string) => setActiveSection(prev => prev === id ? null : id);

    // Profil
    const [provider, setProvider] = useState<GasProvider | null>(null);
    const [companyName, setCompanyName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [phone, setPhone] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [address, setAddress] = useState("");
    const [description, setDescription] = useState("");
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [savingProfile, setSavingProfile] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // KPI
    const [stats, setStats] = useState<GasProviderStats | null>(null);

    // Catalogue
    const [bottles, setBottles] = useState<GasBottle[]>([]);
    const [isBottleModalOpen, setIsBottleModalOpen] = useState(false);
    const [editingBottle, setEditingBottle] = useState<GasBottle | null>(null);
    const [bottleForm, setBottleForm] = useState<{ brand: string; format: GasBottleFormat; weight: string; price: string; isAvailable: boolean }>({ brand: "", format: GasBottleFormat.B12, weight: "", price: "", isAvailable: true });
    const [savingBottle, setSavingBottle] = useState(false);
    const [bottleToDelete, setBottleToDelete] = useState<GasBottle | null>(null);

    // Demandes
    const [pending, setPending] = useState<GasDelivery[]>([]);
    const [assigned, setAssigned] = useState<GasDelivery[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "",
    });
    const openConfirm = (action: () => void, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, action, ...cfg });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchProvider = useCallback(async () => {
        const res = await getMyGasProvider();
        if (res.statusCode === 200 && res.data) {
            setProvider(res.data);
            setCompanyName(res.data.companyName || "");
            setWhatsapp(res.data.whatsapp || "");
            setPhone(res.data.phone || "");
            setIsAvailable(res.data.isAvailable);
            setAddress(res.data.address || "");
            setDescription(res.data.description || "");
            if (res.data.latitude != null && res.data.longitude != null) {
                setCoords({ lat: res.data.latitude, lng: res.data.longitude });
            }
        }
    }, []);

    const fetchBottles = useCallback(async () => {
        const res = await getMyGasBottles();
        if (res.statusCode === 200 && res.data) setBottles(res.data.data || []);
    }, []);

    const fetchRequests = useCallback(async () => {
        setLoadingRequests(true);
        try {
            const [pendingRes, assignedRes] = await Promise.all([getPendingGasDeliveries(), getAssignedGasDeliveries()]);
            if (pendingRes.statusCode === 200) setPending(pendingRes.data || []);
            if (assignedRes.statusCode === 200) setAssigned(assignedRes.data || []);
        } finally {
            setLoadingRequests(false);
        }
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await getGasProviderStats();
            if (res.statusCode === 200 && res.data) setStats(res.data);
        } catch (error) {
            console.error("Error fetching gas provider stats:", error);
        }
    }, []);

    const fetchCurrentUser = useCallback(async () => {
        const res = await getMe();
        if (res.statusCode === 200 && res.data) setCurrentUser(res.data);
    }, []);

    useEffect(() => {
        fetchProvider();
        fetchBottles();
        fetchRequests();
        fetchStats();
        fetchCurrentUser();
    }, [fetchProvider, fetchBottles, fetchRequests, fetchStats, fetchCurrentUser]);

    // Pré-remplit le profil avec les infos du compte connecté tant que le prestataire
    // n'a pas encore renseigné ses propres valeurs (les champs déjà remplis ne sont jamais écrasés).
    useEffect(() => {
        if (!currentUser) return;
        const defaultPhone = currentUser.indicatif ? `${currentUser.indicatif}${currentUser.phone || ""}` : (currentUser.phone || "");
        setCompanyName(prev => prev || currentUser.companyName || currentUser.fullName || "");
        setPhone(prev => prev || defaultPhone);
        setWhatsapp(prev => prev || defaultPhone);
        setAddress(prev => prev || currentUser.siegeSocial || "");
    }, [currentUser]);

    const handleSaveProfile = async () => {
        if (!companyName.trim()) {
            addNotification("Le nom de l'entreprise est requis", "error");
            return;
        }
        setSavingProfile(true);
        try {
            const res = await upsertGasProvider({
                companyName,
                whatsapp: whatsapp || undefined,
                phone: phone || undefined,
                isAvailable,
                address: address || undefined,
                description: description || undefined,
                latitude: coords?.lat,
                longitude: coords?.lng,
            });
            if (res.statusCode === 200) {
                addNotification("Profil mis à jour avec succès", "success");
                setProvider(res.data ?? null);
                setIsProfileModalOpen(false);
            } else {
                addNotification(res.message || "Erreur lors de la mise à jour", "error");
            }
        } finally {
            setSavingProfile(false);
        }
    };

    const handleLocateProvider = async () => {
        setLocating(true);
        try {
            const loc = await getUserLocation();
            if (loc?.lat != null && loc?.lng != null) {
                setCoords({ lat: loc.lat, lng: loc.lng });
                if (!address.trim()) {
                    const parts = [loc.street, loc.district, loc.city].filter(Boolean);
                    if (parts.length) setAddress(parts.join(", "));
                }
            }
        } finally {
            setLocating(false);
        }
    };

    const openCreateBottle = async () => {
        const canCreate = await checkEligibility('GasBottle');
        if (!canCreate) return;
        setEditingBottle(null);
        setBottleForm({ brand: "", format: GasBottleFormat.B12, weight: "", price: "", isAvailable: true });
        setIsBottleModalOpen(true);
    };

    const openEditBottle = (bottle: GasBottle) => {
        setEditingBottle(bottle);
        setBottleForm({ brand: bottle.brand, format: bottle.format, weight: String(bottle.weight), price: String(bottle.price), isAvailable: bottle.isAvailable });
        setIsBottleModalOpen(true);
    };

    const handleSaveBottle = async () => {
        if (!bottleForm.brand.trim() || !bottleForm.weight || !bottleForm.price) {
            addNotification("Marque, poids et prix sont requis", "error");
            return;
        }
        setSavingBottle(true);
        try {
            const payload = { brand: bottleForm.brand, format: bottleForm.format, weight: Number(bottleForm.weight), price: Number(bottleForm.price), isAvailable: bottleForm.isAvailable };
            const res = editingBottle ? await updateGasBottle(editingBottle.id, payload) : await createGasBottle(payload);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingBottle ? "Bouteille mise à jour" : "Bouteille ajoutée", "success");
                setIsBottleModalOpen(false);
                fetchBottles();
                fetchStats();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setSavingBottle(false);
        }
    };

    const confirmDeleteBottle = (bottle: GasBottle) => {
        openConfirm(async () => {
            const res = await deleteGasBottle(bottle.id);
            if (res.statusCode === 200) {
                addNotification("Bouteille supprimée", "success");
                fetchBottles();
                fetchStats();
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        }, { title: "Supprimer la bouteille", message: `Voulez-vous vraiment supprimer "${bottle.brand} ${bottle.weight}kg" de votre catalogue ?`, confirmLabel: "Oui, supprimer", variant: "danger", icon: "solar:trash-bin-trash-bold-duotone" });
    };

    const confirmAccept = (delivery: GasDelivery) => {
        openConfirm(async () => {
            const canProceed = await checkFeatureAccess();
            if (!canProceed) return;
            const res = await acceptGasDelivery(delivery.id);
            if (res.statusCode === 200) {
                addNotification("Demande acceptée — les coordonnées du client sont maintenant visibles", "success");
                fetchRequests();
                fetchStats();
            } else {
                addNotification(res.message || "Erreur lors de l'acceptation", "error");
            }
        }, { title: "Accepter la demande", message: "Confirmez-vous la prise en charge de cette demande de recharge ?", confirmLabel: "Oui, accepter", variant: "success", icon: "solar:check-circle-bold-duotone" });
    };

    const confirmStatusChange = (delivery: GasDelivery, status: GasDeliveryStatus, label: string) => {
        openConfirm(async () => {
            const canProceed = await checkFeatureAccess();
            if (!canProceed) return;
            const res = await updateGasDeliveryStatus(delivery.id, status);
            if (res.statusCode === 200) {
                addNotification("Statut mis à jour", "success");
                fetchRequests();
                fetchStats();
            } else {
                addNotification(res.message || "Erreur lors de la mise à jour", "error");
            }
        }, { title: label, message: `Confirmez-vous ce changement de statut ?`, confirmLabel: "Confirmer", variant: status === GasDeliveryStatus.DELIVERED ? "success" : "danger", icon: "solar:delivery-bold-duotone" });
    };

    const openInGoogleMaps = (delivery: GasDelivery) => {
        if (delivery.latitude == null || delivery.longitude == null) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${delivery.latitude},${delivery.longitude}`, "_blank");
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
            <SectionHeader
                title="Mon activité de recharge de gaz"
                subtitle="Gérez votre profil, votre catalogue de bouteilles et vos demandes de livraison."
                className="mb-6"
            />

            {/* ── Performances ── */}
            <div className="w-full max-w-4xl mx-auto mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-black text-foreground">Performances de mon activité</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { icon: "solar:box-bold-duotone", label: "Bouteilles actives", value: stats ? `${stats.activeBottles}/${stats.totalBottles}` : "—" },
                        { icon: "solar:delivery-bold-duotone", label: "Livraisons en cours", value: stats ? stats.inProgressDeliveriesCount : "—" },
                        { icon: "solar:wallet-money-bold-duotone", label: "Chiffre d'affaires", value: stats ? `${stats.totalRevenue.toLocaleString()} FCFA` : "—" },
                        { icon: "solar:clipboard-list-bold-duotone", label: "Livraisons assignées", value: stats ? stats.deliveriesAssignedCount : "—" },
                    ].map((tile) => (
                        <div key={tile.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
                            <div className="p-2 bg-primary/10 rounded-xl w-fit">
                                <Icon icon={tile.icon} className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-xl md:text-2xl font-black text-foreground truncate">{tile.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{tile.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full flex flex-col gap-3">
                <AccordionSection
                    id="profil"
                    title="Mon profil prestataire"
                    subtitle="Nom de l'entreprise, contacts et disponibilité"
                    icon="solar:card-bold-duotone"
                    activeSection={activeSection}
                    onToggle={toggleSection}
                >
                    <div className="space-y-4 max-w-md">
                        <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Icon icon="solar:shop-bold-duotone" className="w-6 h-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{companyName || "Nom de l'entreprise non renseigné"}</p>
                                {address && <p className="text-xs text-muted-foreground truncate">{address}</p>}
                            </div>
                            <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${isAvailable ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                {isAvailable ? "Disponible" : "Indisponible"}
                            </span>
                        </div>

                        {(phone || whatsapp) && (
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {phone && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="solar:phone-bold-duotone" className="w-3.5 h-3.5" />{phone}</span>}
                                {whatsapp && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="logos:whatsapp-icon" className="w-3.5 h-3.5" />{whatsapp}</span>}
                            </div>
                        )}

                        {description && <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-2xl p-4">{description}</p>}

                        <button onClick={() => setIsProfileModalOpen(true)} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2">
                            <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />
                            Modifier mon profil
                        </button>
                    </div>
                </AccordionSection>

                <AccordionSection
                    id="catalogue"
                    title="Mon catalogue de bouteilles"
                    subtitle="Marques, poids, prix et disponibilité"
                    icon="solar:box-bold-duotone"
                    activeSection={activeSection}
                    onToggle={toggleSection}
                >
                    <div className="mb-4">
                        <CreateButton label="Ajouter une bouteille" loading={checkLoading} onClick={openCreateBottle} />
                    </div>

                    {bottles.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                            <Icon icon="solar:box-minimalistic-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground">Aucune bouteille dans votre catalogue</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {bottles.map(bottle => (
                                <div key={bottle.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Icon icon={GAS_BOTTLE_FORMAT_CONFIG[bottle.format].icon} className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-foreground">{bottle.brand} — {GAS_BOTTLE_FORMAT_CONFIG[bottle.format].label} ({bottle.weight}kg)</p>
                                                {!bottle.isAvailable && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Indisponible</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{bottle.price.toLocaleString()} FCFA</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => openEditBottle(bottle)} className="p-2 rounded-xl hover:bg-muted transition"><Icon icon="solar:pen-bold-duotone" className="w-4 h-4" /></button>
                                        <button onClick={() => confirmDeleteBottle(bottle)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"><Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </AccordionSection>

                <AccordionSection
                    id="en-attente"
                    title="Demandes en attente"
                    subtitle="Visibles par tous les prestataires disponibles — premier arrivé, premier servi"
                    icon="solar:bell-bing-bold-duotone"
                    badge={pending.length > 0 ? <span className="text-[10px] font-black bg-primary text-white rounded-full px-2 py-0.5">{pending.length}</span> : undefined}
                    activeSection={activeSection}
                    onToggle={toggleSection}
                >
                    {loadingRequests ? (
                        <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
                    ) : pending.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                            <Icon icon="solar:inbox-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground">Aucune demande en attente pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pending.map(delivery => (
                                <div key={delivery.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
                                    <div className="min-w-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[delivery.status]}`}>{STATUS_LABEL[delivery.status]}</span>
                                        <p className="text-sm font-black text-foreground mt-1">{delivery.bottle?.brand} — {delivery.bottle?.weight}kg</p>
                                        <p className="text-xs text-muted-foreground">Adresse et contact masqués tant que non acceptée</p>
                                    </div>
                                    <button onClick={() => confirmAccept(delivery)} className="shrink-0 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wide transition-all active:scale-95">
                                        Accepter
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </AccordionSection>

                <AccordionSection
                    id="assignees"
                    title="Mes livraisons assignées"
                    subtitle="Demandes que vous avez acceptées"
                    icon="solar:delivery-bold-duotone"
                    activeSection={activeSection}
                    onToggle={toggleSection}
                >
                    {assigned.length === 0 ? (
                        <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                            <Icon icon="solar:delivery-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground">Aucune livraison assignée pour le moment</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {assigned.map(delivery => (
                                <div key={delivery.id} className="p-4 rounded-2xl border border-border bg-card space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[delivery.status]}`}>{STATUS_LABEL[delivery.status]}</span>
                                            <p className="text-sm font-black text-foreground mt-1">{delivery.bottle?.brand} — {delivery.bottle?.weight}kg</p>
                                            <p className="text-xs text-muted-foreground">{delivery.client?.fullName || "Client"} • {delivery.client?.indicatif}{delivery.client?.phone}</p>
                                            <p className="text-xs text-muted-foreground truncate max-w-xs">{delivery.address}</p>
                                        </div>
                                        <button onClick={() => openInGoogleMaps(delivery)} className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-[10px] uppercase tracking-wide transition-all">
                                            <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4" />
                                            Google Maps
                                        </button>
                                    </div>
                                    {delivery.status === GasDeliveryStatus.ACCEPTED && (
                                        <div className="flex gap-2">
                                            <button onClick={() => confirmStatusChange(delivery, GasDeliveryStatus.DELIVERED, "Marquer comme livrée")} className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black text-[10px] uppercase tracking-wide transition-all">
                                                Livrée
                                            </button>
                                            <button onClick={() => confirmStatusChange(delivery, GasDeliveryStatus.CANCELED, "Annuler la livraison")} className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 font-black text-[10px] uppercase tracking-wide transition-all">
                                                Annuler
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </AccordionSection>
            </div>

            {/* Profile form modal */}
            <Modal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} title="Mon profil prestataire">
                <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom de l'entreprise</label>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Gaz Express CI" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Numéro WhatsApp</label>
                        <input type="text" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="Ex: 0102030405" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Numéro de téléphone</label>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 0102030405" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Adresse</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Ex: Cocody Angré, Rue des Jardins" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Description (optionnel)</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Ex: Livraison rapide, disponible 7j/7..." className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all resize-none" />
                    </div>
                    <div className="space-y-2">
                        <button type="button" onClick={handleLocateProvider} disabled={locating} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                            {locating ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />}
                            {coords ? "Position détectée — actualiser" : "Localiser mon commerce"}
                        </button>
                        {coords && (
                            <div className="rounded-2xl overflow-hidden h-40">
                                <UserMap lat={coords.lat} lng={coords.lng} userName={companyName || undefined} />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                        <div>
                            <p className="text-sm font-bold text-foreground">Disponible pour de nouvelles demandes</p>
                            <p className="text-xs text-muted-foreground">Désactivez si vous êtes en rupture ou indisponible.</p>
                        </div>
                        <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                    </div>
                    <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {savingProfile ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                        Enregistrer
                    </button>
                </div>
            </Modal>

            {/* Bottle form modal */}
            <Modal isOpen={isBottleModalOpen} onClose={() => setIsBottleModalOpen(false)}>
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-black flex items-center gap-3">
                        <Icon icon={editingBottle ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                        {editingBottle ? "Modifier la bouteille" : "Nouvelle bouteille"}
                    </h2>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Marque</label>
                        <input type="text" value={bottleForm.brand} onChange={e => setBottleForm(f => ({ ...f, brand: e.target.value }))} placeholder="Ex: Total, Oryx, SHV..." className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Format de la bouteille</label>
                        <div className="grid grid-cols-5 gap-2">
                            {Object.values(GasBottleFormat).map(format => {
                                const cfg = GAS_BOTTLE_FORMAT_CONFIG[format];
                                const isSelected = bottleForm.format === format;
                                return (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => setBottleForm(f => ({ ...f, format }))}
                                        className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl border-2 transition-all ${isSelected ? "border-primary bg-primary/10" : "border-border bg-muted/30 hover:bg-muted/50"}`}
                                    >
                                        <Icon icon={cfg.icon} className={`w-6 h-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                                        <span className={`text-[10px] font-black ${isSelected ? "text-primary" : "text-muted-foreground"}`}>{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Poids (kg)</label>
                            <input type="number" value={bottleForm.weight} onChange={e => setBottleForm(f => ({ ...f, weight: e.target.value }))} placeholder="12.5" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Prix (FCFA)</label>
                            <input type="number" value={bottleForm.price} onChange={e => setBottleForm(f => ({ ...f, price: e.target.value }))} placeholder="8000" className="w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                        <p className="text-sm font-bold text-foreground">Disponible à la vente</p>
                        <Switch checked={bottleForm.isAvailable} onCheckedChange={v => setBottleForm(f => ({ ...f, isAvailable: v }))} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setIsBottleModalOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-muted hover:bg-muted/80 transition-all">Annuler</button>
                        <button onClick={handleSaveBottle} disabled={savingBottle} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {savingBottle ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                            Enregistrer
                        </button>
                    </div>
                </div>
            </Modal>

            <ConfirmAction
                isOpen={confirmState.isOpen}
                onClose={closeConfirm}
                onConfirm={() => { confirmState.action?.(); closeConfirm(); }}
                title={confirmState.title}
                message={confirmState.message}
                confirmLabel={confirmState.confirmLabel}
                variant={confirmState.variant}
                icon={confirmState.icon}
            />
        </div>
    );
}
