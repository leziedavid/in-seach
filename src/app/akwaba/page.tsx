'use client';

import { useState, useMemo, useEffect } from 'react';

import FloteManager from '@/components/logistics/sections/FloteManager';
import EasyDeliveryPage from '@/components/delivery/sections/EasyDeliveryPage';
import Sidebar, { TabType } from './Sidebar';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getMySpace, upsertLocationLog, getMenusByType } from '@/api/api';
import { queryKeys } from '@/lib/queryKeys';
import { useUserLocation } from '@/utils/location';
import FullScreenOverlayPortal from '@/components/shared/FullScreenOverlayPortal';
import AppEntrySkeleton from '@/components/shared/AppEntrySkeleton';
import { useRealTimeUpdate } from '@/hooks/useRealTimeUpdate';
import AccountServicesList from '@/components/profile/AccountServicesList';
import AccountAnnonces from '@/components/profile/AccountAnnonces';
import AccountBookings from '@/components/profile/AccountBookings';
import AnnoncesBookings from '@/components/profile/AnnoncesBookings';
import AccountSettings from '@/components/profile/AccountSettings';
import { Service, Annonce, Booking, GlobalStats, Role } from '@/types/interface';
import { getUserRole, logout, isAuthenticated } from '@/lib/auth';
import BookingCalendar from '@/components/bookings/sections/BookingCalendar';
import Commandes from '@/components/orders/sections/Commandes';
import Store from '@/components/store/sections/Store';
import HistoriqueCommandes from '@/components/orders/sections/Historique-commandes';
import HistoriqueRdv from '@/components/bookings/sections/Historique-rdv';
import LogisticsServicesList from '@/components/logistics/sections/LogisticsServicesList';
import QuotesList from '@/components/logistics/sections/QuotesList';
import DeliveriesList from '@/components/logistics/sections/DeliveriesList';
import QuoteRequestModal from '@/components/logistics/modals/QuoteRequestModal';
import dynamic from 'next/dynamic';
const ApiDocumentation = dynamic(() => import('@/components/profile/ApiDocumentation'), { ssr: false });
const ChatWidget = dynamic(() => import("@/components/ai/ChatWidget"), { ssr: false })

import { Modal } from '@/components/ui/MotionModal';
import Overview from '@/components/profile/Overview';
import { BiometricSetupModal } from '@/components/auth/BiometricSetupModal';
import InstallPWA from '@/components/pwa/InstallPWA';
import MyLivesList from '@/components/lives/MyLivesList';
import RetoursSAV from '@/components/returns/sections/RetoursSAV';
import GasRefillRequest from '@/components/gas-delivery/sections/GasRefillRequest';
import GasProviderDashboard from '@/components/gas-delivery/sections/GasProviderDashboard';
import GarageManagement from '@/components/garage/sections/GarageManagement';
import UnifiedHistory from '@/components/history/UnifiedHistory';
import FournisseurBoutique from '@/components/fournisseur/sections/FournisseurBoutique';
import FournisseurQuotesList from '@/components/fournisseur/sections/FournisseurQuotesList';
import RestaurantManagement from '@/components/restaurant/sections/RestaurantManagement';
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
        // Token absent ou expiré → retour direct au login
        if (!isAuthenticated()) {
            router.replace('/login');
            return;
        }

        setIsMounted(true);
        setUserRole(getUserRole() as Role);

        // Track location on akwaba page
        trackLocation();
    }, []);

    // const isClient = userRole === Role.CLIENT;
    // const isPrestataire = userRole === Role.PRESTATAIRE;
    // const isAdmin = userRole === Role.ADMIN;
    // const isEntreprise = userRole === Role.ENTREPRISE;

    // Initial tab logic based on role
    const [activeTab, setActiveTab] = useState<TabType>('Paramètres'); // Neutral default

    // Portée des réservations pour un PRESTATAIRE :
    // - 'received' : réservations reçues sur ses propres services/annonces (rôle fournisseur)
    // - 'placed'   : réservations qu'il a lui-même effectuées chez d'autres (rôle client)
    // Un CLIENT ne voit que ses réservations placées (comportement inchangé).
    const [bookingScope, setBookingScope] = useState<'received' | 'placed'>('received');

    // Remonte en haut de page à chaque changement d'onglet (Sidebar) — sans ça, la
    // position de scroll du contenu précédent (ex: bas d'une liste paginée) persiste
    // et l'utilisateur arrive au milieu du nouveau contenu.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, [activeTab]);

    // Effect to set initial tab once role is known
    useEffect(() => {
        if (userRole) {
            if (userRole === Role.LIVREUR) {
                setActiveTab('Livreur-dashboard');
            } else if (userRole === Role.CHAUFFEUR) {
                setActiveTab('Mes-livraisons');
            } else if (userRole === Role.GAZIER) {
                setActiveTab('Mes-bouteilles-gaz');
            } else if (userRole === Role.GARAGISTE_VENTE_PIECE_AUTO) {
                setActiveTab('Mon-Garage');
            } else if (userRole === Role.FOURNISSEUR) {
                setActiveTab('Produits-fournisseur');
            } else if (userRole === Role.RESTAURANT) {
                setActiveTab('Restaurants-gestion');
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

    // Onglet d'origine de la navigation vers "Commandes" — Commandes est partagé par plusieurs
    // espaces de gestion (Boutique, Produits-fournisseur, Restaurants-gestion...). On mémorise
    // l'onglet exact d'où l'utilisateur est venu pour que le bouton "Retour" le ramène toujours
    // à son point de départ réel, jamais figé sur un onglet par défaut. Reste `null` (pas de
    // bouton retour) quand on arrive sur Commandes via la Sidebar.
    const [commandesOrigin, setCommandesOrigin] = useState<TabType | null>(null);

    // Libellé du bouton "Retour" affiché dans <Commandes />, par onglet d'origine possible.
    const COMMANDES_ORIGIN_LABELS: Partial<Record<TabType, string>> = {
        'Boutique': 'Retour à la boutique',
        'Produits-fournisseur': 'Retour à mon espace fournisseur',
        'Restaurants-gestion': 'Retour à mes restaurants',
        'Menus-restaurant': 'Retour à mes restaurants',
    };

    // React Query for global data
    // bookingScope fait partie de la clé pour relire la liste à chaque changement
    // d'onglet Reçues/Mes réservations (données toujours à jour).
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: ['my-space', activeTab, page, limit, bookingScope],
        queryFn: () => getMySpace({ activeTab, page, limit }),
        // queryFn: () => getAllSearch({ activeTab, page, limit }),
    });

    const data = response?.data;

    // Écran d'entrée plein écran (FullScreenOverlayPortal) : même queryKey que le menu
    // AKWABA interrogé par Sidebar.tsx → requête dédupliquée par React Query, aucun appel
    // réseau supplémentaire. `enabled: !!data?.user` reproduit la garde de Sidebar.tsx —
    // tant que `data?.user` n'existe pas, cette query reste désactivée et `isLoading` vaut
    // `false` (sémantique React Query v5 : isPending && isFetching), d'où le check explicite
    // `!data?.user` ci-dessous plutôt que de se fier uniquement à akwabaMenusLoading.
    const { isLoading: akwabaMenusLoading } = useQuery({
        queryKey: queryKeys.menus.byType('AKWABA'),
        queryFn: () => getMenusByType('AKWABA'),
        enabled: !!data?.user,
    });
    const showEntryOverlay = !isMounted || !data?.user || akwabaMenusLoading;

    // Invalide le cache "my-space" dès qu'une réservation change de statut (validation,
    // scan, terminaison, annulation...), où que l'action ait été effectuée — sinon les
    // onglets Rendez-vous/Rendez-vous-annonces/Historique-rdv (alimentés par cette seule
    // requête, staleTime 5 min) restent bloqués sur l'ancien statut jusqu'à expiration du
    // cache. Même pattern déjà utilisé par AccountAnnonces.tsx / AccountServicesList.tsx.
    useRealTimeUpdate('Booking', () => { void refetch(); });

    // Mapping data per tab
    const tabData = useMemo(() => {
        if (!data) return { items: [] as (Service | Annonce | Booking)[], total: 0, totalPages: 0 };

        // Sélectionne le bon groupe de réservations selon le rôle et la portée choisie.
        // CLIENT → toujours "placées". PRESTATAIRE/ADMIN → "reçues" par défaut, "placées" si basculé.
        const bookingGroup = (userRole !== Role.CLIENT && bookingScope === 'received')
            ? data.bookingsReceived
            : data.bookingsPlaced;
        const bookingItems = {
            items: bookingGroup?.data || [],
            total: bookingGroup?.total || 0,
            totalPages: bookingGroup?.totalPages || 0,
        };

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
                return bookingItems;

            case 'Annonces':
                // For now, Annonces and Bookings are not paginated on backend API, so we calculate totalPages manually if needed
                return {
                    items: data.annonces || [],
                    total: data.total || 0,
                    totalPages: Math.ceil((data.annonces?.length || 0) / limit)
                };

            case "Rendez-vous-annonces":
                return bookingItems;
            case "Historique-rdv":
                return bookingItems;

            default:
                return { items: [], total: 0, totalPages: 0 };
        }
    }, [data, activeTab, limit, userRole, bookingScope]);

    const handleTabChange = (tab: TabType) => {
        if (tab === 'Tarifs') {
            router.push('/pricing');
            return;
        }
        setCommandesOrigin(null);
        setActiveTab(tab);
        setPage(1);
    };

    const handleNavigateToOrders = () => {
        setCommandesOrigin(activeTab);
        setActiveTab('Commandes');
        setPage(1);
    };

    const handleBackFromOrders = () => {
        const origin = commandesOrigin;
        setCommandesOrigin(null);
        setActiveTab(origin ?? 'Boutique');
        setPage(1);
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Sélecteur Reçues / Mes réservations — affiché uniquement pour un PRESTATAIRE,
    // qui peut être à la fois fournisseur (réservations reçues) et client (réservations placées).
    const renderBookingScopeToggle = () => {
        if (userRole !== Role.PRESTATAIRE) return null;
        const switchScope = (scope: 'received' | 'placed') => {
            if (scope === bookingScope) return;
            setBookingScope(scope);
            setPage(1);
        };
        return (
            <div className="flex bg-muted/30 p-1 rounded-xl border border-border w-fit mb-4">
                <button onClick={() => switchScope('received')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${bookingScope === 'received' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon icon="solar:download-square-bold-duotone" className="w-4 h-4" />
                    {t("akwaba.bookings.scope_received")}
                </button>
                <button onClick={() => switchScope('placed')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${bookingScope === 'placed' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Icon icon="solar:upload-square-bold-duotone" className="w-4 h-4" />
                    {t("akwaba.bookings.scope_placed")}
                </button>
            </div>
        );
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
                    <AccountServicesList data={tabData.items as Service[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} user={data?.user} onNavigateToBookings={() => setActiveTab('Rendez-vous')} />
                );
            case 'Annonces':
                return (
                    <AccountAnnonces data={tabData.items as Annonce[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} user={data?.user} onNavigateToBookings={() => setActiveTab('Rendez-vous-annonces')} />
                );
            case 'Rendez-vous':
                return (
                    <>
                        {renderBookingScopeToggle()}
                        <AccountBookings type="active" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} scope={bookingScope === 'received' ? 'recues' : 'passees'} />
                    </>
                );
            case 'Rendez-vous-annonces':
                return (
                    <>
                        {renderBookingScopeToggle()}
                        <AnnoncesBookings type="active" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} scope={bookingScope === 'received' ? 'recues' : 'passees'} />
                    </>
                );
            case 'Historique-rdv':
                return (
                    <>
                        {renderBookingScopeToggle()}
                        <HistoriqueRdv type="history" data={tabData.items as Booking[]} page={page} limit={limit} total={tabData.total} totalPages={tabData.totalPages} loading={isLoading} onPageChange={setPage} onSuccess={() => { void refetch(); }} scope={bookingScope === 'received' ? 'recues' : 'passees'} />
                    </>
                );
            case 'Historique-commandes':
                return <HistoriqueCommandes />;
            case 'Boutique':
                return <Store onNavigateToOrders={handleNavigateToOrders} />;
            case 'Commandes':
                return (
                    <Commandes
                        onSuccess={() => { void refetch(); }}
                        backLabel={commandesOrigin ? COMMANDES_ORIGIN_LABELS[commandesOrigin] : undefined}
                        onBack={commandesOrigin ? handleBackFromOrders : undefined}
                    />
                );
            case 'Services-logistiques':
                return (<LogisticsServicesList mode="marketplace" onRequestQuote={(service) => { setSelectedServiceForQuote(service); setIsQuoteModalOpen(true); }} />);
            case 'Mes-services-logistiques':
                return <LogisticsServicesList mode="management" onNavigateToQuotes={() => setActiveTab('Devis-recus')} onNavigateToDeliveries={() => setActiveTab('Livraisons')} />;
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
            case 'Retours-SAV':
                return <RetoursSAV />;
            case 'Recharge-gaz':
                return <GasRefillRequest />;
            case 'Mes-bouteilles-gaz':
                return <GasProviderDashboard />;
            case 'Mon-Garage':
                return <GarageManagement />;
            case 'Produits-fournisseur':
                return <FournisseurBoutique onNavigateToOrders={handleNavigateToOrders} />;
            case 'Devis-fournisseur':
                return <FournisseurQuotesList />;
            case 'Restaurants-gestion':
            case 'Menus-restaurant':
                return <RestaurantManagement onNavigateToOrders={handleNavigateToOrders} />;
            case 'Historique':
                return <UnifiedHistory />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen">

            {/* Point d'entrée plein écran — reste visible tant que l'utilisateur et le
                menu AKWABA (Sidebar) ne sont pas entièrement prêts, remplace l'ancien
                flash de fond vide (if (!isMounted) return <div .../>). */}
            <FullScreenOverlayPortal show={showEntryOverlay}>
                <AppEntrySkeleton />
            </FullScreenOverlayPortal>

            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-2 md:px-4 py-10">

                {/* SIDEBAR (Desktop & Mobile) */}
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} user={data?.user} onLogout={handleLogout} />

                {/* CONTENT AREA — pas de padding horizontal propre sur mobile : le wrapper ci-dessus
                    fournit déjà une marge discrète, chaque contenu gère ensuite son propre padding interne */}
                <main className="md:col-span-8 lg:col-span-9 px-0 py-2 md:p-2">
                    {renderContent()}
                    {/* <ChatWidget /> */}
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

            {/* Biometric setup — s'affiche une seule fois si PWA installée et non configurée */}
            <BiometricSetupModal />

            {/* Rappel d'installation PWA — s'affiche tant que l'app n'est pas installée */}
            <InstallPWA />

            {/* Global Modals */}
            <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)}>
                {selectedServiceForQuote && (
                    <QuoteRequestModal service={selectedServiceForQuote} isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} onSuccess={() => { setActiveTab('Mes-devis'); }} />
                )}
            </Modal>


        </div>
    );
}
