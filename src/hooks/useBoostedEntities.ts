"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyBoosts } from "@/api/boost-api";
import { Boost, BoostEntityType } from "@/types/interface";

/**
 * Hook mutualisé : récupère les boosts de l'utilisateur connecté pour un type
 * d'entité donné (PRODUCT, SERVICE, ANNONCE, LOGISTIC_SERVICE).
 *
 * Réutilise l'authentification déjà en place (secureFetch lit le cookie token)
 * et le contrôleur backend existant GET /boosts/my — aucune nouvelle API requise.
 */
export function useBoostedEntities(entityType: BoostEntityType, limit = 9) {
    const [boosts, setBoosts] = useState<Boost[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchBoosted = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMyBoosts({ page, limit, entityType });
            if (res.statusCode === 200 && res.data) {
                setBoosts(res.data.data ?? []);
                setTotal(res.data.total ?? 0);
                setTotalPages(res.data.totalPages ?? 0);
            }
        } finally {
            setLoading(false);
        }
    }, [page, limit, entityType]);

    useEffect(() => {
        fetchBoosted();
    }, [fetchBoosted]);

    return { boosts, loading, page, setPage, total, totalPages, refetch: fetchBoosted };
}
