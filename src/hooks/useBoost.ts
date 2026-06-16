"use client";

import { useState, useCallback, useRef } from "react";
import { getBoostPricing, createBoost, uploadBoostProof, getMyBoosts } from "@/api/boost-api";
import { Boost, BoostEntityType, BoostPaymentMethod, BoostPricing } from "@/types/interface";

export function useBoost() {
    const [pricing, setPricing] = useState<BoostPricing | null>(null);
    const [myBoosts, setMyBoosts] = useState<Boost[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [uploading, setUploading] = useState(false);
    const pendingFileId = useRef<string | null>(null);

    const fetchPricing = useCallback(async () => {
        const res = await getBoostPricing();
        if (res.statusCode === 200 && res.data) setPricing(res.data);
    }, []);

    const fetchMyBoosts = useCallback(async (entityType?: BoostEntityType) => {
        setLoading(true);
        try {
            const res = await getMyBoosts({ page: 1, limit: 50, entityType });
            if (res.statusCode === 200) setMyBoosts(res.data?.data ?? []);
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadProof = useCallback(async (file: File): Promise<string | null> => {
        setUploading(true);
        try {
            const res = await uploadBoostProof(file);
            if (res.statusCode === 200 && res.data?.url) {
                pendingFileId.current = res.data.fileId ?? null;
                return res.data.url;
            }
            return null;
        } finally {
            setUploading(false);
        }
    }, []);

    const boost = useCallback(async (params: {
        entityType: BoostEntityType;
        entityId: string;
        durationDays: number;
        paymentMethod: BoostPaymentMethod;
        proofUrl?: string;
        reference?: string;
    }): Promise<boolean> => {
        setCreating(true);
        try {
            const res = await createBoost({ ...params, fileId: pendingFileId.current ?? undefined });
            if (res.statusCode === 201 || res.statusCode === 200) {
                pendingFileId.current = null;
                return true;
            }
            return false;
        } finally {
            setCreating(false);
        }
    }, []);

    return { pricing, myBoosts, loading, creating, uploading, fetchPricing, fetchMyBoosts, uploadProof, boost };
}
