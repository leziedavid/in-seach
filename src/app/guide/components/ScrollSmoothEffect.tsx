"use client";

import { useEffect } from "react";

/**
 * Active le scroll fluide (ancre du sommaire) uniquement pendant que cette page
 * est montée, et restaure la valeur précédente au démontage — aucun effet de bord
 * sur les autres pages du site.
 */
export default function ScrollSmoothEffect() {
    useEffect(() => {
        const html = document.documentElement;
        const previous = html.style.scrollBehavior;
        html.style.scrollBehavior = "smooth";
        return () => {
            html.style.scrollBehavior = previous;
        };
    }, []);

    return null;
}
