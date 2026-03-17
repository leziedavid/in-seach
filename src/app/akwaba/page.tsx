'use client';

import { useState, useMemo, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAllSearch, getMySpace } from '@/api/api';
import AccountServicesList from '@/components/account/AccountServicesList';
import AccountAnnonces from '@/components/account/AccountAnnonces';
import AccountBookings from '@/components/account/AccountBookings';
import AnnoncesBookings from '@/components/account/AnnoncesBookings';
import AccountSettings from '@/components/account/AccountSettings';
import { Service, Annonce, Booking, GlobalStats, Role } from '@/types/interface';
import { getUserRole, logout } from '@/lib/auth';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import Image from "next/image";
import Commandes from '@/components/products/Commandes';
import Store from '@/components/products/Store';
import HistoriqueCommandes from '@/components/products/Historique-commandes';

type TabType =
    'Calendrier' |
    'Services' |
    'Rendez-vous' |
    'Rendez-vous-annonces' |
    'Annonces' |
    'Boutique' |
    'Commandes' |
    'Historique-commandes' |
    'Paramètres'
    ;

export default function Page() {
    const router = useRouter();

    const [isMounted, setIsMounted] = useState(false);
    const [userRole, setUserRole] = useState<Role | null>(null);

    useEffect(() => {
        setIsMounted(true);
        setUserRole(getUserRole() as Role);
    }, []);

    const isClient = userRole === Role.CLIENT;
    const isPrestataire = userRole === Role.PRESTATAIRE;
    const isAdmin = userRole === Role.ADMIN;

    // Initial tab logic based on role
    const [activeTab, setActiveTab] = useState<TabType>('Paramètres'); // Neutral default

    // Effect to set initial tab once role is known
    useEffect(() => {
        if (userRole) { setActiveTab(userRole === Role.CLIENT ? 'Rendez-vous' : 'Calendrier'); }
    }, [userRole]);

    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<GlobalStats>({} as GlobalStats)
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(6);

    // React Query for global data
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['my-space', activeTab, page, limit],
        queryFn: () => getMySpace({ activeTab, page, limit }),
        // queryFn: () => getAllSearch({ activeTab, page, limit }),
    });

    const data = response?.data;

    // Mapping data per tab
    const tabData = useMemo(() => {
        if (!data) return { items: [] as (Service | Annonce | Booking)[], total: 0, totalPages: 0 };

        switch (activeTab) {
            case 'Calendrier':
                return {
                    items: data.bookings || [],
                    total: data.bookings?.length || 0,
                    totalPages: Math.ceil((data.bookings?.length || 0) / limit)

                };
            case 'Services':
                return {
                    items: data.services || [],
                    total: data.total || 0,
                    totalPages: data.totalPages || 0
                };

            case 'Rendez-vous':
                return {
                    items: data.bookings || [],
                    total: data.bookings?.length || 0,
                    totalPages: Math.ceil((data.bookings?.length || 0) / limit)
                };

            case 'Annonces':
                // For now, Annonces and Bookings are not paginated on backend API, so we calculate totalPages manually if needed
                return {
                    items: data.annonces || [],
                    total: data.annonces?.length || 0,
                    totalPages: Math.ceil((data.annonces?.length || 0) / limit)
                };

            case "Rendez-vous-annonces":
                return {
                    items: data.annoncesBookings || [],
                    total: data.annoncesBookings?.length || 0,
                    totalPages: Math.ceil((data.annoncesBookings?.length || 0) / limit)
                };

            default:
                return { items: [], total: 0, totalPages: 0 };
        }
    }, [data, activeTab, limit]);

    const allMenus: { label: string; icon: React.ReactNode; key: TabType; roles: Role[] }[] = [
        { label: 'Calendrier', icon: <Icon icon="solar:calendar-date-bold-duotone" width={18} />, key: 'Calendrier', roles: [Role.PRESTATAIRE, Role.ADMIN, Role.CLIENT] },
        { label: 'Mes Services', icon: <Icon icon="solar:box-bold-duotone" width={18} />, key: 'Services', roles: [Role.PRESTATAIRE, Role.ADMIN] },
        { label: 'Mes Annonces', icon: <Icon icon="solar:eye-bold-duotone" width={18} />, key: 'Annonces', roles: [Role.PRESTATAIRE, Role.ADMIN] },
        { label: 'RDV Services', icon: <Icon icon="solar:clipboard-list-bold-duotone" width={18} />, key: 'Rendez-vous', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN] },
        { label: 'RDV Annonces', icon: <Icon icon="solar:clipboard-check-bold-duotone" width={18} />, key: 'Rendez-vous-annonces', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN] },
        { label: 'Boutique', icon: <Icon icon="solar:history-bold-duotone" width={18} />, key: 'Boutique', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE] },
        { label: 'Commandes', icon: <Icon icon="solar:history-bold-duotone" width={18} />, key: 'Commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE] },
        { label: 'Historique-commandes', icon: <Icon icon="solar:history-bold-duotone" width={18} />, key: 'Historique-commandes', roles: [Role.CLIENT, Role.ADMIN, Role.PRESTATAIRE] },
        { label: 'Paramètres', icon: <Icon icon="solar:settings-bold-duotone" width={18} />, key: 'Paramètres', roles: [Role.CLIENT, Role.PRESTATAIRE, Role.ADMIN] }
    ];

    const menu = useMemo(() => {
        if (!userRole) return [];
        return allMenus.filter(item => item.roles.includes(userRole));
    }, [userRole]);

    if (!isMounted) {
        return <div className="min-h-screen bg-background" />; // Simple placeholder to avoid mismatch
    }

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1); // Reset page on tab change
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (

        <div className="min-h-screen">

            {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}

            {/* Container centré */}
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-4 py-10">

                {/* ================= DESKTOP SIDEBAR ================= */}
                <aside className="hidden md:block md:col-span-4 lg:col-span-3">
                    <div className="bg-card/50 backdrop-blur-xl rounded-3xl shadow-xl border border-border p-6 sticky top-24">

                        {/* Profil */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center text-2xl font-bold text-primary bg-primary/5">
                                {data?.user?.fullName?.charAt(0) || 'P'}
                            </div>

                            <p className="font-bold mt-3 text-foreground">{data?.user?.fullName || 'Mon compte'}</p>
                            <p className="text-sm text-muted-foreground">{data?.user?.role === 'PRESTATAIRE' ? 'Prestataire' : 'Client'}</p>

                            {data?.totalGain !== undefined && (
                                <div className="mt-4 bg-primary/10 px-4 py-2 rounded-xl text-center border border-primary/20">
                                    <p className="text-primary font-black">{data.totalGain.toLocaleString()} FCFA</p>
                                    <p className="text-[10px] text-primary/70 uppercase font-bold">Total Gains</p>
                                </div>
                            )}
                        </div>

                        {/* Menu */}
                        <div className="space-y-2">
                            {menu.map((item) => {
                                const isActive = activeTab === item.key;
                                return (
                                    <button key={item.key} onClick={() => handleTabChange(item.key as TabType)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all duration-300  ${isActive ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`} >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Logout Desktop */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all duration-300"
                            >
                                <Icon icon="solar:logout-bold-duotone" width={18} />
                                Déconnexion
                            </button>
                        </div>
                    </div>
                </aside>


                {/* ================= CONTENT ================= */}
                <main className="md:col-span-8 lg:col-span-9 p-2">


                    {activeTab === 'Calendrier' && (
                        <BookingCalendar />
                    )}

                    {activeTab === 'Services' && (
                        <AccountServicesList
                            data={tabData.items as Service[]}
                            page={page}
                            limit={limit}
                            total={tabData.total}
                            totalPages={tabData.totalPages}
                            loading={isLoading}
                            onPageChange={setPage}
                            onSuccess={() => { void refetch(); }}
                        />
                    )}
                    {activeTab === 'Annonces' && (
                        <AccountAnnonces
                            data={tabData.items as Annonce[]}
                            page={page}
                            limit={limit}
                            total={tabData.total}
                            totalPages={tabData.totalPages}
                            loading={isLoading}
                            onPageChange={setPage}
                            onSuccess={() => { void refetch(); }}
                        />
                    )}
                    {activeTab === 'Rendez-vous' && (
                        <AccountBookings
                            type="active"
                            data={tabData.items as Booking[]}
                            page={page}
                            limit={limit}
                            total={tabData.total}
                            totalPages={tabData.totalPages}
                            loading={isLoading}
                            onPageChange={setPage}
                        />
                    )}

                    {activeTab === 'Rendez-vous-annonces' && (
                        <AnnoncesBookings
                            type="active"
                            data={tabData.items as Booking[]}
                            page={page}
                            limit={limit}
                            total={tabData.total}
                            totalPages={tabData.totalPages}
                            loading={isLoading}
                            onPageChange={setPage}
                        />
                    )}

                    {activeTab === 'Historique-commandes' && (
                        <HistoriqueCommandes />
                    )}

                    {activeTab === 'Boutique' && (
                        <Store />
                    )}
                    {activeTab === 'Commandes' && (
                        <Commandes />
                    )}

                    {activeTab === 'Paramètres' && <AccountSettings />}

                </main>
            </div>

            {/* ================= MOBILE FLOATING BUTTON ================= */}
            <div className="md:hidden fixed bottom-20 left-6 z-80">

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button size="icon" className="rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-110 active:scale-95 transition-all" >
                            <Image src="/menu.svg" alt="Menu" width={26} height={26} className="brightness-0 invert dark:brightness-100 dark:invert-0" />
                        </Button>
                    </SheetTrigger>

                    {/* Drawer mobile */}
                    <SheetContent side="bottom" className="rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
                        <SheetHeader className="sr-only">
                            <SheetTitle>Mon Espace</SheetTitle>
                            <SheetDescription>Menu de navigation de votre compte</SheetDescription>
                        </SheetHeader>

                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center text-lg font-bold text-primary bg-primary/5">
                                {data?.user?.fullName?.charAt(0) || 'P'}
                            </div>
                            <p className="mt-2 font-semibold text-foreground">Mon compte</p>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-3">
                                {menu.map((item) => (
                                    <button key={item.key} onClick={() => { handleTabChange(item.key as TabType); setOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-sm transition-all ${activeTab === item.key ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} >
                                        {item.icon}
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-border mt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl text-sm text-red-500 bg-red-50/50 hover:bg-red-50 transition-all font-bold"
                                >
                                    <Icon icon="solar:logout-bold-duotone" width={18} />
                                    Déconnexion
                                </button>
                            </div>
                        </div>

                    </SheetContent>
                </Sheet>

            </div>
        </div>

    );

}
