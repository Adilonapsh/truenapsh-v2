import { MapLayerMouseEvent } from "mapbox-gl";
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
    onClick?: (event: mapboxgl.MapEvent) => Promise<void> | void;
    defaultMarkerPosition?: Location;
    onLoad?: () => void;
    onStyleData?: () => void;
    handleDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
    handleDrop?: (event: React.DragEvent<HTMLDivElement>) => void;
    onContextMenu?: (e: MapLayerMouseEvent) => void;
    transformRequests?: TransformRequestFunction;
}

type ViewState = {
    longitude: number;
    latitude: number;
    zoom: number;
    minZoom: number;
    maxZoom?: number;
    pitch?: number;
    bearing?: number;
    hash: boolean;
}


type Place = {
    name: string;
    fullName: string;
    address: string;
    location: Location;
}

type Layer = {
    id: string;
    name: string;
    description?: string;
    map_service_url: string;
    map_service_layer_name: string;
    map_service_vendor: MapServiceVendor | "Geoserver" | "ArcGIS" | "GeoJSON" | "Image" | "Text" | "Icon";
    type: string;
    visible: boolean;
    min_zoom?: number;
    max_zoom?: number;
    status?: string;
    metadata?: object;
    rendered?: number;
}

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
}

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
}

type MapIsLoading = {
    initLoading: boolean;
    zoomToMap: boolean;
    featureInfo: boolean;
}

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
}
type LayerNode = Element;

type GetAllLayers = (node: LayerNode) => ParsedLayer[];

type InfoFeature = {
    layer_name: string;
    properties: object;
}

type LayoutDisplay = {
    layerInfo: boolean,
    style: boolean,
    legend: boolean,
    addLayer: boolean,
    aiChat: boolean,
    node_workspace: boolean,
    routes: boolean,
    tools: boolean,
}

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
}
export { MapServiceVendor };
