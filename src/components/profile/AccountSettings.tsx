'use client';

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Modal } from "@/components/ui/MotionModal";
import Link from "next/link";
import AvatarUploadForm from "@/components/profile/AvatarUploadForm";
import CNIUploadForm from "@/components/profile/CNIUploadForm";
import LogoUploadForm from "@/components/profile/LogoUploadForm";
import SignatureUploadForm from "@/components/profile/SignatureUploadForm";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe, updateUserProfile, testWebPushNotification, testWebSocketNotification, suspendMe } from "@/api/api";
import { UserProfile, SubscriptionPlan, SubscriptionStatus } from "@/types/interface";
import { toast } from "sonner";
import SubscriptionPaymentModal from "@/components/subscription/modals/SubscriptionPaymentModal";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/useNotifications";
import { SectionHeader } from "@/components/shared/SectionHeader";

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

    // Accordion state personal
    const [activeSection, setActiveSection] = useState<string | null>("");

    const toggleSection = (id: string) => {
        setActiveSection(activeSection === id ? null : id);
    };

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

    const AccordionSection = ({
        id,
        title,
        subtitle,
        icon,
        children,
        badge,
        variant = "default"
    }: {
        id: string,
        title: string,
        subtitle?: string,
        icon: string,
        children: React.ReactNode,
        badge?: React.ReactNode,
        variant?: "default" | "danger"
    }) => {
        const isOpen = activeSection === id;
        const isDanger = variant === "danger";

        return (
            <div className={`
                overflow-hidden rounded-2xl border transition-all duration-300
                ${isOpen
                    ? (isDanger ? "border-rose-500/30 shadow-lg shadow-rose-500/5 bg-rose-500/5" : "border-primary/30 shadow-lg shadow-primary/5 bg-primary/[0.02]")
                    : "border-border/60 hover:border-border bg-card shadow-sm"}
            `}>
                <button
                    onClick={() => toggleSection(id)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                            ${isOpen
                                ? (isDanger ? "bg-rose-500 text-white" : "bg-primary text-white")
                                : (isDanger ? "bg-rose-500/10 text-rose-500" : "bg-muted text-muted-foreground")}
                        `}>
                            <Icon icon={icon} className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className={`font-black tracking-tight ${isDanger ? "text-rose-900 dark:text-rose-400" : "text-foreground"}`}>
                                    {title}
                                </h3>
                                {badge}
                            </div>
                            {subtitle && (
                                <p className={`text-[11px] font-medium transition-colors ${isOpen ? "text-foreground/60" : "text-muted-foreground"}`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <Icon
                        icon="solar:alt-arrow-down-bold-duotone"
                        className={`w-5 h-5 text-muted-foreground/40 transition-transform duration-500 ${isOpen ? "rotate-180 text-primary" : ""}`}
                    />
                </button>

                <AnimatePresence mode="wait">
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >
                            <div className="px-5 pb-6 pt-2 border-t border-border/40">
                                {children}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <SectionHeader
                title="Paramètres du compte"
                subtitle="Gérez vos informations personnelles et vos documents"
                className="!text-left"
            />

            <div className="flex flex-col gap-4">

                {/* 1. PERSONAL INFO */}
                <AccordionSection
                    id="personal"
                    title="Informations personnelles"
                    subtitle="Identité, Email et Entreprise"
                    icon="solar:user-id-bold-duotone"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Nom Complet</label>
                            <div className="relative group">
                                <Icon icon="solar:user-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all" placeholder="Votre nom complet" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email</label>
                            <div className="relative group">
                                <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input name="email" value={formData.email} onChange={handleInputChange} type="email"
                                    className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="votre@email.com" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Téléphone</label>
                            <div className="relative group">
                                <Icon icon="solar:phone-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="+229 00 00 00 00"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Entreprise</label>
                            <div className="relative group">
                                <Icon icon="solar:case-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="Nom de votre entreprise"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Siége Social</label>
                            <div className="relative group">
                                <Icon icon="solar:map-point-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input name="siegeSocial"
                                    value={formData.siegeSocial}
                                    onChange={handleInputChange}
                                    className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="Adresse du siège"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Boîte Postale</label>
                            <div className="relative group">
                                <Icon icon="solar:letter-bold-duotone" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors w-4 h-4" />
                                <input name="boitePostale"
                                    value={formData.boitePostale}
                                    onChange={handleInputChange}
                                    className="w-full border border-border bg-muted/20 rounded-xl p-3.5 pl-11 text-xs font-bold text-foreground focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                                    placeholder="BP 1234, Abidjan"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-border/40 text-center md:text-left">
                        <button onClick={() => handleSaveProfile()} disabled={isSubmitting} className="w-full md:w-auto bg-primary hover:bg-secondary text-white font-black px-8 py-3.5 rounded-xl transition-all active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group disabled:opacity-50"  >
                            {isSubmitting ? (
                                <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin" />
                            ) : (
                                <Icon icon="solar:check-circle-bold" className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            )}
                            Sauvegarder les modifications
                        </button>
                    </div>
                </AccordionSection>

                {/* 2. DOCUMENTS SECTION */}
                <AccordionSection
                    id="documents"
                    title="Photos & Documents"
                    subtitle="Avatar, CNI, Logo et Signature"
                    icon="solar:folder-with-files-bold-duotone"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {/* CARD 1: AVATAR */}
                        <div onClick={() => handleOpenModal('avatar')} className="group relative bg-muted/30 h-40 rounded-2xl border border-border transition-all cursor-pointer overflow-hidden" >
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10">
                                {user?.avatar ? (
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-background shadow-lg">
                                        <Image src={user.avatar} alt="Avatar" fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-background shadow-lg">
                                        <Icon icon="solar:user-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Modifier l'avatar</span>
                            </div>
                        </div>

                        {/* CARD 2: CNI */}
                        <div onClick={() => handleOpenModal('cni')} className="group relative bg-muted/30 h-40 rounded-2xl border border-border transition-all cursor-pointer overflow-hidden"  >
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10 px-4">
                                {user?.cni ? (
                                    <div className="relative w-full h-20 overflow-hidden rounded-lg">
                                        <Image src={user.cni} alt="CNI" fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center border-2 border-background shadow-lg">
                                        <Icon icon="solar:card-2-bold-duotone" className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Pièce d'identité</span>
                            </div>
                        </div>

                        {/* CARD 3: LOGO */}
                        <div onClick={() => handleOpenModal('LOGO_ENTREPRISE')} className="group relative bg-muted/30 h-40 rounded-2xl border border-border transition-all cursor-pointer overflow-hidden" >
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10 px-4">
                                {user?.logo ? (
                                    <div className="relative w-full h-20 overflow-hidden rounded-lg">
                                        <Image src={user.logo} alt="Logo" fill className="object-contain group-hover:scale-105 transition-transform duration-500" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary/50 transition-colors">
                                        <Icon icon="solar:globus-bold-duotone" className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Logo Entreprise</span>
                            </div>
                        </div>

                        {/* CARD 4: SIGNATURE */}
                        <div onClick={() => handleOpenModal('SIGNATURE_NUMERIQUE')} className="group relative bg-muted/30 h-40 rounded-2xl border border-border transition-all cursor-pointer overflow-hidden" >
                            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 z-10 px-4">
                                {user?.signature ? (
                                    <div className="relative w-full h-20 overflow-hidden rounded-lg">
                                        <Image src={user.signature} alt="Signature" fill className="object-contain group-hover:scale-105 transition-transform duration-500" unoptimized />
                                    </div>
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary/50 transition-colors">
                                        <Icon icon="solar:pen-new-square-bold-duotone" className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                )}
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Signature Numérique</span>
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                {/* 3. NOTIFICATIONS */}
                <AccordionSection
                    id="notifications"
                    title="Notifications Push"
                    subtitle="Alertes en temps réel sur mobile et PC"
                    icon="solar:bell-bing-bold-duotone"
                    badge={
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isNotificationsEnabled ? "bg-green-500/10 text-green-500" : "bg-muted text-muted-foreground"}`}>
                            {isNotificationsEnabled ? "Activé" : "Désactivé"}
                        </div>
                    }
                >
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <Icon icon="solar:notification-lines-remove-bold-duotone" className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-black text-foreground">Notifications Système</span>
                                    <span className="block text-[10px] text-muted-foreground font-medium italic">Comme sur WhatsApp</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {loading && <Icon icon="solar:refresh-bold-duotone" className="w-4 h-4 text-amber-600 animate-spin" />}
                                <Switch checked={isNotificationsEnabled} onCheckedChange={handleToggleNotifications} disabled={loading} className="data-[state=checked]:bg-green-500" />
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                            <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-amber-600 shrink-0" />
                            <p className="text-[11px] text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
                                Les notifications de bureau et mobiles vous permettent de rester réactif face à vos clients même lorsque l'application est fermée.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Test des alertes</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={handleTestPush} disabled={isTestingPush || !isNotificationsEnabled} className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-muted/40 border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50">
                                    {isTestingPush ? (
                                        <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin text-primary" />
                                    ) : (
                                        <Icon icon="solar:plain-bold-duotone" className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="text-left">
                                        <span className="block text-xs font-black text-foreground">Test Web Push</span>
                                        <span className="block text-[9px] text-muted-foreground font-bold uppercase">Notification système</span>
                                    </div>
                                </button>

                                <button onClick={handleTestSocket} disabled={isTestingSocket} className="flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-muted/40 border border-border hover:border-secondary/50 hover:bg-secondary/5 transition-all group disabled:opacity-50">
                                    {isTestingSocket ? (
                                        <Icon icon="solar:refresh-bold-duotone" className="w-5 h-5 animate-spin text-secondary" />
                                    ) : (
                                        <Icon icon="solar:flash-bold-duotone" className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                                    )}
                                    <div className="text-left">
                                        <span className="block text-xs font-black text-foreground">Test WebSocket</span>
                                        <span className="block text-[9px] text-muted-foreground font-bold uppercase">Temps réel</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </AccordionSection>

                {/* 4. PRIVACY */}
                <AccordionSection
                    id="privacy"
                    title="Confidentialité & CGU"
                    subtitle="Conditions d'utilisation et protection des données"
                    icon="solar:shield-check-bold-duotone"
                >
                    <div className="space-y-6 pt-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon icon="solar:verified-check-bold-duotone" className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-black text-foreground">Consentement légal</span>
                                    <span className="block text-[10px] text-muted-foreground font-medium italic">Obligatoire pour utiliser les services</span>
                                </div>
                            </div>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Link href="/terms-of-use" className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-all group">
                                <Icon icon="solar:document-text-bold-duotone" className="w-5 h-5 text-primary" />
                                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Conditions d'Utilisation</span>
                                <Icon icon="solar:arrow-right-up-bold" className="w-3 h-3 ml-auto opacity-30 group-hover:opacity-100" />
                            </Link>
                            <Link href="/privacy-policy" className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border hover:border-primary/50 transition-all group">
                                <Icon icon="solar:lock-password-bold-duotone" className="w-5 h-5 text-primary" />
                                <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">Confidentialité</span>
                                <Icon icon="solar:arrow-right-up-bold" className="w-3 h-3 ml-auto opacity-30 group-hover:opacity-100" />
                            </Link>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                            <Icon icon="solar:info-square-bold-duotone" className="w-5 h-5 text-blue-600 shrink-0" />
                            <p className="text-[11px] text-blue-800 dark:text-blue-400 font-medium leading-relaxed">
                                Conformément à la loi n°2013-450 sur la protection des données en Côte d'Ivoire, vos données sont protégées.
                            </p>
                        </div>
                    </div>
                </AccordionSection>

                {/* 5. SUBSCRIPTIONS */}
                <AccordionSection
                    id="subscriptions"
                    title="Mes abonnements"
                    subtitle="Gestion de vos forfaits et renouvellements"
                    icon="solar:bill-list-bold-duotone"
                >
                    <div className="space-y-4 pt-4">
                        {(!user?.subscriptions || user.subscriptions.length === 0) ? (
                            <div className="bg-muted/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/50">
                                <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center text-muted-foreground shadow-sm">
                                    <Icon icon="solar:ghost-bold-duotone" className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-base font-black text-foreground">Aucun plan actif</h3>
                                    <p className="text-xs text-muted-foreground font-medium max-w-[200px]">
                                        Passez au premium pour débloquer toutes les fonctionnalités.
                                    </p>
                                </div>
                                <button onClick={() => router.push('/pricing')} className="bg-primary text-white font-black px-6 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest">
                                    Voir les tarifs
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {user.subscriptions.map((sub, i) => (
                                    <div key={sub.id} className="bg-muted/20 border border-border/50 rounded-2xl p-4 flex flex-col gap-4 hover:border-primary/30 transition-all group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${sub.status === SubscriptionStatus.ACTIVE ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    <Icon icon={sub.status === SubscriptionStatus.ACTIVE ? "solar:verified-check-bold-duotone" : "solar:re-order-bold-duotone"} className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-sm">{sub.plan?.name || "Plan standard"}</h4>
                                                    <span className={`inline-block px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter ${sub.status === SubscriptionStatus.ACTIVE ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                                                        {sub.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (sub.plan) {
                                                        setSelectedPlanToRenew(sub.plan as any);
                                                        setIsSubscriptionModalOpen(true);
                                                    } else {
                                                        router.push('/pricing');
                                                    }
                                                }}
                                                className="px-4 py-2 rounded-lg bg-muted border border-border hover:bg-primary hover:text-white font-black text-[10px] transition-all uppercase tracking-widest whitespace-nowrap"
                                            >
                                                Renouveler
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground border-t border-border/40 pt-3">
                                            <span className="flex items-center gap-1.5">
                                                <Icon icon="solar:calendar-bold-duotone" className="w-3.5 h-3.5" />
                                                Expire le : {format(new Date(sub.endDate), 'dd MMM yyyy', { locale: fr })}
                                            </span>
                                            <button onClick={() => router.push('/pricing')} className="text-primary hover:underline">
                                                Détails
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </AccordionSection>

                {/* 6. DANGER ZONE */}
                <AccordionSection
                    id="danger"
                    title="Zone de danger"
                    subtitle="Actions irréversibles et suspension"
                    icon="solar:shield-warning-bold-duotone"
                    variant="danger"
                >
                    <div className="space-y-5 pt-4">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-600">
                                    <Icon icon="solar:user-block-bold-duotone" className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="block text-sm font-black text-rose-900 dark:text-rose-400">Suspendre mon compte</span>
                                    <span className="block text-[10px] text-rose-700/60 font-medium italic">Action immédiate</span>
                                </div>
                            </div>
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

                        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10 flex gap-3">
                            <Icon icon="solar:info-circle-bold-duotone" className="w-5 h-5 text-rose-600 shrink-0" />
                            <p className="text-[11px] text-rose-800 dark:text-rose-400 font-medium leading-relaxed italic">
                                Note : La suspension désactive votre accès. Vos données sont conservées mais une validation administrative sera requise pour la réactivation.
                            </p>
                        </div>
                    </div>
                </AccordionSection>

            </div>

            {/* MODALS RENDERED OUTSIDE ACCORDION */}
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
        </div>
    );
}
