'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { marketingGetCampaigns } from '@/api/api';
import { CampaignLaunchModal } from './CampaignLaunchModal';

interface CampaignRun {
    id: string;
    targetCount: number;
    successCount: number;
    status: string;
    createdAt: string;
    completedAt?: string | null;
}

interface Campaign {
    actionKey: string;
    label: string;
    channel: 'PUSH' | 'WHATSAPP' | 'SMS' | 'EMAIL';
    channelAvailable: boolean;
    defaultMessage: string;
    targetCount: number;
    lastRun: CampaignRun | null;
}

const ACTION_ICONS: Record<string, string> = {
    ABANDONED_CART_RELAUNCH: 'solar:cart-large-4-bold-duotone',
    PUSH_NOTIFICATION: 'solar:bell-bing-bold-duotone',
    SMS_CAMPAIGN: 'solar:smartphone-bold-duotone',
    WHATSAPP_CAMPAIGN: 'mdi:whatsapp',
    EMAIL_CAMPAIGN: 'solar:letter-bold-duotone',
    INACTIVE_SELLERS: 'solar:shop-2-bold-duotone',
    GAS_PROVIDERS: 'mdi:propane-tank',
    NEW_USERS: 'solar:user-plus-rounded-bold-duotone',
    LIVE_SHOPPING_CAMPAIGN: 'solar:play-circle-bold-duotone',
};

const CHANNEL_LABELS: Record<string, string> = {
    PUSH: 'Push',
    WHATSAPP: 'WhatsApp',
    SMS: 'SMS',
    EMAIL: 'Email',
};

const CHANNEL_COLORS: Record<string, string> = {
    PUSH: '#3B82F6',
    WHATSAPP: '#10B981',
    SMS: '#F59E0B',
    EMAIL: '#8B5CF6',
};

function CampaignCard({ campaign, onLaunched }: { campaign: Campaign; onLaunched: () => void }) {
    const [modalOpen, setModalOpen] = useState(false);
    const color = CHANNEL_COLORS[campaign.channel] ?? '#3B82F6';

    const progressPct = campaign.lastRun && campaign.lastRun.targetCount > 0
        ? Math.round((campaign.lastRun.successCount / campaign.lastRun.targetCount) * 100)
        : 0;

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}18` }}>
                    <Icon icon={ACTION_ICONS[campaign.actionKey] ?? 'solar:megaphone-bold-duotone'} width={22} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight">{campaign.label}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground mt-1">
                        <Icon icon="solar:users-group-rounded-bold-duotone" width={12} />
                        {campaign.targetCount} personne{campaign.targetCount > 1 ? 's' : ''} concernée{campaign.targetCount > 1 ? 's' : ''}
                    </span>
                </div>
                {!campaign.channelAvailable && (
                    <span className="text-[9px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 whitespace-nowrap">
                        Bientôt dispo
                    </span>
                )}
            </div>

            {/* État / progression */}
            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{CHANNEL_LABELS[campaign.channel]}</span>
                    <span>
                        {campaign.lastRun
                            ? `Dernier envoi : ${campaign.lastRun.successCount}/${campaign.lastRun.targetCount}`
                            : 'Jamais lancée'}
                    </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${campaign.lastRun ? progressPct : 0}%`, backgroundColor: color }} />
                </div>
            </div>

            {/* Action */}
            <button
                onClick={() => setModalOpen(true)}
                disabled={!campaign.channelAvailable}
                className="h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
                <Icon icon="solar:play-bold" width={13} />
                Lancer l&apos;action
            </button>

            <CampaignLaunchModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                actionKey={campaign.actionKey}
                campaignLabel={campaign.label}
                defaultBody={campaign.defaultMessage}
                onLaunched={onLaunched}
            />
        </div>
    );
}

export function CampaignsTab() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await marketingGetCampaigns();
            setCampaigns(Array.isArray(res.data) ? res.data : []);
        } catch {
            /* ignore */
        }
        setLoading(false);
    }, []);

    useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-5 h-40 animate-pulse" />
                ))}
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-border p-10 flex flex-col items-center justify-center text-center gap-2">
                <Icon icon="solar:megaphone-bold-duotone" width={32} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Aucune action marketing disponible</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
                <CampaignCard key={c.actionKey} campaign={c} onLaunched={fetchCampaigns} />
            ))}
        </div>
    );
}
