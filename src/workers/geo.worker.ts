import * as turf from "@turf/turf";
import * as wkt from "wkt";
import { FeatureCollection, Polygon, MultiPolygon, Feature, Geometry, Point, LineString, MultiLineString } from "geojson";

// CSV Parsing functions
const parseCSVLine = (line: string, delim: string) => {
    const result = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === delim && !inQuotes) {
            result.push(cur.trim());
            cur = "";
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
};

const sanitizeHeaders = (rawHeaders: string[]) => {
    const counts: { [key: string]: number } = {};
    return rawHeaders.map((h, i) => {
        let name = h.trim();
        if (name === "") name = `Field ${i + 1}`;

        if (counts[name] !== undefined) {
            counts[name]++;
            const newName = `${name}_${counts[name]}`;
            return newName;
        } else {
            counts[name] = 0;
            return name;
        }
    });
};

const processCSVText = (text: string, options: { delimiter?: string, headerLinesToDiscard?: number, firstRecordHasFieldNames?: boolean, limit?: number }) => {
    const {
        delimiter = ",",
        headerLinesToDiscard = 0,
        firstRecordHasFieldNames = true,
        limit
    } = options;

    const allLines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    let lines = allLines.slice(headerLinesToDiscard);

    if (limit) {
        lines = lines.slice(0, limit + (firstRecordHasFieldNames ? 1 : 0));
    }

    if (lines.length === 0) throw new Error("CSV is empty after applying offset");

    const rawData = lines.map(line => parseCSVLine(line, delimiter));
    let headers: string[] = [];
    let rows: any[] = [];

    if (firstRecordHasFieldNames) {
        headers = sanitizeHeaders(rawData[0]);
        rows = rawData.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header] = row[i];
            });
            return obj;
        });
    } else {
        const maxCols = Math.max(...rawData.map(r => r.length));
        headers = Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`);
        rows = rawData.map(row => {
            const obj: any = {};
            headers.forEach((header, i) => {
                obj[header] = row[i];
            });
            return obj;
        });
    }

    return { headers, rows, rawData };
};

const csvToGeoJSON = (rows: any[], options: { latField?: string, lngField?: string, wktField?: string }) => {
    const { latField, lngField, wktField } = options;

    const features = rows.map(row => {
        if (wktField && row[wktField]) {
            try {
                const geometry = wkt.parse(row[wktField]);
                return {
                    type: "Feature",
                    geometry: geometry as Geometry,
                    properties: row
                };
            } catch (e) {
                return null;
            }
        } else if (latField && lngField) {
            const lat = parseFloat(row[latField]);
            const lng = parseFloat(row[lngField]);
            if (isNaN(lat) || isNaN(lng)) return null;
            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [lng, lat]
                },
                properties: row
            };
        }
        return null;
    }).filter(f => f !== null) as Feature[];

    const data: FeatureCollection = {
        type: "FeatureCollection",
        features
    };

    let bbox: [number, number, number, number] | undefined;
    let geometryTypes: string[] = [];

    if (features.length > 0) {
        try {
            bbox = turf.bbox(data) as [number, number, number, number];
            geometryTypes = [...new Set(features.map(f => f.geometry.type))];
        } catch (e) {
            console.warn("Worker: Error calculating bbox/types", e);
        }
    }

    return { data, bbox, geometryTypes };
};

// Implementation of heavy functions
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

const bufferLayers = (
    featureCollection: FeatureCollection<Geometry>,
    radius: number,
    units: turf.Units = "kilometers"
) => {
    try {
        const bufferedFeatures: Feature<Polygon | MultiPolygon>[] = [];

        for (const feature of featureCollection.features) {
            if (!feature.geometry) continue;

            const buffered = turf.buffer(feature, radius, { units });
            if (
                buffered &&
                (buffered.geometry.type === "Polygon" ||
                    buffered.geometry.type === "MultiPolygon")
            ) {
                bufferedFeatures.push(buffered as Feature<Polygon | MultiPolygon>);
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
        console.error("Error calculating centroids:", error);
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
        console.error("Error removing duplicates:", error);
        return null;
    }
};

const hexagonLayer = (
    featureClip: FeatureCollection<Polygon | MultiPolygon>,
    cellSide: number,
    units: turf.Units = "kilometers",
    gridCode?: string
): FeatureCollection<Polygon> | null => {
    try {
        const bbox = turf.bbox(featureClip);

        let maskFeature: Feature<Polygon> | undefined;

        if (featureClip.features.length === 1) {
            const feature = featureClip.features[0];
            if (feature.geometry.type === "Polygon") {
                maskFeature = feature as Feature<Polygon>;
            }
        } else {
            try {
                const unionResult = turf.union(featureClip);
                if (unionResult && unionResult.geometry.type === "Polygon") {
                    maskFeature = unionResult as Feature<Polygon>;
                }
            } catch (unionError) {
                console.warn("Failed to union features for mask");
            }
        }

        const hexGrid = turf.hexGrid(bbox, cellSide, {
            units,
            mask: maskFeature,
        });

        let hexagons = hexGrid.features;

        if (!maskFeature) {
            hexagons = hexGrid.features.filter((hex) =>
                featureClip.features.some((feature) => {
                    try {
                        const intersection = turf.intersect(
                            turf.featureCollection([hex, feature])
                        );
                        return intersection !== null;
                    } catch {
                        return turf.booleanPointInPolygon(turf.center(hex), feature);
                    }
                })
            );
        }

        const processedHexagons = hexagons.map((hex, index) => {
            const area = turf.area(hex) / 1e6;
            return {
                ...hex,
                properties: {
                    size: cellSide,
                    units: units,
                    area: parseFloat(area.toFixed(4)),
                    code: gridCode ? `${gridCode}-${index}` : `Grid-${index}`,
                },
            };
        });

        return turf.featureCollection(processedHexagons);
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
                const line = turf.lineString(feature.geometry.coordinates, feature.properties);
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

const polygonToLinesLayers = (
    polygonFeature: FeatureCollection<Polygon | MultiPolygon>
): FeatureCollection<LineString | MultiLineString> | null => {
    try {
        const lineFeatures: Feature<LineString | MultiLineString>[] = [];

        for (const feature of polygonFeature.features) {
            const lineResult = turf.polygonToLine(feature);

            if (lineResult) {
                if (lineResult.type === "FeatureCollection") {
                    lineFeatures.push(
                        ...lineResult.features.map((f) => ({
                            ...f,
                            properties: { ...feature.properties },
                        }))
                    );
                } else if (lineResult.type === "Feature") {
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
                const polygonResult = turf.lineToPolygon(feature);

                if (polygonResult) {
                    const polygonWithProps: Feature<Polygon | MultiPolygon> = {
                        ...polygonResult,
                        properties: { ...feature.properties },
                    };

                    polygonFeatures.push(polygonWithProps);
                }
            } catch (conversionError) {
                console.warn(`Failed to convert line to polygon:`, conversionError);
                continue;
            }
        }

        return turf.featureCollection(polygonFeatures);
    } catch (error) {
        console.error("Error converting lines to polygons:", error);
        return null;
    }
};

// Worker message handler
self.onmessage = async (e: MessageEvent) => {
    const { type, payload, id } = e.data;
    try {
        let result;
        switch (type) {
            case "clip":
                result = clipLayers(payload.featureClip, payload.featureOverlay);
                break;
            case "buffer":
                result = bufferLayers(payload.featureCollection, payload.radius, payload.units);
                break;
            case "difference":
                result = differenceLayers(payload.featureClip, payload.featureOverlay);
                break;
            case "centroid":
                result = centroidLayers(payload.featureClip);
                break;
            case "bboxPolygon":
                result = bboxPolygonLayers(payload.featureCollection);
                break;
            case "removeDuplicates":
                result = removeDuplicatesLayers(payload.featureClip);
                break;
            case "hexagon":
                result = hexagonLayer(payload.featureClip, payload.cellSide, payload.units, payload.gridCode);
                break;
            case "simplify":
                result = simplifyLayers(payload.featureCollection, payload.tolerance, payload.highQuality);
                break;
            case "pointAlongLines":
                result = pointAlongLinesLayers(payload.lineFeatureCollection, payload.interval, payload.units);
                break;
            case "polygonToLines":
                result = polygonToLinesLayers(payload.polygonFeature);
                break;
            case "linesToPolygon":
                result = linesToPolygonLayers(payload.lineFeature);
                break;
            case "processCSVText":
                result = processCSVText(payload.text, payload.options);
                break;
            case "csvToGeoJSON":
                result = csvToGeoJSON(payload.rows, payload.options);
                break;
            case "js-code":
                try {
                    const func = new Function("data", "nodes", "turf", payload.code);
                    result = func(payload.data, payload.nodes, turf);
                } catch (err: any) {
                    throw new Error(`JS Code Error: ${err.message}`);
                }
                break;
            default:
                throw new Error(`Unknown operation type: ${type}`);
        }
        self.postMessage({ id, result });
    } catch (error: any) {
        self.postMessage({ id, error: error.message });
    }
};
