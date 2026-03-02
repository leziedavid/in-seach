"use client"

import Image from "next/image"

const socialLinks = [
    { href: "https://www.facebook.com", alt: "Facebook", src: "/icons/facebook.svg" },
    { href: "https://www.linkedin.com", alt: "LinkedIn", src: "/icons/linkedin.svg" },
    { href: "https://www.youtube.com", alt: "YouTube", src: "/icons/youtube.svg" },
]

export default function SocialFollow() {
    return (
        <footer className="w-full  bootom-0">
            <div className="container mx-auto">
                <div className="flex flex-col items-center gap-2 w-full max-w-3xl mx-auto px-4 py-3">
                    <h3 className="text-sm xl:text-lg font-medium text-center">
                        Suivez-nous maintenant !
                    </h3>

                    <div className="flex flex-row gap-2 flex-wrap justify-center">
                        {socialLinks.map((link) => (
                            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-transform transform hover:scale-110"  >
                                <Image src={link.src} alt={link.alt} width={30} height={30} className="object-contain" />
                            </a>
                        ))}
                    </div>

                    {/* Footer petit */}
                    <div className="text-center text-[9px] sm:text-[10px] text-gray-500 space-y-0.5 pt-2">
                        <div>Developpé par inSeach | Confidentialité</div>
                        <div className="text-gray-400">
                            &copy; 2025 inSeach. Tous droits réservés.
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    )
}
