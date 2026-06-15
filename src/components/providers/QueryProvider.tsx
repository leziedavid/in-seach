'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // [PERF] Données fraîches pendant 5 min, pas de re-fetch inutile
                staleTime: 5 * 60 * 1000,
                // [PERF] Cache conservé 10 min après démontage du composant
                gcTime: 10 * 60 * 1000,
                // [PERF] Pas de re-fetch au focus fenêtre (réduit les requêtes mobiles)
                refetchOnWindowFocus: false,
                // [PERF] Pas de re-fetch à la reconnexion réseau sauf si données périmées
                refetchOnReconnect: 'always',
                // [PERF] 1 seul retry au lieu de 3 (erreurs réseau 3G/4G)
                retry: 1,
                retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
            },
            mutations: {
                // [PERF] Mutations : pas de retry par défaut (idempotence non garantie)
                retry: 0,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
