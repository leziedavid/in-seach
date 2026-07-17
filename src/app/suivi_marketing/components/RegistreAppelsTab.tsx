'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { UsersSubTab } from './UsersSubTab';
import { CallsTab } from './CallsTab';

type SubTabKey = 'users' | 'calls';

const SUB_TABS: { key: SubTabKey; label: string; icon: string }[] = [
    { key: 'users', label: 'Utilisateurs', icon: 'solar:users-group-rounded-bold-duotone' },
    { key: 'calls', label: 'Appels enregistrés', icon: 'solar:notebook-bold-duotone' },
];

export function RegistreAppelsTab() {
    const [subTab, setSubTab] = useState<SubTabKey>('users');

    return (
        <div className="space-y-4">
            <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
                {SUB_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setSubTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                            subTab === tab.key ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        <Icon icon={tab.icon} width={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {subTab === 'users' ? <UsersSubTab /> : <CallsTab />}
        </div>
    );
}
