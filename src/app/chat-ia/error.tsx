'use client';

import { useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';

export default function ChatError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('Chat page error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8 text-center">
            <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center">
                <Icon icon="solar:chat-round-dots-bold-duotone" className="text-red-400 w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-sm">
                <h2 className="text-xl font-bold">La messagerie ne répond pas</h2>
                <p className="text-sm text-muted-foreground">Une erreur s'est produite lors du chargement de vos messages. Vérifiez votre connexion et réessayez.</p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={reset}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition active:scale-95"
                >
                    Réessayer
                </button>
                <Link href="/" className="px-5 py-2.5 rounded-xl font-bold text-sm border border-border hover:bg-muted transition active:scale-95">
                    Accueil
                </Link>
            </div>
        </div>
    );
}
