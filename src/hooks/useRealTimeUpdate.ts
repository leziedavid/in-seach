import { useEffect } from 'react';

/**
 * Hook pour écouter les mises à jour de statut en temps réel
 * et déclencher un rafraîchissement des données du composant.
 */
export const useRealTimeUpdate = (
    entityType: 'Order' | 'Booking' | 'Service' | 'Quote' | 'Delivery' | '*',
    callback: (data: any) => void
) => {
    useEffect(() => {
        const handleStatusChange = (event: any) => {
            const data = event.detail;
            
            // Si le type d'entité correspond ou si on écoute tout (*)
            if (entityType === '*' || data.entityType === entityType) {
                callback(data);
            }
        };

        window.addEventListener('realtime:status-change', handleStatusChange);

        return () => {
            window.removeEventListener('realtime:status-change', handleStatusChange);
        };
    }, [entityType, callback]);
};
