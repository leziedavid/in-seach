'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { isAuthenticated, logout } from '@/lib/auth';
import { buildMarketingExportUrl } from '@/api/api';
import { OverviewTab } from './components/OverviewTab';
import { RegistreAppelsTab } from './components/RegistreAppelsTab';
import { CampaignsTab } from './components/CampaignsTab';
import { KpiDashboard } from '@/components/analytics/KpiDashboard';

type TabKey = 'overview' | 'calls' | 'campaigns' | 'live-kpi';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: "Vue d'ensemble", icon: 'solar:widget-5-bold-duotone' },
    { key: 'calls', label: 'Registre des appels', icon: 'solar:phone-calling-rounded-bold-duotone' },
    { key: 'campaigns', label: 'Actions & Campagnes', icon: 'solar:megaphone-bold-duotone' },
    { key: 'live-kpi', label: 'Live KPI', icon: 'solar:chart-2-bold-duotone' },
];

export default function SuiviMarketingPage() {
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login');
            return;
        }
        setIsMounted(true);
    }, [router]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setRefreshTrigger((v) => v + 1);
        setTimeout(() => setRefreshing(false), 600);
    }, []);

    if (!isMounted) {
        return <div className="min-h-screen bg-background" />;
    }

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-background p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 lg:mx-24 overflow-x-hidden">
            {/* ── En-tête ─────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:headphones-round-sound-bold-duotone" width={24} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Espace Suivi Marketing &amp; Call Center</h1>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                            Pilotez la relation client et analysez les performances de tous les modules Djamko.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 flex-shrink-0 flex-wrap">
                    <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-xs font-medium text-muted-foreground capitalize">
                        <Icon icon="solar:calendar-mark-bold-duotone" width={14} />
                        {today}
                    </span>

                    <div className="relative">
                        <button
                            onClick={() => setExportOpen((v) => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-border bg-white dark:bg-zinc-900 text-xs font-medium hover:bg-muted transition-colors"
                        >
                            <Icon icon="solar:download-bold-duotone" width={14} />
                            <span className="hidden sm:inline">Exporter les données</span>
                            <Icon icon="solar:alt-arrow-down-bold" width={12} />
                        </button>
                        {exportOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                                <div className="absolute right-0 mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-lg overflow-hidden z-20">
                                    <a
                                        href={buildMarketingExportUrl('csv')}
                                        onClick={() => setExportOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors"
                                    >
                                        <Icon icon="solar:file-text-bold-duotone" width={15} />
                                        Export CSV
                                    </a>
                                    <a
                                        href={buildMarketingExportUrl('xlsx')}
                                        onClick={() => setExportOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium hover:bg-muted transition-colors border-t border-border/50"
                                    >
                                        <Icon icon="solar:file-check-bold-duotone" width={15} />
                                        Export Excel
                                    </a>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex-shrink-0 p-2 rounded-xl border border-border bg-white dark:bg-zinc-900 hover:bg-muted transition-colors"
                        aria-label="Actualiser"
                    >
                        <Icon icon="solar:refresh-bold-duotone" width={16} className={refreshing ? 'animate-spin' : ''} />
                    </button>

                    <button
                        onClick={logout}
                        className="flex-shrink-0 p-2 rounded-xl border border-red-200 dark:border-red-900/40 bg-white dark:bg-zinc-900 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        aria-label="Déconnexion"
                        title="Déconnexion"
                    >
                        <Icon icon="solar:logout-3-bold-duotone" width={16} />
                    </button>
                </div>
            </div>

            {/* ── Onglets ─────────────────────────────────────────── */}
            <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.key ? 'bg-white dark:bg-zinc-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Icon icon={tab.icon} width={15} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Contenu ─────────────────────────────────────────── */}
            <div key={refreshTrigger}>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'calls' && <RegistreAppelsTab />}
                {activeTab === 'campaigns' && <CampaignsTab />}
                {activeTab === 'live-kpi' && <KpiDashboard />}
            </div>
        </div>
    );
}
