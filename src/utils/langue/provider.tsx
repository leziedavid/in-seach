"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, TKey } from "./index";

interface I18nContextProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TKey, params?: Record<string, any> | string) => string;
    // Comme t(), mais accepte des éléments React (ex: <Link>) en paramètre et retourne un
    // noeud affichable au lieu d'une string — nécessaire pour les phrases traduites contenant
    // un lien cliquable au milieu du texte (t() ferait un .replace() qui donnerait "[object Object]").
    tRich: (key: TKey, params?: Record<string, React.ReactNode>) => React.ReactNode;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>("fr");

    useEffect(() => {
        const savedLang = localStorage.getItem("app_lang") as Language;
        if (savedLang && (savedLang === "fr" || savedLang === "en")) {
            setLanguageState(savedLang);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem("app_lang", lang);
    };

    const t = (key: TKey, params?: Record<string, any> | string): string => {
        const keys = key.split(".");
        let result: any = translations[language];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                // Fallback to FR if current language key is missing
                let fallback: any = translations["fr"];
                let foundFallback = true;
                for (const fk of keys) {
                    if (fallback && fallback[fk]) {
                        fallback = fallback[fk];
                    } else {
                        foundFallback = false;
                        break;
                    }
                }
                
                if (foundFallback) {
                    result = fallback;
                } else {
                    // If no fallback and params is a string, use it as default value
                    if (typeof params === "string") return params;
                    return key; 
                }
                break;
            }
        }

        if (typeof result !== "string") {
            if (typeof params === "string") return params;
            return key;
        }

        if (params && typeof params === "object") {
            Object.entries(params).forEach(([k, v]) => {
                result = result.replace(`{{${k}}}`, v); // Using {{key}} for consistency
                result = result.replace(`{${k}}`, v);
            });
        }

        return result;
    };

    // Résout la même clé que t() (avec le même fallback FR), mais sans jamais appeler t()
    // elle-même : t() reste inchangée pour tous ses appelants existants (souvent utilisée hors
    // JSX, ex: messages de validation zod, qui exigent une vraie string).
    const resolveRaw = (key: TKey): string | null => {
        const keys = key.split(".");
        let result: any = translations[language];

        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                let fallback: any = translations["fr"];
                let foundFallback = true;
                for (const fk of keys) {
                    if (fallback && fallback[fk]) {
                        fallback = fallback[fk];
                    } else {
                        foundFallback = false;
                        break;
                    }
                }
                if (foundFallback) {
                    result = fallback;
                } else {
                    return null;
                }
                break;
            }
        }

        return typeof result === "string" ? result : null;
    };

    const tRich = (key: TKey, params?: Record<string, React.ReactNode>): React.ReactNode => {
        const raw = resolveRaw(key);
        if (raw === null) return key;
        if (!params) return raw;

        // Découpe la chaîne sur chaque placeholder {k}/{{k}} et intercale les noeuds React
        // fournis, pour permettre un lien cliquable au milieu d'une phrase traduite.
        const paramKeys = Object.keys(params);
        const pattern = new RegExp(paramKeys.map(k => `\\{\\{?${k}\\}?\\}`).join("|"), "g");
        const nodes: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(raw)) !== null) {
            if (match.index > lastIndex) nodes.push(raw.slice(lastIndex, match.index));
            const matchedKey = paramKeys.find(k => match![0] === `{${k}}` || match![0] === `{{${k}}}`);
            if (matchedKey) {
                nodes.push(<React.Fragment key={`${matchedKey}-${match.index}`}>{params[matchedKey]}</React.Fragment>);
            }
            lastIndex = pattern.lastIndex;
        }
        if (lastIndex < raw.length) nodes.push(raw.slice(lastIndex));

        return nodes;
    };

    // Prevent hydration flicker by returning a placeholder or children with default lang
    // However, to satisfy Next.js hydration, we should render children with default lang first
    // and then update if localStorage says otherwise. 
    // If we don't render children until mounted, we lose SEO/SSR benefits on the first pass.
    // So we render with default 'fr' and update on mount.

    return (
        <I18nContext.Provider value={{ language, setLanguage, t, tRich }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18nInternal = () => {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
};
