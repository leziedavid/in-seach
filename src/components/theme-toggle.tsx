"use client"

import * as React from "react"
import { Icon } from "@iconify/react"
import { useTheme } from "next-themes"

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => { setMounted(true) }, [])

    if (!mounted) {
        return (
            <div className={`w-9 h-9 flex items-center justify-center ${className}`} suppressHydrationWarning>
                <Icon icon="solar:sun-bold-duotone" className="h-5 w-5 text-muted-foreground" />
            </div>
        )
    }

    const isDark = theme === "dark"

    return (
        <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
            className={`relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted/60 active:scale-90 transition-all duration-200 ${className}`}
            suppressHydrationWarning
        >
            <div className="flex items-center justify-center w-7 h-7">
                {isDark ? (
                    <Icon icon="solar:moon-bold-duotone" className="h-6 w-6 text-primary animate-in zoom-in duration-300" />
                ) : (
                    <Icon icon="solar:sun-bold-duotone" className="h-6 w-6 text-brand-primary animate-in zoom-in duration-300" />
                )}
            </div>
        </button>
    )
}
