'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from "@/utils/langue/hooks";
import { isAuthenticated, getUserName, getUserSpaceRoute } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { AuthorizationNode } from '@/types/interface';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface MenuItem {
    label: string;
    icon: string;
    href: string;
}

/* ─────────────────────────────────────────────────────────────
   Menu groupé — construit dynamiquement à partir des Authorization RBAC
   (préfixes ADMIN_ / MARKETING_, voir backend/prisma/seed-rbac.ts) déjà
   filtrées côté serveur selon les policies de l'utilisateur connecté.
   Remplace l'ancien MENU_GROUPS codé en dur.
───────────────────────────────────────────────────────────── */
const ADMIN_MENU_PREFIXES = ['ADMIN_', 'MARKETING_'];

function buildMenuGroups(authorizations: AuthorizationNode[]): { title?: string; items: MenuItem[] }[] {
    const relevant = authorizations.filter(a => ADMIN_MENU_PREFIXES.some(p => a.code.startsWith(p)));
    const byCategory = new Map<string, MenuItem[]>();
    for (const a of relevant) {
        const cat = a.category || 'Autres';
        if (!byCategory.has(cat)) byCategory.set(cat, []);
        byCategory.get(cat)!.push({
            label: a.name,
            icon: a.icon || 'solar:widget-5-bold-duotone',
            href: a.frontendRoute || '/admin',
        });
    }
    return Array.from(byCategory.entries()).map(([category, items]) => ({
        title: category === 'Tableau de bord' ? undefined : category,
        items,
    }));
}

/* ─────────────────────────────────────────────────────────────
   renderMobileRow — copie exacte du style Sidebar.tsx akwaba
───────────────────────────────────────────────────────────── */
function MenuItem({
    item,
    isActive,
    onNavigate,
}: {
    item: MenuItem;
    isActive: boolean;
    onNavigate?: () => void;
}) {
    return (
        <Link href={item.href} onClick={onNavigate} className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-muted/60 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-primary/15' : 'bg-muted dark:bg-zinc-700/60'}`}>
                <Icon icon={item.icon} width={19} className={isActive ? 'text-primary' : 'text-foreground/70'} />
            </div>
            <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {item.label}
                </p>
            </div>
            <Icon icon="solar:alt-arrow-right-bold" className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
        </Link>
    );
}

/* ─────────────────────────────────────────────────────────────
   Contenu sidebar — partagé desktop + mobile (identique Sidebar.tsx)
───────────────────────────────────────────────────────────── */
function SidebarContent({ pathname, menuGroups, onNavigate }: { pathname: string; menuGroups: { title?: string; items: MenuItem[] }[]; onNavigate?: () => void }) {
    return (
        <div className="flex-1 px-3 pb-4 space-y-2 overflow-y-auto scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {menuGroups.map((group, gi) => {
                if (group.title) {
                    return (
                        <div key={gi}>
                            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.16em] px-2 mb-1.5 mt-2">
                                {group.title}
                            </p>
                            <div className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                                {group.items.map((item, idx) => (
                                    <React.Fragment key={item.href}>
                                        <MenuItem item={item} isActive={pathname === item.href} onNavigate={onNavigate} />
                                        {idx < group.items.length - 1 && <div className="h-px bg-border/40 mx-4" />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                }
                return (
                    <div key={gi} className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                        {group.items.map((item, idx) => (
                            <React.Fragment key={item.href}>
                                <MenuItem item={item} isActive={pathname === item.href} onNavigate={onNavigate} />
                                {idx < group.items.length - 1 && <div className="h-px bg-border/40 mx-4" />}
                            </React.Fragment>
                        ))}
                    </div>
                );
            })}

            {/* Quitter l'admin — style bouton logout Sidebar.tsx */}
            <div className="bg-muted/40 dark:bg-zinc-800/40 rounded-2xl overflow-hidden border border-border/40">
                <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-red-50/60 dark:active:bg-red-900/20 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                        <Icon icon="solar:logout-bold-duotone" width={19} className="text-red-500" />
                    </div>
                    <span className="flex-1 text-left text-sm font-semibold text-red-500">Quitter l'admin</span>
                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-red-400/60 shrink-0" />
                </Link>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   Layout principal
───────────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [open, setOpen] = React.useState(false);
    const [isMounted, setIsMounted] = React.useState(false);
    const [authChecked, setAuthChecked] = React.useState(false);

    const authorizations = useAuthStore(s => s.authorizations);
    const roles = useAuthStore(s => s.roles);
    const hydrated = useAuthStore(s => s.hydrated);
    const hydrate = useAuthStore(s => s.hydrate);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // Garde d'accès /admin/* — auparavant absente (n'importe quel utilisateur pouvait
    // atteindre cet écran côté client). Redirige les non-connectés vers /login et les
    // utilisateurs sans rôle dynamique ADMIN vers leur espace habituel.
    React.useEffect(() => {
        if (!isAuthenticated()) {
            router.replace('/login?callbackUrl=/admin');
            return;
        }
        hydrate();
    }, [hydrate, router]);

    React.useEffect(() => {
        if (!hydrated) return;
        if (!roles.includes('ADMIN')) {
            router.replace(getUserSpaceRoute());
            return;
        }
        setAuthChecked(true);
    }, [hydrated, roles, router]);

    const menuGroups = React.useMemo(() => buildMenuGroups(authorizations), [authorizations]);
    const allItems = menuGroups.flatMap(g => g.items);
    const currentLabel = allItems.find(item => item.href === pathname)?.label ?? 'Administration';

    if (!authChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Icon icon="svg-spinners:ring-resize" width={32} className="text-primary" />
            </div>
        );
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden p-2 md:p-4 gap-2 md:gap-4">

            {/* ══════════════════════════════════════════════════
                DESKTOP — sidebar style akwaba (col-span-3)
            ══════════════════════════════════════════════════ */}
            <aside className="hidden md:block w-[260px] flex-shrink-0">
                <div className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border p-3 sticky top-4 overflow-y-auto max-h-[calc(100vh-2rem)] scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">

                    {/* Profil admin — copie du bloc profil Sidebar.tsx */}
                    <div className="flex flex-col items-center px-2 pb-3 pt-2">
                        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border shadow-lg shrink-0">
                            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-black text-foreground">{getUserName() || 'Administrateur'}</span>
                                <Icon icon="solar:arrow-right-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <p className="text-xs text-muted-foreground">Administrateur</p>
                        </div>
                    </div>

                    {/* Menu */}
                    <SidebarContent pathname={pathname} menuGroups={menuGroups} />
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════
                ZONE PRINCIPALE
            ══════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-card/30 dark:bg-[#0B0B0B]/30 rounded-2xl border border-border/50 shadow-sm">

                {/* Header */}
                <header className="h-[72px] flex items-center justify-between px-5 md:px-8 flex-shrink-0 border-b border-border/50 backdrop-blur-md bg-background/50">
                    {/* Hamburger mobile */}
                    <button onClick={() => setOpen(true)} className="md:hidden p-2 rounded-xl hover:bg-muted transition-colors -ml-1">
                        <Icon icon="solar:hamburger-menu-bold-duotone" width={22} />
                    </button>

                    <div>
                        <h1 className="text-lg md:text-xl font-black text-foreground leading-tight">{currentLabel}</h1>
                        <p className="text-[11px] text-muted-foreground font-medium capitalize hidden md:block">{isMounted ? dateStr : '\u00A0'}</p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-all">
                            <Icon icon="solar:magnifer-bold-duotone" width={18} />
                        </button>
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground transition-all">
                            <Icon icon="solar:bell-bing-bold-duotone" width={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-background" />
                        </button>
                        <ThemeToggle />
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform">
                            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {children}
                </main>
            </div>

            {/* ══════════════════════════════════════════════════
                MOBILE — FAB trigger (identique Sidebar.tsx)
            ══════════════════════════════════════════════════ */}
            <div className="md:hidden fixed bottom-20 right-6 z-40">
                <button onClick={() => setOpen(true)} className="rounded-full h-14 w-14 flex items-center justify-center bg-primary shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all">
                    <Icon icon="solar:widget-5-bold-duotone" width={26} className="text-white" />
                </button>
            </div>

            {/* ══════════════════════════════════════════════════
                MOBILE — Panneau plein écran style Yango (identique Sidebar.tsx)
            ══════════════════════════════════════════════════ */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-[60] bg-black/30 md:hidden"
                        />

                        {/* Panel depuis la droite — identique Sidebar.tsx */}
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                            className="fixed inset-0 z-[61] bg-background md:hidden overflow-y-auto flex flex-col scrollbar-hide [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {/* Header avec flèche retour */}
                            <div className="flex items-center px-4 pt-10 pb-2">
                                <button onClick={() => setOpen(false)} className="p-2 -ml-2 rounded-full hover:bg-muted active:scale-90 transition-all">
                                    <Icon icon="solar:alt-arrow-left-bold" className="w-6 h-6 text-foreground" />
                                </button>
                            </div>

                            {/* Profil mobile */}
                            <div className="flex flex-col items-center px-6 pb-3">
                                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border shadow-lg shrink-0">
                                    <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
                                </div>
                                <div className="mt-2 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-sm font-black text-foreground">{getUserName() || 'Administrateur'}</span>
                                        <Icon icon="solar:arrow-right-bold-duotone" className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Administrateur</p>
                                </div>
                            </div>

                            {/* Menu */}
                            <div className="flex-1 px-4 pb-4 space-y-2">
                                <SidebarContent pathname={pathname} menuGroups={menuGroups} onNavigate={() => setOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
