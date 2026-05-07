import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugifyCompany(name: string) {
  return name
    ?.toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Enlever caractères spéciaux
    .replace(/[\s_-]+/g, "-") // Remplacer espaces/underscores par -
    .replace(/^-+|-+$/g, ""); // Nettoyer début/fin
}
