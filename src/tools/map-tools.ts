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

// TURF TOOLS
const clipLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Polygon | MultiPolygon> | null => {
    try {
        const clippedFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const overlayFeature of featureOverlay.features) {
            for (const clipFeature of featureClip.features) {
                const intersection = turf.intersect(
                    turf.featureCollection([overlayFeature, clipFeature])
                );

                if (
                    intersection &&
                    (intersection.geometry.type === "Polygon" ||
                        intersection.geometry.type === "MultiPolygon")
                ) {
                    const clippedFeature: Feature<Polygon | MultiPolygon> = {
                        type: "Feature",
                        geometry: intersection.geometry as Polygon | MultiPolygon,
                        properties: { ...overlayFeature.properties },
                    };

                    if (intersection.id !== undefined)
                        clippedFeature.id = intersection.id;
                    if (intersection.bbox) clippedFeature.bbox = intersection.bbox;

                    clippedFeatures.push(clippedFeature);
                }
            }
        }

        return turf.featureCollection(clippedFeatures);
    } catch (error) {
        console.error("Error clipping layers:", error);
        return null;
    }
};

const intersectionLayers = clipLayers;

const bufferLayers = (
    featureCollection: FeatureCollection<Geometry>,
    radius: number,
    units: turf.Units = "kilometers"
) => {
    try {
        const bufferedFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const feature of featureCollection.features) {
            if (!feature.geometry) continue;

            if (feature.geometry.type === "Point") {
                const coords = feature.geometry.coordinates as number[];
                if (
                    !Array.isArray(coords) ||
                    coords.length < 2 ||
                    typeof coords[0] !== "number" ||
                    typeof coords[1] !== "number"
                ) {
                    console.warn("Invalid point coordinates:", coords);
                    continue;
                }

                const buffered = turf.buffer(feature, radius, { units });
                if (
                    buffered &&
                    (buffered.geometry.type === "Polygon" ||
                        buffered.geometry.type === "MultiPolygon")
                ) {
                    bufferedFeatures.push(buffered);
                }
            }
        }

        return turf.featureCollection(bufferedFeatures);
    } catch (error) {
        console.error("Error buffering layers:", error);
        return null;
    }
};

const differenceLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Polygon | MultiPolygon> | null => {
    try {
        const differenceFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const overlayFeature of featureOverlay.features) {
            // 👇 tambahkan | null
            let currentFeature: Feature<Polygon | MultiPolygon> | null =
                overlayFeature;

            for (const clipFeature of featureClip.features) {
                if (!currentFeature) break;

                const difference = turf.difference(
                    turf.featureCollection([currentFeature, clipFeature])
                );

                if (
                    difference &&
                    (difference.geometry.type === "Polygon" ||
                        difference.geometry.type === "MultiPolygon")
                ) {
                    currentFeature = {
                        type: "Feature",
                        geometry: difference.geometry as Polygon | MultiPolygon,
                        properties: { ...overlayFeature.properties },
                    };
                } else {
                    currentFeature = null;
                    break;
                }
            }

            if (currentFeature) {
                differenceFeatures.push(currentFeature);
            }
        }

        return turf.featureCollection(differenceFeatures);
    } catch (error) {
        console.error("Error processing difference layers:", error);
        return null;
    }
};

const centroidLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>
) => {
    try {
        return turf.featureCollection(
            featureClip.features.map((feature) => {
                const centroidFeature = turf.centroid(feature);
                return centroidFeature;
            })
        );
    } catch (error) {
        console.error("Error clipping layers:", error);
        return null;
    }
};

const bboxPolygonLayers = (
    featureCollection: FeatureCollection<Geometry>
): FeatureCollection<Polygon> | null => {
    try {
        const bbox = turf.bbox(featureCollection);
        const poly = turf.bboxPolygon(bbox);
        return turf.featureCollection([poly]);
    } catch (error) {
        console.error("Error calculating bbox polygon:", error);
        return null;
    }
};

const polygonToLinesLayers = (
    polygonFeature: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<LineString | MultiLineString> | null => {
    try {
        const lineFeatures: Feature<LineString | MultiLineString>[] = [];

        for (const feature of polygonFeature.features) {
            // turf.polygonToLine otomatis handle Polygon dan MultiPolygon
            const lineResult = turf.polygonToLine(feature);

            if (lineResult) {
                // Jika hasilnya FeatureCollection (dari MultiPolygon)
                if (lineResult.type === "FeatureCollection") {
                    lineFeatures.push(
                        ...lineResult.features.map((f) => ({
                            ...f,
                            properties: { ...feature.properties },
                        }))
                    );
                }
                // Jika hasilnya Feature (dari Polygon)
                else if (lineResult.type === "Feature") {
                    lineFeatures.push({
                        ...lineResult,
                        properties: { ...feature.properties },
                    });
                }
            }
        }

        return turf.featureCollection(lineFeatures);
    } catch (error) {
        console.error("Error converting polygons to lines:", error);
        return null;
    }
};

const linesToPolygonLayers = (
    lineFeature: FeatureCollection<LineString | MultiLineString>
): FeatureCollection<Polygon | MultiPolygon> | null => {
    try {
        const polygonFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const feature of lineFeature.features) {
            try {
                // turf.lineToPolygon otomatis handle LineString dan MultiLineString
                const polygonResult = turf.lineToPolygon(feature);

                if (polygonResult) {
                    // Preserve properties dari original feature
                    const polygonWithProps: Feature<Polygon | MultiPolygon> = {
                        ...polygonResult,
                        properties: { ...feature.properties },
                    };

                    polygonFeatures.push(polygonWithProps);
                }
            } catch (conversionError) {
                console.warn(`Failed to convert line to polygon:`, conversionError);
                // Skip feature yang tidak bisa dikonversi
                continue;
            }
        }

        return turf.featureCollection(polygonFeatures);
    } catch (error) {
        console.error("Error converting lines to polygons:", error);
        return null;
    }
};

const removeDuplicatesLayers = (featureClip: FeatureCollection<Geometry>) => {
    try {
        return turf.featureCollection(
            featureClip.features
                .filter(
                    (feature): feature is Feature<Geometry> =>
                        feature.geometry.type === "Polygon" ||
                        feature.geometry.type === "MultiPolygon"
                )
                .map((feature) => {
                    const polygonFeature = turf.cleanCoords(feature);
                    return polygonFeature;
                })
        );
    } catch (error) {
        console.error("Error clipping layers:", error);
        return null;
    }
};

const hexagonLayer = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    cellSide: number,
    units: turf.Units = "kilometers"
): FeatureCollection<Polygon> | null => {
    try {
        if (
            !featureClip ||
            !featureClip.features ||
            !Array.isArray(featureClip.features) ||
            featureClip.features.length === 0
        ) {
            throw new Error(
                "Invalid FeatureCollection: featureClip.features is not an array or is empty"
            );
        }

        const bbox = turf.bbox(featureClip);

        // FIXED: Handle mask dengan proper typing
        let maskFeature: Feature<Polygon> | undefined;

        if (featureClip.features.length === 1) {
            const feature = featureClip.features[0];
            // Cast ke Polygon jika memang Polygon
            if (feature.geometry.type === "Polygon") {
                maskFeature = feature as Feature<Polygon>;
            }
        } else {
            // Union multiple features
            try {
                const unionResult = turf.union(featureClip);
                if (unionResult && unionResult.geometry.type === "Polygon") {
                    maskFeature = unionResult as Feature<Polygon>;
                }
            } catch (unionError) {
                console.warn(
                    "Failed to union features for mask, proceeding without mask"
                );
            }
        }

        const hexGrid = turf.hexGrid(bbox, cellSide, {
            units,
            mask: maskFeature, // Bisa undefined jika tidak ada mask yang valid
        });

        // Add properties ke setiap hexagon (dengan fallback filtering jika tidak ada mask)
        let hexagons = hexGrid.features;

        // Jika tidak ada mask atau mask gagal, lakukan manual filtering
        if (!maskFeature) {
            hexagons = hexGrid.features.filter((hex) =>
                featureClip.features.some((feature) => {
                    try {
                        const intersection = turf.intersect(
                            turf.featureCollection([hex, feature])
                        );
                        return intersection !== null;
                    } catch {
                        // Fallback ke point-in-polygon
                        return turf.booleanPointInPolygon(turf.center(hex), feature);
                    }
                })
            );
        }

        const processedHexagons = hexagons.map((hex) => {
            const area = turf.area(hex) / 1e6; // Convert to km²
            return {
                ...hex,
                properties: {
                    size: cellSide,
                    units: units,
                    area: parseFloat(area.toFixed(4)), // Bulatkan ke 4 desimal
                },
            };
        });

        return turf.featureCollection(hexagons);
    } catch (error) {
        console.error("Error creating hexagon layer:", error);
        return null;
    }
};

const simplifyLayers = (
    featureCollection: FeatureCollection<Polygon | MultiPolygon>,
    tolerance: number = 0.001,
    highQuality: boolean = true
): FeatureCollection<Polygon | MultiPolygon> => {
    try {
        return turf.featureCollection(
            featureCollection.features.map((feature) =>
                turf.simplify(feature, { tolerance, highQuality })
            )
        );
    } catch (error) {
        console.error("Error simplifying polygons:", error);
        return featureCollection;
    }
};

const pointAlongLinesLayers = (
    lineFeatureCollection: FeatureCollection<LineString | MultiLineString>,
    interval: number,
    units: turf.Units = "kilometers"
): FeatureCollection<Point> | null => {
    try {
        const points: Feature<Point>[] = [];

        lineFeatureCollection.features.forEach((feature, featureIndex) => {
            if (feature.geometry.type === "LineString") {
                // Buat feature LineString eksplisit
                const line = turf.lineString(
                    feature.geometry.coordinates,
                    feature.properties
                );
                const length = turf.length(line, { units });
                const numPoints = Math.floor(length / interval) + 1;

                for (let i = 0; i < numPoints; i++) {
                    const distance = Math.min(i * interval, length);
                    const point = turf.along(line, distance, { units });

                    points.push({
                        ...point,
                        properties: {
                            ...feature.properties,
                            sourceFeatureIndex: featureIndex,
                            segmentIndex: 0,
                            pointIndex: i,
                            distanceFromStart: parseFloat(distance.toFixed(4)),
                            totalLineLength: parseFloat(length.toFixed(4)),
                        },
                    });
                }
            } else if (feature.geometry.type === "MultiLineString") {
                feature.geometry.coordinates.forEach((lineCoords, segmentIndex) => {
                    const line = turf.lineString(lineCoords, feature.properties);
                    const length = turf.length(line, { units });
                    const numPoints = Math.floor(length / interval) + 1;

                    for (let i = 0; i < numPoints; i++) {
                        const distance = Math.min(i * interval, length);
                        const point = turf.along(line, distance, { units });

                        points.push({
                            ...point,
                            properties: {
                                ...feature.properties,
                                sourceFeatureIndex: featureIndex,
                                segmentIndex: segmentIndex,
                                pointIndex: i,
                                distanceFromStart: parseFloat(distance.toFixed(4)),
                                totalLineLength: parseFloat(length.toFixed(4)),
                            },
                        });
                    }
                });
            }
        });

        return turf.featureCollection(points);
    } catch (error) {
        console.error("Error generating points along line:", error);
        return null;
    }
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
    searchAlternatives,
    searchPlaces,
    simplifyLayers
};

