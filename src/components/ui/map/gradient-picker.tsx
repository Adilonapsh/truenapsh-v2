"use client";

import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Palette } from "lucide-react";
import { useState } from "react";

export interface GradientPalettePickerProps {
    onPaletteSelect: (colors: string[]) => void;
    className?: string;
}

const PALETTES = [
    {
        name: "Viridis",
        colors: ["#440154", "#482878", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b", "#fde725"],
    },
    {
        name: "Magma",
        colors: ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#f7d13d", "#fcffa4"],
    },
    {
        name: "Inferno",
        colors: ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#f7d13d", "#fcffa4"],
    },
    {
        name: "Plasma",
        colors: ["#0d0887", "#46039f", "#7201a8", "#9c179e", "#bd3786", "#d8576b", "#ed7953", "#fb9f3a", "#fdca26", "#f0f921"],
    },
    {
        name: "Turbo",
        colors: ["#30123b", "#464590", "#287d8e", "#25a186", "#50c46a", "#a4de5b", "#e3e34b", "#fecc5c", "#f68045", "#cf3e38", "#7a0403"],
    },
    {
        name: "Reds",
        colors: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
    },
    {
        name: "Blues",
        colors: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
    },
    {
        name: "Greens",
        colors: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
    },
    {
        name: "Spectral",
        colors: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
    },
    {
        name: "Cool",
        colors: ["#EFFFFB", "#50D890", "#4F98CA", "#272727"]
    }
];

export function GradientPalettePicker({
    onPaletteSelect,
    className,
}: GradientPalettePickerProps) {
    const [open, setOpen] = useState(false);
    const [selectedPalette, setSelectedPalette] = useState<string | null>(null);

    const handleSelect = (palette: typeof PALETTES[0]) => {
        setSelectedPalette(palette.name);
        onPaletteSelect(palette.colors);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between h-9 px-3", className)}
                >
                    <span className="text-xs text-muted-foreground mr-2">Palette</span>
                    <div className="flex-1 h-3 rounded-sm bg-gradient-to-r from-transparent to-transparent overflow-hidden border border-border/50 relative">
                        {selectedPalette ? (
                            <div
                                className="absolute inset-0 w-full h-full"
                                style={{
                                    background: `linear-gradient(to right, ${PALETTES.find(p => p.name === selectedPalette)?.colors.join(", ")})`
                                }}
                            />
                        ) : (
                            <span className="text-[10px] items-center flex h-full px-1 text-muted-foreground/50">Select...</span>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2" align="start">
                <div className="grid gap-1">
                    <div className="flex items-center justify-between px-2 pb-2 border-b mb-1">
                        <span className="text-xs font-semibold">Color Palettes</span>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto grid gap-1 custom-scrollbar pr-1">
                        {PALETTES.map((palette) => (
                            <button
                                key={palette.name}
                                className="flex flex-col gap-1 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground items-start text-left group transition-colors"
                                onClick={() => handleSelect(palette)}
                            >
                                <div className="flex w-full items-center justify-between">
                                    <span className="text-xs font-medium">{palette.name}</span>
                                    {selectedPalette === palette.name && (
                                        <Check className="h-3 w-3" />
                                    )}
                                </div>
                                <div
                                    className="h-3 w-full rounded-sm border border-border/20"
                                    style={{
                                        background: `linear-gradient(to right, ${palette.colors.join(", ")})`
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
