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
  ImagesIcon,
  PenIcon,
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
import useLayerStore from "@/stores/layer";
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
  const { map, setDisplayLayouts, selectedLayer } = useMapStore();
  const mapRef = map;

  const [layerType, setLayerType] = useState<
    LayerSpecification["type"] | undefined
  >(undefined);
  const [circleViz, setCircleViz] = useState<"standard" | "marker" | "heatmap">(
    "standard"
  );
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
    symbol_text_color: "#000000",
    symbol_icon_color: "#000000",
    symbol_text_size: 16,
    symbol_icon_size: 1,
    // raster extras
    raster_hue_rotate: 0,
    raster_fade_duration: 300,
    // raster-particle
    raster_particle_opacity: 100,
    raster_particle_speed: 1,
    raster_particle_fade_amount: 0.5,
    raster_particle_color: "#00ffff",
  });

  // Heatmap weight by attribute controls
  const [heatmapWeightField, setHeatmapWeightField] = useState<string>("");
  const [heatmapWeightMin, setHeatmapWeightMin] = useState<number>(0);
  const [heatmapWeightMax, setHeatmapWeightMax] = useState<number>(1);

  // Dynamic size controls (Circle radius, Symbol text/icon size)
  const [circleSizeField, setCircleSizeField] = useState<string>("");
  const [circleValueMin, setCircleValueMin] = useState<number>(0);
  const [circleValueMax, setCircleValueMax] = useState<number>(100);
  const [circleRadiusMin, setCircleRadiusMin] = useState<number>(2);
  const [circleRadiusMax, setCircleRadiusMax] = useState<number>(12);

  const [symbolTextSizeField, setSymbolTextSizeField] = useState<string>("");
  const [symbolTextValueMin, setSymbolTextValueMin] = useState<number>(0);
  const [symbolTextValueMax, setSymbolTextValueMax] = useState<number>(100);
  const [symbolTextSizeMin, setSymbolTextSizeMin] = useState<number>(12);
  const [symbolTextSizeMax, setSymbolTextSizeMax] = useState<number>(24);

  const [symbolIconSizeField, setSymbolIconSizeField] = useState<string>("");
  const [symbolIconValueMin, setSymbolIconValueMin] = useState<number>(0);
  const [symbolIconValueMax, setSymbolIconValueMax] = useState<number>(100);
  const [symbolIconSizeMin, setSymbolIconSizeMin] = useState<number>(0.5);
  const [symbolIconSizeMax, setSymbolIconSizeMax] = useState<number>(2);
  // Advanced: dynamic fields state
  const [catField, setCatField] = useState<string>("");
  const [catDefaultColor, setCatDefaultColor] = useState<string>("#000000");
  const [catItems, setCatItems] = useState<Array<{ id: string; value: string; color: string }>>([]);
  const [gradField, setGradField] = useState<string>("");
  const [gradItems, setGradItems] = useState<Array<{ id: string; stop: number; color: string }>>([]);

  const getStyleLayer = () => {
    const map = mapRef?.current?.getMap();
    const layerId = selectedLayer?.id;

    if (map && layerId) {
      const layer = map.getLayer(layerId) as LayerSpecification | undefined;
      if (layer) {
        setLayerType(layer.type);
        if (layer.type === "circle") setCircleViz("standard");
        else if (layer.type === "symbol") setCircleViz("marker");
        else if (layer.type === "heatmap") setCircleViz("heatmap");
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
        }
      }
    }
  };

  // Build default or custom heatmap color expression
  const buildHeatmapColorExpr = (): any => {
    const stops = mapboxLayerStyle.heatmap_color_stops ?? [];
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
    const orig = map.getLayer(layerId) as any;
    if (!orig) return;
    const source = orig?.source;
    const sourceLayer = orig?.["source-layer"];
    const filter = orig?.filter;
    const minzoom = orig?.minzoom;
    const maxzoom = orig?.maxzoom;

    map.removeLayer(layerId);

    if (mode === "standard") {
      const spec: any = {
        id: layerId,
        type: "circle",
        source,
        paint: {
          "circle-color": mapboxLayerStyle.fill ?? "#3388ff",
          "circle-radius": mapboxLayerStyle.circle_radius ?? 6,
          "circle-stroke-color": mapboxLayerStyle.stroke ?? "#000000",
          "circle-stroke-width": mapboxLayerStyle.stroke_width ?? 1,
        },
      };
      if (sourceLayer) spec["source-layer"] = sourceLayer;
      if (filter) spec.filter = filter;
      if (minzoom !== undefined) spec.minzoom = minzoom;
      if (maxzoom !== undefined) spec.maxzoom = maxzoom;
      map.addLayer(spec);
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
          "text-field": ["get", (window as any).__symbolTextField || "name"],
          "text-allow-overlap": true,
          "icon-allow-overlap": true,
        },
        paint: {
          "text-color": mapboxLayerStyle.symbol_text_color ?? "#111111",
          "text-size": mapboxLayerStyle.symbol_text_size ?? 16,
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

    const spec: any = {
      id: layerId,
      type: "heatmap",
      source,
      paint: {
        "heatmap-intensity": mapboxLayerStyle.heatmap_intensity ?? 1,
        "heatmap-radius": mapboxLayerStyle.heatmap_radius ?? 20,
        "heatmap-opacity": (mapboxLayerStyle.heatmap_opacity ?? 100) / 100,
        "heatmap-color": buildHeatmapColorExpr(),
      },
    };
    if (sourceLayer) spec["source-layer"] = sourceLayer;
    if (filter) spec.filter = filter;
    if (minzoom !== undefined) spec.minzoom = minzoom;
    if (maxzoom !== undefined) spec.maxzoom = maxzoom;
    map.addLayer(spec);
    // Apply heatmap-weight from attribute if provided
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

  const setPaint = (
    paint_type: string,
    value: string | number | number[] | undefined | null
  ) => {
    const map = mapRef?.current?.getMap();
    if (selectedLayer) {
      const layerId = selectedLayer.id;
      if (map && value) {
        const type = map.getLayer(layerId)?.type;
        if (type) {
          const paintType = (type +
            paint_type) as keyof mapboxgl.PaintSpecification;
          map.setPaintProperty(selectedLayer.id, paintType, value);
        }
      }
    }
  };

  const setFill = (value: string) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill: value });
    setPaint("-color", value);
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
    }
  };

  const setStrokeWidth = (value: number) => {
    const map = mapRef?.current?.getMap();
    const type =
      selectedLayer && map ? map.getLayer(selectedLayer.id)?.type : undefined;
    if (type === "circle") {
      setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: value });
      setPaint("-stroke-width", value);
    } else if (type === "line") {
      setMapboxLayerStyle({ ...mapboxLayerStyle, line_width: value });
      // for line layers, width property is line-width
      setPaint("-width", value);
    }
  };

  const setContrast = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, contrast: value });
    setPaint("-contrast", value);
  };

  const setSaturation = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, saturation: value });
    setPaint("-saturation", value);
  };

  const setBrightness = (values: number[]) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, brightness: values });
    setPaint("-brightness-min", values[0]);
    setPaint("-brightness-max", values[1]);
  };

  const handleZoomChange = (values: number[]) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, zoom: values });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      const layerId = selectedLayer.id;
      map.setLayerZoomRange(layerId, values[0], values[1]);
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
    }
  };

  const resetFill = () => {
    const defaultColor = "#000000";
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill: defaultColor });
    setPaint("-color", defaultColor);
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
        // line layers use line-color for stroke concept
        setPaint("-color", defaultColor);
      } else {
        setPaint("-stroke-color", defaultColor);
      }
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
    } else if (type === "line") {
      const lineWidth = 0;
      setMapboxLayerStyle({ ...mapboxLayerStyle, line_width: lineWidth });
      setPaint("-width", lineWidth);
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
  };

  // Model specific setters
  const setModelColor = (value: string) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, model_color: value });
    // model-color does not depend on type prefix
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "model-color", value);
    }
  };

  const setModelOpacity = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, model_opacity: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "model-opacity", value / 100);
    }
  };

  const setModelEmissiveStrength = (value: number) => {
    setMapboxLayerStyle({
      ...mapboxLayerStyle,
      model_emissive_strength: value,
    });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "model-emissive-strength", value);
    }
  };

  const setModelRotation = (value: number[]) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, model_rotation: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "model-rotation", value);
    }
  };

  // Symbol specific setters
  const setSymbolTextColor = (value: string) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_text_color: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "text-color", value);
    }
  };
  const setSymbolIconColor = (value: string) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_icon_color: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "icon-color", value);
    }
  };
  const setSymbolTextSize = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_text_size: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "text-size", value);
    }
  };
  const setSymbolIconSize = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, symbol_icon_size: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "icon-size", value);
    }
  };

  // Fill-extrusion setters
  const setFillExtrusionColor = (value: string) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_color: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "fill-extrusion-color", value);
    }
  };
  const setFillExtrusionOpacity = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_opacity: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(
        selectedLayer.id,
        "fill-extrusion-opacity",
        value / 100
      );
    }
  };
  const setFillExtrusionHeight = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_height: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "fill-extrusion-height", value);
    }
  };
  const setFillExtrusionBase = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, fill_extrusion_base: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "fill-extrusion-base", value);
    }
  };
  const setFillExtrusionVerticalGradient = (value: boolean) => {
    setMapboxLayerStyle({
      ...mapboxLayerStyle,
      fill_extrusion_vertical_gradient: value,
    });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(
        selectedLayer.id,
        "fill-extrusion-vertical-gradient",
        value
      );
    }
  };

  // Heatmap setters
  const setHeatmapIntensity = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_intensity: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "heatmap-intensity", value);
    }
  };
  const setHeatmapRadius = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_radius: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "heatmap-radius", value);
    }
  };
  const setHeatmapOpacity = (value: number) => {
    setMapboxLayerStyle({ ...mapboxLayerStyle, heatmap_opacity: value });
    const map = mapRef?.current?.getMap();
    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "heatmap-opacity", value / 100);
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
    const f = (field ?? heatmapWeightField)?.trim();
    if (!f) return;
    const minV = min ?? heatmapWeightMin;
    const maxV = max ?? heatmapWeightMax;
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
    setHeatmapWeightField(f);
    setHeatmapWeightMin(minV);
    setHeatmapWeightMax(maxV);
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
    const f = (field ?? circleSizeField)?.trim();
    if (!f) return;
    const iMin = numOr(inMin ?? circleValueMin, 0);
    const iMax = numOr(inMax ?? circleValueMax, 100);
    const oMin = numOr(outMin ?? circleRadiusMin, 2);
    const oMax = numOr(outMax ?? circleRadiusMax, 12);
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
    setCircleSizeField(f);
    setCircleValueMin(iMin);
    setCircleValueMax(iMax);
    setCircleRadiusMin(oMin);
    setCircleRadiusMax(oMax);
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
    const f = (field ?? symbolTextSizeField)?.trim();
    if (!f) return;
    const iMin = numOr(inMin ?? symbolTextValueMin, 0);
    const iMax = numOr(inMax ?? symbolTextValueMax, 100);
    const oMin = numOr(outMin ?? symbolTextSizeMin, 12);
    const oMax = numOr(outMax ?? symbolTextSizeMax, 24);
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
    setSymbolTextSizeField(f);
    setSymbolTextValueMin(iMin);
    setSymbolTextValueMax(iMax);
    setSymbolTextSizeMin(oMin);
    setSymbolTextSizeMax(oMax);
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
    const f = (field ?? symbolIconSizeField)?.trim();
    if (!f) return;
    const iMin = numOr(inMin ?? symbolIconValueMin, 0);
    const iMax = numOr(inMax ?? symbolIconValueMax, 100);
    const oMin = numOr(outMin ?? symbolIconSizeMin, 0.5);
    const oMax = numOr(outMax ?? symbolIconSizeMax, 2);
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
    setSymbolIconSizeField(f);
    setSymbolIconValueMin(iMin);
    setSymbolIconValueMax(iMax);
    setSymbolIconSizeMin(oMin);
    setSymbolIconSizeMax(oMax);
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
    target?: "text" | "icon"
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
      if (property) {
        map.setPaintProperty(selectedLayer.id, property as any, expr);
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
        <div className="grid gap-4 pt-4 px-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacity</Label>
              <span className="w-12 text-right text-sm">
                {mapboxLayerStyle.opacity}
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
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Zoom</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={mapboxLayerStyle.zoom?.[0] ?? 24}
                  className="h-8 w-20"
                  max={24}
                  min={0}
                  onChange={(e) => {
                    const newZoom = Number(e.target.value);
                    setMapboxLayerStyle({
                      ...mapboxLayerStyle,
                      zoom: [newZoom, mapboxLayerStyle.zoom?.[1] ?? newZoom],
                    });
                    handleZoomChange([
                      newZoom,
                      mapboxLayerStyle.zoom?.[1] ?? newZoom,
                    ]);
                  }}
                />
                <span>-</span>
                <Input
                  type="number"
                  value={mapboxLayerStyle.zoom?.[1] ?? 24}
                  className="h-8 w-20"
                  max={24}
                  min={0}
                  onChange={(e) => {
                    setMapboxLayerStyle({
                      ...mapboxLayerStyle,
                      zoom: [
                        mapboxLayerStyle.zoom?.[0] ?? 24,
                        Number(e.target.value),
                      ],
                    });
                    handleZoomChange([
                      mapboxLayerStyle.zoom?.[0] ?? 24,
                      Number(e.target.value),
                    ]);
                  }}
                />
              </div>
            </div>
            <Slider
              value={mapboxLayerStyle.zoom}
              min={0}
              max={24}
              step={0.001}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
              onValueChange={(zoom) => {
                setMapboxLayerStyle({ ...mapboxLayerStyle, zoom });
                handleZoomChange(zoom);
              }}
            />
          </div>
          {/* Visualization selector for point-like layers */}
          {(layerType === "circle" ||
            layerType === "symbol" ||
            layerType === "heatmap") && (
              <div>
                <Label className="text-xs">Visualization</Label>
                <Select
                  value={circleViz}
                  onValueChange={(v) => {
                    const val = v as "standard" | "marker" | "heatmap";
                    setCircleViz(val);
                    convertCircleVisualization(val);
                  }}
                >
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="marker">Marker</SelectItem>
                    <SelectItem value="heatmap">Heatmap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

          <Accordion type="single" collapsible>
            <AccordionItem value="vector-item">
              <AccordionTrigger>
                {layerType === "fill" && "Fill"}
                {layerType === "line" && "Line"}
                {layerType === "circle" && "Circle"}
                {layerType === "model" && "Model"}
                {layerType === "symbol" && "Symbol"}
                {layerType === "fill-extrusion" && "Fill Extrusion"}
                {layerType === "heatmap" && "Heatmap"}
                {layerType === "hillshade" && "Hillshade"}
                {!layerType && "Vector"}
              </AccordionTrigger>
              <AccordionContent>
                {/* Fill Layer Controls */}
                {layerType === "fill" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Fill</Label>
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
                        <div className="relative">
                          <Input
                            value={mapboxLayerStyle.fill}
                            className="font-mono"
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
                              className="absolute right-0 top-0"
                              variant={"ghost"}
                              onClick={(e) => resetFill()}
                            >
                              <XIcon />
                            </Button>
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
                        <div className="relative">
                          <Input
                            value={mapboxLayerStyle.stroke}
                            className="font-mono"
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
                              className="absolute right-0 top-0"
                              variant={"ghost"}
                              onClick={(e) => resetStroke()}
                            >
                              <XIcon />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Line Layer Controls */}
                {layerType === "line" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Line Color</Label>
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
                              // for line layers, color is line-color
                              setFill(e.target.value);
                            }}
                          />
                        </div>
                        <div className="relative">
                          <Input
                            value={mapboxLayerStyle.fill}
                            className="font-mono"
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
                {layerType === "circle" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Fill</Label>
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
                        <div className="relative">
                          <Input
                            value={mapboxLayerStyle.fill}
                            className="font-mono"
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
                              className="absolute right-0 top-0"
                              variant={"ghost"}
                              onClick={(e) => resetFill()}
                            >
                              <XIcon />
                            </Button>
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
                        <div className="relative">
                          <Input
                            value={mapboxLayerStyle.stroke}
                            className="font-mono"
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
                              className="absolute right-0 top-0"
                              variant={"ghost"}
                              onClick={(e) => resetStroke()}
                            >
                              <XIcon />
                            </Button>
                          )}
                        </div>
                      </div>
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
                        <span className="w-12 text-right text-sm">
                          {mapboxLayerStyle.circle_radius}
                        </span>
                      </div>
                      <Slider
                        value={[mapboxLayerStyle.circle_radius ?? 0]}
                        onValueChange={([radius]) => {
                          setCircleRadius(radius);
                        }}
                        max={100}
                        step={1}
                      />
                    </div>
                    {/* Radius by attribute */}
                    <div className="grid gap-2">
                      <Label className="text-xs">Radius by attribute</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                        <Input
                          className="h-8 text-sm sm:col-span-2"
                          placeholder="nama field (misal: value)"
                          value={circleSizeField}
                          onChange={(e) => setCircleSizeField(e.target.value)}
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val min"
                          value={circleValueMin}
                          onChange={(e) =>
                            setCircleValueMin(parseFloat(e.target.value))
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val max"
                          value={circleValueMax}
                          onChange={(e) =>
                            setCircleValueMax(parseFloat(e.target.value))
                          }
                        />
                        <div className="flex justify-end sm:col-span-5 gap-2">
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="radius min"
                            value={circleRadiusMin}
                            onChange={(e) =>
                              setCircleRadiusMin(parseFloat(e.target.value))
                            }
                          />
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="radius max"
                            value={circleRadiusMax}
                            onChange={(e) =>
                              setCircleRadiusMax(parseFloat(e.target.value))
                            }
                          />
                          <Button
                            className="h-8 px-3"
                            variant="secondary"
                            onClick={() => applyCircleRadiusByField()}
                          >
                            Apply radius
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Layer Controls */}
                {layerType === "model" && (
                  <div className="grid gap-4">
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
                  </div>
                )}

                {/* Symbol Layer Controls */}
                {layerType === "symbol" && (
                  <div className="grid gap-4">
                    <div className="mt-2 flex gap-2 items-center">
                      {circleViz === "marker" && (
                        <div className="grid gap-2">
                          <Label className="text-xs">Text Field</Label>
                          <Input
                            placeholder="Field name"
                            className="h-8 w-full"
                            onChange={(e) => {
                              (window as any).__symbolTextField =
                                e.target.value;
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                          <input
                            type="color"
                            value={
                              mapboxLayerStyle.symbol_text_color ?? "#000000"
                            }
                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                            onChange={(e) => setSymbolTextColor(e.target.value)}
                          />
                        </div>
                        <Input
                          value={
                            mapboxLayerStyle.symbol_text_color ?? "#000000"
                          }
                          className="font-mono"
                          onChange={(e) => setSymbolTextColor(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Text Size</Label>
                        <span className="w-12 text-right text-sm">
                          {mapboxLayerStyle.symbol_text_size}
                        </span>
                      </div>
                      <Slider
                        value={[mapboxLayerStyle.symbol_text_size ?? 16]}
                        onValueChange={([sz]) => setSymbolTextSize(sz)}
                        max={64}
                        step={1}
                      />
                    </div>
                    {/* Text Size by attribute */}
                    <div className="grid gap-2">
                      <Label className="text-xs">Text size by attribute</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                        <Input
                          className="h-8 text-sm sm:col-span-2"
                          placeholder="nama field (misal: value)"
                          value={symbolTextSizeField}
                          onChange={(e) =>
                            setSymbolTextSizeField(e.target.value)
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val min"
                          value={symbolTextValueMin}
                          onChange={(e) =>
                            setSymbolTextValueMin(parseFloat(e.target.value))
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val max"
                          value={symbolTextValueMax}
                          onChange={(e) =>
                            setSymbolTextValueMax(parseFloat(e.target.value))
                          }
                        />
                        <div className="flex justify-end sm:col-span-5 gap-2">
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="size min"
                            value={symbolTextSizeMin}
                            onChange={(e) =>
                              setSymbolTextSizeMin(parseFloat(e.target.value))
                            }
                          />
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="size max"
                            value={symbolTextSizeMax}
                            onChange={(e) =>
                              setSymbolTextSizeMax(parseFloat(e.target.value))
                            }
                          />
                          <Button
                            className="h-8 px-3"
                            variant="secondary"
                            onClick={() => applySymbolTextSizeByField()}
                          >
                            Apply text size
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Icon Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                          <input
                            type="color"
                            value={
                              mapboxLayerStyle.symbol_icon_color ?? "#000000"
                            }
                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                            onChange={(e) => setSymbolIconColor(e.target.value)}
                          />
                        </div>
                        <Input
                          value={
                            mapboxLayerStyle.symbol_icon_color ?? "#000000"
                          }
                          className="font-mono"
                          onChange={(e) => setSymbolIconColor(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Icon Size</Label>
                        <span className="w-12 text-right text-sm">
                          {mapboxLayerStyle.symbol_icon_size}
                        </span>
                      </div>
                      <Slider
                        value={[mapboxLayerStyle.symbol_icon_size ?? 1]}
                        onValueChange={([s]) => setSymbolIconSize(s)}
                        max={5}
                        step={0.1}
                      />
                    </div>
                    {/* Icon Size by attribute */}
                    <div className="grid gap-2">
                      <Label className="text-xs">Icon size by attribute</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                        <Input
                          className="h-8 text-sm sm:col-span-2"
                          placeholder="nama field (misal: value)"
                          value={symbolIconSizeField}
                          onChange={(e) =>
                            setSymbolIconSizeField(e.target.value)
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val min"
                          value={symbolIconValueMin}
                          onChange={(e) =>
                            setSymbolIconValueMin(parseFloat(e.target.value))
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="val max"
                          value={symbolIconValueMax}
                          onChange={(e) =>
                            setSymbolIconValueMax(parseFloat(e.target.value))
                          }
                        />
                        <div className="flex justify-end sm:col-span-5 gap-2">
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="size min"
                            value={symbolIconSizeMin}
                            onChange={(e) =>
                              setSymbolIconSizeMin(parseFloat(e.target.value))
                            }
                          />
                          <Input
                            className="h-8 text-sm w-24"
                            type="number"
                            step="any"
                            placeholder="size max"
                            value={symbolIconSizeMax}
                            onChange={(e) =>
                              setSymbolIconSizeMax(parseFloat(e.target.value))
                            }
                          />
                          <Button
                            className="h-8 px-3"
                            variant="secondary"
                            onClick={() => applySymbolIconSizeByField()}
                          >
                            Apply icon size
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
                {layerType === "heatmap" && (
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label className="text-xs">Weight by attribute</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <Input
                          className="h-8 text-sm sm:col-span-2"
                          placeholder="nama field (misal: value)"
                          value={heatmapWeightField}
                          onChange={(e) =>
                            setHeatmapWeightField(e.target.value)
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="min"
                          value={heatmapWeightMin}
                          onChange={(e) =>
                            setHeatmapWeightMin(parseFloat(e.target.value))
                          }
                        />
                        <Input
                          className="h-8 text-sm"
                          type="number"
                          step="any"
                          placeholder="max"
                          value={heatmapWeightMax}
                          onChange={(e) =>
                            setHeatmapWeightMax(parseFloat(e.target.value))
                          }
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          className="h-8 px-3"
                          variant="secondary"
                          onClick={() => setHeatmapWeightFromField()}
                        >
                          Apply weight
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
                      <Label className="text-xs">
                        Gradient Stops (contoh: 0,#0000ff;0.5,#00ff00;1,#ff0000)
                      </Label>
                      <Input
                        value={(mapboxLayerStyle.heatmap_color_stops ?? [])
                          .map(([s, c]) => `${s},${c}`)
                          .join(";")}
                        className="font-mono"
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          const stops = raw.length
                            ? raw.split(";").map((pair) => {
                              const [s, c] = pair.split(",");
                              return [Number(s), c] as [number, string];
                            })
                            : [];
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
                    <div className="grid gap-2">
                      <Label className="text-xs">Shadow Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                          <input
                            type="color"
                            value={
                              mapboxLayerStyle.hillshade_shadow_color ??
                              "#000000"
                            }
                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                            onChange={(e) =>
                              setHillshadeShadowColor(e.target.value)
                            }
                          />
                        </div>
                        <Input
                          value={
                            mapboxLayerStyle.hillshade_shadow_color ?? "#000000"
                          }
                          className="font-mono"
                          onChange={(e) =>
                            setHillshadeShadowColor(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Highlight Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                          <input
                            type="color"
                            value={
                              mapboxLayerStyle.hillshade_highlight_color ??
                              "#ffffff"
                            }
                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                            onChange={(e) =>
                              setHillshadeHighlightColor(e.target.value)
                            }
                          />
                        </div>
                        <Input
                          value={
                            mapboxLayerStyle.hillshade_highlight_color ??
                            "#ffffff"
                          }
                          className="font-mono"
                          onChange={(e) =>
                            setHillshadeHighlightColor(e.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs">Accent Color</Label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-8 w-20 overflow-hidden rounded border">
                          <input
                            type="color"
                            value={
                              mapboxLayerStyle.hillshade_accent_color ??
                              "#888888"
                            }
                            className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                            onChange={(e) =>
                              setHillshadeAccentColor(e.target.value)
                            }
                          />
                        </div>
                        <Input
                          value={
                            mapboxLayerStyle.hillshade_accent_color ?? "#888888"
                          }
                          className="font-mono"
                          onChange={(e) =>
                            setHillshadeAccentColor(e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {layerType === "raster" && (
            <Accordion type="single" collapsible>
              <AccordionItem value="raster-item">
                <AccordionTrigger>Raster</AccordionTrigger>
                <AccordionContent>
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <Accordion type="single" collapsible>
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

          {/* Advanced styling */}
          <Accordion type="single" collapsible>
            <AccordionItem value="adv-item">
              <AccordionTrigger>Advanced</AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-6">
                  {/* Kategori (Style by Attribute) */}
                  <div className="grid gap-3">
                    <Label className="text-xs">Style by Attribute (Kategori)</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="field (misal: status)"
                        className="h-8 w-40"
                        value={catField}
                        onChange={(e) => setCatField(e.target.value)}
                      />
                      <Input
                        placeholder="default warna"
                        className="h-8 w-40"
                        value={catDefaultColor}
                        onChange={(e) => setCatDefaultColor(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const pairs: Array<[string, string]> = catItems.map((item) => [
                            String(item.value ?? ""),
                            String(item.color ?? "#000000"),
                          ]);
                          applyCategoricalColor(catField, pairs, catDefaultColor);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    <DynamicFields
                      title="Kategori"
                      description="Tambah pasangan nilai dan warna"
                      addButtonLabel="Tambah kategori"
                      fields={[
                        { id: "value", name: "value", type: "text" },
                        { id: "color", name: "color", type: "color" },
                      ]}
                      initialData={catItems}
                      onDataChange={(data) => setCatItems(data as any)}
                    />
                  </div>

                  {/* Gradient by Field */}
                  <div className="grid gap-3">
                    <Label className="text-xs">Gradient by Field</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        placeholder="field numeric (misal: value)"
                        className="h-8 w-40"
                        value={gradField}
                        onChange={(e) => setGradField(e.target.value)}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const stops: Array<[number, string]> = gradItems
                            .filter((item) => item.stop !== undefined)
                            .map((item) => [Number(item.stop), String(item.color ?? "#000000")]);
                          applyGradientByField(gradField, stops);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                    <DynamicFields
                      title="Gradient Stops"
                      description="Tambah stop nilai dan warna"
                      addButtonLabel="Tambah stop"
                      fields={[
                        { id: "stop", name: "stop", type: "number" },
                        { id: "color", name: "color", type: "color" },
                      ]}
                      initialData={gradItems}
                      onDataChange={(data) => setGradItems(data as any)}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </>
  );
}
