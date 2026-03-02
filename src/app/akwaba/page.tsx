'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getAllSearch, getMySpace } from '@/api/api';
import AccountServicesList from '@/components/account/AccountServicesList';
import AccountAnnonces from '@/components/account/AccountAnnonces';
import AccountBookings from '@/components/account/AccountBookings';
import AccountSettings from '@/components/account/AccountSettings';
import { Service, Annonce, Booking, GlobalStats } from '@/types/interface';
import BookingCalendar from '@/components/bookings/BookingCalendar';
import Image from "next/image";

type TabType = 'Calendrier' | 'Services' | 'Rendez-vous' | 'Annonces' | 'Historique' | 'Paramètres';

export default function Page() {

    const [activeTab, setActiveTab] = useState<TabType>('Calendrier');
    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<GlobalStats>({} as GlobalStats)
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(6);

    // React Query for global data
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['my-space', activeTab, page, limit],
        // queryFn: () => getMySpace({ activeTab, page, limit }),
        queryFn: () => getAllSearch({ activeTab, page, limit }),
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
            case 'Historique':
                return {
                    items: data.history || [],
                    total: data.history?.length || 0,
                    totalPages: Math.ceil((data.history?.length || 0) / limit)
                };
            default:
                return { items: [], total: 0, totalPages: 0 };
        }
    }, [data, activeTab, limit]);

    const menu = [
        { label: 'Calendrier', icon: <Icon icon="solar:calendar-date-bold-duotone" width={18} />, key: 'Calendrier' },
        { label: 'Mes Services', icon: <Icon icon="solar:box-bold-duotone" width={18} />, key: 'Services' },
        { label: 'Mes Annonces', icon: <Icon icon="solar:eye-bold-duotone" width={18} />, key: 'Annonces' },
        { label: 'Mes Rendez-vous', icon: <Icon icon="solar:clipboard-list-bold-duotone" width={18} />, key: 'Rendez-vous' },
        { label: 'Mon Historique', icon: <Icon icon="solar:history-bold-duotone" width={18} />, key: 'Historique' },
        { label: 'Paramètres', icon: <Icon icon="solar:settings-bold-duotone" width={18} />, key: 'Paramètres' }
    ] as const;

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setPage(1); // Reset page on tab change
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
                    </div>
                </aside>


                {/* ================= CONTENT ================= */}
                <main className="md:col-span-8 lg:col-span-9 p-2">


                    {activeTab === 'Calendrier' && (
                        <BookingCalendar
                        // bookings={tabData.items as Booking[]}
                        // onBookingSelect={(booking) => console.log('Booking selected:', booking)}
                        />
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
                    {activeTab === 'Historique' && (
                        <AccountBookings
                            type="history"
                            data={tabData.items as Booking[]}
                            page={page}
                            limit={limit}
                            total={tabData.total}
                            totalPages={tabData.totalPages}
                            loading={isLoading}
                            onPageChange={setPage}
                        />
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
                    <SheetContent side="bottom" className="rounded-t-3xl p-6">
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
                            {menu.map((item) => (
                                <button key={item.key} onClick={() => { handleTabChange(item.key as TabType); setOpen(false); }} className={`w-full flex items-center gap-3 p-4 rounded-xl text-sm transition-all ${activeTab === item.key ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`} >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </div>

                    </SheetContent>
                </Sheet>

            </div>
        </div>

    );

}
