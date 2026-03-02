import { BookingStatus } from "@/types/interface"
import { createStatusHelpers } from "@/utils/statusHelpers"

export const bookingStatusHelpers = createStatusHelpers<BookingStatus>(
    {
        PENDING: "En attente",
        ACCEPTED: "Accepté",
        IN_PROGRESS: "En cours",
        COMPLETED: "Terminé",
        CANCELLED: "Annulé",
        PAID: "Payé",
    },
    {
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
        ACCEPTED: "bg-blue-100 text-blue-800 border-blue-300",
        IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-300",
        COMPLETED: "bg-green-100 text-green-800 border-green-300",
        CANCELLED: "bg-red-100 text-red-800 border-red-300",
        PAID: "bg-emerald-100 text-emerald-800 border-emerald-300",
    }
)
