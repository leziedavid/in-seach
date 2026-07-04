'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotification } from '@/components/notifications/NotificationProvider';
import { getUserId } from '@/lib/auth';
import { shouldDisplayNotification } from '@/lib/notificationDedup';

interface SocketContextValue {
    socket: Socket | null;
    connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const userId = getUserId();
        if (!userId) return;

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
            query: { userId },
            // [PERF] Reconnexion automatique avec backoff exponentiel (max 30s)
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            // [PERF] Timeout réduit sur connexions lentes (3G/4G)
            timeout: 10000,
            // [PERF] Préférer WebSocket au polling HTTP
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => setConnected(true));
        newSocket.on('disconnect', () => setConnected(false));

        newSocket.on('notification', (data: { title: string; message: string; type?: string }) => {
            // Même évènement potentiellement doublé par le push Firebase (voir webPush.tsx) : dédup par contenu
            if (!shouldDisplayNotification(`${data.title}|${data.message}`)) return;
            showNotification(data.message, (data.type as 'info' | 'success' | 'error' | 'warning') || 'info');
        });

        newSocket.on('status_update', (data: unknown) => {
            window.dispatchEvent(new CustomEvent('realtime:status-change', { detail: data }));
        });

        newSocket.on('FORCE_LOGOUT', (data: { message: string }) => {
            import('@/lib/auth').then(auth => {
                auth.logout();
                showNotification(data.message || 'Votre session a expiré.', 'error');
            });
        });

        socketRef.current = newSocket;

        return () => {
            newSocket.off('connect');
            newSocket.off('disconnect');
            newSocket.off('notification');
            newSocket.off('status_update');
            newSocket.off('FORCE_LOGOUT');
            newSocket.disconnect();
            socketRef.current = null;
        };
    }, [showNotification]);

    return (
        <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
            {children}
        </SocketContext.Provider>
    );
};
