"use client"

import React from "react"
import { useState, useMemo, useEffect, useCallback } from "react"
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
    type PaginationState,
    type ColumnFiltersState,
    type VisibilityState,
    type RowSelectionState,
} from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Search,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    Filter,
    X,
    Eye,
    Download,
    FileDown,
    Paintbrush,
    Copy,
    Trash,
    FileEdit,
    Type,
    Hash,
    Calendar,
    Link2,
    Mail,
    Check,
    HelpCircle,
    ImageIcon,
    Music,
    Video,
    Calculator,
    Palette,
    BarChart3,
    PieChart,
    LineChart,
    Save,
    AreaChart,
    Radar,
} from "lucide-react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "./color-picker"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import dynamic from "next/dynamic"
import { useIsMobile } from "@/hooks/use-mobile"

// Import the StatisticsDialog component from the new file
// import { StatisticsDialog } from "./csv-statistics"

// Dynamically import ApexCharts with no SSR to avoid hydration issues
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

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

// Conditional formatting rule interface
export interface ConditionalFormatRule {
    id: string
    column: string
    operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between" | "empty" | "notEmpty"
    value1: string
    value2?: string
    backgroundColor: string
    textColor: string
}

// Statistics interface
interface ColumnStatistics {
    count: number
    empty: number
    unique: number
    min?: number | string | null
    max?: number | string | null
    sum?: number | null
    average?: number | null
    median?: number | null
}

// Chart customization options interface
interface ChartCustomizationOptions {
    chartType: "bar" | "line" | "pie" | "area" | "radar" | "donut"
    aggregationMethod: "sum" | "average" | "count" | "min" | "max"
    showLegend: boolean
    showDataLabels: boolean
    enableAnimation: boolean
    stackSeries: boolean
    chartHeight: number
    colors: string[]
    title: string
    xAxisTitle: string
    yAxisTitle: string
    theme: "light" | "dark"
}

// Conditional Format Dialog Component
interface ConditionalFormatDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    columns: string[]
    rules: ConditionalFormatRule[]
    onSaveRules: (rules: ConditionalFormatRule[]) => void
    tableData: Record<string, any>[]
    selectedRow?: Record<string, any> | null
}

function ConditionalFormatDialog({
    open,
    onOpenChange,
    columns,
    rules,
    onSaveRules,
    tableData,
    selectedRow,
}: ConditionalFormatDialogProps) {
    const [localRules, setLocalRules] = useState<ConditionalFormatRule[]>(rules)
    const [useSelectedRow, setUseSelectedRow] = useState<boolean>(false)

    useEffect(() => {
        setLocalRules(rules)
    }, [rules])

    useEffect(() => {
        setUseSelectedRow(false)
    }, [open])

    const handleAddRule = () => {
        const newRule: ConditionalFormatRule = {
            id: Date.now().toString(),
            column: columns[0] || "",
            operator: "equals",
            value1: "",
            backgroundColor: "#ffeb3b",
            textColor: "#000000",
        }
        setLocalRules([...localRules, newRule])
    }

    const handleAddRuleFromRow = () => {
        if (!selectedRow) return

        // Create a rule for each cell in the selected row
        const newRules = columns
            .map((column) => {
                const value = selectedRow[column]
                if (value === null || value === undefined || value === "") return null

                return {
                    id: `${Date.now()}-${column}`,
                    column,
                    operator: "equals" as const,
                    value1: String(value),
                    backgroundColor: "#e6f7ff", // Light blue background
                    textColor: "#0066cc", // Dark blue text
                }
            })
            .filter(Boolean) as ConditionalFormatRule[]

        setLocalRules([...localRules, ...newRules])
        setUseSelectedRow(false)
    }

    const handleRemoveRule = (id: string) => {
        setLocalRules(localRules.filter((rule) => rule.id !== id))
    }

    const handleRuleChange = (id: string, field: keyof ConditionalFormatRule, value: any) => {
        setLocalRules(
            localRules.map((rule) => {
                if (rule.id === id) {
                    return { ...rule, [field]: value }
                }
                return rule
            }),
        )
    }

    const handleSave = () => {
        onSaveRules(localRules)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Conditional Formatting</DialogTitle>
                    <DialogDescription>Create rules to format cells based on their values.</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {selectedRow && (
                        <div className="mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Checkbox
                                    id="use-selected-row"
                                    checked={useSelectedRow}
                                    onCheckedChange={(checked) => setUseSelectedRow(!!checked)}
                                />
                                <Label htmlFor="use-selected-row">Use selected row as template for rules</Label>
                            </div>
                            {useSelectedRow && (
                                <div className="mt-2">
                                    <Button variant="outline" onClick={handleAddRuleFromRow} className="w-full">
                                        Create Rules from Selected Row
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {localRules.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">No rules yet. Add a rule to get started.</div>
                    ) : (
                        localRules.map((rule) => (
                            <div key={rule.id} className="grid gap-4 border p-4 rounded-md relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-2 right-2 h-6 w-6 p-0"
                                    onClick={() => handleRemoveRule(rule.id)}
                                >
                                    ×
                                </Button>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Column</Label>
                                        <Select value={rule.column} onValueChange={(value) => handleRuleChange(rule.id, "column", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select column" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {columns.map((column) => (
                                                    <SelectItem key={column} value={column}>
                                                        {column}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Condition</Label>
                                        <Select
                                            value={rule.operator}
                                            onValueChange={(value) =>
                                                handleRuleChange(rule.id, "operator", value as ConditionalFormatRule["operator"])
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select condition" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="equals">Equals</SelectItem>
                                                <SelectItem value="contains">Contains</SelectItem>
                                                <SelectItem value="greaterThan">Greater than</SelectItem>
                                                <SelectItem value="lessThan">Less than</SelectItem>
                                                <SelectItem value="between">Between</SelectItem>
                                                <SelectItem value="empty">Is empty</SelectItem>
                                                <SelectItem value="notEmpty">Is not empty</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {rule.operator !== "empty" && rule.operator !== "notEmpty" && (
                                    <div className={rule.operator === "between" ? "grid grid-cols-2 gap-4" : ""}>
                                        <div className="space-y-2">
                                            <Label>{rule.operator === "between" ? "Minimum value" : "Value"}</Label>
                                            <Input
                                                value={rule.value1}
                                                onChange={(e) => handleRuleChange(rule.id, "value1", e.target.value)}
                                                placeholder={rule.operator === "between" ? "Min value" : "Value"}
                                            />
                                        </div>

                                        {rule.operator === "between" && (
                                            <div className="space-y-2">
                                                <Label>Maximum value</Label>
                                                <Input
                                                    value={rule.value2 || ""}
                                                    onChange={(e) => handleRuleChange(rule.id, "value2", e.target.value)}
                                                    placeholder="Max value"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <ColorPicker
                                            color={rule.backgroundColor}
                                            onChange={(color) => handleRuleChange(rule.id, "backgroundColor", color)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Text Color</Label>
                                        <ColorPicker
                                            color={rule.textColor}
                                            onChange={(color) => handleRuleChange(rule.id, "textColor", color)}
                                        />
                                    </div>
                                </div>

                                <div className="mt-2">
                                    <div className="text-sm font-medium mb-1">Preview:</div>
                                    <div
                                        className="p-2 border rounded"
                                        style={{
                                            backgroundColor: rule.backgroundColor,
                                            color: rule.textColor,
                                        }}
                                    >
                                        Sample text
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    <Button variant="outline" onClick={handleAddRule} className="w-full">
                        Add Rule
                    </Button>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Rules</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// Statistics Panel Component
function StatisticsPanel({
    tableData,
    columns,
    filteredData,
}: {
    tableData: Record<string, any>[]
    columns: string[]
    filteredData: Record<string, any>[]
}) {
    const [labelColumn, setLabelColumn] = useState<string>(columns[0] || "")
    const [valueColumns, setValueColumns] = useState<string[]>([columns.length > 1 ? columns[1] : columns[0] || ""])
    const [useFilteredData, setUseFilteredData] = useState<boolean>(false)
    const [activeTab, setActiveTab] = useState<"chart" | "statistics" | "customize">("chart")

    // Chart customization options
    const [chartOptions, setChartOptions] = useState<ChartCustomizationOptions>({
        chartType: "bar",
        aggregationMethod: "sum",
        showLegend: true,
        showDataLabels: false,
        enableAnimation: true,
        stackSeries: false,
        chartHeight: 350,
        colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#546E7A", "#26a69a", "#D10CE8"],
        title: "Data Visualization",
        xAxisTitle: "Categories",
        yAxisTitle: "Values",
        theme: "light",
    })

    // Custom color palette
    const [colorPalette, setColorPalette] = useState<string[]>(chartOptions.colors)
    const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null)
    const [newColor, setNewColor] = useState<string>("#000000")

    // Update columns when they change
    useEffect(() => {
        if (columns.length > 0 && !columns.includes(labelColumn)) {
            setLabelColumn(columns[0])
        }

        // Update value columns if they no longer exist in the columns array
        setValueColumns((prev) => {
            const validColumns = prev.filter((col) => columns.includes(col))
            if (validColumns.length === 0 && columns.length > 1) {
                return [columns[1]]
            }
            return validColumns.length > 0 ? validColumns : [columns[0] || ""]
        })
    }, [columns, labelColumn])

    const dataToUse = useFilteredData ? filteredData : tableData

    // Function to handle adding/removing value columns
    const toggleValueColumn = (column: string) => {
        setValueColumns((prev) => {
            if (prev.includes(column)) {
                // Remove column if it's already selected
                return prev.filter((col) => col !== column)
            } else {
                // Add column if it's not selected
                return [...prev, column]
            }
        })
    }

    // Get statistics for a specific column
    const getColumnStatistics = useCallback(
        (columnName: string) => {
            if (!columnName || !dataToUse.length) return null

            const values = dataToUse.map((row) => row[columnName]).filter((val) => val !== undefined && val !== null)

            const numericValues = values
                .map((val) => (typeof val === "string" ? Number.parseFloat(val) : val))
                .filter((val) => !isNaN(val))

            // Sort numeric values for median calculation
            const sortedNumericValues = [...numericValues].sort((a, b) => a - b)

            const stats: ColumnStatistics = {
                count: values.length,
                empty: dataToUse.length - values.length,
                unique: new Set(values.map((val) => String(val))).size,
                min: null,
                max: null,
                sum: null,
                average: null,
                median: null,
            }

            if (numericValues.length > 0) {
                stats.min = Math.min(...numericValues)
                stats.max = Math.max(...numericValues)
                stats.sum = numericValues.reduce((sum, val) => sum + val, 0)
                stats.average = stats.sum / numericValues.length

                // Calculate median
                const mid = Math.floor(sortedNumericValues.length / 2)
                stats.median =
                    sortedNumericValues.length % 2 === 0
                        ? (sortedNumericValues[mid - 1] + sortedNumericValues[mid]) / 2
                        : sortedNumericValues[mid]
            } else if (values.length > 0) {
                // For non-numeric data, we can still find min/max as strings
                const sortedValues = [...values].sort()
                stats.min = sortedValues[0]
                stats.max = sortedValues[sortedValues.length - 1]
            }

            return stats
        },
        [dataToUse],
    )

    // Get chart data based on selected columns and aggregation method
    const chartData = useMemo(() => {
        if (!labelColumn || !valueColumns.length || !dataToUse.length) return null

        // Get unique labels from the label column
        const labels = Array.from(new Set(dataToUse.map((row) => String(row[labelColumn] || "N/A"))))

        // For each value column, calculate the values for each label based on aggregation method
        const series = valueColumns.map((valueColumn) => {
            // Group data by label
            const valuesByLabel: Record<string, number[]> = {}

            // Initialize with empty arrays
            labels.forEach((label) => {
                valuesByLabel[label] = []
            })

            // Populate with values
            dataToUse.forEach((row) => {
                const label = String(row[labelColumn] || "N/A")
                const value = row[valueColumn]

                if (value !== undefined && value !== null) {
                    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
                    if (!isNaN(numValue)) {
                        valuesByLabel[label].push(numValue)
                    }
                }
            })

            // Calculate aggregated values based on selected method
            const values = labels.map((label) => {
                const nums = valuesByLabel[label]
                if (nums.length === 0) return 0

                switch (chartOptions.aggregationMethod) {
                    case "sum":
                        return nums.reduce((sum, val) => sum + val, 0)
                    case "average":
                        return nums.reduce((sum, val) => sum + val, 0) / nums.length
                    case "count":
                        return nums.length
                    case "min":
                        return Math.min(...nums)
                    case "max":
                        return Math.max(...nums)
                    default:
                        return nums.reduce((sum, val) => sum + val, 0) // Default to sum
                }
            })

            return {
                name: valueColumn,
                data: values,
            }
        })

        return { labels, series }
    }, [labelColumn, valueColumns, dataToUse, chartOptions.aggregationMethod])

    // Generate ApexCharts options based on chart type and customization
    const getApexOptions = useMemo(() => {
        if (!chartData) return {}

        const { labels, series } = chartData

        // Base options that apply to all chart types
        const baseOptions = {
            chart: {
                height: chartOptions.chartHeight,
                type: chartOptions.chartType,
                stacked: chartOptions.stackSeries,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: true,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
                animations: {
                    enabled: chartOptions.enableAnimation,
                },
                theme: {
                    mode: chartOptions.theme,
                },
            },
            colors: colorPalette,
            title: {
                text: chartOptions.title,
                align: "center",
                style: {
                    fontSize: "16px",
                    fontWeight: "bold",
                },
            },
            xaxis: {
                categories: labels,
                title: {
                    text: chartOptions.xAxisTitle,
                },
            },
            yaxis: {
                title: {
                    text: chartOptions.yAxisTitle,
                },
            },
            legend: {
                show: chartOptions.showLegend,
                position: "bottom",
            },
            dataLabels: {
                enabled: chartOptions.showDataLabels,
            },
            tooltip: {
                enabled: true,
                shared: true,
                intersect: false,
            },
            responsive: [
                {
                    breakpoint: 480,
                    options: {
                        chart: {
                            height: 300,
                        },
                        legend: {
                            position: "bottom",
                        },
                    },
                },
            ],
        }

        // Chart-specific options
        if (chartOptions.chartType === "pie" || chartOptions.chartType === "donut") {
            return {
                ...baseOptions,
                chart: {
                    ...baseOptions.chart,
                    type: chartOptions.chartType,
                },
                labels: labels,
                series: series.length > 0 ? series[0].data : [],
                legend: {
                    ...baseOptions.legend,
                    position: "right",
                },
            }
        } else if (chartOptions.chartType === "radar") {
            return {
                ...baseOptions,
                chart: {
                    ...baseOptions.chart,
                    type: "radar",
                    toolbar: {
                        show: false,
                    },
                },
                xaxis: {
                    categories: labels,
                },
                yaxis: {
                    show: false,
                },
            }
        }

        // Return default options for bar, line, area
        return baseOptions
    }, [chartData, chartOptions, colorPalette])

    // Handle color palette changes
    const handleColorChange = (index: number, color: string) => {
        const newColors = [...colorPalette]
        newColors[index] = color
        setColorPalette(newColors)
    }

    const addNewColor = () => {
        if (newColor) {
            setColorPalette([...colorPalette, newColor])
            setNewColor("#000000")
        }
    }

    const removeColor = (index: number) => {
        if (colorPalette.length > 1) {
            const newColors = [...colorPalette]
            newColors.splice(index, 1)
            setColorPalette(newColors)
        }
    }

    // Save chart options
    const saveChartOptions = () => {
        setChartOptions({
            ...chartOptions,
            colors: colorPalette,
        })
        setActiveTab("chart")
    }

    // Reset chart options to defaults
    const resetChartOptions = () => {
        setChartOptions({
            chartType: "bar",
            aggregationMethod: "sum",
            showLegend: true,
            showDataLabels: false,
            enableAnimation: true,
            stackSeries: false,
            chartHeight: 350,
            colors: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#546E7A", "#26a69a", "#D10CE8"],
            title: "Data Visualization",
            xAxisTitle: "Categories",
            yAxisTitle: "Values",
            theme: "light",
        })
        setColorPalette(["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0", "#546E7A", "#26a69a", "#D10CE8"])
    }

    // Plus icon component
    function Plus({ className }: { className?: string }) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className}
            >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
            </svg>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-none p-4 border-b">
                <h3 className="text-lg font-medium">Data Statistics & Visualization</h3>
                <p className="text-sm text-muted-foreground">Analyze and visualize your data with customizable charts.</p>
            </div>

            <div className="flex-grow overflow-auto">
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
                    <TabsList className="sticky top-0 z-10 bg-background w-full grid grid-cols-3 mb-4">
                        <TabsTrigger value="chart">Chart</TabsTrigger>
                        <TabsTrigger value="statistics">Statistics</TabsTrigger>
                        <TabsTrigger value="customize">Customize</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chart" className="space-y-4 p-4">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="use-filtered-data"
                                    checked={useFilteredData}
                                    onCheckedChange={(checked) => setUseFilteredData(!!checked)}
                                />
                                <Label htmlFor="use-filtered-data">Use filtered data only</Label>
                                <Badge variant="outline" className="ml-2">
                                    {useFilteredData ? filteredData.length : tableData.length} rows
                                </Badge>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Label Column (X-axis)</Label>
                                <Select value={labelColumn} onValueChange={setLabelColumn}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select label column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns.map((column) => (
                                            <SelectItem key={column} value={column}>
                                                {column}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Select Value Columns (Y-axis/Series)</Label>
                                <ScrollArea className="h-32 border rounded-md p-2">
                                    {columns.map((column) => (
                                        <div key={column} className="flex items-center space-x-2 py-1">
                                            <Checkbox
                                                id={`value-column-${column}`}
                                                checked={valueColumns.includes(column)}
                                                onCheckedChange={() => toggleValueColumn(column)}
                                                disabled={column === labelColumn}
                                            />
                                            <Label
                                                htmlFor={`value-column-${column}`}
                                                className={`text-sm cursor-pointer flex-1 truncate ${column === labelColumn ? "text-muted-foreground" : ""
                                                    }`}
                                            >
                                                {column}
                                            </Label>
                                        </div>
                                    ))}
                                </ScrollArea>
                                {valueColumns.length === 0 && (
                                    <p className="text-xs text-destructive">Please select at least one value column</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Chart Type</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={chartOptions.chartType === "bar" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "bar" })}
                                        className="flex items-center justify-center"
                                    >
                                        <BarChart3 className="h-4 w-4 mr-2" />
                                        Bar
                                    </Button>
                                    <Button
                                        variant={chartOptions.chartType === "line" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "line" })}
                                        className="flex items-center justify-center"
                                    >
                                        <LineChart className="h-4 w-4 mr-2" />
                                        Line
                                    </Button>
                                    <Button
                                        variant={chartOptions.chartType === "area" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "area" })}
                                        className="flex items-center justify-center"
                                    >
                                        <AreaChart className="h-4 w-4 mr-2" />
                                        Area
                                    </Button>
                                    <Button
                                        variant={chartOptions.chartType === "pie" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "pie" })}
                                        className="flex items-center justify-center"
                                        disabled={valueColumns.length > 1}
                                        title={valueColumns.length > 1 ? "Pie chart only supports one value column" : ""}
                                    >
                                        <PieChart className="h-4 w-4 mr-2" />
                                        Pie
                                    </Button>
                                    <Button
                                        variant={chartOptions.chartType === "donut" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "donut" })}
                                        className="flex items-center justify-center"
                                        disabled={valueColumns.length > 1}
                                        title={valueColumns.length > 1 ? "Donut chart only supports one value column" : ""}
                                    >
                                        <PieChart className="h-4 w-4 mr-2" />
                                        Donut
                                    </Button>
                                    <Button
                                        variant={chartOptions.chartType === "radar" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setChartOptions({ ...chartOptions, chartType: "radar" })}
                                        className="flex items-center justify-center"
                                    >
                                        <Radar className="h-4 w-4 mr-2" />
                                        Radar
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Aggregation Method</Label>
                                <Select
                                    value={chartOptions.aggregationMethod}
                                    onValueChange={(value) =>
                                        setChartOptions({
                                            ...chartOptions,
                                            aggregationMethod: value as "sum" | "average" | "count" | "min" | "max",
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select aggregation method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sum">Sum</SelectItem>
                                        <SelectItem value="average">Average</SelectItem>
                                        <SelectItem value="count">Count</SelectItem>
                                        <SelectItem value="min">Minimum</SelectItem>
                                        <SelectItem value="max">Maximum</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {chartData ? (
                                <div className="border rounded-lg p-4 bg-card">
                                    {chartOptions.chartType === "pie" || chartOptions.chartType === "donut" ? (
                                        <div className="w-full" style={{ height: `${chartOptions.chartHeight}px` }}>
                                            {typeof window !== "undefined" && (
                                                <ReactApexChart
                                                    options={getApexOptions as any}
                                                    series={chartData.series.length > 0 ? chartData.series[0].data : []}
                                                    type={chartOptions.chartType}
                                                    height={chartOptions.chartHeight}
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="w-full" style={{ height: `${chartOptions.chartHeight}px` }}>
                                            {typeof window !== "undefined" && (
                                                <ReactApexChart
                                                    options={getApexOptions as any}
                                                    series={chartData.series}
                                                    type={chartOptions.chartType}
                                                    height={chartOptions.chartHeight}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-[350px] border rounded-lg bg-muted/20">
                                    <div className="text-center text-muted-foreground">
                                        <p>Select columns to visualize data</p>
                                        <p className="text-sm mt-2">Choose a label column and at least one value column</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="statistics" className="space-y-4 p-4">
                        {valueColumns.length > 0 ? (
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue={valueColumns[0]}>
                                        <TabsList className="mb-2 flex-wrap h-auto">
                                            {valueColumns.map((column) => (
                                                <TabsTrigger key={column} value={column} className="text-xs">
                                                    {column}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        {valueColumns.map((column) => {
                                            const stats = getColumnStatistics(column)
                                            return (
                                                <TabsContent key={column} value={column} className="space-y-2">
                                                    {stats ? (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="text-sm">
                                                                <span className="font-medium">Count:</span> {stats.count}
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">Empty:</span> {stats.empty}
                                                            </div>
                                                            <div className="text-sm">
                                                                <span className="font-medium">Unique Values:</span> {stats.unique}
                                                            </div>
                                                            {stats.min !== null && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Min:</span> {String(stats.min)}
                                                                </div>
                                                            )}
                                                            {stats.max !== null && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Max:</span> {String(stats.max)}
                                                                </div>
                                                            )}
                                                            {stats.sum !== null && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Sum:</span> {stats.sum.toFixed(2)}
                                                                </div>
                                                            )}
                                                            {stats.average !== null && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Average:</span> {stats.average.toFixed(2)}
                                                                </div>
                                                            )}
                                                            {stats.median !== null && (
                                                                <div className="text-sm">
                                                                    <span className="font-medium">Median:</span> {stats.median.toFixed(2)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-muted-foreground">No statistics available</div>
                                                    )}
                                                </TabsContent>
                                            )
                                        })}
                                    </Tabs>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                Select at least one value column to view statistics
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="customize" className="space-y-6 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Chart Settings</h3>

                                <div className="space-y-2">
                                    <Label htmlFor="chart-title">Chart Title</Label>
                                    <Input
                                        id="chart-title"
                                        value={chartOptions.title}
                                        onChange={(e) => setChartOptions({ ...chartOptions, title: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="x-axis-title">X-Axis Title</Label>
                                    <Input
                                        id="x-axis-title"
                                        value={chartOptions.xAxisTitle}
                                        onChange={(e) => setChartOptions({ ...chartOptions, xAxisTitle: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="y-axis-title">Y-Axis Title</Label>
                                    <Input
                                        id="y-axis-title"
                                        value={chartOptions.yAxisTitle}
                                        onChange={(e) => setChartOptions({ ...chartOptions, yAxisTitle: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chart-height">Chart Height</Label>
                                    <div className="flex items-center space-x-2">
                                        <Slider
                                            id="chart-height"
                                            min={200}
                                            max={600}
                                            step={10}
                                            value={[chartOptions.chartHeight]}
                                            onValueChange={(value) => setChartOptions({ ...chartOptions, chartHeight: value[0] })}
                                            className="flex-1"
                                        />
                                        <span className="w-12 text-right">{chartOptions.chartHeight}px</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Theme</Label>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant={chartOptions.theme === "light" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setChartOptions({ ...chartOptions, theme: "light" })}
                                            className="flex-1"
                                        >
                                            Light
                                        </Button>
                                        <Button
                                            variant={chartOptions.theme === "dark" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setChartOptions({ ...chartOptions, theme: "dark" })}
                                            className="flex-1"
                                        >
                                            Dark
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="show-legend"
                                            checked={chartOptions.showLegend}
                                            onCheckedChange={(checked) => setChartOptions({ ...chartOptions, showLegend: !!checked })}
                                        />
                                        <Label htmlFor="show-legend">Show Legend</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="show-data-labels"
                                            checked={chartOptions.showDataLabels}
                                            onCheckedChange={(checked) => setChartOptions({ ...chartOptions, showDataLabels: !!checked })}
                                        />
                                        <Label htmlFor="show-data-labels">Show Data Labels</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="enable-animation"
                                            checked={chartOptions.enableAnimation}
                                            onCheckedChange={(checked) => setChartOptions({ ...chartOptions, enableAnimation: !!checked })}
                                        />
                                        <Label htmlFor="enable-animation">Enable Animation</Label>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="stack-series"
                                            checked={chartOptions.stackSeries}
                                            onCheckedChange={(checked) => setChartOptions({ ...chartOptions, stackSeries: !!checked })}
                                            disabled={
                                                chartOptions.chartType === "pie" ||
                                                chartOptions.chartType === "donut" ||
                                                chartOptions.chartType === "radar"
                                            }
                                        />
                                        <Label
                                            htmlFor="stack-series"
                                            className={
                                                chartOptions.chartType === "pie" ||
                                                    chartOptions.chartType === "donut" ||
                                                    chartOptions.chartType === "radar"
                                                    ? "text-muted-foreground"
                                                    : ""
                                            }
                                        >
                                            Stack Series
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Color Palette</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-4 gap-2">
                                        {colorPalette.map((color, index) => (
                                            <div key={index} className="space-y-1">
                                                <div
                                                    className="h-8 rounded cursor-pointer border flex items-center justify-center"
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setEditingColorIndex(index)}
                                                >
                                                    {editingColorIndex === index && (
                                                        <div className="bg-background p-1 rounded">
                                                            <X
                                                                className="h-4 w-4"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    removeColor(index)
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                                {editingColorIndex === index && (
                                                    <div className="mt-1">
                                                        <ColorPicker color={color} onChange={(newColor) => handleColorChange(index, newColor)} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {colorPalette.length < 12 && (
                                            <div className="space-y-1">
                                                <div
                                                    className="h-8 rounded cursor-pointer border border-dashed flex items-center justify-center"
                                                    onClick={addNewColor}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </div>
                                                <ColorPicker color={newColor} onChange={setNewColor} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="outline" onClick={resetChartOptions}>
                                Reset to Defaults
                            </Button>
                            <Button onClick={saveChartOptions}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

// Color Filter Component
interface ColorFilterProps {
    rules: ConditionalFormatRule[]
    onFilterByColor: (color: string | null) => void
    activeColorFilter: string | null
}

function ColorFilter({ rules, onFilterByColor, activeColorFilter }: ColorFilterProps) {
    // Extract unique colors from rules
    const uniqueColors = useMemo(() => {
        const colors = new Set<string>()
        rules.forEach((rule) => {
            colors.add(rule.backgroundColor)
        })
        return Array.from(colors)
    }, [rules])

    if (uniqueColors.length === 0) {
        return null
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Palette className="h-4 w-4" />
                    Filter by Color
                    {activeColorFilter && (
                        <div className="w-3 h-3 rounded-full ml-1" style={{ backgroundColor: activeColorFilter }}></div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
                <div className="space-y-2">
                    <div className="font-medium text-sm">Filter by formatting color</div>
                    <Separator />
                    <div className="flex flex-wrap gap-2 pt-2">
                        {uniqueColors.map((color) => (
                            <TooltipProvider key={color}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <button
                                            className={`w-6 h-6 rounded-md border ${activeColorFilter === color ? "ring-2 ring-primary" : ""
                                                }`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => onFilterByColor(activeColorFilter === color ? null : color)}
                                            aria-label={`Filter by color ${color}`}
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{color}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ))}
                    </div>
                    {activeColorFilter && (
                        <Button variant="ghost" size="sm" onClick={() => onFilterByColor(null)} className="w-full mt-2 text-xs">
                            Clear Color Filter
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
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

// Media renderer component
function MediaRenderer({ url }: { url: string }) {
    const [error, setError] = useState(false)

    // Check if the URL is valid
    if (!url || typeof url !== "string") {
        return <span>Invalid URL</span>
    }

    // Normalize URL to lowercase for extension checking
    const lowerUrl = url.toLowerCase()

    // Image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]
    const isImage = imageExtensions.some((ext) => lowerUrl.endsWith(ext))

    // Audio extensions
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]
    const isAudio = audioExtensions.some((ext) => lowerUrl.endsWith(ext))

    // Video extensions
    const videoExtensions = [".mp4", ".webm", ".ogv", ".mov", ".avi", ".wmv", ".flv", ".mkv"]
    const isVideo = videoExtensions.some((ext) => lowerUrl.endsWith(ext))

    if (error) {
        return <span className="text-destructive text-xs">Media load error</span>
    }

    if (isImage) {
        return (
            <div className="w-16 h-16 flex items-center justify-center">
                <img
                    src={url || "/placeholder.svg"}
                    alt="Image"
                    className="max-w-full max-h-full object-contain rounded-sm"
                    onError={() => setError(true)}
                />
            </div>
        )
    }

    if (isAudio) {
        return (
            <audio controls className="w-full h-8" onError={() => setError(true)}>
                <source src={url} />
                Your browser does not support the audio element.
            </audio>
        )
    }

    if (isVideo) {
        return (
            <video controls className="w-full h-16" onError={() => setError(true)}>
                <source src={url} />
                Your browser does not support the video element.
            </video>
        )
    }

    // If it's a URL but not a recognized media type, return a link
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
            {url}
        </a>
    )
}

// This function detects the data type of a column based on its values
function detectColumnDataType(
    data: any[],
    columnId: string,
): {
    type:
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "url"
    | "email"
    | "empty"
    | "mixed"
    | "image"
    | "audio"
    | "video"
    | "media"
    icon: React.ReactNode
    label: string
} {
    if (!data || data.length === 0) {
        return {
            type: "empty",
            icon: <HelpCircle className="h-3 w-3 text-muted-foreground" />,
            label: "Unknown",
        }
    }

    // Get all non-null values from the column
    const values = data.map((row) => row[columnId]).filter((val) => val !== null && val !== undefined && val !== "")

    if (values.length === 0) {
        return {
            type: "empty",
            icon: <HelpCircle className="h-3 w-3 text-muted-foreground" />,
            label: "Empty",
        }
    }

    // Check for media URLs
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"]
    const audioExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"]
    const videoExtensions = [".mp4", ".webm", ".ogv", ".mov", ".avi", ".wmv", ".flv", ".mkv"]

    // Check if all values are image URLs
    const allImages = values.every((val) => {
        const str = String(val).toLowerCase()
        return imageExtensions.some((ext) => str.endsWith(ext))
    })

    if (allImages) {
        return {
            type: "image",
            icon: <ImageIcon className="h-3 w-3 text-pink-500" />,
            label: "Image",
        }
    }

    // Check if all values are audio URLs
    const allAudio = values.every((val) => {
        const str = String(val).toLowerCase()
        return audioExtensions.some((ext) => str.endsWith(ext))
    })

    if (allAudio) {
        return {
            type: "audio",
            icon: <Music className="h-3 w-3 text-orange-500" />,
            label: "Audio",
        }
    }

    // Check if all values are video URLs
    const allVideos = values.every((val) => {
        const str = String(val).toLowerCase()
        return videoExtensions.some((ext) => str.endsWith(ext))
    })

    if (allVideos) {
        return {
            type: "video",
            icon: <Video className="h-3 w-3 text-red-500" />,
            label: "Video",
        }
    }

    // Check if most values are media (mixed types)
    const mediaCount = values.filter((val) => {
        const str = String(val).toLowerCase()
        return [...imageExtensions, ...audioExtensions, ...videoExtensions].some((ext) => str.endsWith(ext))
    }).length

    if (mediaCount > values.length * 0.5) {
        // If more than 50% are media
        return {
            type: "media",
            icon: <ImageIcon className="h-3 w-3 text-purple-500" />,
            label: "Mixed Media",
        }
    }

    // Check if all values are numbers
    const allNumbers = values.every((val) => !isNaN(Number(val)) && val !== "")
    if (allNumbers) {
        return {
            type: "number",
            icon: <Hash className="h-3 w-3 text-blue-500" />,
            label: "Number",
        }
    }

    // Check if all values are booleans
    const booleanValues = ["true", "false", "yes", "no", "0", "1"]
    const allBooleans = values.every((val) => booleanValues.includes(String(val).toLowerCase()))
    if (allBooleans) {
        return {
            type: "boolean",
            icon: <Check className="h-3 w-3 text-green-500" />,
            label: "Boolean",
        }
    }

    // Check if all values are valid dates
    const datePattern = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/
    const allDates = values.every((val) => !isNaN(Date.parse(String(val))) || datePattern.test(String(val)))
    if (allDates) {
        return {
            type: "date",
            icon: <Calendar className="h-3 w-3 text-amber-500" />,
            label: "Date",
        }
    }

    // Check if all values are URLs
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
    const allUrls = values.every((val) => urlPattern.test(String(val)))
    if (allUrls) {
        return {
            type: "url",
            icon: <Link2 className="h-3 w-3 text-indigo-500" />,
            label: "URL",
        }
    }

    // Check if all values are emails
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const allEmails = values.every((val) => emailPattern.test(String(val)))
    if (allEmails) {
        return {
            type: "email",
            icon: <Mail className="h-3 w-3 text-purple-500" />,
            label: "Email",
        }
    }

    // Default to string
    return {
        type: "string",
        icon: <Type className="h-3 w-3 text-gray-500" />,
        label: "Text",
    }
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

// Helper function to handle row actions
function handleRowAction(action: string, row: any) {
    switch (action) {
        case "view":
            alert(`View details for row ${row.index + 1}`)
            break
        case "edit":
            alert(`Edit row ${row.index + 1}`)
            break
        case "copy":
            navigator.clipboard.writeText(JSON.stringify(row.original, null, 2))
            alert("Row data copied to clipboard")
            break
        case "delete":
            if (confirm(`Are you sure you want to delete row ${row.index + 1}?`)) {
                alert(`Row ${row.index + 1} deleted`)
            }
            break
        default:
            alert(`Action ${action} on row ${row.index + 1}`)
    }
}

// Function to check if a value is a media URL
function isMediaUrl(value: any): boolean {
    if (!value || typeof value !== "string") return false

    const lowerUrl = value.toLowerCase()
    const mediaExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".mp3",
        ".wav",
        ".ogg",
        ".m4a",
        ".flac",
        ".aac",
        ".mp4",
        ".webm",
        ".ogv",
        ".mov",
        ".avi",
        ".wmv",
        ".flv",
        ".mkv",
    ]

    return mediaExtensions.some((ext) => lowerUrl.endsWith(ext))
}

// Plus icon component
function Plus({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    )
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
    const [showStats, setShowStats] = useState(false)
    const [activeColorFilter, setActiveColorFilter] = useState<string | null>(null)
    const [selectedRowForRule, setSelectedRowForRule] = useState<Record<string, any> | null>(null)
    const [defaultLayout, setDefaultLayout] = useState([65, 35])
    const [collapsedStats, setCollapsedStats] = useState(false)

    // Check if we're on mobile
    const isMobile = useIsMobile()

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

    // Handle color filtering
    const colorFilteredData = useMemo(() => {
        if (!activeColorFilter) return tableData

        return tableData.filter((row) => {
            // Check each cell in the row to see if any match the color filter
            for (const column of headers) {
                const value = row[column]
                const formatting = applyCellFormatting(value, column, conditionalFormatRules)
                if (formatting.backgroundColor === activeColorFilter) {
                    return true
                }
            }
            return false
        })
    }, [tableData, headers, conditionalFormatRules, activeColorFilter])

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
            size: 30, // Reduced size to fit checkbox
            maxSize: 30,
        }

        const leftActionColumn: ColumnDef<Record<string, any>> = {
            id: "leftActions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRowAction("view", row)}>
                        <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRowAction("edit", row)}>
                        <FileEdit className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 80,
            maxSize: 80,
        }

        const rightActionColumn: ColumnDef<Record<string, any>> = {
            id: "rightActions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRowAction("copy", row)}>
                        <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRowAction("delete", row)}
                    >
                        <Trash className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                            setSelectedRowForRule(row.original)
                            setIsFormatDialogOpen(true)
                        }}
                    >
                        <Paintbrush className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
            enableSorting: false,
            enableHiding: false,
            size: 120,
            maxSize: 120,
        }

        const dataColumns = headers.map((header) => {
            // Detect data type for this column
            const dataType = detectColumnDataType(tableData, header)

            return {
                id: header,
                accessorKey: header,
                header: () => (
                    <div className="whitespace-nowrap flex items-center gap-1">
                        <span>{header}</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="ml-1 cursor-help">{dataType.icon}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Data Type: {dataType.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ),
                size: 150, // Default column width
                minSize: 50, // Minimum column width
                maxSize: 500, // Maximum column width
                filterFn: (row, id, filterValues) => {
                    if (!filterValues || filterValues.length === 0) return true
                    const value = String(row.getValue(id))
                    return filterValues.includes(value)
                },
                cell: ({ row, column, getValue }) => {
                    const value = getValue()
                    const formatting = applyCellFormatting(value, column.id, conditionalFormatRules)

                    // Check if this is a media URL
                    if (isMediaUrl(value)) {
                        return (
                            <div
                                style={{
                                    backgroundColor: formatting.backgroundColor,
                                    color: formatting.textColor,
                                    padding: formatting.backgroundColor ? "0.5rem" : undefined,
                                    borderRadius: formatting.backgroundColor ? "0.25rem" : undefined,
                                }}
                            >
                                <MediaRenderer url={String(value)} />
                            </div>
                        )
                    }

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
            }
        })

        return [selectionColumn, leftActionColumn, ...dataColumns, rightActionColumn]
    }, [headers, conditionalFormatRules, tableData])

    // Initialize column order if not set
    useEffect(() => {
        if (columnOrder.length === 0 && headers && headers.length > 0) {
            setColumnOrder(["select", "leftActions", ...headers, "rightActions"])
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
            .filter(
                (col) =>
                    col.getIsVisible() &&
                    col.id !== "select" &&
                    col.id !== "actions" &&
                    col.id !== "leftActions" &&
                    col.id !== "rightActions",
            )
            .map((col) => col.id)

        // Export the data
        exportData(exportRows, format, `csv-data-export-${new Date().toISOString().split("T")[0]}`, visibleColumns)
    }

    // Handle color filtering
    const handleColorFilter = (color: string | null) => {
        setActiveColorFilter(color)
    }

    // Initialize TanStack Table
    const table = useReactTable({
        data: activeColorFilter ? colorFilteredData : tableData,
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
        enableColumnResizing: false, // Disable built-in resizing since we're having issues with it
        enableRowSelection: true,
        defaultColumn: {
            minSize: 50,
            size: 150,
            maxSize: 500,
        },
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

    // Get selected row for rule creation
    const selectedRow = useMemo(() => {
        if (selectedRowsCount !== 1) return null

        const selectedRowIndex = Object.keys(rowSelection)[0]
        return tableData[Number.parseInt(selectedRowIndex)]
    }, [rowSelection, tableData, selectedRowsCount])

    // Toggle statistics panel
    const toggleStats = () => {
        setShowStats(!showStats)
    }

    // Toggle collapsed stats on mobile
    const toggleCollapsedStats = () => {
        setCollapsedStats(!collapsedStats)
    }

    // Render the table component
    const renderTable = () => (
        <div className="space-y-4 h-full flex flex-col">
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
                <div className="flex flex-wrap gap-2">
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

                    <Button variant="outline" className="gap-2" onClick={() => setIsFormatDialogOpen(true)}>
                        <Paintbrush className="h-4 w-4" />
                        Format
                    </Button>

                    <Button variant="outline" className="gap-2" onClick={toggleStats}>
                        <Calculator className="h-4 w-4" />
                        {showStats ? "Hide Stats" : "Show Stats"}
                    </Button>

                    {conditionalFormatRules.length > 0 && (
                        <ColorFilter
                            rules={conditionalFormatRules}
                            onFilterByColor={handleColorFilter}
                            activeColorFilter={activeColorFilter}
                        />
                    )}

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
                                    .filter(
                                        (col) =>
                                            col.getIsVisible() &&
                                            col.id !== "select" &&
                                            col.id !== "actions" &&
                                            col.id !== "leftActions" &&
                                            col.id !== "rightActions",
                                    )
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
                        {selectedRowsCount === 1 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setIsFormatDialogOpen(true)
                                }}
                            >
                                Create Rule from Row
                            </Button>
                        )}
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
                            <Button variant="ghost" size="sm" onClick={() => clearFilter(filter.column)} className="h-4 w-4 p-0 ml-1">
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setColumnFilters([])} className="h-7 px-2 text-xs">
                        Clear All
                    </Button>
                </div>
            )}

            {activeColorFilter && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Color Filter:</span>
                    <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: activeColorFilter }}></div>
                        <span className="text-sm">{activeColorFilter}</span>
                        <Button variant="ghost" size="sm" onClick={() => setActiveColorFilter(null)} className="h-6 w-6 p-0">
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-md border flex-grow overflow-hidden">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToHorizontalAxis]}
                >
                    <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        <div ref={tableContainerRef} className="overflow-auto h-full">
                            <Table className="relative">
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
                                                        <TableRow
                                                            key={row.id}
                                                            data-state={row.getIsSelected() && "selected"}
                                                            className={row.getIsSelected() ? "bg-muted/50" : ""}
                                                        >
                                                            {row.getVisibleCells().map((cell) => (
                                                                <TableCell
                                                                    key={cell.id}
                                                                    style={{
                                                                        width: cell.column.getSize(),
                                                                        maxWidth: cell.column.getSize(),
                                                                    }}
                                                                >
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
                                <ChevronLeft className="h-4 w-4" />
                                <ChevronLeft className="h-4 w-4" />
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
                                <ChevronRight className="h-4 w-4" />
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <ConditionalFormatDialog
                open={isFormatDialogOpen}
                onOpenChange={setIsFormatDialogOpen}
                columns={headers || []}
                rules={conditionalFormatRules}
                onSaveRules={setConditionalFormatRules}
                tableData={tableData}
                selectedRow={selectedRow || selectedRowForRule}
            />
        </div>
    )

    // Mobile layout
    if (isMobile) {
        return (
            <div className="space-y-4">
                {renderTable()}

                {showStats && (
                    <div className="border rounded-md overflow-hidden">
                        <div className="p-2 bg-muted/30 border-b flex justify-between items-center">
                            <h3 className="text-sm font-medium">Statistics & Visualization</h3>
                            <Button variant="ghost" size="sm" onClick={toggleStats} className="h-8 w-8 p-0">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="max-h-[500px] overflow-auto">
                            <StatisticsPanel
                                tableData={tableData}
                                columns={headers || []}
                                filteredData={table.getFilteredRowModel().rows.map((row) => row.original)}
                            />
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Desktop layout with resizable panels
    return (
        <div className="max-h-[500px]">
            {showStats ? (
                <ResizablePanelGroup
                    direction="horizontal"
                    className="h-full border rounded-md overflow-hidden"
                    onLayout={(sizes) => {
                        setDefaultLayout(sizes)
                    }}
                >
                    <ResizablePanel defaultSize={defaultLayout[0]} minSize={30}>
                        <div className='p-5'>
                            {renderTable()}
                        </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={defaultLayout[1]} minSize={20} className="overflow-auto">
                        <ScrollArea className="w-full">
                            <div className="p-4">
                                <StatisticsPanel
                                    tableData={tableData}
                                    columns={headers || []}
                                    filteredData={table.getFilteredRowModel().rows.map((row) => row.original)}
                                />
                            </div>
                        </ScrollArea>
                    </ResizablePanel>
                </ResizablePanelGroup>
            ) : (
                renderTable()
            )}
        </div>
    )
}
