import { BoundingBox, Layer } from "@/types/map.types";
import { z } from "zod";
import * as turf from '@turf/turf';
import { fetchLayerBbox } from "@/services/map-services";
import useLayerStore from "@/stores/layer";

// MAP EXECUTOR
export const mapParams = z.object({
    center: z.tuple([z.number(), z.number()]).optional().describe("Center of the map [longitude, latitude], "),
    zoom: z.number().optional().describe("Zoom level"),
    pitch: z.number().optional().describe("Pitch of the map"),
    bearing: z.number().optional().describe("Bearing of the map"),
    duration: z.number().optional().describe("Duration of the animation"),
    bbox: z.array(z.number()).optional().describe("Bounding box of the map [minLongitude, minLatitude, maxLongitude, maxLatitude]"),
    padding: z.number().optional().describe("Padding of the map"),
    layerId: z.string().optional().describe("ID of the layer, required if layerName is not provided"),
    layerName: z.string().optional().describe("Name of the layer, required if layerId is not provided"),
    filter: z.array(z.string()).optional().describe("Filter for the layer it can be Mapbox Expression or CQL Expression"),
    map_service_vendor: z.string().optional().describe("Vendor of the map service it can be Null, Geoserver, ArcGIS, GeoJSON, XYZ, Image, Text, Icon"),
    visible: z.boolean().optional().describe("Visibility of the layer, required if action is toggleLayer"),
}).optional().describe("Parameters for the action");

export interface MapCommand {
    action: 'flyTo' | 'easeTo' | 'filterLayer' | 'zoomToLayer' | 'toggleLayer';
    params?: z.infer<typeof mapParams> | any;
    layerId?: any;
    center?: [number, number];
    zoom?: number;
    pitch?: number;
    bearing?: number;
    speed?: number;
    duration?: number;
    layerName?: string;
    visible?: boolean;
    filter?: any;
    map_service_vendor?: string;
}

export class MapCommandExecutor {
    private mapRef: React.RefObject<any>;
    private layers: Layer[];

    constructor(mapRef: React.RefObject<any>, layers: Layer[]) {
        this.mapRef = mapRef;
        this.layers = layers;
    }

    private getMap(): mapboxgl.Map | null {
        return this.mapRef.current?.getMap?.() || this.mapRef.current || null;
    }

    async execute(
        command: MapCommand,
        onProgress?: (progress: {
            status: 'start' | 'running' | 'success' | 'error';
            action: string;
            step?: string;
            progress?: number;
            detail?: string;
        }) => void
    ): Promise<void> {
        const map = this.getMap();
        if (!map) {
            console.warn('Map reference is not available');
            return;
        }

        console.log("Ini command", command)

        try {
            onProgress?.({ status: 'start', action: command.action, step: 'Validating command' });
            const params = command.params || {};
            console.log("Ini params", params)

            switch (command.action) {
                case 'flyTo':
                    onProgress?.({ status: 'running', action: command.action, step: 'Navigating to location' });
                    await this.flyTo(params);
                    break;
                case 'easeTo':
                    onProgress?.({ status: 'running', action: command.action, step: 'Panning to location' });
                    await this.easeTo(params);
                    break;
                case 'filterLayer':
                    onProgress?.({ status: 'running', action: command.action, step: 'Applying layer filter' });
                    await this.filterLayer(params);
                    break;
                case 'zoomToLayer':
                    onProgress?.({ status: 'running', action: command.action, step: 'Zooming to layer extent' });
                    await this.zoomToLayer(params);
                    break;
                case 'toggleLayer':
                    onProgress?.({ status: 'running', action: command.action, step: 'Updating layer visibility' });
                    await this.setLayerVisibility(params);
                    break;
                default:
                    console.warn(`Unknown action: ${command.action}`);
            }
            onProgress?.({ status: 'success', action: command.action, step: 'Completed' });
        } catch (error) {
            console.error('Error executing map command:', error);
            onProgress?.({ status: 'error', action: command.action, step: 'Failed', detail: String(error) });
            throw error;
        }
    }

    private async flyTo(command: MapCommand): Promise<void> {
        const map = this.getMap();
        if (!map) return;

        const run = () => {
            const { center, zoom, pitch, bearing, speed = 1.2, duration } = command;
            const current = map.getCenter();
            const hasValidCenter =
                Array.isArray(center) &&
                center.length === 2 &&
                typeof center[0] === "number" &&
                typeof center[1] === "number" &&
                Number.isFinite(center[0]) &&
                Number.isFinite(center[1]);
            const safeCenter: [number, number] = hasValidCenter ? center as [number, number] : [current.lng, current.lat];
            const opts: any = { center: safeCenter, speed: Number.isFinite(speed) ? speed : 1.2 };
            if (typeof zoom === "number" && Number.isFinite(zoom)) opts.zoom = zoom;
            if (typeof pitch === "number" && Number.isFinite(pitch)) opts.pitch = pitch;
            if (typeof bearing === "number" && Number.isFinite(bearing)) opts.bearing = bearing;
            if (typeof duration === "number" && Number.isFinite(duration)) opts.duration = duration;
            map.flyTo(opts);
        };

        if (!map.isStyleLoaded()) {
            map.once("load", run);
            return;
        }

        run();
    }

    private async easeTo(command: MapCommand): Promise<void> {
        const map = this.getMap();
        if (!map) return;

        const { center, zoom, pitch, bearing, duration = 1000 } = command;
        const current = map.getCenter();
        const hasValidCenter =
            Array.isArray(center) &&
            center.length === 2 &&
            typeof center[0] === "number" &&
            typeof center[1] === "number" &&
            Number.isFinite(center[0]) &&
            Number.isFinite(center[1]);
        const safeCenter: [number, number] = hasValidCenter ? center as [number, number] : [current.lng, current.lat];
        const opts: any = { center: safeCenter, duration: Number.isFinite(duration) ? duration : 1000 };
        if (typeof zoom === "number" && Number.isFinite(zoom)) opts.zoom = zoom;
        if (typeof pitch === "number" && Number.isFinite(pitch)) opts.pitch = pitch;
        if (typeof bearing === "number" && Number.isFinite(bearing)) opts.bearing = bearing;
        map.easeTo(opts);
    }

    private async filterLayer(command: MapCommand): Promise<void> {
        const map = this.getMap();
        if (!map || (!command.layerId && !command.layerName)) return;

        const layer = this.layers.find(l =>
            (command.layerId && l.id === command.layerId) ||
            (command.layerName && l.name === command.layerName)
        );

        if (!layer) {
            console.warn(`Layer not found: ${command.layerId || command.layerName}`);
            return;
        }

        const layerType = layer.map_service_vendor

        if (layerType === "Geoserver") {
            const rawFilter = String(command?.filter || "").trim().replace(/,$/, "");
            const cqlFilterClean = rawFilter.replace(/['']/g, "'");
            const encodedCql = encodeURIComponent(cqlFilterClean);

            const updatedUrl =
                `${layer.map_service_url}?SERVICE=WMS` +
                `&VERSION=1.1.1` +
                `&REQUEST=GetMap` +
                `&FORMAT=image/png` +
                `&TRANSPARENT=true` +
                `&STYLES=` +
                `&LAYERS=${layer.map_service_layer_name}` +
                `&CQL_FILTER=${encodedCql}` +
                `&SRS=EPSG:3857` +
                `&WIDTH=256&HEIGHT=256` +
                `&BBOX={bbox-epsg-3857}`;

            const existingLayer = map.getLayer(layer.id);
            const existingSource = map.getSource(layer.id);

            if (existingLayer) {
                map.removeLayer(layer.id);
            }
            if (existingSource) {
                map.removeSource(layer.id);
            }

            map.addSource(layer.id, {
                type: "raster",
                tiles: [updatedUrl],
                tileSize: 256,
            });

            map.addLayer({
                id: layer.id,
                type: "raster",
                source: layer.id,
                paint: existingLayer && 'paint' in existingLayer ? existingLayer.paint : { 'raster-opacity': 1 }
            });
        } else if (layerType === 'ArcGIS') {
            map.setFilter(layer.id, command.filter);
        } else if (layerType === 'GeoJSON') {
            map.setFilter(layer.id, command.filter);

            // Fit bounds to filtered features
            const features = map.queryRenderedFeatures({ layers: [layer.id] });

            if (features.length > 0) {
                const bbox = turf.bbox(turf.featureCollection(features));
                map.fitBounds(
                    [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
                    {
                        padding: 50,
                        maxZoom: 15,
                    }
                );
            }
        } else {
            console.warn(`Unknown vendor: ${layer.map_service_vendor}`);
        }
    }

    private async zoomToLayer(command: MapCommand): Promise<void> {
        const map = this.getMap();
        if (!map || !command.layerName) return;

        const layer = this.layers.find(l => l.name === command.layerName);
        if (!layer) {
            console.warn(`Layer not found: ${command.layerName}`);
            return;
        }

        switch (layer.map_service_vendor) {
            case 'Geoserver':
                await this.zoomToGeoserverLayer(layer);
                break;
            case 'ArcGIS':
                await this.zoomToArcGISLayer(layer);
                break;
            case 'GeoJSON':
                await this.zoomToGeoJSONLayer(layer);
                break;
            default:
                console.warn(`Unknown vendor: ${layer.map_service_vendor}`);
        }
    }

    private async setLayerVisibility(command: MapCommand): Promise<void> {
        const map = this.getMap();
        if (!map || (!command.layerId && !command.layerName)) {
            console.warn('Layer ID or Layer Name is required');
            return;
        }

        // Find layer by ID or name
        const layer = command.layerId
            ? this.layers.find(l => l.id === command.layerId)
            : this.layers.find(l => l.name === command.layerName);

        if (!layer) {
            console.warn(`Layer not found: ${command.layerId || command.layerName}`);
            return;
        }

        const visible = command.visible ?? true;

        // Sync Zustand store without using React hooks
        useLayerStore.getState().setVisibility(layer.id, visible);

        // Update map layer visibility
        const visibility = visible ? 'visible' : 'none';

        // Check if layer exists on map
        const mapLayer = map.getLayer(layer.id);
        if (mapLayer) {
            map.setLayoutProperty(layer.id, 'visibility', visibility);
            console.log(`Layer ${layer.id} visibility set to: ${visibility}`);
        } else {
            console.warn(`Layer ${layer.id} not found on map`);
        }
    }

    private async zoomToGeoserverLayer(layer: Layer): Promise<void> {
        const map = this.getMap();
        if (!map) return;

        try {
            const bbox = await fetchLayerBbox(
                layer.map_service_url,
                layer.map_service_layer_name || ''
            );

            if (bbox) {
                const { minLng, minLat, maxLng, maxLat } = bbox;
                const bounds: BoundingBox = [
                    [parseFloat(minLng || '0'), parseFloat(minLat || '0')],
                    [parseFloat(maxLng || '0'), parseFloat(maxLat || '0')],
                ];

                map.fitBounds(bounds, {
                    padding: 25,
                    duration: 1000,
                });
            }
        } catch (error) {
            console.error('Error fetching Geoserver bbox:', error);
        }
    }

    private async zoomToArcGISLayer(layer: Layer): Promise<void> {
        const map = this.getMap();
        if (!map) return;

        try {
            const esriURL = `${layer.map_service_url.replace('/export', '')}?f=json`;
            const response = await fetch(esriURL);

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const json = await response.json();

            if (json.fullExtent) {
                const extent = {
                    minx: json.fullExtent.xmin,
                    miny: json.fullExtent.ymin,
                    maxx: json.fullExtent.xmax,
                    maxy: json.fullExtent.ymax,
                };

                map.fitBounds(
                    [[extent.minx, extent.miny], [extent.maxx, extent.maxy]],
                    {
                        padding: 20,
                        duration: 2000,
                    }
                );
            } else {
                console.error('Full extent is not available in the response.');
            }
        } catch (error) {
            console.error('Error fetching ArcGIS extent:', error);
        }
    }

    private async zoomToGeoJSONLayer(layer: Layer): Promise<void> {
        const map = this.getMap();
        if (!map) return;

        const layerSource = map.getLayer(layer.id)?.source;
        if (!layerSource) return;

        const source = map.getSource(layerSource) as mapboxgl.GeoJSONSource;
        if (!source) return;

        const data = source.serialize().data as GeoJSON.GeoJSON;
        const bbox = turf.bbox(data);

        map.fitBounds(bbox as [number, number, number, number], {
            padding: 25,
            duration: 1000,
        });
    }
}



const filterLayerAttributes = (
    layers: Layer[],
    attributes: string[],
    valueFilter?: Record<string, any>
) => {
    const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
    };

    const setNestedValue = (obj: any, path: string, value: any) => {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((acc, key) => {
            if (!acc[key] || typeof acc[key] !== 'object') acc[key] = {};
            return acc[key];
        }, obj);
        target[lastKey] = value;
    };

    return layers
        .filter(layer => {
            if (!valueFilter) return true;
            return Object.entries(valueFilter).every(([path, expected]) => {
                const actual = getNestedValue(layer, path);
                return actual === expected;
            });
        })
        .map(layer => {
            const filtered: any = {};
            attributes.forEach(attr => {
                const value = getNestedValue(layer, attr);
                if (value !== undefined) {
                    setNestedValue(filtered, attr, value);
                }
            });
            return filtered as Layer;
        });
}

const getLayerFields = (layers: Layer[], layerId: string) => {
    const layer = layers.find(l => l.id === layerId);
    return layer ? layer.fields || [] : [];
}


// MAP



export { filterLayerAttributes, getLayerFields };
