'use client';

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Modal } from "../modal/MotionModal";
import AvatarUploadForm from "./AvatarUploadForm";
import CNIUploadForm from "./CNIUploadForm";
import { Skeleton } from "../ui/skeleton";
import { getMe, updateUserProfile } from "@/api/api";
import { UserProfile } from "@/types/interface";
import { toast } from "sonner";

export default function AccountSettings() {

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        password: "",
        confirmPassword: ""
    });

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'avatar' | 'cni' | null>(null);

    const fetchUserData = async () => {
        setIsLoading(true);
        try {
            const response = await getMe();
            if (response.statusCode === 200 || response.statusCode === 201) {
                const userData = response.data;
                setUser(userData);
                setFormData({
                    fullName: userData.fullName || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                    companyName: userData.companyName || "",
                    password: "",
                    confirmPassword: ""
                });
            }
        } catch (error) {

            console.error("Error fetching user data:", error);
            toast.error("Impossible de charger vos informations");

        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        (async () => await fetchUserData())();
    }, []);

    const handleOpenModal = (type: 'avatar' | 'cni') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleAvatarSubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            // NOTE: Logic for file upload to be implemented in backend
            // Simulating update for UI feedback
            const reader = new FileReader();
            reader.onload = (e) => { setUser(prev => prev ? ({ ...prev, avatarUrl: e.target?.result as string }) : null); };
            reader.readAsDataURL(file);
            await new Promise(resolve => setTimeout(resolve, 1000));
            handleSaveProfile('avatar', file);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCNISubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUser(prev => prev ? ({ ...prev, cniUrl: e.target?.result as string }) : null);
            };
            reader.readAsDataURL(file);

            await new Promise(resolve => setTimeout(resolve, 1000));
            handleSaveProfile('cni', file);

            setIsModalOpen(false);

        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => (
            { ...prev, [name]: value }
        ));
    };

    const handleSaveProfile = async (type?: 'avatar' | 'cni' | null, file?: File) => {

        setIsSubmitting(true);
        try {
            const currentType = type || modalType;
            // =========================
            // ✅ CAS 1 : UPLOAD IMAGE
            // =========================
            if (currentType && file) {

                const formDataToSend = new FormData();
                formDataToSend.append('files', file);
                formDataToSend.append('type', currentType);
                const response = await updateUserProfile(formDataToSend);

                if (response?.statusCode === 200 || response?.statusCode === 201) {
                    toast.success("Upload réussi");
                    setUser(response.data);
                } else {
                    toast.error("Erreur lors de l'upload");
                }
                return; // ✅ important
            }

            // =========================
            // ✅ CAS 2 : UPDATE PROFIL
            // =========================
            const payload: any = {};

            if (formData.fullName) payload.fullName = formData.fullName;
            if (formData.email) payload.email = formData.email;
            if (formData.phone) payload.phone = formData.phone;
            if (formData.companyName) payload.companyName = formData.companyName;

            if (Object.keys(payload).length === 0) {
                toast.info("Aucune modification détectée");
                return;
            }

            const response = await updateUserProfile(payload);

            if (response?.statusCode === 200 || response?.statusCode === 201) {
                toast.success("Profil mis à jour");
                setUser(response.data);
            } else {
                toast.error("Une erreur est survenue");
            }

        } catch (error) {
            console.error(error);
            toast.error("Impossible de sauvegarder les modifications");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {

        return (
            <div className="max-w-4xl mx-auto space-y-8 pb-12">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 rounded-[2rem]" />
                    <Skeleton className="h-48 rounded-[2rem]" />
                </div>
                <Skeleton className="h-96 rounded-[2.5rem]" />
            </div>
        );
    }

    return (

        <div className="max-w-4xl mx-auto space-y-8 pb-12">

            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Paramètres du compte</h1>
                <p className="text-muted-foreground text-sm font-medium">Gérez vos informations personnelles et vos documents</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CARD 1: AVATAR */}
                <div onClick={() => handleOpenModal('avatar')} className="group relative bg-card h-48 rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer overflow-hidden" >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10">
                        {user?.avatar ? (
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg">
                                <Image src={user.avatar} alt="Avatar" fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                                <Icon icon="solar:user-bold-duotone" className="w-12 h-12 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Modifier l'avatar</span>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
                    {!user?.avatarUrl && <Skeleton className="absolute inset-0 opacity-20" />}

                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all" />
                </div>

                {/* CARD 2: CNI */}
                <div onClick={() => handleOpenModal('cni')} className="group relative bg-card h-48 rounded-[2rem] border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer overflow-hidden"  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 px-6">
                        {user?.cni ? (
                            <div className="relative w-full h-24 rounded-xl overflow-hidden border-2 border-background shadow-lg">
                                <Image src={user.cni} alt="CNI" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-full h-24 rounded-xl bg-muted flex items-center justify-center border-2 border-background shadow-lg">
                                <Icon icon="solar:card-2-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Pièce d'identité</span>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/5 rounded-full -ml-16 -mb-16 group-hover:bg-secondary/10 transition-all" />
                    {!user?.cniUrl && <Skeleton className="absolute inset-0 opacity-20" />}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all" />
                </div>

            </div>

            {/* PERSO INFO FORM */}
            <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon icon="solar:user-id-bold-duotone" className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-foreground">Informations personnelles</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet</label>
                        <div className="relative group">
                            <Icon icon="solar:user-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-border bg-muted/50 rounded-2xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Votre nom complet" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                            <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="email" value={formData.email} onChange={handleInputChange} type="email"
                                className="w-full border border-border bg-muted/50 rounded-2xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="votre@email.com" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                        <div className="relative group">
                            <Icon icon="solar:phone-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full border border-border bg-muted/50 rounded-2xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="+229 00 00 00 00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Entreprise</label>
                        <div className="relative group">
                            <Icon icon="solar:case-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input
                                name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                className="w-full border border-border bg-muted/50 rounded-2xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Nom de votre entreprise"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                    <button onClick={() => handleSaveProfile()} disabled={isSubmitting} className="w-full md:w-auto bg-primary hover:bg-secondary text-white font-black px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-50"  >
                        {isSubmitting ? (
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                        ) : (
                            <Icon icon="solar:check-circle-bold" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        )}
                        Mettre à jour mon profil
                    </button>
                </div>
            </div>

            {/* MODAL */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} >
                <div className="px-1 py-4">
                    <div className="px-6 mb-6">
                        <h2 className="text-2xl font-black text-foreground">
                            {modalType === 'avatar' ? "Changer l'avatar" : "Pièce d'identité"}
                        </h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            {modalType === 'avatar' ? "Importez une photo pour personnaliser votre profil" : "Téléversez une photo lisible de votre CNI ou Passeport"}
                        </p>
                    </div>

                    {modalType === 'avatar' && (
                        <AvatarUploadForm
                            currentAvatar={user?.avatarUrl}
                            onSubmit={handleAvatarSubmit}
                            onClose={() => setIsModalOpen(false)}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {modalType === 'cni' && (
                        <CNIUploadForm
                            currentCNI={user?.cniUrl}
                            onSubmit={handleCNISubmit}
                            onClose={() => setIsModalOpen(false)}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </Modal>

        </div>

    );
}
