import { Edge, Node } from "@xyflow/react";
import { downloadAsJsonFile, downloadAsTextFile } from "./file-download";

const convertToWorkflow = (nodes: any[], edges: any[]) => {
    // Buat map node berdasarkan ID
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    // console.log("Node Map : ", nodeMap);

    // Temukan node awal (node yang tidak memiliki `target` dalam `edges`)
    const startNode = nodes.find(
        (node) => !edges.some((edge) => edge.target === node.id)
    );

    // console.log("Start Node : ", startNode);

    // Rekursi untuk membangun workflow
    const traverseWorkflow = async (nodeId: string, edges: Edge[], nodes: Node[], prevOutput = null) => {
        const node = nodes.find((node) => node.id === nodeId);
        if (!node) return null;

        // Jika node memiliki input, gunakan `prevOutput` sebagai nilai input
        node.data.input = prevOutput || node.data.input;

        // Proses data berdasarkan action
        let output: any = null;
        if ((node.data.state as { is_enabled?: boolean })?.is_enabled) {
            output = await processActions(
                node.data.action as string,
                node.data.input,
                node.data.parameters
            );
            console.log(`Processing Node (${node.id}):`, { input: node.data.input, output });

            // Simpan output ke node
            node.data.output = output;
        } else {
            // Node disabled: langsung teruskan input/prevOutput ke node berikutnya
            console.log(`Node (${node.id}) is disabled, skipping processing.`);
            output = node.data.input;
            node.data.output = output;
        }

        // Periksa apakah node ini bercabang
        const isBranched = isNodeBranched(nodeId, edges);

        // Ambil semua cabang (next nodes)
        const branches = getBranches(nodeId, edges);

        // Traversal untuk semua cabang (jika bercabang)
        const next = await Promise.all(
            branches.map((targetId: string) =>
                traverseWorkflow(targetId, edges, nodes, output)
            )
        );


        return {
            id: node.id,
            action: node.data.action,
            input: node.data.input,
            output: node.data.output,
            branched: isBranched,
            next: next.length > 0 ? next : null,
        };
    };

    return traverseWorkflow(startNode.id, edges, nodes);
}

// Proses data berdasarkan action dan input dari node sebelumnya
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
                    const response = await fetch(metadata.url, {
                        method: metadata.method,
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: metadata.method !== 'GET' ? JSON.stringify(input) : undefined
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

// Cek apakah node memiliki banyak cabang
const isNodeBranched = (nodeId: string, edges: Edge[]) => {
    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    return outgoingEdges.length > 1; // True jika lebih dari 1 edge (cabang)
};

// Ambil semua node yang bercabang dari sebuah node
const getBranches = (nodeId: string, edges: any) => {
    return edges
        .filter((edge: Edge) => edge.source === nodeId)
        .map((edge: Edge) => edge.target);
};


export {
    convertToWorkflow
};

