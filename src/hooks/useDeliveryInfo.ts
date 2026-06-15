"use client";

import { useState, useCallback } from "react";
import { getDeliveryInfo, updateDeliveryInfo } from "@/api/api";

export interface DeliveryInfo {
    fullName: string;
    phone: string;
    usePersonalPhone: boolean;
    deliveryPhone: string;
    address: string;
    city: string;
    district: string;
    landmark: string;
    instructions: string;
    latitude: number | null;
    longitude: number | null;
}

const EMPTY: DeliveryInfo = {
    fullName: "",
    phone: "",
    usePersonalPhone: false,
    deliveryPhone: "",
    address: "",
    city: "",
    district: "",
    landmark: "",
    instructions: "",
    latitude: null,
    longitude: null,
};

export function hasMinimalDeliveryInfo(info: DeliveryInfo | null): boolean {
    if (!info) return false;
    return !!(info.fullName?.trim() && info.phone?.trim() && info.address?.trim() && info.city?.trim());
}

export function useDeliveryInfo() {
    const [info, setInfo] = useState<DeliveryInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetch = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getDeliveryInfo();
            if (res.statusCode === 200) setInfo(res.data ?? EMPTY);
        } finally {
            setLoading(false);
        }
    }, []);

    const save = useCallback(async (data: Partial<DeliveryInfo>) => {
        setSaving(true);
        try {
            const res = await updateDeliveryInfo({
                deliveryFullName: data.fullName,
                deliveryPhone: data.usePersonalPhone ? undefined : data.deliveryPhone,
                usePersonalPhone: data.usePersonalPhone,
                deliveryAddress: data.address,
                deliveryCity: data.city,
                deliveryDistrict: data.district,
                deliveryLandmark: data.landmark,
                deliveryInstructions: data.instructions,
            });
            if (res.statusCode === 200) {
                setInfo(res.data);
                return true;
            }
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    return { info, loading, saving, fetch, save };
}
