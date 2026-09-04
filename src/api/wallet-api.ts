"use client";

import { getBaseUrl, secureFetch } from '@/api/api';
import { BaseResponse, Pagination, Wallet, WalletTransaction, WalletPaymentMethod, WalletTransactionDirection, ServiceFeeConfig, CreateServiceFeeConfigDto, UpdateServiceFeeConfigDto } from '@/types/interface';

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

/* =======================================================
   ADMIN — WALLETS
======================================================= */

export const adminListWallets = async (params?: { page?: number; limit?: number; search?: string }): Promise<BaseResponse<Pagination<Wallet>>> => {
    // `URLSearchParams` sérialise `undefined` en la chaîne littérale "undefined" — on retire
    // donc les clés vides/absentes avant construction, plutôt que de les laisser polluer la
    // recherche côté backend (qui filtrerait alors sur le texte "undefined").
    const cleaned = Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''));
    const qs = new URLSearchParams(cleaned as any).toString();
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets?${qs}`, { method: 'GET' });
    return await response.json();
};

export const adminGetWallet = async (userId: string): Promise<BaseResponse<Wallet>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}`, { method: 'GET' });
    return await response.json();
};

export const adminGetWalletHistory = async (userId: string, params?: { page?: number; limit?: number }): Promise<BaseResponse<Pagination<WalletTransaction>>> => {
    const qs = params ? new URLSearchParams(params as any).toString() : '';
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}/history?${qs}`, { method: 'GET' });
    return await response.json();
};

export const adminRechargeWallet = async (userId: string, data: { amount: number; note?: string }): Promise<BaseResponse<WalletTransaction>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}/recharge`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminAdjustWallet = async (userId: string, data: { amount: number; direction: 'CREDIT' | 'DEBIT'; note: string }): Promise<BaseResponse<WalletTransaction>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}/adjust`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminSuspendWallet = async (userId: string): Promise<BaseResponse<Wallet>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}/suspend`, { method: 'POST' });
    return await response.json();
};

export const adminReactivateWallet = async (userId: string): Promise<BaseResponse<Wallet>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/${userId}/reactivate`, { method: 'POST' });
    return await response.json();
};

export const adminValidateWalletRecharge = async (transactionId: string): Promise<BaseResponse<WalletTransaction>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/recharge/${transactionId}/validate`, { method: 'PATCH' });
    return await response.json();
};

export const adminRejectWalletRecharge = async (transactionId: string, note?: string): Promise<BaseResponse<WalletTransaction>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/wallets/recharge/${transactionId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ note }),
    });
    return await response.json();
};

/* =======================================================
   ADMIN — SERVICE FEES CONFIG (moteur de facturation)
======================================================= */

export const adminListServiceFees = async (): Promise<BaseResponse<ServiceFeeConfig[]>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees`, { method: 'GET' });
    return await response.json();
};

export const adminCreateServiceFee = async (data: CreateServiceFeeConfigDto): Promise<BaseResponse<ServiceFeeConfig>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminUpdateServiceFee = async (id: string, data: UpdateServiceFeeConfigDto): Promise<BaseResponse<ServiceFeeConfig>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return await response.json();
};

export const adminActivateServiceFee = async (id: string): Promise<BaseResponse<ServiceFeeConfig>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees/${id}/activate`, { method: 'PATCH' });
    return await response.json();
};

export const adminDeactivateServiceFee = async (id: string): Promise<BaseResponse<ServiceFeeConfig>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees/${id}/deactivate`, { method: 'PATCH' });
    return await response.json();
};

export const adminDeleteServiceFee = async (id: string): Promise<BaseResponse<null>> => {
    const response = await secureFetch(`${getBaseUrl()}/admin/service-fees/${id}`, { method: 'DELETE' });
    return await response.json();
};
