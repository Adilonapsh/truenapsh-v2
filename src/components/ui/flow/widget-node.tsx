import { ListOrdered } from "lucide-react";
import { Input } from "../input";
import { ChartBar, Database, FileInputIcon, FileOutput, Filter, MapIcon } from 'lucide-react'

import { HiOutlineCursorClick } from "react-icons/hi";
import { MdJoinFull } from "react-icons/md";
import { IoSwapVerticalOutline } from "react-icons/io5";
import { Position } from "@xyflow/react";
import { FaObjectGroup } from "react-icons/fa6";
import { TbNumber123 } from "react-icons/tb";

export const widgets = {
    "Input/Output": [
        { id: "import", type: 'import', label: 'Import', icon: FileInputIcon, color: 'blue', handleSource: Position.Right, handleTarget: null },
        { id: "export", type: 'export', label: 'Export', icon: FileOutput, color: 'green', handleSource: null, handleTarget: Position.Left },
        { id: "map", type: 'map', label: 'Map', icon: MapIcon, color: 'yellow', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "database", type: 'database', label: 'Database', icon: Database, color: 'purple', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "analytics", type: 'analytics', label: 'Analytics', icon: ChartBar, color: 'indigo', handleSource: Position.Right, handleTarget: Position.Left },
    ],
    "Data Preparation": [
        { id: "select", type: 'select', label: 'Select', icon: HiOutlineCursorClick, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "order-by", type: 'order-by', label: 'Order', icon: ListOrdered, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "limit", type: 'limit', label: 'Limit', icon: IoSwapVerticalOutline, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "filter", type: 'filter', label: 'Filter', icon: Filter, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "join", type: 'join', label: 'Join', icon: MdJoinFull, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "group-by", type: 'group-by', label: 'Group', icon: FaObjectGroup, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
        { id: "count", type: 'count', label: 'Count', icon: TbNumber123, color: 'blue', handleSource: Position.Right, handleTarget: Position.Left },
    ]
}

export function WidgetNode({ onDragStart }: { onDragStart: (event: DragEvent<Element>, nodeType: string) => void }) {


    return (
        <div>
            <div className="mb-5">
                <Input type="text" placeholder="Search Components" className="text-xs" />
            </div>
            <div className="h-full overflow-y-auto overflow-x-hidden">
                {Object.entries(widgets).map(([category, widgets]) => (
                    <div key={category} className="mb-4">
                        <div className="flex gap-1 items-center">
                            <h3 className="text-xs font-semibold mb-2">{category}</h3>
                            <h3 className="text-xs font-semibold text-gray-600 mb-2">({widgets.length})</h3>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {widgets.map((widget) => (
                                <div key={widget.id} className="flex flex-col items-center justify-center">
                                    <div
                                        key={widget.id}
                                        className="bg-gray-50 cursor-move h-10 w-10 border flex flex-col items-center justify-center rounded-lg"
                                        onDragStart={(event) => onDragStart(event, widget.type)}
                                        draggable
                                    >
                                        <widget.icon className={`text-${widget.color}-500`} size={20} />
                                    </div>
                                    <span className="text-[8pt] text-center mt-1 text-gray-600">{widget.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {/* <div
                className="bg-blue-200 p-2 mb-2 cursor-move"
                onDragStart={(event) => onDragStart(event, 'input')}
                draggable
            >
                Input Node
            </div>
            <div
                className="bg-green-200 p-2 mb-2 cursor-move"
                onDragStart={(event) => onDragStart(event, 'default')}
                draggable
            >
                Default Node
            </div>
            <div
                className="bg-red-200 p-2 cursor-move"
                onDragStart={(event) => onDragStart(event, 'output')}
                draggable
            >
                Output Node
            </div> */}
        </div>
    );
}