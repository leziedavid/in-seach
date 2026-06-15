'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Retarde la mise à jour d'une valeur jusqu'à ce que l'utilisateur
 * arrête de la modifier (idéal pour les champs de recherche).
 *
 * @param value  Valeur à débouncer
 * @param delay  Délai en ms (défaut : 400ms — bon compromis UX/réseau)
 */
export function useDebounce<T>(value: T, delay = 400): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Version callback : exécute fn après le délai, annule si appelé à nouveau.
 * Utile pour les handlers (ex: onInput, onChange) sans état intermédiaire.
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
    fn: T,
    delay = 400,
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fnRef = useRef(fn);
    fnRef.current = fn;

    return (...args: Parameters<T>) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
    };
}
