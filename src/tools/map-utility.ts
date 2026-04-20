import { Layer, MapServiceVendor } from "@/types/map.types";
import { addGeojsonToMap, calculateCoordinatesWithAspectRatio } from "./map-tools";
import { geoWorkerPool } from "./geo-worker-pool";
import { v4 } from "uuid";
import shp from "shpjs";
import JSZip from "jszip";
import * as toGeoJSON from "@tmcw/togeojson";
import * as topojson from "topojson-client";
import * as wkt from "wkt";
import { fromBlob } from "geotiff";


// File type handlers
interface FileHandler {
    extensions: string[];
    handler: (file: File) => Promise<GeoJSON.GeoJSON | string>;
}

// Utility functions
export const getLayerName = (filename: string): string => {
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

const processVideo = async (file: File): Promise<string> => {
    return await readFileAsDataURL(file);
};

export interface GeoTIFFData {
    type: 'geotiff';
    imageUrl: string;
    bounds: [[number, number], [number, number], [number, number], [number, number]];
    width: number;
    height: number;
}

const processGeoTIFF = async (file: File): Promise<GeoTIFFData> => {
    try {
        const tiff = await fromBlob(file);
        const image = await tiff.getImage();
        const bbox = image.getBoundingBox();
        const width = image.getWidth();
        const height = image.getHeight();

        // Check if file is too large
        const maxPixels = 4096 * 4096; // 16 megapixels max
        if (width * height > maxPixels) {
            throw new Error(`GeoTIFF is too large (${width}x${height}). Maximum supported size is 4096x4096 pixels. Please use a smaller file or create a thumbnail version.`);
        }

        // Read the raster data and convert to canvas
        const rasters = await image.readRasters();
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            // Convert raster data to RGBA
            // Convert TypedArrays to regular arrays for easier indexing
            const rasterArrays = (rasters as any[]).map((r: any) => Array.isArray(r) ? r : Array.from(r as ArrayLike<number>));

            for (let i = 0; i < width * height; i++) {
                const idx = i * 4;
                if (rasterArrays.length >= 3) {
                    // RGB image
                    data[idx] = rasterArrays[0][i];     // R
                    data[idx + 1] = rasterArrays[1][i]; // G
                    data[idx + 2] = rasterArrays[2][i]; // B
                    data[idx + 3] = 255;           // A
                } else if (rasterArrays.length === 1) {
                    // Grayscale image
                    const val = rasterArrays[0][i];
                    data[idx] = val;
                    data[idx + 1] = val;
                    data[idx + 2] = val;
                    data[idx + 3] = 255;
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        const imageUrl = canvas.toDataURL();

        // Convert bbox to Mapbox coordinates format
        // bbox format: [minX, minY, maxX, maxY]
        const bounds: [[number, number], [number, number], [number, number], [number, number]] = [
            [bbox[0], bbox[3]], // top-left
            [bbox[2], bbox[3]], // top-right
            [bbox[2], bbox[1]], // bottom-right
            [bbox[0], bbox[1]]  // bottom-left
        ];

        return {
            type: 'geotiff',
            imageUrl,
            bounds,
            width,
            height
        };
    } catch (error) {
        console.error('Error processing GeoTIFF:', error);
        throw new Error(`Failed to process GeoTIFF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export interface CSVOptions {
    delimiter?: string;
    headerLinesToDiscard?: number;
    firstRecordHasFieldNames?: boolean;
    limit?: number;
}

export const processCSV = async (file: File, options: CSVOptions = {}): Promise<{ headers: string[], rows: any[], rawData: string[][] }> => {
    const {
        headerLinesToDiscard = 0,
        limit
    } = options;

    let text = "";
    if (limit) {
        // If limit is provided, we try to read only the beginning of the file
        const estimateSize = (headerLinesToDiscard + limit + 5) * 1000; // Increased estimate for safety
        const blob = file.slice(0, estimateSize);
        text = await readFileAsText(new File([blob], file.name));
    } else {
        text = await readFileAsText(file);
    }

    return await geoWorkerPool.execute("processCSVText", { text, options });
};

export const csvToGeoJSON = async (rows: any[], options: { latField?: string, lngField?: string, wktField?: string }): Promise<{ data: GeoJSON.FeatureCollection, bbox?: [number, number, number, number], geometryTypes: string[] }> => {
    return await geoWorkerPool.execute("csvToGeoJSON", { rows, options });
};

// File type mapping
const fileHandlers: FileHandler[] = [
    { extensions: ['.geojson'], handler: processGeoJSON },
    { extensions: ['.zip'], handler: processShapefile },
    { extensions: ['.kml'], handler: processKML },
    { extensions: ['.kmz'], handler: processKMZ },
    { extensions: ['.topojson'], handler: processTopoJSON },
    { extensions: ['.wkt'], handler: processWKT },
    { extensions: ['.tif', '.tiff', '.geotiff'], handler: processGeoTIFF as any },
    { extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'], handler: processImage },
    { extensions: ['.mp4', '.webm', '.ogg', '.mov'], handler: processVideo },
    {
        extensions: ['.csv', '.txt'], handler: async (file) => {
            const { rows } = await processCSV(file);
            // Default conversion attempt if lat/lng found in headers
            // This is a fallback for handleSingleFile, but AddLayerModal will use specific mapping
            return await csvToGeoJSON(rows, { latField: "lat", lngField: "lng" });
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
    return file.type.startsWith("image/") || file.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp|bmp)$/) !== null;
};

const isVideoFile = (file: File): boolean => {
    return file.type.startsWith("video/") || file.name.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) !== null;
};

const isGeoTIFFFile = (file: File): boolean => {
    return file.name.toLowerCase().match(/\.(tif|tiff|geotiff)$/) !== null;
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