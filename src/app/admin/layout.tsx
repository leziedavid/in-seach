'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { motion } from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   Menu items — icônes Solar Bold Duotone (les plus belles de Solar)
───────────────────────────────────────────────────────────────── */
const menuItems = [
    {
        label: 'Overview',
        icon: 'solar:widget-5-bold-duotone',
        href: '/admin',
        color: 'text-emerald-500'
    },
    {
        label: 'Utilisateurs',
        icon: 'solar:users-group-rounded-bold-duotone',
        href: '/admin/users',
        color: 'text-blue-500'
    },
    {
        label: 'Produits',
        icon: 'solar:bag-heart-bold-duotone',
        href: '/admin/products',
        color: 'text-orange-500'
    },
    {
        label: 'Services',
        icon: 'solar:hand-stars-bold-duotone',
        href: '/admin/services',
        color: 'text-pink-500'
    },
    {
        label: 'Annonces',
        icon: 'solar:lightbulb-bolt-bold-duotone',
        href: '/admin/annonces',
        color: 'text-amber-500'
    },
    {
        label: 'Abonnements',
        icon: 'solar:wallet-money-bold-duotone',
        href: '/admin/subscriptions',
        color: 'text-violet-500'
    },
    {
        label: 'Vidéos',
        icon: 'solar:video-library-bold-duotone',
        href: '/admin/videos',
        color: 'text-rose-500'
    },
    {
        label: 'Easy-Delivery',
        icon: 'solar:delivery-bold-duotone',
        href: '/admin/easy-delivery',
        color: 'text-sky-500'
    },
    {
        label: 'Logistique',
        icon: 'solar:ship-bold-duotone',
        href: '/admin/logistics',
        color: 'text-teal-500'
    },
    {
        label: 'Paramètres',
        icon: 'solar:settings-bold-duotone',
        href: '/admin/settings',
        color: 'text-slate-500'
    },
    {
        label: 'Logs location',
        icon: 'solar:map-point-wave-bold-duotone',
        href: '/admin/location-logs',
        color: 'text-indigo-500'
    },
    {
        label: 'Logs Système',
        icon: 'solar:code-square-bold-duotone',
        href: '/admin/logs',
        color: 'text-cyan-500'
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

    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const currentLabel = menuItems.find(item => item.href === pathname)?.label || 'Dashboard';

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden p-2 md:p-4 gap-2 md:gap-4">

            {/* ══════════════════════════════════════════════════
                SIDEBAR
            ══════════════════════════════════════════════════ */}
            <aside className={` ${isSidebarOpen ? 'w-[260px]' : 'w-[80px]'} bg-card/50 dark:bg-[#0B0B0B] border border-border/50 rounded-[2.5rem] h-full transition-all duration-300 ease-in-out flex flex-col z-50 flex-shrink-0 shadow-2xl relative overflow-hidden group/sidebar`}  >
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

                {/* ── Logo ──────────────────────────────────── */}
                <div className="px-6 py-[24px] flex items-center justify-between border-b border-border/50 relative z-10">


                    {/* Marque — visible en mode expanded */}
                    <div className={`flex items-center gap-2.5 overflow-hidden transition-all duration-200 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <path d="M9 2L11.5 7H16.5L12.5 10.5L14 16L9 13L4 16L5.5 10.5L1.5 7H6.5L9 2Z" fill="white" />
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
                                <path d="M9 2L11.5 7H16.5L12.5 10.5L14 16L9 13L4 16L5.5 10.5L1.5 7H6.5L9 2Z" fill="white" />
                            </svg>
                        </div>
                    )}

                    {/* Bouton hamburger collapse */}
                    {isSidebarOpen && (
                        <button onClick={toggleSidebar} className="w-8 h-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex-shrink-0" aria-label="Réduire le menu">
                            <Icon icon="solar:sidebar-minimalistic-bold-duotone" width={20} />
                        </button>
                    )}
                </div>

                {/* Bouton expand quand collapsed */}
                {!isSidebarOpen && (
                    <button onClick={toggleSidebar} className="mx-auto mt-3 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all" aria-label="Déplier le menu">
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
                <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide relative z-10">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href} title={!isSidebarOpen ? item.label : undefined} className={`relative flex items-center rounded-2xl font-bold transition-all duration-300 group ${isSidebarOpen ? 'gap-4 px-4 py-3' : 'justify-center py-3'} ${isActive ? 'bg-white/10 dark:bg-white/[0.08] text-foreground shadow-sm backdrop-blur-md' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                                {/* Active indicator dot */}
                                {isActive && (
                                    <motion.div layoutId="active-pill" className="absolute left-1.5 w-1 h-5 bg-primary rounded-full" />
                                )}

                                {/* Icône Solar Bold Duotone */}
                                <Icon icon={item.icon} width={isSidebarOpen ? 22 : 24} className={`flex-shrink-0 transition-all ${isActive ? item.color : 'opacity-70 group-hover:opacity-100'}`} />


                                {isSidebarOpen && (
                                    <span className="text-[13.5px] leading-none whitespace-nowrap font-semibold">
                                        {item.label}
                                    </span>
                                )}

                                {/* Tooltip (mode collapsed) */}
                                {!isSidebarOpen && (
                                    <span className="pointer-events-none absolute left-full ml-3 z-50 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold shadow-xl bg-foreground text-background opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* ── Footer ─────────────────────────────────── */}
                <div className="mt-auto pb-8 relative z-10">
                    <div className="mx-6 h-px bg-border/50 mb-6" />

                    {/* Quitter l'admin */}
                    <div className="px-4 mb-4">
                        <Link href="/" title={!isSidebarOpen ? "Quitter l'admin" : undefined}
                            className={`flex items-center rounded-2xl py-3 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all group ${isSidebarOpen ? 'gap-4 px-4' : 'justify-center'}`}>
                            <Icon icon="solar:logout-bold-duotone" width={22} className="flex-shrink-0" />
                            {isSidebarOpen && (
                                <span className="text-[14px] font-bold whitespace-nowrap">
                                    Quitter l'admin
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* User card - Minimalist like ref */}
                    <div className={`mx-4 flex items-center rounded-[1.5rem] bg-white/[0.03] border border-white/[0.05] p-3 gap-3 overflow-hidden ${!isSidebarOpen ? 'justify-center' : ''}`}>
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-lg border border-white/10 ring-2 ring-white/5">
                            <img src="https://i.pravatar.cc/150?u=admin" alt="Admin" className="w-full h-full object-cover" />
                        </div>
                        {isSidebarOpen && (
                            <>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-black text-foreground leading-tight truncate">Admin Hub</p>
                                    <p className="text-[11px] text-muted-foreground font-medium truncate uppercase tracking-wider">Super Admin</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </aside>

            {/* ══════════════════════════════════════════════════
                MAIN AREA
            ══════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-card/30 dark:bg-[#0B0B0B]/30 border border-border/50 rounded-[2.5rem] shadow-2xl relative">

                {/* ── Header ──────────────────────────────────── */}
                <header className="h-[80px] flex items-center justify-between px-8 z-40 relative flex-shrink-0 border-b border-border/50 backdrop-blur-md bg-background/50">


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
                    <div className="flex items-center gap-4">

                        {/* Barre de recherche circular like ref */}
                        <button className="w-11 h-11 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300">
                            <Icon icon="solar:magnifer-bold-duotone" width={20} />
                        </button>

                        {/* Bouton Notifications circular */}
                        <button className="relative w-11 h-11 flex items-center justify-center rounded-full bg-muted/50 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300">
                            <Icon icon="solar:bell-bing-bold-duotone" width={20} />
                            <span className="absolute top-[10px] right-[10px] w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
                        </button>

                        {/* Theme toggle circular (handled by component but wrapper can help) */}
                        <div className="p-0.5 rounded-full bg-muted/50 border border-border/50">
                            <ThemeToggle />
                        </div>

                        {/* User Profile Image like ref */}
                        <div className="w-11 h-11 rounded-full overflow-hidden shadow-lg border-2 border-primary/20 ring-4 ring-primary/5 cursor-pointer hover:scale-105 transition-transform">
                            <img src="https://i.pravatar.cc/150?u=admin" alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                {/* ── Contenu ───────────────────────────────── */}
                <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
