"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { resolveStoreByUserId } from "@/api/api"
import Image from "next/image"

export default function QrStoreRedirectPage() {
    const router = useRouter()
    const params = useParams()
    const sellerId = params.sellerId as string
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!sellerId) return

        resolveStoreByUserId(sellerId)
            .then((res) => {
                if (res.statusCode === 200 && res.data?.slug) {
                    router.replace(`/shop/${res.data.slug}`)
                } else {
                    setError("Boutique introuvable")
                }
            })
            .catch(() => setError("Une erreur est survenue"))
    }, [sellerId, router])

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center gap-4">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={80}
                    height={80}
                    className="opacity-60"
                    unoptimized />
                <p className="text-muted-foreground text-sm font-medium">{error}</p>
                <button
                    onClick={() => router.push("/")}
                    className="text-primary text-sm underline underline-offset-4"
                >
                    Retour à l&apos;accueil
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8">
            {/* Logo */}
            <div className="relative">
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        fill
                        className="object-cover"
                        unoptimized />
                </div>
                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-3xl animate-ping bg-primary/20" />
            </div>
            {/* Spinner */}
            <div className="flex flex-col items-center gap-3">
                <svg
                    className="w-8 h-8 animate-spin text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <p className="text-foreground font-bold text-lg tracking-tight">Chargement de la boutique...</p>
                <p className="text-muted-foreground text-sm">Veuillez patienter, nous préparons votre boutique.</p>
            </div>
        </div>
    );
}
