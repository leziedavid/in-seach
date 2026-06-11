"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { isAuthenticated } from "@/lib/auth";

export default function LiveFAB({ inline = false }: { inline?: boolean }) {
    const router = useRouter();
    const [show, setShow] = useState(false);
    const [onLivePage, setOnLivePage] = useState(false);

    useEffect(() => {
        setShow(isAuthenticated());
        setOnLivePage(window.location.pathname.startsWith("/lives"));
    }, []);

    if (!show || onLivePage) return null;

    return (
        <button onClick={() => router.push("/lives")} aria-label="Voir les Lives"
            className={`${inline ? "relative shrink-0" : "fixed bottom-24 right-4 z-50"} flex flex-col items-center gap-1 group`}
            style={inline ? undefined : { animation: "live-fab-float 3s ease-in-out infinite" }}
        >
            {/* Halo externe pulsant */}
            <span className="absolute rounded-full bg-red-500/30 animate-ping" style={{ borderRadius: "50%", width: "56px", height: "56px", top: 0, left: 0 }} />

            {/* Cercle principal */}
            <span className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl" style={{ background: "linear-gradient(135deg, #e11d48, #9f1239)", boxShadow: "0 4px 24px rgba(225, 29, 72, 0.55), 0 1px 6px rgba(0,0,0,0.2)", }}>
                <span className="absolute inset-1 rounded-full border border-white/20" />
                <Icon icon="solar:videocamera-bold" className="w-6 h-6 text-white" />
            </span>

            {/* Badge LIVE */}
            <span className="flex items-center gap-1 bg-red-600 rounded-full px-2 py-0.5 shadow-lg shadow-red-600/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white font-black text-[9px] tracking-widest uppercase leading-none">Live</span>
            </span>
        </button>
    );
}
