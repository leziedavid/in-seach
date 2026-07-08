/**
 * Conversion aller/retour entre le nom réel d'une boutique (tel que stocké en base,
 * `User.storeName`) et le slug utilisé dans l'URL publique `/shop/{slug}`.
 *
 * Le retour arrière (restoreStoreName) est une approximation : les accents supprimés par
 * createStoreSlug ne peuvent pas être restitués, et la casse d'origine exacte non plus (ex.
 * "LEZANGOLY" redevient "Lezangoly", pas "LEZANGOLY"). Ce n'est pas un problème pour les appels
 * API existants (UserService.getPublicStoreInfo / ProductService.findAll) qui matchent déjà
 * storeName en mode insensible à la casse — en revanche un nom de boutique accentué ne sera pas
 * retrouvé après un aller-retour slug, la recherche backend n'étant pas insensible aux accents.
 */

// Bornes décimales des marques diacritiques combinantes Unicode (U+0300 à U+036F), obtenues via
// normalize("NFD") qui décompose ex. "é" en "e" + accent combinant séparé. Comparaison par code
// plutôt que regex ̀-ͯ pour éviter toute ambiguïté d'échappement dans le fichier source.
const COMBINING_DIACRITIC_MIN = 768; // U+0300
const COMBINING_DIACRITIC_MAX = 879; // U+036F

function stripDiacritics(input: string): string {
    let result = "";
    for (const ch of input.normalize("NFD")) {
        const code = ch.charCodeAt(0);
        if (code < COMBINING_DIACRITIC_MIN || code > COMBINING_DIACRITIC_MAX) {
            result += ch;
        }
    }
    return result;
}

/** Nom réel de boutique -> slug d'URL. Idempotent (un slug déjà propre reste inchangé). */
export function createStoreSlug(storeName: string | null | undefined): string {
    if (!storeName) return "";
    return stripDiacritics(storeName)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "") // supprime le reste des caractères spéciaux
        .replace(/\s+/g, "-") // espaces -> tiret
        .replace(/-+/g, "-") // collapse les tirets multiples
        .replace(/^-+|-+$/g, ""); // trim les tirets en début/fin
}

/** Slug d'URL -> nom exploitable par les API existantes (recherche insensible à la casse). */
export function restoreStoreName(slug: string | null | undefined): string {
    if (!slug) return "";
    return slug
        .replace(/-/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
