import { ColorSpecification, ExpressionSpecification, FunctionSpecification } from "mapbox-gl";
import React from "react";
import { MapRef } from "react-map-gl";

type MapComponentsProps = {
    layers?: Layer[];
    selectedBasemap?: string | null;
    initialViewState?: ViewState;
    onMouseMove?: (event: mapboxgl.MapMouseEvent) => void;
    mapRef?: React.RefObject<MapRef | null>;
    onZoom?: (event: mapboxgl.MapEvent) => void;
    onClick?: (event: mapboxgl.MapEvent) => Promise<void> | void;
    defaultMarkerPosition?: Location;
    onLoad?: () => void;
    onStyleData?: () => void;
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
    map_service_vendor: MapServiceVendor;
    type: string;
    visible: boolean;
    min_zoom?: number;
    max_zoom?: number;
    status?: string;
}

enum MapServiceVendor {
    Geoserver = "Geoserver",
    ArcGIS = "ArcGIS",
    GeoJSON = "GeoJSON",
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
    zoomToMap: boolean;
}

type Coordinate = [number, number];
type BoundingBox = [Coordinate, Coordinate];

type MapboxLayerStyle = {
    opacity?: number;
    fill?: string | ColorSpecification;
    stroke?: string | ExpressionSpecification | FunctionSpecification<string>;
    stroke_width?: number;
};

type ParsedLayer = {
    name: string;
    title: string;
    legend: string | undefined | null;
    thumbnail: string | undefined | null;
    index?: number | undefined | null;
    id?: string | undefined | null;
}
type LayerNode = Element;

type GetAllLayers = (node: LayerNode) => ParsedLayer[];

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
}
export { MapServiceVendor };
