"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type ColumnFiltersState,
    type PaginationState,
    type RowSelectionState,
    type SortingState,
    type VisibilityState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Copy,
    Download,
    Eye,
    FileDown,
    FileEdit,
    Filter,
    MoreHorizontal,
    Paintbrush,
    Search,
    Trash,
    X
} from "lucide-react"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { HiOutlineFastForward } from "react-icons/hi"
import { HiOutlineBackward } from "react-icons/hi2"
// import { ConditionalFormatDialog, type ConditionalFormatRule } from "./conditional-format-dialog"
// import { ErrorBoundary } from "./error-boundary"

// Debounce function to prevent excessive rendering
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)

        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])

    return debouncedValue
}

interface CsvTableProps {
    headers: string[]
    data: string[][]
}

// Sortable header component
function DraggableColumnHeader({
    header,
    id,
    table,
}: {
    header: any
    id: string
    table: any
}) {
    const [filterOpen, setFilterOpen] = useState(false)
    const [filterSearch, setFilterSearch] = useState("")
    const debouncedFilterSearch = useDebounce(filterSearch, 200)

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

    // Get unique values from the filtered data
    const uniqueValues = useMemo(() => {
        // Only compute this when the filter is open to save resources
        if (!filterOpen) return []

        const values = new Set<string>()
        // Use the filtered rows to get values that match current filters
        const rows = table.getFilteredRowModel()?.rows || []
        rows.forEach((row: any) => {
            const value = row.getValue(header.column.id)
            if (value !== null && value !== undefined) {
                values.add(String(value))
            }
        })
        return Array.from(values).sort()
    }, [header.column.id, table, filterOpen, table.getState()?.columnFilters])

    // Filter the unique values based on search
    const filteredUniqueValues = useMemo(() => {
        if (!debouncedFilterSearch) return uniqueValues
        return uniqueValues.filter((value) => value.toLowerCase().includes(debouncedFilterSearch.toLowerCase()))
    }, [uniqueValues, debouncedFilterSearch])

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        touchAction: "none",
        position: "relative" as const,
        width: header.getSize(),
    }

    return (
        <TableHead ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {header.isPlaceholder ? null : (
                <div className="flex items-center justify-between">
                    <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => header.column.toggleSorting(header.column.getIsSorted() === "asc")}
                            className="ml-1 p-0 h-6 w-6"
                        >
                            <ArrowUpDown
                                className={`h-3 w-3 ${header.column.getIsSorted() === "asc"
                                    ? "text-primary rotate-180"
                                    : header.column.getIsSorted() === "desc"
                                        ? "text-primary"
                                        : ""
                                    }`}
                            />
                        </Button>
                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`ml-1 p-0 h-6 w-6 ${header.column.getFilterValue()?.length ? "text-primary" : ""}`}
                                >
                                    <Filter className="h-3 w-3" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-60 p-0" align="start">
                                <div className="p-2 font-medium border-b">Filter by {header.column.id}</div>
                                <div className="p-2 border-b">
                                    <Input
                                        placeholder="Search values..."
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="h-8"
                                    />
                                </div>
                                <ScrollArea className="h-72">
                                    <div className="p-2">
                                        {filteredUniqueValues && filteredUniqueValues.length > 0 ? (
                                            filteredUniqueValues.map((value) => {
                                                const isSelected = header.column.getFilterValue()?.includes(value)
                                                return (
                                                    <div key={value} className="flex items-center space-x-2 py-1">
                                                        <Checkbox
                                                            id={`${header.column.id}-${value}`}
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                const currentFilters = header.column.getFilterValue() || []
                                                                if (checked) {
                                                                    header.column.setFilterValue([...currentFilters, value])
                                                                } else {
                                                                    header.column.setFilterValue(currentFilters.filter((v: string) => v !== value))
                                                                }
                                                            }}
                                                        />
                                                        <Label
                                                            htmlFor={`${header.column.id}-${value}`}
                                                            className="text-sm cursor-pointer flex-1 truncate"
                                                        >
                                                            {value}
                                                        </Label>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-sm text-muted-foreground py-2 text-center">
                                                {debouncedFilterSearch ? "No matching values" : "No unique values"}
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                                <div className="p-2 border-t flex justify-between">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            header.column.setFilterValue(null)
                                            setFilterSearch("")
                                        }}
                                        className="text-xs"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => header.column.setFilterValue(uniqueValues)}
                                        className="text-xs"
                                    >
                                        Select All
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}
            {/* Resizer */}
            <div
                onMouseDown={(e) => {
                    e.preventDefault()
                    header.getResizeHandler()(e)
                }}
                onTouchStart={(e) => {
                    e.preventDefault()
                    header.getResizeHandler()(e)
                }}
                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-primary/50 opacity-0 hover:opacity-100 ${header.column.getIsResizing() ? "opacity-100 bg-primary" : ""
                    }`}
            />
        </TableHead>
    )
}

// Function to apply conditional formatting to a cell
function applyCellFormatting(
    value: any,
    column: string,
    rules: ConditionalFormatRule[],
): { backgroundColor?: string; textColor?: string } {
    const matchingRules = rules.filter((rule) => rule.column === column)

    for (const rule of matchingRules) {
        const cellValue = String(value)
        let matches = false

        switch (rule.operator) {
            case "equals":
                matches = cellValue === rule.value1
                break
            case "contains":
                matches = cellValue.includes(rule.value1)
                break
            case "greaterThan":
                matches = !isNaN(Number(cellValue)) && !isNaN(Number(rule.value1)) && Number(cellValue) > Number(rule.value1)
                break
            case "lessThan":
                matches = !isNaN(Number(cellValue)) && !isNaN(Number(rule.value1)) && Number(cellValue) < Number(rule.value1)
                break
            case "between":
                matches =
                    !isNaN(Number(cellValue)) &&
                    !isNaN(Number(rule.value1)) &&
                    !isNaN(Number(rule.value2)) &&
                    Number(cellValue) >= Number(rule.value1) &&
                    Number(cellValue) <= Number(rule.value2)
                break
            case "empty":
                matches = cellValue === "" || cellValue === null || cellValue === undefined
                break
            case "notEmpty":
                matches = cellValue !== "" && cellValue !== null && cellValue !== undefined
                break
        }

        if (matches) {
            return {
                backgroundColor: rule.backgroundColor,
                textColor: rule.textColor,
            }
        }
    }

    return {}
}

// Export data to different formats
function exportData(data: any[], format: "csv" | "json" | "excel", filename: string, headers: string[]) {
    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
        case "csv":
            // Create CSV content
            content = [
                headers.join(","),
                ...data.map((row) =>
                    headers
                        .map((header) => {
                            const value = row[header]
                            // Handle values with commas by wrapping in quotes
                            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
                        })
                        .join(","),
                ),
            ].join("\n")
            mimeType = "text/csv"
            extension = "csv"
            break

        case "json":
            // Create JSON content
            content = JSON.stringify(data, null, 2)
            mimeType = "application/json"
            extension = "json"
            break

        case "excel":
            // Create Excel-compatible CSV
            content = [
                headers.join(","),
                ...data.map((row) =>
                    headers
                        .map((header) => {
                            const value = row[header]
                            // Handle values with commas by wrapping in quotes
                            return typeof value === "string" && value.includes(",") ? `"${value}"` : value
                        })
                        .join(","),
                ),
            ].join("\n")
            mimeType = "application/vnd.ms-excel"
            extension = "csv"
            break
    }

    // Create a blob and download link
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export function DynamicTable({ headers, data }: CsvTableProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnOrder, setColumnOrder] = useState<string[]>([])
    const [columnResizeMode] = useState<"onChange" | "onEnd">("onChange")
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    })
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const [activeFilters, setActiveFilters] = useState<{ column: string; values: string[] }[]>([])
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [conditionalFormatRules, setConditionalFormatRules] = useState<ConditionalFormatRule[]>([])
    const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false)

    // Debounce search term to prevent excessive filtering
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, 300)

        return () => {
            clearTimeout(handler)
        }
    }, [searchTerm])

    // Create data for TanStack Table
    const tableData = useMemo(() => {
        if (!data || !headers || headers.length === 0) return []

        return data.map((row) => {
            const rowData: Record<string, any> = {}
            headers.forEach((header, index) => {
                rowData[header] = row[index]
            })
            return rowData
        })
    }, [data, headers])

    // Create columns for TanStack Table
    const columns = useMemo<ColumnDef<Record<string, any>>[]>(() => {
        if (!headers || headers.length === 0) return []

        const selectionColumn: ColumnDef<Record<string, any>> = {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
            size: 40,
        }

        const actionColumn: ColumnDef<Record<string, any>> = {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => alert(`View details for row ${row.index + 1}`)} className="cursor-pointer">
                            <FileEdit className="mr-2 h-4 w-4" />
                            View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(row.original, null, 2))
                                alert("Row data copied to clipboard")
                            }}
                            className="cursor-pointer"
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Row Data
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => alert(`Delete row ${row.index + 1}`)}
                            className="cursor-pointer text-destructive"
                        >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 50,
        }

        const dataColumns = headers.map((header) => ({
            id: header,
            accessorKey: header,
            header: () => <div className="whitespace-nowrap">{header}</div>,
            size: 150, // Default column width
            enableResizing: true,
            filterFn: (row, id, filterValues) => {
                if (!filterValues || filterValues.length === 0) return true
                const value = String(row.getValue(id))
                return filterValues.includes(value)
            },
            cell: ({ row, column, getValue }) => {
                const value = getValue()
                const formatting = applyCellFormatting(value, column.id, conditionalFormatRules)

                return (
                    <div
                        style={{
                            backgroundColor: formatting.backgroundColor,
                            color: formatting.textColor,
                            height: "100%",
                            width: "100%",
                            padding: formatting.backgroundColor ? "0.5rem" : undefined,
                            borderRadius: formatting.backgroundColor ? "0.25rem" : undefined,
                        }}
                    >
                        {value}
                    </div>
                )
            },
        }))

        return [selectionColumn, ...dataColumns, actionColumn]
    }, [headers, conditionalFormatRules])

    // Initialize column order if not set
    useEffect(() => {
        if (columnOrder.length === 0 && headers && headers.length > 0) {
            setColumnOrder(["select", ...headers, "actions"])
        }
    }, [headers, columnOrder])

    // Update active filters when column filters change
    useEffect(() => {
        if (!columnFilters) return

        const newActiveFilters = columnFilters.map((filter) => ({
            column: filter.id as string,
            values: filter.value as string[],
        }))
        setActiveFilters(newActiveFilters)
    }, [columnFilters])

    // Set up sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor),
    )

    // Handle drag end event
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = columnOrder.indexOf(active.id as string)
            const newIndex = columnOrder.indexOf(over.id as string)

            const newColumnOrder = [...columnOrder]
            newColumnOrder.splice(oldIndex, 1)
            newColumnOrder.splice(newIndex, 0, active.id as string)

            setColumnOrder(newColumnOrder)
        }
    }

    // Clear a specific filter
    const clearFilter = (column: string) => {
        setColumnFilters((prev) => prev.filter((filter) => filter.id !== column))
    }

    // Handle export
    const handleExport = (format: "csv" | "json" | "excel") => {
        // Get the data to export (filtered and sorted)
        const exportRows = table.getFilteredRowModel().rows.map((row) => row.original)

        // Get visible columns (excluding select and actions)
        const visibleColumns = table
            .getAllColumns()
            .filter((col) => col.getIsVisible() && col.id !== "select" && col.id !== "actions")
            .map((col) => col.id)

        // Export the data
        exportData(exportRows, format, `csv-data-export-${new Date().toISOString().split("T")[0]}`, visibleColumns)
    }

    // Initialize TanStack Table
    const table = useReactTable({
        data: tableData,
        columns,
        state: {
            sorting,
            globalFilter: debouncedSearchTerm,
            columnOrder,
            pagination,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        columnResizeMode,
        onSortingChange: setSorting,
        onGlobalFilterChange: setDebouncedSearchTerm,
        onColumnOrderChange: setColumnOrder,
        onPaginationChange: setPagination,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        enableColumnResizing: true,
        enableRowSelection: true,
        // Use memoization to prevent recalculation
        meta: {
            filterUniqueValues: useCallback((rows: any[], columnId: string) => {
                const uniqueValues = new Set<string>()
                rows.forEach((row) => {
                    const value = row.getValue(columnId)
                    if (value !== null && value !== undefined) {
                        uniqueValues.add(String(value))
                    }
                })
                return Array.from(uniqueValues).sort()
            }, []),
        },
    })

    // Get rows for current page
    const { rows } = table.getRowModel()

    // Set up virtualization for table rows
    const tableContainerRef = React.useRef<HTMLDivElement>(null)

    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 35, // approximate row height
        overscan: 10,
    })

    // Safely get virtual items
    const virtualItems = rowVirtualizer.getVirtualItems() || []
    const hasVirtualItems = virtualItems.length > 0

    // Get selected rows count
    const selectedRowsCount = Object.keys(rowSelection).length

    return (
        // <ErrorBoundary>
        <div className="space-y-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search data..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FileDown className="h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleExport("csv")} className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("json")} className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport("excel")} className="cursor-pointer">
                                <Download className="mr-2 h-4 w-4" />
                                Export for Excel
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* <Button variant="outline" className="gap-2" onClick={() => setIsFormatDialogOpen(true)}>
                        <Paintbrush className="h-4 w-4" />
                        Format
                    </Button> */}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Eye className="h-4 w-4" />
                                Columns
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <div className="p-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">Toggle Columns</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 px-2 text-xs"
                                        onClick={() => table.toggleAllColumnsVisible(true)}
                                    >
                                        Show All
                                    </Button>
                                </div>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-80">
                                    <div className="p-2">
                                        {table
                                            .getAllColumns()
                                            .filter((column) => column.getCanHide())
                                            .map((column) => {
                                                return (
                                                    <DropdownMenuCheckboxItem
                                                        key={column.id}
                                                        className="capitalize"
                                                        checked={column.getIsVisible()}
                                                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                                    >
                                                        {column.id}
                                                    </DropdownMenuCheckboxItem>
                                                )
                                            })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {selectedRowsCount > 0 && (
                <div className="bg-muted/50 p-2 rounded-md flex items-center justify-between">
                    <div className="text-sm">
                        {selectedRowsCount} {selectedRowsCount === 1 ? "row" : "rows"} selected
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const selectedRows = table
                                    .getFilteredRowModel()
                                    .rows.filter((row) => row.getIsSelected())
                                    .map((row) => row.original)

                                const visibleColumns = table
                                    .getAllColumns()
                                    .filter((col) => col.getIsVisible() && col.id !== "select" && col.id !== "actions")
                                    .map((col) => col.id)

                                exportData(
                                    selectedRows,
                                    "csv",
                                    `selected-rows-${new Date().toISOString().split("T")[0]}`,
                                    visibleColumns,
                                )
                            }}
                        >
                            Export Selected
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setRowSelection({})}>
                            Clear Selection
                        </Button>
                    </div>
                </div>
            )}

            {activeFilters && activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium">Active Filters:</span>
                    {activeFilters.map((filter) => (
                        <Badge key={filter.column} variant="secondary" className="flex items-center gap-1">
                            {filter.column}: {filter.values.length > 1 ? `(${filter.values.length} selected)` : filter.values[0]}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearFilter(filter.column)}
                                className="h-4 w-4 p-0 ml-1"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setColumnFilters([])} className="h-7 px-2 text-xs">
                        Clear All
                    </Button>
                </div>
            )}

            <div
                className="w-full rounded-md border"
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToHorizontalAxis]}
                >
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <div ref={tableContainerRef} className="overflow-auto max-h-[300px]">
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => (
                                                <DraggableColumnHeader key={header.id} header={header} id={header.column.id} table={table} />
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {rows.length > 0 ? (
                                        <>
                                            {/* Add padding to top based on virtual items */}
                                            {hasVirtualItems && <tr style={{ height: `${virtualItems[0]?.start || 0}px` }} />}

                                            {/* Render only the visible items */}
                                            {hasVirtualItems &&
                                                virtualItems.map((virtualRow) => {
                                                    const row = rows[virtualRow.index]
                                                    if (!row) return null

                                                    return (
                                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                                            {row.getVisibleCells().map((cell) => (
                                                                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    )
                                                })}

                                            {/* Add padding to bottom based on virtual items */}
                                            {hasVirtualItems && (
                                                <tr
                                                    style={{
                                                        height: `${rowVirtualizer.getTotalSize() - (virtualItems[virtualItems.length - 1]?.end || 0)
                                                            }px`,
                                                    }}
                                                />
                                            )}
                                        </>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={columns.length || 1} className="h-24 text-center">
                                                No results.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </SortableContext>
                </DndContext>

                <div className="flex items-center justify-between p-4 border-t">
                    <div className="flex-1 text-sm text-muted-foreground">
                        Showing{" "}
                        {table.getFilteredRowModel().rows.length > 0
                            ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-${Math.min(
                                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                                table.getFilteredRowModel().rows.length,
                            )}`
                            : 0}{" "}
                        of {table.getFilteredRowModel().rows.length} entries
                    </div>
                    <div className="flex items-center space-x-6 lg:space-x-8">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium">Rows per page</p>
                            <Select
                                value={`${table.getState().pagination.pageSize}`}
                                onValueChange={(value) => {
                                    table.setPageSize(Number(value))
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                                </SelectTrigger>
                                <SelectContent side="top">
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <SelectItem key={pageSize} value={`${pageSize}`}>
                                            {pageSize}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(0)}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to first page</span>
                                <HiOutlineBackward className="h-4 w-4" />

                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                            >
                                <span className="sr-only">Go to previous page</span>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to next page</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="hidden h-8 w-8 p-0 lg:flex"
                                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                disabled={!table.getCanNextPage()}
                            >
                                <span className="sr-only">Go to last page</span>
                                <HiOutlineFastForward className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* <ConditionalFormatDialog
                    open={isFormatDialogOpen}
                    onOpenChange={setIsFormatDialogOpen}
                    columns={headers || []}
                    rules={conditionalFormatRules}
                    onSaveRules={setConditionalFormatRules}
                /> */}
        </div>
        // </ErrorBoundary>
    )
}
