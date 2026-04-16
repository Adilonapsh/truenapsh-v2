import { useMapStore } from "@/stores/map";
import { evaluateExpression } from "@/tools/expression-evaluator";
import { HttpRequest } from "@/types/actions.types";
import { downloadAsJsonFile, downloadAsTextFile } from "@/tools/file-download";
import {
    addGeojsonToMap,
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
    runCode,
    buildingLayers,
    elevationLayers
} from "@/tools/map-tools";
import useLayerStore from "@/stores/layer";
import { v4 } from "uuid";

const getValueByPath = (obj: any, path: string) => {
    if (!path || !obj) return undefined;
    const parts = path.split(/\.|\b(?=\[)/).filter(Boolean);
    let current = obj;
    for (const part of parts) {
        if (current === null || current === undefined) return undefined;
        if (part.startsWith('[') && part.endsWith(']')) {
            const key = part.slice(1, -1).replace(/['"]/g, '');
            current = current[key];
        } else {
            const key = part.startsWith('.') ? part.slice(1) : part;
            current = current[key];
        }
    }
    return current;
};

const setValueByPath = (obj: any, path: string, value: any) => {
    if (!path || !obj) return;
    const parts = path.split(/\.|\b(?=\[)/).filter(Boolean);
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        let key = part;
        if (part.startsWith('[') && part.endsWith(']')) {
             key = part.slice(1, -1).replace(/['"]/g, '');
        } else if (part.startsWith('.')) {
            key = part.slice(1);
        }

        if (current[key] === undefined) {
            current[key] = {};
        }
        current = current[key];
    }
    const lastPart = parts[parts.length - 1];
    let lastKey = lastPart;
    if (lastPart.startsWith('[') && lastPart.endsWith(']')) {
        lastKey = lastPart.slice(1, -1).replace(/['"]/g, '');
    } else if (lastPart.startsWith('.')) {
        lastKey = lastPart.slice(1);
    }
    current[lastKey] = value;
};

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
                let layerData: any = layer;

                // Attempt to fetch source data from map
                const mapRef = useMapStore.getState().map;
                const map = mapRef?.current?.getMap();
                if (map) {
                    const mapLayer = map.getLayer(layer.id);
                    const sourceId = (mapLayer as any)?.source || layer.id.split('-')[0];
                    const source = map.getSource(sourceId);

                    if (source) {
                        const sourceConfig = (source as any).serialize();
                        let data = sourceConfig?.data || sourceConfig;

                        // Specifically handle GeoJSON if we have internal _data (often more up-to-date)
                        if (source.type === 'geojson') {
                            data = (source as any)._data || sourceConfig?.data;
                        }

                        // If it's a URL/string, handle it
                        if (typeof data === 'string' && (data.startsWith('http') || data.startsWith('/'))) {
                            if (source.type === 'geojson') {
                                try {
                                    const resp = await fetch(data);
                                    data = await resp.json();
                                } catch (e) {
                                    console.error("Failed to fetch GeoJSON from source URL", e);
                                }
                            }
                        }
                        layerData = data;
                    }
                }

                output = { data: layerData, layer, ...metadata };
                break;
            }

            output = { data: layers, ...metadata };
            break;
        }
        case "map": {
            const mapRef = useMapStore.getState().map;
            const map = mapRef?.current?.getMap();
            let mapResult = input;

            if (map && map.isStyleLoaded()) {
                switch (metadata?.type) {
                    case "get_layers": {
                        const style = map.getStyle();
                        const allLayers = style?.layers;
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
                        mapResult = metadata["layer-id"] ? map.getLayer(metadata["layer-id"]) : null;
                        break;
                    case "add_layer": {
                        const geojsonData = metadata["geojson"]
                            ? (typeof metadata["geojson"] === "string" ? JSON.parse(metadata["geojson"]) : metadata["geojson"])
                            : input;

                        if (geojsonData) {
                            await addGeojsonToMap({
                                mapRef: useMapStore.getState().map,
                                layerName: metadata["layer-name"] || metadata["layer-id"] || "Node Layer",
                                data: geojsonData
                            });
                            mapResult = { status: "success", layer: metadata["layer-name"] || "Node Layer" };
                        } else {
                            mapResult = { status: "error", message: "No GeoJSON data provided" };
                        }
                        break;
                    }
                    case "get_sources":
                        mapResult = map.getStyle()?.sources;
                        break;
                    case "get_styles":
                        mapResult = map.getStyle();
                        break;
                    case "filter":
                        if (metadata["layer-id"] && metadata["filter"] && map.getLayer(metadata["layer-id"])) {
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
                mapResult = {
                    status: "error",
                    message: !map ? "Map instance not found" : "Map style is still loading. Please wait."
                };
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
        case "js-code":
            if (metadata?.code) {
                try {
                    const result = await runCode(metadata.code, input, nodesContext);
                    output = { data: result, ...metadata };
                } catch (error: any) {
                    output = { data: `JS Code Error: ${error.message}`, ...metadata };
                }
            } else {
                output = { data: 'Missing JavaScript code', ...metadata };
            }
            break;
        case "forloop": {
            const items = Array.isArray(input) ? input : (input?.features || [input]);
            output = { data: items, ...metadata };
            break;
        }
        case "select": {
            const fieldsMetadata = metadata.fields;
            const fields = Array.isArray(fieldsMetadata)
                ? fieldsMetadata.filter((f: any) => f.checked).map((f: any) => f.text.trim()).filter(Boolean)
                : (metadata.data || "").split(",").map((f: string) => f.trim()).filter(Boolean);

            const items = input?.features || (Array.isArray(input) ? input : (input ? [input] : []));

            if (items.length > 0) {
                const selected = items.map((item: any) => {
                    const newItem: any = {};
                    const props = item.properties || item;
                    fields.forEach((field: string) => {
                        const val = getValueByPath(props, field);
                        if (val !== undefined) {
                            setValueByPath(newItem, field, val);
                        }
                    });
                    return item.properties ? { ...item, properties: newItem } : newItem;
                });
                output = { data: input?.features ? { ...input, features: selected } : selected, ...metadata };
            } else {
                output = { data: input, ...metadata };
            }
            break;
        }
        case "order-by": {
            const sortsMetadata = metadata.sorts;
            const sorts = Array.isArray(sortsMetadata)
                ? sortsMetadata.filter((s: any) => s.checked).map((s: any) => ({ field: s.text.trim(), order: s.extra === "Descending" ? -1 : 1 }))
                : [{ field: metadata.data, order: metadata.order === "Descending" ? -1 : 1 }];

            const items = input?.features ? [...input.features] : (Array.isArray(input) ? [...input] : null);

            if (items) {
                items.sort((a: any, b: any) => {
                    for (const sort of sorts) {
                        const valA = getValueByPath(a.properties || a, sort.field);
                        const valB = getValueByPath(b.properties || b, sort.field);
                        if (valA < valB) return -1 * sort.order;
                        if (valA > valB) return 1 * sort.order;
                    }
                    return 0;
                });
                output = { data: input?.features ? { ...input, features: items } : items, ...metadata };
            } else {
                output = { data: input, ...metadata };
            }
            break;
        }
        case "limit": {
            const limit = Number(metadata.limit);
            if (input?.features) {
                output = { data: { ...input, features: input.features.slice(0, limit) }, ...metadata };
            } else if (Array.isArray(input)) {
                output = { data: input.slice(0, limit), ...metadata };
            } else {
                output = { data: input, ...metadata };
            }
            break;
        }
        case "filter": {
            const filterExpr = metadata.filter;
            const filterFn = (item: any) => {
                const result = evaluateExpression(filterExpr, { input: item, nodes: nodesContext });
                return result === true || result === "true";
            };

            if (input?.features && filterExpr) {
                output = { data: { ...input, features: input.features.filter(filterFn) }, ...metadata };
            } else if (Array.isArray(input) && filterExpr) {
                output = { data: input.filter(filterFn), ...metadata };
            } else {
                output = { data: input, ...metadata };
            }
            break;
        }
        case "join": {
            const otherData = (metadata.join && typeof metadata.join === 'object' && 'data' in metadata.join)
                ? metadata.join.data
                : metadata.join;

            const itemsA = input?.features || (Array.isArray(input) ? input : [input]);
            const itemsB = otherData?.features || (Array.isArray(otherData) ? otherData : [otherData]);

            if (Array.isArray(itemsA) && Array.isArray(itemsB)) {
                const joined = itemsA.map((item, index) => {
                    const otherItem = itemsB[index] || {};
                    if (item.properties && otherItem.properties) {
                        return { ...item, properties: { ...item.properties, ...otherItem.properties } };
                    }
                    return { ...item, ...(otherItem || {}) };
                });

                if (input?.features) {
                    output = { data: { ...input, features: joined }, ...metadata };
                } else {
                    output = { data: joined, ...metadata };
                }
            } else {
                output = { data: { left: input, right: otherData }, ...metadata };
            }
            break;
        }
        case "group-by": {
            const fieldsMetadata = metadata.fields;
            const fields = Array.isArray(fieldsMetadata)
                ? fieldsMetadata.filter((f: any) => f.checked).map((f: any) => f.text.trim()).filter(Boolean)
                : (metadata.group ? [metadata.group.trim()] : []);

            const items = input?.features || (Array.isArray(input) ? input : null);

            if (items && fields.length > 0) {
                const groups = items.reduce((acc: any, item: any) => {
                    const values = fields.map(field => {
                        return getValueByPath(item.properties || item, field);
                    });
                    const key = values.join('|') || "undefined";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {});
                output = { data: groups, ...metadata };
            } else {
                output = { data: input, ...metadata };
            }
            break;
        }
        case "count":
            output = {
                data: Array.isArray(input)
                    ? input.length
                    : (input?.features ? input.features.length : (input ? 1 : 0)),
                ...metadata
            };
            break;
        case "ifelse": {
            const result = evaluateExpression(metadata.condition, { input, nodes: nodesContext });
            const isTrue = result === true || result === "true" || result === 1 || result === "1";
            output = { data: input, ...metadata, _conditionResult: isTrue };
            break;
        }
        case "switch": {
            const mode = metadata.mode || "Rules";
            let branchIndex = -1;

            if (mode === "Rules") {
                const rules = metadata.rules || [];
                for (let i = 0; i < rules.length; i++) {
                    const rule = rules[i];
                    // Support both variable paths and expressions
                    const left = rule.condition.includes("{{")
                        ? evaluateExpression(rule.condition, { input, nodes: nodesContext })
                        : getValueByPath({ data: input, nodes: nodesContext }, rule.condition.replace("$nodes", "nodes"));

                    const right = rule.value;
                    const op = rule.operator;

                    let match = false;
                    switch (op) {
                        case "==": match = String(left) == String(right); break;
                        case "!=": match = String(left) != String(right); break;
                        case ">": match = Number(left) > Number(right); break;
                        case "<": match = Number(left) < Number(right); break;
                        case "contains": match = String(left).includes(String(right)); break;
                        case "regex": match = new RegExp(String(right)).test(String(left)); break;
                    }

                    if (match) {
                        branchIndex = i;
                        break;
                    }
                }
            } else {
                const expr = metadata.expression;
                const result = evaluateExpression(expr, { input, nodes: nodesContext });
                branchIndex = parseInt(String(result));
            }

            output = { data: input, ...metadata, _branchIndex: branchIndex };
            break;
        }
        case "while":
            output = { data: input, ...metadata };
            break;
        case "switch": {
            const val = metadata.expression;
            output = { data: val, ...metadata };
            break;
        }
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