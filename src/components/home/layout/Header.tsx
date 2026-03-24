"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import QrCodeLogo from "./QrCodeLogo";
import { getUserId, getUserName, isAuthenticated } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { getConversationsCount } from "@/api/api";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCart } from "@/components/providers/CartProvider";
import CartDetailModal from "@/components/products/CartDetailModal";
import { useNotification } from "@/components/toast/NotificationProvider";

// Définition des onglets avec leurs URLs <Icon icon="ic:twotone-home-max" width="24" height="24" />
const NAVIGATION_TABS = [
    { key: "accueil", label: "Accueil", icon: "ic:twotone-home-max", path: "/" },
    // { key: "Tarifs", label: "Tarifs", icon: "solar:chat-round-money-bold-duotone", path: "/pricing" },
    { key: "calendar", label: "Mon Espace", icon: "solar:calendar-date-bold-duotone", path: "/akwaba" },
];

export default function Header() {
    const pathname = usePathname();

    /* ------------------------- EXTRA FUNCTIONALITIES ADDED ------------------------- */
    const [gain, setGain] = useState(10000000);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const { socket } = useSocket();
    const { totalItems } = useCart();
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const { addNotification } = useNotification();
    const router = useRouter();

    const protectedPaths = ["/akwaba", "/chat-ia", "/dashboard"];

    const handleProtectedNavigation = (path: string) => {
        if (!isAuthenticated()) {
            addNotification("Vous devez être connecté pour accéder à cette section.", "warning");
            router.push("/login?callbackUrl=" + path);
            return false;
        }
        router.push(path);
        return true;
    };

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

    // 🔔 FETCH UNREAD MESSAGES
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const res = await getConversationsCount();
                if (res.statusCode === 200) {
                    setUnreadMessages(res.data ?? 0);
                }
            } catch (error) {
                console.error("Error fetching unread count:", error);
            }
        };

        fetchUnreadCount();

        if (socket) {
            socket.on("new_message", () => {
                fetchUnreadCount();
            });
            // Update when messages are marked as read globally if needed
            socket.on("messages_read", () => {
                fetchUnreadCount();
            });
        }

        return () => {
            socket?.off("new_message");
            socket?.off("messages_read");
        };
    }, [socket]);

    // Fonction pour déterminer si un onglet est actif
    const isTabActive = (tabPath: string): boolean => {
        if (tabPath === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(tabPath);
    };

    return (

        <header className="fixed left-1/2 -translate-x-1/2 z-50 bottom-4 w-[95%] max-w-[700px] md:top-4 md:bottom-auto md:w-3xl md:max-w-none bg-background/60 backdrop-blur-xl border border-border rounded-full shadow-2xl px-2 py-1.5 md:px-4 md:py-2 flex items-center justify-between md:justify-start md:gap-6 transition-all duration-300">

            {/* User Section - Flat on mobile */}
            <div className="contents md:flex md:items-center md:gap-2">
                <div className="w-10 h-10 md:w-9 md:h-9 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden relative border border-border shrink-0">
                    {images.map((img, index) => (
                        <Image key={img} src={img} alt="Avatar" width={36} height={36} className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`} />
                    ))}
                </div>

                <div className="hidden lg:block shrink-0 ml-2">
                    <p className="text-[10px] text-muted-foreground leading-tight">Salut, 👋</p>
                    <p className="font-semibold text-foreground text-xs">{userName || "TDLLEZIE"}</p>
                </div>
            </div>

            {/* Navigation Tabs - Flat on mobile */}
            <nav className="contents md:flex md:items-center md:gap-2">
                {NAVIGATION_TABS.map((tab) => {
                    const active = isTabActive(tab.path);
                    const isProtected = protectedPaths.includes(tab.path);

                    if (isProtected) {
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleProtectedNavigation(tab.path)}
                                className={`flex items-center gap-2 text-xs font-medium transition-all px-2 md:px-2.5 py-1.5 rounded-full ${active ? "text-primary-foreground bg-primary shadow-md shadow-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
                                title={tab.label}
                            >
                                <Icon icon={tab.icon} className="w-7 h-7 md:w-5 md:h-5" />
                                <span className="hidden md:inline">{tab.label}</span>
                            </button>
                        );
                    }

                    return (
                        <Link key={tab.key} href={tab.path} className={`flex items-center gap-2 text-xs font-medium transition-all px-2 md:px-2.5 py-1.5 rounded-full ${active ? "text-primary-foreground bg-primary shadow-md shadow-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`} title={tab.label} >
                            <Icon icon={tab.icon} className="w-7 h-7 md:w-5 md:h-5" />
                            <span className="hidden md:inline">{tab.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Actions Section - Flat on mobile */}
            <div className="contents md:flex md:items-center md:gap-2">
                <ThemeToggle />

                <button onClick={() => setIsCartModalOpen(true)} className="relative bg-primary p-1.5 md:p-2 rounded-full transition hover:scale-105 active:scale-95 flex items-center justify-center" >
                    <Icon icon="solar:cart-bold" className="text-white w-4 h-4 md:w-5 md:h-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold text-white bg-red-500 rounded-full border border-background">
                            {totalItems}
                        </span>
                    )}
                </button>

                {/* <pre> {userId}</pre> */}
                <QrCodeLogo user={userId} />

                <button
                    onClick={() => handleProtectedNavigation("/chat-ia")}
                    className="relative bg-primary p-1.5 md:p-2 rounded-full transition hover:scale-105 active:scale-95 flex items-center justify-center"
                >
                    <Icon icon="solar:bell-bing-bold-duotone" className="text-white w-4 h-4 md:w-5 md:h-5" />
                    {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1 py-0.5 text-[8px] font-bold text-white bg-red-500 rounded-full border border-background">
                            {unreadMessages}
                        </span>
                    )}
                </button>

                <button onClick={() => handleProtectedNavigation("/akwaba")} className="relative bg-background p-0.5 rounded-full border border-border transition hover:border-primary shrink-0" >
                    <Image src="/profile.webp" alt="Service" width={24} height={24} className="rounded-full" />
                </button>
            </div>

            <CartDetailModal
                isOpen={isCartModalOpen}
                onClose={() => setIsCartModalOpen(false)}
            />

        </header>

    );
}