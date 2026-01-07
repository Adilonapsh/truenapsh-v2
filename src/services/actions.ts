import { useMapStore } from "@/stores/map";
import { evaluateExpression } from "@/tools/expression-evaluator";
import { HttpRequest } from "@/types/actions.types";
import { downloadAsJsonFile, downloadAsTextFile } from "@/tools/file-download";
import {
    bufferLayers,
    bboxPolygonLayers,
    clipLayers,
    differenceLayers,
    centroidLayers,
    polygonToLinesLayers,
    linesToPolygonLayers,
    removeDuplicatesLayers,
    hexagonLayer,
    intersectionLayers,
    simplifyLayers,
    pointAlongLinesLayers,
    buildingLayers,
    elevationLayers
} from "@/tools/map-tools";
import useLayerStore from "@/stores/layer";
import { v4 } from "uuid";

const httpRequestsAction = async (params: HttpRequest) => {
    console.log(params);
    const result = fetch(params.url, {
        method: params.method,
        headers: params.headers,
        body: params.body ? JSON.stringify(params.body) : undefined,
    });
    return result;
}

const processActions = async (action: string, initialInput: any, metadata: any, allNodes: any[] = []) => {
    // Smart Unwrapping: if input is structured { data, ... }, extract data
    const input = (initialInput && typeof initialInput === 'object' && 'data' in initialInput)
        ? initialInput.data
        : initialInput;

    const nodesContext = (allNodes || []).reduce((acc, node) => {
        if (node.id && node.data?.output) {
            acc[node.id] = node.data.output;
        }
        return acc;
    }, {} as Record<string, any>);

    // Evaluate expressions in metadata
    if (metadata?._expressions) {
        const evaluatedMetadata = { ...metadata };
        for (const [key, isExpression] of Object.entries(metadata._expressions)) {
            if (isExpression && typeof metadata[key] === 'string') {
                evaluatedMetadata[key] = evaluateExpression(metadata[key], { input, nodes: nodesContext });
            }
        }
        metadata = evaluatedMetadata;
    }

    let output = null;
    switch (action) {
        case "import":
            output = { data: "Import data", ...metadata };
            break;
        case "export":
            if (metadata?.type === 'JSON') {
                downloadAsJsonFile(input, `${metadata?.name}.json`);
            } else if (metadata.type === "Text") {
                downloadAsTextFile(input, `${metadata?.name}.txt`);
            }
            output = { data: null, ...metadata };
            break;
        case "layer": {
            const layers = useLayerStore.getState().layers;
            const layer = layers.find((l: any) => l.id === metadata['layer-input']);
            if (layer) {
                output = { data: layer, ...metadata };
                break;
            }

            output = { data: layers, ...metadata };
            break;
        }
        case "map": {
            const mapRef = useMapStore.getState().map;
            const map = mapRef?.current?.getMap();
            let mapResult = input;

            if (map) {
                switch (metadata?.type) {
                    case "get_layers": {
                        const allLayers = map.getStyle()?.layers;
                        const targetLayerId = metadata["layer-id"];
                        if (targetLayerId) {
                            const ids = targetLayerId.split(",").map((s: string) => s.trim());
                            mapResult = allLayers?.filter((l: any) => ids.includes(l.id));
                        } else {
                            mapResult = allLayers;
                        }
                        break;
                    }
                    case "get_layer":
                        mapResult = map.getLayer(metadata["layer-id"]);
                        break;
                    case "add_layer":
                        const geojson = metadata["geojson"];
                        const id = v4();
                        map.addSource(id, {
                            type: "geojson",
                            data: geojson,
                        });
                        mapResult = map.addLayer({
                            id,
                            source: id,
                            type: "fill",
                            paint: {
                                "fill-color": "#0080ff",
                                "fill-opacity": 0.5,
                            },
                        });
                        break;
                    case "get_sources":
                        mapResult = map.getStyle()?.sources;
                        break;
                    case "get_styles":
                        mapResult = map.getStyle();
                        break;
                    case "filter":
                        if (metadata["layer-id"] && metadata["filter"]) {
                            try {
                                const filterJson = typeof metadata["filter"] === "string"
                                    ? JSON.parse(metadata["filter"])
                                    : metadata["filter"];
                                map.setFilter(metadata["layer-id"], filterJson);
                                mapResult = { status: "success", layer: metadata["layer-id"], filter: filterJson };
                            } catch (e) {
                                mapResult = { status: "error", message: "Invalid filter JSON" };
                            }
                        }
                        break;
                    case "change_style":
                        if (metadata["style-url"] || metadata["expression"]) {
                            map.setStyle(metadata["style-url"] || metadata["expression"]);
                            mapResult = { status: "success", style: metadata["style-url"] || metadata["expression"] };
                        }
                        break;
                    case "change_source_data":
                        if (metadata["source-id"]) {
                            const source = map.getSource(metadata["source-id"]);
                            const dataToSet = metadata["data"]
                                ? (typeof metadata["data"] === "string" ? JSON.parse(metadata["data"]) : metadata["data"])
                                : input;

                            if (source && "setData" in source) {
                                (source as any).setData(dataToSet);
                                mapResult = { status: "success", source: metadata["source-id"], data: dataToSet };
                            } else {
                                mapResult = { status: "error", message: `Source ${metadata["source-id"]} not found or not a GeoJSON source` };
                            }
                        }
                        break;
                    default:
                        mapResult = input;
                }
            } else {
                mapResult = { status: "error", message: "Map instance not found" };
            }

            output = { data: mapResult, ...metadata };
            break;
        }
        case "database":
            output = { data: `Database action on: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "analytics":
            output = { data: `Analytics result of: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "http-request":
            if (metadata?.url && metadata?.method) {
                try {
                    const url = new URL(metadata.url);
                    if (metadata.send_query === "true" && Array.isArray(metadata.query_params)) {
                        metadata.query_params.forEach((p: any) => p.key && url.searchParams.append(p.key, p.value));
                    }

                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
                    if (metadata.send_headers === "true" && Array.isArray(metadata.headers)) {
                        metadata.headers.forEach((p: any) => {
                            headers[p.key] = p.value;
                        });
                    }

                    const response = await fetch(url.toString(), {
                        method: metadata.method,
                        headers,
                        body: metadata.method !== 'GET' ? JSON.stringify(input) : undefined,
                    });
                    output = { data: await response.json(), ...metadata };
                } catch (error: any) {
                    output = { data: `Error: ${error.message}`, ...metadata };
                }
            } else {
                output = { data: 'Missing URL or method in metadata', ...metadata };
            }
            break;
        case "webhook":
            if (metadata?.url && metadata?.method) {
                try {
                    const url = metadata.url;
                    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

                    // Convert payload from key-value-list to object
                    const payload: Record<string, any> = {};
                    if (Array.isArray(metadata.payload)) {
                        metadata.payload.forEach((p: any) => {
                            if (p.key) payload[p.key] = p.value;
                        });
                    }

                    const response = await fetch(url, {
                        method: metadata.method,
                        headers,
                        body: metadata.method !== 'GET' ? JSON.stringify(payload) : undefined,
                    });

                    const resData = await response.json();
                    output = { data: resData, ...metadata };
                } catch (error: any) {
                    output = { data: `Webhook Error: ${error.message}`, ...metadata };
                }
            } else {
                output = { data: 'Missing Webhook URL or Method', ...metadata };
            }
            break;
        case "forloop":
            output = { data: input, ...metadata };
            break;
        case "select":
            output = { data: `Selected: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "order-by":
            output = { data: `Ordered: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "limit":
            output = { data: `Limited: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "filter":
            output = { data: `Filtered: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "join":
            output = { data: `Joined: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "group-by":
            output = { data: `Grouped: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "count":
            output = { data: `Counted: ${JSON.stringify(input)}`, ...metadata };
            break;
        // --- tambahan baru ---
        case "ifelse":
            output = { data: `IfElse evaluated: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "while":
            output = { data: `While loop processed: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "switch":
            output = { data: `Switch processed: ${JSON.stringify(input)}`, ...metadata };
            break;
        case "boundary":
            output = {
                data: await bboxPolygonLayers(input),
                ...metadata
            };
            break;
        case "buffer": {
            const unit = (metadata?.unit || 'kilometers').toLowerCase();
            const turfUnit = unit.endsWith('s') ? unit : unit + 's';
            output = {
                data: await bufferLayers(input, Number(metadata?.buffer || 1), turfUnit as any),
                ...metadata
            };
            break;
        }
        case "clip":
            output = {
                data: await clipLayers(input, metadata?.clip_layer),
                ...metadata
            };
            break;
        case "difference":
            output = {
                data: await differenceLayers(input, metadata?.difference_layer),
                ...metadata
            };
            break;
        case "intersection":
            output = {
                data: await intersectionLayers(input, metadata?.intersection_layer),
                ...metadata
            };
            break;
        case "centroid":
            output = {
                data: await centroidLayers(input),
                ...metadata
            };
            break;
        case "lines-to-polygon":
            output = {
                data: await linesToPolygonLayers(input),
                ...metadata
            };
            break;
        case "polygon-to-lines":
            output = {
                data: await polygonToLinesLayers(input),
                ...metadata
            };
            break;
        case "remove-duplicates":
            output = {
                data: await removeDuplicatesLayers(input),
                ...metadata
            };
            break;
        case "generate-points": {
            const unit = (metadata?.unit || 'kilometers').toLowerCase();
            const turfUnit = unit.endsWith('s') ? unit : unit + 's';
            output = {
                data: await pointAlongLinesLayers(input, Number(metadata?.interval || 1), turfUnit as any),
                ...metadata
            };
            break;
        }
        case "simplify":
            output = {
                data: await simplifyLayers(input, Number(metadata?.tolerance || 0.01)),
                ...metadata
            };
            break;
        case "hexagon-grid": {
            const unit = (metadata?.unit || 'kilometers').toLowerCase();
            const turfUnit = unit.endsWith('s') ? unit : unit + 's';
            output = {
                data: await hexagonLayer(input, Number(metadata?.cell_side || 1), turfUnit as any),
                ...metadata
            };
            break;
        }
        case "building":
            output = {
                data: await buildingLayers(input),
                ...metadata
            };
            break;
        case "elevation":
            output = {
                data: await elevationLayers(input, metadata?.source || 'Open Elevation'),
                ...metadata
            };
            break;
        // --- akhir tambahan ---
        default:
            console.log(`Unknown action: ${action}`)
            output = "";
    }
    return output;
};

export {
    httpRequestsAction,
    processActions
}