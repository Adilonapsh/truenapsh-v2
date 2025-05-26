"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"
import { Layer, LayoutDisplay, MapboxLayerStyle, MapServiceVendor } from "@/types/map.types"
import { ImagesIcon, PenIcon, Table2Icon, TableIcon, X, XIcon } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../accordion"
import IconLayerType from "./icon-layer-type"
import LegendEsri from "./legend-esri"
import LegendMapbox from "./legend-mapbox"
import { MapRef } from "react-map-gl"

interface StyleValue {
    opacity: number
    fill: string
    stroke: string
    stroke_width: number
    contrast: number
    saturation: number
    brightness: [number, number]
    zoom: [number, number]
}

export function StylePanel(
    {
        mapRef,
        selectedLayer,
        values,
        setValues,
        onFillChange,
        onStrokeChange,
        onStrokeWidthChange,
        onContrastChange,
        onSaturationChange,
        onBrightnessChange,
        onZoomChange,
        onOpacityChange,
        setDisplayLayouts,
        setSelectedLayer,
        handleEditFeatures,
        resetFill,
        resetStroke,
    }: {
        mapRef: React.RefObject<MapRef | null>,
        selectedLayer: Layer | null,
        values: MapboxLayerStyle,
        setValues: React.Dispatch<React.SetStateAction<MapboxLayerStyle>>,
        onFillChange: (fill: string) => void,
        onStrokeChange: (stroke: string) => void,
        onStrokeWidthChange: (width: number) => void,
        onContrastChange: (contrast: number) => void,
        onSaturationChange: (saturation: number) => void,
        onBrightnessChange: (brightness: number[]) => void,
        onZoomChange: (brightness: number[]) => void,
        onOpacityChange: (opacity: number) => void,
        setDisplayLayouts: React.Dispatch<React.SetStateAction<LayoutDisplay>>
        setSelectedLayer: React.Dispatch<React.SetStateAction<Layer | null>>
        handleEditFeatures: () => void,
        resetFill: () => void,
        resetStroke: () => void,
    }) {
    return (
        <Card className="w-[320px] shadow-lg text-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="relative font-medium">
                    <div className="absolute -top-10 -left-12 opacity-15">
                        <IconLayerType size={"50pt"} layer={selectedLayer} />
                    </div>
                    <div>
                        <p className="text-lg font-medium">Styles</p>
                        <p className="text-xs">{selectedLayer?.name}</p>
                    </div>
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                    setSelectedLayer(null);
                    setDisplayLayouts((prev) => ({ ...prev, style: false }));
                }}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <div className="flex items-center justify-center gap-1 border-b border-t pt-2 px-4 pb-2 mt-2">
                <Toggle size="sm" aria-label="Toggle italic" onClick={handleEditFeatures}>
                    <PenIcon />
                </Toggle>
                <Toggle size="sm" aria-label="Toggle layout">
                    <Table2Icon />
                </Toggle>
                <Toggle size="sm" aria-label="Legend" onClick={() => {
                    setDisplayLayouts((prev) => ({ ...prev, legend: true }));
                }}>
                    <ImagesIcon />
                </Toggle>
                <Toggle size="sm" aria-label="Toggle grid 2">
                    <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                </Toggle>
                <Toggle size="sm" aria-label="Toggle grid 3">
                    <svg
                        className="h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <rect width="18" height="18" x="3" y="3" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                    </svg>
                </Toggle>
            </div>
            <CardContent className="max-h-[70vh] overflow-y-scroll">
                <div className="grid gap-4 pt-4">
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Opacity</Label>
                            <span className="w-12 text-right text-sm">{values.opacity}</span>
                        </div>
                        <Slider
                            value={[values.opacity ?? 100]}
                            max={100}
                            step={1}
                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                            onValueChange={([opacity]) => {
                                setValues({ ...values, opacity })
                                onOpacityChange(opacity)
                            }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs">Zoom</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={values.zoom?.[0] ?? 24}
                                    className="h-8 w-20"
                                    max={24}
                                    min={0}
                                    onChange={(e) => {
                                        const newZoom = Number(e.target.value);
                                        setValues({ ...values, zoom: [newZoom, values.zoom?.[1] ?? newZoom] });
                                        onZoomChange([newZoom, values.zoom?.[1] ?? newZoom]);
                                    }}
                                />
                                <span>-</span>
                                <Input
                                    type="number"
                                    value={values.zoom?.[1] ?? 24}
                                    className="h-8 w-20"
                                    max={24}
                                    min={0}
                                    onChange={(e) => {
                                        setValues({ ...values, zoom: [values.zoom?.[0] ?? 24, Number(e.target.value)] })
                                        onZoomChange([values.zoom?.[0] ?? 24, Number(e.target.value)])
                                    }}
                                />
                            </div>
                        </div>
                        <Slider
                            value={values.zoom}
                            min={0}
                            max={24}
                            step={0.001}
                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                            onValueChange={(zoom) => {
                                setValues({ ...values, zoom })
                                onZoomChange(zoom)
                            }}
                        />
                    </div>

                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Vector</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Fill</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                <input
                                                    type="color"
                                                    value={values.fill}
                                                    className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                    onChange={(e) => {
                                                        setValues({ ...values, fill: e.target.value })
                                                        onFillChange(e.target.value)
                                                    }}
                                                />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    value={values.fill}
                                                    className="font-mono"
                                                    onChange={(e) => {
                                                        setValues({ ...values, fill: e.target.value })
                                                        onFillChange(e.target.value)
                                                    }}
                                                />
                                                {values.fill != "#000000" && (
                                                    <Button className="absolute right-0 top-0" variant={"ghost"} onClick={(e) => resetFill()}><XIcon /></Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs">Stroke</Label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                <input
                                                    type="color"
                                                    value={values.stroke}
                                                    className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                    onChange={(e) => {
                                                        setValues({ ...values, stroke: e.target.value })
                                                        onStrokeChange(e.target.value)
                                                    }}
                                                />
                                            </div>
                                            <div className="relative">
                                                <Input
                                                    value={values.stroke}
                                                    className="font-mono"
                                                    onChange={(e) => {
                                                        setValues({ ...values, stroke: e.target.value })
                                                        onStrokeChange(e.target.value)
                                                    }}
                                                />
                                                {values.stroke != "#000000" && (
                                                    <Button className="absolute right-0 top-0" variant={"ghost"} onClick={(e) => resetStroke()}><XIcon /></Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Stroke Width</Label>
                                            <span className="w-12 text-right text-sm">{values.stroke_width}</span>
                                        </div>
                                        <Slider
                                            value={[values.stroke_width ?? 100]}
                                            max={100}
                                            step={1}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                            onValueChange={([stroke_width]) => {
                                                setValues({ ...values, stroke_width })
                                                onStrokeWidthChange(stroke_width)
                                            }}
                                        />
                                    </div>

                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Raster</AccordionTrigger>
                            <AccordionContent>
                                <div className="grid gap-4">

                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Contrast</Label>
                                            <span className="w-12 text-right text-sm">{values.contrast}</span>
                                        </div>
                                        <Slider
                                            value={[values.contrast ?? 1]}
                                            max={1}
                                            min={-1}
                                            step={0.001}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                            onValueChange={([contrast]) => {
                                                setValues({ ...values, contrast })
                                                onContrastChange(contrast)
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Saturation</Label>
                                            <span className="w-12 text-right text-sm">{values.saturation}</span>
                                        </div>
                                        <Slider
                                            value={[values.saturation ?? 1]}
                                            max={1}
                                            min={-1}
                                            step={0.001}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                            onValueChange={([saturation]) => {
                                                setValues({ ...values, saturation })
                                                onSaturationChange(saturation)
                                            }}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Brightness</Label>
                                            <span className="w-24 text-right text-sm">{values.brightness?.[0] ?? 0} - {values.brightness?.[1] ?? 1}</span>
                                        </div>
                                        <Slider
                                            value={values.brightness ?? [0, 1]}
                                            min={0}
                                            max={1}
                                            step={0.001}
                                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                            onValueChange={(brightness) => {
                                                setValues({ ...values, brightness })
                                                onBrightnessChange(brightness)
                                            }}
                                        />
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Legend</AccordionTrigger>
                            <AccordionContent>
                                {selectedLayer?.map_service_vendor == MapServiceVendor.Geoserver && (
                                    <>
                                        <img src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0x232838;fontColor:0xffffff;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`} className="hidden dark:block" alt="Legend Dark" />
                                        <img src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0xffffff;fontColor:0x000000;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`} className="block dark:hidden" alt="Legend Light" />
                                    </>
                                )}
                                {selectedLayer?.map_service_vendor == MapServiceVendor.ArcGIS && (
                                    <LegendEsri url={`${selectedLayer?.map_service_url}/legend?f=json`} />
                                )}
                                {selectedLayer?.map_service_vendor == MapServiceVendor.GeoJSON && (
                                    <LegendMapbox selectedLayer={selectedLayer} mapRef={mapRef} />
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>


            </CardContent>
        </Card >
    )
}

