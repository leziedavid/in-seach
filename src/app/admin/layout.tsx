'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ThemeToggle } from '@/components/theme-toggle';

/* ─────────────────────────────────────────────────────────────────
   Menu items — icônes Solar Bold Duotone (les plus belles de Solar)
───────────────────────────────────────────────────────────────── */
const menuItems = [
    {
        label: 'Overview',
        icon:  'solar:widget-5-bold-duotone',
        href:  '/admin',
    },
    {
        label: 'Utilisateurs',
        icon:  'solar:users-group-rounded-bold-duotone',
        href:  '/admin/users',
    },
    {
        label: 'Produits',
        icon:  'solar:bag-heart-bold-duotone',
        href:  '/admin/products',
    },
    {
        label: 'Services',
        icon:  'solar:hand-stars-bold-duotone',
        href:  '/admin/services',
    },
    {
        label: 'Annonces',
        icon:  'solar:megaphone-bold-duotone',
        href:  '/admin/annonces',
    },
    {
        label: 'Abonnements',
        icon:  'solar:wallet-money-bold-duotone',
        href:  '/admin/subscriptions',
    },
    {
        label: 'Paramètres',
        icon:  'solar:settings-bold-duotone',
        href:  '/admin/settings',
    },
    {
        label: 'Logs location',
        icon:  'solar:map-point-wave-bold-duotone',
        href:  '/admin/location-logs',
    },
    {
        label: 'Logs Système',
        icon:  'solar:code-square-bold-duotone',
        href:  '/admin/logs',
    },
];

/* ─────────────────────────────────────────────────────────────────
   Layout
───────────────────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    React.useEffect(() => {
        const saved = localStorage.getItem('admin-sidebar-open');
        if (saved !== null) {
            setIsSidebarOpen(JSON.parse(saved));
        }
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev: boolean) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('admin-sidebar-open', JSON.stringify(next));
            }
            return next;
        });
    };

    const today    = new Date();
    const dateStr  = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const currentLabel = menuItems.find(item => item.href === pathname)?.label || 'Dashboard';

    return (
        <div className="min-h-screen bg-muted/30 text-foreground flex overflow-hidden">

            {/* ══════════════════════════════════════════════════
                SIDEBAR
            ══════════════════════════════════════════════════ */}
            <aside
                className={`
                    ${isSidebarOpen ? 'w-[235px]' : 'w-[72px]'}
                    bg-card border-r border-border
                    h-screen sticky top-0
                    transition-all duration-300 ease-in-out
                    flex flex-col z-50 flex-shrink-0 shadow-sm
                `}
            >
                {/* ── Logo ──────────────────────────────────── */}
                <div className="px-4 py-[18px] flex items-center justify-between border-b border-border">

                    {/* Marque — visible en mode expanded */}
                    <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-200 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 2L11.5 7H16.5L12.5 10.5L14 16L9 13L4 16L5.5 10.5L1.5 7H6.5L9 2Z" fill="white"/>
                            </svg>
                        </div>
                        <span className="text-[17px] font-black tracking-tight leading-none whitespace-nowrap text-foreground">
                            Admin<span className="text-primary">Hub</span>
                        </span>
                    </div>

                    {/* Logo seul en mode collapsed */}
                    {!isSidebarOpen && (
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 mx-auto">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 2L11.5 7H16.5L12.5 10.5L14 16L9 13L4 16L5.5 10.5L1.5 7H6.5L9 2Z" fill="white"/>
                            </svg>
                        </div>
                    )}

                    {/* Bouton hamburger collapse */}
                    {isSidebarOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-shrink-0"
                            aria-label="Réduire le menu"
                        >
                            <Icon icon="solar:sidebar-minimalistic-bold-duotone" width={20} />
                        </button>
                    )}
                </div>

                {/* Bouton expand quand collapsed */}
                {!isSidebarOpen && (
                    <button
                        onClick={toggleSidebar}
                        className="mx-auto mt-3 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                        aria-label="Déplier le menu"
                    >
                        <Icon icon="solar:hamburger-menu-bold-duotone" width={20} />
                    </button>
                )}

                {/* ── Label section ──────────────────────────── */}
                {isSidebarOpen && (
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.18em] px-6 mt-5 mb-2">
                        Main Menu
                    </p>
                )}

                {/* ── Navigation ─────────────────────────────── */}
                <nav className="flex-1 px-3 mt-1 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-hide">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!isSidebarOpen ? item.label : undefined}
                                className={`
                                    relative flex items-center rounded-2xl
                                    font-semibold transition-all duration-200 group
                                    ${isSidebarOpen ? 'gap-3 px-3.5 py-2.5' : 'justify-center py-2.5'}
                                    ${isActive
                                        ? 'bg-primary text-secondary-foreground shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }
                                `}
                            >
                                {/* Icône Solar Bold Duotone */}
                                <Icon
                                    icon={item.icon}
                                    width={isSidebarOpen ? 20 : 22}
                                    className={`flex-shrink-0 transition-all ${isActive ? 'text-secondary-foreground' : ''}`}
                                />

                                {isSidebarOpen && (
                                    <span className="text-[13.5px] leading-none whitespace-nowrap font-semibold">
                                        {item.label}
                                    </span>
                                )}

                                {/* Tooltip (mode collapsed) */}
                                {!isSidebarOpen && (
                                    <span className="
                                        pointer-events-none absolute left-full ml-3 z-50
                                        whitespace-nowrap rounded-xl px-3 py-2
                                        text-xs font-semibold shadow-xl
                                        bg-foreground text-background
                                        opacity-0 group-hover:opacity-100 transition-opacity duration-150
                                    ">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Footer ─────────────────────────────────── */}
                <div className="mt-auto">
                    <div className="mx-5 h-px bg-border mb-3" />

                    {/* Quitter l'admin */}
                    <div className="px-3 mb-2">
                        <Link
                            href="/"
                            title={!isSidebarOpen ? "Quitter l'admin" : undefined}
                            className={`
                                flex items-center rounded-2xl py-2.5
                                text-muted-foreground hover:text-rose-500 hover:bg-rose-500/8
                                transition-all group
                                ${isSidebarOpen ? 'gap-3 px-3.5' : 'justify-center'}
                            `}
                        >
                            <Icon
                                icon="solar:logout-bold-duotone"
                                width={20}
                                className="flex-shrink-0"
                            />
                            {isSidebarOpen && (
                                <span className="text-[13.5px] font-semibold whitespace-nowrap">
                                    Quitter l'admin
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* User card */}
                    <div className={`
                        mx-3 mb-5 flex items-center rounded-2xl bg-muted
                        px-3 py-3 gap-3 overflow-hidden
                        ${!isSidebarOpen ? 'justify-center' : ''}
                    `}>
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm border-2 border-border">
                            AD
                        </div>
                        {isSidebarOpen && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-bold text-foreground leading-tight truncate">Admin User</p>
                                    <p className="text-[11px] text-muted-foreground truncate">Super Admin</p>
                                </div>
                                <Icon
                                    icon="solar:alt-arrow-right-bold-duotone"
                                    width={16}
                                    className="text-muted-foreground flex-shrink-0"
                                />
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════
                MAIN AREA
            ══════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">

                {/* ── Header ──────────────────────────────────── */}
                <header className="h-[70px] bg-card border-b border-border flex items-center justify-between px-8 z-40 sticky top-0 flex-shrink-0 shadow-sm">

                    {/* Titre + date */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-[22px] font-black text-foreground leading-tight tracking-tight">
                            {currentLabel}
                        </h1>
                        <p className="text-[12px] text-muted-foreground font-medium leading-none mt-0.5 capitalize">
                            {dateStr}
                        </p>
                    </div>

                    {/* Actions droite */}
                    <div className="flex items-center gap-2.5">

                        {/* Barre de recherche */}
                        <div className="relative hidden lg:block">
                            <Icon
                                icon="solar:magnifer-bold-duotone"
                                width={16}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                            />
                            <input
                                type="text"
                                placeholder="Recherche..."
                                className="
                                    h-10 bg-muted border border-border rounded-xl
                                    pl-10 pr-4 text-sm font-medium w-44 text-foreground
                                    outline-none placeholder:text-muted-foreground
                                    focus:border-foreground/20 focus:bg-card
                                    transition-all focus:w-56
                                "
                            />
                        </div>

                        {/* Bouton Message */}
                        <button className="
                            w-11 h-11 flex items-center justify-center rounded-2xl
                            border-2 border-border bg-card
                            text-muted-foreground hover:text-foreground hover:bg-muted
                            transition-all duration-150
                        ">
                            <Icon icon="solar:chat-round-dots-bold-duotone" width={20} />
                        </button>

                        {/* Bouton Notifications */}
                        <button className="
                            relative w-11 h-11 flex items-center justify-center rounded-2xl
                            border-2 border-border bg-card
                            text-muted-foreground hover:text-foreground hover:bg-muted
                            transition-all duration-150
                        ">
                            <Icon icon="solar:bell-bing-bold-duotone" width={20} />
                            <span className="absolute top-[10px] right-[10px] w-2 h-2 bg-rose-500 rounded-full border-[1.5px] border-card" />
                        </button>

                        {/* Theme toggle */}
                        <ThemeToggle />

                        {/* Séparateur */}
                        <div className="w-px h-8 bg-border mx-0.5" />

                        {/* User */}
                        <div className="flex items-center gap-2.5 cursor-pointer group">
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm border-2 border-border">
                                AD
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-[13.5px] font-black text-foreground leading-tight">Admin User</p>
                                <p className="text-[11px] text-muted-foreground font-medium leading-none mt-0.5">
                                    Sales Manager
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* ── Contenu ───────────────────────────────── */}
                <main className="flex-1 overflow-y-auto bg-muted/30 custom-scrollbar">
                    {children}
                </main>
            </div>
        </div>
    );
}
