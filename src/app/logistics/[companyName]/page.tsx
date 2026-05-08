"use client"

import { useState, useEffect, useCallback, use } from "react"
import { getPublicLogisticsInfo } from "@/api/api"
import { LogisticService } from "@/types/interface"
import LogisticsServicesList from "@/components/logistics/sections/LogisticsServicesList"
import { Modal } from "@/components/ui/MotionModal"
import { Icon } from "@iconify/react"
import Image from "next/image"
import dynamic from "next/dynamic"
import NotFound from "@/components/common/NotFound"
import Loader from "@/components/common/Loader"

// Lazy-load : uniquement chargé quand l'utilisateur ouvre un devis
const QuoteRequestModal = dynamic(() => import("@/components/logistics/modals/QuoteRequestModal"), { ssr: false })

type Props = { params: Promise<{ companyName: string }> }

export default function LogisticsCompanyPage(props: Props) {

    const { companyName } = use(props.params)
    const [companyInfo, setCompanyInfo] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<LogisticService | null>(null)
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)

    const cleanName = (slug: string) => {
        return slug?.replace(/-/g, " ").trim()
    }

    const fetchCompanyInfo = useCallback(async () => {
        try {
            setLoading(true)
            const res = await getPublicLogisticsInfo(companyName)
            if (res.statusCode === 200 && res.data) {
                setCompanyInfo(res.data)
            }
        } catch (error) {
            console.error("Error fetching company logistics info:", error)
        } finally {
            setLoading(false)
        }
    }, [companyName])

    useEffect(() => {
        fetchCompanyInfo()
    }, [fetchCompanyInfo])

    const openQuoteModal = (service: LogisticService) => {
        setSelectedServiceForQuote(service)
        setIsQuoteModalOpen(true)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <Loader
                    title="Chargement de l'entreprise..."
                    description="Nous récupérons les informations de cette compagnie logistique, veuillez patienter."
                    icon="solar:delivery-bold-duotone"
                />
            </div>
        )
    }

    if (!companyInfo) {
        return (
            <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
                <NotFound
                    title="Entreprise introuvable"
                    description="Cette compagnie logistique n'existe pas ou n'est plus disponible. Vérifiez l'URL ou explorez d'autres compagnies partenaires."
                    icon="solar:delivery-bold-duotone"
                />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 py-8 md:py-12">
            {/* Company Header */}
            <div className="flex flex-col items-center text-center w-full max-w-4xl mb-12 space-y-4">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-card border-4 border-background shadow-xl overflow-hidden mb-2">
                    {companyInfo?.logo ? (
                        <Image src={companyInfo.logo} alt={companyInfo.companyName || "Entreprise"} fill className="object-cover" unoptimized />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Icon icon="solar:delivery-bold-duotone" className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h1 className="text-2xl md:text-4xl font-black text-foreground uppercase tracking-tight leading-none">
                        {companyInfo?.companyName || cleanName(companyName)}
                    </h1>
                    <p className="text-xs md:text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">
                        {companyInfo?.serviceCount || 0} Services Logistiques
                    </p>
                </div>

                {companyInfo?.siegeSocial && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">{companyInfo.siegeSocial}</span>
                    </div>
                )}
            </div>

            {/* Services List */}
            <div className="w-full">
                <LogisticsServicesList
                    mode="marketplace"
                    companyName={cleanName(companyName)}
                    onRequestQuote={openQuoteModal}
                />
            </div>

            {/* Quote Request Modal */}
            <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)}>
                {selectedServiceForQuote && (
                    <QuoteRequestModal
                        service={selectedServiceForQuote}
                        isOpen={isQuoteModalOpen}
                        onClose={() => setIsQuoteModalOpen(false)}
                        onSuccess={() => { setIsQuoteModalOpen(false); }}
                    />
                )}
            </Modal>
        </div>
    )
}
