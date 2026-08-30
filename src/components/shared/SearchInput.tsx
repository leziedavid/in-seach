"use client";

import { useState, useRef, useLayoutEffect, useEffect, KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@iconify/react";

export interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: (value: string) => void;
    // Appelé à CHAQUE frappe (contrairement à onChange, qui n'est commis qu'à la soumission) —
    // pour les besoins "live" qui ne doivent pas déclencher la recherche principale elle-même
    // (ex : suggestions d'autocomplétion pendant que l'utilisateur tape).
    onDraftChange?: (value: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    disabled?: boolean;

    // Tant que le brouillon correspond exactement à la dernière recherche envoyée, le bouton
    // d'envoi se transforme en bouton "effacer" (même emplacement/taille/style) — défaut true.
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

    suggestionsSlot?: React.ReactNode;

    leadingIcon?: string;
    labels?: {
        clear?: string;
        voice?: string;
        location?: string;
        submit?: string;
        placeholder?: string;
    };

    // Ancre la barre en bas de l'écran façon composer IA (ChatGPT/Claude), toujours visible
    // pendant que le contenu défile derrière elle. Défaut false (rendu classique en flux
    // normal, à l'endroit où le composant est appelé) — passer true pour l'ancrer en bas.
    // Gardé disponible pour un futur écran type "composer" ; aucun des 12 écrans actuels
    // n'en a besoin (retours utilisateurs : la barre fixe gênait la navigation).
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
    onDraftChange,
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
    suggestionsSlot,
    leadingIcon = "solar:magnifer-bold-duotone",
    labels,
    sticky = false,
    maxRows = 4,
    autoFocus,
    className = "",
}: SearchInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    // Brouillon local : la frappe ne touche jamais `value`/`onChange` (donc jamais l'effet de
    // recherche live du parent) — le texte tapé n'est "commis" au parent qu'à la soumission
    // (bouton d'envoi ou Entrée), façon ChatGPT/Claude/Gemini. `value` reste la source de
    // vérité pour tout ce qui vient de l'EXTÉRIEUR de la frappe (résultat vocal, clic sur une
    // suggestion, position GPS, effacement de l'adresse...) : ce useEffect resynchronise le
    // brouillon dessus à chaque changement externe, y compris après notre propre commit
    // (no-op à ce moment-là puisque les deux valent alors déjà la même chose).
    const [draft, setDraft] = useState(value);
    useEffect(() => { setDraft(value); }, [value]);

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
    }, [draft, maxRows]);

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

    // Seul point de contact entre le brouillon local et le parent : commit `onChange` (met à
    // jour son state, donc son effet de recherche) puis `onSubmit` — jamais appelé pendant la
    // frappe, uniquement au clic sur le bouton d'envoi ou à Entrée.
    const commit = (submitted: string) => {
        onChange(submitted);
        onSubmit?.(submitted);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!disabled && !isLoading) commit(draft);
        }
    };

    const handleClear = () => {
        setDraft("");
        onChange("");
        onDraftChange?.("");
        onClear?.();
        textareaRef.current?.focus();
    };

    const L = {
        clear: labels?.clear ?? "Effacer la recherche",
        voice: labels?.voice ?? "Recherche vocale",
        location: labels?.location ?? "Ma position",
        submit: labels?.submit ?? "Rechercher",
    };

    const hasActions = enableVoice || enableMap || enableSubmitButton;

    // Le bouton d'envoi se transforme en bouton "effacer" tant que le brouillon correspond
    // exactement à la dernière recherche commise (donc juste après une soumission, tant que
    // rien n'a été retapé) — même emplacement/taille/style, pour ne jamais faire cohabiter les
    // deux boutons ni décaler la mise en page. Dès que l'utilisateur modifie le texte, le
    // brouillon diverge de `value` et le bouton redevient "envoyer".
    const isClearMode = enableClear && !!draft && draft === value;

    // Une seule rangée (icône, champ, actions, envoi), alignée en BAS (items-end) plutôt
    // qu'au centre : quand le texte grandit sur plusieurs lignes, l'icône et les boutons
    // restent ancrés en bas — comme le composer ChatGPT/Claude/Claude Code — au lieu de se
    // recentrer et donner une impression de "déformation". `rounded-3xl` (rayon fixe) et
    // non `rounded-full` : sur une pilule pleinement ronde, une boîte haute (texte multi-
    // lignes) prendrait une forme de stade étirée au lieu d'un rectangle arrondi propre.
    const bar = (
        <div className={`flex items-end w-full gap-2 bg-card border border-border rounded-xl shadow-sm hover:border-primary/40 focus-within:border-primary transition-colors pl-4 pr-1.5 py-2 ${disabled ? "opacity-60" : ""}`}>
            <Icon icon={leadingIcon} className="w-5 h-5 text-muted-foreground flex-shrink-0 mb-1" />

            <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => { setDraft(e.target.value); onDraftChange?.(e.target.value); }}
                onKeyDown={handleKeyDown}
                placeholder={labels?.placeholder ?? placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                rows={1}
                // placeholder:whitespace-nowrap (+ ellipsis) : un placeholder long ne doit
                // JAMAIS retourner à la ligne — sinon son propre scrollHeight (mesuré même
                // quand le champ est vide) gonfle la hauteur auto-grow, et la barre paraît
                // "déformée" dès que l'utilisateur efface sa saisie. Ne touche pas au retour
                // à la ligne du texte réellement tapé (résout la cause, pas juste le symptôme
                // — en complément du raccourcissement des placeholders eux-mêmes).
                className="flex-1 bg-transparent text-foreground outline-none text-sm min-w-0 placeholder:text-muted-foreground placeholder:truncate resize-none py-1.5 leading-5"
            />

            {hasActions && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
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
                    {enableSubmitButton && (
                        <button
                            type="button"
                            onClick={() => { if (disabled || isLoading) return; isClearMode ? handleClear() : commit(draft); }}
                            disabled={disabled || isLoading}
                            className={`relative flex items-center justify-center w-8 h-8 rounded-full text-white transition-all active:scale-90 disabled:opacity-50 ml-1 shadow-sm overflow-hidden ${isClearMode ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-secondary"}`}
                            title={isClearMode ? L.clear : L.submit}
                        >
                            <Icon
                                key={isClearMode ? "clear" : "submit"}
                                icon={isLoading ? "solar:refresh-bold-duotone" : isClearMode ? "solar:close-circle-bold-duotone" : "solar:arrow-up-bold-duotone"}
                                className={`w-3.5 h-3.5 animate-in fade-in zoom-in duration-150 ${isLoading ? "animate-spin" : ""}`}
                            />
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

    // Suggestions se déroulent vers le BAS, juste sous la barre — ne doivent jamais recouvrir
    // ce que l'utilisateur est en train de saisir au-dessus. `suggestionsSlot` se positionne
    // lui-même (`absolute top-full mt-2`, voir les appelants) relativement à ce conteneur
    // `relative` — pas de wrapper de positionnement supplémentaire ici pour éviter un double
    // décalage.
    const content = (
        <div ref={wrapRef} className="relative w-full flex flex-col items-stretch gap-2">
            {addressPill}
            {bar}
            {suggestionsSlot}
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
