"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit2 } from "lucide-react"

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
    <div className="w-full max-w-2xl mx-auto p-6 rounded-lg border border-border bg-card">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-3 mb-6">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border">
            {fields.map((field) => {
              if (field.type === "color") {
                return (
                  <div key={field.name} className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border border-border cursor-pointer flex-shrink-0"
                      style={{ backgroundColor: String(item[field.name]) }}
                    />
                    <input
                      type="text"
                      value={String(item[field.name])}
                      onChange={(e) => updateItem(item.id, field.name, e.target.value)}
                      placeholder="#000000"
                      className="w-24 px-3 py-2 bg-background border border-border rounded text-sm font-mono"
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
                  className="px-3 py-2 bg-background border border-border rounded text-sm text-center flex-1"
                />
              )
            })}

            {/* Edit Button */}
            <button className="p-2 hover:bg-muted rounded transition-colors flex-shrink-0">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => deleteItem(item.id)}
              className="p-2 hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Field Button */}
      <Button onClick={addItem} className="w-full gap-2">
        <Plus className="w-4 h-4" />
        {addButtonLabel}
      </Button>
    </div>
  )
}
