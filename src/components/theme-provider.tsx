"use client"

import * as React from "react"

// ─────────────────────────────────────────────────────────────────────────────
// Custom ThemeProvider — aucun <script> dans le DOM React (évite le warning
// React 19 produit par next-themes 0.4.x).
// Le script d'init anti-FOUC est rendu dans app/layout.tsx (server component).
// ─────────────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system"
type ResolvedTheme = "light" | "dark"

interface ThemeContextValue {
    theme: Theme
    setTheme: (theme: Theme) => void
    resolvedTheme: ResolvedTheme
    systemTheme: ResolvedTheme
    themes: string[]
    forcedTheme?: string
}

const ThemeContext = React.createContext<ThemeContextValue>({
    theme: "light",
    setTheme: () => {},
    resolvedTheme: "light",
    systemTheme: "light",
    themes: ["light", "dark"],
})

export const useTheme = () => React.useContext(ThemeContext)

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: Theme
    attribute?: "class" | "data-theme" | string
    enableSystem?: boolean
    disableTransitionOnChange?: boolean
    forcedTheme?: string
    storageKey?: string
}

function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined") return "light"
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(
    resolved: ResolvedTheme,
    attribute: string,
    disableTransition: boolean
) {
    if (typeof document === "undefined") return
    const root = document.documentElement

    if (disableTransition) {
        const style = document.createElement("style")
        style.textContent = "*,*::before,*::after{transition:none!important}"
        document.head.appendChild(style)
        window.getComputedStyle(document.body)
        setTimeout(() => document.head.removeChild(style), 1)
    }

    if (attribute === "class") {
        root.classList.remove("light", "dark")
        root.classList.add(resolved)
    } else {
        root.setAttribute(attribute, resolved)
    }
    root.style.colorScheme = resolved
}

export function ThemeProvider({
    children,
    defaultTheme = "light",
    attribute = "class",
    enableSystem = true,
    disableTransitionOnChange = false,
    forcedTheme,
    storageKey = "theme",
}: ThemeProviderProps) {
    const [theme, setThemeState] = React.useState<Theme>(() => {
        // Lecture initiale côté serveur : on retourne le defaultTheme
        if (typeof window === "undefined") return defaultTheme
        try {
            return (localStorage.getItem(storageKey) as Theme) || defaultTheme
        } catch {
            return defaultTheme
        }
    })

    const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>(() =>
        getSystemTheme()
    )

    const resolvedTheme: ResolvedTheme = forcedTheme
        ? (forcedTheme as ResolvedTheme)
        : theme === "system"
        ? systemTheme
        : (theme as ResolvedTheme)

    // Appliquer le thème au montage et à chaque changement
    React.useEffect(() => {
        applyTheme(resolvedTheme, attribute, disableTransitionOnChange)
    }, [resolvedTheme, attribute, disableTransitionOnChange])

    // Écouter les changements de préférence système
    React.useEffect(() => {
        if (!enableSystem) return
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        const handler = (e: MediaQueryListEvent) => {
            const sys: ResolvedTheme = e.matches ? "dark" : "light"
            setSystemTheme(sys)
        }
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [enableSystem])

    // Synchroniser entre onglets
    React.useEffect(() => {
        const handler = (e: StorageEvent) => {
            if (e.key === storageKey && e.newValue) {
                setThemeState(e.newValue as Theme)
            }
        }
        window.addEventListener("storage", handler)
        return () => window.removeEventListener("storage", handler)
    }, [storageKey])

    const setTheme = React.useCallback(
        (t: Theme) => {
            setThemeState(t)
            try {
                localStorage.setItem(storageKey, t)
            } catch {}
        },
        [storageKey]
    )

    const value = React.useMemo(
        () => ({
            theme,
            setTheme,
            resolvedTheme,
            systemTheme,
            themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
            forcedTheme,
        }),
        [theme, setTheme, resolvedTheme, systemTheme, enableSystem, forcedTheme]
    )

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    )
}
