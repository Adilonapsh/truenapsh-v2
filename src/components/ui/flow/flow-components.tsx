/* eslint-disable */
'use client'

import {
    addEdge,
    Background,
    BackgroundVariant,
    ConnectionLineType,
    Controls,
    MiniMap,
    Node,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    XYPosition,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { DragEvent, useCallback, useRef, useState } from 'react'
import { nodeTypes } from './custom-nodes'
import { WidgetNode } from './widget-node'

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { convertToWorkflow } from '@/tools/flow-tools'
import { SaveIcon, StopCircle, Trash2Icon } from 'lucide-react'
import { MdElectricBolt } from 'react-icons/md'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '../button'
import SettingActions from './settings-actions'
import { useTheme } from 'next-themes'
import { ColorMode } from '@xyflow/system'


// const nodeTypes = {
//     import: ImportNode,
//     export: ExportNode,
//     map: MapNode,
//     database: DatabaseNode,
//     filter: FilterNode,
//     analytics: AnalyticsNode,
// }
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'import',
        data: {
            label: 'Import Data',
            desc: "",
            is_loading: true,
            action: "import",
            metadata: {}
        },
        position: { x: 250, y: 25 },
    },
];

export default function FlowDiagramWithDraggableNodes() {
    return (
        <ReactFlowProvider>
            <FlowDiagram />
        </ReactFlowProvider>
    )
}

function FlowDiagram() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [rfInstance, setRfInstance] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const reactFlowInstance = useReactFlow();
    const { theme } = useTheme();
    // const { getIntersectingNodes } = useReactFlow();

    // ONE NODE
    const duplicateNode = useCallback((nodeId: string) => {
        setNodes((nds) => {
            const nodeToClone = nds.find((n) => n.id === nodeId);
            console.log("old Node", nodeToClone);
            if (!nodeToClone) return nds;
            const id = uuidv4();
            const newNode = {
                ...nodeToClone,
                id: id,
                position: {
                    x: nodeToClone.position.x + 50,
                    y: nodeToClone.position.y + 50,
                },
                data: {
                    ...nodeToClone.data,
                    label: `${nodeToClone.data.label}`,
                    is_loading: false,
                    onDuplicateNode: () => duplicateNode(id),
                    onDeleteNode: () => deleteNode(id),
                    onRunNode: () => runNode(id),
                },
            };

            console.log("Duplicated", newNode);

            return [...nds, newNode];
        });
    }, [setNodes]);

    const deleteNode = useCallback((nodeId: string) => {
        console.log("Ini Node ID", nodeId);
        setNodes((nds) => nds.filter((node) => node.id !== nodeId));
        setEdges((eds) => eds.filter((edge: { source: string; target: string }) => edge.source !== nodeId && edge.target !== nodeId));
    }, [setNodes, setEdges]);

    const runNode = useCallback((nodeId: string) => {
        console.log("Run", nodeId);
        const node = nodes.find((n) => n.id === nodeId);
        if (node) {
            console.log(`Running node ${nodeId}:`, node.data);
            alert(`Node ${nodeId} (${node.data.label}) is running!`);
        }
    }, [nodes]);

    // END ONE NODE


    const onConnect = useCallback(
        (params: any) => setEdges((eds: any) => addEdge({ ...params, type: 'smoothstep' }, eds)),
        [setEdges]
    )

    const onDragOver = useCallback((event: DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event: DragEvent) => {

            event.preventDefault()
            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect()
            const type = event.dataTransfer.getData('application/reactflow')
            const nodeData = JSON.parse(event.dataTransfer.getData('application/nodedata'));
            if (typeof type === 'undefined' || !type || !reactFlowBounds) {
                return
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            })


            let newNode: Node;
            if (type === 'group-node') {
                newNode = {
                    id: `group-node-${uuidv4()}`,
                    type,
                    position,
                    data: {
                        label: `${nodeData.label.charAt(0).toUpperCase() + type.slice(1)}`,
                        desc: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
                        onGroupNameChange: (newName: string) => {
                            setNodes((nds) =>
                                nds.map((node) =>
                                    node.id === newNode.id
                                        ? { ...node, data: { ...node.data, label: newName } }
                                        : node
                                )
                            );
                        },
                        metadata: {},
                    },
                    style: {
                        width: 400,
                        height: 300,
                    },
                    zIndex: 0,
                };
            } else {
                const id = uuidv4();
                newNode = {
                    id,
                    type,
                    position,
                    data: {
                        label: `${nodeData.label}`,
                        desc: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
                        action: nodeData.action,
                        onDuplicateNode: () => duplicateNode(id),
                        onDeleteNode: () => deleteNode(id),
                        onRunNode: () => runNode(id),
                        metadata: {},
                        is_loading: false,

                    },
                    zIndex: 1,
                };
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [reactFlowInstance, setNodes]
    )

    const onSave = useCallback(() => {
        if (rfInstance) {
            const flow = (rfInstance as any).toObject();
            // localStorage.setItem(flowKey, JSON.stringify(flow));
        }
    }, [rfInstance]);

    const onRun = async () => {
        setIsRunning((prevIsRunning) => !prevIsRunning);
        if (rfInstance) {
            const flow = (rfInstance as any).toObject();
            if (isRunning) {
                const workflow = await convertToWorkflow(flow.nodes, flow.edges);
                console.log(workflow);
                setEdges((eds: any[]) => eds.map((edge) => ({ ...edge, animated: true })));
                flow.edges.forEach((elem: { id: string }, index: number) => {
                    setTimeout(() => {
                        setEdges((eds) =>
                            eds.map((edge) =>
                                edge.id === elem.id ? { ...edge, animated: false } : edge
                            )
                        );
                    }, 5000 * (index + 1));
                });
            }
        }
    };

    const onDragStart = (event: DragEvent, nodeType: string, nodeData: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.setData('application/nodedata', JSON.stringify(nodeData))
        event.dataTransfer.effectAllowed = 'move'
    }

    const onNodeDrag = useCallback((_: MouseEvent, node: Node) => {
        // const intersections = getIntersectingNodes(node).map((n) => n.id);
        // setNodes((ns) => {
        //     const updatedNodes = ns.map((n) => {
        //         console.log(intersections.find((id) => ns.find((n) => n.id === id)));
        //         return ({
        //             ...n,
        //             // parentId: intersections.find((id) => ns.find((n) => n.id === id)?.type === 'group-node'),
        //             className: intersections.includes(n.id) ? 'highlight' : '',
        //         });
        //     });
        //     console.log('Updated nodes:', ns);
        //     console.log(intersections);
        //     return updatedNodes;
        // });
    }, []);

    const updateNodePosition = (nodeToUpdate: Node, newPosition: XYPosition, newParent?: string) => {
        setNodes((prevNodes) =>
            prevNodes.map((n) =>
                n.id === nodeToUpdate.id
                    ? {
                        ...n,
                        position: newPosition,
                        parentNode: newParent,
                        extent: newParent ? 'parent' : undefined,
                        zIndex: n.type === 'group-node' ? 0 : 1,
                    }
                    : n
            )
        );
    };

    const onNodeDragStop = useCallback((event: MouseEvent, node: Node, allNodes: Node[]) => {
        const groups = allNodes.filter((n) => n.type === 'group-node');
        let newParentGroup = null;

        for (const group of groups) {
            if (group.id === node.id) continue;

            const groupBounds = {
                left: group.position.x,
                right: group.position.x + (group.style?.width as number || 0),
                top: group.position.y,
                bottom: group.position.y + (group.style?.height as number || 0),
            };

            const nodeCenter = {
                x: node.position.x + (node.width || 0) / 2,
                y: node.position.y + (node.height || 0) / 2,
            };

            if (
                nodeCenter.x >= groupBounds.left &&
                nodeCenter.x <= groupBounds.right &&
                nodeCenter.y >= groupBounds.top &&
                nodeCenter.y <= groupBounds.bottom
            ) {
                newParentGroup = group;
                break;
            }
        }

        if (newParentGroup) {
            const newPosition = {
                x: node.position.x - newParentGroup.position.x,
                y: node.position.y - newParentGroup.position.y,
            };
            updateNodePosition(node, newPosition, newParentGroup.id);
        } else if (node.parentId) {
            // If the node was in a group but is now outside, update its position to absolute coordinates
            const parentNode = allNodes.find((n) => n.id === node.parentId);
            if (parentNode) {
                const newPosition = {
                    x: parentNode.position.x + node.position.x,
                    y: parentNode.position.y + node.position.y,
                };
                updateNodePosition(node, newPosition);
            }
        }
    }, [setNodes]);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node)
    }, [])

    const updateNodeProperties = useCallback((data: object) => {
        if (selectedNode) {
            setNodes((nds) =>
                nds.map((node) => {
                    if (node.id === selectedNode.id) {
                        return { ...node, data: { ...node.data, ...data } }
                    }
                    return node
                })
            )
            setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null)
        }
    }, [selectedNode, setNodes])

    const deleteNodes = useCallback(() => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
            setEdges((eds) => eds.filter((edge: { source: string; target: string }) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
            setSelectedNode(null)
        }
    }, [selectedNode, setNodes, setEdges])



    return (
        <div className="relative flex h-full">
            <div className="w-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeDrag={(event: React.MouseEvent, node: Node) => onNodeDrag(event as unknown as MouseEvent, node)}
                    onNodeDragStop={(event: React.MouseEvent, node: Node, allNodes: Node[]) => onNodeDragStop(event as unknown as MouseEvent, node, allNodes)}
                    onInit={(instance: any) => setRfInstance(instance)}
                    onConnect={onConnect}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                    colorMode={theme as ColorMode}
                >
                    <Background variant={BackgroundVariant.Dots} />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
            <div className='absolute'>
                <div className="w-80 p-4">
                    <Tabs defaultValue="component" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 border border-gray-200">
                            <TabsTrigger value="component">Component</TabsTrigger>
                            <TabsTrigger value="node_info">Node Info</TabsTrigger>
                        </TabsList>
                        <TabsContent value="component">
                            <Card>
                                <CardContent className="">
                                    <WidgetNode onDragStart={onDragStart} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="node_info">
                            <Card>
                                <CardContent className="mt-5">
                                    {selectedNode && (
                                        <div>
                                            <div className='flex justify-between items-center'>
                                                <h3 className="text-xs font-semibold">Node Properties</h3>
                                                <button onClick={deleteNodes} className="text-red-500 hover:text-red-700">
                                                    <Trash2Icon size={15} />
                                                </button>
                                            </div>
                                            <SettingActions
                                                selectedNode={selectedNode}
                                                updateNodeProperties={updateNodeProperties}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
            <div className='absolute right-0 text-black'>
                <div className='flex gap-2'>
                    <Button variant={"outline"} onClick={onSave} className='text-foreground'><SaveIcon /> Save</Button>
                    <Button variant={"outline"} onClick={onRun} className='text-foreground'>
                        {
                            isRunning ? (
                                <span className='flex items-center gap-1'>
                                    <StopCircle /> Stop
                                </span>) : (
                                <span className='flex items-center gap-1'>
                                    <MdElectricBolt /> Run
                                </span>)
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}

