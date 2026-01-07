import { tool } from "ai";
import { z } from "zod";
import { filterLayerAttributes, MapCommandExecutor } from "./ai-tools";
import { Layer } from "@/types/map.types";
import { encode as ToonEncode } from '@toon-format/toon';
import { weatherIntegration } from "@/services/map-integrations";
import { searchPlaces } from "../map-tools";
import { useMapStore } from "@/stores/map";


const callTools = (section: string, layers: Layer[]) => {
    const tools: Record<string, any> = {
        map: {
            get_layers: tool({
                description: "Get the list of available layers from the system",
                parameters: z.object({
                    layerType: z.string().default("all").nullable().describe("Type of layers to retrieve it can be all, vector, or raster"),
                }),
                execute: async ({ layerType }) => {
                    const filteredLayers = filterLayerAttributes(layers, [
                        "id",
                        "name",
                        "description",
                        "map_service_url",
                        "map_service_layer_name",
                        "map_service_vendor",
                        "metadata.version",
                        "render_type",
                        "created_at",
                    ]);
                    return ToonEncode({ layers: filteredLayers });
                },
            }),
            get_layer_properties: tool({
                description: "Get the fields of a specific layer",
                parameters: z.object({
                    layerId: z.string().describe("ID of the layer to retrieve fields for"),
                }),
                execute: async ({ layerId }) => {
                    const layer = layers.find((l: Layer) => l.id === layerId);
                    if (!layer) {
                        return { error: `Layer with ID ${layerId} not found` };
                    }
                    return ToonEncode({ properties: layer.fields });
                },
            }),
            get_time: tool({
                description: "Get the current time",
                parameters: z.object({
                    timezone: z.string().default("Asia/Jakarta").nullable().describe("Timezone of the location"),
                }),
                execute: async ({ timezone }) => {
                    const time = new Date().toLocaleString("id-ID", {
                        timeZone: timezone || "Asia/Jakarta",
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    });
                    return ToonEncode({ time });
                },
            }),
            get_weather: tool({
                description: "Get the weather forecast for a specific location",
                parameters: z.object({
                    source: z.string().default("bmkg").nullable().describe("Source of the weather data (bmkg)"),
                    lon: z.number().describe("Longitude of the location"),
                    lat: z.number().describe("Latitude of the location"),
                }),
                execute: async ({ source, lon, lat }) => {
                    try {
                        const weatherData = await weatherIntegration(lon, lat, source || "bmkg");
                        if (weatherData && weatherData.data) {
                            return ToonEncode({ weather: weatherData.data });
                        }
                        return ToonEncode({ error: "Weather data not found or invalid format", status: "error" });
                    } catch (error: any) {
                        return ToonEncode({ error: error.message || "Failed to fetch weather data", status: "error" });
                    }
                },
            }),
            find_location: tool({
                description: "Find the location of a address, use this tool if you dont know the exact location",
                parameters: z.object({
                    address: z.string().describe("Address to find the location for"),
                    limit: z.number().max(10).default(5).nullable().describe("Limit of the results"),
                }),
                execute: async ({ address, limit }) => {
                    const location = await searchPlaces(address, "EN-en", true);
                    const results = location.slice(0, limit || 5);
                    return ToonEncode({ location: results });
                },
            }),
            filter_layer: tool({
                description: "Filter the layers based on the given parameters",
                parameters: z.object({
                    layerType: z.string().default("all").nullable().describe("Type of layers to retrieve"),
                }),
                execute: async ({ layerType }) => {
                    const filteredLayers = filterLayerAttributes(layers, [
                        "id",
                        "name",
                        "description",
                        "map_service_url",
                        "map_service_layer_name",
                        "map_service_vendor",
                        "metadata.version",
                        "render_type",
                        "created_at",
                    ]);
                    return ToonEncode({ layers: filteredLayers });
                },
            }),
            perform_map_action: tool({
                description: "Perform a map action like flyTo, easeTo, toggleLayer, filterLayer, zoomToLayer ",
                parameters: z.object({
                    action: z.string().describe("Action to perform (flyTo, easeTo, toggleLayer, filterLayer, zoomToLayer"),
                    parameters: z.object({
                        center: z.tuple([z.number(), z.number()]).optional().describe("Center of the map"),
                        zoom: z.number().optional().describe("Zoom level"),
                        pitch: z.number().optional().describe("Pitch of the map"),
                        bearing: z.number().optional().describe("Bearing of the map"),
                        duration: z.number().optional().describe("Duration of the animation"),
                        bbox: z.array(z.number()).optional().describe("Bounding box of the map [minLongitude, minLatitude, maxLongitude, maxLatitude]"),
                        padding: z.number().optional().describe("Padding of the map"),
                        layerId: z.string().optional().describe("ID of the layer, required if layerName is not provided"),
                        layerName: z.string().optional().describe("Name of the layer, required if layerId is not provided"),
                        filter: z.array(z.string()).optional().describe("Filter for the layer it can be Mapbox Expression or CQL Expression. Check if the layer is GeoJSON or GeoServer or ArcGIS from map_service_vendor. if it is GeoJSON, use Mapbox Expression. if it is GeoServer, use CQL Expression. If it is ArcGIS, use CQL Expression"),
                        map_service_vendor: z.string().optional().describe("Vendor of the map service it can be Null, Geoserver, ArcGIS, GeoJSON, XYZ, Image, Text, Icon"),
                        visible: z.boolean().optional().describe("Visibility of the layer, required if action is toggleLayer"),
                    }).optional().describe("Parameters for the action"),
                }),
                execute: async ({ action, parameters }) => {
                    return ToonEncode({ action, parameters, status: "success" });
                },
            }),
        }
    }
    return tools[section ?? "map"];
}

export default callTools;