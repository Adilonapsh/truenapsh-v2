function convertToWorkflow(nodes: any[], edges: any[]) {
    // Buat map node berdasarkan ID
    const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));
    console.log("Node Map : ", nodeMap)

    // Temukan node awal
    const startNode = nodes.find(
        (node) => !edges.some((edge) => edge.target === node.id)
    );

    console.log("Start Node : ", startNode);
    // Rekursi untuk membangun workflow
    const traverseWorkflow = (nodeId, edges, nodes, prevOutput = null) => {
        const node = nodes.find((node) => node.id === nodeId);
        if (!node) return null;

        // Masukkan output dari node sebelumnya sebagai input
        node.data.input = prevOutput;

        // Proses data berdasarkan action
        const output = processActions(node.data.action);
        console.log(output);

        // Simpan output ke node
        node.data.output = output;

        // Periksa apakah node ini bercabang
        const isBranched = isNodeBranched(nodeId, edges);

        // Ambil semua cabang
        const branches = getBranches(nodeId, edges);

        // Traversal untuk semua cabang (jika bercabang)
        const next = branches.map((targetId) =>
            traverseWorkflow(targetId, edges, nodes, output)
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


const processActions = (action: string) => {
    let output = null;
    switch (action) {
        case "import":
            output = "Import data";
            break;
        case "export":
            output = "Export data";
            break;
        case "map":
            output = "Map data";
            break;
        case "database":
            output = "Database action";
            break;
        case "analytics":
            output = "Analytics action";
            break;
        case "http-request":
            output = "Analytics action";
            break;
        case "select":
            output = "Select data";
            break;
        case "order-by":
            output = "Order data";
            break;
        case "limit":
            output = "Limit data";
            break;
        case "filter":
            output = "Filter data";
            break;
        case "join":
            output = "Join data";
            break;
        case "group-by":
            output = "Group data";
            break;
        case "count":
            output = "Count data";
            break;
        default:
            output = "default";
    }
    return output;
}

const isNodeBranched = (nodeId, edges) => {
    // Hitung jumlah edges yang memiliki source sesuai nodeId
    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    return outgoingEdges.length > 1; // True jika lebih dari 1 edge
};

// Fungsi untuk mengambil semua cabang dari sebuah node
const getBranches = (nodeId, edges) => {
    // Ambil semua target node yang terhubung dari source nodeId
    return edges
        .filter((edge) => edge.source === nodeId)
        .map((edge) => edge.target);
};


export {
    convertToWorkflow
}
