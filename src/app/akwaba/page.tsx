'use client';

import { useState, useMemo, useEffect } from 'react';

import FloteManager from '@/components/logistics/sections/FloteManager';
import EasyDeliveryPage from '@/components/delivery/sections/EasyDeliveryPage';
import Sidebar, { TabType } from './Sidebar';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getAllSearch, getMySpace, upsertLocationLog } from '@/api/api';
import { useUserLocation } from '@/utils/location';
import AccountServicesList from '@/components/profile/AccountServicesList';
import AccountAnnonces from '@/components/profile/AccountAnnonces';
import AccountBookings from '@/components/profile/AccountBookings';
import AnnoncesBookings from '@/components/profile/AnnoncesBookings';
import AccountSettings from '@/components/profile/AccountSettings';
import { Service, Annonce, Booking, GlobalStats, Role } from '@/types/interface';
import { getUserRole, logout } from '@/lib/auth';
import BookingCalendar from '@/components/bookings/sections/BookingCalendar';
import Image from "next/image";
import Commandes from '@/components/orders/sections/Commandes';
import Store from '@/components/store/sections/Store';
import HistoriqueCommandes from '@/components/orders/sections/Historique-commandes';
import HistoriqueRdv from '@/components/bookings/sections/Historique-rdv';
import LogisticsServicesList from '@/components/logistics/sections/LogisticsServicesList';
import QuotesList from '@/components/logistics/sections/QuotesList';
import DeliveriesList from '@/components/logistics/sections/DeliveriesList';
import QuoteRequestModal from '@/components/logistics/modals/QuoteRequestModal';
import ApiDocumentation from '@/components/profile/ApiDocumentation';
import { Modal } from '@/components/ui/MotionModal';
import Overview from '@/components/profile/Overview';
import MyLivesList from '@/components/lives/MyLivesList';


import { useTranslation } from '@/utils/langue/hooks';
import { Icon } from '@iconify/react';

export default function Page() {
    const { t } = useTranslation();
    const router = useRouter();
    const { getUserLocation } = useUserLocation();

    const [isMounted, setIsMounted] = useState(false);
    const [userRole, setUserRole] = useState<Role | null>(null);
    const [locationError, setLocationError] = useState(false);
    const [isLocationLoading, setIsLocationLoading] = useState(true);
    const [isRetrying, setIsRetrying] = useState(false);

    const trackLocation = async (isRetry = false) => {
        if (isRetry) {
            setIsRetrying(true);
        } else {
            setIsLocationLoading(true);
            setLocationError(false);
        }

        const location = await getUserLocation();
        if (location && location.lat && location.lng) {
            setLocationError(false);
            try {
                await upsertLocationLog({
                    lat: location.lat,
                    lng: location.lng,
                    context: 'akwaba'
                });
            } catch (err) {
                console.error("Failed to update location on akwaba:", err);
            }
        } else {
            setLocationError(true);
        }

        setIsRetrying(false);
        setIsLocationLoading(false);
    };

    useEffect(() => {
        setIsMounted(true);
        setUserRole(getUserRole() as Role);

        // Track location on akwaba page
        trackLocation();
    }, []);

    const isClient = userRole === Role.CLIENT;
    const isPrestataire = userRole === Role.PRESTATAIRE;
    const isAdmin = userRole === Role.ADMIN;
    const isEntreprise = userRole === Role.ENTREPRISE;

    // Initial tab logic based on role
    const [activeTab, setActiveTab] = useState<TabType>('Paramètres'); // Neutral default

    // Effect to set initial tab once role is known
    useEffect(() => {
        if (userRole) {
            if (userRole === Role.LIVREUR) {
                setActiveTab('Livreur-dashboard');
            } else if (userRole === Role.CHAUFFEUR) {
                setActiveTab('Mes-livraisons');
            } else {
                setActiveTab('Overview');
            }
        }
    }, [userRole]);

    const [open, setOpen] = useState(false);
    const [stats, setStats] = useState<GlobalStats>({} as GlobalStats)
    // Pagination state
    const [page, setPage] = useState(1);
    const [limit] = useState(6);
    const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<any>(null);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

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
            // case 'Calendrier':
            //     return {
            //         items: data.bookings || [],
            //         total: data.bookings?.length || 0,
            //         totalPages: Math.ceil((data.bookings?.length || 0) / limit)

            //     };
            case 'Services':
                return {
                    items: data.services || [],
                    total: data.total || 0,
                    totalPages: data.totalPages || 0
                };

            case 'Rendez-vous':
                return {
                    items: userRole === Role.CLIENT ? data.bookingsPlaced?.data || [] : data.bookingsReceived?.data || [],
                    total: userRole === Role.CLIENT ? data.bookingsPlaced?.total || 0 : data.bookingsReceived?.total || 0,
                    totalPages: userRole === Role.CLIENT ? data.bookingsPlaced?.totalPages || 0 : data.bookingsReceived?.totalPages || 0
                };

            case 'Annonces':
                // For now, Annonces and Bookings are not paginated on backend API, so we calculate totalPages manually if needed
                return {
                    items: data.annonces || [],
                    total: data.total || 0,
                    totalPages: Math.ceil((data.annonces?.length || 0) / limit)
                };

            case "Rendez-vous-annonces":
                return {
                    items: userRole === Role.CLIENT ? data.bookingsPlaced?.data || [] : data.bookingsReceived?.data || [],
                    total: userRole === Role.CLIENT ? data.bookingsPlaced?.total || 0 : data.bookingsReceived?.total || 0,
                    totalPages: userRole === Role.CLIENT ? data.bookingsPlaced?.totalPages || 0 : data.bookingsReceived?.totalPages || 0
                };
            case "Historique-rdv":
                return {
                    items: userRole === Role.CLIENT ? data.bookingsPlaced?.data || [] : data.bookingsReceived?.data || [],
                    total: userRole === Role.CLIENT ? data.bookingsPlaced?.total || 0 : data.bookingsReceived?.total || 0,
                    totalPages: userRole === Role.CLIENT ? data.bookingsPlaced?.totalPages || 0 : data.bookingsReceived?.totalPages || 0
                };

            default:
                return { items: [], total: 0, totalPages: 0 };
        }
    }, [data, activeTab, limit]);

    if (!isMounted) {
        return <div className="min-h-screen bg-background" />;
    }

    const handleTabChange = (tab: TabType) => {
        if (tab === 'Tarifs') {
            router.push('/pricing');
            return;
        }
        setActiveTab(tab);
        setPage(1);
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Component Mapping for Content
    const renderContent = () => {
        switch (activeTab) {
            case 'Overview':
                return <Overview />;

            case 'Calendrier':
                return <BookingCalendar />;

            case 'Services':
                return (
                    <AccountServicesList data={tabData.items as Service[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} />
                );
            case 'Annonces':
                return (
                    <AccountAnnonces data={tabData.items as Annonce[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} />
                );
            case 'Rendez-vous':
                return (
                    <AccountBookings type="active" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} />
                );
            case 'Rendez-vous-annonces':
                return (
                    <AnnoncesBookings type="active" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} />
                );
            case 'Historique-rdv':
                return (
                    <HistoriqueRdv type="history" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} />
                );
            case 'Historique-commandes':
                return <HistoriqueCommandes />;
            case 'Boutique':
                return <Store />;
            case 'Commandes':
                return <Commandes onSuccess={() => { void refetch(); }} />;
            case 'Services-logistiques':
                return (<LogisticsServicesList mode="marketplace" onRequestQuote={(service) => { setSelectedServiceForQuote(service); setIsQuoteModalOpen(true); }} />);
            case 'Mes-services-logistiques':
                return <LogisticsServicesList mode="management" />;
            case 'Mes-devis':
                return <QuotesList role="CLIENT" />;
            case 'Devis-recus':
                return <QuotesList role="ENTREPRISE" />;
            case 'Mes-livraisons':
                return <DeliveriesList role="CLIENT" />;
            case 'Livraisons':
                return <DeliveriesList role="ENTREPRISE" />;
            case 'Livraisons-chauffeur':
                return <DeliveriesList role="CHAUFFEUR" />;
            case 'Ma-flotte':
                return <FloteManager />;
            case 'Paramètres':
                return <AccountSettings />;
            case 'Documentation-API':
                return <ApiDocumentation />;
            case 'Mes-lives':
                return <MyLivesList />;
            case 'Livreur-dashboard':
                return <EasyDeliveryPage />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen">

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-4 py-10">

                {/* SIDEBAR (Desktop & Mobile) */}
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} user={data?.user} onLogout={handleLogout} />

                {/* CONTENT AREA */}
                <main className="md:col-span-8 lg:col-span-9 p-2">
                    {renderContent()}
                </main>
            </div>

            {/* Blocking Location Loading Overlay */}
            {/* {isLocationLoading && !locationError && (
                <div className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-primary">
                            <Icon icon="solar:map-point-bold-duotone" width={32} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-foreground">{t("akwaba.location.loading_title")}</h2>
                        <p className="text-sm text-muted-foreground">
                            {t("akwaba.location.loading_desc")}
                        </p>
                    </div>
                </div>
            )} */}

            {/* Blocking Location Error Overlay */}
            {/* {locationError && (
                <div className="fixed inset-0 z-[999] bg-background/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-card border border-border p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center space-y-6">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto text-red-500">
                            <Icon icon="solar:map-point-remove-bold-duotone" width={48} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-foreground">{t("akwaba.location.required_title")}</h2>
                            <p className="text-sm text-muted-foreground">
                                {t("akwaba.location.required_desc")}
                            </p>
                        </div>
                        <button onClick={() => trackLocation(true)} disabled={isRetrying} className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 bg-primary text-white" >
                            {isRetrying ? (
                                <>
                                    <Icon icon="line-md:loading-twotone-loop" width={20} />
                                    <span>{t("akwaba.location.processing")}</span>
                                </>
                            ) : (t("akwaba.location.retry"))}
                        </button>
                    </div>
                </div>
            )} */}

            {/* Global Modals */}
            <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)}>
                {selectedServiceForQuote && (
                    <QuoteRequestModal service={selectedServiceForQuote} isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} onSuccess={() => { setActiveTab('Mes-devis'); }} />
                )}
            </Modal>


        </div>
    );
}
