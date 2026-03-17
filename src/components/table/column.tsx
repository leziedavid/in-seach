"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils"
import { Service } from "@/types/interface";
import Image from "next/image";

// SERVIES TABLE
export const columns: ColumnDef<Service>[] = [
    {
        accessorKey: "title",
        header: "Service",
        cell: ({ row }) => (
            <div className="flex items-end justify-start min-w-0 w-full h-full">
                <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                        src={
                            row.original.imageUrls?.[0] ||
                            row.original.files?.[0]?.fileUrl ||
                            "/placeholder.png"
                        }
                        alt={row.original.title}
                        fill
                        className="object-cover rounded"
                        unoptimized
                    />
                </div>
            </div>
        ),
    },
];




