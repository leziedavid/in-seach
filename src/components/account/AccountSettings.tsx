'use client';

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Modal } from "../modal/MotionModal";
import Link from "next/link";
import AvatarUploadForm from "./AvatarUploadForm";
import CNIUploadForm from "./CNIUploadForm";
import LogoUploadForm from "./LogoUploadForm";
import SignatureUploadForm from "./SignatureUploadForm";
import { Skeleton } from "../ui/skeleton";
import { getMe, updateUserProfile, testWebPushNotification, testWebSocketNotification, suspendMe } from "@/api/api";
import { UserProfile, SubscriptionPlan, SubscriptionStatus } from "@/types/interface";
import { toast } from "sonner";
import SubscriptionPaymentModal from "../subscription/SubscriptionPaymentModal";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Switch } from "../ui/switch";
import { useNotifications } from "@/hooks/useNotifications";

export default function AccountSettings() {

    const { permission, subscribe, unsubscribe, loading, isNotificationsEnabled } = useNotifications();

    // Simplification : on utilise directement isNotificationsEnabled calculé par le hook

    const handleToggleNotifications = async () => {
        if (isNotificationsEnabled) {
            await unsubscribe();
        } else {
            await subscribe();
        }
    };

    const handleTestPush = async () => {
        setIsTestingPush(true);
        try {
            const res = await testWebPushNotification();
            if (res.statusCode === 201 || res.statusCode === 200) {
                toast.success("Test Web Push envoyé !");
            } else {
                toast.error(res.message || "Échec du test Web Push");
            }
        } catch (error) {
            toast.error("Erreur lors du test Web Push");
        } finally {
            setIsTestingPush(false);
        }
    };

    const handleTestSocket = async () => {
        setIsTestingSocket(true);
        try {
            const res = await testWebSocketNotification();
            if (res.statusCode === 201 || res.statusCode === 200) {
                toast.success("Test WebSocket envoyé !");
            } else {
                toast.error(res.message || "Échec du test WebSocket");
            }
        } catch (error) {
            toast.error("Erreur lors du test WebSocket");
        } finally {
            setIsTestingSocket(false);
        }
    };

    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Subscription Modal
    const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
    const [selectedPlanToRenew, setSelectedPlanToRenew] = useState<SubscriptionPlan | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        companyName: "",
        siegeSocial: "",
        boitePostale: "",
        password: "",
        confirmPassword: ""
    });

    const [isTestingPush, setIsTestingPush] = useState(false);
    const [isTestingSocket, setIsTestingSocket] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'avatar' | 'cni' | 'LOGO_ENTREPRISE' | 'SIGNATURE_NUMERIQUE' | null>(null);

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
                    siegeSocial: userData.siegeSocial || "",
                    boitePostale: userData.boitePostale || "",
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

    const handleOpenModal = (type: 'avatar' | 'cni' | 'LOGO_ENTREPRISE' | 'SIGNATURE_NUMERIQUE') => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleAvatarSubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            handleSaveProfile('avatar', file);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error uploading avatar:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCNISubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            handleSaveProfile('cni', file);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error uploading CNI:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogoSubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            handleSaveProfile('LOGO_ENTREPRISE', file);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error uploading logo:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignatureSubmit = async (file: File) => {
        setIsSubmitting(true);
        try {
            handleSaveProfile('SIGNATURE_NUMERIQUE', file);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error uploading signature:", error);
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

    const handleSaveProfile = async (type?: 'avatar' | 'cni' | 'LOGO_ENTREPRISE' | 'SIGNATURE_NUMERIQUE' | null, file?: File) => {

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
                    await fetchUserData();
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
            if (formData.siegeSocial) payload.siegeSocial = formData.siegeSocial;
            if (formData.boitePostale) payload.boitePostale = formData.boitePostale;

            if (Object.keys(payload).length === 0) {
                toast.info("Aucune modification détectée");
                return;
            }

            const response = await updateUserProfile(payload);

            if (response?.statusCode === 200 || response?.statusCode === 201) {
                toast.success("Profil mis à jour");
                await fetchUserData();
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
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
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
                <div onClick={() => handleOpenModal('avatar')} className="group relative bg-card h-48 rounded-lg border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all cursor-pointer overflow-hidden" >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10">
                        {user?.avatar ? (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border-4 border-background shadow-lg">
                                <Image src={user.avatar} alt="Avatar" fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border-4 border-background shadow-lg">
                                <Icon icon="solar:user-bold-duotone" className="w-12 h-12 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Modifier l'avatar</span>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-lg -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
                    {!user?.avatarUrl && <Skeleton className="absolute inset-0 opacity-20" />}

                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all" />
                </div>

                {/* CARD 2: CNI */}
                <div onClick={() => handleOpenModal('cni')} className="group relative bg-card h-48 rounded-lg border border-border transition-all cursor-pointer overflow-hidden"  >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 px-6">
                        {user?.cni ? (
                            <div className="relative w-full h-24 overflow-hidden ">
                                <Image src={user.cni} alt="CNI" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-full h-24 bg-muted flex items-center justify-center ">
                                <Icon icon="solar:card-2-bold-duotone" className="w-10 h-10 text-muted-foreground" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Pièce d'identité</span>
                    </div>
                    {/* Background decoration */}
                    {!user?.cniUrl && <Skeleton className="absolute inset-0 opacity-20" />}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-all" />
                </div>

                {/* CARD 3: LOGO */}
                <div onClick={() => handleOpenModal('LOGO_ENTREPRISE')} className="group relative bg-card h-48 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden" >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 px-6">
                        {user?.logo ? (
                            <div className="relative w-full h-24 overflow-hidden ">
                                <Image src={user.logo} alt="Logo" fill className="object-contain group-hover:scale-105 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary/50 transition-colors">
                                <Icon icon="solar:globus-bold-duotone" className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Logo Entreprise</span>
                    </div>
                </div>

                {/* CARD 4: SIGNATURE */}
                <div onClick={() => handleOpenModal('SIGNATURE_NUMERIQUE')} className="group relative bg-card h-48 rounded-lg border border-border shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden" >
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 px-6">
                        {user?.signature ? (
                            <div className="relative w-full h-24 overflow-hidden ">
                                <Image src={user.signature} alt="Signature" fill className="object-contain group-hover:scale-105 transition-transform duration-500" unoptimized />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary/50 transition-colors">
                                <Icon icon="solar:pen-new-square-bold-duotone" className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                        )}
                        <span className="text-xs font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Signature Numérique</span>
                    </div>
                </div>

            </div>

            {/* PERSO INFO FORM */}
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-lg -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Icon icon="solar:user-id-bold-duotone" className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-black text-foreground">Informations personnelles</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet</label>
                        <div className="relative group">
                            <Icon icon="solar:user-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Votre nom complet" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                            <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="email" value={formData.email} onChange={handleInputChange} type="email"
                                className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
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
                                className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="+229 00 00 00 00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Entreprise</label>
                        <div className="relative group">
                            <Icon icon="solar:case-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="companyName"
                                value={formData.companyName}
                                onChange={handleInputChange}
                                className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Nom de votre entreprise"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Siége Social</label>
                        <div className="relative group">
                            <Icon icon="solar:map-point-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="siegeSocial"
                                value={formData.siegeSocial}
                                onChange={handleInputChange}
                                className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="Adresse du siège"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-1">Boîte Postale</label>
                        <div className="relative group">
                            <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-5 h-5" />
                            <input name="boitePostale"
                                value={formData.boitePostale}
                                onChange={handleInputChange}
                                className="w-full border border-border bg-muted/50 rounded-xl p-4 pl-12 text-sm font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                placeholder="BP 1234, Abidjan"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border/50">
                    <button onClick={() => handleSaveProfile()} disabled={isSubmitting} className="w-full md:w-auto bg-primary hover:bg-secondary text-white font-black px-8 py-4 rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-50"  >
                        {isSubmitting ? (
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                        ) : (
                            <Icon icon="solar:check-circle-bold" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        )}
                        Mettre à jour mon profil
                    </button>
                </div>

            </div>

            {/* NOTIFICATIONS SECTION */}
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-lg -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                            <Icon icon="solar:bell-bing-bold-duotone" className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground">Notifications Push</h2>
                            <p className="text-xs text-muted-foreground font-medium">Recevez des alertes en temps réel sur mobile et PC</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {loading && (
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 text-amber-600 animate-spin" />
                        )}
                        <Switch checked={isNotificationsEnabled} onCheckedChange={handleToggleNotifications} disabled={loading} className="data-[state=checked]:bg-green-500" />
                    </div>
                </div>

                <div className="relative z-10 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex gap-3">
                        <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                            Comme sur WhatsApp, les notifications de bureau et mobiles vous permettent de rester réactif face à vos clients et partenaires même lorsque l'application est fermée.
                        </p>
                    </div>
                </div>
            </div>

            {/* TERMS AND PRIVACY SECTION */}
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-lg -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Icon icon="solar:shield-check-bold-duotone" className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-foreground">Confidentialité & CGU</h2>
                            <p className="text-xs text-muted-foreground font-medium">Acceptez les conditions pour continuer à utiliser nos services en toute sécurité</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch 
                            checked={user?.acceptedTerms || false} 
                            onCheckedChange={async (checked) => {
                                try {
                                    const response = await updateUserProfile({ acceptedTerms: checked });
                                    if (response?.statusCode === 200 || response?.statusCode === 201) {
                                        toast.success(checked ? "Conditions acceptées" : "Consentement retiré");
                                        await fetchUserData();
                                    }
                                } catch (error) {
                                    toast.error("Erreur lors de la mise à jour");
                                }
                            }} 
                            className="data-[state=checked]:bg-primary" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <Link href="/terms-of-use" className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-all group">
                        <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Conditions d'Utilisation</span>
                        <Icon icon="solar:arrow-right-up-bold" className="w-3 h-3 ml-auto opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    <Link href="/privacy-policy" className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-all group">
                        <Icon icon="solar:lock-password-bold-duotone" className="w-5 h-5 text-primary" />
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">Politique de Confidentialité</span>
                        <Icon icon="solar:arrow-right-up-bold" className="w-3 h-3 ml-auto opacity-30 group-hover:opacity-100 transition-opacity" />
                    </Link>
                </div>

                <div className="relative z-10 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex gap-3">
                        <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-xs text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                            Conformément à la loi n°2013-450 sur la protection des données en Côte d'Ivoire, nous nous engageons à protéger votre vie privée et à ne jamais vendre vos données à des tiers.
                        </p>
                    </div>
                </div>
            </div>

            {/* TEST NOTIFICATIONS SECTION */}
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm space-y-6 relative overflow-hidden">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Icon icon="solar:test-tube-bold-duotone" className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground">Tester les notifications</h2>
                        <p className="text-xs text-muted-foreground font-medium">Vérifiez manuellement le bon fonctionnement de vos alertes.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                    <button onClick={handleTestPush} disabled={isTestingPush || !isNotificationsEnabled} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-muted border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                        {isTestingPush ? (
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin text-primary" />
                        ) : (
                            <Icon icon="solar:plain-bold-duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                        )}
                        <div className="text-left">
                            <span className="block text-sm font-black text-foreground">Tester Web Push</span>
                            <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Notification système</span>
                        </div>
                    </button>

                    <button onClick={handleTestSocket} disabled={isTestingSocket} className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-muted border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                        {isTestingSocket ? (
                            <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin text-secondary" />
                        ) : (
                            <Icon icon="solar:flash-bold-duotone" className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                        )}
                        <div className="text-left">
                            <span className="block text-sm font-black text-foreground">Tester WebSocket</span>
                            <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Notification temps réel</span>
                        </div>
                    </button>
                </div>

                {!isNotificationsEnabled && (
                    <p className="text-[10px] text-amber-600 font-bold bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 flex items-center gap-2 italic">
                        <Icon icon="solar:danger-bold-duotone" className="w-3.5 h-3.5" />
                        Note : Activez les notifications via le bouton ci-dessus pour tester le mode Web Push.
                    </p>
                )}
            </div>

            {/* SUBSCRIPTIONS SECTION */}
            <div className="bg-card p-6 md:p-8 rounded-lg border border-border shadow-sm space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-lg -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Icon icon="solar:bill-list-bold-duotone" className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black text-foreground">Mes abonnements</h2>
                    </div>
                    {(user?.subscriptions && user.subscriptions.length > 0) && (
                        <button onClick={() => router.push('/pricing')} className="text-xs font-black uppercase tracking-widest text-primary hover:text-secondary transition-colors underline decoration-2 underline-offset-4">
                            Mettre à niveau
                        </button>
                    )}
                </div>

                <div className="relative z-10 space-y-4">
                    {(!user?.subscriptions || user.subscriptions.length === 0) ? (
                        <div className="bg-muted/30 rounded-lg p-10 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/50">
                            <div className="w-20 h-20 rounded-lg bg-background flex items-center justify-center text-muted-foreground shadow-sm">
                                <Icon icon="solar:ghost-bold-duotone" className="w-10 h-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground">Aucun plan disponible</h3>
                                <p className="text-sm text-muted-foreground font-medium max-w-xs mx-auto">
                                    Vous n'avez pas encore souscrit à un abonnement premium.
                                </p>
                            </div>
                            <button onClick={() => router.push('/pricing')} className="bg-primary text-white font-black px-8 py-3 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                                Voir les tarifs
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {user.subscriptions.map((sub, i) => (
                                <div key={sub.id} className="bg-background/50 border border-border rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${sub.status === SubscriptionStatus.ACTIVE ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            <Icon icon={sub.status === SubscriptionStatus.ACTIVE ? "solar:verified-check-bold-duotone" : "solar:re-order-bold-duotone"} className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-lg">{sub.plan?.name || "Plan standard"}</h4>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${sub.status === SubscriptionStatus.ACTIVE ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    {sub.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-muted-foreground">
                                                <p className="flex items-center gap-1">
                                                    <Icon icon="solar:calendar-bold-duotone" className="w-3.5 h-3.5" />
                                                    Début : {format(new Date(sub.startDate), 'dd MMMM yyyy', { locale: fr })}
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <Icon icon="solar:history-bold-duotone" className="w-3.5 h-3.5" />
                                                    Fin : {format(new Date(sub.endDate), 'dd MMMM yyyy', { locale: fr })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => {
                                                if (sub.plan) {
                                                    setSelectedPlanToRenew(sub.plan as any);
                                                    setIsSubscriptionModalOpen(true);
                                                } else {
                                                    router.push('/pricing');
                                                }
                                            }}
                                            className="flex-1 md:flex-none px-6 py-3 rounded-lg bg-muted hover:bg-primary hover:text-white font-black text-xs transition-all uppercase tracking-widest whitespace-nowrap"
                                        >
                                            Renouveler
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

                    {modalType === 'LOGO_ENTREPRISE' && (
                        <LogoUploadForm
                            currentLogo={user?.logo}
                            onSubmit={handleLogoSubmit}
                            onClose={() => setIsModalOpen(false)}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {modalType === 'SIGNATURE_NUMERIQUE' && (
                        <SignatureUploadForm
                            currentSignature={user?.signature}
                            onSubmit={handleSignatureSubmit}
                            onClose={() => setIsModalOpen(false)}
                            isSubmitting={isSubmitting}
                        />
                    )}
                </div>
            </Modal>

            {/* SUBSCRIPTION PAYMENT MODAL */}
            {selectedPlanToRenew && (
                <SubscriptionPaymentModal
                    isOpen={isSubscriptionModalOpen}
                    onClose={() => {
                        setIsSubscriptionModalOpen(false);
                        setSelectedPlanToRenew(null);
                        void fetchUserData();
                    }}
                    plan={selectedPlanToRenew}
                />
            )}

            {/* DANGER ZONE - ACCOUNT SUSPENSION */}
            <div className="bg-rose-500/5 p-6 md:p-8 rounded-lg border border-rose-500/20 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-lg -mr-32 -mt-32 blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                            <Icon icon="solar:shield-warning-bold-duotone" className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-rose-900 dark:text-rose-400">Zone de danger</h2>
                            <p className="text-xs text-rose-700/70 font-medium italic">Actions irréversibles sans assistance administrative</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Switch 
                            checked={false} 
                            onCheckedChange={async (checked) => {
                                if (checked) {
                                    const confirmed = window.confirm("ATTENTION : En suspendant votre compte, vous serez déconnecté instantanément. Vous devrez contacter l'administration pour le récupérer. Continuer ?");
                                    if (confirmed) {
                                        try {
                                            const res = await suspendMe();
                                            if (res.statusCode === 200) {
                                                toast.success("Compte suspendu.");
                                                // Le logout est géré par WebSocket, mais on redirige par précaution
                                                router.push('/login');
                                            }
                                        } catch (error) {
                                            toast.error("Erreur technique lors de la suspension");
                                        }
                                    }
                                }
                            }}
                            className="data-[state=checked]:bg-rose-600" 
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-black text-rose-900 dark:text-rose-400">Suspendre mon compte</h3>
                    <p className="text-xs text-rose-700/60 font-medium leading-relaxed">
                        Cette action désactivera immédiatement votre accès à la plateforme. Vos données seront conservées, mais vous devrez soumettre une demande de récupération pour réactiver votre compte.
                    </p>
                </div>
            </div>

        </div>

    );
}
