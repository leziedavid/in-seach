"use client";

import { setCookie, deleteCookie } from '@/lib/cookies';

/**
 * Interface representing the Decoded JWT Token payload
 */
export interface DecodedToken {
    sub: string;       // userId
    email: string;
    role: string;
    fullName: string | null;
    phone: string | null;
    exp: number;       // expiration timestamp
}

/**
 * Basic JWT decoding function using atob
 * (SSR Safe)
 */
export const decodeToken = (token: string): DecodedToken | null => {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('Erreur lors du décodage du token:', e);
        return null;
    }
};

/**
 * GETTERS
 */

export const getToken = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
};

export const getUserName = (): string | null => {
    if (typeof window === 'undefined') return null;
    // Try to get from localStorage first (for speed/manual sets)
    const name = localStorage.getItem('fullName');
    if (name) return name;

    // Fallback to decoding the token
    const token = getToken();
    if (token) {
        const decoded = decodeToken(token);
        return decoded?.fullName || null;
    }
    return null;
};

export const getUserRole = (): string | null => {
    if (typeof window === 'undefined') return null;
    const role = localStorage.getItem('role');
    if (role) return role;

    const token = getToken();
    if (token) {
        const decoded = decodeToken(token);
        return decoded?.role || null;
    }
    return null;
};

export const getUserId = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = getToken();
    if (token) {
        const decoded = decodeToken(token);
        return decoded?.sub || null;
    }
    return null;
};

export const getUserEmail = (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = getToken();
    if (token) {
        const decoded = decodeToken(token);
        return decoded?.email || null;
    }
    return null;
};

export const getUserPhone = (): string | null => {
    if (typeof window === 'undefined') return null;
    const phone = localStorage.getItem('phone');
    if (phone) return phone;

    const token = getToken();
    if (token) {
        const decoded = decodeToken(token);
        return decoded?.phone || null;
    }
    return null;
};

/**
 * SETTERS
 */

export const setToken = (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', token);
    setCookie('token', token, 7); // Synchronisation avec le cookie pour le SSR

    // Auto-decode and sync key fields to localStorage for easy access
    const decoded = decodeToken(token);
    if (decoded) {
        if (decoded.fullName) localStorage.setItem('fullName', decoded.fullName);
        if (decoded.role) localStorage.setItem('role', decoded.role);
        if (decoded.phone) localStorage.setItem('phone', decoded.phone);
    }
};

export const setUserName = (name: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('fullName', name);
};

/**
 * UTILS
 */

export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;

    const decoded = decodeToken(token);
    if (!decoded) return false;

    // Check expiration
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
};

export const logout = () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    localStorage.removeItem('phone');
    deleteCookie('token'); // Supprimer le cookie
    // Optional: window.location.href = '/login';
};
