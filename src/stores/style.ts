import { Layer } from "@/types/map.types";
import { create } from "zustand";
import { useMapStore } from "./map";

interface FillStyle {
  fillColor: string;
  fillOpacity: number;
  fillOutlineColor: string;
  fillPattern?: string;
  fillAntialias: boolean;
  fillTranslate: [number, number];
  fillTranslateAnchor: "map" | "viewport";
  fillEmissiveStrength: number;
  fillZOffset: number;
}

interface LineStyle {
  lineColor: string;
  lineOpacity: number;
  lineWidth: number;
  lineBlur: number;
  lineOffset: number;
  lineGapWidth: number;
  lineDasharray?: number[];
  linePattern?: string;
  lineTranslate: [number, number];
  lineTranslateAnchor: "map" | "viewport";
  lineCap: "butt" | "round" | "square";
  lineJoin: "bevel" | "round" | "miter" | "none";
  lineMiterLimit: number;
  lineRoundLimit: number;
  lineEmissiveStrength: number;
  lineOcclusionOpacity: number;
  lineZOffset: number;
}

interface CircleStyle {
  circleColor: string;
  circleOpacity: number;
  circleRadius: number;
  circleBlur: number;
  circleStrokeColor: string;
  circleStrokeOpacity: number;
  circleStrokeWidth: number;
  circleTranslate: [number, number];
  circleTranslateAnchor: "map" | "viewport";
  circlePitchAlignment: "map" | "viewport";
  circlePitchScale: "map" | "viewport";
  circleEmissiveStrength: number;
}

interface FillExtrusionStyle {
  fillExtrusionColor: string;
  fillExtrusionOpacity: number;
  fillExtrusionHeight: number;
  fillExtrusionBase: number;
  fillExtrusionPattern?: string;
  fillExtrusionTranslate: [number, number];
  fillExtrusionTranslateAnchor: "map" | "viewport";
  fillExtrusionVerticalGradient: boolean;
  fillExtrusionAmbientOcclusionIntensity: number;
  fillExtrusionAmbientOcclusionRadius: number;
  fillExtrusionEmissiveStrength: number;
  fillExtrusionFloodLightColor: string;
  fillExtrusionFloodLightIntensity: number;
  fillExtrusionVerticalScale: number;
  fillExtrusionEdgeRadius: number;
  fillExtrusionCastShadows: boolean;
}

interface SymbolStyle {
  // Text properties
  textColor: string;
  textOpacity: number;
  textHaloColor: string;
  textHaloWidth: number;
  textHaloBlur: number;
  textTranslate: [number, number];
  textTranslateAnchor: "map" | "viewport";
  textEmissiveStrength: number;
  textOcclusionOpacity: number;
  // Icon properties
  iconColor: string;
  iconOpacity: number;
  iconHaloColor: string;
  iconHaloWidth: number;
  iconHaloBlur: number;
  iconTranslate: [number, number];
  iconTranslateAnchor: "map" | "viewport";
  iconEmissiveStrength: number;
  iconOcclusionOpacity: number;
}

interface HeatmapStyle {
  heatmapColor: string | any[]; // Can be expression
  heatmapIntensity: number;
  heatmapOpacity: number;
  heatmapRadius: number;
  heatmapWeight: number;
}

interface RasterStyle {
  rasterOpacity: number;
  rasterBrightnessMax: number;
  rasterBrightnessMin: number;
  rasterContrast: number;
  rasterHueRotate: number;
  rasterSaturation: number;
  rasterFadeDuration: number;
  rasterEmissiveStrength: number;
}

interface HillshadeStyle {
  hillshadeIlluminationDirection: number;
  hillshadeIlluminationAnchor: "map" | "viewport";
  hillshadeExaggeration: number;
  hillshadeShadowColor: string;
  hillshadeHighlightColor: string;
  hillshadeAccentColor: string;
  hillshadeEmissiveStrength: number;
}

interface BackgroundStyle {
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundPattern?: string;
  backgroundEmissiveStrength: number;
}

interface ModelStyle {
  modelColor: string;
  modelOpacity: number;
  modelRotation: [number, number, number];
  modelScale: [number, number, number];
  modelTranslation: [number, number, number];
  modelColorMixIntensity: number;
  modelEmissiveStrength: number;
  modelAmbientOcclusionIntensity: number;
  modelRoughness: number;
  modelCastShadows: boolean;
  modelReceiveShadows: boolean;
}

interface SkyStyle {
  skyType: "gradient" | "atmosphere";
  skyAtmosphereSun: [number, number];
  skyAtmosphereSunIntensity: number;
  skyGradientCenter: [number, number];
  skyGradientRadius: number;
  skyGradient: string | any[];
  skyOpacity: number;
}

interface LayerConfig {
  radiusMode: "static" | "attribute";
  fillColorMode: "static" | "attribute";
  strokeColorMode: "static" | "attribute";
  lineColorMode: "static" | "attribute";

  // Attribute configs
  fillColorField: string;
  fillColorItems: Array<{ id: string; value: string; color: string }>;
  fillColorDefault: string;

  strokeColorField: string;
  strokeColorItems: Array<{ id: string; value: string; color: string }>;
  strokeColorDefault: string;

  lineColorField: string;
  lineColorItems: Array<{ id: string; value: string; color: string }>;
  lineColorDefault: string;

  radiusField: string;
  radiusValueMin: number;
  radiusValueMax: number;
  radiusMin: number;
  radiusMax: number;

  // Symbol attribute configs
  symbolTextSizeMode: "static" | "attribute";
  symbolTextSizeField: string;
  symbolTextValueMin: number;
  symbolTextValueMax: number;
  symbolTextSizeMin: number;
  symbolTextSizeMax: number;

  symbolIconSizeMode: "static" | "attribute";
  symbolIconSizeField: string;
  symbolIconValueMin: number;
  symbolIconValueMax: number;
  symbolIconSizeMin: number;
  symbolIconSizeMax: number;

  // Heatmap attribute configs
  heatmapWeightField: string;
  heatmapWeightMin: number;
  heatmapWeightMax: number;

  circleViz: "standard" | "marker" | "heatmap";

  // Persistent static values
  staticStyles: {
    fill: string;
    stroke: string;
    stroke_width: number;
    line_width: number;
    line_dasharray: number[];
    circle_radius: number;
    opacity: number;
    contrast: number;
    saturation: number;
    brightness: [number, number];
    zoom: [number, number];
    model_color: string;
    model_opacity: number;
    heatmap_intensity: number;
    heatmap_radius: number;
    heatmap_opacity: number;
    heatmap_color_stops: Array<[number, string]>;
    model_emissive_strength: number;
    model_rotation: number[];
    fill_extrusion_color: string;
    fill_extrusion_opacity: number;
    fill_extrusion_height: number;
    fill_extrusion_base: number;
    fill_extrusion_vertical_gradient: boolean;

    // Visibility
    visibility: "visible" | "none";

    // Symbol - Icon
    icon_allow_overlap: boolean;
    icon_anchor: "center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    icon_color: string;
    icon_color_brightness_max: number;
    icon_color_brightness_min: number;
    icon_color_contrast: number;
    icon_color_saturation: number;
    icon_emissive_strength: number;
    icon_halo_blur: number;
    icon_halo_color: string;
    icon_halo_width: number;
    icon_ignore_placement: boolean;
    icon_image: string;
    icon_image_cross_fade: number;
    icon_keep_upright: boolean;
    icon_occlusion_opacity: number;
    icon_offset: [number, number];
    icon_opacity: number;
    icon_optional: boolean;
    icon_padding: number;
    icon_pitch_alignment: "map" | "viewport" | "auto";
    icon_rotate: number;
    icon_rotation_alignment: "map" | "viewport" | "auto";
    icon_size: number;
    icon_text_fit: "none" | "width" | "height" | "both";
    icon_text_fit_padding: [number, number, number, number];
    icon_translate: [number, number];
    icon_translate_anchor: "map" | "viewport";

    // Symbol - Layout Properties
    symbol_avoid_edges: boolean;
    symbol_elevation_reference: "sea" | "ground";
    symbol_placement: "point" | "line" | "line-center";
    symbol_sort_key: number;
    symbol_spacing: number;
    symbol_z_elevate: boolean;
    symbol_z_offset: number;
    symbol_z_order: "auto" | "viewport-y" | "source";

    // Symbol - Text
    text_allow_overlap: boolean;
    text_anchor: "center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
    text_color: string;
    text_emissive_strength: number;
    text_field: string; // The property name to use
    text_font: string[];
    text_halo_blur: number;
    text_halo_color: string;
    text_halo_width: number;
    text_ignore_placement: boolean;
    text_justify: "auto" | "left" | "center" | "right";
    text_keep_upright: boolean;
    text_letter_spacing: number;
    text_line_height: number;
    text_max_angle: number;
    text_max_width: number;
    text_occlusion_opacity: number;
    text_offset: [number, number];
    text_opacity: number;
    text_optional: boolean;
    text_padding: number;
    text_pitch_alignment: "map" | "viewport" | "auto";
    text_radial_offset: number;
    text_rotate: number;
    text_rotation_alignment: "map" | "viewport" | "auto";
    text_size: number;
    text_transform: "none" | "uppercase" | "lowercase";
    text_translate: [number, number];
    text_translate_anchor: "map" | "viewport";
    text_variable_anchor: Array<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">;
    text_writing_mode: Array<"horizontal" | "vertical">;
  };
}

interface MapboxStyleState {
  layerConfigs: Record<string, LayerConfig>;
  getLayerConfig: (layerId: string) => LayerConfig;
  updateLayerConfig: (layerId: string, updates: Partial<LayerConfig>) => void;

  // Styles for different layer types
  fillStyle: FillStyle;
  lineStyle: LineStyle;
  circleStyle: CircleStyle;
  fillExtrusionStyle: FillExtrusionStyle;
  symbolStyle: SymbolStyle;
  heatmapStyle: HeatmapStyle;
  rasterStyle: RasterStyle;
  hillshadeStyle: HillshadeStyle;
  backgroundStyle: BackgroundStyle;
  modelStyle: ModelStyle;
  skyStyle: SkyStyle;

  // Generic paint property setter
  setPaintProperty: (
    paintType: string,
    value: string | number | boolean | number[] | undefined | null
  ) => void;

  // Fill style actions
  setFillColor: (color: string) => void;
  setFillOpacity: (opacity: number) => void;
  setFillOutlineColor: (color: string) => void;
  setFillPattern: (pattern: string) => void;
  setFillAntialias: (antialias: boolean) => void;
  setFillTranslate: (translate: [number, number]) => void;
  setFillEmissiveStrength: (strength: number) => void;
  setFillZOffset: (offset: number) => void;

  // Line style actions
  setLineColor: (color: string) => void;
  setLineOpacity: (opacity: number) => void;
  setLineWidth: (width: number) => void;
  setLineBlur: (blur: number) => void;
  setLineOffset: (offset: number) => void;
  setLineGapWidth: (width: number) => void;
  setLineDasharray: (dasharray: number[]) => void;
  setLinePattern: (pattern: string) => void;
  setLineTranslate: (translate: [number, number]) => void;
  setLineCap: (cap: "butt" | "round" | "square") => void;
  setLineJoin: (join: "bevel" | "round" | "miter" | "none") => void;
  setLineEmissiveStrength: (strength: number) => void;
  setLineOcclusionOpacity: (opacity: number) => void;
  setLineZOffset: (offset: number) => void;

  // Circle style actions
  setCircleColor: (color: string) => void;
  setCircleOpacity: (opacity: number) => void;
  setCircleRadius: (radius: number) => void;
  setCircleBlur: (blur: number) => void;
  setCircleStrokeColor: (color: string) => void;
  setCircleStrokeOpacity: (opacity: number) => void;
  setCircleStrokeWidth: (width: number) => void;
  setCircleTranslate: (translate: [number, number]) => void;
  setCirclePitchAlignment: (alignment: "map" | "viewport") => void;
  setCircleEmissiveStrength: (strength: number) => void;

  // Fill Extrusion style actions
  setFillExtrusionColor: (color: string) => void;
  setFillExtrusionOpacity: (opacity: number) => void;
  setFillExtrusionHeight: (height: number) => void;
  setFillExtrusionBase: (base: number) => void;
  setFillExtrusionPattern: (pattern: string) => void;
  setFillExtrusionTranslate: (translate: [number, number]) => void;
  setFillExtrusionVerticalGradient: (gradient: boolean) => void;
  setFillExtrusionAmbientOcclusionIntensity: (intensity: number) => void;
  setFillExtrusionEmissiveStrength: (strength: number) => void;
  setFillExtrusionFloodLightColor: (color: string) => void;
  setFillExtrusionFloodLightIntensity: (intensity: number) => void;
  setFillExtrusionVerticalScale: (scale: number) => void;
  setFillExtrusionEdgeRadius: (radius: number) => void;
  setFillExtrusionCastShadows: (castShadows: boolean) => void;

  // Symbol style actions
  setTextColor: (color: string) => void;
  setTextOpacity: (opacity: number) => void;
  setTextHaloColor: (color: string) => void;
  setTextHaloWidth: (width: number) => void;
  setTextHaloBlur: (blur: number) => void;
  setTextEmissiveStrength: (strength: number) => void;
  setIconColor: (color: string) => void;
  setIconOpacity: (opacity: number) => void;
  setIconHaloColor: (color: string) => void;
  setIconHaloWidth: (width: number) => void;
  setIconEmissiveStrength: (strength: number) => void;

  // Heatmap style actions
  setHeatmapColor: (color: string | any[]) => void;
  setHeatmapIntensity: (intensity: number) => void;
  setHeatmapOpacity: (opacity: number) => void;
  setHeatmapRadius: (radius: number) => void;
  setHeatmapWeight: (weight: number) => void;

  // Raster style actions
  setRasterOpacity: (opacity: number) => void;
  setRasterBrightnessMax: (brightness: number) => void;
  setRasterBrightnessMin: (brightness: number) => void;
  setRasterContrast: (contrast: number) => void;
  setRasterHueRotate: (hue: number) => void;
  setRasterSaturation: (saturation: number) => void;
  setRasterEmissiveStrength: (strength: number) => void;

  // Hillshade style actions
  setHillshadeIlluminationDirection: (direction: number) => void;
  setHillshadeExaggeration: (exaggeration: number) => void;
  setHillshadeShadowColor: (color: string) => void;
  setHillshadeHighlightColor: (color: string) => void;
  setHillshadeAccentColor: (color: string) => void;
  setHillshadeEmissiveStrength: (strength: number) => void;

  // Background style actions
  setBackgroundColor: (color: string) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundPattern: (pattern: string) => void;
  setBackgroundEmissiveStrength: (strength: number) => void;

  // Model style actions
  setModelColor: (color: string) => void;
  setModelOpacity: (opacity: number) => void;
  setModelRotation: (rotation: [number, number, number]) => void;
  setModelScale: (scale: [number, number, number]) => void;
  setModelTranslation: (translation: [number, number, number]) => void;
  setModelColorMixIntensity: (intensity: number) => void;
  setModelEmissiveStrength: (strength: number) => void;
  setModelRoughness: (roughness: number) => void;
  setModelCastShadows: (castShadows: boolean) => void;

  // Sky style actions
  setSkyType: (type: "gradient" | "atmosphere") => void;
  setSkyAtmosphereSun: (sun: [number, number]) => void;
  setSkyAtmosphereSunIntensity: (intensity: number) => void;
  setSkyGradientCenter: (center: [number, number]) => void;
  setSkyGradientRadius: (radius: number) => void;
  setSkyGradient: (gradient: string | any[]) => void;
  setSkyOpacity: (opacity: number) => void;
}

// Default styles
const defaultFillStyle: FillStyle = {
  fillColor: "#000000",
  fillOpacity: 1,
  fillOutlineColor: "#000000",
  fillAntialias: true,
  fillTranslate: [0, 0],
  fillTranslateAnchor: "map",
  fillEmissiveStrength: 0,
  fillZOffset: 0,
};

const defaultLineStyle: LineStyle = {
  lineColor: "#000000",
  lineOpacity: 1,
  lineWidth: 1,
  lineBlur: 0,
  lineOffset: 0,
  lineGapWidth: 0,
  lineTranslate: [0, 0],
  lineTranslateAnchor: "map",
  lineCap: "butt",
  lineJoin: "miter",
  lineMiterLimit: 2,
  lineRoundLimit: 1.05,
  lineEmissiveStrength: 0,
  lineOcclusionOpacity: 0,
  lineZOffset: 0,
};

const defaultCircleStyle: CircleStyle = {
  circleColor: "#000000",
  circleOpacity: 1,
  circleRadius: 5,
  circleBlur: 0,
  circleStrokeColor: "#000000",
  circleStrokeOpacity: 1,
  circleStrokeWidth: 0,
  circleTranslate: [0, 0],
  circleTranslateAnchor: "map",
  circlePitchAlignment: "viewport",
  circlePitchScale: "map",
  circleEmissiveStrength: 0,
};

const defaultFillExtrusionStyle: FillExtrusionStyle = {
  fillExtrusionColor: "#000000",
  fillExtrusionOpacity: 1,
  fillExtrusionHeight: 0,
  fillExtrusionBase: 0,
  fillExtrusionTranslate: [0, 0],
  fillExtrusionTranslateAnchor: "map",
  fillExtrusionVerticalGradient: true,
  fillExtrusionAmbientOcclusionIntensity: 0,
  fillExtrusionAmbientOcclusionRadius: 3,
  fillExtrusionEmissiveStrength: 0,
  fillExtrusionFloodLightColor: "#ffffff",
  fillExtrusionFloodLightIntensity: 0,
  fillExtrusionVerticalScale: 1,
  fillExtrusionEdgeRadius: 0,
  fillExtrusionCastShadows: true,
};

const defaultSymbolStyle: SymbolStyle = {
  textColor: "#000000",
  textOpacity: 1,
  textHaloColor: "rgba(0,0,0,0)",
  textHaloWidth: 0,
  textHaloBlur: 0,
  textTranslate: [0, 0],
  textTranslateAnchor: "map",
  textEmissiveStrength: 0,
  textOcclusionOpacity: 0,
  iconColor: "#000000",
  iconOpacity: 1,
  iconHaloColor: "rgba(0,0,0,0)",
  iconHaloWidth: 0,
  iconHaloBlur: 0,
  iconTranslate: [0, 0],
  iconTranslateAnchor: "map",
  iconEmissiveStrength: 0,
  iconOcclusionOpacity: 0,
};

const defaultHeatmapStyle: HeatmapStyle = {
  heatmapColor: [
    "interpolate",
    ["linear"],
    ["heatmap-density"],
    0,
    "rgba(0, 0, 255, 0)",
    0.1,
    "royalblue",
    0.3,
    "cyan",
    0.5,
    "lime",
    0.7,
    "yellow",
    1,
    "red",
  ],
  heatmapIntensity: 1,
  heatmapOpacity: 1,
  heatmapRadius: 30,
  heatmapWeight: 1,
};

const defaultRasterStyle: RasterStyle = {
  rasterOpacity: 1,
  rasterBrightnessMax: 1,
  rasterBrightnessMin: 0,
  rasterContrast: 0,
  rasterHueRotate: 0,
  rasterSaturation: 0,
  rasterFadeDuration: 300,
  rasterEmissiveStrength: 0,
};

const defaultHillshadeStyle: HillshadeStyle = {
  hillshadeIlluminationDirection: 335,
  hillshadeIlluminationAnchor: "viewport",
  hillshadeExaggeration: 0.5,
  hillshadeShadowColor: "#000000",
  hillshadeHighlightColor: "#FFFFFF",
  hillshadeAccentColor: "#000000",
  hillshadeEmissiveStrength: 0,
};

const defaultBackgroundStyle: BackgroundStyle = {
  backgroundColor: "#000000",
  backgroundOpacity: 1,
  backgroundEmissiveStrength: 0,
};

const defaultModelStyle: ModelStyle = {
  modelColor: "#ffffff",
  modelOpacity: 1,
  modelRotation: [0, 0, 0],
  modelScale: [1, 1, 1],
  modelTranslation: [0, 0, 0],
  modelColorMixIntensity: 0,
  modelEmissiveStrength: 0,
  modelAmbientOcclusionIntensity: 1,
  modelRoughness: 1,
  modelCastShadows: true,
  modelReceiveShadows: true,
};

const defaultSkyStyle: SkyStyle = {
  skyType: "atmosphere",
  skyAtmosphereSun: [0, 0],
  skyAtmosphereSunIntensity: 10,
  skyGradientCenter: [0, 0],
  skyGradientRadius: 90,
  skyGradient: [
    "interpolate",
    ["linear"],
    ["sky-radial-progress"],
    0.8,
    "rgba(135, 206, 235, 1)",
    1.0,
    "rgba(0, 0, 0, 0.1)",
  ],
  skyOpacity: 1,
};

export const defaultLayerConfig: LayerConfig = {
  radiusMode: "static",
  fillColorMode: "static",
  strokeColorMode: "static",
  lineColorMode: "static",
  fillColorField: "",
  fillColorItems: [],
  fillColorDefault: "#000000",
  strokeColorField: "",
  strokeColorItems: [],
  strokeColorDefault: "#000000",
  lineColorField: "",
  lineColorItems: [],
  lineColorDefault: "#000000",
  radiusField: "",
  radiusValueMin: 0,
  radiusValueMax: 100,
  radiusMin: 2,
  radiusMax: 12,
  symbolTextSizeMode: "static",
  symbolTextSizeField: "",
  symbolTextValueMin: 0,
  symbolTextValueMax: 100,
  symbolTextSizeMin: 12,
  symbolTextSizeMax: 24,
  symbolIconSizeMode: "static",
  symbolIconSizeField: "",
  symbolIconValueMin: 0,
  symbolIconValueMax: 100,
  symbolIconSizeMin: 0.5,
  symbolIconSizeMax: 2,
  heatmapWeightField: "",
  heatmapWeightMin: 0,
  heatmapWeightMax: 1,
  circleViz: "standard",
  staticStyles: {
    fill: "#000000",
    stroke: "#000000",
    stroke_width: 0,
    line_width: 0,
    line_dasharray: [],
    circle_radius: 5,
    opacity: 100,
    contrast: 0,
    saturation: 0,
    brightness: [0, 1],
    zoom: [0, 24],
    model_color: "#000000",
    model_opacity: 100,
    heatmap_intensity: 1,
    heatmap_radius: 20,
    heatmap_opacity: 100,
    heatmap_color_stops: [],
    model_emissive_strength: 0,
    model_rotation: [0, 0, 0],
    fill_extrusion_color: "#000000",
    fill_extrusion_opacity: 100,
    fill_extrusion_height: 0,
    fill_extrusion_base: 0,
    fill_extrusion_vertical_gradient: true,
    visibility: "visible",

    // Icon defaults
    icon_allow_overlap: false,
    icon_anchor: "center",
    icon_color: "#000000",
    icon_color_brightness_max: 1,
    icon_color_brightness_min: 0,
    icon_color_contrast: 0,
    icon_color_saturation: 0,
    icon_emissive_strength: 0,
    icon_halo_blur: 0,
    icon_halo_color: "rgba(0,0,0,0)",
    icon_halo_width: 0,
    icon_ignore_placement: false,
    icon_image: "",
    icon_image_cross_fade: 0,
    icon_keep_upright: false,
    icon_occlusion_opacity: 0,
    icon_offset: [0, 0],
    icon_opacity: 100,
    icon_optional: false,
    icon_padding: 2,
    icon_pitch_alignment: "auto",
    icon_rotate: 0,
    icon_rotation_alignment: "auto",
    icon_size: 1,
    icon_text_fit: "none",
    icon_text_fit_padding: [0, 0, 0, 0],
    icon_translate: [0, 0],
    icon_translate_anchor: "map",

    // Symbol layout defaults
    symbol_avoid_edges: false,
    symbol_elevation_reference: "ground",
    symbol_placement: "point",
    symbol_sort_key: 0,
    symbol_spacing: 250,
    symbol_z_elevate: true,
    symbol_z_offset: 0,
    symbol_z_order: "auto",

    // Text defaults
    text_allow_overlap: false,
    text_anchor: "center",
    text_color: "#000000",
    text_emissive_strength: 0,
    text_field: "",
    text_font: ["Open Sans Regular", "Arial Unicode MS Regular"],
    text_halo_blur: 0,
    text_halo_color: "rgba(0,0,0,0)",
    text_halo_width: 0,
    text_ignore_placement: false,
    text_justify: "center",
    text_keep_upright: true,
    text_letter_spacing: 0,
    text_line_height: 1.2,
    text_max_angle: 45,
    text_max_width: 10,
    text_occlusion_opacity: 0,
    text_offset: [0, 0],
    text_opacity: 100,
    text_optional: false,
    text_padding: 2,
    text_pitch_alignment: "auto",
    text_radial_offset: 0,
    text_rotate: 0,
    text_rotation_alignment: "auto",
    text_size: 16,
    text_transform: "none",
    text_translate: [0, 0],
    text_translate_anchor: "map",
    text_variable_anchor: [],
    text_writing_mode: ["horizontal"],
  },
};

const mapRef = useMapStore.getState().map;
const selectedLayer = useMapStore.getState().selectedLayer;

export const useMapboxStyleStore = create<MapboxStyleState>((set, get) => ({
  layerConfigs: {},
  getLayerConfig: (layerId) => {
    return get().layerConfigs[layerId] || defaultLayerConfig;
  },
  updateLayerConfig: (layerId, updates) => {
    set((state) => ({
      layerConfigs: {
        ...state.layerConfigs,
        [layerId]: {
          ...(state.layerConfigs[layerId] || defaultLayerConfig),
          ...updates,
        },
      },
    }));
  },

  // Initial state
  fillStyle: defaultFillStyle,
  lineStyle: defaultLineStyle,
  circleStyle: defaultCircleStyle,
  fillExtrusionStyle: defaultFillExtrusionStyle,
  symbolStyle: defaultSymbolStyle,
  heatmapStyle: defaultHeatmapStyle,
  rasterStyle: defaultRasterStyle,
  hillshadeStyle: defaultHillshadeStyle,
  backgroundStyle: defaultBackgroundStyle,
  modelStyle: defaultModelStyle,
  skyStyle: defaultSkyStyle,

  // Generic paint property setter
  setPaintProperty: (paintType, value) => {
    const map = mapRef?.current?.getMap();

    if (selectedLayer && map && value !== null && value !== undefined) {
      const layerId = selectedLayer.id;
      const type = map.getLayer(layerId)?.type;

      if (type) {
        const paintPropertyName =
          `${type}${paintType}` as keyof mapboxgl.PaintSpecification;
        map.setPaintProperty(layerId, paintPropertyName, value);
      }
    }
  },

  // Fill style actions
  setFillColor: (color) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setFillOpacity: (opacity) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setFillOutlineColor: (color) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillOutlineColor: color },
    }));
    get().setPaintProperty("-outline-color", color);
  },

  setFillPattern: (pattern) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillPattern: pattern },
    }));
    get().setPaintProperty("-pattern", pattern);
  },

  setFillAntialias: (antialias) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillAntialias: antialias },
    }));
    get().setPaintProperty("-antialias", antialias);
  },

  setFillTranslate: (translate) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillTranslate: translate },
    }));
    get().setPaintProperty("-translate", translate);
  },

  setFillEmissiveStrength: (strength) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  setFillZOffset: (offset) => {
    set((state) => ({
      fillStyle: { ...state.fillStyle, fillZOffset: offset },
    }));
    get().setPaintProperty("-z-offset", offset);
  },

  // Line style actions
  setLineColor: (color) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setLineOpacity: (opacity) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setLineWidth: (width) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineWidth: width },
    }));
    get().setPaintProperty("-width", width);
  },

  setLineBlur: (blur) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineBlur: blur },
    }));
    get().setPaintProperty("-blur", blur);
  },

  setLineOffset: (offset) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineOffset: offset },
    }));
    get().setPaintProperty("-offset", offset);
  },

  setLineGapWidth: (width) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineGapWidth: width },
    }));
    get().setPaintProperty("-gap-width", width);
  },

  setLineDasharray: (dasharray) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineDasharray: dasharray },
    }));
    get().setPaintProperty("-dasharray", dasharray);
  },

  setLinePattern: (pattern) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, linePattern: pattern },
    }));
    get().setPaintProperty("-pattern", pattern);
  },

  setLineTranslate: (translate) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineTranslate: translate },
    }));
    get().setPaintProperty("-translate", translate);
  },

  setLineCap: (cap) => {
    const map = mapRef?.current?.getMap();

    set((state) => ({
      lineStyle: { ...state.lineStyle, lineCap: cap },
    }));

    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "line-cap", cap);
    }
  },

  setLineJoin: (join) => {
    const map = mapRef?.current?.getMap();

    set((state) => ({
      lineStyle: { ...state.lineStyle, lineJoin: join },
    }));

    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "line-join", join);
    }
  },

  setLineEmissiveStrength: (strength) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  setLineOcclusionOpacity: (opacity) => {
    set((state) => ({
      lineStyle: { ...state.lineStyle, lineOcclusionOpacity: opacity },
    }));
    get().setPaintProperty("-occlusion-opacity", opacity);
  },

  setLineZOffset: (offset) => {
    const map = mapRef?.current?.getMap();

    set((state) => ({
      lineStyle: { ...state.lineStyle, lineZOffset: offset },
    }));

    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "line-z-offset", offset);
    }
  },

  // Circle style actions
  setCircleColor: (color) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setCircleOpacity: (opacity) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setCircleRadius: (radius) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleRadius: radius },
    }));
    get().setPaintProperty("-radius", radius);
  },

  setCircleBlur: (blur) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleBlur: blur },
    }));
    get().setPaintProperty("-blur", blur);
  },

  setCircleStrokeColor: (color) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleStrokeColor: color },
    }));
    get().setPaintProperty("-stroke-color", color);
  },

  setCircleStrokeOpacity: (opacity) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleStrokeOpacity: opacity },
    }));
    get().setPaintProperty("-stroke-opacity", opacity);
  },

  setCircleStrokeWidth: (width) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleStrokeWidth: width },
    }));
    get().setPaintProperty("-stroke-width", width);
  },

  setCircleTranslate: (translate) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleTranslate: translate },
    }));
    get().setPaintProperty("-translate", translate);
  },

  setCirclePitchAlignment: (alignment) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circlePitchAlignment: alignment },
    }));
    get().setPaintProperty("-pitch-alignment", alignment);
  },

  setCircleEmissiveStrength: (strength) => {
    set((state) => ({
      circleStyle: { ...state.circleStyle, circleEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  // Fill Extrusion style actions
  setFillExtrusionColor: (color) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionColor: color,
      },
    }));
    get().setPaintProperty("-color", color);
  },

  setFillExtrusionOpacity: (opacity) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionOpacity: opacity,
      },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setFillExtrusionHeight: (height) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionHeight: height,
      },
    }));
    get().setPaintProperty("-height", height);
  },

  setFillExtrusionBase: (base) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionBase: base,
      },
    }));
    get().setPaintProperty("-base", base);
  },

  setFillExtrusionPattern: (pattern) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionPattern: pattern,
      },
    }));
    get().setPaintProperty("-pattern", pattern);
  },

  setFillExtrusionTranslate: (translate) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionTranslate: translate,
      },
    }));
    get().setPaintProperty("-translate", translate);
  },

  setFillExtrusionVerticalGradient: (gradient) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionVerticalGradient: gradient,
      },
    }));
    get().setPaintProperty("-vertical-gradient", gradient);
  },

  setFillExtrusionAmbientOcclusionIntensity: (intensity) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionAmbientOcclusionIntensity: intensity,
      },
    }));
    get().setPaintProperty("-ambient-occlusion-intensity", intensity);
  },

  setFillExtrusionEmissiveStrength: (strength) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionEmissiveStrength: strength,
      },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  setFillExtrusionFloodLightColor: (color) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionFloodLightColor: color,
      },
    }));
    get().setPaintProperty("-flood-light-color", color);
  },

  setFillExtrusionFloodLightIntensity: (intensity) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionFloodLightIntensity: intensity,
      },
    }));
    get().setPaintProperty("-flood-light-intensity", intensity);
  },

  setFillExtrusionVerticalScale: (scale) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionVerticalScale: scale,
      },
    }));
    get().setPaintProperty("-vertical-scale", scale);
  },

  setFillExtrusionEdgeRadius: (radius) => {
    const map = mapRef?.current?.getMap();

    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionEdgeRadius: radius,
      },
    }));

    if (selectedLayer && map) {
      map.setLayoutProperty(selectedLayer.id, "fill-extrusion-edge-radius", [
        "-gradient-radius",
        radius,
      ]);
    }
  },

  setFillExtrusionCastShadows: (castShadows) => {
    set((state) => ({
      fillExtrusionStyle: {
        ...state.fillExtrusionStyle,
        fillExtrusionCastShadows: castShadows,
      },
    }));
    get().setPaintProperty("-cast-shadows", castShadows);
  },

  // Symbol style actions
  setTextColor: (color) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setTextOpacity: (opacity) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setTextHaloColor: (color) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textHaloColor: color },
    }));
    get().setPaintProperty("-halo-color", color);
  },

  setTextHaloWidth: (width) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textHaloWidth: width },
    }));
    get().setPaintProperty("-halo-width", width);
  },

  setTextHaloBlur: (blur) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textHaloBlur: blur },
    }));
    get().setPaintProperty("-halo-blur", blur);
  },

  setTextEmissiveStrength: (strength) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, textEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  setIconColor: (color) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, iconColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setIconOpacity: (opacity) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, iconOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setIconHaloColor: (color) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, iconHaloColor: color },
    }));
    get().setPaintProperty("-halo-color", color);
  },

  setIconHaloWidth: (width) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, iconHaloWidth: width },
    }));
    get().setPaintProperty("-halo-width", width);
  },

  setIconEmissiveStrength: (strength) => {
    set((state) => ({
      symbolStyle: { ...state.symbolStyle, iconEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  // Heatmap style actions
  setHeatmapColor: (color) => {
    set((state) => ({
      heatmapStyle: { ...state.heatmapStyle, heatmapColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setHeatmapIntensity: (intensity) => {
    set((state) => ({
      heatmapStyle: { ...state.heatmapStyle, heatmapIntensity: intensity },
    }));
    get().setPaintProperty("-intensity", intensity);
  },

  setHeatmapOpacity: (opacity) => {
    set((state) => ({
      heatmapStyle: { ...state.heatmapStyle, heatmapOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setHeatmapRadius: (radius) => {
    set((state) => ({
      heatmapStyle: { ...state.heatmapStyle, heatmapRadius: radius },
    }));
    get().setPaintProperty("-radius", radius);
  },

  setHeatmapWeight: (weight) => {
    set((state) => ({
      heatmapStyle: { ...state.heatmapStyle, heatmapWeight: weight },
    }));
    get().setPaintProperty("-weight", weight);
  },

  // Raster style actions
  setRasterOpacity: (opacity) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setRasterBrightnessMax: (brightness) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterBrightnessMax: brightness },
    }));
    get().setPaintProperty("-brightness-max", brightness);
  },

  setRasterBrightnessMin: (brightness) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterBrightnessMin: brightness },
    }));
    get().setPaintProperty("-brightness-min", brightness);
  },

  setRasterContrast: (contrast) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterContrast: contrast },
    }));
    get().setPaintProperty("-contrast", contrast);
  },

  setRasterHueRotate: (hue) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterHueRotate: hue },
    }));
    get().setPaintProperty("-hue-rotate", hue);
  },

  setRasterSaturation: (saturation) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterSaturation: saturation },
    }));
    get().setPaintProperty("-saturation", saturation);
  },

  setRasterEmissiveStrength: (strength) => {
    set((state) => ({
      rasterStyle: { ...state.rasterStyle, rasterEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  // Hillshade style actions
  setHillshadeIlluminationDirection: (direction) => {
    set((state) => ({
      hillshadeStyle: {
        ...state.hillshadeStyle,
        hillshadeIlluminationDirection: direction,
      },
    }));
    get().setPaintProperty("-illumination-direction", direction);
  },

  setHillshadeExaggeration: (exaggeration) => {
    set((state) => ({
      hillshadeStyle: {
        ...state.hillshadeStyle,
        hillshadeExaggeration: exaggeration,
      },
    }));
    get().setPaintProperty("-exaggeration", exaggeration);
  },

  setHillshadeShadowColor: (color) => {
    set((state) => ({
      hillshadeStyle: { ...state.hillshadeStyle, hillshadeShadowColor: color },
    }));
    get().setPaintProperty("-shadow-color", color);
  },

  setHillshadeHighlightColor: (color) => {
    set((state) => ({
      hillshadeStyle: {
        ...state.hillshadeStyle,
        hillshadeHighlightColor: color,
      },
    }));
    get().setPaintProperty("-highlight-color", color);
  },

  setHillshadeAccentColor: (color) => {
    set((state) => ({
      hillshadeStyle: { ...state.hillshadeStyle, hillshadeAccentColor: color },
    }));
    get().setPaintProperty("-accent-color", color);
  },

  setHillshadeEmissiveStrength: (strength) => {
    set((state) => ({
      hillshadeStyle: {
        ...state.hillshadeStyle,
        hillshadeEmissiveStrength: strength,
      },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  // Background style actions
  setBackgroundColor: (color) => {
    set((state) => ({
      backgroundStyle: { ...state.backgroundStyle, backgroundColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setBackgroundOpacity: (opacity) => {
    set((state) => ({
      backgroundStyle: { ...state.backgroundStyle, backgroundOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setBackgroundPattern: (pattern) => {
    set((state) => ({
      backgroundStyle: { ...state.backgroundStyle, backgroundPattern: pattern },
    }));
    get().setPaintProperty("-pattern", pattern);
  },

  setBackgroundEmissiveStrength: (strength) => {
    set((state) => ({
      backgroundStyle: {
        ...state.backgroundStyle,
        backgroundEmissiveStrength: strength,
      },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  // Model style actions
  setModelColor: (color) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelColor: color },
    }));
    get().setPaintProperty("-color", color);
  },

  setModelOpacity: (opacity) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },

  setModelRotation: (rotation) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelRotation: rotation },
    }));
    get().setPaintProperty("-rotation", rotation);
  },

  setModelScale: (scale) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelScale: scale },
    }));
    get().setPaintProperty("-scale", scale);
  },

  setModelTranslation: (translation) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelTranslation: translation },
    }));
    get().setPaintProperty("-translation", translation);
  },

  setModelColorMixIntensity: (intensity) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelColorMixIntensity: intensity },
    }));
    get().setPaintProperty("-color-mix-intensity", intensity);
  },

  setModelEmissiveStrength: (strength) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelEmissiveStrength: strength },
    }));
    get().setPaintProperty("-emissive-strength", strength);
  },

  setModelRoughness: (roughness) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelRoughness: roughness },
    }));
    get().setPaintProperty("-roughness", roughness);
  },

  setModelCastShadows: (castShadows) => {
    set((state) => ({
      modelStyle: { ...state.modelStyle, modelCastShadows: castShadows },
    }));
    get().setPaintProperty("-cast-shadows", castShadows);
  },

  // Sky style actions
  setSkyType: (type) => {
    const map = mapRef?.current?.getMap();

    set((state) => ({
      skyStyle: { ...state.skyStyle, skyType: type },
    }));

    if (selectedLayer && map) {
      map.setPaintProperty(selectedLayer.id, "sky-type", type);
    }
  },

  setSkyAtmosphereSun: (sun) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyAtmosphereSun: sun },
    }));
    get().setPaintProperty("-atmosphere-sun", sun);
  },

  setSkyAtmosphereSunIntensity: (intensity) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyAtmosphereSunIntensity: intensity },
    }));
    get().setPaintProperty("-atmosphere-sun-intensity", intensity);
  },

  setSkyGradientCenter: (center) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyGradientCenter: center },
    }));
    get().setPaintProperty("-gradient-center", center);
  },

  setSkyGradientRadius: (radius) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyGradientRadius: radius },
    }));
    get().setPaintProperty("-gradient-radius", radius);
  },

  setSkyGradient: (gradient) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyGradient: gradient },
    }));
    get().setPaintProperty("-gradient", gradient);
  },

  setSkyOpacity: (opacity) => {
    set((state) => ({
      skyStyle: { ...state.skyStyle, skyOpacity: opacity },
    }));
    get().setPaintProperty("-opacity", opacity);
  },
}));
