"use client"

import * as React from "react"
import { Icon } from "@iconify/react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="flex items-center space-x-2" suppressHydrationWarning>
                <Switch disabled aria-label="Toggle theme" suppressHydrationWarning />
                <Icon icon="solar:sun-bold-duotone" className="h-5 w-5 text-muted-foreground" />
            </div>
        )
    }

    const isDark = theme === "dark"

    return (
        <div className="flex items-center space-x-2 transition-all duration-300" suppressHydrationWarning>
            <Switch
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                aria-label="Toggle theme"
                className="data-[state=checked]:bg-primary shadow-sm"
                suppressHydrationWarning
            />
            <div className="flex items-center justify-center w-7 h-7">
                {isDark ? (
                    <Icon icon="solar:moon-bold-duotone" className="h-7 w-7 text-primary animate-in zoom-in duration-300" />
                ) : (
                    <Icon icon="solar:sun-bold-duotone" className="h-7 w-7 text-brand-primary animate-in zoom-in duration-300" />
                )}
            </div>
        </div>
    )
}
