import { Edge, Node } from "@xyflow/react";
import { processActions } from "@/services/actions";

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
                node.data.parameters,
                nodes
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

