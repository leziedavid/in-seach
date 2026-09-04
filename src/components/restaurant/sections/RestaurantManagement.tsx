"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import {
    getMyRestaurants, createRestaurant, updateRestaurant, deleteRestaurant, getRestaurantTypes, getRestaurantStats,
    getMyProducts, createProduct, updateProduct, deleteProduct, handleToggleProductActive,
} from "@/api/api";
import { Restaurant, RestaurantType, RestaurantStats, GarageHoraires, Product } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { useDebounce } from "@/hooks/useDebounce";
import { Modal } from "@/components/ui/MotionModal";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Select2 } from "@/components/ui/Select2";
import CreateButton from "@/components/ui/CreateButton";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { InputPhone, countries } from "@/components/ui/InputPhone";
import ImageUploadGrid from "@/components/ui/ImageUploadGrid";
import ProductsManagementContent from "@/components/store/sections/components/ProductsManagementContent";
import VoiceSearchModal from "@/components/services/sections/VoiceSearchModal";
import FormsMenuItem from "@/components/restaurant/forms/FormsMenuItem";
import RestaurantPerformance from "@/components/restaurant/components/RestaurantPerformance";
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate";
import { Share } from "@/components/shared/Share";
import QRCodeCard from "@/components/shared/QRCodeCard";

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-border bg-muted/30 text-sm outline-none focus:border-primary transition-all font-medium";
const labelClass = "text-xs font-bold text-muted-foreground uppercase tracking-wider";

function splitPhone(raw: string): { indicatif: string; phone: string } {
    if (!raw) return { indicatif: "+225", phone: "" };
    const match = [...countries].sort((a, b) => b.code.length - a.code.length).find(c => raw.startsWith(c.code));
    if (match) return { indicatif: match.code, phone: raw.slice(match.code.length).trim() };
    return { indicatif: "+225", phone: raw };
}
function combinePhone(indicatif: string, phone: string): string {
    return phone.trim() ? `${indicatif} ${phone.trim()}` : "";
}

const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const defaultHoraires = (): GarageHoraires[] => DAYS.map(day => ({ day, openTime: "08:00", closeTime: "22:00", closed: false }));

interface RestaurantFormState {
    name: string; description: string;
    telIndicatif: string; telPhone: string;
    waIndicatif: string; waPhone: string;
    email: string;
    address: string; city: string; district: string;
    preparationTimeMin: string; preparationTimeMax: string;
    isActive: boolean;
    typeIds: string[];
    horaires: GarageHoraires[];
    logoFiles: File[]; logoPreviews: string[];
    coverFiles: File[]; coverPreviews: string[];
    newImages: File[]; imagePreviews: string[];
}

const emptyRestaurantForm = (): RestaurantFormState => ({
    name: "", description: "",
    telIndicatif: "+225", telPhone: "",
    waIndicatif: "+225", waPhone: "",
    email: "",
    address: "", city: "", district: "",
    preparationTimeMin: "", preparationTimeMax: "",
    isActive: true,
    typeIds: [],
    horaires: defaultHoraires(),
    logoFiles: [], logoPreviews: [],
    coverFiles: [], coverPreviews: [],
    newImages: [], imagePreviews: [],
});

const MENU_ITEMS_PER_PAGE = 10;

interface RestaurantManagementProps {
    onNavigateToOrders?: () => void;
}

/**
 * Espace "Mes restaurants" — rôle RESTAURANT. Un même compte peut posséder plusieurs
 * établissements (calqué sur GarageManagement.tsx) ; le menu de l'établissement
 * sélectionné réutilise ProductsManagementContent/createProduct/updateProduct (Product
 * étendu avec productType='RESTAURANT' + restaurantId), exactement comme FournisseurBoutique
 * réutilise ces mêmes briques pour le catalogue B2B.
 */
export default function RestaurantManagement({ onNavigateToOrders }: RestaurantManagementProps) {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();

    const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>("profil");
    const toggleSection = (id: string) => setActiveSection(prev => prev === id ? null : id);
    const [restaurantTypes, setRestaurantTypes] = useState<RestaurantType[]>([]);
    const [restaurantStats, setRestaurantStats] = useState<RestaurantStats | null>(null);

    // ── Partage & QR Code de la page publique du restaurant ──
    const [isRestoShareOpen, setIsRestoShareOpen] = useState(false);
    const [isRestoQrOpen, setIsRestoQrOpen] = useState(false);

    // ── Modal restaurant (création / édition) ──
    const [isRestoModalOpen, setIsRestoModalOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [restoForm, setRestoForm] = useState<RestaurantFormState>(emptyRestaurantForm());
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [savingRestaurant, setSavingRestaurant] = useState(false);

    // ── Menu (Product productType=RESTAURANT) ──
    const [menuSearch, setMenuSearch] = useState("");
    const debouncedMenuSearch = useDebounce(menuSearch, 400);
    const [menuItems, setMenuItems] = useState<Product[]>([]);
    const [menuPage, setMenuPage] = useState(1);
    const [menuHasMore, setMenuHasMore] = useState(true);
    const [menuLoading, setMenuLoading] = useState(false);
    const [menuTotal, setMenuTotal] = useState(0);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [editingMenuItem, setEditingMenuItem] = useState<Product | null>(null);
    const [isMenuSubmitting, setIsMenuSubmitting] = useState(false);
    const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "",
    });
    const openConfirm = (action: () => void, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, action, ...cfg });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchRestaurants = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyRestaurants();
            if (res.statusCode === 200 && res.data) setRestaurants(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRestaurants();
        getRestaurantTypes(true).then(res => { if (res.statusCode === 200 && res.data) setRestaurantTypes(res.data); });
    }, [fetchRestaurants]);

    // ── Menu : chargement paginé pour le restaurant sélectionné ──
    const fetchMenuItems = useCallback(async (pageNum: number, isNewSearch: boolean) => {
        if (!selectedRestaurant) return;
        setMenuLoading(true);
        try {
            const res = await getMyProducts({
                page: pageNum,
                limit: MENU_ITEMS_PER_PAGE,
                query: debouncedMenuSearch || undefined,
                restaurantId: selectedRestaurant.id,
            });
            if (res.statusCode === 200 && res.data) {
                const newItems = res.data.data;
                setMenuItems(prev => isNewSearch ? newItems : [...prev, ...newItems]);
                setMenuHasMore(pageNum < res.data.totalPages);
                setMenuTotal(res.data.total);
            } else {
                setMenuHasMore(false);
            }
        } finally {
            setMenuLoading(false);
        }
    }, [selectedRestaurant, debouncedMenuSearch]);

    useEffect(() => {
        if (selectedRestaurant) {
            setMenuPage(1);
            fetchMenuItems(1, true);
        }
    }, [selectedRestaurant, debouncedMenuSearch, fetchMenuItems]);

    useEffect(() => {
        if (menuPage > 1) fetchMenuItems(menuPage, false);
    }, [menuPage, fetchMenuItems]);

    // ── Stats (KPI) : scopées au restaurant sélectionné, pas au compte (un compte peut posséder plusieurs restaurants) ──
    const fetchRestaurantStats = useCallback(async (restaurantId: string) => {
        try {
            const res = await getRestaurantStats(restaurantId);
            if (res.statusCode === 200 && res.data) setRestaurantStats(res.data);
        } catch (error) {
            console.error("Error fetching restaurant stats:", error);
        }
    }, []);

    useEffect(() => {
        if (selectedRestaurant) {
            fetchRestaurantStats(selectedRestaurant.id);
        } else {
            setRestaurantStats(null);
        }
    }, [selectedRestaurant, fetchRestaurantStats]);

    useRealTimeUpdate('Order', () => {
        if (selectedRestaurant) {
            fetchRestaurants();
            fetchRestaurantStats(selectedRestaurant.id);
        }
    });

    // ── Restaurant: création / édition ──

    const openCreateRestaurant = () => {
        setEditingRestaurant(null);
        setRestoForm(emptyRestaurantForm());
        setCoords(null);
        setIsRestoModalOpen(true);
    };

    const openEditRestaurant = (restaurant: Restaurant) => {
        setEditingRestaurant(restaurant);
        const tel = splitPhone(restaurant.phone || "");
        const wa = splitPhone(restaurant.whatsapp || "");
        setRestoForm({
            name: restaurant.name, description: restaurant.description || "",
            telIndicatif: tel.indicatif, telPhone: tel.phone,
            waIndicatif: wa.indicatif, waPhone: wa.phone,
            email: restaurant.email || "",
            address: restaurant.address || "", city: restaurant.city || "", district: restaurant.district || "",
            preparationTimeMin: restaurant.preparationTimeMin?.toString() || "",
            preparationTimeMax: restaurant.preparationTimeMax?.toString() || "",
            isActive: restaurant.isActive,
            typeIds: (restaurant.types || []).map(t => t.id),
            horaires: Array.isArray(restaurant.horaires) && restaurant.horaires.length ? restaurant.horaires : defaultHoraires(),
            logoFiles: [], logoPreviews: restaurant.logo ? [restaurant.logo] : [],
            coverFiles: [], coverPreviews: restaurant.coverPhoto ? [restaurant.coverPhoto] : [],
            newImages: [], imagePreviews: restaurant.images || [],
        });
        setCoords(restaurant.latitude != null && restaurant.longitude != null ? { lat: restaurant.latitude, lng: restaurant.longitude } : null);
        setIsRestoModalOpen(true);
    };

    const addLogo = (files: File[]) => {
        setRestoForm(f => ({ ...f, logoFiles: [...f.logoFiles, ...files] }));
        const reader = new FileReader();
        reader.onload = ev => setRestoForm(f => ({ ...f, logoPreviews: [...f.logoPreviews, ev.target?.result as string] }));
        reader.readAsDataURL(files[0]);
    };
    const removeLogo = (index: number) => setRestoForm(f => ({
        ...f, logoFiles: f.logoFiles.filter((_, i) => i !== index), logoPreviews: f.logoPreviews.filter((_, i) => i !== index),
    }));
    const addCover = (files: File[]) => {
        setRestoForm(f => ({ ...f, coverFiles: [...f.coverFiles, ...files] }));
        const reader = new FileReader();
        reader.onload = ev => setRestoForm(f => ({ ...f, coverPreviews: [...f.coverPreviews, ev.target?.result as string] }));
        reader.readAsDataURL(files[0]);
    };
    const removeCover = (index: number) => setRestoForm(f => ({
        ...f, coverFiles: f.coverFiles.filter((_, i) => i !== index), coverPreviews: f.coverPreviews.filter((_, i) => i !== index),
    }));
    const addGalleryImages = (files: File[]) => {
        setRestoForm(f => ({ ...f, newImages: [...f.newImages, ...files] }));
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => setRestoForm(f => ({ ...f, imagePreviews: [...f.imagePreviews, ev.target?.result as string] }));
            reader.readAsDataURL(file);
        });
    };
    const removeGalleryImage = (index: number) => setRestoForm(f => ({
        ...f, newImages: f.newImages.filter((_, i) => i !== index), imagePreviews: f.imagePreviews.filter((_, i) => i !== index),
    }));

    const handleLocateRestaurant = async () => {
        setLocating(true);
        try {
            const loc = await getUserLocation();
            if (loc?.lat != null && loc?.lng != null) {
                setCoords({ lat: loc.lat, lng: loc.lng });
                if (!restoForm.address.trim()) {
                    const parts = [loc.street, loc.district, loc.city].filter(Boolean);
                    if (parts.length) setRestoForm(f => ({ ...f, address: parts.join(", ") }));
                }
                if (!restoForm.city.trim() && loc.city) setRestoForm(f => ({ ...f, city: loc.city as string }));
                if (!restoForm.district.trim() && loc.district) setRestoForm(f => ({ ...f, district: loc.district as string }));
            }
        } finally {
            setLocating(false);
        }
    };

    const handleSaveRestaurant = async () => {
        if (!restoForm.name.trim()) {
            addNotification("Le nom du restaurant est requis", "error");
            return;
        }
        setSavingRestaurant(true);
        try {
            const fd = new FormData();
            fd.append("name", restoForm.name);
            if (restoForm.description) fd.append("description", restoForm.description);
            const phone = combinePhone(restoForm.telIndicatif, restoForm.telPhone);
            if (phone) fd.append("phone", phone);
            const wa = combinePhone(restoForm.waIndicatif, restoForm.waPhone);
            if (wa) fd.append("whatsapp", wa);
            if (restoForm.email) fd.append("email", restoForm.email);
            if (restoForm.address) fd.append("address", restoForm.address);
            if (restoForm.city) fd.append("city", restoForm.city);
            if (restoForm.district) fd.append("district", restoForm.district);
            if (restoForm.preparationTimeMin) fd.append("preparationTimeMin", restoForm.preparationTimeMin);
            if (restoForm.preparationTimeMax) fd.append("preparationTimeMax", restoForm.preparationTimeMax);
            if (coords) { fd.append("latitude", String(coords.lat)); fd.append("longitude", String(coords.lng)); }
            fd.append("horaires", JSON.stringify(restoForm.horaires));
            fd.append("isActive", String(restoForm.isActive));
            restoForm.typeIds.forEach(id => fd.append("typeIds", id));
            if (restoForm.logoFiles[0]) fd.append("logo", restoForm.logoFiles[0]);
            if (restoForm.coverFiles[0]) fd.append("cover", restoForm.coverFiles[0]);
            restoForm.newImages.forEach(file => fd.append("images", file));
            if (editingRestaurant) {
                const keptExisting = restoForm.imagePreviews.filter(p => (editingRestaurant.images || []).includes(p));
                keptExisting.forEach(url => fd.append("existingImages", url));
            }

            const res = editingRestaurant ? await updateRestaurant(editingRestaurant.id, fd) : await createRestaurant(fd);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingRestaurant ? "Restaurant mis à jour avec succès" : "Restaurant créé avec succès", "success");
                setIsRestoModalOpen(false);
                await fetchRestaurants();
                if (selectedRestaurant && res.data && selectedRestaurant.id === res.data.id) setSelectedRestaurant(res.data);
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setSavingRestaurant(false);
        }
    };

    const confirmDeleteRestaurant = (restaurant: Restaurant) => {
        openConfirm(async () => {
            const res = await deleteRestaurant(restaurant.id);
            if (res.statusCode === 200) {
                addNotification("Restaurant supprimé avec succès", "success");
                if (selectedRestaurant?.id === restaurant.id) setSelectedRestaurant(null);
                fetchRestaurants();
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        }, { title: "Supprimer ce restaurant", message: `Voulez-vous vraiment supprimer "${restaurant.name}" ? Le restaurant doit d'abord n'avoir aucun plat au menu.`, confirmLabel: "Oui, supprimer", variant: "danger", icon: "solar:trash-bin-trash-bold-duotone" });
    };

    // ── Menu: création / édition ──

    const openCreateMenuItem = () => {
        setEditingMenuItem(null);
        setIsMenuModalOpen(true);
    };
    const openEditMenuItem = (item: Product) => {
        setEditingMenuItem(item);
        setIsMenuModalOpen(true);
    };

    const handleMenuFormSubmit = async (formData: FormData) => {
        if (!selectedRestaurant) return;
        setIsMenuSubmitting(true);
        try {
            formData.append("restaurantId", selectedRestaurant.id);
            const res = editingMenuItem ? await updateProduct(editingMenuItem.id, formData) : await createProduct(formData);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingMenuItem ? "Plat mis à jour" : "Plat ajouté au menu", "success");
                setIsMenuModalOpen(false);
                setEditingMenuItem(null);
                setMenuPage(1);
                fetchMenuItems(1, true);
                fetchRestaurants();
            } else {
                addNotification(res.message || "Une erreur est survenue", "error");
            }
        } finally {
            setIsMenuSubmitting(false);
        }
    };

    const handleDeleteMenuItem = async (id: string) => {
        const res = await deleteProduct(id);
        if (res.statusCode === 200) {
            addNotification("Plat supprimé", "success");
            setMenuPage(1);
            fetchMenuItems(1, true);
            fetchRestaurants();
        } else {
            addNotification(res.message || "Erreur lors de la suppression", "error");
        }
    };

    const handleToggleMenuItemStatus = async (item: Product, value: boolean) => {
        const res = await handleToggleProductActive(item.id, value);
        if (res.statusCode === 200) {
            addNotification(res.message || "Statut mis à jour", "success");
            setMenuPage(1);
            fetchMenuItems(1, true);
        } else {
            addNotification(res.message || "Erreur lors de la mise à jour", "error");
        }
    };

    // ── Rendu ──

    if (selectedRestaurant) {
        return (
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
                <button onClick={() => setSelectedRestaurant(null)} className="self-start mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                    <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
                    Tous mes restaurants
                </button>

                <div className="w-full flex items-start justify-between gap-4 mb-6">
                    <SectionHeader title={selectedRestaurant.name} subtitle={[selectedRestaurant.district, selectedRestaurant.city].filter(Boolean).join(", ")} />
                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setIsRestoShareOpen(true)} className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                            <Icon icon="solar:share-bold-duotone" className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsRestoQrOpen(true)} className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-muted flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all active:scale-90 shrink-0">
                            <Icon icon="solar:qr-code-bold-duotone" className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Performances ── */}
                <div className="w-full mb-8">
                    <RestaurantPerformance stats={restaurantStats} />
                </div>

                <div className="w-full flex flex-col gap-3">
                    <AccordionSection id="profil" title="Profil du restaurant" subtitle="Coordonnées, adresse, horaires, types de cuisine et photos" icon="solar:card-bold-duotone" activeSection={activeSection} onToggle={toggleSection}>
                        <div className="space-y-4 max-w-md">
                            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                                <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                    {selectedRestaurant.logo ? <img src={selectedRestaurant.logo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:chef-hat-bold-duotone" className="w-6 h-6 text-primary" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-foreground truncate">{selectedRestaurant.name}</p>
                                    {selectedRestaurant.address && <p className="text-xs text-muted-foreground truncate">{selectedRestaurant.address}</p>}
                                </div>
                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${selectedRestaurant.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                    {selectedRestaurant.isActive ? "Actif" : "Inactif"}
                                </span>
                            </div>

                            {!!selectedRestaurant.types?.length && (
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedRestaurant.types.map(t => (
                                        <span key={t.id} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">{t.name}</span>
                                    ))}
                                </div>
                            )}

                            {(selectedRestaurant.phone || selectedRestaurant.whatsapp) && (
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {selectedRestaurant.phone && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="solar:phone-bold-duotone" className="w-3.5 h-3.5" />{selectedRestaurant.phone}</span>}
                                    {selectedRestaurant.whatsapp && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="logos:whatsapp-icon" className="w-3.5 h-3.5" />{selectedRestaurant.whatsapp}</span>}
                                </div>
                            )}

                            {selectedRestaurant.latitude != null && selectedRestaurant.longitude != null && (
                                <div className="rounded-2xl overflow-hidden h-40">
                                    <UserMap lat={selectedRestaurant.latitude} lng={selectedRestaurant.longitude} userName={selectedRestaurant.name} />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => openEditRestaurant(selectedRestaurant)} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2">
                                    <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />
                                    Modifier
                                </button>
                                <button onClick={() => confirmDeleteRestaurant(selectedRestaurant)} className="py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection id="menu" title="Menu" subtitle="Gérez les plats proposés par ce restaurant" icon="solar:chef-hat-bold-duotone" activeSection={activeSection} onToggle={toggleSection}>
                        <div className="mb-4">
                            <CreateButton label="Ajouter un plat" onClick={openCreateMenuItem} />
                        </div>
                        <ProductsManagementContent
                            loading={menuLoading}
                            products={menuItems}
                            total={menuTotal}
                            search={menuSearch}
                            setSearch={setMenuSearch}
                            setIsVoiceModalOpen={setIsVoiceModalOpen}
                            hasMore={menuHasMore}
                            setPage={setMenuPage}
                            openEditModal={openEditMenuItem}
                            handleDeleteProduct={handleDeleteMenuItem}
                            handleToggleStatus={handleToggleMenuItemStatus}
                            openLiveModal={() => { }}
                            storeName={selectedRestaurant.name}
                        />
                    </AccordionSection>

                    {onNavigateToOrders && (
                        <button onClick={onNavigateToOrders} className="w-full flex items-center gap-4 p-5 bg-card border border-border/60 hover:border-border rounded-2xl shadow-sm transition-all text-left">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                                <Icon icon="solar:cart-large-4-bold-duotone" className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black tracking-tight text-foreground">Commandes reçues</h3>
                                <p className="text-[11px] font-medium text-muted-foreground">Suivez les commandes de tous vos restaurants</p>
                            </div>
                            <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                        </button>
                    )}
                </div>

                <RestaurantFormModal
                    isOpen={isRestoModalOpen} onClose={() => setIsRestoModalOpen(false)} editing={!!editingRestaurant}
                    form={restoForm} setForm={setRestoForm} coords={coords} locating={locating}
                    onLocate={handleLocateRestaurant} onSave={handleSaveRestaurant} saving={savingRestaurant}
                    onAddLogo={addLogo} onRemoveLogo={removeLogo}
                    onAddCover={addCover} onRemoveCover={removeCover}
                    onAddGalleryImages={addGalleryImages} onRemoveGalleryImage={removeGalleryImage}
                    restaurantTypes={restaurantTypes}
                />
                <Modal isOpen={isMenuModalOpen} onClose={() => { setIsMenuModalOpen(false); setEditingMenuItem(null); }}>
                    <div className="p-4 md:p-0">
                        <div className="mb-6 md:mb-8 md:p-6 md:pb-0">
                            <h2 className="text-xl md:text-2xl font-black flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <Icon icon={editingMenuItem ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                                </div>
                                {editingMenuItem ? "Modifier le plat" : "Nouveau plat"}
                            </h2>
                        </div>
                        <FormsMenuItem
                            initialData={editingMenuItem || undefined}
                            onSubmit={handleMenuFormSubmit}
                            isSubmitting={isMenuSubmitting}
                            isEditMode={!!editingMenuItem}
                            onClose={() => { setIsMenuModalOpen(false); setEditingMenuItem(null); }}
                        />
                    </div>
                </Modal>
                <VoiceSearchModal isOpen={isVoiceModalOpen} onClose={() => setIsVoiceModalOpen(false)} onResult={(text) => setMenuSearch(text)} />
                <ConfirmAction isOpen={confirmState.isOpen} onClose={closeConfirm} onConfirm={() => { confirmState.action?.(); closeConfirm(); }} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} icon={confirmState.icon} />

                <Share isOpen={isRestoShareOpen}
                    onClose={() => setIsRestoShareOpen(false)}
                    url={`${process.env.NEXT_PUBLIC_BASE_URL}/restaurant/${selectedRestaurant.slug}`}
                    title={selectedRestaurant.name}
                    description={selectedRestaurant.description || ""}
                    image={selectedRestaurant.logo || ""}
                />

                <Modal isOpen={isRestoQrOpen} onClose={() => setIsRestoQrOpen(false)} title="QR Code du restaurant">
                    <div className="p-4 md:p-6">
                        <QRCodeCard
                            path={`/restaurant/${selectedRestaurant.slug}`}
                            name={selectedRestaurant.name}
                            logoSrc={selectedRestaurant.logo}
                            tagline="Scannez pour découvrir notre menu"
                            infoText="Ce QR Code reste valide même si vous modifiez les informations de votre restaurant."
                            filenamePrefix="qr-restaurant"
                        />
                    </div>
                </Modal>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
            <SectionHeader title="Mes restaurants" subtitle="Gérez vos établissements, leurs informations et leurs menus." className="mb-6" />

            <div className="w-full mb-4">
                <CreateButton label="Ajouter un restaurant" onClick={openCreateRestaurant} />
            </div>

            {loading ? (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
            ) : restaurants.length === 0 ? (
                <div className="w-full py-14 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <Icon icon="solar:chef-hat-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Vous n&apos;avez pas encore de restaurant</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs">Ajoutez votre premier établissement pour apparaître dans la liste des restaurants.</p>
                </div>
            ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {restaurants.map(restaurant => (
                        <button key={restaurant.id} onClick={() => setSelectedRestaurant(restaurant)} className="text-left flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                {restaurant.logo ? <img src={restaurant.logo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:chef-hat-bold-duotone" className="w-6 h-6 text-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{restaurant.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{[restaurant.district, restaurant.city].filter(Boolean).join(", ") || "Adresse non renseignée"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1">{restaurant.menuCount ?? 0} plat(s) au menu</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${restaurant.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                {restaurant.isActive ? "Actif" : "Inactif"}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <RestaurantFormModal
                isOpen={isRestoModalOpen} onClose={() => setIsRestoModalOpen(false)} editing={!!editingRestaurant}
                form={restoForm} setForm={setRestoForm} coords={coords} locating={locating}
                onLocate={handleLocateRestaurant} onSave={handleSaveRestaurant} saving={savingRestaurant}
                onAddLogo={addLogo} onRemoveLogo={removeLogo}
                onAddCover={addCover} onRemoveCover={removeCover}
                onAddGalleryImages={addGalleryImages} onRemoveGalleryImage={removeGalleryImage}
                restaurantTypes={restaurantTypes}
            />
        </div>
    );
}

// ─── Modal formulaire restaurant ────────────────────────────────────────────

function RestaurantFormModal({
    isOpen, onClose, editing, form, setForm, coords, locating, onLocate, onSave, saving,
    onAddLogo, onRemoveLogo, onAddCover, onRemoveCover, onAddGalleryImages, onRemoveGalleryImage,
    restaurantTypes,
}: {
    isOpen: boolean; onClose: () => void; editing: boolean;
    form: RestaurantFormState; setForm: React.Dispatch<React.SetStateAction<RestaurantFormState>>;
    coords: { lat: number; lng: number } | null; locating: boolean;
    onLocate: () => void; onSave: () => void; saving: boolean;
    onAddLogo: (files: File[]) => void; onRemoveLogo: (index: number) => void;
    onAddCover: (files: File[]) => void; onRemoveCover: (index: number) => void;
    onAddGalleryImages: (files: File[]) => void; onRemoveGalleryImage: (index: number) => void;
    restaurantTypes: RestaurantType[];
}) {
    const updateHoraire = (index: number, patch: Partial<GarageHoraires>) => {
        setForm(f => ({ ...f, horaires: f.horaires.map((h, i) => i === index ? { ...h, ...patch } : h) }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <h2 className="text-xl font-black flex items-center gap-3">
                    <Icon icon={editing ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                    {editing ? "Modifier le restaurant" : "Nouveau restaurant"}
                </h2>

                <div className="space-y-1.5">
                    <label className={labelClass}>Nom du restaurant</label>
                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Chez Aya - Cocody" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Types de cuisine</label>
                    <Select2
                        options={restaurantTypes}
                        labelExtractor={(o: RestaurantType) => o.name}
                        valueExtractor={(o: RestaurantType) => o.id}
                        placeholder="Ex: Ivoirien, Libanais, Asiatique..."
                        mode="multiple"
                        selectedItem={form.typeIds}
                        onSelectionChange={(v) => setForm(f => ({ ...f, typeIds: v as string[] }))}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Téléphone</label>
                    <InputPhone indicatif={form.telIndicatif} phone={form.telPhone} onPhoneChange={v => setForm(f => ({ ...f, telIndicatif: v.indicatif, telPhone: v.phone }))} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>WhatsApp (optionnel)</label>
                    <InputPhone indicatif={form.waIndicatif} phone={form.waPhone} onPhoneChange={v => setForm(f => ({ ...f, waIndicatif: v.indicatif, waPhone: v.phone }))} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Email (optionnel)</label>
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Ville</label>
                        <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Quartier</label>
                        <input type="text" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} className={inputClass} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Adresse complète</label>
                    <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Laissez vide pour utiliser votre adresse de livraison par défaut" className={inputClass} />
                </div>

                <div className="space-y-2">
                    <button type="button" onClick={onLocate} disabled={locating} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                        {locating ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />}
                        {coords ? "Position détectée — actualiser" : "Localiser mon restaurant"}
                    </button>
                    {coords && (
                        <div className="rounded-2xl overflow-hidden h-40">
                            <UserMap lat={coords.lat} lng={coords.lng} userName={form.name || undefined} />
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Préparation min (min)</label>
                        <input type="number" min="0" value={form.preparationTimeMin} onChange={e => setForm(f => ({ ...f, preparationTimeMin: e.target.value }))} placeholder="35" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Préparation max (min)</label>
                        <input type="number" min="0" value={form.preparationTimeMax} onChange={e => setForm(f => ({ ...f, preparationTimeMax: e.target.value }))} placeholder="45" className={inputClass} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Horaires d&apos;ouverture</label>
                    <div className="space-y-1.5">
                        {form.horaires.map((h, i) => (
                            <div key={h.day} className="flex items-center gap-2 bg-muted/30 rounded-xl p-2">
                                <span className="text-xs font-bold w-20 shrink-0">{h.day}</span>
                                {h.closed ? (
                                    <span className="flex-1 text-xs text-muted-foreground">Fermé</span>
                                ) : (
                                    <>
                                        <input type="time" value={h.openTime || ""} onChange={e => updateHoraire(i, { openTime: e.target.value })} className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2 text-xs" />
                                        <span className="text-xs text-muted-foreground">à</span>
                                        <input type="time" value={h.closeTime || ""} onChange={e => updateHoraire(i, { closeTime: e.target.value })} className="flex-1 bg-background border border-border rounded-lg py-1.5 px-2 text-xs" />
                                    </>
                                )}
                                <label className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold text-muted-foreground">
                                    <input type="checkbox" checked={h.closed} onChange={e => updateHoraire(i, { closed: e.target.checked })} />
                                    Fermé
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <ImageUploadGrid title="Logo" icon="solar:chef-hat-bold-duotone" max={1} previews={form.logoPreviews} onAdd={onAddLogo} onRemove={onRemoveLogo} />
                <ImageUploadGrid title="Photo de couverture" icon="solar:gallery-wide-bold-duotone" max={1} previews={form.coverPreviews} onAdd={onAddCover} onRemove={onRemoveCover} />
                <ImageUploadGrid title="Galerie de photos" icon="solar:gallery-bold-duotone" max={3} previews={form.imagePreviews} onAdd={onAddGalleryImages} onRemove={onRemoveGalleryImage} />

                <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                    <div>
                        <p className="text-sm font-bold text-foreground">Restaurant actif</p>
                        <p className="text-xs text-muted-foreground">Désactivez pour le retirer temporairement de la liste des restaurants.</p>
                    </div>
                    <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${form.isActive ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                </div>

                <button onClick={onSave} disabled={saving} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                    Enregistrer
                </button>
            </div>
        </Modal>
    );
}
