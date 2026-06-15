import { overpassBuildingIntegration } from "@/services/map-integrations";
import useLayerStore from "@/stores/layer";
import { MapServiceVendor, Place } from "@/types/map.types";
import * as turf from "@turf/turf";
import proj4 from "proj4";
import {
    Feature,
    FeatureCollection,
    Geometry,
    LineString,
    MultiLineString,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import { MapRef } from "react-map-gl";
import { v4 } from "uuid";
import { geoWorkerPool } from "./geo-worker-pool";

const searchPlaces = async (search: string, lang: string = "EN-en", useBaseUrl: boolean = false) => {
    if (isCoordinates(search)) {
        const place: Place[] = [
            {
                name: search,
                fullName: "Coordinates : " + search,
                address: search,
                location: {
                    lat: parseFloat(search.split(",")[1]),
                    lng: parseFloat(search.split(",")[0]),
                },
            },
        ];
        return place;
    } else {
        try {
            if (search) {
                const params = new URLSearchParams({
                    search,
                    lang,
                });
                const baseUrl = useBaseUrl ? "https://trueapi.truenapsh.my.id/api/maps/location" : "/api/maps/location";
                const response = await fetch(`${baseUrl}?${params.toString()}`);
                const data = await response.json();
                return data.data;
            } else {
                return [];
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error caught:", error.message);
            } else {
                console.error("Unknown error caught:", error);
            }
            return [];
        }
    }
};

const searchAlternatives = async (from: number[], to: number[]) => {
    try {
        const body = {
            from: {
                x: from[0],
                y: from[1],
            },
            to: {
                x: to[0],
                y: to[1],
            },
        };
        const baseUrl = ""; // Use relative path to hit our new internal proxy
        const response = await fetch(`${baseUrl}/api/maps/alternatives`, {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Proxy Error:", errorData);
            return [];
        }

        const data = await response.json();

        const alternatives: any = [];
        data.data.alternatives.forEach(
            (alternative: { coords: { x: number; y: number }[]; response: any }) => {
                const { coords, response } = alternative;
                const transformed = coords.map(({ x, y }) => [x, y]);
                alternatives.push({ coords: transformed, response });
            }
        );
        return alternatives;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error caught:", error.message);
        } else {
            console.error("Unknown error caught:", error);
        }
        return [];
    }
};

const isCoordinates = (str: string) => {
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordRegex.test(str)) {
        return false;
    }
    return true;
};

const calculateCoordinatesWithAspectRatio = (
    lngLat: mapboxgl.LngLat,
    aspectRatio: number
): [number, number][] => {
    const baseWidth = 0.01; // Adjust base width as needed
    const height = baseWidth / aspectRatio;

    return [
        [lngLat.lng, lngLat.lat],
        [lngLat.lng + baseWidth, lngLat.lat],
        [lngLat.lng + baseWidth, lngLat.lat - height],
        [lngLat.lng, lngLat.lat - height],
    ];
};

const getBBOX = (lat: number, lng: number, z: number) => {
    const r = 6378137 * Math.PI * 2;
    const x = (lng / 360) * r;
    const sin = Math.sin((lat * Math.PI) / 180);
    const y = ((0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI) * r;
    return `${x - z},${y - z},${x + z},${y + z}`;
};

export const layerConfigs = [
    {
        types: ["Polygon", "MultiPolygon"],
        layerType: "fill" as const,
        nameSuffix: "Polygon",
        layerProps: {
            paint: {
                "fill-opacity": 0.5,
                "fill-color": "#627BC1",
            },
        },
    },
    {
        types: ["LineString", "MultiLineString"],
        layerType: "line" as const,
        nameSuffix: "Linestring",
        layerProps: {
            paint: {
                "line-color": "#627BC1",
                "line-width": 2,
                "line-opacity": 1,
            },
        },
    },
    {
        types: ["Point", "MultiPoint"],
        layerType: "circle" as const,
        nameSuffix: "Point",
        layerProps: {
            paint: {
                "circle-radius": 5,
                "circle-color": "#627BC1",
                "circle-opacity": 1,
            },
        },
    },
];

const findLayerConfigByGeometryType = (type: string) => {
    return layerConfigs.find((config) => config.types.includes(type));
};

/**
 * Reprojects GeoJSON from EPSG:3857 (Web Mercator) to EPSG:4326 (WGS 84) if needed.
 * Mapbox expects EPSG:4326.
 */
export const reprojectGeoJSON = (geojson: any): any => {
    if (!geojson) return geojson;

    // Check if it's already explicitly marked as WGS84/4326
    const crs = geojson.crs?.properties?.name || "";
    if (crs.includes("4326") || crs.toLowerCase().includes("wgs84") || crs.toLowerCase().includes("crs84")) {
        return geojson;
    }

    // Standard projection definitions
    const EPSG3857 = "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs";
    const EPSG4326 = "+proj=longlat +datum=WGS84 +no_defs";

    // Deep clone to avoid mutating original data
    const cloned = JSON.parse(JSON.stringify(geojson));

    let reprojectedCount = 0;

    const transformCoords = (coords: any): any => {
        if (!Array.isArray(coords)) return coords;

        if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
            const x = coords[0];
            const y = coords[1];
            
            // Web Mercator coordinates are typically in the millions (e.g., Indonesia is ~10,000,000)
            // WGS84 is -180 to 180 and -90 to 90.
            // We use a safe margin. If it's within WGS84 range, we NEVER reproject.
            if (Math.abs(x) > 180.000001 || Math.abs(y) > 90.000001) {
                try {
                    reprojectedCount++;
                    const transformed = proj4(EPSG3857, EPSG4326, [x, y]);
                    // Maintain altitude if present
                    if (coords.length > 2) {
                        return [transformed[0], transformed[1], ...coords.slice(2)];
                    }
                    return transformed;
                } catch (err) {
                    return coords;
                }
            }
            return coords;
        }

        return coords.map(transformCoords);
    };

    const processFeature = (feature: any) => {
        if (feature.geometry && feature.geometry.coordinates) {
            feature.geometry.coordinates = transformCoords(feature.geometry.coordinates);
        }
    };

    if (cloned.type === "FeatureCollection") {
        cloned.features.forEach(processFeature);
    } else if (cloned.type === "Feature") {
        processFeature(cloned);
    } else if (cloned.coordinates) {
        cloned.coordinates = transformCoords(cloned.coordinates);
    }

    // If we didn't actually reproject anything, return original object (save memory/ref)
    if (reprojectedCount === 0) return geojson;

    return cloned;
};

const addGeojsonToMap = async ({
    mapRef,
    layerName,
    mapServiceUrl = "",
    layerCode = "",
    data,
    bbox: preCalculatedBbox,
    geometryTypes: preCalculatedGeometryTypes
}: {
    mapRef: React.RefObject<MapRef | null>;
    layerName: string;
    mapServiceUrl?: string;
    layerCode?: string;
    data: GeoJSON.GeoJSON;
    bbox?: [number, number, number, number];
    geometryTypes?: string[];
}): Promise<string | undefined> => {
    const map = mapRef?.current?.getMap();
    if (!map) return;

    // Reproject if needed (EPSG:3857 to EPSG:4326)
    const reprojectedData = reprojectGeoJSON(data);

    const addLayer = useLayerStore.getState().addLayer;

    const layerId = v4();
    const commonLayerProps = {
        map_service_url: mapServiceUrl,
        map_service_layer_name: layerCode,
        map_service_vendor: MapServiceVendor.GeoJSON,
        visible: true,
        min_zoom: 0,
        max_zoom: 24,
        status: "Local",
        rendered: 1,
        metadata: {
            map_service_url: mapServiceUrl,
            map_service_layer_name: layerCode,
            map_service_vendor: MapServiceVendor.GeoJSON,
        },
    };

    // Robust feature extraction
    let features: any[] = [];
    if (reprojectedData.type === "FeatureCollection") {
        features = reprojectedData.features;
    } else if (reprojectedData.type === "Feature") {
        features = [reprojectedData];
    } else if (reprojectedData.type && (reprojectedData as any).coordinates) {
        // Direct geometry object
        features = [{
            type: "Feature",
            geometry: reprojectedData,
            properties: {}
        }];
    }

    // Robust geometry type extraction
    const geometryTypes = (preCalculatedGeometryTypes && preCalculatedGeometryTypes.length > 0) 
        ? preCalculatedGeometryTypes 
        : [...new Set(features.map((f: any) => f.geometry?.type).filter(Boolean))];

    // Add source
    map.addSource(layerId, {
        type: "geojson",
        data: reprojectedData,
    });

    // Fit bounds
    try {
        const bounds: [number, number, number, number] = preCalculatedBbox || turf
            .bbox(reprojectedData)
            .slice(0, 4) as [number, number, number, number];

        map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1000,
        });
    } catch (e) {
        console.warn("Could not fit bounds for GeoJSON layer", e);
    }

    // Loop configs
    layerConfigs.forEach((config) => {
        // Map the config types to exact strings we expect in GeoJSON
        const hasMatchingGeometry = config.types.some(t => geometryTypes.includes(t));

        if (hasMatchingGeometry) {
            const layerSubId = config.layerType === "circle" ? "point" : config.layerType;
            const fullLayerId = `${layerId}-${layerSubId}`;

            // Tambah ke store global (Workspaces/Layer List)
            useLayerStore.getState().addLayer({
                ...commonLayerProps,
                id: fullLayerId,
                name: `${layerName} ${config.nameSuffix}`,
                render_type: config.layerType,
                type: "vector",
            } as any);

            // Tambah ke mapbox
            map.addLayer({
                id: fullLayerId,
                type: config.layerType as any,
                source: layerId,
                minzoom: 0,
                maxzoom: 24,
                // Remove the restrictive $type filter that often fails due to casing
                paint: config.layerProps.paint as any,
                metadata: commonLayerProps.metadata ?? {},
            });
        }
    });

    return layerId;
};

// TURF TOOLS (Asynchronous via Web Worker)
const clipLayers = async (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): Promise<FeatureCollection<Polygon | MultiPolygon> | null> => {
    return geoWorkerPool.execute("clip", { featureClip, featureOverlay });
};

const intersectionLayers = clipLayers;

const bufferLayers = async (
    featureCollection: FeatureCollection<Geometry>,
    radius: number,
    units: turf.Units = "kilometers"
): Promise<FeatureCollection<Polygon | MultiPolygon> | null> => {
    return geoWorkerPool.execute("buffer", { featureCollection, radius, units });
};

const differenceLayers = async (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): Promise<FeatureCollection<Polygon | MultiPolygon> | null> => {
    return geoWorkerPool.execute("difference", { featureClip, featureOverlay });
};

const centroidLayers = async (
    featureClip: FeatureCollection<Polygon | MultiPolygon>
): Promise<FeatureCollection<Point> | null> => {
    return geoWorkerPool.execute("centroid", { featureClip });
};

const bboxPolygonLayers = async (
    featureCollection: FeatureCollection<Geometry>
): Promise<FeatureCollection<Polygon> | null> => {
    return geoWorkerPool.execute("bboxPolygon", { featureCollection });
};

const polygonToLinesLayers = async (
    polygonFeature: FeatureCollection<Polygon | MultiPolygon>
): Promise<FeatureCollection<LineString | MultiLineString> | null> => {
    return geoWorkerPool.execute("polygonToLines", { polygonFeature });
};

const linesToPolygonLayers = async (
    lineFeature: FeatureCollection<LineString | MultiLineString>
): Promise<FeatureCollection<Polygon | MultiPolygon> | null> => {
    return geoWorkerPool.execute("linesToPolygon", { lineFeature });
};

const removeDuplicatesLayers = async (featureClip: FeatureCollection<Geometry>): Promise<FeatureCollection<Geometry> | null> => {
    return geoWorkerPool.execute("removeDuplicates", { featureClip });
};

const hexagonLayer = async (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    cellSide: number,
    units: turf.Units = "kilometers",
    gridCode?: string
): Promise<FeatureCollection<Polygon> | null> => {
    return geoWorkerPool.execute("hexagon", { featureClip, cellSide, units, gridCode });
};

const simplifyLayers = async (
    featureCollection: FeatureCollection<Polygon | MultiPolygon>,
    tolerance: number = 0.001,
    highQuality: boolean = true
): Promise<FeatureCollection<Polygon | MultiPolygon>> => {
    return geoWorkerPool.execute("simplify", { featureCollection, tolerance, highQuality });
};

const pointAlongLinesLayers = async (
    lineFeatureCollection: FeatureCollection<LineString | MultiLineString>,
    interval: number,
    units: turf.Units = "kilometers"
): Promise<FeatureCollection<Point> | null> => {
    return geoWorkerPool.execute("pointAlongLines", { lineFeatureCollection, interval, units });
};

const runCode = async (code: string, data: any, nodes: any) => {
    return geoWorkerPool.execute("js-code", { code, data, nodes });
};

const buildingLayers = async (featureCollection: FeatureCollection) => {
    try {
        const bbox = turf.bbox(featureCollection);
        const buildings = await overpassBuildingIntegration(bbox);
        if (buildings) {
            const featureCollection = turf.featureCollection(
                buildings.filter(
                    (building: any): building is GeoJSON.Feature => building !== null
                )
            );
            return featureCollection;
        }
    } catch (error) {
        console.error("Error fetching building data:", error);
    }
};

const elevationLayers = async (
    featureCollection: FeatureCollection,
    source: string
): Promise<{ distance: number; elevation: number; lat: number; lng: number }[] | null> => {
    const getCoords = (geom: any): [number, number] => {
        if (!geom) return [0, 0];
        if (geom.type === "Point") {
            return geom.coordinates as [number, number];
        } else if (geom.type === "LineString") {
            return geom.coordinates[0] as [number, number];
        } else if (geom.type === "Polygon") {
            return (geom.coordinates[0]?.[0] || [0, 0]) as [number, number];
        } else if (geom.type === "MultiPolygon") {
            return (geom.coordinates[0]?.[0]?.[0] || [0, 0]) as [number, number];
        }
        return [0, 0];
    };

    try {
        console.log("Fetching elevation from:", source);
        if (source === "Map Toolkit") {
            const coordsList = featureCollection.features.map((feature) => {
                const c = getCoords(feature.geometry);
                return `[${c[1]},${c[0]}]`;
            });
            const response = await fetch(
                `https://maptoolkit.p.rapidapi.com/elevation?points=[${coordsList.join(",")}]`,
                {
                    headers: {
                        "x-rapidapi-key":
                            "313cbbad8cmshee05ce25c9e166bp101569jsnef19f7ec20c8",
                        "x-rapidapi-host": "maptoolkit.p.rapidapi.com",
                    },
                }
            );
            const data = await response.json();
            if (data && Array.isArray(data)) {
                return featureCollection.features.map((feature, idx) => {
                    const item = data[idx];
                    const elev = typeof item === "number" ? item : (item?.elevation || 0);
                    feature.properties = {
                        ...feature.properties,
                        elevation: elev,
                    };
                    const c = getCoords(feature.geometry);
                    return {
                        distance: feature.properties?.distanceFromStart || 0,
                        elevation: elev,
                        lat: c[1],
                        lng: c[0],
                    };
                });
            }
        } else if (source === "Open Elevation") {
            const points = featureCollection.features.map((feature) => {
                const c = getCoords(feature.geometry);
                return {
                    latitude: c[1],
                    longitude: c[0],
                };
            });
            const latitudes = points.map((p) => p.latitude).join(",");
            const longitudes = points.map((p) => p.longitude).join(",");
            const response = await fetch(
                `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
            );
            const data = await response.json();
            if (data && Array.isArray(data.elevation)) {
                return featureCollection.features.map((feature, idx) => {
                    const elev = data.elevation[idx] || 0;
                    feature.properties = {
                        ...feature.properties,
                        elevation: elev,
                    };
                    const c = getCoords(feature.geometry);
                    return {
                        distance: feature.properties?.distanceFromStart || 0,
                        elevation: elev,
                        lat: c[1],
                        lng: c[0],
                    };
                });
            }
        } else if (source === "GPXZ") {
            const points = featureCollection.features.map((feature) => {
                const c = getCoords(feature.geometry);
                return {
                    latitude: c[1],
                    longitude: c[0],
                };
            });
            const pointsStr = points
                .map((p) => `${p.latitude},${p.longitude}`)
                .join("|");

            const response = await fetch(`https://api.gpxz.io/v1/elevation/points`, {
                method: "POST",
                headers: {
                    "x-api-key": "ak_1fJxvQgh_GDctGup4zErSqvRg",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: `latlons=${pointsStr}`,
            });
            const data = await response.json();
            if (data && Array.isArray(data.results)) {
                return featureCollection.features.map((feature, idx) => {
                    const elev = data.results[idx]?.elevation || 0;
                    feature.properties = {
                        ...feature.properties,
                        elevation: elev,
                    };
                    const c = getCoords(feature.geometry);
                    return {
                        distance: feature.properties?.distanceFromStart || 0,
                        elevation: elev,
                        lat: c[1],
                        lng: c[0],
                    };
                });
            }
        } else if (source === "Mapbox") {
            const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            const promises = featureCollection.features.map(async (feature) => {
                const c = getCoords(feature.geometry);
                let elev = 0;
                try {
                    const response = await fetch(
                        `https://api.mapbox.com/v1/mapbox.mapbox-terrain-dem-v1/tilequery/${c[0]},${c[1]}.json?access_token=${token}`
                    );
                    const data = await response.json();
                    if (data && Array.isArray(data.features) && data.features.length > 0) {
                        const props = data.features[0].properties;
                        elev = props?.ele !== undefined ? props.ele : (props?.elevation !== undefined ? props.elevation : 0);
                    }
                } catch (e) {
                    console.error("Mapbox elevation fetch error:", e);
                }
                feature.properties = {
                    ...feature.properties,
                    elevation: elev,
                };
                return {
                    distance: feature.properties?.distanceFromStart || 0,
                    elevation: elev,
                    lat: c[1],
                    lng: c[0],
                };
            });
            return Promise.all(promises);
        }
    } catch (error) {
        console.error("Error fetching elevation data:", error);
    }
    return null;
};



export {
    addGeojsonToMap,
    bboxPolygonLayers,
    bufferLayers,
    buildingLayers,
    calculateCoordinatesWithAspectRatio,
    centroidLayers,
    clipLayers,
    differenceLayers,
    elevationLayers,
    findLayerConfigByGeometryType,
    getBBOX,
    hexagonLayer,
    intersectionLayers,
    isCoordinates,
    linesToPolygonLayers,
    pointAlongLinesLayers,
    polygonToLinesLayers,
    removeDuplicatesLayers,
    runCode,
    searchAlternatives,
    searchPlaces,
    simplifyLayers
};

