"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import QrCodeLogo from "./QrCodeLogo";
import { getUserId, getUserName } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";

// Définition des onglets avec leurs URLs
const NAVIGATION_TABS = [
    { key: "Tarifs", label: "Tarifs", icon: "solar:chat-round-money-bold-duotone", path: "/pricing" },
    { key: "calendar", label: "Calendrier", icon: "solar:calendar-date-bold-duotone", path: "/calendar" },
];

export default function Header() {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    /* ------------------------- EXTRA FUNCTIONALITIES ADDED ------------------------- */
    const [gain, setGain] = useState(10000000);
    const [unreadMessages, setUnreadMessages] = useState(3);
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const images = [
        "/avatars/user1.png",
        "/avatars/user2.png",
        "/avatars/user3.png",
        "/avatars/user4.png",
    ];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // 🔄 ANIMATION AVATAR
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // 👤 FETCH USERNAME
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const userName = await getUserName();
                if (mounted) setUserName(userName);

                const userID = await getUserId();
                if (mounted) setUserId(userID);

            } catch {
                console.log("Error");
            }

        })();
        return () => {
            mounted = false;
        };
    }, []);

    // Fonction pour déterminer si un onglet est actif
    const isTabActive = (tabPath: string): boolean => {
        if (tabPath === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(tabPath);
    };

    return (
        <header className="w-full flex items-center justify-between px-6 py-4 relative bg-background border-b border-border transition-colors duration-300">

            {/* LEFT USER SECTION */}
            <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden relative">
                    {images.map((img, index) => (
                        <Image
                            key={img}
                            src={img}
                            alt="Avatar"
                            width={44}
                            height={44}
                            className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                                }`}
                        />
                    ))}
                </div>

                <div>
                    <p className="text-sm text-muted-foreground leading-tight">Salut, 👋</p>
                    <p className="font-semibold text-foreground text-sm">{userName || "TDLLEZIE"}</p>
                </div>

            </div>

            {/* Tabs Desktop - Navigation avec URLs */}
            <nav className="hidden md:flex gap-6">
                {NAVIGATION_TABS.map((tab) => {
                    const active = isTabActive(tab.path);
                    return (
                        <Link key={tab.key} href={tab.path} className={`flex items-center gap-2 text-sm font-medium transition-all ${active ? "text-primary-foreground bg-primary px-3 py-1 rounded-full shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"}`} >
                            {/* <Image src={tab.icon} alt={tab.label} width={20} height={20} /> */}
                            {tab.label}
                        </Link>

                    );
                })}
            </nav>

            {/* RIGHT ACTIONS — toujours visibles */}
            <div className="flex items-center gap-3">
                <ThemeToggle />
                <QrCodeLogo user={userId} />


                <Link href="/messages">
                    <button className="relative bg-primary p-2 rounded-full transition hover:bg-secondary flex items-center justify-center">
                        <Icon icon="solar:bell-bing-bold-duotone" className="text-white w-6 h-6" />
                        {unreadMessages > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-primary">
                                {unreadMessages}
                            </span>
                        )}
                    </button>
                </Link>
                <Link href="/akwaba">
                    <button className="relative bg-background p-1 rounded-full border border-border transition hover:border-primary">
                        <Image src="/profile.webp" alt="Service" width={30} height={30} className="rounded-full" />
                    </button>
                </Link>


            </div>

            {/* Mobile Floating Button */}
            <button className={`md:hidden fixed bottom-6 left-6 p-3 rounded-full z-50 shadow-lg flex items-center justify-center ${open ? "bg-foreground text-background" : "bg-primary text-white"}`} onClick={() => setOpen(!open)}>
                {open ? (
                    <Icon icon="solar:close-circle-bold-duotone" className="w-6 h-6" />
                ) : (
                    <Icon icon="solar:hamburger-menu-bold-duotone" className="w-6 h-6" />
                )}
            </button>

            {/* Mobile Bottom Menu - Navigation avec URLs */}
            {open && (
                <div className="md:hidden fixed bottom-20 left-0 w-full px-4 z-50 flex justify-center">
                    <div className="bg-card shadow-xl rounded-3xl p-4 w-[90%] flex flex-col gap-4 border border-border">

                        {NAVIGATION_TABS.map((tab) => {
                            const active = isTabActive(tab.path);
                            return (
                                <Link key={tab.key} href={tab.path} onClick={() => setOpen(false)} className={`flex items-center gap-3 text-lg font-bold px-5 py-4 rounded-2xl transition-all ${active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground bg-muted hover:bg-muted/80"}`}  >
                                    <Icon icon={tab.icon} className="w-7 h-7" />
                                    {tab.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}