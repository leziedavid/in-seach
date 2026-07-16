"use client";

import { useState } from "react";
import { BookingStatus } from "@/types/interface";
import { updateBookingStatus } from "@/api/api";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { useTranslation } from "@/utils/langue/hooks";
import { ConfirmVariant } from "@/components/ui/ConfirmAction";

export type BookingAction = "validate" | "start" | "finish" | "cancel";

interface ActionConfig {
    status: BookingStatus;
    requiresSubscription: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: ConfirmVariant;
    icon: string;
}

interface ConfirmState {
    isOpen: boolean;
    bookingId: string;
    newStatus: BookingStatus;
    requiresSubscription: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    variant: ConfirmVariant;
    icon: string;
}

interface UseBookingStatusActionOptions {
    onChanged?: () => void;
}

/**
 * Logique partagée de changement de statut d'une réservation (validation, démarrage,
 * fin, annulation) avec confirmation et contrôle d'abonnement.
 * Utilisé par la liste (BookingsPage) et le détail (BookingDetail) pour garantir
 * un comportement strictement identique entre les deux points d'entrée.
 */
export function useBookingStatusAction({ onChanged }: UseBookingStatusActionOptions = {}) {
    const { t } = useTranslation();
    const { showNotification } = useNotification();
    const { checkFeatureAccess, loading: subscriptionLoading } = useSubscriptionCheck();

    const [confirmState, setConfirmState] = useState<ConfirmState>({
        isOpen: false,
        bookingId: "",
        newStatus: BookingStatus.CANCELLED,
        requiresSubscription: false,
        title: "",
        message: "",
        confirmLabel: t("akwaba.bookings.actions.accept"),
        variant: "info",
        icon: "",
    });
    const [isConfirming, setIsConfirming] = useState(false);

    const actionConfig = (action: BookingAction): ActionConfig => {
        switch (action) {
            case "validate":
                return {
                    status: BookingStatus.ACCEPTED,
                    requiresSubscription: true,
                    title: "Valider le rendez-vous",
                    message: "Confirmez-vous la validation de ce rendez-vous ? Le client sera notifié.",
                    confirmLabel: t("akwaba.bookings.actions.accept"),
                    variant: "info",
                    icon: "solar:check-circle-bold-duotone",
                };
            case "start":
                return {
                    status: BookingStatus.IN_PROGRESS,
                    requiresSubscription: true,
                    title: "Démarrer le rendez-vous",
                    message: "Confirmez-vous le démarrage de cette prestation ? Le client sera informé.",
                    confirmLabel: t("akwaba.bookings.actions.start"),
                    variant: "indigo",
                    icon: "solar:play-bold-duotone",
                };
            case "finish":
                return {
                    status: BookingStatus.COMPLETED,
                    requiresSubscription: true,
                    title: "Terminer la prestation",
                    message: "Confirmez-vous la fin de cette prestation ? Le client sera notifié de la complétion.",
                    confirmLabel: t("akwaba.bookings.actions.finish"),
                    variant: "success",
                    icon: "solar:check-read-bold-duotone",
                };
            case "cancel":
            default:
                return {
                    status: BookingStatus.CANCELLED,
                    requiresSubscription: false,
                    title: "Annuler le rendez-vous",
                    message: "Êtes-vous sûr de vouloir annuler ce rendez-vous ? Cette action ne peut pas être défaite.",
                    confirmLabel: t("akwaba.bookings.actions.cancel"),
                    variant: "danger",
                    icon: "solar:close-circle-bold-duotone",
                };
        }
    };

    const requestAction = (bookingId: string, action: BookingAction) => {
        const cfg = actionConfig(action);
        setConfirmState({
            isOpen: true,
            bookingId,
            newStatus: cfg.status,
            requiresSubscription: cfg.requiresSubscription,
            title: cfg.title,
            message: cfg.message,
            confirmLabel: cfg.confirmLabel,
            variant: cfg.variant,
            icon: cfg.icon,
        });
    };

    const closeConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

    const execute = async () => {
        if (isConfirming || !confirmState.isOpen || !confirmState.bookingId) return;
        setIsConfirming(true);
        try {
            if (confirmState.requiresSubscription) {
                const canProceed = await checkFeatureAccess();
                if (!canProceed) return;
            }
            const response = await updateBookingStatus(confirmState.bookingId, confirmState.newStatus);
            if (response.statusCode === 200 || response.statusCode === 201) {
                showNotification(t("akwaba.bookings.success_update"), "success");
                onChanged?.();
            } else {
                showNotification(response.message || t("akwaba.bookings.error_update"), "error");
            }
        } catch (error: any) {
            showNotification(error?.message || "Erreur de connexion", "error");
        } finally {
            setIsConfirming(false);
            closeConfirm();
        }
    };

    return {
        confirmState,
        isConfirming,
        subscriptionLoading,
        requestAction,
        closeConfirm,
        execute,
    };
}
