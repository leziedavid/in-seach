"use client";

import { useState, useRef, useLayoutEffect, useEffect, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

export interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;

    enableClear?: boolean;
    onClear?: () => void;

    enableSubmitButton?: boolean;

    enableVoice?: boolean;
    onVoiceOpen?: () => void;

    enableMap?: boolean;
    onMapClick?: () => void;
    isMapLoading?: boolean;
    addressLabel?: string;
    onClearAddress?: () => void;

    enableImage?: boolean;
    onImageOpen?: () => void;

    suggestionsSlot?: React.ReactNode;

    leadingIcon?: string;
    labels?: {
        clear?: string;
        voice?: string;
        location?: string;
        image?: string;
        submit?: string;
        placeholder?: string;
    };

    // Ancre la barre en bas de l'écran façon composer IA (ChatGPT/Claude), toujours visible
    // pendant que le contenu défile derrière elle. Défaut true — passer false pour un rendu
    // classique en flux normal, à l'endroit où le composant est appelé.
    sticky?: boolean;
    maxRows?: number;
    autoFocus?: boolean;
    className?: string;
}

// Barre de recherche générique façon "IA moderne" (textarea auto-extensible, actions
// intégrées) qui remplace les barres dupliquées de chaque section de AppTabs.tsx.
// Composant purement présentationnel et contrôlé : aucune logique métier, aucun appel
// API — le parent garde son state/handlers existants et les passe simplement en props.
export default function SearchInput({
    value,
    onChange,
    onSubmit,
    placeholder = "Rechercher...",
    isLoading = false,
    disabled = false,
    enableClear = true,
    onClear,
    enableSubmitButton = true,
    enableVoice = false,
    onVoiceOpen,
    enableMap = false,
    onMapClick,
    isMapLoading = false,
    addressLabel,
    onClearAddress,
    enableImage = false,
    onImageOpen,
    suggestionsSlot,
    leadingIcon = "solar:magnifer-bold-duotone",
    labels,
    sticky = true,
    maxRows = 4,
    autoFocus,
    className = "",
}: SearchInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Auto-grow — mesure scrollHeight à chaque frappe, plafonné à `maxRows` lignes puis
    // scroll interne (comportement ChatGPT/Claude).
    useLayoutEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight || "20") || 20;
        const maxHeight = lineHeight * maxRows;
        const next = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    }, [value, maxRows]);

    // Rapporte sa propre hauteur dans --searchinput-height : ComingSoon.tsx (padding-bottom
    // du contenu) et sa propre position (`bottom: var(--footer-height)`, juste en dessous)
    // s'y alignent sans valeur codée en dur. Remise à "0px" au démontage (changement d'onglet
    // AppTabs) pour ne pas laisser un espace réservé sur un écran sans SearchInput.
    useLayoutEffect(() => {
        if (!sticky || !mounted) return;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const update = () => {
            document.documentElement.style.setProperty("--searchinput-height", `${wrap.offsetHeight}px`);
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(wrap);
        return () => {
            ro.disconnect();
            document.documentElement.style.setProperty("--searchinput-height", "0px");
        };
    }, [sticky, mounted]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isLoading) onSubmit?.(value);
        }
    };

    const handleClear = () => {
        onChange("");
        onClear?.();
        textareaRef.current?.focus();
    };

    const L = {
        clear: labels?.clear ?? "Effacer la recherche",
        voice: labels?.voice ?? "Recherche vocale",
        location: labels?.location ?? "Ma position",
        image: labels?.image ?? "Recherche par image",
        submit: labels?.submit ?? "Rechercher",
    };

    const hasActions = enableVoice || enableMap || enableImage || enableSubmitButton;

    const bar = (
        <div className={`flex flex-col w-full bg-card border border-primary rounded-xl shadow-lg hover:border-secondary focus-within:border-secondary transition-colors ${disabled ? "opacity-60" : ""}`}>
            <div className="flex items-start gap-2 pl-4 pr-3 pt-1.5">
                <Icon icon={leadingIcon} className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={labels?.placeholder ?? placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    rows={1}
                    className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground resize-none py-0 leading-4"
                />
                {enableClear && value && (
                    <button type="button" onClick={handleClear} className="p-0.5 mt-0.5 text-muted-foreground hover:text-primary transition-colors animate-in fade-in zoom-in duration-200 flex-shrink-0" title={L.clear}>
                        <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                    </button>
                )}
            </div>

            {hasActions && (
                <div className="flex items-center justify-end gap-0.5 px-1.5 pb-1 pt-0">
                    {enableVoice && (
                        <button type="button" onClick={onVoiceOpen} disabled={disabled} className="p-1.5 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-90 rounded-full hover:bg-primary/5" title={L.voice}>
                            <Icon icon="solar:microphone-bold-duotone" className="w-4 h-4" />
                        </button>
                    )}
                    {enableMap && (
                        <button type="button" onClick={onMapClick} disabled={disabled || isMapLoading} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/5" title={L.location}>
                            <Icon icon="solar:gps-bold-duotone" className={`w-4 h-4 ${isMapLoading ? "animate-spin" : ""}`} />
                        </button>
                    )}
                    {enableImage && (
                        <button type="button" onClick={onImageOpen} disabled={disabled} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-primary/5" title={L.image}>
                            <Icon icon="solar:camera-bold-duotone" className="w-4 h-4" />
                        </button>
                    )}
                    {enableSubmitButton && (
                        <button type="button" onClick={() => !disabled && !isLoading && onSubmit?.(value)} disabled={disabled || isLoading} className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white hover:bg-secondary transition-all active:scale-90 disabled:opacity-50 ml-1 shadow-sm" title={L.submit}>
                            <Icon icon={isLoading ? "solar:refresh-bold-duotone" : "solar:magnifer-bold-duotone"} className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );

    const addressPill = enableMap && addressLabel && (
        <div className="self-center px-4 py-2 rounded-full bg-primary/5 border border-primary/10 flex items-center gap-2 shadow-sm backdrop-blur-sm">
            <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground/80">{addressLabel}</span>
            {onClearAddress && (
                <button type="button" onClick={onClearAddress} className="ml-1 text-muted-foreground hover:text-primary transition-colors">
                    <Icon icon="solar:close-circle-bold-duotone" className="w-4 h-4" />
                </button>
            )}
        </div>
    );

    // Suggestions ouvrent vers le HAUT (bottom-full) puisque la barre est ancrée en bas de
    // l'écran — l'équivalent d'un menu d'auto-complétion façon chat, jamais hors-écran.
    const content = (
        <div ref={wrapRef} className="relative w-full flex flex-col items-stretch gap-2">
            {suggestionsSlot && (
                <div className="absolute bottom-full left-0 right-0 mb-2">
                    {suggestionsSlot}
                </div>
            )}
            {addressPill}
            {bar}
        </div>
    );

    if (!sticky) {
        return (
            <div className={`w-full flex flex-col items-center ${className}`}>
                <div className="w-full max-w-2xl">{content}</div>
            </div>
        );
    }

    if (!mounted) {
        // Rendu SSR/premier paint : en flux normal le temps que le portail soit disponible,
        // pour éviter tout flash de contenu manquant.
        return (
            <div className={`w-full flex flex-col items-center ${className}`}>
                <div className="w-full max-w-2xl">{content}</div>
            </div>
        );
    }

    // Toujours `position: fixed`, empilée juste au-dessus du footer (lui aussi fixe, voir
    // Footer.tsx) via `bottom: var(--footer-height)` — jamais de repositionnement au scroll :
    // ni la barre ni le footer ne bougent, seul le contenu de la page défile derrière eux.
    // Portail vers document.body : un ancêtre (PageTransition.tsx) applique un `transform`
    // Framer Motion persistant qui casse `position: fixed` classique (même problème déjà
    // documenté et contourné par FullScreenOverlayPortal.tsx).
    return createPortal(
        <>
            {/* Fondu façon IA (ChatGPT/Claude) : le contenu qui défile sous la barre s'estompe
                progressivement au lieu d'être coupé net par le composer opaque. */}
            <div
                className="fixed inset-x-0 h-40 md:h-32 z-30 pointer-events-none bg-gradient-to-t from-background via-background/90 to-transparent"
                style={{ bottom: "var(--footer-height, 0px)" }}
            />
            <div
                className="fixed inset-x-0 z-40 flex justify-center px-4 pointer-events-none"
                style={{ bottom: "calc(var(--footer-height, 0px) + 16px + env(safe-area-inset-bottom, 0px))" }}
            >
                <div className={`w-full max-w-2xl pointer-events-auto ${className}`}>
                    {content}
                </div>
            </div>
        </>,
        document.body
    );
}
