"use client"

import * as React from "react"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable, } from "@tanstack/react-table"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { TablePagination } from "./Pagination"

export type TableAction<T> = {
    icon: any
    label: string
    value: string
    variant?: "default" | "destructive"
    disabled?: (row: T) => boolean
}

export interface TableProps<T, S extends string> {
    columns: ColumnDef<T>[]
    data: T[]
    enableSwitch?: boolean
    getActive?: (row: T) => boolean
    onToggleActive?: (row: T, value: boolean) => void
    enableStatus?: boolean
    getStatus?: (row: T) => S
    onChangeStatus?: (row: T, status: S) => void
    statusRules?: (current: S) => S[]
    getStatusLabel?: (status: S) => string
    getStatusColor?: (status: S) => string
    actions?: TableAction<T>[]
    onAction?: (action: string, row: T) => void
    haveTitle?: boolean
    loading?: boolean
    searchKey?: string
    emptyMessage?: string
    totalItems?: number
    currentPage?: number
    itemsPerPage?: number
    onPageChange?: (page: number) => void
}

export function GenericTable<T, S extends string>({
    columns,
    data,
    enableSwitch,
    getActive,
    onToggleActive,
    enableStatus,
    getStatus,
    onChangeStatus,
    statusRules,
    getStatusLabel,
    getStatusColor,
    actions,
    onAction,
    haveTitle = true,
    loading = false,
    searchKey,
    emptyMessage = "Aucun résultat trouvé.",
    totalItems,
    currentPage,
    itemsPerPage,
    onPageChange,
}: TableProps<T, S>) {
    const [searchValue, setSearchValue] = React.useState("")
    const extraColumns: ColumnDef<T>[] = React.useMemo(() => {
        const cols: ColumnDef<T>[] = []

        if (enableSwitch) {
            cols.push({
                id: "_tg_active",
                header: "Actif",
                cell: ({ row }) => (
                    <Switch
                        checked={getActive?.(row.original)}
                        onCheckedChange={(v) => onToggleActive?.(row.original, v)}
                    />
                ),
            })
        }

        if (enableStatus) {
            cols.push({
                id: "_tg_status",
                header: "Statut",
                cell: ({ row }) => {
                    const current = getStatus?.(row.original)
                    if (!current) return null

                    const allowed = statusRules?.(current) ?? []

                    return (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={getStatusColor?.(current)}
                                >
                                    {getStatusLabel?.(current) ?? current}
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent>
                                {allowed.map((s) => (
                                    <DropdownMenuItem
                                        key={s}
                                        onClick={() => onChangeStatus?.(row.original, s)}
                                    >
                                        {getStatusLabel?.(s) ?? s}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                },
            })
        }

        if (actions?.length) {
            cols.push({
                id: "_tg_actions",
                header: "",
                cell: ({ row }) => (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                            {actions.map((a) => (
                                <DropdownMenuItem
                                    key={a.value}
                                    onClick={() => onAction?.(a.value, row.original)}
                                    disabled={a.disabled?.(row.original)}
                                    className={a.variant === "destructive" ? "text-red-600" : ""}
                                >
                                    <a.icon className="mr-2 h-4 w-4" />
                                    {a.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                ),
            })
        }

        return cols
    }, [
        enableSwitch,
        enableStatus,
        actions,
        getActive,
        onToggleActive,
        getStatus,
        onChangeStatus,
        statusRules,
        onAction,
        getStatusLabel,
        getStatusColor,
    ])

    const filteredData = React.useMemo(() => {
        if (!searchKey || !searchValue) return data
        return data.filter((item: any) =>
            String(item[searchKey]).toLowerCase().includes(searchValue.toLowerCase())
        )
    }, [data, searchKey, searchValue])

    const table = useReactTable({
        data: filteredData,
        columns: [...columns, ...extraColumns],
        getCoreRowModel: getCoreRowModel(),
    })

    const allColumns = table.getAllLeafColumns()

    return (
        <div className="w-full space-y-4">
            {searchKey && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-9 font-medium border-none bg-card/50"
                    />
                </div>
            )}
            <div className="rounded-md border overflow-hidden">
                <Table>
                    {haveTitle && (
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                    )}

                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="bg-muted/50">
                                    {allColumns.map((col, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-6 w-full opacity-50" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow className="hover:bg-muted/50" key={row.id} data-state={row.getIsSelected() && "selected"}   >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow className="hover:bg-muted/50">
                                <TableCell colSpan={allColumns.length} className="h-24 text-center text-muted-foreground font-medium">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {onPageChange && totalItems !== undefined && currentPage !== undefined && itemsPerPage !== undefined && (
                <div className="border-t border-border/50">
                    <TablePagination
                        page={currentPage}
                        limit={itemsPerPage}
                        total={totalItems}
                        totalPages={Math.ceil(totalItems / itemsPerPage)}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    )
}