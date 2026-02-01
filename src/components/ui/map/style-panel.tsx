"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
    Layer,
    LayoutDisplay,
    MapboxLayerStyle,
    MapServiceVendor,
} from "@/types/map.types";
import {
    Eye,
    ImagesIcon,
    PenIcon,
    SlidersHorizontal,
    Table2Icon,
    TableIcon,
    X,
    XIcon,
} from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../accordion";
import { Switch } from "@/components/ui/switch";
import IconLayerType from "./icon-layer-type";
import LegendEsri from "./legend-esri";
import LegendMapbox from "./legend-mapbox";
import { useMapStore } from "@/stores/map";
import { ScrollArea } from "../scroll-area";
import { useEffect, useState } from "react";
import {
    ColorSpecification,
    DataDrivenPropertyValueSpecification,
    LayerSpecification,
    PaintSpecification,
} from "mapbox-gl";
import useLayerStore, { useLayers } from "@/stores/layer";
import { useMapboxStyleStore } from "@/stores/style";
import {
    SelectItem,
    Select,
    SelectContent,
    SelectGroup,
    SelectTrigger,
    SelectValue,
} from "../select";
import { DynamicFields } from "@/components/ui/dynamic-fields";
import { GradientPalettePicker } from "./gradient-picker";
import { FieldSelect } from "./field-select";
import { defaultLayerConfig } from "@/stores/style";

interface StyleValue {
    opacity: number;
    fill: string;
    stroke: string;
    stroke_width: number;
    contrast: number;
    saturation: number;
    brightness: [number, number];
    zoom: [number, number];
}

export interface StylePanelProps {
    handleEditFeatures: () => void;
}

export function StylePanel({ handleEditFeatures }: StylePanelProps) {
    const { map, setDisplayLayouts, selectedLayer, setActiveModelUrl } = useMapStore();
    const mapRef = map;

    const layers = useLayers();
    const currentLayer = layers.find((l) => l.id === selectedLayer?.id);
    const availableFields = currentLayer?.fields || [];

    const [layerType, setLayerType] = useState<
        LayerSpecification["type"] | undefined
    >(undefined);
    const [circleViz, setCircleViz] = useState<"standard" | "marker" | "heatmap">(
        "standard"
    );
    const [paletteVersion, setPaletteVersion] = useState(0);
    const [mapboxLayerStyle, setMapboxLayerStyle] = useState<MapboxLayerStyle>({
        fill: "#000000",
        stroke: "#000000",
        stroke_width: 0,
        line_width: 0,
        line_dasharray: [],
        circle_radius: 0,
        opacity: 100,
        contrast: 0,
        saturation: 0,
        brightness: [0, 1],
        zoom: [0, 24],
        model_color: "#000000",
        model_opacity: 100,
        model_emissive_strength: 0,
        model_rotation: [0, 0, 0],
        model_scale: [1, 1, 1],
        // fill-extrusion defaults
        fill_extrusion_color: "#000000",
        fill_extrusion_opacity: 100,
        fill_extrusion_height: 0,
        fill_extrusion_base: 0,
        fill_extrusion_vertical_gradient: true,
        // heatmap defaults
        heatmap_intensity: 1,
        heatmap_radius: 20,
        heatmap_opacity: 100,
        heatmap_color_stops: [],
        // hillshade defaults
        hillshade_exaggeration: 0.5,
        hillshade_shadow_color: "#000000",
        hillshade_highlight_color: "#ffffff",
        hillshade_accent_color: "#888888",
        hillshade_illumination_direction: 335,
        hillshade_illumination_anchor: "map",
        // symbol defaults
        text_color: "#000000",
        icon_color: "#000000",
        text_size: 16,
        icon_size: 1,
        // raster extras
        raster_hue_rotate: 0,
        raster_fade_duration: 300,
        // raster-particle
        raster_particle_opacity: 100,
        raster_particle_speed: 1,
        raster_particle_fade_amount: 0.5,
        raster_particle_color: "#00ffff",
    });

    const { getLayerConfig, updateLayerConfig } = useMapboxStyleStore();

    const config = useMapboxStyleStore((state) =>
        selectedLayer?.id ? state.layerConfigs[selectedLayer.id] || defaultLayerConfig : defaultLayerConfig
    );


    const { openStyleAccordions, setOpenStyleAccordions } = useMapStore();

    useEffect(() => {
        if (selectedLayer?.id) {
            getStyleLayer();
            // Sync config.staticStyles to mapboxLayerStyle if they exist
            if (config.staticStyles) {
                setMapboxLayerStyle((prev) => ({
                    ...prev,
                    ...config.staticStyles,
                    // Ensure symbol properties are mapped correctly from existing config
                    text_size: config.staticStyles.text_size ?? (config.staticStyles as any).symbol_text_size ?? 16,
                    icon_size: config.staticStyles.icon_size ?? (config.staticStyles as any).symbol_icon_size ?? 1,
                }));
            }
        }
    }, [selectedLayer?.id, config.staticStyles]);

    const PALETTES = [
        "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe", "#00c49f", "#ffbb28", "#ff8042",
        "#a4de6c", "#d0ed57", "#ffc658", "#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3"
    ];
    const HEATMAP_DEFAULT_STOPS: [number, string][] = [
        [0, "rgba(0,0,255,0)"],
        [0.2, "rgba(0,255,255,0.5)"],
        [0.4, "rgba(0,255,0,0.7)"],
        [0.6, "rgba(255,255,0,0.9)"],
        [1, "rgba(255,0,0,1)"],
    ];

    const handleAutoGenerateColors = (
        target: "fill" | "stroke" | "line" | "circle-fill" | "circle-stroke",
        field: string,
        palette?: string[]
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer || !field) return;

        const layerId = selectedLayer.id;
        const glLayer = map.getLayer(layerId) as any;
        if (!glLayer) return;

        // Try to query features to get unique values
        const features = map.querySourceFeatures(glLayer.source, {
            sourceLayer: glLayer.sourceLayer,
        });

        const uniqueValues = Array.from(
            new Set(
                features
                    .map((f) => f.properties?.[field])
                    .filter((v) => v !== undefined && v !== null)
            )
        ).sort();

        const colorsToUse = palette && palette.length > 0 ? palette : PALETTES;

        const newItems = uniqueValues.slice(0, 500).map((val, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            value: String(val),
            color: colorsToUse[i % colorsToUse.length],
        }));

        const pairs: Array<[string, string]> = newItems.map((item) => [
            String(item.value ?? ""),
            String(item.color ?? "#000000"),
        ]);

        if (target === "fill") {
            updateLayerConfig(layerId, { fillColorItems: newItems, fillColorField: field });
            applyCategoricalColor(field, pairs, config.fillColorDefault || "#000000", undefined, "fill-color");
        } else if (target === "stroke") {
            updateLayerConfig(layerId, { strokeColorItems: newItems, strokeColorField: field });
            applyCategoricalColor(field, pairs, config.strokeColorDefault || "#000000", undefined, "fill-outline-color");
        } else if (target === "line") {
            updateLayerConfig(layerId, { lineColorItems: newItems, lineColorField: field });
            applyCategoricalColor(field, pairs, config.lineColorDefault || "#000000", undefined, "line-color");
        } else if (target === "circle-fill") {
            updateLayerConfig(layerId, { fillColorItems: newItems, fillColorField: field });
            applyCategoricalColor(field, pairs, config.fillColorDefault || "#000000", undefined, "circle-color");
        } else if (target === "circle-stroke") {
            updateLayerConfig(layerId, { strokeColorItems: newItems, strokeColorField: field });
            applyCategoricalColor(field, pairs, config.strokeColorDefault || "#000000", undefined, "circle-stroke-color");
        }
    };

    const getStyleLayer = () => {
        const map = mapRef?.current?.getMap();
        const layerId = selectedLayer?.id;

        if (map && layerId) {
            const layer = map.getLayer(layerId) as LayerSpecification | undefined;
            if (layer) {
                setLayerType(layer.type);
                const symbolLayerId = `${layerId}-symbol`;
                const hasCompanion = map.getLayer(symbolLayerId);

                if (layer.type === "circle") {
                    if (hasCompanion) setCircleViz("standard");
                    else setCircleViz("standard"); // Fallback if it's circle but no companion (yet)
                }
                else if (layer.type === "symbol") setCircleViz("marker");
                else if (layer.type === "heatmap") setCircleViz("heatmap");

                // If it's circle and has companion, or if it's symbol
                // we need to extract symbol properties.
                const symbolSpec = (layer.type === "symbol" ? layer : map.getLayer(symbolLayerId)) as any;

                if (symbolSpec) {
                    const l = symbolSpec.layout || {};
                    const p = symbolSpec.paint || {};

                    setMapboxLayerStyle(prev => ({
                        ...prev,
                        visibility: l.visibility ?? "visible",
                        // Text Layout
                        text_field: l["text-field"] || "",
                        text_size: l["text-size"] ?? 16,
                        text_font: l["text-font"] || prev.text_font,
                        text_allow_overlap: l["text-allow-overlap"] ?? false,
                        text_anchor: l["text-anchor"] ?? "center",
                        text_ignore_placement: l["text-ignore-placement"] ?? false,
                        text_justify: l["text-justify"] ?? "center",
                        text_keep_upright: l["text-keep-upright"] ?? true,
                        text_letter_spacing: l["text-letter-spacing"] ?? 0,
                        text_line_height: l["text-line-height"] ?? 1.2,
                        text_max_angle: l["text-max-angle"] ?? 45,
                        text_max_width: l["text-max-width"] ?? 10,
                        text_offset: l["text-offset"] ?? [0, 0],
                        text_optional: l["text-optional"] ?? false,
                        text_padding: l["text-padding"] ?? 2,
                        text_pitch_alignment: l["text-pitch-alignment"] ?? "auto",
                        text_radial_offset: l["text-radial-offset"] ?? 0,
                        text_rotate: l["text-rotate"] ?? 0,
                        text_rotation_alignment: l["text-rotation-alignment"] ?? "auto",
                        text_transform: l["text-transform"] ?? "none",
                        text_variable_anchor: l["text-variable-anchor"] || [],
                        text_writing_mode: l["text-writing-mode"] || ["horizontal"],
                        // Icon Layout
                        icon_image: l["icon-image"] || "",
                        icon_size: l["icon-size"] ?? 1,
                        icon_allow_overlap: l["icon-allow-overlap"] ?? false,
                        icon_anchor: l["icon-anchor"] ?? "center",
                        icon_ignore_placement: l["icon-ignore-placement"] ?? false,
                        icon_keep_upright: l["icon-keep-upright"] ?? false,
                        icon_offset: l["icon-offset"] ?? [0, 0],
                        icon_optional: l["icon-optional"] ?? false,
                        icon_padding: l["icon-padding"] ?? 2,
                        icon_pitch_alignment: l["icon-pitch-alignment"] ?? "auto",
                        icon_rotate: l["icon-rotate"] ?? 0,
                        icon_rotation_alignment: l["icon-rotation-alignment"] ?? "auto",
                        icon_text_fit: l["icon-text-fit"] ?? "none",
                        icon_text_fit_padding: l["icon-text-fit-padding"] ?? [0, 0, 0, 0],
                        // Symbol Layout
                        symbol_avoid_edges: l["symbol-avoid-edges"] ?? false,
                        symbol_placement: l["symbol-placement"] ?? "point",
                        symbol_sort_key: l["symbol-sort-key"] ?? 0,
                        symbol_spacing: l["symbol-spacing"] ?? 250,
                        symbol_z_order: l["symbol-z-order"] ?? "auto",
                        // Text Paint
                        text_color: p["text-color"] ?? "#000000",
                        text_opacity: (p["text-opacity"] ?? 1) * 100,
                        text_halo_color: p["text-halo-color"] ?? "rgba(0,0,0,0)",
                        text_halo_width: p["text-halo-width"] ?? 0,
                        text_halo_blur: p["text-halo-blur"] ?? 0,
                        text_emissive_strength: p["text-emissive-strength"] ?? 0,
                        // Icon Paint
                        icon_color: p["icon-color"] ?? "#000000",
                        icon_opacity: (p["icon-opacity"] ?? 1) * 100,
                        icon_halo_color: p["icon-halo-color"] ?? "rgba(0,0,0,0)",
                        icon_halo_width: p["icon-halo-width"] ?? 0,
                        icon_halo_blur: p["icon-halo-blur"] ?? 0,
                        icon_emissive_strength: p["icon-emissive-strength"] ?? 0,
                    }));
                }

                if (layer.minzoom && layer.maxzoom) {
                    setMapboxLayerStyle((prev) => ({
                        ...prev,
                        zoom: [layer.minzoom ?? 0, layer.maxzoom ?? 24],
                    }));
                }

                if (layer?.paint) {
                    // Handle opacity
                    const opacityKey =
                        `${layer.type}-opacity` as keyof typeof layer.paint;
                    const opacity = layer.paint[opacityKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;

                    if (opacity !== undefined) {
                        const parsedOpacity =
                            typeof opacity === "number"
                                ? opacity
                                : parseFloat(opacity as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            opacity: parsedOpacity * 100,
                        }));
                    }

                    // Handle fill color
                    const colorKey = `${layer.type}-color` as keyof typeof layer.paint;
                    const color = layer.paint[colorKey] as
                        | DataDrivenPropertyValueSpecification<ColorSpecification>
                        | undefined;
                    if (color) {
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            fill: typeof color === "string" ? color : undefined,
                        }));
                    }

                    // Handle stroke or outline color
                    const strokeKey =
                        `${layer.type}-stroke-color` as keyof typeof layer.paint;
                    const outlineKey =
                        `${layer.type}-outline-color` as keyof typeof layer.paint;

                    const stroke = layer.paint[strokeKey] as
                        | DataDrivenPropertyValueSpecification<ColorSpecification>
                        | undefined;
                    const outline = layer.paint[outlineKey] as
                        | DataDrivenPropertyValueSpecification<ColorSpecification>
                        | undefined;

                    setMapboxLayerStyle((prev) => {
                        const updatedStroke = stroke ?? outline ?? "#000000";
                        return {
                            ...prev,
                            stroke:
                                typeof updatedStroke === "string" ? updatedStroke : undefined,
                        };
                    });

                    // handle brightness
                    const brightnessMinKey =
                        `${layer.type}-brightness-min` as keyof typeof layer.paint;
                    const brightnessMin = layer.paint[brightnessMinKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    const brightnessMaxKey =
                        `${layer.type}-brightness-max` as keyof typeof layer.paint;
                    const brightnessMax = layer.paint[brightnessMaxKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;

                    if (brightnessMin !== undefined || brightnessMax !== undefined) {
                        const parsedMinBrightness =
                            typeof brightnessMin === "number"
                                ? brightnessMin
                                : parseFloat(brightnessMin as unknown as string);
                        const parsedMaxBrightness =
                            typeof brightnessMax === "number"
                                ? brightnessMax
                                : parseFloat(brightnessMax as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            brightness: [parsedMinBrightness, parsedMaxBrightness],
                        }));
                    }

                    // handle saturation
                    const saturationKey =
                        `${layer.type}-saturation` as keyof typeof layer.paint;
                    const saturation = layer.paint[saturationKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    if (saturation !== undefined) {
                        const parsedSaturation =
                            typeof saturation === "number"
                                ? saturation
                                : parseFloat(saturation as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            saturation: parsedSaturation,
                        }));
                    }

                    // Handle stroke/line width per type
                    const strokeWidthKey =
                        `${layer.type}-stroke-width` as keyof typeof layer.paint;
                    const lineWidthKey =
                        `${layer.type}-width` as keyof typeof layer.paint;
                    const circleRadiusKey =
                        `${layer.type}-radius` as keyof typeof layer.paint;

                    const strokeWidth = layer.paint[strokeWidthKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    const lineWidth = layer.paint[lineWidthKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    const circleRadius = layer.paint[circleRadiusKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;

                    if (lineWidth !== undefined && layer.type === "line") {
                        const parsedLineWidth =
                            typeof lineWidth === "number"
                                ? lineWidth
                                : parseFloat(lineWidth as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            line_width: parsedLineWidth,
                        }));
                    }

                    if (strokeWidth !== undefined && layer.type === "circle") {
                        const parsedStrokeWidth =
                            typeof strokeWidth === "number"
                                ? strokeWidth
                                : parseFloat(strokeWidth as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            stroke_width: parsedStrokeWidth,
                        }));
                    }

                    if (circleRadius !== undefined && layer.type === "circle") {
                        const parsedCircleRadius =
                            typeof circleRadius === "number"
                                ? circleRadius
                                : parseFloat(circleRadius as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            circle_radius: parsedCircleRadius,
                        }));
                    }

                    // handle contrast
                    const contrastKey =
                        `${layer.type}-contrast` as keyof typeof layer.paint;
                    const contrast = layer.paint[contrastKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    if (contrast !== undefined) {
                        const parsedContrast =
                            typeof contrast === "number"
                                ? contrast
                                : parseFloat(contrast as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            contrast: parsedContrast,
                        }));
                    }
                    // Handle line dasharray
                    const dashKey = `${layer.type}-dasharray` as keyof typeof layer.paint;
                    const dash = layer.paint[dashKey] as
                        | DataDrivenPropertyValueSpecification<number[]>
                        | undefined;
                    if (dash && layer.type === "line") {
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            line_dasharray:
                                Array.isArray(dash) &&
                                    dash.every((d) => typeof d === "number")
                                    ? (dash as number[])
                                    : [],
                        }));
                    }

                    // Handle model paint properties (v3)
                    const modelColorKey = `model-color` as keyof typeof layer.paint;
                    const modelOpacityKey = `model-opacity` as keyof typeof layer.paint;
                    const modelEmissiveKey =
                        `model-emissive-strength` as keyof typeof layer.paint;
                    const modelRotationKey = `model-rotation` as keyof typeof layer.paint;

                    const modelColor = layer.paint[modelColorKey] as
                        | DataDrivenPropertyValueSpecification<ColorSpecification>
                        | undefined;
                    const modelOpacity = layer.paint[modelOpacityKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    const modelEmissive = layer.paint[modelEmissiveKey] as
                        | DataDrivenPropertyValueSpecification<number>
                        | undefined;
                    const modelRotation = layer.paint[modelRotationKey] as
                        | DataDrivenPropertyValueSpecification<number[]>
                        | undefined;

                    if (modelColor !== undefined && layer.type === "model") {
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            model_color:
                                typeof modelColor === "string" ? modelColor : prev.model_color,
                        }));
                    }

                    if (modelOpacity !== undefined && layer.type === "model") {
                        const parsedModelOpacity =
                            typeof modelOpacity === "number"
                                ? modelOpacity
                                : parseFloat(modelOpacity as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            model_opacity: parsedModelOpacity * 100,
                        }));
                    }

                    if (modelEmissive !== undefined && layer.type === "model") {
                        const parsedEmissive =
                            typeof modelEmissive === "number"
                                ? modelEmissive
                                : parseFloat(modelEmissive as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            model_emissive_strength: parsedEmissive,
                        }));
                    }

                    if (modelRotation !== undefined && layer.type === "model") {
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            model_rotation: Array.isArray(modelRotation)
                                ? (modelRotation as number[])
                                : prev.model_rotation,
                        }));
                    }

                    // Symbol paint
                    if (layer.type === "symbol") {
                        const textColor = layer.paint[
                            "text-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const iconColor = layer.paint[
                            "icon-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const textSize = layer.paint[
                            "text-size" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const iconSize = layer.paint[
                            "icon-size" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            symbol_text_color:
                                typeof textColor === "string"
                                    ? textColor
                                    : prev.symbol_text_color,
                            symbol_icon_color:
                                typeof iconColor === "string"
                                    ? iconColor
                                    : prev.symbol_icon_color,
                            symbol_text_size:
                                typeof textSize === "number" ? textSize : prev.symbol_text_size,
                            symbol_icon_size:
                                typeof iconSize === "number" ? iconSize : prev.symbol_icon_size,
                        }));
                    }

                    // Fill-extrusion paint
                    if (layer.type === "fill-extrusion") {
                        const extrusionColor = layer.paint[
                            "fill-extrusion-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const extrusionOpacity = layer.paint[
                            "fill-extrusion-opacity" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const height = layer.paint[
                            "fill-extrusion-height" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const base = layer.paint[
                            "fill-extrusion-base" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const verticalGradient = layer.paint[
                            "fill-extrusion-vertical-gradient" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<boolean> | undefined;
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            fill_extrusion_color:
                                typeof extrusionColor === "string"
                                    ? extrusionColor
                                    : prev.fill_extrusion_color,
                            fill_extrusion_opacity:
                                extrusionOpacity !== undefined
                                    ? typeof extrusionOpacity === "number"
                                        ? extrusionOpacity * 100
                                        : parseFloat(extrusionOpacity as unknown as string) * 100
                                    : prev.fill_extrusion_opacity,
                            fill_extrusion_height:
                                typeof height === "number"
                                    ? height
                                    : prev.fill_extrusion_height,
                            fill_extrusion_base:
                                typeof base === "number" ? base : prev.fill_extrusion_base,
                            fill_extrusion_vertical_gradient:
                                typeof verticalGradient === "boolean"
                                    ? verticalGradient
                                    : prev.fill_extrusion_vertical_gradient,
                        }));
                    }

                    // Heatmap paint
                    if (layer.type === "heatmap") {
                        const intensity = layer.paint[
                            "heatmap-intensity" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const radius = layer.paint[
                            "heatmap-radius" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const op = layer.paint[
                            "heatmap-opacity" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const color = layer.paint[
                            "heatmap-color" as keyof typeof layer.paint
                        ] as any;

                        const stops: [number, string][] = [];
                        if (color && Array.isArray(color) && color[0] === "interpolate") {
                            // color looks like ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "blue", ...]
                            for (let i = 3; i < color.length; i += 2) {
                                if (typeof color[i] === "number" && typeof color[i + 1] === "string") {
                                    stops.push([color[i], color[i + 1]]);
                                }
                            }
                        }

                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            heatmap_intensity:
                                typeof intensity === "number"
                                    ? intensity
                                    : prev.heatmap_intensity,
                            heatmap_radius:
                                typeof radius === "number" ? radius : prev.heatmap_radius,
                            heatmap_opacity:
                                op !== undefined
                                    ? typeof op === "number"
                                        ? op * 100
                                        : parseFloat(op as unknown as string) * 100
                                    : prev.heatmap_opacity,
                            heatmap_color_stops: stops.length > 0 ? stops : prev.heatmap_color_stops,
                        }));
                    }

                    // Hillshade paint
                    if (layer.type === "hillshade") {
                        const exaggeration = layer.paint[
                            "hillshade-exaggeration" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const shadow = layer.paint[
                            "hillshade-shadow-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const highlight = layer.paint[
                            "hillshade-highlight-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const accent = layer.paint[
                            "hillshade-accent-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const illumDir = layer.paint[
                            "hillshade-illumination-direction" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const illumAnchor = layer.paint[
                            "hillshade-illumination-anchor" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<string> | undefined;
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            hillshade_exaggeration:
                                typeof exaggeration === "number"
                                    ? exaggeration
                                    : prev.hillshade_exaggeration,
                            hillshade_shadow_color:
                                typeof shadow === "string"
                                    ? shadow
                                    : prev.hillshade_shadow_color,
                            hillshade_highlight_color:
                                typeof highlight === "string"
                                    ? highlight
                                    : prev.hillshade_highlight_color,
                            hillshade_accent_color:
                                typeof accent === "string"
                                    ? accent
                                    : prev.hillshade_accent_color,
                            hillshade_illumination_direction:
                                typeof illumDir === "number"
                                    ? illumDir
                                    : prev.hillshade_illumination_direction,
                            hillshade_illumination_anchor:
                                typeof illumAnchor === "string"
                                    ? (illumAnchor as "map" | "viewport")
                                    : prev.hillshade_illumination_anchor,
                        }));
                    }

                    // Raster extras
                    if (layer.type === "raster") {
                        const hue = layer.paint[
                            "raster-hue-rotate" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const fade = layer.paint[
                            "raster-fade-duration" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            raster_hue_rotate:
                                typeof hue === "number" ? hue : prev.raster_hue_rotate,
                            raster_fade_duration:
                                typeof fade === "number" ? fade : prev.raster_fade_duration,
                        }));
                    }

                    // Raster-particle (best-effort)
                    if (layer.type === "raster-particle") {
                        const rpOpacity = layer.paint[
                            "raster-particle-opacity" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const rpColor = layer.paint[
                            "raster-particle-color" as keyof typeof layer.paint
                        ] as
                            | DataDrivenPropertyValueSpecification<ColorSpecification>
                            | undefined;
                        const rpSpeed = layer.paint[
                            "raster-particle-speed" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        const rpFade = layer.paint[
                            "raster-particle-fade-amount" as keyof typeof layer.paint
                        ] as DataDrivenPropertyValueSpecification<number> | undefined;
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            raster_particle_opacity:
                                rpOpacity !== undefined
                                    ? typeof rpOpacity === "number"
                                        ? rpOpacity * 100
                                        : parseFloat(rpOpacity as unknown as string) * 100
                                    : prev.raster_particle_opacity,
                            raster_particle_color:
                                typeof rpColor === "string"
                                    ? rpColor
                                    : prev.raster_particle_color,
                            raster_particle_speed:
                                typeof rpSpeed === "number"
                                    ? rpSpeed
                                    : prev.raster_particle_speed,
                            raster_particle_fade_amount:
                                typeof rpFade === "number"
                                    ? rpFade
                                    : prev.raster_particle_fade_amount,
                        }));
                    }

                    // Model paint
                    if (layer.type === "model") {
                        const mColor = layer.paint["model-color" as keyof typeof layer.paint] as any;
                        const mOpacity = layer.paint["model-opacity" as keyof typeof layer.paint] as any;
                        const mEmissive = layer.paint["model-emissive-strength" as keyof typeof layer.paint] as any;
                        const mRotation = layer.paint["model-rotation" as keyof typeof layer.paint] as any;
                        const mScale = layer.paint["model-scale" as keyof typeof layer.paint] as any;

                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            model_color: typeof mColor === "string" ? mColor : prev.model_color,
                            model_opacity: typeof mOpacity === "number" ? mOpacity * 100 : prev.model_opacity,
                            model_emissive_strength: typeof mEmissive === "number" ? mEmissive : prev.model_emissive_strength,
                            model_rotation: Array.isArray(mRotation) ? mRotation : prev.model_rotation,
                            model_scale: Array.isArray(mScale) ? mScale : prev.model_scale,
                        }));
                    }
                }
            }
        }
    };

    // Build default or custom heatmap color expression
    const buildHeatmapColorExpr = (customStops?: Array<[number, string]>): any => {
        const stops = customStops ?? mapboxLayerStyle.heatmap_color_stops ?? [];
        if (!stops.length) {
            return [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(0,0,255,0)",
                0.2,
                "rgba(0,255,255,0.5)",
                0.4,
                "rgba(0,255,0,0.7)",
                0.6,
                "rgba(255,255,0,0.9)",
                1,
                "rgba(255,0,0,1)",
            ];
        }
        return [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            ...stops.flatMap(([s, c]) => [s, c]),
        ];
    };

    // Convert Circle visualization to Standard/Marker/Heatmap
    const convertCircleVisualization = (
        mode: "standard" | "marker" | "heatmap"
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer) return;
        const layerId = selectedLayer.id;
        const symbolLayerId = `${layerId}-symbol`;
        const orig = map.getLayer(layerId) as any;
        if (!orig) return;
        const source = orig?.source;
        const sourceLayer = orig?.["source-layer"];
        const filter = orig?.filter;
        const minzoom = orig?.minzoom;
        const maxzoom = orig?.maxzoom;

        // Cleanup companion if exists
        if (map.getLayer(symbolLayerId)) {
            map.removeLayer(symbolLayerId);
        }
        map.removeLayer(layerId);

        if (mode === "standard") {
            // Main circle layer
            const spec: any = {
                id: layerId,
                type: "circle",
                source,
                paint: {
                    "circle-color": mapboxLayerStyle.fill ?? "#3388ff",
                    "circle-radius": mapboxLayerStyle.circle_radius ?? 6,
                    "circle-stroke-color": mapboxLayerStyle.stroke ?? "#000000",
                    "circle-stroke-width": mapboxLayerStyle.stroke_width ?? 1,
                    "circle-opacity": (mapboxLayerStyle.opacity ?? 100) / 100,
                },
                layout: {
                    visibility: mapboxLayerStyle.visibility ?? "visible",
                }
            };
            if (sourceLayer) spec["source-layer"] = sourceLayer;
            if (filter) spec.filter = filter;
            if (minzoom !== undefined) spec.minzoom = minzoom;
            if (maxzoom !== undefined) spec.maxzoom = maxzoom;
            map.addLayer(spec);

            // Companion symbol layer
            const symSpec: any = {
                id: symbolLayerId,
                type: "symbol",
                source,
                layout: {
                    "text-field": mapboxLayerStyle.text_field || "",
                    "text-size": mapboxLayerStyle.text_size ?? 16,
                    "icon-image": mapboxLayerStyle.icon_image || "",
                    "icon-size": mapboxLayerStyle.icon_size ?? 1,
                    visibility: mapboxLayerStyle.visibility ?? "visible",
                    "text-allow-overlap": mapboxLayerStyle.text_allow_overlap ?? false,
                    "icon-allow-overlap": mapboxLayerStyle.icon_allow_overlap ?? false,
                },
                paint: {
                    "text-color": mapboxLayerStyle.text_color ?? "#000000",
                    "icon-color": mapboxLayerStyle.icon_color ?? "#000000",
                },
            };
            if (sourceLayer) symSpec["source-layer"] = sourceLayer;
            if (filter) symSpec.filter = filter;
            if (minzoom !== undefined) symSpec.minzoom = minzoom;
            if (maxzoom !== undefined) symSpec.maxzoom = maxzoom;
            map.addLayer(symSpec);

            setLayerType("circle");
            setCircleViz("standard");
            return;
        }

        if (mode === "marker") {
            const spec: any = {
                id: layerId,
                type: "symbol",
                source,
                layout: {
                    "text-field": mapboxLayerStyle.text_field || "",
                    "text-size": mapboxLayerStyle.text_size ?? 16,
                    "icon-image": mapboxLayerStyle.icon_image || "",
                    "icon-size": mapboxLayerStyle.icon_size ?? 1,
                    visibility: mapboxLayerStyle.visibility ?? "visible",
                    "text-allow-overlap": mapboxLayerStyle.text_allow_overlap ?? false,
                    "icon-allow-overlap": mapboxLayerStyle.icon_allow_overlap ?? false,
                },
                paint: {
                    "text-color": mapboxLayerStyle.text_color ?? "#000000",
                    "icon-color": mapboxLayerStyle.icon_color ?? "#000000",
                },
            };
            if (sourceLayer) spec["source-layer"] = sourceLayer;
            if (filter) spec.filter = filter;
            if (minzoom !== undefined) spec.minzoom = minzoom;
            if (maxzoom !== undefined) spec.maxzoom = maxzoom;
            map.addLayer(spec);
            setLayerType("symbol");
            setCircleViz("marker");
            return;
        }

        const defaultStops = mapboxLayerStyle.heatmap_color_stops?.length ? mapboxLayerStyle.heatmap_color_stops : HEATMAP_DEFAULT_STOPS;
        const spec: any = {
            id: layerId,
            type: "heatmap",
            source,
            paint: {
                "heatmap-intensity": mapboxLayerStyle.heatmap_intensity ?? 1,
                "heatmap-radius": mapboxLayerStyle.heatmap_radius ?? 20,
                "heatmap-opacity": (mapboxLayerStyle.heatmap_opacity ?? 100) / 100,
                "heatmap-color": buildHeatmapColorExpr(defaultStops),
            },
            layout: {
                visibility: mapboxLayerStyle.visibility ?? "visible",
            }
        };
        if (sourceLayer) spec["source-layer"] = sourceLayer;
        if (filter) spec.filter = filter;
        if (minzoom !== undefined) spec.minzoom = minzoom;
        if (maxzoom !== undefined) spec.maxzoom = maxzoom;
        map.addLayer(spec);

        // Update local state with stops so UI shows them
        setMapboxLayerStyle(prev => ({
            ...prev,
            heatmap_color_stops: defaultStops
        }));

        // Apply heatmap-weight from attribute if provided
        const heatmapWeightField = mapboxLayerStyle.heatmap_weight_field;
        const heatmapWeightMin = mapboxLayerStyle.heatmap_weight_min ?? 0;
        const heatmapWeightMax = mapboxLayerStyle.heatmap_weight_max ?? 1;

        if (heatmapWeightField && typeof heatmapWeightField === "string") {
            const expr: any = [
                "interpolate",
                ["linear"],
                ["coalesce", ["to-number", ["get", heatmapWeightField]], 0],
                heatmapWeightMin,
                0,
                heatmapWeightMax,
                1,
            ];
            map.setPaintProperty(layerId, "heatmap-weight", expr);
        }
        setLayerType("heatmap");
        setCircleViz("heatmap");
    };

    useEffect(() => {
        getStyleLayer();
    }, [selectedLayer]);

    if (!selectedLayer?.id) return null;

    const setPaint = (
        paint_property: string,
        value: string | number | number[] | boolean | undefined | null | any
    ) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map && value !== undefined && value !== null) {
            const layerId = selectedLayer.id;
            const type = map.getLayer(layerId)?.type;

            // Check for companion layer
            const symbolLayerId = `${layerId}-symbol`;

            // Ensure companion if needed
            if (paint_property.startsWith("text-") || paint_property.startsWith("icon-")) {
                if (type === "circle" && !map.getLayer(symbolLayerId)) {
                    // Trigger setLayout with something light to ensure companion
                    setLayout("text-allow-overlap", false);
                }
            }

            const hasSymbolCompanion = map.getLayer(symbolLayerId);

            if (type) {
                // If it's a generic property like visibility or opacity, apply to both
                if (paint_property === "-opacity" || paint_property === "visibility") {
                    const prop = paint_property.startsWith("-") ? (type + paint_property) : paint_property;
                    map.setPaintProperty(layerId, prop as any, value);
                    if (hasSymbolCompanion) {
                        const symType = map.getLayer(symbolLayerId)?.type;
                        const symProp = paint_property.startsWith("-") ? (symType + paint_property) : paint_property;
                        map.setPaintProperty(symbolLayerId, symProp as any, value);
                    }
                    return;
                }

                // If it's symbol specific
                if (hasSymbolCompanion && (paint_property.startsWith("text-") || paint_property.startsWith("icon-"))) {
                    map.setPaintProperty(symbolLayerId, paint_property as any, value);
                    return;
                }

                // Normal application
                const paintProp = paint_property.startsWith("-") ? (type + paint_property) : paint_property;
                map.setPaintProperty(layerId, paintProp as any, value as any);
            }
        }
    };

    const setLayout = (
        layout_property: string,
        value: string | number | number[] | boolean | undefined | null | any
    ) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map && value !== undefined && value !== null) {
            const layerId = selectedLayer.id;
            const symbolLayerId = `${layerId}-symbol`;

            // Ensure companion if it's a symbol property but we are on a circle layer
            if (layout_property.startsWith("text-") || layout_property.startsWith("icon-") || layout_property.startsWith("symbol-")) {
                const type = map.getLayer(layerId)?.type;
                if (type === "circle" && !map.getLayer(symbolLayerId)) {
                    // Create companion layer
                    const orig = map.getLayer(layerId) as any;
                    const source = orig?.source;
                    const sourceLayer = orig?.["source-layer"];
                    const filter = orig?.filter;

                    const symSpec: any = {
                        id: symbolLayerId,
                        type: "symbol",
                        source,
                        layout: {
                            visibility: map.getLayoutProperty(layerId, "visibility") ?? "visible",
                        },
                        paint: {},
                    };
                    if (sourceLayer) symSpec["source-layer"] = sourceLayer;
                    if (filter) symSpec.filter = filter;
                    map.addLayer(symSpec);
                }
            }

            const hasSymbolCompanion = map.getLayer(symbolLayerId);

            // Special handling for visibility (layout property)
            if (layout_property === "visibility") {
                map.setLayoutProperty(layerId, "visibility", value as any);
                if (hasSymbolCompanion) {
                    map.setLayoutProperty(symbolLayerId, "visibility", value as any);
                }
                return;
            }

            // If it's a text-* or icon-* or symbol-* property and we have a companion, apply to companion
            if (hasSymbolCompanion && (layout_property.startsWith("text-") || layout_property.startsWith("icon-") || layout_property.startsWith("symbol-"))) {
                map.setLayoutProperty(symbolLayerId, layout_property as any, value as any);
                return;
            }

            // Normal application
            map.setLayoutProperty(layerId, layout_property as any, value as any);
        }
    };

    const setFill = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill: value });
        setPaint("-color", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill: value }
            });
        }
    };

    const setStroke = (value: string) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            const type = map.getLayer(layerId)?.type;
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke: value });
            if (type === "fill") {
                setPaint("-outline-color", value);
            } else if (type === "circle") {
                setPaint("-stroke-color", value);
            } else if (type === "line") {
                // line layers use line-color for the stroke concept
                setPaint("-color", value);
            }
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, stroke: value }
            });
        }
    };

    const setStrokeWidth = (value: number) => {
        const map = mapRef?.current?.getMap();
        const type =
            selectedLayer && map ? map.getLayer(selectedLayer.id)?.type : undefined;
        if (type === "circle") {
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: value });
            setPaint("-stroke-width", value);
            if (selectedLayer?.id) {
                updateLayerConfig(selectedLayer.id, {
                    staticStyles: { ...config.staticStyles, stroke_width: value }
                });
            }
        } else if (type === "line") {
            setMapboxLayerStyle({ ...mapboxLayerStyle, line_width: value });
            // for line layers, width property is line-width
            setPaint("-width", value);
            if (selectedLayer?.id) {
                updateLayerConfig(selectedLayer.id, {
                    staticStyles: { ...config.staticStyles, line_width: value }
                });
            }
        }
    };

    const setContrast = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, contrast: value });
        setPaint("-contrast", value / 100);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, contrast: value }
            });
        }
    };

    const setSaturation = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, saturation: value });
        setPaint("-saturation", value / 100);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, saturation: value }
            });
        }
    };

    const setBrightness = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, brightness: values });
        setPaint("-brightness-min", values[0]);
        setPaint("-brightness-max", values[1]);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, brightness: values as [number, number] }
            });
        }
    };

    const handleZoomChange = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, zoom: values });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            map.setLayerZoomRange(layerId, values[0], values[1]);
            if (selectedLayer?.id) {
                updateLayerConfig(selectedLayer.id, {
                    staticStyles: { ...config.staticStyles, zoom: values as [number, number] }
                });
            }
        }
    };

    const setOpacity = (value: number) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer) {
            const layerId = selectedLayer.id;
            const type = map?.getLayer(layerId)?.type;
            const val = value / 100;
            setMapboxLayerStyle({ ...mapboxLayerStyle, opacity: value ?? 0 });
            setPaint("-opacity", val);
            if (type == "circle") {
                setPaint("-stroke-opacity", val);
            }
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, opacity: value }
            });
        }
    };

    const resetFill = () => {
        const defaultColor = "#000000";
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill: defaultColor });
        setPaint("-color", defaultColor);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill: defaultColor }
            });
        }
    };

    const resetStroke = () => {
        const map = mapRef?.current?.getMap();
        const defaultColor = "#000000";
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            const type = map.getLayer(layerId)?.type;
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke: defaultColor });
            if (type === "fill") {
                setPaint("-outline-color", defaultColor);
            } else if (type === "line") {
                setPaint("-color", defaultColor);
            } else {
                setPaint("-stroke-color", defaultColor);
            }
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, stroke: defaultColor }
            });
        }
    };

    const resetStrokeWidth = () => {
        const map = mapRef?.current?.getMap();
        const type =
            selectedLayer && map ? map.getLayer(selectedLayer.id)?.type : undefined;
        if (type === "circle") {
            const strokeWidth = 0;
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: strokeWidth });
            setPaint("-stroke-width", strokeWidth);
            if (selectedLayer?.id) {
                updateLayerConfig(selectedLayer.id, {
                    staticStyles: { ...config.staticStyles, stroke_width: strokeWidth }
                });
            }
        } else if (type === "line") {
            const lineWidth = 0;
            setMapboxLayerStyle({ ...mapboxLayerStyle, line_width: lineWidth });
            setPaint("-width", lineWidth);
            if (selectedLayer?.id) {
                updateLayerConfig(selectedLayer.id, {
                    staticStyles: { ...config.staticStyles, line_width: lineWidth }
                });
            }
        }
    };

    const resetContrast = () => {
        const contrast = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, contrast: contrast });
        setPaint("-contrast", contrast);
    };

    const resetSaturation = () => {
        const saturation = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, saturation: saturation });
        setPaint("-saturation", saturation);
    };

    const resetBrightness = () => {
        const brightness = 0;
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            brightness: [brightness, brightness],
        });
        setPaint("-brightness-min", brightness);
        setPaint("-brightness-max", brightness);
    };

    // Line specific setters
    const setLineWidth = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, line_width: value });
        setPaint("-width", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, line_width: value }
            });
        }
    };

    const setLineDasharray = (dash?: number[]) => {
        const arr = dash ?? [];
        setMapboxLayerStyle({ ...mapboxLayerStyle, line_dasharray: arr });
        setPaint("-dasharray", arr);
    };

    // Circle specific setters
    const setCircleRadius = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, circle_radius: value });
        setPaint("-radius", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, circle_radius: value }
            });
        }
    };

    // Model specific setters
    const setModelColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, model_color: value });
        setPaint("-color", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, model_color: value }
            });
        }
    };

    const setModelOpacity = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, model_opacity: value });
        setPaint("-opacity", value / 100);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, model_opacity: value }
            });
        }
    };

    const setModelEmissiveStrength = (value: number) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            model_emissive_strength: value,
        });
        setPaint("-emissive-strength", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, model_emissive_strength: value }
            });
        }
    };

    const setModelRotation = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, model_rotation: values });
        setPaint("-rotation", values);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, model_rotation: values }
            });
        }
    };

    const setModelScale = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, model_scale: values });
        setPaint("-scale", values);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, model_scale: values }
            });
        }
    };

    // Symbol specific setters
    const setSymbolTextColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, text_color: value });
        setPaint("text-color", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, text_color: value }
            });
        }
    };
    const setSymbolIconColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, icon_color: value });
        setPaint("icon-color", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, icon_color: value }
            });
        }
    };
    const setSymbolTextSize = (value: number) => {
        const layerId = selectedLayer?.id;
        if (!layerId) return;
        setMapboxLayerStyle({ ...mapboxLayerStyle, text_size: value });
        setLayout("text-size", value);
        updateLayerConfig(layerId, {
            staticStyles: { ...config.staticStyles, text_size: value }
        });
    };

    const setSymbolIconSize = (value: number) => {
        const layerId = selectedLayer?.id;
        if (!layerId) return;
        setMapboxLayerStyle({ ...mapboxLayerStyle, icon_size: value });
        setLayout("icon-size", value);
        updateLayerConfig(layerId, {
            staticStyles: { ...config.staticStyles, icon_size: value }
        });
    };

    // Fill-extrusion setters
    const setFillExtrusionColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_color: value });
        setPaint("-color", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill_extrusion_color: value }
            });
        }
    };
    const setFillExtrusionOpacity = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_opacity: value });
        setPaint("-opacity", value / 100);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill_extrusion_opacity: value }
            });
        }
    };
    const setFillExtrusionHeight = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_height: value });
        setPaint("-height", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill_extrusion_height: value }
            });
        }
    };
    const setFillExtrusionBase = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_base: value });
        setPaint("-base", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill_extrusion_base: value }
            });
        }
    };
    const setFillExtrusionVerticalGradient = (value: boolean) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            fill_extrusion_vertical_gradient: value,
        });
        setPaint("-vertical-gradient", value);
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, fill_extrusion_vertical_gradient: value }
            });
        }
    };

    // Heatmap setters
    const setHeatmapIntensity = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_intensity: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "heatmap-intensity", value);
        }
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, heatmap_intensity: value }
            });
        }
    };
    const setHeatmapRadius = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_radius: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "heatmap-radius", value);
        }
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, heatmap_radius: value }
            });
        }
    };
    const setHeatmapOpacity = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_opacity: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "heatmap-opacity", value / 100);
        }
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, heatmap_opacity: value }
            });
        }
    };
    // Set heatmap-weight from a chosen attribute with normalization
    const setHeatmapWeightFromField = (
        field?: string,
        min?: number,
        max?: number
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer) return;

        const layerConfig = getLayerConfig(selectedLayer.id);
        const f = (field ?? layerConfig.heatmapWeightField)?.trim();
        if (!f) return;

        const minV = min ?? layerConfig.heatmapWeightMin;
        const maxV = max ?? layerConfig.heatmapWeightMax;
        const expr: any = [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", f]], 0],
            minV,
            0,
            maxV,
            1,
        ];
        map.setPaintProperty(selectedLayer.id, "heatmap-weight", expr);
    };
    const applyHeatmapColorStops = (stops: Array<[number, string]>) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_color_stops: stops });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const expr: any = ["interpolate", ["linear"], ["heatmap-density"]];
            for (const [stop, color] of stops) {
                expr.push(stop, color);
            }
            map.setPaintProperty(selectedLayer.id, "heatmap-color", expr);
        }
        if (selectedLayer?.id) {
            updateLayerConfig(selectedLayer.id, {
                staticStyles: { ...config.staticStyles, heatmap_color_stops: stops }
            });
        }
    };

    // Helper to guard against NaN and invalid numbers
    const numOr = (val: any, fallback: number): number =>
        typeof val === "number" && Number.isFinite(val) ? val : fallback;

    // Apply Circle radius by attribute
    const applyCircleRadiusByField = (
        field?: string,
        inMin?: number,
        inMax?: number,
        outMin?: number,
        outMax?: number
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer) return;

        const layerConfig = getLayerConfig(selectedLayer.id);
        const f = (field ?? layerConfig.radiusField)?.trim();
        if (!f) return;

        const iMin = numOr(inMin ?? layerConfig.radiusValueMin, 0);
        const iMax = numOr(inMax ?? layerConfig.radiusValueMax, 100);
        const oMin = numOr(outMin ?? layerConfig.radiusMin, 2);
        const oMax = numOr(outMax ?? layerConfig.radiusMax, 12);

        const expr: any = [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", f]], 0],
            iMin,
            oMin,
            iMax,
            oMax,
        ];
        map.setPaintProperty(selectedLayer.id, "circle-radius", expr);
    };

    // Apply Symbol text-size by attribute
    const applySymbolTextSizeByField = (
        field?: string,
        inMin?: number,
        inMax?: number,
        outMin?: number,
        outMax?: number
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer) return;

        const layerConfig = getLayerConfig(selectedLayer.id);
        const f = (field ?? layerConfig.symbolTextSizeField)?.trim();
        if (!f) return;

        const iMin = numOr(inMin ?? layerConfig.symbolTextValueMin, 0);
        const iMax = numOr(inMax ?? layerConfig.symbolTextValueMax, 100);
        const oMin = numOr(outMin ?? layerConfig.symbolTextSizeMin, 12);
        const oMax = numOr(outMax ?? layerConfig.symbolTextSizeMax, 24);

        const expr: any = [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", f]], 0],
            iMin,
            oMin,
            iMax,
            oMax,
        ];
        map.setLayoutProperty(selectedLayer.id, "text-size", expr);
    };

    // Apply Symbol icon-size by attribute
    const applySymbolIconSizeByField = (
        field?: string,
        inMin?: number,
        inMax?: number,
        outMin?: number,
        outMax?: number
    ) => {
        const map = mapRef?.current?.getMap();
        if (!map || !selectedLayer) return;

        const layerConfig = getLayerConfig(selectedLayer.id);
        const f = (field ?? layerConfig.symbolIconSizeField)?.trim();
        if (!f) return;

        const iMin = numOr(inMin ?? layerConfig.symbolIconValueMin, 0);
        const iMax = numOr(inMax ?? layerConfig.symbolIconValueMax, 100);
        const oMin = numOr(outMin ?? layerConfig.symbolIconSizeMin, 0.5);
        const oMax = numOr(outMax ?? layerConfig.symbolIconSizeMax, 2);

        const expr: any = [
            "interpolate",
            ["linear"],
            ["coalesce", ["to-number", ["get", f]], 0],
            iMin,
            oMin,
            iMax,
            oMax,
        ];
        map.setLayoutProperty(selectedLayer.id, "icon-size", expr);
    };

    // Hillshade setters
    const setHillshadeExaggeration = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, hillshade_exaggeration: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "hillshade-exaggeration", value);
        }
    };
    const setHillshadeShadowColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, hillshade_shadow_color: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "hillshade-shadow-color", value);
        }
    };
    const setHillshadeHighlightColor = (value: string) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            hillshade_highlight_color: value,
        });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(
                selectedLayer.id,
                "hillshade-highlight-color",
                value
            );
        }
    };
    const setHillshadeAccentColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, hillshade_accent_color: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "hillshade-accent-color", value);
        }
    };
    const setHillshadeIlluminationDirection = (value: number) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            hillshade_illumination_direction: value,
        });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(
                selectedLayer.id,
                "hillshade-illumination-direction",
                value
            );
        }
    };
    const setHillshadeIlluminationAnchor = (value: "map" | "viewport") => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            hillshade_illumination_anchor: value,
        });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(
                selectedLayer.id,
                "hillshade-illumination-anchor",
                value
            );
        }
    };

    // Raster extras setters
    const setRasterHueRotate = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, raster_hue_rotate: value });
        setPaint("-hue-rotate", value);
    };
    const setRasterFadeDuration = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, raster_fade_duration: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "raster-fade-duration", value);
        }
    };

    // Raster-particle setters (best-effort)
    const setRasterParticleOpacity = (value: number) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            raster_particle_opacity: value,
        });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(
                selectedLayer.id,
                "raster-particle-opacity" as any,
                value / 100
            );
        }
    };
    const setRasterParticleSpeed = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, raster_particle_speed: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "raster-particle-speed" as any, value);
        }
    };
    const setRasterParticleFadeAmount = (value: number) => {
        setMapboxLayerStyle({
            ...mapboxLayerStyle,
            raster_particle_fade_amount: value,
        });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(
                selectedLayer.id,
                "raster-particle-fade-amount" as any,
                value
            );
        }
    };
    const setRasterParticleColor = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, raster_particle_color: value });
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            map.setPaintProperty(selectedLayer.id, "raster-particle-color" as any, value);
        }
    };

    // Expression builders
    const applyCategoricalColor = (
        field: string,
        pairs: Array<[string, string]>,
        defaultColor: string,
        target?: "text" | "icon",
        propertyOverride?: string
    ) => {
        const expr: any = ["match", ["get", field]];
        for (const [val, color] of pairs) {
            expr.push(val, color);
        }
        expr.push(defaultColor);
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const type = map.getLayer(selectedLayer.id)?.type;
            let property = "";
            if (type === "fill") property = "fill-color";
            else if (type === "line") property = "line-color";
            else if (type === "circle") property = "circle-color";
            else if (type === "heatmap") property = "heatmap-color";
            else if (type === "symbol")
                property = target === "icon" ? "icon-color" : "text-color";
            else if (type === "raster")
                property = "raster-color"; // not standard, skip
            else if (type === "fill-extrusion") property = "fill-extrusion-color";
            else if (type === "hillshade") property = "hillshade-shadow-color";
            if (property || propertyOverride) {
                map.setPaintProperty(selectedLayer.id, (propertyOverride || property) as any, expr);
            }
        }
    };
    const applyGradientByField = (
        field: string,
        stops: Array<[number, string]>,
        propertyOverride?: string
    ) => {
        const expr: any = ["interpolate", ["linear"], ["get", field]];
        for (const [stop, color] of stops) expr.push(stop, color);
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const type = map.getLayer(selectedLayer.id)?.type;
            const property = propertyOverride
                ? propertyOverride
                : type === "fill"
                    ? "fill-color"
                    : type === "line"
                        ? "line-color"
                        : type === "circle"
                            ? "circle-color"
                            : type === "fill-extrusion"
                                ? "fill-extrusion-color"
                                : type === "symbol"
                                    ? "text-color"
                                    : "";
            if (property) {
                map.setPaintProperty(selectedLayer.id, property as any, expr);
            }
        }
    };

    return (
        <>
            <div className="flex items-center justify-center gap-1 border-b border-t pt-2 px-4 pb-2 mt-2">
                <Toggle
                    size="sm"
                    aria-label="Toggle italic"
                    onClick={handleEditFeatures}
                >
                    <PenIcon />
                </Toggle>
                <Toggle size="sm" aria-label="Toggle layout">
                    <Table2Icon />
                </Toggle>
                <Toggle
                    size="sm"
                    aria-label="Legend"
                    onClick={() => {
                        setDisplayLayouts({ legend: true });
                    }}
                >
                    <ImagesIcon />
                </Toggle>
            </div>

            <ScrollArea className="max-h-[70vh] overflow-y-scroll">
                <div className="grid gap-4 pt-4">
                    {/* Global Opacity */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Opacity</Label>
                            <span className="text-xs text-muted-foreground">
                                {mapboxLayerStyle.opacity}%
                            </span>
                        </div>
                        <Slider
                            value={[mapboxLayerStyle.opacity ?? 100]}
                            onValueChange={([opacity]) => {
                                setMapboxLayerStyle({ ...mapboxLayerStyle, opacity });
                                setOpacity(opacity);
                            }}
                            max={100}
                            step={1}
                            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                        />
                    </div>

                    {/* Zoom Visibility */}
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Zoom Visibility</Label>
                            <span className="text-xs text-muted-foreground">
                                {mapboxLayerStyle.zoom?.[0] ?? 0} - {mapboxLayerStyle.zoom?.[1] ?? 24}
                            </span>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={mapboxLayerStyle.zoom?.[0] ?? 0}
                                className="h-7 text-xs"
                                max={24}
                                min={0}
                                step={0.1}
                                onChange={(e) => {
                                    const newZoom = Number(e.target.value);
                                    setMapboxLayerStyle({
                                        ...mapboxLayerStyle,
                                        zoom: [newZoom, mapboxLayerStyle.zoom?.[1] ?? 24],
                                    });
                                    handleZoomChange([
                                        newZoom,
                                        mapboxLayerStyle.zoom?.[1] ?? 24,
                                    ]);
                                }}
                            />
                            <span className="text-xs text-muted-foreground">-</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={mapboxLayerStyle.zoom?.[1] ?? 24}
                                className="h-7 text-xs"
                                max={24}
                                min={0}
                                step={0.1}
                                onChange={(e) => {
                                    const newZoom = Number(e.target.value);
                                    setMapboxLayerStyle({
                                        ...mapboxLayerStyle,
                                        zoom: [mapboxLayerStyle.zoom?.[0] ?? 0, newZoom],
                                    });
                                    handleZoomChange([
                                        mapboxLayerStyle.zoom?.[0] ?? 0,
                                        newZoom,
                                    ]);
                                }}
                            />
                        </div>
                        <Slider
                            value={mapboxLayerStyle.zoom ?? [0, 24]}
                            min={0}
                            max={24}
                            step={0.1}
                            className="mt-1 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                            onValueChange={(zoom) => {
                                setMapboxLayerStyle({ ...mapboxLayerStyle, zoom });
                                handleZoomChange(zoom);
                            }}
                        />
                    </div>
                    <Accordion type="single" collapsible defaultValue="styling" className="w-full">
                        <AccordionItem value="styling">
                            <AccordionTrigger className="text-sm font-semibold">Styling</AccordionTrigger>
                            <AccordionContent className="pt-2">
                                <div className="grid gap-4 px-1">
                                    {/* Visualization selector for point-like layers */}
                                    {(layerType === "circle" ||
                                        layerType === "symbol" ||
                                        layerType === "heatmap") && (
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Visualization</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-[10px] text-muted-foreground">Visible</Label>
                                                        <Switch
                                                            checked={mapboxLayerStyle.visibility !== "none"}
                                                            onCheckedChange={(checked) => {
                                                                const val = checked ? "visible" : "none";
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, visibility: val });
                                                                setLayout("visibility", val);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <Select
                                                    value={circleViz}
                                                    onValueChange={(v) => {
                                                        const val = v as "standard" | "marker" | "heatmap";
                                                        setCircleViz(val);
                                                        convertCircleVisualization(val);
                                                    }}
                                                >
                                                    <SelectTrigger className="h-8">
                                                        <SelectValue placeholder="Select visualization" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="standard">Standard (Circle + Label)</SelectItem>
                                                        <SelectItem value="marker">Marker (Label only)</SelectItem>
                                                        <SelectItem value="heatmap">Heatmap</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}


                                    {/* Fill Layer Controls */}
                                    {layerType === "fill" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Fill</Label>
                                                    <Toggle
                                                        size="sm"
                                                        pressed={config.fillColorMode === "attribute"}
                                                        onPressedChange={(pressed) =>
                                                            selectedLayer?.id && updateLayerConfig(selectedLayer.id, { fillColorMode: pressed ? "attribute" : "static" })
                                                        }
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Toggle>
                                                </div>
                                                {config.fillColorMode === "static" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.fill}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={mapboxLayerStyle.fill}
                                                                className="font-mono h-8"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                            {mapboxLayerStyle.fill != "#000000" && (
                                                                <Button
                                                                    className="absolute right-0 top-0 h-8"
                                                                    variant={"ghost"}
                                                                    onClick={(e) => resetFill()}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <FieldSelect
                                                                    fields={availableFields}
                                                                    value={config.fillColorField}
                                                                    onChange={(val) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { fillColorField: val });
                                                                            handleAutoGenerateColors("fill", val);
                                                                            setPaletteVersion(prev => prev + 1);
                                                                        }
                                                                    }}
                                                                    className="h-8 text-xs flex-1"
                                                                />
                                                                <Input
                                                                    placeholder="Default Color"
                                                                    className="h-8 text-xs w-24"
                                                                    value={config.fillColorDefault}
                                                                    onChange={(e) => selectedLayer?.id && updateLayerConfig(selectedLayer.id, { fillColorDefault: e.target.value })}
                                                                />
                                                            </div>
                                                            <GradientPalettePicker
                                                                onPaletteSelect={(colors) => {
                                                                    if (config.fillColorField) {
                                                                        handleAutoGenerateColors("fill", config.fillColorField, colors);
                                                                        setPaletteVersion(prev => prev + 1);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <DynamicFields
                                                            key={`fill-${selectedLayer?.id}-${config.fillColorField}-${paletteVersion}`}
                                                            title="Color Stops"
                                                            description={`${config.fillColorItems.length} categories`}
                                                            addButtonLabel="Add Stop"
                                                            fields={[
                                                                { id: "value", name: "value", type: "text" },
                                                                { id: "color", name: "color", type: "color" },
                                                            ]}
                                                            initialData={config.fillColorItems as any}
                                                            onDataChange={(data) => {
                                                                updateLayerConfig(selectedLayer.id, { fillColorItems: data as any });
                                                                const pairs: Array<[string, string]> = (data as any).map((item: any) => [
                                                                    String(item.value ?? ""),
                                                                    String(item.color ?? "#000000"),
                                                                ]);
                                                                applyCategoricalColor(config.fillColorField, pairs, config.fillColorDefault, undefined, "fill-color");
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Stroke</Label>
                                                    <Toggle
                                                        size="sm"
                                                        pressed={config.strokeColorMode === "attribute"}
                                                        onPressedChange={(pressed) =>
                                                            selectedLayer?.id && updateLayerConfig(selectedLayer.id, { strokeColorMode: pressed ? "attribute" : "static" })
                                                        }
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Toggle>
                                                </div>
                                                {config.strokeColorMode === "static" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.stroke}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        stroke: e.target.value,
                                                                    });
                                                                    setStroke(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={mapboxLayerStyle.stroke}
                                                                className="font-mono h-8"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        stroke: e.target.value,
                                                                    });
                                                                    setStroke(e.target.value);
                                                                }}
                                                            />
                                                            {mapboxLayerStyle.stroke != "#000000" && (
                                                                <Button
                                                                    className="absolute right-0 top-0 h-8"
                                                                    variant={"ghost"}
                                                                    onClick={(e) => resetStroke()}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <FieldSelect
                                                                    fields={availableFields}
                                                                    value={config.strokeColorField}
                                                                    onChange={(val) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { strokeColorField: val });
                                                                            handleAutoGenerateColors("stroke", val);
                                                                            setPaletteVersion(prev => prev + 1);
                                                                        }
                                                                    }}
                                                                    className="h-8 text-xs flex-1"
                                                                />
                                                                <Input
                                                                    placeholder="Default Color"
                                                                    className="h-8 text-xs w-24"
                                                                    value={config.strokeColorDefault}
                                                                    onChange={(e) => selectedLayer?.id && updateLayerConfig(selectedLayer.id, { strokeColorDefault: e.target.value })}
                                                                />
                                                            </div>
                                                            <GradientPalettePicker
                                                                onPaletteSelect={(colors) => {
                                                                    if (config.strokeColorField) {
                                                                        handleAutoGenerateColors("stroke", config.strokeColorField, colors);
                                                                        setPaletteVersion(prev => prev + 1);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <DynamicFields
                                                            key={`stroke-${selectedLayer?.id}-${config.strokeColorField}-${paletteVersion}`}
                                                            title="Color Stops"
                                                            description={`${config.strokeColorItems.length} categories`}
                                                            addButtonLabel="Add Stop"
                                                            fields={[
                                                                { id: "value", name: "value", type: "text" },
                                                                { id: "color", name: "color", type: "color" },
                                                            ]}
                                                            initialData={config.strokeColorItems as any}
                                                            onDataChange={(data) => {
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, { strokeColorItems: data as any });
                                                                    const pairs: Array<[string, string]> = (data as any).map((item: any) => [
                                                                        String(item.value ?? ""),
                                                                        String(item.color ?? "#000000"),
                                                                    ]);
                                                                    applyCategoricalColor(config.strokeColorField, pairs, config.strokeColorDefault, undefined, "fill-outline-color");
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Line Layer Controls */}
                                    {layerType === "line" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Line Color</Label>
                                                    <Toggle
                                                        size="sm"
                                                        pressed={config.lineColorMode === "attribute"}
                                                        onPressedChange={(pressed) =>
                                                            selectedLayer?.id && updateLayerConfig(selectedLayer.id, { lineColorMode: pressed ? "attribute" : "static" })
                                                        }
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Toggle>
                                                </div>
                                                {config.lineColorMode === "static" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.fill}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={mapboxLayerStyle.fill}
                                                                className="font-mono h-8"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="flex gap-2 items-center">
                                                            <FieldSelect
                                                                fields={availableFields}
                                                                value={config.lineColorField}
                                                                onChange={(val) => {
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, { lineColorField: val });
                                                                        handleAutoGenerateColors("line", val);
                                                                    }
                                                                }}
                                                                className="h-8 text-xs flex-1"
                                                            />
                                                            <Input
                                                                placeholder="Default Color"
                                                                className="h-8 text-xs w-24"
                                                                value={config.lineColorDefault}
                                                                onChange={(e) => updateLayerConfig(selectedLayer.id, { lineColorDefault: e.target.value })}
                                                            />
                                                        </div>
                                                        <DynamicFields
                                                            title="Color Stops"
                                                            description={`${config.lineColorItems.length} categories`}
                                                            addButtonLabel="Add Stop"
                                                            fields={[
                                                                { id: "value", name: "value", type: "text" },
                                                                { id: "color", name: "color", type: "color" },
                                                            ]}
                                                            initialData={config.lineColorItems as any}
                                                            onDataChange={(data) => {
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, { lineColorItems: data as any });
                                                                    const pairs: Array<[string, string]> = (data as any).map((item: any) => [
                                                                        String(item.value ?? ""),
                                                                        String(item.color ?? "#000000"),
                                                                    ]);
                                                                    applyCategoricalColor(config.lineColorField, pairs, config.lineColorDefault, undefined, "line-color");
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            className="h-8"
                                                            onClick={() => selectedLayer?.id && applyCategoricalColor(
                                                                config.lineColorField,
                                                                config.lineColorItems.map(item => [item.value, item.color]),
                                                                config.lineColorDefault,
                                                                undefined,
                                                                "line-color"
                                                            )}
                                                        >
                                                            Apply Line Color
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Dasharray (contoh: 2,4)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={(mapboxLayerStyle.line_dasharray ?? []).join(
                                                            ","
                                                        )}
                                                        className="font-mono"
                                                        onChange={(e) => {
                                                            const raw = e.target.value.trim();
                                                            const arr = raw.length
                                                                ? raw
                                                                    .split(",")
                                                                    .map((v) => Number(v.trim()))
                                                                    .filter((n) => !Number.isNaN(n))
                                                                : [];
                                                            setLineDasharray(arr);
                                                        }}
                                                    />
                                                    {mapboxLayerStyle.line_dasharray &&
                                                        mapboxLayerStyle.line_dasharray.length > 0 && (
                                                            <Button
                                                                className=""
                                                                variant={"ghost"}
                                                                onClick={() => setLineDasharray([])}
                                                            >
                                                                <XIcon />
                                                            </Button>
                                                        )}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Line Width</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.line_width}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.line_width ?? 0]}
                                                    onValueChange={([line_width]) => {
                                                        setLineWidth(line_width);
                                                    }}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Circle Layer Controls */}
                                    {layerType === "circle" && circleViz !== "heatmap" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Fill</Label>
                                                    <Toggle
                                                        size="sm"
                                                        pressed={config.fillColorMode === "attribute"}
                                                        onPressedChange={(pressed) =>
                                                            selectedLayer?.id && updateLayerConfig(selectedLayer.id, { fillColorMode: pressed ? "attribute" : "static" })
                                                        }
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Toggle>
                                                </div>
                                                {config.fillColorMode === "static" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.fill}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={mapboxLayerStyle.fill}
                                                                className="font-mono h-8"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        fill: e.target.value,
                                                                    });
                                                                    setFill(e.target.value);
                                                                }}
                                                            />
                                                            {mapboxLayerStyle.fill != "#000000" && (
                                                                <Button
                                                                    className="absolute right-0 top-0 h-8"
                                                                    variant={"ghost"}
                                                                    onClick={(e) => resetFill()}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <FieldSelect
                                                                    fields={availableFields}
                                                                    value={config.fillColorField}
                                                                    onChange={(val) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { fillColorField: val });
                                                                            handleAutoGenerateColors("circle-fill", val);
                                                                            setPaletteVersion(prev => prev + 1);
                                                                        }
                                                                    }}
                                                                    className="h-8 text-xs flex-1"
                                                                />
                                                                <Input
                                                                    placeholder="Default Color"
                                                                    className="h-8 text-xs w-24"
                                                                    value={config.fillColorDefault}
                                                                    onChange={(e) => selectedLayer?.id && updateLayerConfig(selectedLayer.id, { fillColorDefault: e.target.value })}
                                                                />
                                                            </div>
                                                            <GradientPalettePicker
                                                                onPaletteSelect={(colors) => {
                                                                    if (config.fillColorField) {
                                                                        handleAutoGenerateColors("circle-fill", config.fillColorField, colors);
                                                                        setPaletteVersion(prev => prev + 1);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <DynamicFields
                                                            key={`circle-fill-${selectedLayer?.id}-${config.fillColorField}-${paletteVersion}`}
                                                            title="Color Stops"
                                                            description={`${config.fillColorItems.length} categories`}
                                                            addButtonLabel="Add Stop"
                                                            fields={[
                                                                { id: "value", name: "value", type: "text" },
                                                                { id: "color", name: "color", type: "color" },
                                                            ]}
                                                            initialData={config.fillColorItems as any}
                                                            onDataChange={(data) => {
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, { fillColorItems: data as any });
                                                                    const pairs: Array<[string, string]> = (data as any).map((item: any) => [
                                                                        String(item.value ?? ""),
                                                                        String(item.color ?? "#000000"),
                                                                    ]);
                                                                    applyCategoricalColor(config.fillColorField, pairs, config.fillColorDefault, undefined, "circle-color");
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Stroke</Label>
                                                    <Toggle
                                                        size="sm"
                                                        pressed={config.strokeColorMode === "attribute"}
                                                        onPressedChange={(pressed) =>
                                                            selectedLayer?.id && updateLayerConfig(selectedLayer.id, { strokeColorMode: pressed ? "attribute" : "static" })
                                                        }
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Toggle>
                                                </div>
                                                {config.strokeColorMode === "static" ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.stroke}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        stroke: e.target.value,
                                                                    });
                                                                    setStroke(e.target.value);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="relative flex-1">
                                                            <Input
                                                                value={mapboxLayerStyle.stroke}
                                                                className="font-mono h-8"
                                                                onChange={(e) => {
                                                                    setMapboxLayerStyle({
                                                                        ...mapboxLayerStyle,
                                                                        stroke: e.target.value,
                                                                    });
                                                                    setStroke(e.target.value);
                                                                }}
                                                            />
                                                            {mapboxLayerStyle.stroke != "#000000" && (
                                                                <Button
                                                                    className="absolute right-0 top-0 h-8"
                                                                    variant={"ghost"}
                                                                    onClick={(e) => resetStroke()}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <FieldSelect
                                                                    fields={availableFields}
                                                                    value={config.strokeColorField}
                                                                    onChange={(val) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { strokeColorField: val });
                                                                            handleAutoGenerateColors("circle-stroke", val);
                                                                            setPaletteVersion(prev => prev + 1);
                                                                        }
                                                                    }}
                                                                    className="h-8 text-xs flex-1"
                                                                />
                                                                <Input
                                                                    placeholder="Default Color"
                                                                    className="h-8 text-xs w-24"
                                                                    value={config.strokeColorDefault}
                                                                    onChange={(e) => selectedLayer?.id && updateLayerConfig(selectedLayer.id, { strokeColorDefault: e.target.value })}
                                                                />
                                                            </div>
                                                            <GradientPalettePicker
                                                                onPaletteSelect={(colors) => {
                                                                    if (config.strokeColorField) {
                                                                        handleAutoGenerateColors("circle-stroke", config.strokeColorField, colors);
                                                                        setPaletteVersion(prev => prev + 1);
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <DynamicFields
                                                            key={`circle-stroke-${selectedLayer?.id}-${config.strokeColorField}-${paletteVersion}`}
                                                            title="Color Stops"
                                                            description={`${config.strokeColorItems.length} categories`}
                                                            addButtonLabel="Add Stop"
                                                            fields={[
                                                                { id: "value", name: "value", type: "text" },
                                                                { id: "color", name: "color", type: "color" },
                                                            ]}
                                                            initialData={config.strokeColorItems as any}
                                                            onDataChange={(data) => {
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, { strokeColorItems: data as any });
                                                                    const pairs: Array<[string, string]> = (data as any).map((item: any) => [
                                                                        String(item.value ?? ""),
                                                                        String(item.color ?? "#000000"),
                                                                    ]);
                                                                    applyCategoricalColor(config.strokeColorField, pairs, config.strokeColorDefault, undefined, "circle-stroke-color");
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Stroke Width</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.stroke_width}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.stroke_width ?? 0]}
                                                    onValueChange={([stroke_width]) => {
                                                        setStrokeWidth(stroke_width);
                                                    }}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Radius</Label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-12 text-right text-sm">
                                                            {mapboxLayerStyle.circle_radius}
                                                        </span>
                                                        <Toggle
                                                            size="sm"
                                                            pressed={config.radiusMode === "attribute"}
                                                            onPressedChange={(pressed) =>
                                                                updateLayerConfig(selectedLayer.id, { radiusMode: pressed ? "attribute" : "static" })
                                                            }
                                                        >
                                                            <SlidersHorizontal className="h-4 w-4" />
                                                        </Toggle>
                                                    </div>
                                                </div>
                                                {config.radiusMode === "static" ? (
                                                    <Slider
                                                        value={[mapboxLayerStyle.circle_radius ?? 0]}
                                                        onValueChange={([radius]) => {
                                                            setCircleRadius(radius);
                                                        }}
                                                        max={100}
                                                        step={1}
                                                    />
                                                ) : (
                                                    <div className="grid gap-2 border rounded p-2 bg-muted/20">
                                                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                                                            <FieldSelect
                                                                fields={availableFields}
                                                                value={config.radiusField}
                                                                onChange={(val) => {
                                                                    updateLayerConfig(selectedLayer.id, { radiusField: val });
                                                                    applyCircleRadiusByField(val);
                                                                }}
                                                                className="h-8 text-xs border-r rounded-r-none col-span-2"
                                                            />
                                                            <Input
                                                                className="h-8 text-xs"
                                                                type="number"
                                                                step="any"
                                                                placeholder="Val Min"
                                                                value={config.radiusValueMin}
                                                                onChange={(e) => updateLayerConfig(selectedLayer.id, { radiusValueMin: parseFloat(e.target.value) })}
                                                            />
                                                            <Input
                                                                className="h-8 text-xs"
                                                                type="number"
                                                                step="any"
                                                                placeholder="Val Max"
                                                                value={config.radiusValueMax}
                                                                onChange={(e) => updateLayerConfig(selectedLayer.id, { radiusValueMax: parseFloat(e.target.value) })}
                                                            />
                                                            <div className="flex justify-end sm:col-span-5 gap-2 mt-1">
                                                                <Input
                                                                    className="h-8 text-xs w-24"
                                                                    type="number"
                                                                    step="any"
                                                                    placeholder="Radius Min"
                                                                    value={config.radiusMin}
                                                                    onChange={(e) => updateLayerConfig(selectedLayer.id, { radiusMin: parseFloat(e.target.value) })}
                                                                />
                                                                <Input
                                                                    className="h-8 text-xs w-24"
                                                                    type="number"
                                                                    step="any"
                                                                    placeholder="Radius Max"
                                                                    value={config.radiusMax}
                                                                    onChange={(e) => updateLayerConfig(selectedLayer.id, { radiusMax: parseFloat(e.target.value) })}
                                                                />
                                                                <Button
                                                                    className="h-8 px-3"
                                                                    variant="secondary"
                                                                    onClick={() => applyCircleRadiusByField()}
                                                                >
                                                                    Apply
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Model Layer Controls */}
                                    {layerType === "model" && (
                                        <div className="grid gap-4">
                                            <Button
                                                variant="outline"
                                                className="w-full text-xs gap-2 bg-primary/5 hover:bg-primary/10 border-primary/20"
                                                onClick={() => {
                                                    const url = currentLayer?.map_service_url;
                                                    if (url) {
                                                        setActiveModelUrl(url);
                                                        setDisplayLayouts({ modelViewer3D: true });
                                                    }
                                                }}
                                            >
                                                <Eye size={14} /> Open in 3D Studio
                                            </Button>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Model Color</Label>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                        <input
                                                            type="color"
                                                            value={mapboxLayerStyle.model_color ?? "#000000"}
                                                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                            onChange={(e) => {
                                                                setModelColor(e.target.value);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="relative">
                                                        <Input
                                                            value={mapboxLayerStyle.model_color ?? "#000000"}
                                                            className="font-mono"
                                                            onChange={(e) => setModelColor(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Opacity</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.model_opacity}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.model_opacity ?? 100]}
                                                    onValueChange={([op]) => setModelOpacity(op)}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Emissive Strength</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.model_emissive_strength}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.model_emissive_strength ?? 0]}
                                                    onValueChange={([em]) => setModelEmissiveStrength(em)}
                                                    max={10}
                                                    step={0.1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Rotation (deg)</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">X</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_rotation?.[0] ?? 0}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelRotation([val, mapboxLayerStyle.model_rotation?.[1] ?? 0, mapboxLayerStyle.model_rotation?.[2] ?? 0]);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">Y</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_rotation?.[1] ?? 0}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelRotation([mapboxLayerStyle.model_rotation?.[0] ?? 0, val, mapboxLayerStyle.model_rotation?.[2] ?? 0]);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">Z</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_rotation?.[2] ?? 0}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelRotation([mapboxLayerStyle.model_rotation?.[0] ?? 0, mapboxLayerStyle.model_rotation?.[1] ?? 0, val]);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Scale</Label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">X</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_scale?.[0] ?? 1}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelScale([val, mapboxLayerStyle.model_scale?.[1] ?? 1, mapboxLayerStyle.model_scale?.[2] ?? 1]);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">Y</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_scale?.[1] ?? 1}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelScale([mapboxLayerStyle.model_scale?.[0] ?? 1, val, mapboxLayerStyle.model_scale?.[2] ?? 1]);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-[10px] text-muted-foreground">Z</Label>
                                                        <Input
                                                            type="number"
                                                            className="h-8 text-xs"
                                                            value={mapboxLayerStyle.model_scale?.[2] ?? 1}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setModelScale([mapboxLayerStyle.model_scale?.[0] ?? 1, mapboxLayerStyle.model_scale?.[1] ?? 1, val]);
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Symbol Layer Controls */}


                                    {/* Fill-Extrusion Controls */}
                                    {layerType === "fill-extrusion" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Color</Label>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                                                        <input
                                                            type="color"
                                                            value={
                                                                mapboxLayerStyle.fill_extrusion_color ?? "#000000"
                                                            }
                                                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                            onChange={(e) =>
                                                                setFillExtrusionColor(e.target.value)
                                                            }
                                                        />
                                                    </div>
                                                    <Input
                                                        value={
                                                            mapboxLayerStyle.fill_extrusion_color ?? "#000000"
                                                        }
                                                        className="font-mono"
                                                        onChange={(e) =>
                                                            setFillExtrusionColor(e.target.value)
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Opacity</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.fill_extrusion_opacity}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.fill_extrusion_opacity ?? 100]}
                                                    onValueChange={([op]) => setFillExtrusionOpacity(op)}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Height</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.fill_extrusion_height}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.fill_extrusion_height ?? 0]}
                                                    onValueChange={([h]) => setFillExtrusionHeight(h)}
                                                    max={1000}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Base</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.fill_extrusion_base}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.fill_extrusion_base ?? 0]}
                                                    onValueChange={([b]) => setFillExtrusionBase(b)}
                                                    max={1000}
                                                    step={1}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Heatmap Controls */}
                                    {(layerType === "heatmap" || circleViz === "heatmap") && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Weight by attribute</Label>
                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                                                    <div className="sm:col-span-2">
                                                        <FieldSelect
                                                            fields={availableFields}
                                                            value={config.heatmapWeightField}
                                                            onChange={(val) => {
                                                                updateLayerConfig(selectedLayer.id, { heatmapWeightField: val });
                                                                setHeatmapWeightFromField(val);
                                                            }}
                                                            className="h-8 text-xs flex-1"
                                                        />
                                                    </div>
                                                    <Input
                                                        className="h-8 text-xs"
                                                        type="number"
                                                        step="any"
                                                        placeholder="min"
                                                        value={config.heatmapWeightMin}
                                                        onChange={(e) =>
                                                            updateLayerConfig(selectedLayer.id, { heatmapWeightMin: parseFloat(e.target.value) })
                                                        }
                                                    />
                                                    <Input
                                                        className="h-8 text-xs"
                                                        type="number"
                                                        step="any"
                                                        placeholder="max"
                                                        value={config.heatmapWeightMax}
                                                        onChange={(e) =>
                                                            updateLayerConfig(selectedLayer.id, { heatmapWeightMax: parseFloat(e.target.value) })
                                                        }
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <Button
                                                        className="h-8 px-3"
                                                        variant="secondary"
                                                        onClick={() => setHeatmapWeightFromField()}
                                                    >
                                                        Apply
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Intensity</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.heatmap_intensity}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.heatmap_intensity ?? 1]}
                                                    onValueChange={([it]) => setHeatmapIntensity(it)}
                                                    max={5}
                                                    step={0.1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Radius</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.heatmap_radius}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.heatmap_radius ?? 20]}
                                                    onValueChange={([rd]) => setHeatmapRadius(rd)}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Opacity</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.heatmap_opacity}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.heatmap_opacity ?? 100]}
                                                    onValueChange={([op]) => setHeatmapOpacity(op)}
                                                    max={100}
                                                    step={1}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label className="text-xs">Color Ramp</Label>
                                                <GradientPalettePicker
                                                    onPaletteSelect={(colors) => {
                                                        const extendedColors = ["rgba(0,0,0,0)", ...colors];
                                                        const stops: [number, string][] = extendedColors.map((c, i) => [
                                                            i / (extendedColors.length - 1),
                                                            c
                                                        ]);
                                                        applyHeatmapColorStops(stops);
                                                        setPaletteVersion(prev => prev + 1);
                                                    }}
                                                />
                                                <DynamicFields
                                                    key={`${selectedLayer?.id}-${paletteVersion}`}
                                                    title="Gradient Stops"
                                                    description="Define color stops for the heatmap"
                                                    addButtonLabel="Add Stop"
                                                    fields={[
                                                        { id: "Stop", name: "Stop", type: "number" },
                                                        { id: "Color", name: "Color", type: "color" },
                                                    ]}
                                                    initialData={(mapboxLayerStyle.heatmap_color_stops ?? []).map(
                                                        ([s, c], i) => ({
                                                            id: i.toString(),
                                                            Stop: s,
                                                            Color: c,
                                                        })
                                                    )}
                                                    onDataChange={(data) => {
                                                        const stops = data.map((item) => [
                                                            Number(item.Stop),
                                                            String(item.Color),
                                                        ]) as [number, string][];
                                                        applyHeatmapColorStops(stops);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Hillshade Controls */}
                                    {layerType === "hillshade" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Exaggeration</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.hillshade_exaggeration}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.hillshade_exaggeration ?? 0.5]}
                                                    onValueChange={([ex]) => setHillshadeExaggeration(ex)}
                                                    max={2}
                                                    step={0.1}
                                                />
                                            </div>

                                            <div className="grid gap-4 p-3 border rounded-md bg-muted/10">
                                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Colors
                                                </Label>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Shadow Color</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-10 shrink-0 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.hillshade_shadow_color ?? "#000000"}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => setHillshadeShadowColor(e.target.value)}
                                                            />
                                                        </div>
                                                        <Input
                                                            value={mapboxLayerStyle.hillshade_shadow_color ?? "#000000"}
                                                            className="h-8 font-mono text-xs flex-1"
                                                            onChange={(e) => setHillshadeShadowColor(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Highlight Color</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-10 shrink-0 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.hillshade_highlight_color ?? "#ffffff"}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => setHillshadeHighlightColor(e.target.value)}
                                                            />
                                                        </div>
                                                        <Input
                                                            value={mapboxLayerStyle.hillshade_highlight_color ?? "#ffffff"}
                                                            className="h-8 font-mono text-xs flex-1"
                                                            onChange={(e) => setHillshadeHighlightColor(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label className="text-xs">Accent Color</Label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex h-8 w-10 shrink-0 overflow-hidden rounded border">
                                                            <input
                                                                type="color"
                                                                value={mapboxLayerStyle.hillshade_accent_color ?? "#888888"}
                                                                className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                onChange={(e) => setHillshadeAccentColor(e.target.value)}
                                                            />
                                                        </div>
                                                        <Input
                                                            value={mapboxLayerStyle.hillshade_accent_color ?? "#888888"}
                                                            className="h-8 font-mono text-xs flex-1"
                                                            onChange={(e) => setHillshadeAccentColor(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {layerType === "raster" && (
                                        <div className="grid gap-4">
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Contrast</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.contrast}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.contrast ?? 1]}
                                                    max={1}
                                                    min={-1}
                                                    step={0.001}
                                                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                                    onValueChange={([contrast]) => {
                                                        setMapboxLayerStyle({
                                                            ...mapboxLayerStyle,
                                                            contrast,
                                                        });
                                                        setContrast(contrast);
                                                    }}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Saturation</Label>
                                                    <span className="w-12 text-right text-sm">
                                                        {mapboxLayerStyle.saturation}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={[mapboxLayerStyle.saturation ?? 1]}
                                                    max={1}
                                                    min={-1}
                                                    step={0.001}
                                                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                                    onValueChange={([saturation]) => {
                                                        setMapboxLayerStyle({
                                                            ...mapboxLayerStyle,
                                                            saturation,
                                                        });
                                                        setSaturation(saturation);
                                                    }}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs">Brightness</Label>
                                                    <span className="w-24 text-right text-sm">
                                                        {mapboxLayerStyle.brightness?.[0] ?? 0} -{" "}
                                                        {mapboxLayerStyle.brightness?.[1] ?? 1}
                                                    </span>
                                                </div>
                                                <Slider
                                                    value={mapboxLayerStyle.brightness ?? [0, 1]}
                                                    min={0}
                                                    max={1}
                                                    step={0.001}
                                                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                                                    onValueChange={(brightness) => {
                                                        setMapboxLayerStyle({
                                                            ...mapboxLayerStyle,
                                                            brightness,
                                                        });
                                                        setBrightness(brightness);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Symbol Specific Accordions */}
                                    {(circleViz === "standard" || circleViz === "marker" || layerType === "symbol") && (
                                        <Accordion type="multiple" value={openStyleAccordions} onValueChange={setOpenStyleAccordions} className="w-full">
                                            <AccordionItem value="label-settings">
                                                <AccordionTrigger className="text-sm font-semibold py-2">Label settings</AccordionTrigger>
                                                <AccordionContent className="pt-2 grid gap-4 px-1">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-muted-foreground">Text Field</Label>
                                                        <FieldSelect
                                                            fields={availableFields}
                                                            value={mapboxLayerStyle.text_field}
                                                            onChange={(val) => {
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, text_field: val });
                                                                setLayout("text-field", ["get", val]);
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, {
                                                                        staticStyles: { ...config.staticStyles, text_field: val }
                                                                    });
                                                                }
                                                            }}
                                                            className="h-8 text-xs"
                                                        />
                                                    </div>

                                                    {/* Text Colors */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="text-xs text-muted-foreground">Color</Label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded border">
                                                                    <input
                                                                        type="color"
                                                                        value={mapboxLayerStyle.text_color ?? "#000000"}
                                                                        className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            setMapboxLayerStyle({ ...mapboxLayerStyle, text_color: e.target.value });
                                                                            setPaint("text-color", e.target.value);
                                                                            if (selectedLayer?.id) {
                                                                                updateLayerConfig(selectedLayer.id, {
                                                                                    staticStyles: { ...config.staticStyles, text_color: e.target.value }
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="text-xs text-muted-foreground">Halo Color</Label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded border">
                                                                    <input
                                                                        type="color"
                                                                        value={mapboxLayerStyle.text_halo_color ?? "rgba(0,0,0,0)"}
                                                                        className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            setMapboxLayerStyle({ ...mapboxLayerStyle, text_halo_color: e.target.value });
                                                                            setPaint("text-halo-color", e.target.value);
                                                                            if (selectedLayer?.id) {
                                                                                updateLayerConfig(selectedLayer.id, {
                                                                                    staticStyles: { ...config.staticStyles, text_halo_color: e.target.value }
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Size</Label>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px]">{mapboxLayerStyle.text_size}</span>
                                                                <Toggle
                                                                    size="sm"
                                                                    pressed={config.symbolTextSizeMode === "attribute"}
                                                                    onPressedChange={(pressed) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { symbolTextSizeMode: pressed ? "attribute" : "static" });
                                                                        }
                                                                    }}
                                                                >
                                                                    <SlidersHorizontal className="h-3 w-3" />
                                                                </Toggle>
                                                            </div>
                                                        </div>
                                                        {config.symbolTextSizeMode === "static" ? (
                                                            <Slider
                                                                value={[mapboxLayerStyle.text_size ?? 16]}
                                                                max={100}
                                                                step={1}
                                                                onValueChange={([v]) => setSymbolTextSize(v)}
                                                            />
                                                        ) : (
                                                            <div className="grid gap-2 p-2 border rounded bg-muted/20">
                                                                <FieldSelect
                                                                    fields={availableFields}
                                                                    value={config.symbolTextSizeField}
                                                                    onChange={(val) => {
                                                                        if (selectedLayer?.id) {
                                                                            updateLayerConfig(selectedLayer.id, { symbolTextSizeField: val });
                                                                            applySymbolTextSizeByField(val);
                                                                        }
                                                                    }}
                                                                    className="h-7 w-full text-[10px]"
                                                                />
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {["ValueMin", "ValueMax", "SizeMin", "SizeMax"].map((key) => (
                                                                        <div key={key} className="grid gap-1">
                                                                            <Label className="text-[9px] text-muted-foreground">{key}</Label>
                                                                            <Input
                                                                                className="h-6 text-[10px] px-1"
                                                                                type="number"
                                                                                value={(config as any)[`symbolText${key}`]}
                                                                                onChange={(e) => {
                                                                                    if (selectedLayer?.id) {
                                                                                        updateLayerConfig(selectedLayer.id, { [`symbolText${key}`]: parseFloat(e.target.value) });
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <Button size="sm" variant="secondary" onClick={() => applySymbolTextSizeByField()} className="h-6 text-[10px]">
                                                                    Apply Scaling
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <div className="flex justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Halo Width</Label>
                                                            <span className="text-[10px]">{mapboxLayerStyle.text_halo_width}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mapboxLayerStyle.text_halo_width ?? 0]}
                                                            max={10}
                                                            step={0.1}
                                                            onValueChange={([v]) => {
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, text_halo_width: v });
                                                                setPaint("text-halo-width", v);
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, {
                                                                        staticStyles: { ...config.staticStyles, text_halo_width: v }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Anchor</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.text_anchor ?? "center"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_anchor: v as any });
                                                                    setLayout("text-anchor", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_anchor: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["center", "left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Justify</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.text_justify ?? "center"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_justify: v as any });
                                                                    setLayout("text-justify", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_justify: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["auto", "left", "center", "right"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Allow Overlap</Label>
                                                            <Switch
                                                                checked={mapboxLayerStyle.text_allow_overlap}
                                                                onCheckedChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_allow_overlap: v });
                                                                    setLayout("text-allow-overlap", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_allow_overlap: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Ignore Place</Label>
                                                            <Switch
                                                                checked={mapboxLayerStyle.text_ignore_placement}
                                                                onCheckedChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_ignore_placement: v });
                                                                    setLayout("text-ignore-placement", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_ignore_placement: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 border-t pt-2">
                                                        <div className="grid gap-1">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Rotate</Label>
                                                            <Slider
                                                                value={[mapboxLayerStyle.text_rotate ?? 0]}
                                                                max={360}
                                                                onValueChange={([v]) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_rotate: v });
                                                                    setLayout("text-rotate", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_rotate: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Letter Spacing</Label>
                                                            <Slider
                                                                value={[mapboxLayerStyle.text_letter_spacing ?? 0]}
                                                                max={2}
                                                                step={0.1}
                                                                onValueChange={([v]) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, text_letter_spacing: v });
                                                                    setLayout("text-letter-spacing", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, text_letter_spacing: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>

                                            <AccordionItem value="icon-settings">
                                                <AccordionTrigger className="text-sm font-semibold py-2">Icon settings</AccordionTrigger>
                                                <AccordionContent className="pt-2 grid gap-4 px-1">
                                                    <div className="grid gap-2">
                                                        <Label className="text-xs text-muted-foreground">Icon Image</Label>
                                                        <Input
                                                            value={mapboxLayerStyle.icon_image}
                                                            placeholder="Sprite ID"
                                                            className="h-8 text-xs font-mono"
                                                            onChange={(e) => {
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, icon_image: e.target.value });
                                                                setLayout("icon-image", e.target.value);
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, {
                                                                        staticStyles: { ...config.staticStyles, icon_image: e.target.value }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="text-xs text-muted-foreground">Color</Label>
                                                            <div className="flex items-center gap-2">
                                                                <div className="relative flex h-7 w-7 shrink-0 overflow-hidden rounded border">
                                                                    <input
                                                                        type="color"
                                                                        value={mapboxLayerStyle.icon_color ?? "#000000"}
                                                                        className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                                                                        onChange={(e) => {
                                                                            setMapboxLayerStyle({ ...mapboxLayerStyle, icon_color: e.target.value });
                                                                            setPaint("icon-color", e.target.value);
                                                                            if (selectedLayer?.id) {
                                                                                updateLayerConfig(selectedLayer.id, {
                                                                                    staticStyles: { ...config.staticStyles, icon_color: e.target.value }
                                                                                });
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <Label className="text-[10px] text-muted-foreground uppercase">Size</Label>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px]">{mapboxLayerStyle.icon_size}</span>
                                                                    <Toggle
                                                                        size="sm"
                                                                        pressed={config.symbolIconSizeMode === "attribute"}
                                                                        onPressedChange={(pressed) => {
                                                                            if (selectedLayer?.id) {
                                                                                updateLayerConfig(selectedLayer.id, { symbolIconSizeMode: pressed ? "attribute" : "static" });
                                                                            }
                                                                        }}
                                                                    >
                                                                        <SlidersHorizontal className="h-3 w-3" />
                                                                    </Toggle>
                                                                </div>
                                                            </div>
                                                            {config.symbolIconSizeMode === "static" ? (
                                                                <Slider
                                                                    value={[mapboxLayerStyle.icon_size ?? 1]}
                                                                    max={10}
                                                                    step={0.1}
                                                                    onValueChange={([v]) => setSymbolIconSize(v)}
                                                                />
                                                            ) : (
                                                                <div className="grid gap-2 p-2 border rounded bg-muted/20">
                                                                    <FieldSelect
                                                                        fields={availableFields}
                                                                        value={config.symbolIconSizeField}
                                                                        onChange={(val) => {
                                                                            if (selectedLayer?.id) {
                                                                                updateLayerConfig(selectedLayer.id, { symbolIconSizeField: val });
                                                                                applySymbolIconSizeByField(val);
                                                                            }
                                                                        }}
                                                                        className="h-7 w-full text-[10px]"
                                                                    />
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        {["ValueMin", "ValueMax", "SizeMin", "SizeMax"].map((key) => (
                                                                            <div key={key} className="grid gap-1">
                                                                                <Label className="text-[9px] text-muted-foreground">{key}</Label>
                                                                                <Input
                                                                                    className="h-6 text-[10px] px-1"
                                                                                    type="number"
                                                                                    value={(config as any)[`symbolIcon${key}`]}
                                                                                    onChange={(e) => {
                                                                                        if (selectedLayer?.id) {
                                                                                            updateLayerConfig(selectedLayer.id, { [`symbolIcon${key}`]: parseFloat(e.target.value) });
                                                                                        }
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    <Button size="sm" variant="secondary" onClick={() => applySymbolIconSizeByField()} className="h-6 text-[10px]">
                                                                        Apply Scaling
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Allow Overlap</Label>
                                                            <Switch
                                                                checked={mapboxLayerStyle.icon_allow_overlap}
                                                                onCheckedChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, icon_allow_overlap: v });
                                                                    setLayout("icon-allow-overlap", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, icon_allow_overlap: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Optional</Label>
                                                            <Switch
                                                                checked={mapboxLayerStyle.icon_optional}
                                                                onCheckedChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, icon_optional: v });
                                                                    setLayout("icon-optional", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, icon_optional: v }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Anchor</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.icon_anchor ?? "center"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, icon_anchor: v as any });
                                                                    setLayout("icon-anchor", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, icon_anchor: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["center", "left", "right", "top", "bottom", "top-left", "top-right", "bottom-left", "bottom-right"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Fit To Text</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.icon_text_fit ?? "none"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, icon_text_fit: v as any });
                                                                    setLayout("icon-text-fit", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, icon_text_fit: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["none", "width", "height", "both"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>

                                            <AccordionItem value="layout-settings">
                                                <AccordionTrigger className="text-sm font-semibold py-2">Symbol Layout</AccordionTrigger>
                                                <AccordionContent className="pt-2 grid gap-4 px-1">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Placement</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.symbol_placement ?? "point"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_placement: v as any });
                                                                    setLayout("symbol-placement", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, symbol_placement: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["point", "line", "line-center"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Z-Order</Label>
                                                            <Select
                                                                value={mapboxLayerStyle.symbol_z_order ?? "auto"}
                                                                onValueChange={(v) => {
                                                                    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_z_order: v as any });
                                                                    setLayout("symbol-z-order", v);
                                                                    if (selectedLayer?.id) {
                                                                        updateLayerConfig(selectedLayer.id, {
                                                                            staticStyles: { ...config.staticStyles, symbol_z_order: v as any }
                                                                        });
                                                                    }
                                                                }}
                                                            >
                                                                <SelectTrigger className="h-7 text-[10px]">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["auto", "viewport-y", "source"].map(a => (
                                                                        <SelectItem key={a} value={a} className="text-[10px]">{a}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <div className="flex justify-between">
                                                            <Label className="text-[10px] text-muted-foreground uppercase">Spacing</Label>
                                                            <span className="text-[10px]">{mapboxLayerStyle.symbol_spacing}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mapboxLayerStyle.symbol_spacing ?? 250]}
                                                            max={1000}
                                                            step={1}
                                                            onValueChange={([v]) => {
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_spacing: v });
                                                                setLayout("symbol-spacing", v);
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, {
                                                                        staticStyles: { ...config.staticStyles, symbol_spacing: v }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between border-t pt-2">
                                                        <Label className="text-[10px] text-muted-foreground uppercase">Avoid Edges</Label>
                                                        <Switch
                                                            checked={mapboxLayerStyle.symbol_avoid_edges}
                                                            onCheckedChange={(v) => {
                                                                setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_avoid_edges: v });
                                                                setLayout("symbol-avoid-edges", v);
                                                                if (selectedLayer?.id) {
                                                                    updateLayerConfig(selectedLayer.id, {
                                                                        staticStyles: { ...config.staticStyles, symbol_avoid_edges: v }
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    )}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>



                    <Accordion type="single" collapsible className="py-0">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Legend</AccordionTrigger>
                            <AccordionContent>
                                {selectedLayer?.map_service_vendor ==
                                    MapServiceVendor.Geoserver && (
                                        <>
                                            <img
                                                src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0x09090b;fontColor:0xffffff;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`}
                                                className="hidden dark:block"
                                                alt="Legend Dark"
                                            />
                                            <img
                                                src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0xffffff;fontColor:0x000000;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`}
                                                className="block dark:hidden"
                                                alt="Legend Light"
                                            />
                                        </>
                                    )}
                                {selectedLayer?.map_service_vendor ==
                                    MapServiceVendor.ArcGIS && (
                                        <LegendEsri
                                            url={`${selectedLayer?.map_service_url}/legend?f=json`}
                                        />
                                    )}
                                {selectedLayer?.map_service_vendor ==
                                    MapServiceVendor.GeoJSON && (
                                        <LegendMapbox selectedLayer={selectedLayer} mapRef={mapRef} />
                                    )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                </div >
            </ScrollArea >
        </>
    );
}
