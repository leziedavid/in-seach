"use client"

import React, { useEffect, useState } from "react"

/**
 * Hook localisation utilisateur
 */
function useUserLocation() {

    const [location, setLocation] = useState<{ city?: string, country?: string } | null>(null)

    useEffect(() => {
        if (!navigator.geolocation) return

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                    const data = await res.json()
                    setLocation({
                        city: data?.address?.city || data?.address?.town || data?.address?.village,
                        country: data?.address?.country,
                    })
                } catch (err) {
                    console.error("Geolocation error:", err)
                }
            },
            () => {
                setLocation(null)
            }
        )
    }, [])

    return location
}

export default function AfricaGlobeWithLocation() {
    const location = useUserLocation()

    return (
        <div className="md:hidden flex flex-col items-center gap-2">

            {/* 🌍 Globe */}
            <div className="relative w-[280px] h-[280px]">

                {/* glow background */}
                <div className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
                    style={{
                        background: "radial-gradient(circle at 50% 50%, rgba(14,138,107,0.14) 60%, transparent 75%)",
                        transform: "scale(1.15)",
                    }}
                />

                {/* rotation */}
                <div className="relative z-10 animate-spin-slow">

                    <svg width="280" height="280" viewBox="0 0 280 280" role="img" aria-label="Globe Afrique centré sur Abidjan">
                        <defs>
                            <radialGradient id="sphere" cx="35%" cy="32%" r="65%">
                                <stop offset="0%" stopColor="#FFFCF6" />
                                <stop offset="50%" stopColor="#F0EAE0" />
                                <stop offset="100%" stopColor="#D9D2C5" />
                            </radialGradient>

                            <radialGradient id="atmos" cx="50%" cy="50%" r="50%">
                                <stop offset="92%" stopColor="transparent" />
                                <stop offset="98%" stopColor="#0E8A6B" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>

                            <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
                                <stop offset="100%" stopColor="transparent" />
                            </radialGradient>

                            <clipPath id="clip">
                                <circle cx="140" cy="140" r="120" />
                            </clipPath>
                        </defs>

                        {/* shadow */}
                        <ellipse cx="140" cy="275" rx="90" ry="10" fill="url(#shadow)" />

                        {/* atmosphere */}
                        <circle cx="140" cy="140" r="127" fill="url(#atmos)" />

                        {/* globe */}
                        <circle cx="140" cy="140" r="120" fill="url(#sphere)" />

                        {/* grid */}
                        <g clipPath="url(#clip)" opacity="0.5">
                            <ellipse cx="140" cy="140" rx="120" ry="24" fill="none" stroke="rgba(14,138,107,0.2)" />
                            <ellipse cx="140" cy="120" rx="115" ry="18" fill="none" stroke="rgba(14,138,107,0.15)" />
                            <ellipse cx="140" cy="160" rx="110" ry="14" fill="none" stroke="rgba(14,138,107,0.15)" />
                        </g>

                        {/* highlight */}
                        <circle cx="140" cy="140" r="120" fill="rgba(255,255,255,0.25)" style={{ mixBlendMode: "overlay" }} />

                        {/* border */}
                        <circle cx="140" cy="140" r="120" fill="none" stroke="#0E8A6B" strokeWidth="1" opacity="0.35" />
                    </svg>
                </div>
            </div>

            {/* 📍 Location */}
            <div className="text-xs text-gray-600 dark:text-gray-300 text-center">
                {location ? (
                    <>
                        📍 {location.city ?? "Ville inconnue"},{" "}
                        {location.country ?? "Pays inconnu"}
                    </>
                ) : (
                    "📍 Détection de votre position..."
                )}
            </div>
        </div>
    )
}