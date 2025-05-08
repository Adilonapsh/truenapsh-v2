"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PRESET_COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#9e9e9e",
  "#607d8b",
  "#ffffff",
  "#f5f5f5",
  "#eeeeee",
  "#e0e0e0",
  "#bdbdbd",
  "#000000",
]

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal" style={{ backgroundColor: color }}>
          <div className="w-4 h-4 rounded mr-2 border" style={{ backgroundColor: color }} />
          {color}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-wrap gap-1 mb-2">
          {PRESET_COLORS.map((presetColor) => (
            <button
              key={presetColor}
              className="w-6 h-6 rounded-md border"
              style={{ backgroundColor: presetColor }}
              onClick={() => {
                onChange(presetColor)
                setOpen(false)
              }}
              aria-label={`Select color ${presetColor}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Input type="color" value={color} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 p-1" />
          <Input value={color} onChange={(e) => onChange(e.target.value)} className="flex-1" placeholder="#000000" />
        </div>
      </PopoverContent>
    </Popover>
  )
}
