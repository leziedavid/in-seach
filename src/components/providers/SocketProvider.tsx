'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNotification } from '@/components/toast/NotificationProvider';
import { getUserId } from '@/lib/auth';

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const { showNotification } = useNotification();

    useEffect(() => {
        const userId = getUserId();
        if (!userId) return;

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
            query: { userId },
        });

        // 1. Écouter les notifications globales (Toasts)
        newSocket.on('notification', (data: { title: string; message: string; type?: any }) => {
            showNotification(data.message, data.type || 'info');
        });

        // 2. Écouter les mises à jour de statut pour la synchro UI
        newSocket.on('status_update', (data: any) => {
            // Émettre un événement global pour que les composants puissent se rafraîchir
            const event = new CustomEvent('realtime:status-change', { detail: data });
            window.dispatchEvent(event);
        });

        setSocket(newSocket);

        return () => {
            newSocket.off('notification');
            newSocket.off('status_update');
            newSocket.close();
        };
    }, [showNotification]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
