'use client';

import React from 'react';
import AiToolsPage from '@/components/ai/sections/AiToolsPage';

export default function AdminAiPage() {
    return (
        <div className="p-4 md:p-6 space-y-4">
            <div>
                <h1 className="text-xl font-bold text-foreground">AI Tools</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Liste et teste les outils IA exposés par le serveur MCP de Djamko.
                </p>
            </div>
            <AiToolsPage />
        </div>
    );
}
