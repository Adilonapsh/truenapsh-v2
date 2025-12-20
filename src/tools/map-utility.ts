import { Layer, MapServiceVendor } from "@/types/map.types";
import { addGeojsonToMap, calculateCoordinatesWithAspectRatio } from "./map-tools";
import { v4 } from "uuid";
import shp from "shpjs";
import JSZip from "jszip";
import * as toGeoJSON from "@tmcw/togeojson";
import * as topojson from "topojson-client";
import * as wkt from "wkt";


// File type handlers
interface FileHandler {
    extensions: string[];
    handler: (file: File) => Promise<GeoJSON.GeoJSON | string>;
}

// Utility functions
const getLayerName = (filename: string): string => {
    return filename.split(".")[0].replace(/_/g, " ");
};

const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsText(file);
    });
};

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsDataURL(file);
    });
};

// File processing handlers
const processGeoJSON = async (file: File): Promise<GeoJSON.GeoJSON> => {
    const text = await readFileAsText(file);
    return JSON.parse(text);
};

const processShapefile = async (file: File): Promise<GeoJSON.FeatureCollection> => {
    const buffer = await file.arrayBuffer();
    const shapeData = await shp(buffer);
    if (Array.isArray(shapeData)) {
        return {
            type: "FeatureCollection",
            features: shapeData.flatMap(collection => collection.features)
        };
    }
    return shapeData as GeoJSON.FeatureCollection;
};

const processKML = async (file: File): Promise<GeoJSON.GeoJSON> => {
    const text = await readFileAsText(file);
    const parser = new DOMParser();
    const kml = parser.parseFromString(text, "application/xml");
    return toGeoJSON.kml(kml) as GeoJSON.GeoJSON;
};

const processKMZ = async (file: File): Promise<GeoJSON.GeoJSON> => {
    const zip = new JSZip();
    const content = await zip.loadAsync(file);

    const kmlFile = Object.keys(content.files).find(filename =>
        filename.endsWith(".kml")
    );

    if (!kmlFile) {
        throw new Error("No KML file found in KMZ archive");
    }

    const kmlText = await content.files[kmlFile].async("text");
    const parser = new DOMParser();
    const kml = parser.parseFromString(kmlText, "application/xml");
    return toGeoJSON.kml(kml) as GeoJSON.GeoJSON;
};

const processTopoJSON = async (file: File): Promise<GeoJSON.GeoJSON> => {
    const text = await readFileAsText(file);
    const topojsonData = JSON.parse(text);
    const firstObjectKey = Object.keys(topojsonData.objects)[0];

    if (!firstObjectKey) {
        throw new Error("No objects found in TopoJSON file");
    }

    return topojson.feature(
        topojsonData,
        topojsonData.objects[firstObjectKey]
    ) as GeoJSON.GeoJSON;
};

const processWKT = async (file: File): Promise<GeoJSON.GeoJSON> => {
    const text = await readFileAsText(file);
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: wkt.parse(text),
                properties: {},
            },
        ],
    } as GeoJSON.GeoJSON;
};

const processImage = async (file: File): Promise<string> => {
    return await readFileAsDataURL(file);
};

export interface CSVOptions {
    delimiter?: string;
    headerLinesToDiscard?: number;
    firstRecordHasFieldNames?: boolean;
}

export const processCSV = async (file: File, options: CSVOptions = {}): Promise<{ headers: string[], rows: any[], rawData: string[][] }> => {
    const text = await readFileAsText(file);
    const {
        delimiter = ",",
        headerLinesToDiscard = 0,
        firstRecordHasFieldNames = true
    } = options;

    const allLines = text.split(/\r?\n/).filter(line => line.trim() !== "");
    const lines = allLines.slice(headerLinesToDiscard);

    if (lines.length === 0) throw new Error("CSV is empty after applying offset");

    const parseLine = (line: string, delim: string) => {
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

    const rawData = lines.map(line => parseLine(line, delimiter));
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

export const csvToGeoJSON = (rows: any[], options: { latField?: string, lngField?: string, wktField?: string }): GeoJSON.FeatureCollection => {
    const { latField, lngField, wktField } = options;

    return {
        type: "FeatureCollection",
        features: rows.map(row => {
            if (wktField && row[wktField]) {
                try {
                    const geometry = wkt.parse(row[wktField]);
                    return {
                        type: "Feature",
                        geometry: geometry,
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
        }).filter(f => f !== null) as GeoJSON.Feature[]
    };
};

// File type mapping
const fileHandlers: FileHandler[] = [
    { extensions: ['.geojson'], handler: processGeoJSON },
    { extensions: ['.zip'], handler: processShapefile },
    { extensions: ['.kml'], handler: processKML },
    { extensions: ['.kmz'], handler: processKMZ },
    { extensions: ['.topojson'], handler: processTopoJSON },
    { extensions: ['.wkt'], handler: processWKT },
    {
        extensions: ['.csv', '.txt'], handler: async (file) => {
            const { rows } = await processCSV(file);
            // Default conversion attempt if lat/lng found in headers
            // This is a fallback for handleSingleFile, but AddLayerModal will use specific mapping
            return csvToGeoJSON(rows, { latField: "lat", lngField: "lng" });
        }
    },
];

export const getFileHandler = (filename: string): FileHandler | null => {
    const lowerFilename = filename.toLowerCase();
    return fileHandlers.find(handler =>
        handler.extensions.some(ext => lowerFilename.includes(ext))
    ) || null;
};

const isImageFile = (file: File): boolean => {
    return file.type.startsWith("image/");
};

// const addImageToMap = (imageUrl: string, lngLat: mapboxgl.LngLat) => {
//     const map = mapRef.current?.getMap();
//     if (!map) return;

//     const img = new window.Image();
//     img.src = imageUrl;
//     img.onload = () => {
//         const aspectRatio = img.width / img.height;
//         const sourceId = v4();
//         const layerId = v4();

//         const coordinates = calculateCoordinatesWithAspectRatio(
//             lngLat,
//             aspectRatio
//         );

//         if (coordinates.length === 4) {
//             map.addSource(sourceId, {
//                 type: "image",
//                 url: imageUrl,
//                 coordinates: coordinates as [
//                     [number, number],
//                     [number, number],
//                     [number, number],
//                     [number, number]
//                 ],
//             });

//             map.addLayer({
//                 id: layerId,
//                 type: "raster",
//                 source: sourceId,
//                 metadata: {},
//             });

//             const layerName = "Image " + (layers.length + 1);

//             const commonLayerProps = {
//                 map_service_url: imageUrl,
//                 map_service_layer_name: layerName,
//                 map_service_vendor: MapServiceVendor.Image,
//                 type: "2D",
//                 visible: true,
//                 min_zoom: 0,
//                 max_zoom: 24,
//                 status: "Local",
//                 rendered: 1,
//             };

//             useAddLayer({
//                 ...commonLayerProps,
//                 id: layerId,
//                 name: layerName,
//             } as Layer);
//         }
//     };
// };

const handleSingleFile = async (
    file: File,
    mapRef: any,
    mousePosition: any
): Promise<void> => {
    try {
        // if (isImageFile(file)) {
        //     const imgSrc = await processImage(file);
        //     if (mousePosition) {
        //         addImageToMap(imgSrc, mousePosition);
        //     } else {
        //         throw new Error("Mouse position is required to add image to map");
        //     }
        //     return;
        // }

        const handler = getFileHandler(file.name);
        if (!handler) {
            throw new Error(
                `Unsupported file type. Supported formats: .geojson, .kml, .kmz, .topojson, .wkt, .zip, or image files`
            );
        }

        const data = await handler.handler(file);
        const layerName = getLayerName(file.name);

        addGeojsonToMap({
            mapRef,
            layerName,
            data: data as GeoJSON.GeoJSON,
        });
    } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        throw error;
    }
};

// Main drop handler
export const handleDrop = async (
    event: React.DragEvent<HTMLDivElement>,
    mapRef: any,
    mousePosition: any,
    toast: any
): Promise<void> => {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) {
        toast.error("No files detected");
        return;
    }

    const results = await Promise.allSettled(
        files.map(file =>
            handleSingleFile(
                file,
                mapRef,
                mousePosition
            )
        )
    );

    // Handle results
    const errors: string[] = [];
    let successCount = 0;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            successCount++;
        } else {
            errors.push(`${files[index].name}: ${result.reason.message}`);
        }
    });

    // Show appropriate toast messages
    if (successCount > 0 && errors.length === 0) {
        toast.success(`Successfully processed ${successCount} file(s)`);
    } else if (successCount > 0 && errors.length > 0) {
        toast.warning(`Processed ${successCount} file(s), but ${errors.length} failed`);
        console.warn("File processing errors:", errors);
    } else {
        toast.error("Failed to process any files");
        console.error("File processing errors:", errors);
    }
};