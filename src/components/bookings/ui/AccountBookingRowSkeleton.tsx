import { Skeleton } from "@/components/ui/skeleton";

export default function AccountBookingRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 py-3 border-b">
            {/* left */}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-28" />
            </div>

            {/* right */}
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
        </div>
    );
}
