import { Handle, NodeResizer, Position } from "@xyflow/react";
import { Trash2, Copy, FolderOpen, Play, Power } from "lucide-react";
import { Tooltip } from "react-tooltip";
import { widgets } from "./widget-node";
import { LoadingBar } from "../loading-bar";
import { useCallback, useState } from "react";
import React from "react";


const handleStyle = { width: 10, height: 10 };

const NodeWrapper = ({
    children,
    borderColor,
    onClick,
    data,
    id,
}: {
    children: React.ReactNode;
    borderColor: string;
    onClick: () => void;
    data: any;
    id: string;
}) => (
    <div
        className={`px-4 py-2 shadow-md rounded-lg bg-white border-2 ${borderColor} cursor-pointer relative group`}
        onClick={onClick}
    >
        {children}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full -mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white text-gray-800 rounded-md p-1 flex shadow-md">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.toggleEnabled(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content={(data?.state?.is_enabled ?? true) ? "Enabled" : "Disabled"}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <Power size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onRunNode(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Run"
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <Play size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDuplicateNode(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Duplicate"
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <Copy size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDeleteNode(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Delete"
                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
        <Tooltip id={`tooltip-${id}`} place="top" />
    </div>
);

export function GroupNode({
    data,
    selected,
}: {
    data: any;
    selected: boolean;
}) {
    const [groupName, setGroupName] = useState(data.parameters?.label || data.label);

    const onGroupNameChange = useCallback(
        (evt: React.ChangeEvent<HTMLInputElement>) => {
            setGroupName(evt.target.value);
            data.onGroupNameChange(evt.target.value);
        },
        [data]
    );

    return (
        <>
            <NodeResizer minWidth={400} minHeight={200} isVisible={selected} />
            <div
                className="bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-lg p-4 w-full h-full"
                style={{ zIndex: 0 }}
            >
                <div className="flex items-center gap-2 mb-2">
                    <FolderOpen className="w-5 h-5 text-blue-500" />
                    <input
                        value={groupName}
                        onChange={onGroupNameChange}
                        className="font-medium text-blue-700 bg-transparent border-none focus:outline-none focus:ring-0"
                    />
                </div>
            </div>
        </>
    );
}


import { settingsInputs } from "./settings-config";

const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") {
        if (value.length > 50) return value.substring(0, 47) + "...";
        return value;
    }
    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        const items = value.map(item => {
            if (typeof item === 'object' && item !== null) {
                return (item.label || item.id || item.value || "{...}");
            }
            return String(item);
        });
        const str = items.join(", ");
        if (str.length > 50) return `[${items.length} items]`;
        return `[${str}]`;
    }
    if (typeof value === "object") {
        return "{...}";
    }
    return String(value);
};

export const nodeTypes = Object.values(widgets)
    .flat()
    .reduce(
        (acc: { [key: string]: (props: any) => React.JSX.Element }, widget) => {
            acc[widget.type] = (props: any) => {
                const type = props.type;
                if (type.includes("-node")) {
                    if (type.includes("group")) {
                        return <GroupNode {...props} />;
                    }
                    return <div>Unknown node type</div>;
                } else {
                    const isDisabled = props?.data?.state?.is_enabled === false;
                    const borderColorClass = isDisabled
                        ? "border-gray-400"
                        : `border-${widget.color}-500`;
                    const iconColorClass = isDisabled
                        ? "text-gray-400"
                        : `text-${widget.color}-500`;
                    const labelTextClass = isDisabled ? "text-gray-600" : "text-black";
                    const descTextClass = isDisabled ? "text-gray-500" : "text-black";

                    const config = settingsInputs[widget.type] || [];
                    const showOnNodeFields = config
                        .filter(field => field.show_on_node)
                        .map(field => field.id);

                    return (
                        <NodeWrapper
                            borderColor={borderColorClass}
                            {...props}
                            data={props.data}
                        >
                            {widget.handleTarget ? (
                                <Handle
                                    type="target"
                                    position={widget.handleTarget}
                                    style={handleStyle}
                                />
                            ) : null}
                            {props?.data?.state?.is_loading ? (
                                <div className="absolute top-0 left-0 h-1 w-full">
                                    <LoadingBar
                                        className="w-full h-[0.11rem]"
                                        color={widget.color}
                                        indeterminate
                                    />
                                </div>
                            ) : null}
                            <div className="flex min-w-[180px]">
                                <div className="flex-1 flex items-start py-1">
                                    <widget.icon className={`mr-2 mt-0.5 ${iconColorClass}`} size={24} />
                                    <div>
                                        <div className={`font-bold text-sm ${labelTextClass}`}>
                                            {props.data.parameters?.label || props.data.label}
                                        </div>
                                        <div className={`font-normal text-xs opacity-70 ${descTextClass}`}>
                                            {props.data.parameters?.desc || props.data.desc}
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            {Object.entries(props.data?.parameters || {})
                                                .filter(([key]) => showOnNodeFields.includes(key))
                                                .map(([key, value]) => {
                                                    const fieldConfig = config.find(f => f.id === key);
                                                    const label = fieldConfig?.label || key;
                                                    return (
                                                        <p
                                                            key={key}
                                                            className="text-[10px] text-gray-500 flex items-center gap-1"
                                                        >
                                                            <span className="font-semibold">{label}:</span>
                                                            <span className="font-normal opacity-70 italic">{formatValue(value)}</span>
                                                        </p>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                </div>

                                {/* Multi-handle Output Tray */}
                                {(widget.type === 'switch' || widget.type === 'ifelse') && (
                                    <div className="flex flex-col justify-center gap-4 border-l border-gray-100 pl-4 ml-4 -my-2 py-4">
                                        {widget.type === 'switch' && (props.data.parameters?.rules || []).map((rule: any, index: number) => (
                                            <div key={index} className="relative flex items-center h-5 group/handle pr-2">
                                                <Handle
                                                    type="source"
                                                    position={Position.Right}
                                                    id={`output-${index}`}
                                                    style={{ ...handleStyle, position: 'absolute', top: '50%', right: -21, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                                                />
                                                <div className="absolute left-full ml-1 flex items-center pointer-events-none">
                                                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-tighter shadow-sm">
                                                        {rule.renameOutput ? rule.outputName : `Out ${index + 1}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {widget.type === 'ifelse' && (
                                            <>
                                                <div className="relative flex items-center h-5 group/handle pr-2">
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id="true"
                                                        style={{ ...handleStyle, position: 'absolute', top: '50%', right: -21, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                                                    />
                                                    <div className="absolute left-full ml-1 flex items-center pointer-events-none">
                                                        <span className="text-[10px] text-gray-400 font-bold bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-tighter shadow-sm">True</span>
                                                    </div>
                                                </div>
                                                <div className="relative flex items-center h-5 group/handle pr-2">
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id="false"
                                                        style={{ ...handleStyle, position: 'absolute', top: '50%', right: -21, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                                                    />
                                                    <div className="absolute left-full ml-1 flex items-center pointer-events-none">
                                                        <span className="text-[10px] text-gray-400 font-bold bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-gray-200 uppercase tracking-tighter shadow-sm">False</span>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Single Source Handle Case */}
                                {widget.handleSource && widget.type !== 'switch' && widget.type !== 'ifelse' && (
                                    <Handle
                                        type="source"
                                        position={widget.handleSource}
                                        style={handleStyle}
                                    />
                                )}
                            </div>
                        </NodeWrapper>
                    );
                }
            };
            return acc;
        },
        {} as { [key: string]: (props: any) => React.JSX.Element }
    );
