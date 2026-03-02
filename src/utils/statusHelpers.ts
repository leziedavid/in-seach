export type StatusHelpers<S extends string> = {
    getStatusLabel: (status: S) => string
    getStatusColor: (status: S) => string
}

export function createStatusHelpers<S extends string>(labels: Record<S, string>, colors: Record<S, string>): StatusHelpers<S> {
    return {
        getStatusLabel: (status: S) => labels[status] ?? status,
        getStatusColor: (status: S) => colors[status] ?? "",
    }
}
