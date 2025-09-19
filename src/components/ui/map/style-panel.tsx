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
} from "mapbox-gl";
import useLayerStore from "@/stores/layer";
import { useMapboxStyleStore } from "@/stores/style";

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

  const [mapboxLayerStyle, setMapboxLayerStyle] = useState<MapboxLayerStyle>({
    fill: "#000000",
    stroke: "#000000",
    stroke_width: 0,
    opacity: 100,
    contrast: 0,
    saturation: 0,
    brightness: [0, 1],
    zoom: [0, 24],
  });

  const getStyleLayer = () => {
    const map = mapRef?.current?.getMap();
    const layerId = selectedLayer?.id;

    if (map && layerId) {
      const layer = map.getLayer(layerId) as LayerSpecification | undefined;
      if (layer) {
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

          // Handle stroke width
          const strokeWidthKey =
            `${layer.type}-stroke-width` as keyof typeof layer.paint;
          const strokeWidth = layer.paint[strokeWidthKey] as
            | DataDrivenPropertyValueSpecification<number>
            | undefined;
          if (strokeWidth !== undefined) {
            const parsedStrokeWidth =
              typeof strokeWidth === "number"
                ? strokeWidth
                : parseFloat(strokeWidth as unknown as string);
            setMapboxLayerStyle((prev) => ({
              ...prev,
              stroke_width: parsedStrokeWidth,
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
        }
      }
    }
  };

  useEffect(() => {
    getStyleLayer();
  }, [selectedLayer]);

  const setPaint = (
    paint_type: string,
    value: string | number | undefined | null
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
      if (type == "fill") {
        setPaint("-outline-color", value);
      } else {
        setPaint("-stroke-color", value);
      }
    }
  };

  const setStrokeWidth = (value: number) => {
    console.log(value);
    setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: value });
    setPaint("-stroke-width", value);
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
      if (type == "fill") {
        setPaint("-outline-color", defaultColor);
      } else {
        setPaint("-stroke-color", defaultColor);
      }
    }
  };

  const resetStrokeWidth = () => {
    const strokeWidth = 0;
    setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: strokeWidth });
    setPaint("-stroke-width", strokeWidth);
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
                          value={mapboxLayerStyle.fill}
                          className="absolute h-[150%] w-[150%] -translate-x-2 -translate-y-2 cursor-pointer"
                          onChange={(e) => {
                            console.log(selectedLayer)
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
                      value={[mapboxLayerStyle.stroke_width ?? 100]}
                      onValueChange={([stroke_width]) => {
                        setMapboxLayerStyle({
                          ...mapboxLayerStyle,
                          stroke_width,
                        });
                        setStrokeWidth(stroke_width);
                      }}
                      max={100}
                      step={1}
                    />
                    {/* <Slider
                      value={[mapboxLayerStyle.stroke_width ?? 100]}
                      max={100}
                      step={1}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                      onValueChange={([stroke_width]) => {
                        setMapboxLayerStyle({
                          ...mapboxLayerStyle,
                          stroke_width,
                        });
                        setStrokeWidth(stroke_width);
                      }}
                    /> */}
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
                        setMapboxLayerStyle({ ...mapboxLayerStyle, contrast });
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
        </div>
      </ScrollArea>
    </>
  );
}
