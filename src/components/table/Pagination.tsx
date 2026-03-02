"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export interface PaginationProps {
    page: number
    limit: number
    total: number
    totalPages: number
    onPageChange: (page: number) => void
}

export function TablePagination({
    page,
    limit,
    total,
    totalPages,
    onPageChange,
}: PaginationProps) {
    const start = (page - 1) * limit + 1
    const end = Math.min(page * limit, total)

    if (total === 0) return null

    return (
        <div className="flex items-center justify-between px-4 py-3 ">
            <p className="text-sm text-muted-foreground">
                <span className="font-medium">{start}</span> - {" "}
                <span className="font-medium">{end}</span> / {" "}
                <span className="font-medium">{total}</span>
            </p>

            <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" disabled={page === 1} onClick={() => onPageChange(page - 1)} className="rounded-full" >
                    <ChevronLeft size={16} />
                </Button>

                <span className="text-sm font-medium">
                    {page} / {totalPages}
                </span>

                <Button size="icon" variant="outline" disabled={page === totalPages} onClick={() => onPageChange(page + 1)} className="rounded-full" >
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    )
}
