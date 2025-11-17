"use client";

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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DragEvent, useCallback, useRef, useState } from "react";
import { nodeTypes } from "./custom-nodes";
import { WidgetNode, widgets } from "./widget-node";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToWorkflow } from "@/tools/flow-tools";
import {
  Icon,
  SaveIcon,
  StopCircle,
  Trash2Icon,
  FileText,
  Hash,
  List,
  Calendar,
  CheckSquare,
  Box,
  Text,
  Type,
} from "lucide-react";
import { MdElectricBolt } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import { Button } from "../button";
import SettingActions from "./settings-actions";
import { useTheme } from "next-themes";
import { ColorMode } from "@xyflow/system";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Badge } from "../badge";
import React from "react";

const flattenKeys = (obj: any, prefix = ""): string[] => {
  if (!obj || typeof obj !== "object") return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    keys.push(p);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenKeys(v as any, p));
    }
  }
  return Array.from(new Set(keys));
};

const firstOfArray = (v: any) => {
  return Array.isArray(v) ? (v.length ? v[0] : undefined) : v;
};

const leafPaths = (obj: any, prefix = ""): string[] => {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== "object") return prefix ? [prefix] : [];
  const target = firstOfArray(obj);
  if (typeof target !== "object" || target === null)
    return prefix ? [prefix] : [];
  const paths: string[] = [];
  for (const [k, v] of Object.entries(target)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const val = firstOfArray(v);
    if (val && typeof val === "object") {
      paths.push(...leafPaths(val, p));
    } else {
      paths.push(p);
    }
  }
  return paths;
};

const getUpstreamNodes = (
  currentId: string,
  edges: any[],
  nodes: any[]
): any[] => {
  const sources = edges
    .filter((e) => e.target === currentId)
    .map((e) => e.source);
  return nodes.filter((n) => sources.includes(n.id));
};

const typeOfValue = (
  v: any
): "text" | "number" | "array" | "datetime" | "boolean" | "object" => {
  if (Array.isArray(v)) return "array";
  const t = typeof v;
  if (t === "number") return "number";
  if (t === "boolean") return "boolean";
  if (t === "object" && v !== null) return "object";
  if (t === "string") {
    const isDate = (() => {
      if (!v) return false;
      if (
        /\d{4}-\d{2}-\d{2}/.test(v) ||
        /\d{2}\/\d{2}\/\d{4}/.test(v) ||
        /\d{2}-\d{2}-\d{4}/.test(v)
      )
        return true;
      const d = new Date(v);
      return !isNaN(d.getTime()) && /[:\-\/]/.test(v);
    })();
    return isDate ? "datetime" : "text";
  }
  return "text";
};

const TypeIcon = ({ type }: { type: ReturnType<typeof typeOfValue> }) => {
  const iconProps = { className: "w-3 h-3 mr-1" } as const;
  switch (type) {
    case "number":
      return <Hash {...iconProps} />;
    case "array":
      return <List {...iconProps} />;
    case "datetime":
      return <Calendar {...iconProps} />;
    case "boolean":
      return <CheckSquare {...iconProps} />;
    case "object":
      return <Box {...iconProps} />;
    case "text":
    default:
      return <Type {...iconProps} />;
  }
};

const previewValue = (v: any) => {
  if (v === undefined) return "(undefined)";
  if (v === null) return "null";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
};

const DraggableChip = ({
  label,
  payload,
  value,
}: {
  label: string;
  payload: string;
  value?: any;
}) => {
  const type = typeOfValue(value);
  return (
    <span
      className="inline-flex items-center rounded border px-2 py-1 mr-2 mb-2 text-xs bg-white cursor-move"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/variable", payload);
        e.dataTransfer.effectAllowed = "copyMove";
      }}
    >
      <TypeIcon type={type} />
      {label}
    </span>
  );
};

const InputSchemaPanel = ({
  selectedNode,
  nodes,
  edges,
}: {
  selectedNode: any;
  nodes: any[];
  edges: any[];
}) => {
  const upstream = getUpstreamNodes(selectedNode.id, edges, nodes);
  const hasAnyOutput = upstream.some((n) => !!n.data?.output);
  const [sample, setSample] = useState<any | null>(null);

  return (
    <Tabs defaultValue="schema">
      <TabsList className="grid grid-cols-2 mb-2">
        <TabsTrigger value="schema">Schema</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="schema">
        <div>
          {upstream.length ? (
            upstream.map((n) => {
              const title = n.data?.label || n.id;
              const output = n.data?.output || {};
              const count = leafPaths(output).length;
              const widgetType = (n.data?.type ||
                n.type ||
                n.data?.action) as string;
              const widgetDef = (widgets as any)[widgetType];
              const IconComp = widgetDef?.icon;
              const iconColor = (widgets as any)[widgetType]?.color || "#888";
              return (
                <div key={n.id} className="mb-2">
                  <div className="flex justify-between items-center gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      {IconComp ? (
                        <IconComp size={14} color={iconColor} />
                      ) : (
                        <Box size={14} color={iconColor} />
                      )}
                      <div className="text-xs font-medium">{title}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {count} items
                    </Badge>
                  </div>
                  {count ? (
                    <SchemaTree
                      obj={output}
                      basePath=""
                      payloadPrefix={`{{${n.id}.output`}
                    />
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No output yet.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground">
              No upstream nodes connected.
            </div>
          )}
        </div>
      </TabsContent>
      <TabsContent value="json">
        <div>
          {upstream.length ? (
            upstream.map((n) => {
              const title = n.data?.label || n.id;
              const output = n.data?.output || {};
              const count = leafPaths(output).length;
              return (
                <div key={n.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-xs font-medium">{title}</div>
                    <Badge variant="secondary" className="text-[10px]">
                      {count} items
                    </Badge>
                  </div>
                  {count ? (
                    <pre className="text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-auto p-2 bg-background border rounded">
                      {JSON.stringify(output, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      No output yet.
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground">
              No upstream nodes connected.
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

const OutputSchemaPanel = ({ data }: { data: any }) => {
  const count = leafPaths(data || {}).length;
  return (
    <Tabs defaultValue="schema">
      <TabsList className="grid grid-cols-2 mb-2">
        <TabsTrigger value="schema">Schema</TabsTrigger>
        <TabsTrigger value="json">JSON</TabsTrigger>
      </TabsList>
      <TabsContent value="schema">
        {count ? (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px]">
                {count} items
              </Badge>
            </div>
            <SchemaTree
              obj={data || {}}
              basePath=""
              payloadPrefix={`{{current.output`}
            />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">No output data.</div>
        )}
      </TabsContent>
      <TabsContent value="json">
        <pre className="text-xs whitespace-pre-wrap break-words max-h-[50vh] overflow-auto p-2 bg-background border rounded">
          {JSON.stringify(data ?? {}, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
  );
};

const SchemaTree = ({
  obj,
  basePath,
  payloadPrefix,
}: {
  obj: any;
  basePath: string;
  payloadPrefix: string;
}) => {
  const target = firstOfArray(obj);
  if (!target || typeof target !== "object") {
    const val = target ?? obj;
    return (
      <div className="flex items-center gap-2 mb-2">
        <DraggableChip
          label={basePath || "value"}
          payload={`${payloadPrefix}.${basePath}}}`}
          value={val}
        />
        <span className="text-[10pt] text-muted-foreground truncate max-w-[60%]">
          {String(val)}
        </span>
      </div>
    );
  }

  return (
    <div className="ml-0">
      {Object.entries(target).map(([key, value]) => {
        const path = basePath ? `${basePath}.${key}` : key;
        const v = firstOfArray(value);
        const isObj = v && typeof v === "object";
        if (isObj) {
          return (
            <details key={path} open className="mb-1">
              <summary className="list-none cursor-pointer flex items-center gap-2 text-xs font-medium">
                <DraggableChip
                  label={key}
                  payload={`${payloadPrefix}.${path}}}`}
                  value={v}
                />
              </summary>
              <div className="ml-4">
                <SchemaTree
                  obj={v}
                  basePath={path}
                  payloadPrefix={payloadPrefix}
                />
              </div>
            </details>
          );
        }
        return (
          <div key={path} className="flex items-center gap-2 mb-1">
            <DraggableChip
              label={key}
              payload={`${payloadPrefix}.${path}}}`}
              value={v}
            />
            <span className="text-[10pt] text-muted-foreground truncate max-w-[60%]">
              {previewValue(v)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// const nodeTypes = {
//     import: ImportNode,
//     export: ExportNode,
//     map: MapNode,
//     database: DatabaseNode,
//     filter: FilterNode,
//     analytics: AnalyticsNode,
// }
const initialNodes: Node[] = [
  // {
  //   id: "1",
  //   type: "import",
  //   data: {
  //     label: "Import Data",
  //     desc: "",
  //     state: { is_loading: true, is_enabled: true },
  //     action: "import",
  //     parameters: {},
  //   },
  //   position: { x: 250, y: 25 },
  // },
];

export default function FlowDiagramWithDraggableNodes() {
  return (
    <ReactFlowProvider>
      <FlowDiagram />
    </ReactFlowProvider>
  );
}

function FlowDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [rfInstance, setRfInstance] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const reactFlowInstance = useReactFlow();
  const { theme } = useTheme();
  const timeoutsRef = useRef<number[]>([]);
  // const { getIntersectingNodes } = useReactFlow();

  // ONE NODE
  const duplicateNode = useCallback(
    (nodeId: string) => {
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
            state: { ...(nodeToClone.data as any).state, is_loading: false },
            onDuplicateNode: () => duplicateNode(id),
            onDeleteNode: () => deleteNode(id),
            onRunNode: () => runNode(id),
            toggleEnabled: () => toggleEnabled(id),
          },
        };

        console.log("Duplicated", newNode);

        return [...nds, newNode];
      });
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      console.log("Ini Node ID", nodeId);
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter(
          (edge: { source: string; target: string }) =>
            edge.source !== nodeId && edge.target !== nodeId
        )
      );
    },
    [setNodes, setEdges]
  );

  const runNode = useCallback(
    (nodeId: string) => {
      console.log("Run", nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        console.log(`Running node ${nodeId}:`, node.data);
        alert(`Node ${nodeId} (${node.data.label}) is running!`);
      }
    },
    [nodes]
  );

  const toggleEnabled = useCallback(
    (nodeId: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  state: {
                    ...(node.data as any).state,
                    is_enabled: !((node.data as any).state?.is_enabled ?? true),
                  },
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  // END ONE NODE

  const onConnect = useCallback(
    (params: any) =>
      setEdges((eds) => addEdge({ ...params, type: "smoothstep" }, eds) as any),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const nodeData = JSON.parse(
        event.dataTransfer.getData("application/nodedata")
      );
      if (typeof type === "undefined" || !type || !reactFlowBounds) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      let newNode: Node;
      if (type === "group-node") {
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
            parameters: {},
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
            toggleEnabled: () => toggleEnabled(id),
            parameters: {},
            state: { is_enabled: true, is_loading: false },
          },
          zIndex: 1,
        };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = (rfInstance as any).toObject();
      // localStorage.setItem(flowKey, JSON.stringify(flow));
    }
  }, [rfInstance]);

  // Compute executable order using a simple topological sort (ignores group nodes)
  const getExecutableOrder = (nodesArr: any[], edgesArr: any[]) => {
    const execNodes = nodesArr.filter((n) => n.type !== "group-node");
    const ids = new Set(execNodes.map((n) => n.id));
    const indegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    ids.forEach((id) => {
      indegree[id] = 0;
      adj[id] = [];
    });
    edgesArr.forEach((e: any) => {
      const s = e.source;
      const t = e.target;
      if (ids.has(s) && ids.has(t)) {
        adj[s].push(t);
        indegree[t] = (indegree[t] ?? 0) + 1;
      }
    });
    const queue: string[] = Array.from(ids).filter(
      (id) => (indegree[id] ?? 0) === 0
    );
    const order: string[] = [];
    while (queue.length) {
      const id = queue.shift() as string;
      order.push(id);
      for (const nxt of adj[id]) {
        indegree[nxt] -= 1;
        if (indegree[nxt] === 0) queue.push(nxt);
      }
    }
    // Fallback: if cycle or disconnected, append any remaining ids preserving appearance order
    if (order.length !== execNodes.length) {
      const seen = new Set(order);
      execNodes.forEach((n) => {
        if (!seen.has(n.id)) order.push(n.id);
      });
    }
    return order;
  };

  const onRun = async () => {
    if (!rfInstance) return;
    const flow = (rfInstance as any).toObject();

    // If stopping: clear timers, reset UI, and exit
    if (isRunning) {
      setIsRunning(false);
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
      setEdges((eds: any) =>
        eds.map((edge: any) => ({ ...edge, animated: false }))
      );
      // Reset all node loading flags immediately
      setNodes((nds: any[]) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            state: { ...(n.data as any).state, is_loading: false },
          },
        }))
      );
      return;
    }

    // Starting a new run
    setIsRunning(true);
    const workflow = await convertToWorkflow(flow.nodes, flow.edges);
    console.log("workflow", workflow);

    // Animate all edges during run
    setEdges((eds: any) =>
      eds.map((edge: any) => ({ ...edge, animated: true }))
    );

    // Compute execution order and schedule sequential execution
    const order = getExecutableOrder(flow.nodes, flow.edges);
    const stepMs = 1500; // duration per node
    let delay = 0;

    // Ensure clean state
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    setNodes((nds: any[]) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          state: { ...(n.data as any).state, is_loading: false },
        },
      }))
    );

    order.forEach((nodeId, idx) => {
      // Start this node
      const startId = window.setTimeout(() => {
        setNodes((nds: any[]) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    state: { ...(n.data as any).state, is_loading: true },
                  },
                }
              : n
          )
        );
      }, delay);
      timeoutsRef.current.push(startId);

      // Finish this node
      const finishId = window.setTimeout(() => {
        setNodes((nds: any[]) =>
          nds.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    state: { ...(n.data as any).state, is_loading: false },
                  },
                }
              : n
          )
        );
        // If this is the last node, wrap up the run
        if (idx === order.length - 1) {
          setIsRunning(false);
          setEdges((eds: any) =>
            eds.map((edge: any) => ({ ...edge, animated: false }))
          );
        }
      }, delay + stepMs);
      timeoutsRef.current.push(finishId);

      delay += stepMs;
    });
  };

  const onDragStart = (event: DragEvent, nodeType: string, nodeData: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData(
      "application/nodedata",
      JSON.stringify(nodeData)
    );
    event.dataTransfer.effectAllowed = "move";
  };

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

  const updateNodePosition = (
    nodeToUpdate: Node,
    newPosition: XYPosition,
    newParent?: string
  ) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) =>
        n.id === nodeToUpdate.id
          ? {
              ...n,
              position: newPosition,
              parentNode: newParent,
              extent: newParent ? "parent" : undefined,
              zIndex: n.type === "group-node" ? 0 : 1,
            }
          : n
      )
    );
  };

  const onNodeDragStop = useCallback(
    (event: MouseEvent, node: Node, allNodes: Node[]) => {
      const groups = allNodes.filter((n) => n.type === "group-node");
      let newParentGroup = null;

      for (const group of groups) {
        if (group.id === node.id) continue;

        const groupBounds = {
          left: group.position.x,
          right: group.position.x + ((group.style?.width as number) || 0),
          top: group.position.y,
          bottom: group.position.y + ((group.style?.height as number) || 0),
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
    },
    [setNodes]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setSettingsOpen(true);
    },
    []
  );

  const updateNodeProperties = useCallback(
    (data: object) => {
      if (selectedNode) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === selectedNode.id) {
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          })
        );
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, ...data } } : null
        );
      }
    },
    [selectedNode, setNodes]
  );

  const deleteNodes = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge: { source: string; target: string }) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes, setEdges]);

  return (
    <div className="relative flex h-full">
      <div className="w-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDrag={(event: React.MouseEvent, node: Node) =>
            onNodeDrag(event as unknown as MouseEvent, node)
          }
          onNodeDragStop={(
            event: React.MouseEvent,
            node: Node,
            allNodes: Node[]
          ) => onNodeDragStop(event as unknown as MouseEvent, node, allNodes)}
          onInit={(instance: any) => setRfInstance(instance)}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          colorMode={theme as ColorMode}
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
      <div className="absolute">
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
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-semibold">
                          Node Properties
                        </h3>
                        <button
                          onClick={deleteNodes}
                          className="text-red-500 hover:text-red-700"
                        >
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
      <div className="absolute right-0 text-black">
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            onClick={onSave}
            className="text-foreground"
          >
            <SaveIcon /> Save
          </Button>
          <Button
            variant={"outline"}
            onClick={onRun}
            className="text-foreground"
          >
            {isRunning ? (
              <span className="flex items-center gap-1">
                <StopCircle /> Stop
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <MdElectricBolt /> Run
              </span>
            )}
          </Button>
          <Button
            variant={"outline"}
            onClick={() => setSettingsOpen(true)}
            disabled={!selectedNode}
            className="text-foreground"
          >
            Node Settings
          </Button>
        </div>
      </div>
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-9xl h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={33} minSize={20}>
              <div className="bg-muted rounded p-4 h-full flex flex-col">
                <div className="text-xs text-muted-foreground mb-2">INPUT</div>
                <div className="flex-1 overflow-auto">
                  {selectedNode ? (
                    <InputSchemaPanel
                      selectedNode={selectedNode}
                      nodes={nodes}
                      edges={edges}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Select a node to view inputs
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={34} minSize={34}>
              <div className="rounded p-2 border h-full overflow-auto">
                {selectedNode && (
                  <div>
                    <div className="flex justify-between items-center mb-4 ml-2">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const meta = Object.values(widgets)
                              .flat()
                              .find((w: any) => w.type === selectedNode?.type);
                            if (!meta) return null;
                            const IconComp =
                              meta.icon as React.ComponentType<any>;
                            return (
                              <IconComp
                                size={24}
                                className={`text-${meta.color}-500`}
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">
                            {String(
                              selectedNode?.data?.label || selectedNode?.id
                            )}
                          </h3>
                          <h4 className="text-sm text-muted-foreground">
                            {String(selectedNode?.data?.desc ?? "")}
                          </h4>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-sm text-muted-foreground capitalize"
                      >
                        {selectedNode?.type?.replaceAll("-", " ")}
                      </Badge>
                    </div>
                    <Tabs defaultValue="parameters">
                      <TabsList className="grid grid-cols-2">
                        <TabsTrigger value="parameters">Parameters</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                      </TabsList>
                      <TabsContent value="parameters" className="p-2">
                        <SettingActions
                          selectedNode={selectedNode}
                          updateNodeProperties={updateNodeProperties}
                        />
                      </TabsContent>
                      <TabsContent value="settings" className="p-2">
                        <div className="text-sm text-muted-foreground">
                          Additional settings coming soon.
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={33} minSize={20}>
              <div className="bg-muted rounded p-4 h-full flex flex-col">
                <div className="text-xs text-muted-foreground mb-2">OUTPUT</div>
                <div className="overflow-auto">
                  {selectedNode?.data?.output ? (
                    <OutputSchemaPanel data={selectedNode?.data?.output} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Execute this node to view data
                    </div>
                  )}
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
}
