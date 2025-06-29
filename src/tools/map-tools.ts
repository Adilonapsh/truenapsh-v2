import { overpassBuildingIntegration } from "@/services/map-integrations";
import { Layer, MapServiceVendor, Place } from "@/types/map.types";
import * as turf from "@turf/turf";
import { Feature, FeatureCollection, GeoJsonProperties, Geometry, GeometryCollection, LineString, MultiLineString, MultiPolygon, Point, Polygon } from "geojson";
import { MapRef } from "react-map-gl";
import { v4 } from "uuid";

const searchPlaces = async (search: string, lang: string = "EN-en") => {
    if (isCoordinates(search)) {
        const place: Place[] = [
            {
                name: search,
                fullName: "Coordinates : " + search,
                address: search,
                location: {
                    lat: parseFloat(search.split(",")[1]),
                    lng: parseFloat(search.split(",")[0]),
                }
            }
        ];
        return place;
    } else {
        try {
            if (search) {
                const response = await fetch(
                    "/api/maps/location?" +
                    new URLSearchParams({ search, lang, }),
                    { mode: "no-cors", }
                );
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
}

const searchAlternatives = async (from: number[], to: number[]) => {
    try {
        const body = {
            from: {
                x: from[0],
                y: from[1]
            },
            to: {
                x: to[0],
                y: to[1]
            }
        };
        const response = await fetch("/api/maps/alternatives", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        const alternatives: any = [];
        data.data.alternatives.forEach((alternative: { coords: { x: number; y: number }[]; response: any }) => {
            const { coords, response } = alternative;
            const transformed = coords.map(({ x, y }) => [x, y]);
            alternatives.push({ coords: transformed, response })
        });
        return alternatives;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error caught:", error.message);
        } else {
            console.error("Unknown error caught:", error);
        }
        return [];
    }
}

const isCoordinates = (str: string) => {
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordRegex.test(str)) {
        return false;
    }
    return true;
}

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
        [lngLat.lng, lngLat.lat - height]
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
                "fill-color": "#627BC1"
            }
        }
    },
    {
        types: ["LineString", "MultiLineString"],
        layerType: "line" as const,
        nameSuffix: "Linestring",
        layerProps: {
            paint: {
                "line-color": "#627BC1",
                "line-width": 2,
                "line-opacity": 1
            }
        }
    },
    {
        types: ["Point", "MultiPoint"],
        layerType: "circle" as const,
        nameSuffix: "Point",
        layerProps: {
            paint: {
                "circle-radius": 5,
                "circle-color": "#627BC1",
                "circle-opacity": 1
            }
        }
    }
];

const findLayerConfigByGeometryType = (type: string) => {
    return layerConfigs.find(config => config.types.includes(type));
}

const addGeojsonToMap = async ({
    mapRef,
    layerName,
    mapServiceUrl = "",
    layerCode = "",
    data,
    addLayer,
}: {
    mapRef: React.RefObject<MapRef | null>,
    layerName: string,
    mapServiceUrl?: string,
    layerCode?: string,
    data: GeoJSON.GeoJSON
    addLayer: (layer: Layer) => void,
}) => {
    const map = mapRef?.current?.getMap();
    if (!map) return;

    const layerId = v4();
    const commonLayerProps = {
        map_service_url: mapServiceUrl,
        map_service_layer_name: layerCode,
        map_service_vendor: MapServiceVendor.GeoJSON,
        type: "2D",
        visible: true,
        min_zoom: 0,
        max_zoom: 24,
        status: "Local",
        rendered: 1,
        metadata: {
            map_service_url: mapServiceUrl,
            map_service_layer_name: layerCode,
            map_service_vendor: MapServiceVendor.GeoJSON,
        }
    };

    const geometryTypes = [...new Set((data as GeoJSON.FeatureCollection).features.map(feature => feature.geometry.type))];

    // Add source
    map.addSource(layerId, {
        type: 'geojson',
        data: data,
    });

    // Fit bounds
    const bounds: [number, number, number, number] = turf.bbox(data).slice(0, 4) as [number, number, number, number];
    map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000
    });


    layerConfigs.forEach(config => {
        if (config.types.some(type => geometryTypes.includes(type as "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon" | "GeometryCollection"))) {
            const layerSubId = config.layerType === "circle" ? "point" : config.layerType;
            const fullLayerId = `${layerId}-${layerSubId}`;

            // Add layer to state
            // setLayers(prevLayers => [...prevLayers, {
            //     ...commonLayerProps,
            //     id: fullLayerId,
            //     name: `${layerName} ${config.nameSuffix}`
            // }]);

            addLayer({
                id: fullLayerId,
                name: `${layerName} ${config.nameSuffix}`,
                map_service_url: commonLayerProps.map_service_url,
                map_service_layer_name: commonLayerProps.map_service_layer_name,
                map_service_vendor: commonLayerProps.map_service_vendor,
                type: commonLayerProps.type,
                visible: commonLayerProps.visible,
                min_zoom: commonLayerProps.min_zoom,
                max_zoom: commonLayerProps.max_zoom,
                status: commonLayerProps.status,
                metadata: commonLayerProps.metadata
            });

            map.addLayer({
                id: fullLayerId,
                type: config.layerType,
                source: layerId,
                minzoom: 0,
                maxzoom: 24,
                filter: ["in", "$type", config.types[0]],
                paint: config.layerProps.paint,
                metadata: commonLayerProps.metadata ?? {}
            });
        }
    });
};

const clipLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Polygon | MultiPolygon> | undefined => {
    try {
        const clippedFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const overlayFeature of featureOverlay.features) {
            for (const clipFeature of featureClip.features) {
                try {
                   
                    const intersection = turf.intersect(
                        overlayFeature as any,
                        clipFeature
                    );

                    if (intersection) {
                        if (intersection.geometry.type === 'Polygon' || intersection.geometry.type === 'MultiPolygon') {
                            const clippedFeature: Feature<Polygon | MultiPolygon> = turf.feature(
                                intersection.geometry as Polygon | MultiPolygon,
                                { ...overlayFeature.properties }
                            );
                            clippedFeatures.push(clippedFeature);
                        }
                    }
                } catch (intersectionError) {
                    console.warn('Error intersecting features:', intersectionError);
                }
            }
        }
        return turf.featureCollection(clippedFeatures);

    } catch (error) {
        console.error('Error clipping layers:', error);
        return undefined;
    }
};

const bufferLayers = (
    featureCollection: FeatureCollection<Geometry>,
    radius: number,
    units: turf.Units = 'kilometers'
): FeatureCollection<Polygon | MultiPolygon> | undefined => {
    try {
        const bufferedFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const feature of featureCollection.features) {
            try {
                const buffered = turf.buffer(feature, radius, { units });

                if (buffered && buffered.geometry) {
                    const bufferedFeature: Feature<Polygon | MultiPolygon> = {
                        type: 'Feature',
                        geometry: buffered.geometry as Polygon | MultiPolygon,
                        properties: { ...feature.properties }
                    };
                    bufferedFeatures.push(bufferedFeature);
                }
            } catch (bufferError) {
                console.warn(`Error buffering feature:`, bufferError);
            }
        }

        return turf.featureCollection(bufferedFeatures);

    } catch (error) {
        console.error('Error buffering layers:', error);
        return undefined;
    }
}

const differenceLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    featureOverlay: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<Polygon | MultiPolygon> | undefined => {
    try {
        const differenceFeatures: Feature<Polygon | MultiPolygon>[] = [];

        // Iterate through each overlay feature
        for (const overlayFeature of featureOverlay.features) {
            let currentFeature = overlayFeature;
            
            // Apply difference operation with each clip feature
            for (const clipFeature of featureClip.features) {
                try {
                    // Perform difference between current feature and clip feature
                    const difference = turf.difference(
                        turf.featureCollection([currentFeature, clipFeature])
                    );
                    
                    if (difference && difference.geometry) {
                        // Update current feature to the result of the difference
                        currentFeature = {
                            type: 'Feature',
                            geometry: difference.geometry as Polygon | MultiPolygon,
                            properties: { ...overlayFeature.properties }
                        };
                    } else {
                        // If no difference (completely overlapped), break out
                        break;
                    }
                } catch (differenceError) {
                    console.warn('Error computing difference:', differenceError);
                    // Continue with next clip feature
                }
            }
            
            // Add the final result if it exists
            if (currentFeature && currentFeature.geometry) {
                differenceFeatures.push(currentFeature);
            }
        }

        return turf.featureCollection(differenceFeatures);

    } catch (error) {
        console.error('Error computing difference layers:', error);
        return undefined;
    }
}

const centroidLayers = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
) => {
    try {
        return turf.featureCollection(featureClip.features.map(feature => {
            const centroidFeature = turf.centroid(feature);
            return centroidFeature;
        }));
    } catch (error) {
        console.error('Error clipping layers:', error);
        return null;
    }
}

const polygonToLinesLayers = (
    polygonFeature: FeatureCollection<Polygon | MultiPolygon>,
): FeatureCollection<LineString | MultiLineString> | null => {
    try {
        const lineFeatures: Feature<LineString | MultiLineString>[] = [];

        polygonFeature.features
            .filter((feature): feature is Feature<Polygon | MultiPolygon> =>
                feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'
            )
            .forEach(feature => {
                const lineResult = turf.polygonToLine(feature);
                if (lineResult.type === 'FeatureCollection') {
                    lineFeatures.push(...lineResult.features);
                } else {
                    lineFeatures.push(lineResult);
                }
            });

        return turf.featureCollection(lineFeatures);

    } catch (error) {
        console.error('Error converting polygons to lines:', error);
        return null;
    }
};

const linesToPolygonLayers = (
    lineFeature: FeatureCollection<LineString | MultiLineString>,
): FeatureCollection<Polygon | MultiPolygon> | undefined => {
    try {
        const polygonFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const feature of lineFeature.features) {
            try {
                if (feature.geometry.type === 'LineString') {
                    // Convert LineString to Polygon
                    const polygonFeature = turf.lineToPolygon(feature);
                    
                    if (polygonFeature && polygonFeature.geometry) {
                        const convertedFeature: Feature<Polygon | MultiPolygon> = {
                            type: 'Feature',
                            geometry: polygonFeature.geometry as Polygon | MultiPolygon,
                            properties: { ...feature.properties }
                        };
                        polygonFeatures.push(convertedFeature);
                    }
                } else if (feature.geometry.type === 'MultiLineString') {
                    // Convert each LineString in MultiLineString to Polygon
                    const polygons: Polygon[] = [];
                    
                    for (const lineCoords of feature.geometry.coordinates) {
                        const tempLine = turf.lineString(lineCoords);
                        const polygonFeature = turf.lineToPolygon(tempLine);
                        
                        if (polygonFeature && polygonFeature.geometry) {
                            if (polygonFeature.geometry.type === 'Polygon') {
                                polygons.push(polygonFeature.geometry);
                            } else if (polygonFeature.geometry.type === 'MultiPolygon') {
                                // Flatten MultiPolygon into individual Polygons
                                polygons.push(...polygonFeature.geometry.coordinates.map(coords => ({
                                    type: 'Polygon' as const,
                                    coordinates: coords
                                })));
                            }
                        }
                    }
                    
                    if (polygons.length > 0) {
                        const multiPolygonFeature: Feature<MultiPolygon> = {
                            type: 'Feature',
                            geometry: {
                                type: 'MultiPolygon',
                                coordinates: polygons.map(p => p.coordinates)
                            },
                            properties: { ...feature.properties }
                        };
                        polygonFeatures.push(multiPolygonFeature);
                    }
                }
            } catch (conversionError) {
                console.warn('Error converting line to polygon:', conversionError);
                // Continue with next feature
            }
        }

        return turf.featureCollection(polygonFeatures);

    } catch (error) {
        console.error('Error converting lines to polygons:', error);
        return undefined;
    }
}

const removeDuplicatesLayers = (
    featureClip: FeatureCollection<Geometry>,
) => {
    try {
        return turf.featureCollection(featureClip.features
            .filter((feature): feature is Feature<Geometry> =>
                feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon'
            )
            .map(feature => {
                const polygonFeature = turf.cleanCoords(feature);
                return polygonFeature;
            }));
    } catch (error) {
        console.error('Error clipping layers:', error);
        return null;
    }
}

const hexagonLayer = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    cellSide: number,
    units: turf.Units = 'kilometers'
) => {
    try {
        if (!featureClip || !featureClip.features || !Array.isArray(featureClip.features) || featureClip.features.length === 0) {
            throw new Error("Invalid FeatureCollection: featureClip.features is not an array or is empty");
        }

        const bbox = turf.bbox(featureClip);

        const hexGrid = turf.hexGrid(bbox, cellSide, { units, mask: featureClip?.features[0] as Feature<Polygon, GeoJsonProperties> });
        const hexagons = hexGrid.features
            .filter(hex => featureClip.features.some(feature => turf.booleanPointInPolygon(turf.center(hex), feature)))
            .map(hex => {
                const area = turf.area(hex) / 1e6;
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
        console.error('Error clipping layers:', error);
        return null;
    }
}

const simplifyLayers = (
    featureCollection: FeatureCollection<Polygon | MultiPolygon>,
    tolerance: number = 0.001,
    highQuality: boolean = true
): FeatureCollection<Polygon | MultiPolygon> => {
    try {
        return turf.featureCollection(
            featureCollection.features.map(feature =>
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
    units: turf.Units = 'kilometers'
): FeatureCollection<Point> | undefined => {
    try {
        const points: Feature<Point>[] = [];
        
        for (const feature of lineFeatureCollection.features) {
            try {
                if (feature.geometry.type === 'LineString') {
                    // Type assertion to satisfy turf functions
                    const lineFeature = feature as Feature<LineString>;
                    const length = turf.length(lineFeature, { units });
                    
                    for (let i = 0; i <= length; i += interval) {
                        const point = turf.along(lineFeature, i, { units });
                        if (point && point.geometry) {
                            // Preserve some properties from the original line
                            const pointFeature: Feature<Point> = {
                                type: 'Feature',
                                geometry: point.geometry,
                                properties: {
                                    ...feature.properties,
                                    distance: i,
                                    sourceLineId: feature.properties?.id || null
                                }
                            };
                            points.push(pointFeature);
                        }
                    }
                } else if (feature.geometry.type === 'MultiLineString') {
                    feature.geometry.coordinates.forEach((lineCoords, lineIndex) => {
                        const line = turf.lineString(lineCoords);
                        const length = turf.length(line, { units });
                        
                        for (let i = 0; i <= length; i += interval) {
                            const point = turf.along(line, i, { units });
                            if (point && point.geometry) {
                                // Preserve some properties from the original multiline
                                const pointFeature: Feature<Point> = {
                                    type: 'Feature',
                                    geometry: point.geometry,
                                    properties: {
                                        ...feature.properties,
                                        distance: i,
                                        lineIndex: lineIndex,
                                        sourceLineId: feature.properties?.id || null
                                    }
                                };
                                points.push(pointFeature);
                            }
                        }
                    });
                }
            } catch (featureError) {
                console.warn('Error processing line feature:', featureError);
                // Continue with next feature
            }
        }

        return turf.featureCollection(points);
        
    } catch (error) {
        console.error("Error generating points along line:", error);
        return undefined;
    }
};

const buildingLayers = async (featureCollection: FeatureCollection) => {
    try {
        const bbox = turf.bbox(featureCollection);
        const buildings = await overpassBuildingIntegration(bbox);
        if (buildings) {
            const featureCollection = turf.featureCollection(buildings.filter((building: any): building is GeoJSON.Feature => building !== null));
            return featureCollection;
        }
    } catch (error) {
        console.error("Error fetching building data:", error);
    }
}

const elevationLayers = async (featureCollection: FeatureCollection, source: string) => {
    try {
        console.log("WIP GUYES")
        if (source === "Map Toolkit") {
            const points = featureCollection.features
                .filter(feature => feature.geometry.type !== 'GeometryCollection')
                .map(feature => {
                    const geometry = feature.geometry as Exclude<Geometry, GeometryCollection>;
                    const coords = geometry.coordinates;
                    return Array.isArray(coords[0]) ? coords[0].map((c: any) => `[${c}]`).join(',') : `[${coords}]`;
                });
            const response = await fetch(`https://maptoolkit.p.rapidapi.com/elevation?points=[${points}]`, {
                headers: {
                    'x-rapidapi-key': '313cbbad8cmshee05ce25c9e166bp101569jsnef19f7ec20c8',
                    'x-rapidapi-host': 'maptoolkit.p.rapidapi.com'
                }
            });
            const data = await response.json();
            console.log("Ini Response : ", data);
        } else if (source === "Open Elevation") {
            const points = featureCollection.features
                .filter(feature => feature.geometry.type !== 'GeometryCollection')
                .map(feature => {
                    const geometry = feature.geometry as Exclude<Geometry, GeometryCollection>;
                    const coords = geometry.coordinates;
                    const coordArray = Array.isArray(coords[0]) ? coords[0] : coords;
                    return {
                        latitude: coordArray[1],
                        longitude: coordArray[0]
                    };
                });
            const latitudes = points.map(p => p.latitude).join(',');
            const longitudes = points.map(p => p.longitude).join(',');
            const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`);
            const data = await response.json();
            console.log("Ini Response : ", data);
        } else if (source === "GPXZ") {
            const points = featureCollection.features
                .filter(feature => feature.geometry.type !== 'GeometryCollection')
                .map(feature => {
                    const geometry = feature.geometry as Exclude<Geometry, GeometryCollection>;
                    const coords = geometry.coordinates;
                    const coordArray = Array.isArray(coords[0]) ? coords[0] : coords;
                    return {
                        latitude: coordArray[1],
                        longitude: coordArray[0]
                    };
                });
            const pointsStr = points.map(p => `${p.latitude},${p.longitude}`).join('|');

            const response = await fetch(`https://api.gpxz.io/v1/elevation/points`, {
                method: 'POST',
                headers: {
                    'x-api-key': 'ak_1fJxvQgh_GDctGup4zErSqvRg',
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `latlons=${pointsStr}`
            });
            const data = await response.json();
            console.log("Ini Response : ", data);
        }
    } catch (error) {
        console.error("Error fetching building data:", error);
    }
}

const aiCommand = (
    mapRef: React.RefObject<MapRef | null>,
    command: Record<string, any>,
    layers: Layer[],
) => {
    const {
        action,
        center,
        zoom,
        pitch,
        bearing,
        speed = 1.2,
        duration = 1000,
    } = command;

    if (!mapRef.current) {
        console.warn('Map reference is not available');
        return;
    }

    const commonParams = {
        center,
        zoom,
        pitch,
        bearing
    };

    try {
        if (action === 'flyTo') {
            mapRef?.current?.flyTo({ ...commonParams, speed });
        } else if (action === 'easeTo') {
            mapRef?.current?.getMap().easeTo({ ...commonParams, duration });
        } else if (action === 'findLayer') {
            mapRef?.current?.getMap().getLayer(command.idLayer);
        } else if (action === 'filterLayer') {
            const layerId: string = layers.find(layer => layer.name === command.layerName)?.id ?? "";
            if (layerId) {
                mapRef?.current?.getMap().setFilter(layerId, command.filter);
                const features = mapRef?.current?.getMap().queryRenderedFeatures({ layers: [layerId] });
                console.log("Ini Features ", features);
                if (features.length > 0) {
                    const bbox = turf.bbox(turf.featureCollection(features));
                    mapRef?.current?.getMap().fitBounds([
                        [bbox[0], bbox[1]],
                        [bbox[2], bbox[3]]
                    ], {
                        padding: 50,
                        maxZoom: 15
                    });
                }
            }
        }

    } catch (error) {
        console.error('Error executing map command:', error);
    }
}

export {
    addGeojsonToMap, aiCommand, bufferLayers,
    buildingLayers,
    calculateCoordinatesWithAspectRatio,
    centroidLayers,
    clipLayers,
    differenceLayers, elevationLayers, getBBOX,
    hexagonLayer,
    isCoordinates,
    linesToPolygonLayers,
    pointAlongLinesLayers,
    polygonToLinesLayers,
    removeDuplicatesLayers,
    searchAlternatives,
    searchPlaces,
    simplifyLayers,
    findLayerConfigByGeometryType
};

