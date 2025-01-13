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
    const traverseWorkflow = (nodeId: string, prevOutput = null): any => {
        const node = nodeMap[nodeId];
        if (!node) return null;

        // Masukkan output dari node sebelumnya sebagai input
        node.data.input = prevOutput;

        // Proses data berdasarkan action
        let output = null;
        output = processActions(node.data.action)

        console.log("output: ", output)

        // Simpan output ke node
        node.data.output = output;

        // Cari node berikutnya
        const nextEdge = edges.find((edge) => edge.source === nodeId);
        if (nextEdge) {
            return {
                action: node.data.action,
                input: node.data.input,
                output: node.data.output,
                next: traverseWorkflow(nextEdge.target, output),
            };
        }

        return {
            action: node.data.action,
            input: node.data.input,
            output: node.data.output,
        };
    };

    console.log("Transverse :", traverseWorkflow(startNode.id))

    return traverseWorkflow(startNode.id);
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

export {
    convertToWorkflow
}
