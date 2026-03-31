import { overpassBuildingIntegration } from "@/services/map-integrations";
import useLayerStore from "@/stores/layer";
import { MapServiceVendor, Place } from "@/types/map.types";
import * as turf from "@turf/turf";
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

const addGeojsonToMap = async ({
    mapRef,
    layerName,
    mapServiceUrl = "",
    layerCode = "",
    data,
}: {
    mapRef: React.RefObject<MapRef | null>;
    layerName: string;
    mapServiceUrl?: string;
    layerCode?: string;
    data: GeoJSON.GeoJSON;
}) => {
    const map = mapRef?.current?.getMap();
    if (!map) return;

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

    const geometryTypes = [
        ...new Set(
            (data as GeoJSON.FeatureCollection).features.map(
                (feature) => feature.geometry.type
            )
        ),
    ];

    // Add source
    map.addSource(layerId, {
        type: "geojson",
        data: data,
    });

    // Fit bounds
    const bounds: [number, number, number, number] = turf
        .bbox(data)
        .slice(0, 4) as [number, number, number, number];
    map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
    });

    // Loop configs
    layerConfigs.forEach((config) => {
        if (
            config.types.some((type) =>
                geometryTypes.includes(
                    type as
                    | "Point"
                    | "MultiPoint"
                    | "LineString"
                    | "MultiLineString"
                    | "Polygon"
                    | "MultiPolygon"
                    | "GeometryCollection"
                )
            )
        ) {
            const layerSubId =
                config.layerType === "circle" ? "point" : config.layerType;
            const fullLayerId = `${layerId}-${layerSubId}`;

            addLayer({
                ...commonLayerProps,
                id: fullLayerId,
                name: `${layerName} ${config.nameSuffix}`,
                render_type: config.layerType,
                type: "vector",
            });

            // Tambah ke mapbox
            map.addLayer({
                id: fullLayerId,
                type: config.layerType,
                source: layerId,
                minzoom: 0,
                maxzoom: 24,
                filter: ["in", "$type", config.types[0]],
                paint: config.layerProps.paint,
                metadata: commonLayerProps.metadata ?? {},
            });
        }
    });
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
) => {
    try {
        console.log("WIP GUYES");
        if (source === "Map Toolkit") {
            const points = featureCollection.features.map((feature) => {
                const geom = feature.geometry as Polygon | MultiPolygon;
                const coords = geom.coordinates;
                return Array.isArray(coords[0])
                    ? coords[0].map((c: any) => `[${c}]`).join(",")
                    : `[${coords[1]},${coords[0]}]`;
            });
            const response = await fetch(
                `https://maptoolkit.p.rapidapi.com/elevation?points=[${points}]`,
                {
                    headers: {
                        "x-rapidapi-key":
                            "313cbbad8cmshee05ce25c9e166bp101569jsnef19f7ec20c8",
                        "x-rapidapi-host": "maptoolkit.p.rapidapi.com",
                    },
                }
            );
            const data = await response.json();
        } else if (source === "Open Elevation") {
            const points = featureCollection.features.map((feature) => {
                const geom = feature.geometry as Polygon | MultiPolygon;

                // Ambil koordinat pertama dari polygon atau multipolygon
                const firstCoord =
                    geom.type === "Polygon"
                        ? geom.coordinates[0][0] // Polygon -> [[[x,y],...]]
                        : geom.coordinates[0][0][0]; // MultiPolygon -> [[[[x,y],...]]]

                return {
                    latitude: firstCoord[1],
                    longitude: firstCoord[0],
                };
            });
            const latitudes = points.map((p) => p.latitude).join(",");
            const longitudes = points.map((p) => p.longitude).join(",");
            const response = await fetch(
                `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
            );
            const data = await response.json();
        } else if (source === "GPXZ") {
            const points = featureCollection.features.map((feature) => {
                const geom = feature.geometry as Polygon | MultiPolygon;

                // Ambil titik pertama dari polygon atau multipolygon
                const firstCoord =
                    geom.type === "Polygon"
                        ? geom.coordinates[0][0] // [[[x,y], ...]]
                        : geom.coordinates[0][0][0]; // [[[[x,y], ...]]]

                return {
                    latitude: firstCoord[1],
                    longitude: firstCoord[0],
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
        }
    } catch (error) {
        console.error("Error fetching building data:", error);
    }
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

