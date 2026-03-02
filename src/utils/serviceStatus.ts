
import { ServiceStatus } from "@/types/interface"
import { createStatusHelpers } from "@/utils/statusHelpers"

export const serviceStatusHelpers = createStatusHelpers<ServiceStatus>(
    {
        AVAILABLE: "Disponible",
        UNAVAILABLE: "Indisponible",
        PENDING: "En attente",
    },
    {
        AVAILABLE: "bg-green-100 text-green-800 border-green-300",
        UNAVAILABLE: "bg-red-100 text-red-800 border-red-300",
        PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
    }
)
