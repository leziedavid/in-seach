'use client';

import React from 'react';
import { Users, Briefcase, CreditCard, Settings, Terminal, LayoutDashboard, ShoppingBag, Radio, Search, Bell, Menu, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { Icon } from '@iconify/react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

    const menuItems = [
        { label: 'Overview', icon: LayoutDashboard, href: '/admin' },
        { label: 'Utilisateurs', icon: Users, href: '/admin/users' },
        { label: 'Produits', icon: ShoppingBag, href: '/admin/products' },
        { label: 'Services', icon: Briefcase, href: '/admin/services' },
        { label: 'Annonces', icon: Radio, href: '/admin/annonces' },
        { label: 'Abonnements', icon: CreditCard, href: '/admin/subscriptions' },
        { label: 'Paramètres', icon: Settings, href: '/admin/settings' },
        { label: 'Logs location', icon: MapPin, href: '/admin/location-logs' },
        { label: 'Logs Système', icon: Terminal, href: '/admin/logs' },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
            {/* Admin Sidebar */}
            <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-white h-screen sticky top-0 transition-all duration-300 flex flex-col z-50 border-r border-border/10`}>
                <div className="p-6 flex items-center justify-between">
                    <div className={`flex items-center gap-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black text-lg">A</div>
                        <span className="text-xl font-black text-white tracking-tight">Admin<span className="text-primary">Hub</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-4 mb-4 mt-6">
                    <p className={`text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4 ${!isSidebarOpen && 'hidden'}`}>
                        Menu Principal
                    </p>
                    <nav className="space-y-1">
                        {menuItems.map((item, i) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={i} href={item.href} className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all group relative ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-secondary hover:text-white'}`}>
                                    <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-primary-foreground' : 'text-slate-500 group-hover:text-primary'}`} />
                                    {isSidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
                                    {isActive && !isSidebarOpen && (
                                        <div className="absolute right-0 w-1 h-5 bg-primary rounded-l-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-4 border-t border-slate-800/50">
                    <Link href="/" className="flex items-center gap-4 px-4 py-3 text-slate-500 font-bold hover:text-white transition-all rounded-xl hover:bg-slate-900/50">
                        <Icon icon="solar:exit-bold-duotone" className="w-5 h-5" />
                        {isSidebarOpen && <span className="text-sm">Quitter l'admin</span>}
                    </Link>
                </div>
            </aside>

            {/* Admin Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="h-20 bg-background border-b border-border/50 flex items-center justify-between px-8 z-40 sticky top-0">
                    <div className="flex items-center gap-8 flex-1 max-w-2xl">
                        <h2 className="text-lg font-black tracking-tight text-foreground hidden md:block">
                            {menuItems.find(item => item.href === pathname)?.label || 'Dashboard'}
                        </h2>
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <input type="text" placeholder="Recherche globale..." className="w-full bg-muted/30 border border-border/50 rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-primary/50 focus:bg-background transition-all" />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 ml-8">
                        <ThemeToggle />
                        <button className="relative p-2.5 bg-muted/30 hover:bg-muted rounded-2xl border border-border/50 transition-all text-muted-foreground hover:text-foreground">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background"></span>
                        </button>
                        <div className="h-10 w-px bg-border/50" />
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-foreground leading-tight">Admin User</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Super Admin</p>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black shadow-sm">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
