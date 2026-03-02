import axios from 'axios';
import { getToken, logout } from '@/lib/auth';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
});

// Interceptor for adding token to requests
api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor for handling token expiration
api.interceptors.response.use(
    (response) => response.data,
    async (error) => {
        if (error.response?.status === 401) {
            logout();
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const scanBookingQr = (qrCode: string) => api.post('/bookings/scan-qr', { qrCode });

export default api;
