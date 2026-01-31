"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2, ChevronDown } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

interface FieldConfig {
    id: string
    name: string
    type: "color" | "text" | "number"
    icon?: string
}

interface FieldData {
    id: string
    [key: string]: string | number
}

interface DynamicFieldsProps {
    title?: string
    description?: string
    addButtonLabel?: string
    fields: FieldConfig[]
    initialData?: FieldData[]
    onDataChange?: (data: FieldData[]) => void
}

export function DynamicFields({
    title = "Set Values",
    description = "3 steps",
    addButtonLabel = "Add Item",
    fields,
    initialData = [],
    onDataChange,
}: DynamicFieldsProps) {
    const [data, setData] = useState<FieldData[]>(
        initialData.length > 0
            ? initialData
            : [
                {
                    id: Date.now().toString(),
                    ...fields.reduce(
                        (acc, field) => ({
                            ...acc,
                            [field.name]: field.type === "color" ? "#000000" : field.type === "number" ? 0 : "",
                        }),
                        {},
                    ),
                },
            ],
    )
    const [isOpen, setIsOpen] = useState(true)

    const addItem = () => {
        const newItem: FieldData = {
            id: Date.now().toString(),
            ...fields.reduce(
                (acc, field) => ({
                    ...acc,
                    [field.name]: field.type === "color" ? "#000000" : field.type === "number" ? 0 : "",
                }),
                {},
            ),
        }
        const updatedData = [...data, newItem]
        setData(updatedData)
        onDataChange?.(updatedData)
    }

    const deleteItem = (id: string) => {
        const updatedData = data.filter((item) => item.id !== id)
        setData(updatedData)
        onDataChange?.(updatedData)
    }

    const updateItem = (id: string, fieldName: string, value: string | number) => {
        const updatedData = data.map((item) =>
            item.id === id
                ? {
                    ...item,
                    [fieldName]: fields.find((f) => f.name === fieldName)?.type === "number" ? Number(value) : value,
                }
                : item,
        )
        setData(updatedData)
        onDataChange?.(updatedData)
    }

    return (
        <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full rounded-md border p-2 bg-muted/5 space-y-2"
        >
            <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between cursor-pointer group">
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{title}</h2>
                        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
                    </div>
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen ? "rotate-180" : "")} />
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down space-y-2">
                <div className="space-y-2">
                    {data.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-1 bg-background rounded border border-border">
                            {fields.map((field) => {
                                if (field.type === "color") {
                                    return (
                                        <div key={field.name} className="flex items-center gap-1">
                                            <div
                                                className="relative w-6 h-6 rounded border border-border cursor-pointer flex-shrink-0"
                                                style={{ backgroundColor: String(item[field.name]) }}
                                            >
                                                <input
                                                    type="color"
                                                    value={String(item[field.name])}
                                                    onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                />
                                            </div>
                                            <input
                                                type="text"
                                                value={String(item[field.name])}
                                                onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                                                placeholder="#000000"
                                                className="w-16 h-7 px-1 bg-background border border-border rounded text-xs font-mono"
                                            />
                                        </div>
                                    )
                                }

                                return (
                                    <input
                                        key={field.name}
                                        type={field.type}
                                        value={String(item[field.name])}
                                        onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                                        placeholder={field.name}
                                        className="h-7 px-2 bg-background border border-border rounded text-xs text-center flex-1 min-w-0"
                                    />
                                )
                            })}

                            {/* Edit Button - Optional/Disabled for compact view if functionality missing */}
                            <button className="p-1 hover:bg-muted rounded transition-colors flex-shrink-0 text-muted-foreground hidden">
                                <Edit2 className="w-3 h-3" />
                            </button>

                            {/* Delete Button */}
                            <button
                                onClick={() => deleteItem(item.id)}
                                className="p-1 hover:bg-destructive/10 rounded transition-colors flex-shrink-0 text-muted-foreground hover:text-destructive"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Field Button */}
                <Button onClick={addItem} variant="secondary" className="w-full h-7 text-xs gap-1">
                    <Plus className="w-3 h-3" />
                    {addButtonLabel}
                </Button>
            </CollapsibleContent>
        </Collapsible>
    )
}
