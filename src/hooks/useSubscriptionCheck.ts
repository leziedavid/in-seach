import { useState, useCallback } from 'react';
import { isSubscriptionSystemEnabled, getSubscriptionStatus } from '@/api/api';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { useRouter } from 'next/navigation';

export interface SubscriptionCheck {
    canCreate: boolean;
    message?: string;
    loading: boolean;
}

export const useSubscriptionCheck = () => {

    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const router = useRouter();

    /**
     * Vérifie uniquement l'accès à une fonctionnalité (ex: valider une commande, changer le statut
     * d'un rendez-vous) SANS vérifier les quotas ou limites du plan.
     *
     * Logique :
     * 1. Si le système d'abonnement est désactivé → autoriser
     * 2. Si l'utilisateur a un abonnement actif (ou est premium) → autoriser
     * 3. Sinon → bloquer avec message explicite
     *
     * Utilisé dans : Commandes.tsx (ownsSomeProducts), BookingsPage.tsx (isBookingProvider)
     */
    const checkFeatureAccess = useCallback(async (): Promise<boolean> => {
        try {
            setLoading(true);

            // 1. Vérifier si le système d'abonnement est activé
            const systemRes = await isSubscriptionSystemEnabled();
            if (systemRes.statusCode !== 200 || !systemRes.data) {
                // Système désactivé → accès libre, comportement normal conservé
                return true;
            }

            // 2. Système activé → vérifier l'abonnement de l'utilisateur
            const statusRes = await getSubscriptionStatus();

            if (statusRes.statusCode !== 200) {
                showNotification("Veuillez vous connecter pour continuer.", "error");
                router.push('/login');
                return false;
            }

            const { isActive, isPremium } = statusRes.data;

            // Utilisateur premium → accès illimité
            if (isPremium) return true;

            if (!isActive) {
                showNotification("Votre abonnement est expiré ou inexistant. Veuillez renouveler votre abonnement pour continuer.", "error");
                router.push('/pricing');
                return false;
            }

            // Abonnement actif → autoriser (sans vérification de quota)
            return true;

        } catch (error) {
            console.error("Error checking feature access:", error);
            showNotification("Erreur lors de la vérification de l'abonnement.", "error");
            return false;
        } finally {
            setLoading(false);
        }
    }, [showNotification, router]);

    const checkEligibility = useCallback(async (entityName: 'Product' | 'Service' | 'Annonce' | 'LogisticService' | 'Live' | 'GasBottle' | 'Garage' | 'GaragePiece'): Promise<boolean> => {
        try {
            setLoading(true);

            // 1. Check if system is enabled
            const systemRes = await isSubscriptionSystemEnabled();
            if (systemRes.statusCode !== 200 || !systemRes.data) {
                // System is disabled, anyone can create
                return true;
            }

            // 2. System is enabled, check user subscription
            const statusRes = await getSubscriptionStatus();

            if (statusRes.statusCode !== 200) {
                showNotification("Veuillez vous connecter pour continuer", "error");
                router.push('/login');
                return false;
            }

            const { plan, stats, isActive } = statusRes.data;

            if (!isActive) {
                showNotification("Votre abonnement est expiré ou inexistant.", "error");
                router.push('/pricing');
                return false;
            }

            if (!plan) {
                showNotification("Aucun plan actif trouvé.", "error");
                router.push('/pricing');
                return false;
            }

            // 3. Check if entity is controlled by this plan
            const isEntityControlled = plan.entities?.some((e: any) => e.entityName === entityName);
            if (!isEntityControlled) {
                // If not controlled, it's free/unlimited for this plan
                return true;
            }

            // 4. Check limits
            const limit = plan.serviceLimit || 0; // Default limit
            let currentCount = 0;

            if (entityName === 'Product') currentCount = stats.totalProducts;
            if (entityName === 'Service') currentCount = stats.totalServices;
            if (entityName === 'Annonce') currentCount = stats.totalAnnonces;
            if (entityName === 'LogisticService') currentCount = stats.totalLogisticServices;
            if (entityName === 'Live') currentCount = stats.totalLives;
            if (entityName === 'GasBottle') currentCount = stats.totalGasBottles;
            if (entityName === 'Garage') currentCount = stats.totalGarages;
            if (entityName === 'GaragePiece') currentCount = stats.totalGaragePieces;

            if (limit !== 999999 && currentCount >= limit) {
                showNotification(`Vous avez atteint la limite de votre plan (${limit} ${entityName}s). Veuillez passer au plan supérieur.`, "warning");
                router.push('/pricing');
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error checking subscription:", error);
            showNotification("Erreur lors de la vérification de l'abonnement", "error");
            return false;
        } finally {
            setLoading(false);
        }
    }, [showNotification, router]);

    return { checkEligibility, checkFeatureAccess, loading };
};
