"use client"

import { useRef, useState, useLayoutEffect, useEffect } from "react"
import FooterInstallButton from "@/components/pwa/FooterInstallButton"
import Image from "next/image"
import Link from "next/link"

const socialLinks = [
    { href: "https://www.facebook.com", alt: "Facebook", src: "/icons/facebook.svg" },
    { href: "https://www.linkedin.com", alt: "LinkedIn", src: "/icons/linkedin.svg" },
    { href: "https://www.youtube.com", alt: "YouTube", src: "/icons/youtube.svg" },
]

export default function SocialFollow() {
    const footerRef = useRef<HTMLElement>(null)
    // Le footer ne s'affiche que lorsqu'on atteint réellement la fin de la page (sentinelle
    // "page-end-sentinel", voir ComingSoon.tsx) — le reste du temps il reste hors écran, pour
    // laisser tout l'espace disponible au contenu et à SearchInput (seul visible par défaut).
    const [isNearBottom, setIsNearBottom] = useState(false)

    useEffect(() => {
        const sentinel = document.getElementById("page-end-sentinel")
        if (!sentinel) return
        const observer = new IntersectionObserver(
            ([entry]) => setIsNearBottom(entry.isIntersecting),
            { threshold: 0 }
        )
        observer.observe(sentinel)
        return () => observer.disconnect()
    }, [])

    // Rapporte sa propre hauteur dans deux variables CSS :
    // - --footer-height : hauteur "active" (0 quand caché, réelle quand affiché) — lue par
    //   SearchInput.tsx pour s'empiler juste au-dessus, uniquement quand le footer est visible.
    // - --footer-reserved-height : toujours la hauteur réelle — lue par ComingSoon.tsx pour
    //   réserver assez d'espace en fin de page pour accueillir le footer une fois révélé.
    useLayoutEffect(() => {
        const el = footerRef.current
        if (!el) return
        const update = () => {
            const h = el.offsetHeight
            document.documentElement.style.setProperty("--footer-height", isNearBottom ? `${h}px` : "0px")
            document.documentElement.style.setProperty("--footer-reserved-height", `${h}px`)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        window.addEventListener("resize", update)
        return () => {
            ro.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [isNearBottom])

    return (
        <footer
            ref={footerRef}
            id="site-footer"
            className={`fixed inset-x-0 bottom-0 z-30 w-full bg-background transition-transform duration-300 ease-out ${isNearBottom ? "translate-y-0" : "translate-y-full pointer-events-none"}`}
        >
            <div className="container mx-auto">
                <div className="flex flex-col items-center gap-2 w-full max-w-3xl mx-auto px-4 py-3">
                    <h3 className="text-sm xl:text-lg font-medium text-center">
                        Suivez-nous maintenant !
                    </h3>

                    <div className="flex flex-row items-center gap-4 flex-wrap justify-center">
                        <div className="flex flex-row gap-2">
                            {socialLinks.map((link) => (
                                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-transform transform hover:scale-110"  >
                                    <Image src={link.src}  alt={link.alt}  width={30}  height={30} className="object-contain" />
                                </a>
                            ))}
                        </div>

                        <FooterInstallButton />
                    </div>

                    {/* Footer petit */}
                    <div className="text-center text-[9px] sm:text-[10px] text-gray-500 space-y-1 pt-2">
                        <div className="flex flex-wrap justify-center gap-x-2 gap-y-1">
                            <span>Développé par Djamko</span>
                            <span className="text-gray-300">|</span>
                            <Link href="/solutions" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                                Nos Solutions
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/terms-of-use" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                                Conditions Générales d'Utilisation
                            </Link>
                            <span className="text-gray-300">|</span>
                             <Link href="/privacy-policy" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                                Politique de confidentialité
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link href="/cookies" className="hover:text-primary transition-colors underline-offset-2 hover:underline">
                                Politique Cookies
                            </Link>
                        </div>
                        <div className="text-gray-400">
                            &copy; 2025 Djamko. Tous droits réservés.
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    );
}
