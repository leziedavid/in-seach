import { Product } from "@/types/interface";

const SENSITIVE_KEYWORDS = [
    "sexy", "lingerie", "culotte",
    "boxer", "sous-vêtement", "tanga",
    "slip", "maillot de bain","Nuisette"
];

function normalize(value?: string | null): string {
    return (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Un produit est "sensible" si sa catégorie ou sous-catégorie évoque
 * les sous-vêtements sexy / la lingerie (ex: "Sous Vêtement Sexy",
 * "Lingerie homme & femme"). Le matching est insensible à la casse et aux accents
 * pour rester robuste aux libellés créés côté admin.
 */
export function isSensitiveProduct(product?: Pick<Product, "category" | "subCategory"> | null): boolean {
    if (!product) return false;
    const haystacks = [
        product.category?.name,
        product.subCategory?.name,
        product.subCategory?.slug,
    ].map(normalize);
    return haystacks.some((text) => SENSITIVE_KEYWORDS.some((keyword) => text.includes(keyword)));
}
