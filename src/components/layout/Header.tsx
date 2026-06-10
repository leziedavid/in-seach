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
import CartDetailModal from "@/components/store/modals/CartDetailModal";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageToggle } from "./LanguageToggle";

const NAVIGATION_TABS = [
    { key: "accueil", label: "Accueil", icon: "solar:home-2-linear", path: "/" },
];

export default function Header() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    /* ------------------------- EXTRA FUNCTIONALITIES ADDED ------------------------- */
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [userName, setUserName] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const { socket } = useSocket();
    const { totalItems } = useCart();
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const { addNotification } = useNotification();
    const router = useRouter();

    const protectedPaths = ["/akwaba", "/chat-ia", "/admin"];

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

    useEffect(() => {
        setMounted(true);
        const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
        checkDesktop();
        window.addEventListener('resize', checkDesktop);
        return () => window.removeEventListener('resize', checkDesktop);
    }, []);

    // 🔄 ANIMATION AVATAR
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // 📍 Ferme le menu sur /akwaba (mobile)
    useEffect(() => {
        if (pathname === '/akwaba' && !isDesktop) {
            setIsMenuOpen(false);
        }
    }, [pathname, isDesktop]);

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
        <header className={`fixed left-4 z-[100] bottom-4 ${isMenuOpen ? "w-[92%]" : "w-fit"} max-w-[800px] md:top-6 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:w-fit md:px-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-full shadow-lg px-2 py-2 flex items-center justify-start gap-1 md:gap-4 transition-all duration-500 ease-in-out`}>

            {/* User Section - Flat on mobile */}
            <div className="flex items-center gap-1 md:gap-4 shrink-0">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="relative group transition-transform active:scale-95" >
                    <div className="w-12 h-12 md:w-9 md:h-9 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden relative border-2 border-primary/10 group-hover:border-primary/30 transition-all shrink-0">
                        {images.map((img, index) => (
                            <Image key={img} src={img} alt="Avatar" width={48} height={48} priority={index === 0} className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`} style={{ width: 'auto', height: 'auto' }} />
                        ))}
                    </div>

                    {/* Floating indicator (Mobile Only) — indique ouvert/fermé */}
                    <motion.div
                        animate={{
                            rotate: isMenuOpen ? 180 : 0,
                            scale: isMenuOpen ? 1 : [1, 1.2, 1],
                        }}
                        transition={{
                            rotate: { duration: 0.35, ease: "easeInOut" },
                            scale: { repeat: isMenuOpen ? 0 : Infinity, duration: 1.8, ease: "easeInOut" }
                        }}
                        className={`absolute -right-1 -bottom-1 md:hidden w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-lg z-20 transition-colors duration-300 ${isMenuOpen ? 'bg-primary/80' : 'bg-primary'}`}
                    >
                        <Icon
                            icon={isMenuOpen ? "solar:close-circle-bold-duotone" : "solar:hamburger-menu-bold-duotone"}
                            className="w-3 h-3 text-white"
                        />
                    </motion.div>
                </button>

                <div className={`${isMenuOpen ? "block" : "hidden"} md:block shrink-0 ml-1`}>
                    <p className="text-[10px] text-muted-foreground dark:text-zinc-400 leading-tight">
                        <span className="hidden md:inline">Salut, </span>👋
                    </p>
                    <p className="font-bold text-foreground dark:text-white text-[10px] sm:text-xs uppercase md:normal-case">
                        {/* Mobile: Initiales | Desktop: Nom complet */}
                        <span className="md:hidden">
                            {userName ? userName.substring(0, 2).toUpperCase() : "EX"}
                        </span>
                        <span className="hidden md:inline">
                            {userName ? (userName.length > 12 ? userName.substring(0, 10) + '..' : userName) : "EXPLORE"}
                        </span>
                    </p>
                </div>

            </div>

            {/* Content Wrapper for Animation */}
            <AnimatePresence mode="wait">
                {mounted && (isMenuOpen || isDesktop) && (
                    <motion.div
                        key="menu-content"
                        initial={{ opacity: 0, x: -20, width: 0 }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            width: "auto",
                            transition: {
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                staggerChildren: 0.05
                            }
                        }}
                        exit={{ opacity: 0, x: -20, width: 0 }}
                        className="flex items-center justify-start md:justify-start w-full md:w-auto gap-4 md:gap-4 overflow-hidden"  >
                        {/* Navigation Tabs */}
                        <nav className="flex items-center gap-3 md:gap-4">
                            {NAVIGATION_TABS.map((tab) => {
                                const active = isTabActive(tab.path);
                                const isProtected = protectedPaths.includes(tab.path);

                                const commonClasses = `flex items-center gap-2 text-xs font-black transition-all px-2.5 py-1.5 rounded-full ${active ? "text-primary-foreground bg-primary shadow-md shadow-primary/20" : "text-muted-foreground hover:text-foreground dark:text-zinc-400 dark:hover:text-white hover:bg-muted/50"}`;

                                if (isProtected) {
                                    return (
                                        <button key={tab.key} onClick={() => handleProtectedNavigation(tab.path)} className={commonClasses} title={tab.label} >
                                            <Icon icon={tab.icon} className="w-7 h-7 md:w-5 md:h-5" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    );
                                }

                                return (
                                    <Link key={tab.key} href={tab.path} className={commonClasses} title={tab.label} >
                                        <Icon icon={tab.icon} className="w-7 h-7 md:w-5 md:h-5" />
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="w-px h-6 bg-border/40 shrink-0 hidden md:block" />

                        {/* Actions Section */}
                        <div className="flex items-center gap-3 md:gap-4 ml-2 md:ml-0">
                            <button onClick={() => setIsCartModalOpen(true)} className="relative bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 flex items-center justify-center hover:rotate-6" >
                                <Icon icon="solar:cart-bold" className="text-white w-5 h-5 md:w-5 md:h-5" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">
                                        {totalItems}
                                    </span>
                                )}
                            </button>

                            <span className="hidden md:block">
                                <QrCodeLogo user={userId} />
                            </span>

                            <button onClick={() => handleProtectedNavigation("/chat-ia")} className="relative bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 flex items-center justify-center hover:-rotate-6">
                                <Icon icon="solar:bell-bing-bold-duotone" className="text-white w-5 h-5 md:w-5 md:h-5" />
                                {unreadMessages > 0 && (
                                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">  {unreadMessages}  </span>
                                )}
                            </button>

                            <button onClick={() => handleProtectedNavigation("/akwaba")} className="relative bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 flex items-center justify-center">
                                <Icon icon="solar:user-bold" className="text-white w-5 h-5 md:w-5 md:h-5" />
                            </button>

                            <ThemeToggle />
                            <div className="hidden md:block">
                                <LanguageToggle />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Language Toggle - Floating in the top right of the expanded menu */}
            <AnimatePresence>
                {isMenuOpen && mounted && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                        className="absolute -top-12 right-0 md:hidden"
                    >
                        <LanguageToggle className="shadow-lg !bg-white/80 dark:!bg-zinc-900/80 backdrop-blur-md border-white/40 dark:border-white/10" />
                    </motion.div>
                )}
            </AnimatePresence>

            <CartDetailModal isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} />

        </header>

    );
}