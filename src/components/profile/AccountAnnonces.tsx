'use client';

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Icon } from "@iconify/react"
import { Annonce, Booking, UserProfile, AnnonceStats } from "@/types/interface"
import { getAnnonceStats, getMyBookings } from "@/api/api"
import { AccordionSection } from "@/components/ui/AccordionSection"
import BoostedEntityList from "@/components/boost/BoostedEntityList"
import BookingDetailModal from "@/components/bookings/sections/BookingDetail"
import OnBack from "@/components/shared/OnBack"
import { useRealTimeUpdate } from "@/hooks/useRealTimeUpdate"

import AnnoncesManagementContent from "./components/AnnoncesManagementContent"
import AnnoncePerformance from "./components/AnnoncePerformance"
import RecentBookings from "./components/RecentBookings"

interface AccountAnnoncesProps {
    data?: Annonce[];
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    loading?: boolean;
    onPageChange?: (page: number) => void;
    onSuccess?: () => void;
    /** Profil de l'utilisateur connecté (déjà chargé par la page parente via getMySpace) */
    user?: UserProfile;
    /** Permet de naviguer vers l'onglet "Rendez-vous-annonces" du dashboard (optionnel) */
    onNavigateToBookings?: () => void;
    onBack: () => void;
}

export default function AccountAnnonces({ data = [], page = 1, limit = 6, total = 0, totalPages = 0, loading = false, onPageChange, onSuccess, user, onNavigateToBookings, onBack }: AccountAnnoncesProps) {

    // KPI Stats
    const [annonceStats, setAnnonceStats] = useState<AnnonceStats | null>(null)

    // Réservations récentes
    const [recentBookings, setRecentBookings] = useState<Booking[]>([])
    const [recentBookingsLoading, setRecentBookingsLoading] = useState(false)
    const [previewBooking, setPreviewBooking] = useState<Booking | null>(null)
    const [isBookingPreviewOpen, setIsBookingPreviewOpen] = useState(false)

    // Actions rapides — accordéons repliés par défaut, un seul ouvert à la fois
    const [activeQuickAction, setActiveQuickAction] = useState<string | null>(null)
    const toggleQuickAction = (id: string) => setActiveQuickAction(prev => prev === id ? null : id)

    const fetchAnnonceStats = useCallback(async () => {
        try {
            const res = await getAnnonceStats()
            if (res.statusCode === 200 && res.data) {
                setAnnonceStats(res.data)
            }
        } catch (error) {
            console.error("Error fetching annonce stats:", error)
        }
    }, [])

    const fetchRecentBookings = useCallback(async () => {
        setRecentBookingsLoading(true)
        try {
            const res = await getMyBookings({ page: 1, limit: 5, type: "ANNONCE" })
            if (res.statusCode === 200 && res.data) {
                setRecentBookings(res.data.bookingsReceived?.data || [])
            }
        } catch (error) {
            console.error("Error fetching recent bookings:", error)
        } finally {
            setRecentBookingsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAnnonceStats()
        fetchRecentBookings()
    }, [fetchAnnonceStats, fetchRecentBookings])

    // 🔄 Rafraîchit stats + réservations récentes quand une réservation évolue en temps réel
    useRealTimeUpdate('Booking', () => {
        fetchAnnonceStats()
        fetchRecentBookings()
    })

    const openBookingPreview = (booking: Booking) => {
        setPreviewBooking(booking)
        setIsBookingPreviewOpen(true)
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-0 md:px-4 py-2">
            <OnBack
                label="Développez la visibilité de vos annonces"
                onBack={onBack}
                subtitle="Publiez vos annonces, gérez vos réservations et boostez votre visibilité auprès des clients."
                className="mb-6"
            />

            {/* ── Hero : identité de l'annonceur ── */}
            {user && (
                <div className="w-full max-w-4xl mx-auto mb-4 px-0 md:px-4">
                    <div className="bg-card border border-border rounded-3xl p-5 md:p-6 flex items-center gap-4 md:gap-6 shadow-sm">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden shrink-0">
                            {(user.avatarUrl || user.avatar) ? (
                                <Image src={user.avatarUrl || user.avatar || ""} alt={user.fullName || "Annonceur"} fill className="object-cover" unoptimized />
                            ) : (
                                <Icon icon="solar:user-id-bold-duotone" className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                            )}
                        </div>
                        <div className="space-y-1 min-w-0">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Mes Annonces</p>
                            <h3 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate max-w-[220px] md:max-w-md">
                                {user.companyName || user.fullName || "Mes Annonces"}
                            </h3>
                            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                {user.companyName && user.fullName && (
                                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Icon icon="solar:user-bold-duotone" className="w-3 h-3 text-primary" />
                                        {user.fullName}
                                    </p>
                                )}
                                {user.phone && (
                                    <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-2 uppercase tracking-widest">
                                        <Icon icon="solar:phone-bold-duotone" className="w-3 h-3 text-primary" />
                                        {user.phone}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Performances ── */}
            <div className="w-full max-w-4xl mx-auto px-2 md:px-4 mb-8">
                <AnnoncePerformance stats={annonceStats} />
            </div>

            {/* ── Actions rapides ── */}
            <div className="w-full max-w-4xl mx-auto px-2 md:px-4 mb-8">
                <h3 className="text-lg font-black text-foreground mb-4">Développez vos annonces</h3>

                <div className="flex flex-col gap-3">
                    <AccordionSection
                        id="catalogue-annonces"
                        title="Catalogue d'annonces"
                        subtitle="Gérez vos annonces en ligne"
                        icon="solar:lightbulb-bolt-bold-duotone"
                        activeSection={activeQuickAction}
                        onToggle={toggleQuickAction}
                    >
                        <AnnoncesManagementContent
                            data={data}
                            page={page}
                            limit={limit}
                            total={total}
                            totalPages={totalPages}
                            loading={loading}
                            onPageChange={onPageChange}
                            onSuccess={onSuccess}
                        />
                    </AccordionSection>

                    <AccordionSection
                        id="boost-annonces"
                        title="Booster mes annonces"
                        subtitle="Gagnez en visibilité auprès des clients"
                        icon="solar:rocket-bold-duotone"
                        activeSection={activeQuickAction}
                        onToggle={toggleQuickAction}
                    >
                        <p className="text-xs text-muted-foreground mb-4">
                            Depuis le Catalogue, cliquez sur l&apos;icône <Icon icon="solar:rocket-bold-duotone" className="inline w-3.5 h-3.5 text-primary" /> d&apos;une annonce pour la booster. Retrouvez ici toutes vos annonces boostées.
                        </p>
                        <BoostedEntityList entityType="ANNONCE" entityLabel="annonce" />
                    </AccordionSection>

                    <button onClick={onNavigateToBookings} className="w-full flex items-center gap-4 p-5 bg-card border border-border/60 hover:border-border rounded-2xl shadow-sm transition-all text-left">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                            <Icon icon="solar:clipboard-list-bold-duotone" className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black tracking-tight text-foreground">Réservations reçues</h3>
                                {!!annonceStats?.pendingBookingsCount && (
                                    <span className="text-[10px] font-black bg-primary text-white rounded-full px-2 py-0.5">{annonceStats.pendingBookingsCount}</span>
                                )}
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground">Suivez vos rendez-vous et leurs statuts</p>
                        </div>
                        <Icon icon="solar:alt-arrow-right-bold-duotone" className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                    </button>
                </div>
            </div>

            {/* ── Réservations récentes ── */}
            <div className="w-full max-w-4xl mx-auto px-2 md:px-4 mb-8">
                <RecentBookings
                    bookings={recentBookings}
                    loading={recentBookingsLoading}
                    onSelect={openBookingPreview}
                    onSeeAll={onNavigateToBookings}
                    entityType="ANNONCE"
                />
            </div>

            <BookingDetailModal isOpen={isBookingPreviewOpen} onClose={() => { setIsBookingPreviewOpen(false); setPreviewBooking(null); }} booking={previewBooking} />
        </div>
    );
}
