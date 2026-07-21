"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { Icon } from "@iconify/react"
import SearchAnnonces from "@/components/annonces/sections/SearchAnnonces"
import Boutique from "@/components/store/sections/Boutique"
import { OpportunitiesIcon, BoutiqueIcon, SearchIcon, LogisticsIcon, GazIcon, CarRepairIcon } from "@/components/layout/TabIcons"
import SearchServies from "@/components/services/sections/SearchServies"
import LogisticProvider from "@/components/logistics/sections/LogisticProvider"
import SearchGaz from "@/components/gas-delivery/sections/SearchGaz"
import SearchGarage from "@/components/garage/sections/SearchGarage"
import { useTranslation } from "@/utils/langue/hooks"

export default function AppTabs() {
    const { t } = useTranslation();

    const tabs = [
        {
            id: "search",
            label: "",
            Icon: SearchIcon,
            info: {
                title: t("home.tabs.expertise.title"),
                description: t("home.tabs.expertise.description")
            }
        },
        {
            id: "annonces",
            label: t("home.tabs.opportunities.label"),
            Icon: OpportunitiesIcon,
            info: {
                title: t("home.tabs.opportunities.title"),
                description: t("home.tabs.opportunities.description")
            }
        },
        {
            id: "boutique",
            label: t("home.tabs.boutique.label"),
            Icon: BoutiqueIcon,
            info: {
                title: t("home.tabs.boutique.title"),
                description: t("home.tabs.boutique.description")
            }
        },
        // {
        //     id: "logistics",
        //     label: t("home.tabs.logistics.label"),
        //     Icon: LogisticsIcon,
        //     info: {
        //         title: t("home.tabs.logistics.title"),
        //         description: t("home.tabs.logistics.description")
        //     }
        // },
        {
            id: "gaz",
            label: t("home.tabs.gaz.label"),
            Icon: GazIcon,
            info: {
                title: t("home.tabs.gaz.title"),
                description: t("home.tabs.gaz.description")
            }
        },
        {
            id: "garage",
            label: t("home.tabs.garage.label"),
            Icon: CarRepairIcon,
            info: {
                title: t("home.tabs.garage.title"),
                description: t("home.tabs.garage.description")
            }
        },
    ]

    const [active, setActive] = useState("search")
    const [showInfo, setShowInfo] = useState(true)
    const [hasOverflow, setHasOverflow] = useState(false)
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const activeTabRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        const isInfoClosed = localStorage.getItem("infoClosed") === "true"
        if (isInfoClosed) {
            setShowInfo(false)
        }
    }, [])

    // "search" est l'onglet par défaut : quand on revient en arrière (page restaurée depuis le
    // cache du navigateur), on retombe toujours dessus plutôt que de garder l'onglet précédent.
    useEffect(() => {
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                setActive("search")
            }
        }
        window.addEventListener("pageshow", handlePageShow)
        return () => window.removeEventListener("pageshow", handlePageShow)
    }, [])

    // Affiche l'indicateur de scroll uniquement si les icônes dépassent réellement la largeur visible
    useEffect(() => {
        const checkOverflow = () => {
            const container = scrollContainerRef.current
            if (container) {
                setHasOverflow(container.scrollWidth > container.clientWidth + 4)
            }
        }
        checkOverflow()
        window.addEventListener("resize", checkOverflow)
        return () => window.removeEventListener("resize", checkOverflow)
    }, [tabs.length])

    const handleTabClick = (id: string) => {
        if (active !== id) {
            setActive(id)
            const isInfoClosed = localStorage.getItem("infoClosed") === "true"
            if (!isInfoClosed) {
                setShowInfo(true)
            }
        }
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
        <div className="relative flex flex-col items-center w-full px-0 sm:px-4 py-2 sm:py-4">

            {/* Petite flèche indiquant qu'on peut glisser, visible seulement si ça dépasse */}
            {hasOverflow && (
                <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary mb-1"
                >
                    <Icon icon="solar:round-double-alt-arrow-right-bold-duotone" width={14} height={14} />
                </motion.div>
            )}

            {/* TABS RESPONSIVE AVEC SCROLL + CENTRÉ — au-delà de ~4 icônes, la largeur plafonnée force le scroll horizontal */}
            <div ref={scrollContainerRef} className="w-full max-w-[300px] sm:max-w-[360px] md:max-w-[400px] mx-auto overflow-x-auto scroll-smooth scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
                <div className="flex w-fit mx-auto gap-4 sm:gap-6 px-3 py-2">

                    {tabs.map((tab) => {
                        const isActive = active === tab.id
                        const IconComponent = tab.Icon

                        return (
                            <button key={tab.id} ref={isActive ? activeTabRef : null} onClick={() => handleTabClick(tab.id)} onMouseEnter={() => handleTabClick(tab.id)} className="relative flex flex-col items-center shrink-0 group py-2" >
                                {/* Active Indicator (Sliding Background) */}
                                {isActive && (
                                    <motion.div layoutId="activeTabBackground" className="absolute inset-0 bg-primary/5 rounded-3xl z-0" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                                )}

                                {/* Cercle - Augmenté pour mobile (w-16) et web (sm-w-18) */}
                                <div className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 flex items-center justify-center rounded-[2rem] border transition-all duration-300 ${isActive ? "bg-primary border-primary shadow-[0_10px_25px_-5px_rgba(var(--primary-rgb),0.4)] scale-105" : "bg-white dark:bg-zinc-800 border-border/40 shadow-sx hover:border-primary/50"} `} >
                                    <IconComponent active={isActive} />
                                </div>

                                {/* Label - Optionnel, caché sur mobile si vide */}
                                <span className={`text-[10px] sm:text-xs mt-3 whitespace-nowrap transition-colors duration-300 font-black uppercase tracking-tighter ${tab.id === "search" ? "hidden sm:block" : ""} ${isActive ? "text-primary" : "text-zinc-600 dark:text-zinc-400 group-hover:text-primary"} `}  >
                                    {tab.label || t("home.tabs.expertise.label")}
                                </span>
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

            {/* Petit texte d'aide au scroll, visible seulement si ça dépasse */}
            {hasOverflow && (
                <span className="text-[10px] text-muted-foreground mt-1 tracking-tight">
                    {t("home.tabs.scroll_hint")}
                </span>
            )}


            {/* INFO COMPONENT */}
            {/* <Info isOpen={showInfo}
                onClose={() => { setShowInfo(false); localStorage.setItem("infoClosed", "true") }}
                title={tabs.find(t => t.id === active)?.info.title || ""}
                description={tabs.find(t => t.id === active)?.info.description || ""}
            /> */}


            {/* CONTENT */}
            <div className="mt-2 sm:mt-4 w-full flex flex-col items-center stagger-parent">
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
                        <LogisticProvider />
                    </div>
                )}

                {active === "gaz" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <SearchGaz />
                    </div>
                )}

                {active === "garage" && (
                    <div className="w-full flex flex-col items-center px-0 sm:px-0 stagger-item">
                        <SearchGarage />
                    </div>
                )}
            </div>

        </div>
    )
}