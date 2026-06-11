"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Modal } from "@/components/ui/MotionModal";
import { createLive, updateLive } from "@/api/api";
import { Live, LiveEntityType } from "@/types/interface";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { Button } from "@/components/ui/button";

interface LiveFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    /** Live à éditer (mode édition) */
    editingLive?: Live | null;
    /** Entité pré-remplie depuis un composant parent (Produit, Service, Annonce…) */
    defaultEntityType?: LiveEntityType;
    defaultEntityId?: string;
    /**
     * Si true → le sélecteur d'entité est masqué car l'entité est connue
     * et l'utilisateur n'a pas à la choisir manuellement.
     */
    lockedEntity?: boolean;
    /** Nom affiché dans le header pour contextualiser ("ce produit", "ce service"…) */
    entityLabel?: string;
}

const ENTITY_TYPE_OPTIONS = [
    { value: "", label: "Aucune (promo boutique générale)", icon: "solar:shop-bold-duotone" },
    { value: LiveEntityType.PRODUCT, label: "Produit", icon: "solar:box-bold-duotone" },
    { value: LiveEntityType.SERVICE, label: "Service", icon: "solar:widget-bold-duotone" },
    { value: LiveEntityType.ANNONCE, label: "Annonce", icon: "solar:eye-bold-duotone" },
    { value: LiveEntityType.SERVICE_LOGISTIQUE, label: "Service Logistique", icon: "solar:delivery-bold-duotone" },
    { value: LiveEntityType.PROFILE, label: "Profil", icon: "solar:user-bold-duotone" },
];

const VIDEO_SOURCE_HINTS = [
    { icon: "mdi:tiktok", label: "TikTok" },
    { icon: "mdi:instagram", label: "Instagram Reels" },
    { icon: "mdi:facebook", label: "Facebook Reels" },
    { icon: "mdi:youtube", label: "YouTube Shorts" },
];

export default function LiveFormModal({
    isOpen,
    onClose,
    onSuccess,
    editingLive,
    defaultEntityType,
    defaultEntityId,
    lockedEntity = false,
    entityLabel,
}: LiveFormModalProps) {
    const { showNotification } = useNotification();
    const { checkFeatureAccess, loading: subscriptionLoading } = useSubscriptionCheck();

    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        videoLink: "",
        entityType: (defaultEntityType as string) ?? "",
        entityId: defaultEntityId ?? "",
    });

    // Synchroniser le formulaire lorsque les props changent (réutilisation depuis plusieurs composants)
    useEffect(() => {
        setForm({
            title: editingLive?.title ?? "",
            description: editingLive?.description ?? "",
            videoLink: editingLive?.videoLink ?? "",
            entityType: (editingLive?.entityType as string) ?? (defaultEntityType as string) ?? "",
            entityId: editingLive?.entityId ?? defaultEntityId ?? "",
        });
    }, [isOpen, editingLive, defaultEntityType, defaultEntityId]);

    const isEditing = !!editingLive;
    const handleChange = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async () => {
        if (!form.title.trim()) { showNotification("Le titre est requis.", "error"); return; }
        if (!form.videoLink.trim()) { showNotification("Le lien vidéo est requis.", "error"); return; }

        // Vérification abonnement pour la création
        if (!isEditing) {
            const canProceed = await checkFeatureAccess();
            if (!canProceed) return;
        }

        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim() || undefined,
                videoLink: form.videoLink.trim(),
                entityType: (form.entityType as LiveEntityType) || undefined,
                entityId: form.entityId.trim() || undefined,
            };

            const res = isEditing
                ? await updateLive(editingLive!.id, payload)
                : await createLive(payload);

            if (res.statusCode === 200 || res.statusCode === 201) {
                showNotification(
                    isEditing
                        ? "Live mis à jour — en attente de modération."
                        : "Live soumis — il sera visible après validation.",
                    "success"
                );
                onSuccess();
                onClose();
            } else {
                showNotification(res.message || "Erreur lors de la sauvegarde.", "error");
            }
        } catch {
            showNotification("Erreur de connexion.", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="w-full max-w-lg p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon icon="solar:videocamera-bold-duotone" className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-foreground">
                            {isEditing ? "Modifier le Live" : "Publier un Live"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {lockedEntity && entityLabel
                                ? `Ce Live sera associé à "${entityLabel}"`
                                : "Collez le lien de votre vidéo TikTok, Instagram, Facebook ou YouTube"}
                        </p>
                    </div>
                </div>

                {/* Tag entité verrouillée */}
                {lockedEntity && defaultEntityType && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                        <Icon icon="solar:link-bold-duotone" className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-primary">
                            Associé automatiquement à ce {
                                defaultEntityType === LiveEntityType.PRODUCT ? "produit" :
                                defaultEntityType === LiveEntityType.SERVICE ? "service" :
                                defaultEntityType === LiveEntityType.ANNONCE ? "annonce" :
                                defaultEntityType === LiveEntityType.SERVICE_LOGISTIQUE ? "service logistique" :
                                "élément"
                            }
                        </span>
                    </div>
                )}

                {/* Sources compatibles */}
                <div className="flex items-center gap-2 flex-wrap">
                    {VIDEO_SOURCE_HINTS.map(s => (
                        <span key={s.label} className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                            <Icon icon={s.icon} className="w-3.5 h-3.5" />
                            {s.label}
                        </span>
                    ))}
                </div>

                {/* Titre */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Titre *</label>
                    <input
                        value={form.title}
                        onChange={e => handleChange("title", e.target.value)}
                        placeholder="Ex : Le secret des poses qui tiennent tout le week-end !"
                        className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                    />
                </div>

                {/* Lien vidéo */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Lien de la vidéo *</label>
                    <div className="relative">
                        <Icon icon="solar:link-bold-duotone" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            value={form.videoLink}
                            onChange={e => handleChange("videoLink", e.target.value)}
                            placeholder="https://www.tiktok.com/@user/video/..."
                            className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition"
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        TikTok, Instagram Reels, Facebook Reels, YouTube Shorts
                    </p>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                        Description <span className="font-normal text-muted-foreground">(optionnelle)</span>
                    </label>
                    <textarea
                        value={form.description}
                        onChange={e => handleChange("description", e.target.value)}
                        placeholder="Décrivez votre vidéo..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition resize-none"
                    />
                </div>

                {/* Sélecteur d'entité — masqué si entité verrouillée */}
                {!lockedEntity && (
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-foreground">
                            Associer à <span className="font-normal text-muted-foreground">(optionnel)</span>
                        </label>
                        <select
                            value={form.entityType}
                            onChange={e => handleChange("entityType", e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:border-primary transition"
                        >
                            {ENTITY_TYPE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        {form.entityType && form.entityType !== "" && (
                            <input
                                value={form.entityId}
                                onChange={e => handleChange("entityId", e.target.value)}
                                placeholder={`ID du ${form.entityType.toLowerCase()} concerné`}
                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition mt-2"
                            />
                        )}
                    </div>
                )}

                {/* Info modération */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                    <Icon icon="solar:info-circle-bold-duotone" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                        Votre vidéo sera soumise à modération avant publication dans le feed.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-xl h-10"
                        onClick={onClose}
                        disabled={saving || subscriptionLoading}
                    >
                        Annuler
                    </Button>
                    <Button
                        className="flex-1 rounded-xl h-10 bg-primary hover:bg-primary/90 font-black"
                        onClick={handleSubmit}
                        disabled={saving || subscriptionLoading}
                    >
                        {saving || subscriptionLoading ? (
                            <><Icon icon="line-md:loading-twotone-loop" className="w-4 h-4 mr-2" />
                                {saving ? "Envoi..." : "Vérification..."}</>
                        ) : (
                            <><Icon icon="solar:videocamera-bold-duotone" className="w-4 h-4 mr-2" />
                                {isEditing ? "Mettre à jour" : "Publier"}</>
                        )}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
