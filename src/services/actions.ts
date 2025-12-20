import { HttpRequest } from "@/types/actions.types";
import { downloadAsJsonFile, downloadAsTextFile } from "@/tools/file-download";

const httpRequestsAction = async (params: HttpRequest) => {
    console.log(params);
    const result = fetch(params.url, {
        method: params.method,
        headers: params.headers,
        body: params.body ? JSON.stringify(params.body) : undefined,
    });
    return result;
}

const processActions = async (action: string, input: any, metadata: any) => {
    let output = null;
    switch (action) {
        case "import":
            output = "Import data";
            break;
        case "export":
            if (metadata?.type === 'JSON') {
                downloadAsJsonFile(input, `${metadata?.name}.json`);
            } else if (metadata.type === "Text") {
                downloadAsTextFile(input, `${metadata?.name}.txt`);
            }
            output = null;
            break;
        case "map":
            output = input;
            break;
        case "database":
            output = `Database action on: ${JSON.stringify(input)}`;
            break;
        case "analytics":
            output = `Analytics result of: ${JSON.stringify(input)}`;
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
                    output = await response.json();
                } catch (error: any) {
                    output = `Error: ${error.message}`;
                }
            } else {
                output = 'Missing URL or method in metadata';
            }
            break;
        case "forloop":
            output = input;
            break;
        case "select":
            output = `Selected: ${JSON.stringify(input)}`;
            break;
        case "order-by":
            output = `Ordered: ${JSON.stringify(input)}`;
            break;
        case "limit":
            output = `Limited: ${JSON.stringify(input)}`;
            break;
        case "filter":
            output = `Filtered: ${JSON.stringify(input)}`;
            break;
        case "join":
            output = `Joined: ${JSON.stringify(input)}`;
            break;
        case "group-by":
            output = `Grouped: ${JSON.stringify(input)}`;
            break;
        case "count":
            output = `Counted: ${JSON.stringify(input)}`;
            break;
        // --- tambahan baru ---
        case "ifelse":
            output = `IfElse evaluated: ${JSON.stringify(input)}`;
            break;
        case "while":
            output = `While loop processed: ${JSON.stringify(input)}`;
            break;
        case "switch":
            output = `Switch processed: ${JSON.stringify(input)}`;
            break;
        case "boundary":
            output = `Boundary computed: ${JSON.stringify(input)}`;
            break;
        case "buffer":
            output = `Buffer applied: ${JSON.stringify(input)}`;
            break;
        case "clip":
            output = `Clipped: ${JSON.stringify(input)}`;
            break;
        case "difference":
            output = `Difference computed: ${JSON.stringify(input)}`;
            break;
        case "intersection":
            output = `Intersection computed: ${JSON.stringify(input)}`;
            break;
        case "centroid":
            output = `Centroid computed: ${JSON.stringify(input)}`;
            break;
        case "lines-to-polygon":
            output = `Lines converted to polygon: ${JSON.stringify(input)}`;
            break;
        case "polygon-to-lines":
            output = `Polygon converted to lines: ${JSON.stringify(input)}`;
            break;
        case "remove-duplicates":
            output = `Duplicates removed: ${JSON.stringify(input)}`;
            break;
        case "generate-points":
            output = `Points generated along line: ${JSON.stringify(input)}`;
            break;
        case "simplify":
            output = `Geometry simplified: ${JSON.stringify(input)}`;
            break;
        case "hexagon-grid":
            output = `Hexagon grid created: ${JSON.stringify(input)}`;
            break;
        case "building":
            output = `Building data processed: ${JSON.stringify(input)}`;
            break;
        case "elevation":
            output = `Elevation data processed: ${JSON.stringify(input)}`;
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