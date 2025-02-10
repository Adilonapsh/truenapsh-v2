import { Handle, NodeResizer } from '@xyflow/react';
import { Trash2, Copy, FolderOpen, Play } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { widgets } from './widget-node';
import { LoadingBar } from '../loading-bar';
import { useCallback, useState } from 'react';

const handleStyle = { width: 10, height: 10 };

const NodeWrapper = ({
    children,
    borderColor,
    onClick,
    data,
    id
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
        <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
            <div className="bg-white text-gray-800 rounded-md p-1 flex shadow-md">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onRunNode(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Run"
                    className="p-1 hover:bg-gray-100 rounded">
                    <Play size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDuplicateNode(id);

                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Duplicate"
                    className="p-1 hover:bg-gray-100 rounded">
                    <Copy size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onDeleteNode(id);
                    }}
                    data-tooltip-id={`tooltip-${id}`}
                    data-tooltip-content="Delete"
                    className="p-1 hover:bg-gray-100 rounded text-red-600">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
        <Tooltip id={`tooltip-${id}`} place="top" />
    </div>
);

export function GroupNode({ data, selected }) {
    const [groupName, setGroupName] = useState(data.label);

    const onGroupNameChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
        setGroupName(evt.target.value);
        data.onGroupNameChange(evt.target.value);
    }, [data]);

    return (
        <>
            <NodeResizer minWidth={400} minHeight={200} isVisible={selected} />
            <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-lg p-4 w-full h-full" style={{ zIndex: 0 }}>
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

export const nodeTypes = Object.values(widgets).flat().reduce((acc, widget) => {
    acc[widget.type] = (props) => {
        const type = props.type;
        if (type.includes("-node")) {
            if (type.includes("group")) {
                return <GroupNode {...props} />;
            }
        } else {
            return (
                <NodeWrapper borderColor={`border-${widget.color}-500`} {...props} data={props.data}>
                    {widget.handleTarget ? (
                        <Handle type="target" position={widget.handleTarget} style={handleStyle} />
                    ) : ""}
                    {widget.handleSource ? (
                        <Handle type="source" position={widget.handleSource} style={handleStyle} />
                    ) : ""}
                    {props?.data?.is_loading ? (
                        <div className='absolute top-0 left-0 h-1 w-full'>
                            <LoadingBar className='w-full h-[0.11rem]' color={widget.color} indeterminate />
                        </div>
                    ) : ""}
                    <div className="flex items-center">
                        <widget.icon className={`mr-2 text-${widget.color}-500`} size={24} />
                        <div>
                            <div className="font-bold text-sm text-black dark:text-white">{props.data.label}</div>
                            <div className="font-normal text-sm text-black dark:text-white">{props.data.desc}</div>
                            <div className="mt-1 space-y-0.5">
                                {Object.entries(props.data?.metadata || {}).map(([key, value]) => (
                                    <p key={key} className="text-xs text-gray-500 flex items-center gap-1">
                                        <span className="font-medium capitalize">{key}:</span>
                                        <span>{String(value)}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </NodeWrapper>
            );
        }
    };
    return acc;
}, {});
