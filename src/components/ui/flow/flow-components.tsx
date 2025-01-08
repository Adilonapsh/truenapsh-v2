'use client'

import { useCallback, DragEvent, useRef, useState } from 'react'
import {
    ReactFlow,
    Node,
    addEdge,
    Background,
    Controls,
    MiniMap,
    ConnectionLineType,
    useNodesState,
    useEdgesState,
    ReactFlowProvider,
    useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './custom-nodes'
import { WidgetNode } from './widget-node'

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { SaveIcon, StopCircle, Trash2Icon } from 'lucide-react'
import { Button } from '../button'
import { MdElectricBolt } from 'react-icons/md'


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
        },
        position: { x: 250, y: 25 },
    },
]

export default function FlowDiagramWithDraggableNodes() {
    return (
        <ReactFlowProvider>
            <FlowDiagram />
        </ReactFlowProvider>
    )
}

function FlowDiagram() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [selectedNode, setSelectedNode] = useState<Node | null>(null)
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [rfInstance, setRfInstance] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const reactFlowInstance = useReactFlow()

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
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

            if (typeof type === 'undefined' || !type || !reactFlowBounds) {
                return
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            })

            const newNode: Node = {
                id: Date.now().toString(),
                type,
                position,
                data: {
                    label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
                    desc: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
                },
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [reactFlowInstance, setNodes]
    )

    const onSave = useCallback(() => {
        if (rfInstance) {
            const flow = rfInstance.toObject();
            console.log(flow)
            // localStorage.setItem(flowKey, JSON.stringify(flow));
        }
    }, [rfInstance]);

    const onRun = async () => {
        if (isRunning) {
            setIsRunning(false);
            const flow = rfInstance.toObject();
            flow.edges.forEach((elem, index) => {
                setTimeout(() => {
                    setEdges((eds) =>
                        eds.map((edge) =>
                            edge.id === elem.id ? { ...edge, animated: false } : edge
                        )
                    );
                }, 5000 * (index + 1)); // Adjust timeout based on index for staggered animation stop
            });
        } else {
            setIsRunning(true);
            setEdges((eds) => eds.map((edge) => ({ ...edge, animated: true })));
        }
    };

    const onDragStart = (event: DragEvent, nodeType: string) => {
        event.dataTransfer.setData('application/reactflow', nodeType)
        event.dataTransfer.effectAllowed = 'move'
    }

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

    const deleteNode = useCallback(() => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
            setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id))
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
                    onInit={setRfInstance}
                    onConnect={onConnect}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    connectionLineType={ConnectionLineType.SmoothStep}
                    fitView
                >
                    <Background />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
            <div className='absolute'>
                <div className="w-80 p-4">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 border border-gray-200">
                            <TabsTrigger value="account">Component</TabsTrigger>
                            <TabsTrigger value="password">Node Info</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <Card>
                                <CardContent className="mt-5">
                                    <WidgetNode onDragStart={onDragStart} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="password">
                            <Card>
                                <CardContent className="mt-5">
                                    {selectedNode && (
                                        <div>
                                            <div className='flex justify-between items-center'>
                                                <h3 className="text-xs font-semibold">Node Properties</h3>
                                                <button onClick={deleteNode} className="text-red-500 hover:text-red-700">
                                                    <Trash2Icon size={15} />
                                                </button>
                                            </div>

                                            <div>
                                                <label htmlFor="nodeLabel" className="mr-2 text-xs">Label:</label>
                                                <Input
                                                    id="nodeLabel"
                                                    type="text"
                                                    value={selectedNode?.data?.label}
                                                    onChange={(e) => updateNodeProperties({ label: e.target.value })}
                                                    className="border rounded"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="nodeLabel" className="mr-2 text-xs">Description:</label>
                                                <Input
                                                    id="nodeLabel"
                                                    type="text"
                                                    value={selectedNode?.data?.desc}
                                                    onChange={(e) => updateNodeProperties({ desc: e.target.value })}
                                                    className="border rounded"
                                                />
                                            </div>
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
                    <Button variant={"outline"} onClick={onSave}><SaveIcon /> Save</Button>
                    <Button variant={"outline"} onClick={onRun}>
                        {
                            isRunning ? (
                                <span className='flex items-center gap-1'>
                                    <StopCircle /> Stop
                                </span>) : (
                                <span className='flex items-center gap-1'>
                                    <MdElectricBolt /> Run
                                </span>)
                        }</Button>
                </div>
            </div>
        </div>
    )
}

