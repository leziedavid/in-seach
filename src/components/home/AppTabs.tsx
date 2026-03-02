"use client"

import { useState, useRef, useEffect } from "react"
import { HistoryIcon, AccountIcon, SearchIcon } from "./TabIcons"
import SearchServies from "../service/SearchServies"
import BookingsPage from "../bookings/BookingsPage"
import SearchAnnonces from "../service/SearchAnnonces"

const tabs = [
    { id: "search", label: "", Icon: SearchIcon },
    { id: "annonces", label: "Annonces", Icon: HistoryIcon },

    // { id: "annonces", label: "Mes services", Icon: SearchIcon },
    // { id: "commandes", label: "Mes commandes", Icon: OrdersIcon },
    // { id: "historique", label: "Historique", Icon: HistoryIcon },
    { id: "compte", label: "Mon compte", Icon: AccountIcon },
]

export default function AppTabs() {

    const [active, setActive] = useState("search")
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const activeTabRef = useRef<HTMLButtonElement>(null)

    // Scroll vers l'onglet actif au chargement et quand il change
    useEffect(() => {
        if (activeTabRef.current && scrollContainerRef.current) {
            const container = scrollContainerRef.current
            const activeTab = activeTabRef.current
            const containerRect = container.getBoundingClientRect()
            const activeTabRect = activeTab.getBoundingClientRect()
            const scrollLeft = activeTab.offsetLeft - (container.clientWidth / 2) + (activeTab.clientWidth / 2)
            container.scrollTo({ left: scrollLeft, behavior: 'smooth' })

        }
    }, [active])

    return (
        <div className="flex flex-col items-center w-full px-2 sm:px-4 py-4 sm:py-8">
            {/* TABS RESPONSIVE AVEC SCROLL + CENTRÉ */}
            <div ref={scrollContainerRef} className="w-full overflow-x-auto scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex w-fit mx-auto gap-4 sm:gap-6 px-3 py-2">

                    {tabs.map((tab) => {
                        const isActive = active === tab.id
                        const Icon = tab.Icon

                        return (
                            <button key={tab.id} ref={isActive ? activeTabRef : null} onClick={() => setActive(tab.id)} className="flex flex-col items-center shrink-0 transition-all"  >
                                {/* Cercle */}
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-105  ${isActive ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-card border-border"} `}  >
                                    <Icon active={isActive} />
                                </div>


                                {/* Label */}
                                <span className={` text-[10px] sm:text-xs mt-1 sm:mt-2 whitespace-nowrap ${tab.label === "" ? "hidden sm:block" : ""} ${isActive ? "text-primary font-medium" : "text-muted-foreground"} `}  >
                                    {tab.label || "Recherche"}
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


            {/* CONTENT */}
            <div className="mt-4 sm:mt-6 w-full flex flex-col items-center">
                {active === "search" && (
                    <div className="w-full flex flex-col items-center px-2 sm:px-0">
                        {/* <TitlePage part1="Trouvez" highlight="le service idéal" part2="pour vos besoins !" /> */}
                        <SearchServies />
                    </div>
                )}

                {active === "annonces" && (
                    <div className="w-full flex flex-col items-center px-2 sm:px-0">
                        <SearchAnnonces />
                    </div>
                )}

                {active === "commandes" && (
                    <div className="w-full flex flex-col items-center px-2 sm:px-0">
                        <BookingsPage />
                    </div>
                )}

                {active === "historique" && (
                    <div className="text-center px-4 py-8">
                        <h3 className="text-lg font-semibold">Historique</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Votre historique s'affichera ici
                        </p>
                    </div>
                )}

                {active === "compte" && (
                    <div className="text-center px-4 py-8">
                        <h3 className="text-lg font-semibold">Mon compte</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Gérez vos informations personnelles
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}