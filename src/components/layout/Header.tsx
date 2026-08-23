"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import QrCodeLogo from "./QrCodeLogo";
import { getUserId, getUserName, isAuthenticated, getUserSpaceRoute } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { getConversationsCount } from "@/api/api";
import { useSocket } from "@/components/providers/SocketProvider";
import { useCart } from "@/components/providers/CartProvider";
import CartDetailModal from "@/components/store/modals/CartDetailModal";
import { useNotification } from "@/components/notifications/NotificationProvider";
import { motion, AnimatePresence } from "framer-motion";
import { LanguageToggle } from "./LanguageToggle";
import NotificationBell from "./NotificationBell";

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
        // "/akwaba" est l'espace personnel générique : selon le rôle, on redirige plutôt
        // vers l'espace dédié (ADMIN -> /admin, MARKETING -> /suivi_marketing).
        const target = path === "/akwaba" ? getUserSpaceRoute() : path;
        router.push(target);
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

    // 📱 MASQUAGE HEADER AU SCROLL (mobile uniquement, type WhatsApp/Instagram) — écouteur
    // désactivé sur desktop (return anticipé) pour ne rien coûter en dehors du mobile. Le
    // throttle via requestAnimationFrame limite les mises à jour de state à une par frame,
    // et le seuil (SCROLL_THRESHOLD) ignore les micro-scrolls qui provoqueraient un clignotement.
    const [hideOnScroll, setHideOnScroll] = useState(false);
    const lastScrollY = useRef(0);
    const scrollTicking = useRef(false);

    useEffect(() => {
        if (isDesktop) {
            setHideOnScroll(false);
            return;
        }

        lastScrollY.current = window.scrollY;
        const SCROLL_THRESHOLD = 8;

        const handleScroll = () => {
            if (scrollTicking.current) return;
            scrollTicking.current = true;
            requestAnimationFrame(() => {
                const currentY = window.scrollY;
                const delta = currentY - lastScrollY.current;

                if (currentY <= 0) {
                    setHideOnScroll(false);
                    lastScrollY.current = currentY;
                } else if (Math.abs(delta) > SCROLL_THRESHOLD) {
                    setHideOnScroll(delta > 0);
                    lastScrollY.current = currentY;
                }
                scrollTicking.current = false;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isDesktop]);

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

    // 🔔 FETCH UNREAD MESSAGES — uniquement si connecté avec un token valide (non expiré),
    // sinon /chat/unread-count renvoie systématiquement 401 pour chaque visiteur non
    // authentifié (le header s'affiche sur toutes les pages, y compris publiques).
    useEffect(() => {
        if (!isAuthenticated()) return;

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

    // ⬅️ BOUTON RETOUR — mobile uniquement (md:hidden ci-dessous) : en PWA installée, il n'y a
    // pas de bouton retour natif du navigateur, donc on en fournit un dans le header. Masqué
    // sur l'accueil (rien où retourner), sur /akwaba (a déjà son propre retour par onglet, voir
    // OnBack.tsx) et sur les pages détail service/produit/annonce (ont déjà le leur).
    const BACK_EXCLUDED_PREFIXES = ["/akwaba", "/service/", "/produit/", "/annonce/"];
    const showBackButton = mounted && pathname !== "/" && !BACK_EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

    // window.history.length n'est pas fiable en PWA installée (souvent bloqué à 1 même après
    // plusieurs navigations internes, ou au contraire >1 dès le lancement direct sur une page
    // profonde sans qu'il y ait de "précédent" réel dans l'app) — router.back() se contente
    // alors de ne rien faire. On suit nous-mêmes le nombre de navigations effectuées dans
    // cette session pour savoir avec certitude s'il existe un vrai "retour" possible.
    const inAppNavCount = useRef(0);
    useEffect(() => {
        inAppNavCount.current += 1;
    }, [pathname]);

    const handleBack = () => {
        if (inAppNavCount.current > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <>
            {/* Icônes mobiles hautes — photo + nom (gauche), thème/langue/notifications (droite).
                Aucun fond/bandeau visible : uniquement les icônes, posées sur l'espace blanc de la
                page (voir ComingSoon.tsx pt-20, qui repousse le contenu/slide sous cette zone,
                donc pas de superposition). Desktop inchangé : n'existe qu'en mobile (md:hidden). */}
            <div className={`md:hidden fixed top-6 left-4 right-4 z-[100] flex items-center justify-between gap-2 transition-all duration-500 ease-in-out will-change-transform ${hideOnScroll ? "-translate-y-24 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
                <div className="flex items-center gap-2 min-w-0">
                    {showBackButton && (
                        <button onClick={handleBack} aria-label="Retour" className="w-9 h-9 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform shrink-0">
                            <Icon icon="solar:alt-arrow-left-bold" className="w-5 h-5 text-foreground" />
                        </button>
                    )}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden relative border-2 border-primary/10 shrink-0 shadow-md">
                            {images.map((img, index) => (
                                <Image key={img} src={img} alt="Avatar" width={36} height={36} priority={index === 0 && !isDesktop} unoptimized
                                    onClick={() => handleProtectedNavigation("/akwaba")} className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-500 ease-in-out cursor-pointer ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`} />
                            ))}
                        </div>
                        <div className="min-w-0">
                            <p className="text-[9px] text-muted-foreground dark:text-zinc-400 leading-tight">Salut, 👋</p>
                            <p className="font-bold text-foreground dark:text-white text-xs truncate max-w-[110px]">
                                {userName ? (userName.length > 14 ? userName.substring(0, 12) + '..' : userName) : "Explorateur"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <ThemeToggle />
                    <LanguageToggle />
                    <button onClick={() => setIsCartModalOpen(true)} className="relative bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 flex items-center justify-center" aria-label="Panier">
                        <Icon icon="solar:cart-bold" className="text-white w-5 h-5" />
                        {totalItems > 0 && (
                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">
                                {totalItems}
                            </span>
                        )}
                    </button>
                    <NotificationBell />
                </div>
            </div>

            <header className={`fixed left-4 right-4 md:right-auto z-[100] bottom-4 ${isMenuOpen ? "w-auto" : "w-fit"} max-w-[800px] md:top-6 md:bottom-auto md:left-1/2 md:-translate-x-1/2 md:w-fit md:px-6 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg border border-white/40 dark:border-white/10 rounded-full shadow-lg px-2 py-2 flex items-center justify-start gap-1 md:gap-4 transition-all duration-500 ease-in-out will-change-transform ${hideOnScroll ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"} md:translate-y-0 md:opacity-100 md:pointer-events-auto`}>
                {/* User Section - Desktop: avatar+nom inchangés | Mobile: bouton Menu (photo/nom déplacés en haut) */}
                <div className="flex items-center gap-1 md:gap-4 shrink-0">
                    {/* Desktop uniquement : avatar identique à avant */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="hidden md:flex relative group transition-transform active:scale-95" >
                        <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden relative border-2 border-primary/10 group-hover:border-primary/30 transition-all shrink-0">
                            {images.map((img, index) => (
                                <Image key={img} src={img} alt="Avatar" width={48} height={48} priority={index === 0 && isDesktop} unoptimized onClick={() => handleProtectedNavigation("/akwaba")} className={`object-cover w-full h-full absolute top-0 left-0 transition-opacity duration-500 ease-in-out cursor-pointer ${index === currentImageIndex ? "opacity-100" : "opacity-0"}`} />
                            ))}
                        </div>
                    </button>

                    {/* Mobile uniquement : bouton Menu — prend exactement l'ancien emplacement de l'avatar */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden relative flex items-center justify-center w-12 h-12 bg-primary/20 rounded-full border-2 border-primary/10 active:scale-95 transition-transform shrink-0" aria-label={isMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}>
                        <motion.div animate={{ rotate: isMenuOpen ? 180 : 0 }} transition={{ duration: 0.35, ease: "easeInOut" }}>
                            <Icon icon={isMenuOpen ? "solar:close-circle-bold-duotone" : "solar:hamburger-menu-bold-duotone"} className="w-6 h-6 text-primary" />
                        </motion.div>
                    </button>

                    <div className="hidden md:block shrink-0 ml-1">
                        <p className="text-[10px] text-muted-foreground dark:text-zinc-400 leading-tight">
                            Salut, 👋
                        </p>
                        <p className="font-bold text-foreground dark:text-white text-xs">
                            {userName ? (userName.length > 12 ? userName.substring(0, 10) + '..' : userName) : "EXPLORE"}
                        </p>
                    </div>

                </div>
                {/* Content Wrapper for Animation */}
                <AnimatePresence mode="wait">
                    {mounted && (isMenuOpen || isDesktop) && (
                        <motion.div key="menu-content" initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto", transition: { type: "spring", stiffness: 300, damping: 30, staggerChildren: 0.05 } }}
                            exit={{ opacity: 0, width: 0 }}
                            className="flex items-center justify-start w-full md:w-auto gap-4 md:gap-4 overflow-hidden"  >
                            {/* Navigation Tabs — desktop : ligne icône+texte inchangée */}
                            <nav className="hidden md:flex items-center gap-3 md:gap-4">
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

                            {/* Navigation Tabs — mobile : icône + label empilés, label toujours visible */}
                            <nav className="flex md:hidden items-center gap-3">
                                {NAVIGATION_TABS.map((tab) => {
                                    const isProtected = protectedPaths.includes(tab.path);

                                    const content = (
                                        <>
                                            <span className="bg-primary p-2 rounded-full flex items-center justify-center">
                                                <Icon icon={tab.icon} className="text-white w-5 h-5" />
                                            </span>
                                            <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 leading-none">{tab.label}</span>
                                        </>
                                    );

                                    if (isProtected) {
                                        return (
                                            <button key={tab.key} onClick={() => handleProtectedNavigation(tab.path)} className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform" title={tab.label} >
                                                {content}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link key={tab.key} href={tab.path} className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform" title={tab.label} >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="w-px h-6 bg-border/40 shrink-0 hidden md:block" />

                            {/* Actions Section */}
                            <div className="flex items-center justify-between md:justify-start flex-1 md:flex-none gap-3 md:gap-4 ml-2 md:ml-0">
                                {/* Panier — desktop uniquement ici (déplacé en haut sur mobile, voir la rangée d'icônes mobile) */}
                                <button onClick={() => setIsCartModalOpen(true)} className="relative hidden md:flex bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 items-center justify-center hover:rotate-6" >
                                    <Icon icon="solar:cart-bold" className="text-white w-5 h-5 md:w-5 md:h-5" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">
                                            {totalItems}
                                        </span>
                                    )}
                                </button>

                                {/* Guide — mobile uniquement, remplace l'ancien accès "Nos solutions" à cet emplacement. */}
                                <Link href="/guide" title="Guide" className="md:hidden flex flex-col items-center gap-0.5 active:scale-95 transition-transform">
                                    <span className="bg-primary p-2 rounded-full flex items-center justify-center">
                                        <Icon icon="solar:book-bookmark-bold-duotone" className="text-white w-5 h-5" />
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 leading-none">Guide</span>
                                </Link>

                                <span className="hidden md:block">
                                    <QrCodeLogo user={userId} />
                                </span>

                                {/* Chat — mobile : icône + label empilés | desktop : icône seule inchangée */}
                                <button onClick={() => handleProtectedNavigation("/chat-ia")} className="md:hidden flex flex-col items-center gap-0.5 active:scale-95 transition-transform">
                                    <span className="relative bg-primary p-2 rounded-full flex items-center justify-center">
                                        <Icon icon="solar:chat-round-dots-bold-duotone" className="text-white w-5 h-5" />
                                        {unreadMessages > 0 && (
                                            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">  {unreadMessages}  </span>
                                        )}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 leading-none">Chat</span>
                                </button>
                                <button onClick={() => handleProtectedNavigation("/chat-ia")} className="relative hidden md:flex bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 items-center justify-center hover:-rotate-6">
                                    <Icon icon="solar:chat-round-dots-bold-duotone" className="text-white w-5 h-5" />
                                    {unreadMessages > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[8px] font-black text-white bg-red-500 rounded-full border-2 border-white dark:border-zinc-900">  {unreadMessages}  </span>
                                    )}
                                </button>

                                {/* Boutiques — mobile : icône + label empilés | desktop : icône seule inchangée */}
                                <Link href="/shop-sellers" className="md:hidden flex flex-col items-center gap-0.5 active:scale-95 transition-transform">
                                    <span className="bg-primary p-2 rounded-full flex items-center justify-center">
                                        <Icon icon="solar:shop-2-bold-duotone" className="text-white w-5 h-5" />
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 leading-none">Boutiques</span>
                                </Link>
                                <Link href="/shop-sellers" className="relative hidden md:flex bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 items-center justify-center">
                                    <Icon icon="solar:shop-2-bold-duotone" className="text-white w-5 h-5" />
                                </Link>

                                <Link href="/guide" title="Guide" className="relative hidden md:flex bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 items-center justify-center">
                                    <Icon icon="solar:book-bookmark-bold-duotone" className="text-white w-5 h-5" />
                                </Link>

                                <div className="hidden md:block">
                                    <ThemeToggle />
                                </div>
                                <div className="hidden md:block">
                                    <LanguageToggle />
                                </div>
                                {/* Notifications Web Push — seul ajout visuel côté desktop */}
                                <div className="hidden md:block">
                                    <NotificationBell />
                                </div>

                                {/* Compte utilisateur — toujours en dernière position, web comme mobile.
                                    Mobile : icône + label empilés | desktop : icône seule inchangée. */}
                                <button onClick={() => handleProtectedNavigation("/akwaba")} className="md:hidden flex flex-col items-center gap-0.5 active:scale-95 transition-transform">
                                    <span className="bg-primary p-2 rounded-full flex items-center justify-center">
                                        <Icon icon="solar:user-bold" className="text-white w-5 h-5" />
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 leading-none">Compte</span>
                                </button>
                                <button onClick={() => handleProtectedNavigation("/akwaba")} className="relative hidden md:flex bg-primary p-2 rounded-full transition hover:scale-110 active:scale-95 items-center justify-center">
                                    <Icon icon="solar:user-bold" className="text-white w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <CartDetailModal isOpen={isCartModalOpen} onClose={() => setIsCartModalOpen(false)} />
            </header>
        </>
    );
}