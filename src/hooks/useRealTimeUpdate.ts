import { useEffect, useRef } from 'react';

/**
 * Hook pour écouter les mises à jour de statut en temps réel.
 * Le callback est stocké dans un ref pour éviter de recréer le listener
 * à chaque render (le listener est recréé uniquement si entityType change).
 */
export const useRealTimeUpdate = (
    entityType: 'Order' | 'Booking' | 'Service' | 'Quote' | 'Delivery' | '*',
    callback: (data: any) => void
) => {
    const callbackRef = useRef(callback);

    // Mettre à jour le ref sans déclencher de re-render
    useEffect(() => {
        callbackRef.current = callback;
    });

    useEffect(() => {
        const handleStatusChange = (event: any) => {
            const data = event.detail;
            if (entityType === '*' || data.entityType === entityType) {
                callbackRef.current(data);
            }
        };

        window.addEventListener('realtime:status-change', handleStatusChange);

        return () => {
            window.removeEventListener('realtime:status-change', handleStatusChange);
        };
    }, [entityType]); // Re-subscribe uniquement si entityType change
};
