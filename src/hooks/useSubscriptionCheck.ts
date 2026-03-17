import { useState, useCallback } from 'react';
import { isSubscriptionSystemEnabled, getSubscriptionStatus } from '@/api/api';
import { useNotification } from '@/components/toast/NotificationProvider';
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

    const checkEligibility = useCallback(async (entityName: 'Product' | 'Service' | 'Annonce'): Promise<boolean> => {
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

    return { checkEligibility, loading };
};
