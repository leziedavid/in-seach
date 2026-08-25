"use client";

import { getBaseUrl, secureFetch } from '@/api/api';
import { BaseResponse, Pagination, Wallet, WalletTransaction, WalletPaymentMethod, WalletTransactionDirection } from '@/types/interface';

export const getMyWallet = async (): Promise<BaseResponse<Wallet>> => {
    const response = await secureFetch(`${getBaseUrl()}/wallet`, { method: 'GET' });
    return await response.json();
};

export const getWalletHistory = async (params?: {
    page?: number;
    limit?: number;
    direction?: WalletTransactionDirection;
}): Promise<BaseResponse<Pagination<WalletTransaction>>> => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    const response = await secureFetch(`${getBaseUrl()}/wallet/history?${qs}`, { method: 'GET' });
    return await response.json();
};

export const checkWalletBalance = async (
    amount: number,
): Promise<BaseResponse<{ sufficient: boolean; balance: number; shortfall: number }>> => {
    const response = await secureFetch(`${getBaseUrl()}/wallet/check-balance`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
    });
    return await response.json();
};

export const rechargeWallet = async (data: {
    amount: number;
    paymentMethod: WalletPaymentMethod;
    proofUrl?: string;
    reference?: string;
    fileId?: string;
}): Promise<BaseResponse<WalletTransaction>> => {
    const response = await secureFetch(`${getBaseUrl()}/wallet/recharge`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const uploadWalletRechargeProof = async (file: File): Promise<BaseResponse<{ url: string; fileId: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await secureFetch(`${getBaseUrl()}/wallet/recharge/upload-proof`, {
        method: 'POST',
        body: formData,
    });
    return await response.json();
};
