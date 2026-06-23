/**
 * Le prix d'un Service ou d'une Annonce est optionnel côté backend.
 * Un prix absent, nul ou à 0 ne doit jamais être affiché comme un vrai
 * prix (ex: "0 FCFA") — on masque le bloc prix dans ce cas.
 */
export function hasValidPrice(price?: number | null): price is number {
    return typeof price === "number" && price > 0;
}
