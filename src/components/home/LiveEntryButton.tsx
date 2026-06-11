"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { isAuthenticated } from "@/lib/auth";

const SESSION_KEY = "live-entry-hidden";

export default function LiveEntryButton() {
    const router = useRouter();
    const [show, setShow] = useState(false);
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        setShow(isAuthenticated());
        setHidden(sessionStorage.getItem(SESSION_KEY) === "true");
    }, []);

    const handleHide = (e: React.MouseEvent) => {
        e.stopPropagation();
        sessionStorage.setItem(SESSION_KEY, "true");
        setHidden(true);
    };

    if (!show || hidden) return null;

    return (
        <div className="relative w-full max-w-xl mx-auto">
            {/* Bouton fermer */}
            <button
                onClick={handleHide}
                aria-label="Masquer"
                className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-white flex items-center justify-center hover:bg-white/80 transition-colors shadow-md"
            >
                <Icon icon="solar:close-circle-bold" className="w-4 h-4 text-red-600" />
            </button>

        <button
            onClick={() => router.push("/lives")}
            className="group relative flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150"
            style={{
                background: "linear-gradient(135deg, #e11d48 0%, #be123c 40%, #9f1239 100%)",
                boxShadow: "0 8px 32px rgba(225, 29, 72, 0.4), 0 2px 8px rgba(0,0,0,0.15)",
            }}
        >
            {/* Hover overlay */}
            <span className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Halos de fond */}
            <span className="absolute -left-3 -top-3 w-20 h-20 rounded-full bg-white/5 animate-ping-slow" />
            <span className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 animate-ping-slow" style={{ animationDelay: "0.8s" }} />

            {/* Icône caméra + anneau pulsant */}
            <span className="relative flex items-center justify-center shrink-0">
                <span className="absolute w-10 h-10 rounded-full bg-red-300/30 animate-ping" />
                <span className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Icon icon="solar:videocamera-bold" className="w-5 h-5 text-white" />
                </span>
            </span>

            {/* Texte */}
            <span className="flex-1 min-w-0 z-10">
                <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1 bg-white rounded-md px-2 py-0.5 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-red-600 font-black text-[11px] tracking-widest uppercase leading-none">Live</span>
                    </span>
                    <span className="text-white font-bold text-sm truncate">Découvrez les vidéos</span>
                </span>
                <span className="text-white/70 text-[11px] mt-0.5 block truncate">
                    Produits, services et annonces en vidéo
                </span>
            </span>

            {/* Flèche */}
            <span className="z-10 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 group-hover:bg-white/25 transition-colors">
                <Icon icon="solar:play-bold" className="w-4 h-4 text-white ml-0.5" />
            </span>
        </button>
        </div>
    );
}
