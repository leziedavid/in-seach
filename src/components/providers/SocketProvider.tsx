'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getUserId } from '@/lib/auth';

const SocketContext = createContext<{ socket: Socket | null }>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const userId = getUserId();

        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
            query: { userId },
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
