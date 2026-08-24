"use client"

import { useRef, useLayoutEffect } from "react"
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

    // Rapporte sa propre hauteur (toujours réelle, le footer est désormais toujours visible —
    // fini le glissement en vue déclenché par le scroll, qui donnait l'impression que le
    // footer "bougeait") dans deux variables CSS :
    // - --footer-height : lue par SearchInput.tsx pour s'empiler juste au-dessus en mode sticky.
    // - --footer-reserved-height : lue par ComingSoon.tsx pour réserver en permanence assez
    //   d'espace en bas de page, sinon le footer fixe recouvrirait la fin du contenu.
    // ResizeObserver uniquement (pas de listener `window resize`) : un `resize` se déclenche
    // aussi quand la barre d'adresse mobile se replie/déplie pendant le scroll — l'écouter ici
    // ne fait que recalculer une hauteur qui n'a pas changé, sans aucun bénéfice.
    useLayoutEffect(() => {
        const el = footerRef.current
        if (!el) return
        const update = () => {
            const h = el.offsetHeight
            document.documentElement.style.setProperty("--footer-height", `${h}px`)
            document.documentElement.style.setProperty("--footer-reserved-height", `${h}px`)
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // Verrou clavier iOS : `interactive-widget=overlays-content` (voir layout.tsx) est censé
    // suffire seul, mais s'est révélé pas fiable en pratique (Chrome iOS notamment, qui utilise
    // WKWebView plutôt que le vrai moteur Safari — support de cette directive incertain). Sur
    // ces navigateurs, `window.innerHeight` RÉTRÉCIT aussi avec le clavier (pas seulement
    // visualViewport) : comparer les deux en direct donnait alors un écart quasi nul et ne
    // corrigeait rien, alors même que le CSS `bottom: 0` — lui recalé sur ce viewport devenu
    // plus court — poussait bien le footer vers le haut. Le vrai fixe : ne JAMAIS se fier à la
    // valeur courante de innerHeight pendant que le clavier peut être ouvert. On mémorise la
    // plus grande hauteur observée (= l'état "clavier fermé", puisque le clavier ne peut que
    // réduire l'espace, jamais l'agrandir) et on compare le viewport actuel — le plus petit des
    // deux, layout ou visuel, selon celui que CE navigateur rétrécit réellement — à cette
    // référence figée. Le footer est alors retranslaté vers le bas de tout l'écart, quelle que
    // soit la mécanique de repli utilisée par le navigateur.
    useLayoutEffect(() => {
        const el = footerRef.current
        if (!el) return
        const vv = window.visualViewport
        let maxHeight = window.innerHeight

        const pin = () => {
            const liveHeight = vv ? Math.min(window.innerHeight, vv.height + vv.offsetTop) : window.innerHeight
            maxHeight = Math.max(maxHeight, liveHeight)
            const gap = maxHeight - liveHeight
            el.style.transform = gap > 1 ? `translateY(${gap}px)` : ""
        }

        pin()
        window.addEventListener("resize", pin)
        vv?.addEventListener("resize", pin)
        vv?.addEventListener("scroll", pin)
        return () => {
            window.removeEventListener("resize", pin)
            vv?.removeEventListener("resize", pin)
            vv?.removeEventListener("scroll", pin)
        }
    }, [])

    return (
        <footer
            ref={footerRef}
            id="site-footer"
            className="fixed inset-x-0 bottom-0 z-30 w-full bg-background"
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
