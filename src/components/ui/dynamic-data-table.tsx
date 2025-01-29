"use client"

import type React from "react"
import { useMemo, useState, useRef } from "react"
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type FilterFn,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter } from "lucide-react"

interface DynamicDataTableProps<T extends object> {
    data: T[]
    columns?: ColumnDef<T>[]
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemValue = row.getValue(columnId)

    // Handle numeric values
    if (typeof itemValue === "number") {
        const numericValue = Number.parseFloat(value)
        return !Number.isNaN(numericValue) && itemValue === numericValue
    }

    // Handle string values
    if (typeof itemValue === "string") {
        return itemValue.toLowerCase().includes(value.toLowerCase())
    }

    // For other types, fall back to default behavior
    return false
}

export function DynamicDataTable<T extends object>({ data, columns: userDefinedColumns }: DynamicDataTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [filterOpen, setFilterOpen] = useState(false)
    const filterDropdownRef = useRef<HTMLDivElement>(null)

    const columns = useMemo(() => {
        if (userDefinedColumns) return userDefinedColumns

        if (data.length === 0) return []

        return Object.keys(data[0]).map((key) => ({
            accessorKey: key,
            header: key.charAt(0).toUpperCase() + key.slice(1),
        })) as ColumnDef<T>[]
    }, [data, userDefinedColumns])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        globalFilterFn: fuzzyFilter,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
    })

    const handleFilterOpenChange = (open: boolean) => {
        if (!open) {
            const activeElement = document.activeElement
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(activeElement)) {
                setFilterOpen(false)
            }
        } else {
            setFilterOpen(true)
        }
    }

    const handleInputClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Input
                    placeholder="Search all columns..."
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
                <DropdownMenu open={filterOpen} onOpenChange={handleFilterOpenChange}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            <Filter className="mr-2 h-4 w-4" /> Filter
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]" ref={filterDropdownRef}>
                        <DropdownMenuLabel>Filter Columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table.getAllColumns().map((column) => {
                            return (
                                <DropdownMenuItem key={column.id} className="capitalize" onSelect={(e) => e.preventDefault()}>
                                    <Input
                                        placeholder={`Filter ${column.id}`}
                                        value={(column.getFilterValue() ?? "") as string}
                                        onChange={(event) => column.setFilterValue(event.target.value)}
                                        className="max-w-sm mt-2"
                                        onClick={handleInputClick}
                                    />
                                </DropdownMenuItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder ? null : (
                                            <div
                                                {...{
                                                    className: header.column.getCanSort() ? "cursor-pointer select-none" : "",
                                                    onClick: header.column.getToggleSortingHandler(),
                                                }}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{
                                                    asc: " 🔼",
                                                    desc: " 🔽",
                                                }[header.column.getIsSorted() as string] ?? null}
                                            </div>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {/* Pagination controls remain unchanged */}
        </div>
    )
}

