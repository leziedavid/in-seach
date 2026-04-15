"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import SearchAnnonces from "../service/SearchAnnonces"
import Boutique from "../products/Boutique"
import LogisticsServicesList from "../logistics/LogisticsServicesList"
import { HistoryIcon, AccountIcon, SearchIcon, LogisticsIcon } from "./TabIcons"
import Info from "./Info"
import SearchServies from "../service/SearchServies"
import QuoteRequestModal from "../logistics/QuoteRequestModal"
import { Modal } from "../modal/MotionModal"
import { LogisticService } from "@/types/interface"
import { Icon } from "@iconify/react"



const tabs = [
    {
        id: "search",
        label: "",
        Icon: SearchIcon,
        info: {
            title: "Expertise à la Demande",
            description: "Accédez instantanément aux meilleurs talents. Du dépannage d'urgence aux services experts, Nexxa vous connecte avec des professionnels vérifiés."
        }
    },
    {
        id: "annonces",
        label: "Opportunités",
        Icon: HistoryIcon,
        info: {
            title: "Marketplace d'Opportunités",
            description: "Vendez, achetez ou dénichez des pépites locales. Une interface intuitive pour donner une seconde vie à vos biens en toute sécurité."
        }
    },
    {
        id: "boutique",
        label: "Boutique",
        Icon: AccountIcon,
        info: {
            title: "Shopping Premium",
            description: "Découvrez une sélection exclusive de produits. Une expérience d'achat fluide pensée pour votre confort et votre sécurité."
        }
    },
    {
        id: "logistics",
        label: "Logistique",
        Icon: LogisticsIcon,
        info: {
            title: "Logistique Globale",
            description: "Expédiez sans frontières. Solutions de transport maritime, aérien et suivi en temps réel pour vos flux internationaux."
        }
    },
]

export default function AppTabs() {

    const [active, setActive] = useState("search")
    const [showInfo, setShowInfo] = useState(true)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const activeTabRef = useRef<HTMLButtonElement>(null)
    const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<LogisticService | null>(null)
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)

    const handleTabClick = (id: string) => {
        if (active !== id) {
            setActive(id)
            setShowInfo(true)
        }
    }

    const openQuoteModal = (service: LogisticService) => {
        setSelectedServiceForQuote(service)
        setIsQuoteModalOpen(true)
    }

    // Scroll vers l'onglet actif au chargement et quand il change
    useEffect(() => {
        if (activeTabRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const activeTab = activeTabRef.current
            const scrollLeft = activeTab.offsetLeft - (container.clientWidth / 2) + (activeTab.clientWidth / 2)
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
        }
    }, [active])

    return (
        <div className="flex flex-col items-center w-full px-0 sm:px-4 py-4 sm:py-8">

            {/* TABS RESPONSIVE AVEC SCROLL + CENTRÉ */}
            <div ref={scrollContainerRef} className="w-full overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-fit mx-auto gap-4 sm:gap-6 px-3 py-2">

                    {tabs.map((tab) => {
                        const isActive = active === tab.id
                        const IconComponent = tab.Icon

                        return (
                            <button key={tab.id} ref={isActive ? activeTabRef : null} onClick={() => handleTabClick(tab.id)} onMouseEnter={() => handleTabClick(tab.id)} className="relative flex flex-col items-center shrink-0 group py-2 px-1" >
                                {/* Active Indicator (Sliding Background) */}
                                {isActive && (
                                    <motion.div layoutId="activeTabBackground" className="absolute inset-0 bg-primary/5 rounded-2xl z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}

                                {/* Cercle */}
                                <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 transition-all duration-300 group-hover:scale-110 active:scale-95 ${isActive ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-105" : "bg-card border-border hover:border-primary/40"} `}  >
                                    <IconComponent active={isActive} />

                                    {/* Small indicator dot for active state */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeDot"
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-background"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        />
                                    )}
                                </div>

                                {/* Label */}
                                <span className={`relative z-10 text-[10px] sm:text-xs mt-1 sm:mt-2 whitespace-nowrap transition-colors duration-300 ${tab.label === "" ? "hidden sm:block" : ""} ${isActive ? "text-primary font-bold" : "text-muted-foreground group-hover:text-primary/70"} `}  >
                                    {tab.label || "Recherche"}
                                </span>

                                {/* Bottom sliding bar */}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabUnderline"
                                        className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>


            {/* INDICATEURS DE SCROLL (optionnel) */}
            <div className="flex sm:hidden items-center justify-center gap-1 mt-2">
                {tabs.map((tab) => (
                    <div key={`dot-${tab.id}`} className={` w-1.5 h-1.5 rounded-full transition-all duration-300 ${active === tab.id ? "w-4 bg-primary" : "bg-muted"} `} />
                ))}
            </div>


            {/* INFO COMPONENT */}
            <Info isOpen={showInfo}
                onClose={() => setShowInfo(false)}
                title={tabs.find(t => t.id === active)?.info.title || ""}
                description={tabs.find(t => t.id === active)?.info.description || ""}
            />


            {/* CONTENT */}
            <div className="mt-4 sm:mt-6 w-full flex flex-col items-center stagger-parent">
                {active === "search" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <SearchServies />
                    </div>
                )}

                {active === "annonces" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <SearchAnnonces />
                    </div>
                )}

                {active === "boutique" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <Boutique />
                    </div>
                )}

                {active === "logistics" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <LogisticsServicesList mode="marketplace" onRequestQuote={openQuoteModal} />
                    </div>
                )}
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