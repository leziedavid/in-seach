import { Annonce } from "@/types/interface";

/**
 * Détermine si une annonce relève du nouveau flux de réservation dédié
 * (annonces dont le type a le slug "reservation"). Les autres types
 * (vente, location) conservent l'ancien BookingModal, sans régression.
 */
export function isReservationAnnonce(annonce?: Partial<Annonce> | null): boolean {
    return annonce?.type?.slug === "reservation";
}
