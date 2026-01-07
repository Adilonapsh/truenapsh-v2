import { Building2, Combine, Hexagon, Layers, LineChart, Link, ListOrdered, Pentagon, PenTool, Radio, Scissors, Settings, Square, SquareDashedBottom, SquareStack, Trash2 } from "lucide-react";
import { Input } from "../input";
import { ChartBar, Database, FileInputIcon, FileOutput, Filter, MapIcon } from 'lucide-react'

import { HiOutlineCursorClick, HiSwitchHorizontal } from "react-icons/hi";
import { MdJoinFull, MdLoop, MdTerrain } from "react-icons/md";
import { IoSwapVerticalOutline } from "react-icons/io5";
import { Position } from "@xyflow/react";
import { FaObjectGroup } from "react-icons/fa6";
import { TbNumber123 } from "react-icons/tb";
import { BiGitBranch } from "react-icons/bi";
import { useState } from "react";

export const widgets = {
    "Flow": [
        { id: "group-node", type: 'group-node', label: 'Group Node', icon: FaObjectGroup, color: 'blue', handleSource: Position.Right, handleTarget: null },
    ],
    "Trigger": [
        { id: "websocket", type: 'websocket', label: 'Websocket', icon: Radio, color: 'blue', handleSource: Position.Right, handleTarget: null },
        { id: "webhook", type: 'webhook', label: 'Webhook', icon: Link, color: 'orange', handleSource: Position.Right, handleTarget: null, action: 'webhook' },
    ],
    "Input/Output": [
        { id: "import", type: 'import', label: 'Import', icon: FileInputIcon, color: 'blue', handleSource: Position.Right, handleTarget: null, action: 'import' },
        { id: "export", type: 'export', label: 'Export', icon: FileOutput, color: 'green', handleSource: null, handleTarget: Position.Left, action: 'export' },
        { id: "map", type: 'map', label: 'Map', icon: MapIcon, color: 'yellow', handleSource: Position.Right, handleTarget: Position.Left, action: 'map' },
        { id: "database", type: 'database', label: 'Database', icon: Database, color: 'purple', handleSource: Position.Right, handleTarget: Position.Left, action: 'database' },
        { id: "analytics", type: 'analytics', label: 'Analytics', icon: ChartBar, color: 'indigo', handleSource: Position.Right, handleTarget: Position.Left, action: 'analytics' },
        { id: "http-request", type: 'http-request', label: 'Http Request', icon: Link, color: 'red', handleSource: Position.Right, handleTarget: Position.Left, action: 'http-request' },
        { id: "layer", type: 'layer', label: 'Layer', icon: Layers, color: 'blue', handleSource: Position.Right, handleTarget: null, action: 'layer' },
    ],
    "Operation": [
        { id: "forloop", type: 'forloop', label: 'Loop', icon: MdLoop, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'forloop' },
        { id: "ifelse", type: 'ifelse', label: 'If Else', icon: BiGitBranch, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'ifelse' },
        { id: "while", type: 'while', label: 'While', icon: MdLoop, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'while' },
        { id: "switch", type: 'switch', label: 'Switch', icon: HiSwitchHorizontal, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'switch' },
    ],
    "Data Preparation": [
        { id: "select", type: 'select', label: 'Select', icon: HiOutlineCursorClick, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'select' },
        { id: "order-by", type: 'order-by', label: 'Order', icon: ListOrdered, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'order-by' },
        { id: "limit", type: 'limit', label: 'Limit', icon: IoSwapVerticalOutline, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'limit' },
        { id: "filter", type: 'filter', label: 'Filter', icon: Filter, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'filter' },
        { id: "join", type: 'join', label: 'Join', icon: MdJoinFull, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'join' },
        { id: "group-by", type: 'group-by', label: 'Group', icon: FaObjectGroup, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'group-by' },
        { id: "count", type: 'count', label: 'Count', icon: TbNumber123, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'count' },
    ],
    "Geoprocessing": [
        { id: "boundary", type: 'boundary', label: 'Boundary', icon: Square, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'boundary' },
        { id: "buffer", type: 'buffer', label: 'Buffer', icon: Settings, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'buffer' },
        { id: "clip", type: 'clip', label: 'Clip', icon: Scissors, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'clip' },
        { id: "difference", type: 'difference', label: 'Difference', icon: Link, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'difference' },
        { id: "intersection", type: 'intersection', label: 'Intersection', icon: Combine, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'intersection' },
    ],
    "Geometry": [
        { id: "centroid", type: 'centroid', label: 'Centroid', icon: Pentagon, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'centroid' },
        { id: "lines-to-polygon", type: 'lines-to-polygon', label: 'Lines to Polygon', icon: SquareStack, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'lines-to-polygon' },
        { id: "polygon-to-lines", type: 'polygon-to-lines', label: 'Polygon to Lines', icon: SquareDashedBottom, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'polygon-to-lines' },
        { id: "remove-duplicates", type: 'remove-duplicates', label: 'Remove duplicates', icon: Trash2, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'remove-duplicates' },
        { id: "generate-points", type: 'generate-points', label: 'Generate Points Along Line', icon: LineChart, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'generate-points' },
        { id: "simplify", type: 'simplify', label: 'Simplify', icon: PenTool, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'simplify' },
    ],
    "Analysis": [
        { id: "hexagon-grid", type: 'hexagon-grid', label: 'Hexagon Grid', icon: Hexagon, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'hexagon-grid' },
    ],
    "Integration": [
        { id: "building", type: 'building', label: 'Building', icon: Building2, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'building' },
        { id: "elevation", type: 'elevation', label: 'Elevation', icon: MdTerrain, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left, action: 'elevation' },
    ]
}

export function WidgetNode({
    onDragStart,
    onDoubleClick
}: {
    onDragStart: (event: React.DragEvent<Element>, nodeType: string, nodeData: any) => void;
    onDoubleClick?: (nodeType: string, nodeData: any) => void;
}) {
    const [search, setSearch] = useState('');

    return (
        <div className="relative h-[70vh] overflow-y-auto pt-5">
            <div className="sticky top-0 bg-background z-10 mb-5">
                <Input type="text" placeholder="Search Components" className="text-xs" onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="">
                <div className="space-y-4">
                    {Object.entries(widgets).map(([category, widgetList]) => {
                        const filteredWidgets = widgetList.filter((widget) =>
                            widget.label.toLowerCase().includes(search.toLowerCase())
                        );

                        if (filteredWidgets.length === 0) return null;

                        return (
                            <div key={category}>
                                <div className="flex gap-1 items-center">
                                    <h3 className="text-xs font-semibold mb-2">{category}</h3>
                                    <h3 className="text-xs font-semibold text-foreground mb-2">({filteredWidgets.length})</h3>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {filteredWidgets.map((widget) => (
                                        <div key={widget.id} className="flex flex-col items-center justify-start">
                                            <div
                                                className="bg-gray-50 cursor-move h-10 w-10 border flex flex-col items-center justify-center rounded-lg hover:border-primary/50 transition-colors"
                                                onDragStart={(event) => onDragStart(event, widget.type, widget)}
                                                onDoubleClick={() => onDoubleClick?.(widget.type, widget)}
                                                draggable
                                            >
                                                <widget.icon className={`text-${widget.color}-500`} size={20} />
                                            </div>
                                            <span className="text-[8pt] text-center mt-1 text-foreground">{widget.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}