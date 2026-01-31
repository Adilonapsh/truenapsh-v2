import { MapLayerMouseEvent, MapMouseEvent, MapTouchEvent } from "mapbox-gl";
import { TransformRequestFunction } from "mapbox-gl";
import { ColorSpecification, ExpressionSpecification } from "mapbox-gl";
import React from "react";
import { MapRef } from "react-map-gl";

type MapComponentsProps = {
  layers?: Layer[];
  selectedBasemap?: string | null;
  initialViewState?: ViewState;
  onMouseMove?: (event: mapboxgl.MapMouseEvent) => void;
  mapRef?: React.RefObject<MapRef | null>;
  onZoom?: (event: mapboxgl.MapEvent) => void;
  onZoomEnd?: (event: mapboxgl.MapEvent) => void;
  onRotate?: (event: mapboxgl.MapEvent) => void;
  onClick?: (event: MapMouseEvent) => Promise<void> | void;
  onTouchEnd?: (event: MapTouchEvent) => Promise<void> | void;
  defaultMarkerPosition?: Location;
  onLoad?: () => void;
  onStyleData?: () => void;
  handleDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
  onContextMenu?: (e: MapLayerMouseEvent) => void;
  transformRequests?: TransformRequestFunction;
  onMoveStart?: (e: mapboxgl.MapEvent) => void;
  onMoveEnd?: (e: mapboxgl.MapEvent) => void;
};

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  minZoom: number;
  maxZoom?: number;
  pitch?: number;
  bearing?: number;
  hash: boolean;
};

type Place = {
  name: string;
  fullName: string;
  address: string;
  location: Location;
};

type Layer = {
  id: string;
  name: string;
  description?: string;
  map_service_url: string;
  map_service_layer_name: string;
  map_service_vendor: MapServiceVendor;
  type: "vector" | "raster" | "3d" | "2D";
  visible: boolean;
  min_zoom?: number;
  max_zoom?: number;
  status?: string;
  metadata?: object;
  rendered?: number;
  fields?: string[];
  filters?: string | string[] | ExpressionSpecification[] | undefined;
  render_type?:
  | "background"
  | "building"
  | "circle"
  | "clip"
  | "fill"
  | "fill-extrusion"
  | "heatmap"
  | "hillshade"
  | "line"
  | "model"
  | "raster"
  | "raster-particle"
  | "sky"
  | "symbol";
  folder?: string;
};

enum MapServiceVendor {
  Null = "",
  Geoserver = "Geoserver",
  ArcGIS = "ArcGIS",
  GeoJSON = "GeoJSON",
  XYZ = "XYZ",
  Image = "Image",
  Text = "Text",
  Icon = "Icon",
}

type Location = {
  lat: number;
  lng: number;
};

type WMSParams = {
  service: string;
  version: string;
  request: string;
  format: string;
  transparent: boolean;
  query_layers: string;
  layers: string;
  tiled: boolean;
  info_format: string;
  i: number;
  j: number;
  width: number;
  height: number;
  crs: string;
  styles: string;
  bbox: string;
};

type MapIsLoading = {
  initLoading: boolean;
  zoomToMap: boolean;
  featureInfo: boolean;
  dataset: boolean;
  layerTable: boolean;
};

type Coordinate = [number, number];
type BoundingBox = [Coordinate, Coordinate];

type MapboxLayerStyle = {
  opacity?: number | undefined;
  fill?: string | ColorSpecification | undefined;
  stroke?: string | ColorSpecification | undefined;
  stroke_width?: number | undefined;
  contrast?: number | undefined;
  saturation?: number | undefined;
  brightness?: number[] | undefined;
  zoom?: number[] | undefined;
  // Per-type additions
  line_width?: number | undefined;
  line_dasharray?: number[] | undefined;
  circle_radius?: number | undefined;
  model_color?: string | ColorSpecification | undefined;
  model_opacity?: number | undefined; // 0..100 in UI, mapped to 0..1
  model_emissive_strength?: number | undefined; // 0..5
  model_rotation?: number[] | undefined; // [x,y,z] in degrees
  // Fill-extrusion
  fill_extrusion_color?: string | ColorSpecification | undefined;
  fill_extrusion_opacity?: number | undefined; // 0..100 in UI
  fill_extrusion_height?: number | undefined;
  fill_extrusion_base?: number | undefined;
  fill_extrusion_vertical_gradient?: boolean | undefined;
  // Heatmap
  heatmap_intensity?: number | undefined;
  heatmap_radius?: number | undefined;
  heatmap_opacity?: number | undefined; // 0..100 in UI
  heatmap_color_stops?: Array<[number, string]> | undefined; // [stop,valueColor]
  // Hillshade
  hillshade_exaggeration?: number | undefined;
  hillshade_shadow_color?: string | ColorSpecification | undefined;
  hillshade_highlight_color?: string | ColorSpecification | undefined;
  hillshade_accent_color?: string | ColorSpecification | undefined;
  hillshade_illumination_direction?: number | undefined;
  hillshade_illumination_anchor?: "map" | "viewport" | undefined;
  // Symbol
  symbol_text_color?: string | ColorSpecification | undefined;
  symbol_icon_color?: string | ColorSpecification | undefined;
  symbol_text_size?: number | undefined;
  symbol_icon_size?: number | undefined;
  text_field?: string | any | undefined;
  text_size?: number | any | undefined;
  text_color?: string | ColorSpecification | undefined;
  text_halo_color?: string | ColorSpecification | undefined;
  text_halo_width?: number | undefined;
  text_anchor?: string | undefined;
  text_justify?: string | undefined;
  text_allow_overlap?: boolean | undefined;
  text_ignore_placement?: boolean | undefined;
  text_rotate?: number | undefined;
  text_letter_spacing?: number | undefined;
  icon_image?: string | undefined;
  icon_color?: string | ColorSpecification | undefined;
  icon_size?: number | any | undefined;
  icon_allow_overlap?: boolean | undefined;
  icon_optional?: boolean | undefined;
  icon_anchor?: string | undefined;
  icon_text_fit?: string | undefined;
  symbol_placement?: string | undefined;
  symbol_z_order?: string | undefined;
  symbol_spacing?: number | undefined;
  symbol_avoid_edges?: boolean | undefined;
  visibility?: "visible" | "none" | undefined;
  raster_hue_rotate?: number | undefined;
  raster_fade_duration?: number | undefined;
  // Raster-particle (fallback unknowns)
  raster_particle_opacity?: number | undefined;
  raster_particle_speed?: number | undefined;
  raster_particle_fade_amount?: number | undefined;
  raster_particle_color?: string | ColorSpecification | undefined;
};

type ParsedLayer = {
  name: string;
  title: string;
  legend: string | undefined | null;
  thumbnail: string | undefined | null;
  url?: string | undefined | null;
  index?: number | undefined | null;
  id?: string | undefined | null;
  map_service_vendor: MapServiceVendor;
  metadata: Record<string, any>;
};
type LayerNode = Element;

type GetAllLayers = (node: LayerNode) => ParsedLayer[];

type InfoFeature = {
  layer_name: string;
  properties: object;
};

type LayoutDisplay = {
  layerInfo: boolean;
  style: boolean;
  legend: boolean;
  addLayer: boolean;
  aiChat: boolean;
  node_workspace: boolean;
  routes: boolean;
  tools: boolean;
  table: boolean;
  drawProperties: boolean;
  showTeamCursors: boolean;
  fullscreen: boolean;
};

export type PropertyValueType = "string" | "number" | "boolean" | "array";

export type {
  Place,
  Layer,
  Location,
  WMSParams,
  MapComponentsProps,
  BoundingBox,
  MapIsLoading,
  MapboxLayerStyle,
  ParsedLayer,
  LayerNode,
  GetAllLayers,
  InfoFeature,
  LayoutDisplay,
};
export { MapServiceVendor };
