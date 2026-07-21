"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import {
    getMyGarages, createGarage, updateGarage, deleteGarage,
    getMyGaragePieces, createGaragePiece, updateGaragePiece, deleteGaragePiece,
    getForSelectVehicleTypes,
} from "@/api/api";
import { Garage, GarageHoraires, GaragePieceCatalogue } from "@/types/interface";
import { useUserLocation } from "@/utils/location";
import { Switch } from "@/components/ui/switch";
import { Modal } from "@/components/ui/MotionModal";
import { AccordionSection } from "@/components/ui/AccordionSection";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Select2 } from "@/components/ui/Select2";
import CreateButton from "@/components/ui/CreateButton";
import ConfirmAction, { ConfirmVariant } from "@/components/ui/ConfirmAction";
import { useNotification } from "@/components/notifications/NotificationProvider";

const UserMap = dynamic(() => import("@/components/ui/Maps"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-40 bg-muted animate-pulse flex items-center justify-center rounded-2xl">
            <Icon icon="solar:map-bold-duotone" width={32} className="text-muted-foreground" />
        </div>
    ),
});

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const defaultHoraires = (): GarageHoraires[] => DAYS.map(day => ({ day, openTime: "08:00", closeTime: "18:00", closed: false }));

interface GarageFormState {
    nom: string; slogan: string; description: string;
    telephone: string; telephoneSecondaire: string; whatsapp: string; email: string;
    pays: string; ville: string; commune: string; quartier: string; adresseComplete: string;
    servicesProposes: string; isAgence: boolean; actif: boolean;
    horaires: GarageHoraires[];
    logoFile: File | null; coverFile: File | null; newImages: File[]; existingImages: string[];
}

const emptyGarageForm = (): GarageFormState => ({
    nom: "", slogan: "", description: "",
    telephone: "", telephoneSecondaire: "", whatsapp: "", email: "",
    pays: "Côte d'Ivoire", ville: "", commune: "", quartier: "", adresseComplete: "",
    servicesProposes: "", isAgence: false, actif: true,
    horaires: defaultHoraires(),
    logoFile: null, coverFile: null, newImages: [], existingImages: [],
});

interface PieceFormState {
    nom: string; prix: string; description: string; marquePiece: string; fabricant: string;
    anneeCompatible: string; vehicleTypeId: string | null; marqueVehicule: string; modele: string;
    referenceConstructeur: string; disponible: boolean; photoFile: File | null;
}

const emptyPieceForm = (): PieceFormState => ({
    nom: "", prix: "", description: "", marquePiece: "", fabricant: "",
    anneeCompatible: "", vehicleTypeId: null, marqueVehicule: "", modele: "",
    referenceConstructeur: "", disponible: true, photoFile: null,
});

export default function GarageManagement() {
    const { addNotification } = useNotification();
    const { getUserLocation } = useUserLocation();

    const [garages, setGarages] = useState<Garage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGarage, setSelectedGarage] = useState<Garage | null>(null);
    const [activeSection, setActiveSection] = useState<string | null>("profil");
    const toggleSection = (id: string) => setActiveSection(prev => prev === id ? null : id);

    // ── Modal garage (création / édition) ──
    const [isGarageModalOpen, setIsGarageModalOpen] = useState(false);
    const [editingGarage, setEditingGarage] = useState<Garage | null>(null);
    const [garageForm, setGarageForm] = useState<GarageFormState>(emptyGarageForm());
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const [savingGarage, setSavingGarage] = useState(false);

    // ── Catalogue ──
    const [pieces, setPieces] = useState<GaragePieceCatalogue[]>([]);
    const [loadingPieces, setLoadingPieces] = useState(false);
    const [vehicleTypes, setVehicleTypes] = useState<{ id: string; name: string }[]>([]);
    const [isPieceModalOpen, setIsPieceModalOpen] = useState(false);
    const [editingPiece, setEditingPiece] = useState<GaragePieceCatalogue | null>(null);
    const [pieceForm, setPieceForm] = useState<PieceFormState>(emptyPieceForm());
    const [savingPiece, setSavingPiece] = useState(false);

    const [confirmState, setConfirmState] = useState<{ isOpen: boolean; action: (() => void) | null; title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }>({
        isOpen: false, action: null, title: "", message: "", confirmLabel: "Confirmer", variant: "info", icon: "",
    });
    const openConfirm = (action: () => void, cfg: { title: string; message: string; confirmLabel: string; variant: ConfirmVariant; icon: string }) =>
        setConfirmState({ isOpen: true, action, ...cfg });
    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const fetchGarages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyGarages();
            if (res.statusCode === 200 && res.data) setGarages(res.data);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchPieces = useCallback(async (garageId: string) => {
        setLoadingPieces(true);
        try {
            const res = await getMyGaragePieces(garageId);
            if (res.statusCode === 200 && res.data) setPieces(res.data);
        } finally {
            setLoadingPieces(false);
        }
    }, []);

    useEffect(() => {
        fetchGarages();
        getForSelectVehicleTypes().then(res => { if (res.statusCode === 200 && res.data) setVehicleTypes(res.data); });
    }, [fetchGarages]);

    useEffect(() => {
        if (selectedGarage) fetchPieces(selectedGarage.id);
    }, [selectedGarage, fetchPieces]);

    // ── Garage: création / édition ──

    const openCreateGarage = () => {
        setEditingGarage(null);
        setGarageForm(emptyGarageForm());
        setCoords(null);
        setIsGarageModalOpen(true);
    };

    const openEditGarage = (garage: Garage) => {
        setEditingGarage(garage);
        setGarageForm({
            nom: garage.nom, slogan: garage.slogan || "", description: garage.description || "",
            telephone: garage.telephone, telephoneSecondaire: garage.telephoneSecondaire || "",
            whatsapp: garage.whatsapp || "", email: garage.email || "",
            pays: garage.pays || "Côte d'Ivoire", ville: garage.ville || "", commune: garage.commune || "",
            quartier: garage.quartier || "", adresseComplete: garage.adresseComplete || "",
            servicesProposes: garage.servicesProposes || "", isAgence: garage.isAgence, actif: garage.actif,
            horaires: garage.horaires && garage.horaires.length ? garage.horaires : defaultHoraires(),
            logoFile: null, coverFile: null, newImages: [], existingImages: garage.images || [],
        });
        setCoords(garage.latitude != null && garage.longitude != null ? { lat: garage.latitude, lng: garage.longitude } : null);
        setIsGarageModalOpen(true);
    };

    const handleLocateGarage = async () => {
        setLocating(true);
        try {
            const loc = await getUserLocation();
            if (loc?.lat != null && loc?.lng != null) {
                setCoords({ lat: loc.lat, lng: loc.lng });
                if (!garageForm.adresseComplete.trim()) {
                    const parts = [loc.street, loc.district, loc.city].filter(Boolean);
                    if (parts.length) setGarageForm(f => ({ ...f, adresseComplete: parts.join(", ") }));
                }
            }
        } finally {
            setLocating(false);
        }
    };

    const handleSaveGarage = async () => {
        if (!garageForm.nom.trim() || !garageForm.telephone.trim()) {
            addNotification("Le nom et le téléphone du garage sont requis", "error");
            return;
        }
        setSavingGarage(true);
        try {
            const fd = new FormData();
            fd.append("nom", garageForm.nom);
            fd.append("telephone", garageForm.telephone);
            if (garageForm.slogan) fd.append("slogan", garageForm.slogan);
            if (garageForm.description) fd.append("description", garageForm.description);
            if (garageForm.telephoneSecondaire) fd.append("telephoneSecondaire", garageForm.telephoneSecondaire);
            if (garageForm.whatsapp) fd.append("whatsapp", garageForm.whatsapp);
            if (garageForm.email) fd.append("email", garageForm.email);
            if (garageForm.pays) fd.append("pays", garageForm.pays);
            if (garageForm.ville) fd.append("ville", garageForm.ville);
            if (garageForm.commune) fd.append("commune", garageForm.commune);
            if (garageForm.quartier) fd.append("quartier", garageForm.quartier);
            if (garageForm.adresseComplete) fd.append("adresseComplete", garageForm.adresseComplete);
            if (garageForm.servicesProposes) fd.append("servicesProposes", garageForm.servicesProposes);
            if (coords) { fd.append("latitude", String(coords.lat)); fd.append("longitude", String(coords.lng)); }
            fd.append("horaires", JSON.stringify(garageForm.horaires));
            fd.append("isAgence", String(garageForm.isAgence));
            fd.append("actif", String(garageForm.actif));
            if (garageForm.logoFile) fd.append("logo", garageForm.logoFile);
            if (garageForm.coverFile) fd.append("cover", garageForm.coverFile);
            garageForm.newImages.forEach(file => fd.append("images", file));
            if (editingGarage) garageForm.existingImages.forEach(url => fd.append("existingImages", url));

            const res = editingGarage ? await updateGarage(editingGarage.id, fd) : await createGarage(fd);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingGarage ? "Garage mis à jour avec succès" : "Garage créé avec succès", "success");
                setIsGarageModalOpen(false);
                await fetchGarages();
                if (selectedGarage && res.data && selectedGarage.id === res.data.id) setSelectedGarage(res.data);
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setSavingGarage(false);
        }
    };

    const confirmDeleteGarage = (garage: Garage) => {
        openConfirm(async () => {
            const res = await deleteGarage(garage.id);
            if (res.statusCode === 200) {
                addNotification("Garage supprimé avec succès", "success");
                if (selectedGarage?.id === garage.id) setSelectedGarage(null);
                fetchGarages();
            } else {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        }, { title: "Supprimer ce garage", message: `Voulez-vous vraiment supprimer "${garage.nom}" ? Son catalogue de pièces sera également supprimé.`, confirmLabel: "Oui, supprimer", variant: "danger", icon: "solar:trash-bin-trash-bold-duotone" });
    };

    // ── Catalogue: création / édition ──

    const openCreatePiece = () => {
        setEditingPiece(null);
        setPieceForm(emptyPieceForm());
        setIsPieceModalOpen(true);
    };

    const openEditPiece = (piece: GaragePieceCatalogue) => {
        setEditingPiece(piece);
        setPieceForm({
            nom: piece.nom, prix: String(piece.prix), description: piece.description || "",
            marquePiece: piece.marquePiece || "", fabricant: piece.fabricant || "",
            anneeCompatible: piece.anneeCompatible || "", vehicleTypeId: piece.vehicleTypeId || null,
            marqueVehicule: piece.marqueVehicule || "", modele: piece.modele || "",
            referenceConstructeur: piece.referenceConstructeur || "", disponible: piece.disponible, photoFile: null,
        });
        setIsPieceModalOpen(true);
    };

    const handleSavePiece = async () => {
        if (!selectedGarage) return;
        if (!pieceForm.nom.trim() || !pieceForm.prix) {
            addNotification("Le nom et le prix de la pièce sont requis", "error");
            return;
        }
        setSavingPiece(true);
        try {
            const fd = new FormData();
            fd.append("nom", pieceForm.nom);
            fd.append("prix", pieceForm.prix);
            if (pieceForm.description) fd.append("description", pieceForm.description);
            if (pieceForm.marquePiece) fd.append("marquePiece", pieceForm.marquePiece);
            if (pieceForm.fabricant) fd.append("fabricant", pieceForm.fabricant);
            if (pieceForm.anneeCompatible) fd.append("anneeCompatible", pieceForm.anneeCompatible);
            if (pieceForm.vehicleTypeId) fd.append("vehicleTypeId", pieceForm.vehicleTypeId);
            if (pieceForm.marqueVehicule) fd.append("marqueVehicule", pieceForm.marqueVehicule);
            if (pieceForm.modele) fd.append("modele", pieceForm.modele);
            if (pieceForm.referenceConstructeur) fd.append("referenceConstructeur", pieceForm.referenceConstructeur);
            fd.append("disponible", String(pieceForm.disponible));
            if (pieceForm.photoFile) fd.append("files", pieceForm.photoFile);

            const res = editingPiece ? await updateGaragePiece(editingPiece.id, fd) : await createGaragePiece(selectedGarage.id, fd);
            if (res.statusCode === 200 || res.statusCode === 201) {
                addNotification(editingPiece ? "Pièce mise à jour" : "Pièce ajoutée au catalogue", "success");
                setIsPieceModalOpen(false);
                fetchPieces(selectedGarage.id);
                fetchGarages();
            } else {
                addNotification(res.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setSavingPiece(false);
        }
    };

    const confirmDeletePiece = (piece: GaragePieceCatalogue) => {
        openConfirm(async () => {
            const res = await deleteGaragePiece(piece.id);
            if (res.statusCode === 200 && selectedGarage) {
                addNotification("Pièce supprimée", "success");
                fetchPieces(selectedGarage.id);
                fetchGarages();
            } else if (res.statusCode !== 200) {
                addNotification(res.message || "Erreur lors de la suppression", "error");
            }
        }, { title: "Supprimer la pièce", message: `Voulez-vous vraiment supprimer "${piece.nom}" de votre catalogue ?`, confirmLabel: "Oui, supprimer", variant: "danger", icon: "solar:trash-bin-trash-bold-duotone" });
    };

    // ── Rendu ──

    if (selectedGarage) {
        return (
            <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
                <button onClick={() => setSelectedGarage(null)} className="self-start mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                    <Icon icon="solar:alt-arrow-left-bold" className="w-4 h-4" />
                    Tous mes garages
                </button>

                <SectionHeader title={selectedGarage.nom} subtitle={[selectedGarage.commune, selectedGarage.ville].filter(Boolean).join(", ")} className="mb-6" />

                <div className="w-full flex flex-col gap-3">
                    <AccordionSection id="profil" title="Profil du garage" subtitle="Coordonnées, adresse, horaires et photos" icon="solar:card-bold-duotone" activeSection={activeSection} onToggle={toggleSection}>
                        <div className="space-y-4 max-w-md">
                            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
                                <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                    {selectedGarage.logo ? <img src={selectedGarage.logo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:garage-bold-duotone" className="w-6 h-6 text-primary" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-black text-foreground truncate">{selectedGarage.nom}</p>
                                    {selectedGarage.adresseComplete && <p className="text-xs text-muted-foreground truncate">{selectedGarage.adresseComplete}</p>}
                                </div>
                                <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${selectedGarage.actif ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                    {selectedGarage.actif ? "Actif" : "Inactif"}
                                </span>
                            </div>

                            {(selectedGarage.telephone || selectedGarage.whatsapp) && (
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {selectedGarage.telephone && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="solar:phone-bold-duotone" className="w-3.5 h-3.5" />{selectedGarage.telephone}</span>}
                                    {selectedGarage.whatsapp && <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50"><Icon icon="logos:whatsapp-icon" className="w-3.5 h-3.5" />{selectedGarage.whatsapp}</span>}
                                </div>
                            )}

                            {selectedGarage.latitude != null && selectedGarage.longitude != null && (
                                <div className="rounded-2xl overflow-hidden h-40">
                                    <UserMap lat={selectedGarage.latitude} lng={selectedGarage.longitude} userName={selectedGarage.nom} />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button onClick={() => openEditGarage(selectedGarage)} className="flex-1 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2">
                                    <Icon icon="solar:pen-new-square-bold-duotone" className="w-4 h-4" />
                                    Modifier
                                </button>
                                <button onClick={() => confirmDeleteGarage(selectedGarage)} className="py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection id="catalogue" title="Catalogue de pièces" subtitle="Consultatif uniquement — aucune vente en ligne" icon="solar:box-bold-duotone" activeSection={activeSection} onToggle={toggleSection}>
                        <div className="mb-4">
                            <CreateButton label="Ajouter une pièce" onClick={openCreatePiece} />
                        </div>
                        {loadingPieces ? (
                            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
                        ) : pieces.length === 0 ? (
                            <div className="py-10 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                                <Icon icon="solar:box-minimalistic-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                <p className="text-xs font-bold text-muted-foreground">Aucune pièce dans ce catalogue</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pieces.map(piece => (
                                    <div key={piece.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                                {piece.photo ? <img src={piece.photo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:widget-4-bold-duotone" className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="text-sm font-black text-foreground truncate">{piece.nom}</p>
                                                    {!piece.disponible && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">Indisponible</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground">{piece.prix.toLocaleString()} FCFA {piece.marqueVehicule ? `• ${piece.marqueVehicule}` : ""}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => openEditPiece(piece)} className="p-2 rounded-xl hover:bg-muted transition"><Icon icon="solar:pen-bold-duotone" className="w-4 h-4" /></button>
                                            <button onClick={() => confirmDeletePiece(piece)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition"><Icon icon="solar:trash-bin-trash-bold-duotone" className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </AccordionSection>
                </div>

                <GarageFormModal
                    isOpen={isGarageModalOpen} onClose={() => setIsGarageModalOpen(false)} editing={!!editingGarage}
                    form={garageForm} setForm={setGarageForm} coords={coords} locating={locating}
                    onLocate={handleLocateGarage} onSave={handleSaveGarage} saving={savingGarage}
                />
                <PieceFormModal
                    isOpen={isPieceModalOpen} onClose={() => setIsPieceModalOpen(false)} editing={!!editingPiece}
                    form={pieceForm} setForm={setPieceForm} vehicleTypes={vehicleTypes}
                    onSave={handleSavePiece} saving={savingPiece}
                />
                <ConfirmAction isOpen={confirmState.isOpen} onClose={closeConfirm} onConfirm={() => { confirmState.action?.(); closeConfirm(); }} title={confirmState.title} message={confirmState.message} confirmLabel={confirmState.confirmLabel} variant={confirmState.variant} icon={confirmState.icon} />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-2 md:px-4 py-2">
            <SectionHeader title="Mon Garage" subtitle="Gérez vos implantations, leurs informations et leur catalogue de pièces." className="mb-6" />

            <div className="w-full mb-4">
                <CreateButton label="Ajouter un garage" onClick={openCreateGarage} />
            </div>

            {loading ? (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-muted/40 animate-pulse" />)}</div>
            ) : garages.length === 0 ? (
                <div className="w-full py-14 text-center flex flex-col items-center justify-center gap-3 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <Icon icon="solar:garage-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                    <p className="text-sm font-bold text-muted-foreground">Vous n'avez pas encore de garage</p>
                    <p className="text-xs text-muted-foreground/80 max-w-xs">Ajoutez votre première implantation pour apparaître dans l'annuaire des garages.</p>
                </div>
            ) : (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {garages.map(garage => (
                        <button key={garage.id} onClick={() => setSelectedGarage(garage)} className="text-left flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all">
                            <div className="w-12 h-12 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                                {garage.logo ? <img src={garage.logo} alt="" className="w-full h-full object-cover" /> : <Icon icon="solar:garage-bold-duotone" className="w-6 h-6 text-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-foreground truncate">{garage.nom}</p>
                                <p className="text-xs text-muted-foreground truncate">{[garage.commune, garage.ville].filter(Boolean).join(", ") || "Adresse non renseignée"}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1">{garage.catalogueCount ?? 0} pièce(s) au catalogue</p>
                            </div>
                            <span className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-full ${garage.actif ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                                {garage.actif ? "Actif" : "Inactif"}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <GarageFormModal
                isOpen={isGarageModalOpen} onClose={() => setIsGarageModalOpen(false)} editing={!!editingGarage}
                form={garageForm} setForm={setGarageForm} coords={coords} locating={locating}
                onLocate={handleLocateGarage} onSave={handleSaveGarage} saving={savingGarage}
            />
        </div>
    );
}

// ─── Modal formulaire garage ────────────────────────────────────────────────

function GarageFormModal({ isOpen, onClose, editing, form, setForm, coords, locating, onLocate, onSave, saving }: {
    isOpen: boolean; onClose: () => void; editing: boolean;
    form: GarageFormState; setForm: React.Dispatch<React.SetStateAction<GarageFormState>>;
    coords: { lat: number; lng: number } | null; locating: boolean;
    onLocate: () => void; onSave: () => void; saving: boolean;
}) {
    const inputClass = "w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all";
    const labelClass = "text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1";

    const updateHoraire = (index: number, patch: Partial<GarageHoraires>) => {
        setForm(f => ({ ...f, horaires: f.horaires.map((h, i) => i === index ? { ...h, ...patch } : h) }));
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <h2 className="text-xl font-black flex items-center gap-3">
                    <Icon icon={editing ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                    {editing ? "Modifier le garage" : "Nouveau garage"}
                </h2>

                <div className="space-y-1.5">
                    <label className={labelClass}>Nom du garage</label>
                    <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: CAM Services Scanner Autos - Cocody" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Slogan (optionnel)</label>
                    <input type="text" value={form.slogan} onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className={`${inputClass} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Téléphone principal</label>
                        <input type="text" value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Téléphone secondaire</label>
                        <input type="text" value={form.telephoneSecondaire} onChange={e => setForm(f => ({ ...f, telephoneSecondaire: e.target.value }))} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>WhatsApp</label>
                        <input type="text" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Email</label>
                        <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputClass} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Ville</label>
                        <input type="text" value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Commune</label>
                        <input type="text" value={form.commune} onChange={e => setForm(f => ({ ...f, commune: e.target.value }))} className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Quartier</label>
                        <input type="text" value={form.quartier} onChange={e => setForm(f => ({ ...f, quartier: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Pays</label>
                        <input type="text" value={form.pays} onChange={e => setForm(f => ({ ...f, pays: e.target.value }))} className={inputClass} />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Adresse complète</label>
                    <input type="text" value={form.adresseComplete} onChange={e => setForm(f => ({ ...f, adresseComplete: e.target.value }))} className={inputClass} />
                </div>

                <div className="space-y-2">
                    <button type="button" onClick={onLocate} disabled={locating} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-muted hover:bg-primary/10 hover:text-primary font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50">
                        {locating ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:gps-bold-duotone" className="w-4 h-4" />}
                        {coords ? "Position détectée — actualiser" : "Localiser mon garage"}
                    </button>
                    {coords && (
                        <div className="rounded-2xl overflow-hidden h-40">
                            <UserMap lat={coords.lat} lng={coords.lng} userName={form.nom || undefined} />
                        </div>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Horaires d'ouverture</label>
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

                <div className="space-y-1.5">
                    <label className={labelClass}>Services proposés (optionnel)</label>
                    <input type="text" value={form.servicesProposes} onChange={e => setForm(f => ({ ...f, servicesProposes: e.target.value }))} placeholder="Ex: Vidange, diagnostic électronique, carrosserie..." className={inputClass} />
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Logo</label>
                    <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, logoFile: e.target.files?.[0] || null }))} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Photo de couverture</label>
                    <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, coverFile: e.target.files?.[0] || null }))} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                    <label className={labelClass}>Galerie de photos</label>
                    <input type="file" accept="image/*" multiple onChange={e => setForm(f => ({ ...f, newImages: Array.from(e.target.files || []) }))} className="text-xs" />
                    {form.existingImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {form.existingImages.map(url => (
                                <div key={url} className="relative w-14 h-14 rounded-lg overflow-hidden group">
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => setForm(f => ({ ...f, existingImages: f.existingImages.filter(u => u !== url) }))} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Icon icon="solar:close-circle-bold" className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                    <p className="text-sm font-bold text-foreground">Agence (implantation secondaire)</p>
                    <Switch checked={form.isAgence} onCheckedChange={v => setForm(f => ({ ...f, isAgence: v }))} />
                </div>
                <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                    <div>
                        <p className="text-sm font-bold text-foreground">Garage actif</p>
                        <p className="text-xs text-muted-foreground">Désactivez pour le retirer temporairement de l'annuaire.</p>
                    </div>
                    <Switch checked={form.actif} onCheckedChange={v => setForm(f => ({ ...f, actif: v }))} />
                </div>

                <button onClick={onSave} disabled={saving} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                    Enregistrer
                </button>
            </div>
        </Modal>
    );
}

// ─── Modal formulaire pièce de catalogue ────────────────────────────────────

function PieceFormModal({ isOpen, onClose, editing, form, setForm, vehicleTypes, onSave, saving }: {
    isOpen: boolean; onClose: () => void; editing: boolean;
    form: PieceFormState; setForm: React.Dispatch<React.SetStateAction<PieceFormState>>;
    vehicleTypes: { id: string; name: string }[];
    onSave: () => void; saving: boolean;
}) {
    const inputClass = "w-full bg-muted/50 border border-border rounded-2xl py-3 px-4 text-sm font-bold focus:border-primary outline-none transition-all";
    const labelClass = "text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1";

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <h2 className="text-xl font-black flex items-center gap-3">
                    <Icon icon={editing ? "solar:pen-new-square-bold-duotone" : "solar:add-square-bold-duotone"} className="text-primary w-6 h-6" />
                    {editing ? "Modifier la pièce" : "Nouvelle pièce"}
                </h2>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Nom de la pièce</label>
                        <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Plaquette de frein" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Prix indicatif (FCFA)</label>
                        <input type="number" value={form.prix} onChange={e => setForm(f => ({ ...f, prix: e.target.value }))} placeholder="15000" className={inputClass} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Description (optionnel)</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Marque de la pièce</label>
                        <input type="text" value={form.marquePiece} onChange={e => setForm(f => ({ ...f, marquePiece: e.target.value }))} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Fabricant</label>
                        <input type="text" value={form.fabricant} onChange={e => setForm(f => ({ ...f, fabricant: e.target.value }))} className={inputClass} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Type d'engin</label>
                    <Select2
                        options={vehicleTypes}
                        labelExtractor={(o: any) => o.name}
                        valueExtractor={(o: any) => o.id}
                        placeholder="Sélectionner un type d'engin"
                        mode="single"
                        selectedItem={form.vehicleTypeId}
                        onSelectionChange={(v: any) => setForm(f => ({ ...f, vehicleTypeId: v as string }))}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Marque du véhicule</label>
                        <input type="text" value={form.marqueVehicule} onChange={e => setForm(f => ({ ...f, marqueVehicule: e.target.value }))} placeholder="Ex: Toyota" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Modèle</label>
                        <input type="text" value={form.modele} onChange={e => setForm(f => ({ ...f, modele: e.target.value }))} placeholder="Ex: Corolla" className={inputClass} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Année compatible</label>
                        <input type="text" value={form.anneeCompatible} onChange={e => setForm(f => ({ ...f, anneeCompatible: e.target.value }))} placeholder="Ex: 2015-2020" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Référence constructeur</label>
                        <input type="text" value={form.referenceConstructeur} onChange={e => setForm(f => ({ ...f, referenceConstructeur: e.target.value }))} className={inputClass} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className={labelClass}>Photo (optionnel)</label>
                    <input type="file" accept="image/*" onChange={e => setForm(f => ({ ...f, photoFile: e.target.files?.[0] || null }))} className="text-xs" />
                </div>

                <div className="flex items-center justify-between bg-muted/30 rounded-2xl p-4">
                    <p className="text-sm font-bold text-foreground">Disponible</p>
                    <Switch checked={form.disponible} onCheckedChange={v => setForm(f => ({ ...f, disponible: v }))} />
                </div>

                <button onClick={onSave} disabled={saving} className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest bg-primary text-white shadow-lg shadow-primary/20 hover:bg-secondary transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Icon icon="line-md:loading-twotone-loop" className="w-4 h-4" /> : <Icon icon="solar:check-read-bold" className="w-4 h-4" />}
                    Enregistrer
                </button>
            </div>
        </Modal>
    );
}
