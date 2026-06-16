"use client";

import { getBaseUrl, secureFetch } from '@/api/api';
import { BaseResponse, Pagination, Boost, BoostPricing, BoostEntityType, BoostPaymentMethod } from '@/types/interface';

export const getBoostPricing = async (): Promise<BaseResponse<BoostPricing>> => {
    const response = await fetch(`${getBaseUrl()}/boosts/pricing`);
    return await response.json();
};

export const createBoost = async (data: {
    entityType: BoostEntityType;
    entityId: string;
    durationDays: number;
    paymentMethod: BoostPaymentMethod;
    proofUrl?: string;
    reference?: string;
    fileId?: string;
}): Promise<BaseResponse<Boost>> => {
    const response = await secureFetch(`${getBaseUrl()}/boosts`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const uploadBoostProof = async (file: File): Promise<BaseResponse<{ url: string; fileId: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await secureFetch(`${getBaseUrl()}/boosts/upload-proof`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};

export const getMyBoosts = async (params?: {
    page?: number;
    limit?: number;
    entityType?: BoostEntityType;
}): Promise<BaseResponse<Pagination<Boost>>> => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    const response = await secureFetch(`${getBaseUrl()}/boosts/my?${qs}`, { method: 'GET' });
    return await response.json();
};
