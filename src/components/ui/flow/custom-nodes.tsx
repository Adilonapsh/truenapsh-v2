import { Handle } from '@xyflow/react';
import { Trash2, Copy } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { widgets } from './widget-node';
import { LoadingBar } from '../loading-bar';

const handleStyle = { width: 10, height: 10 };

const NodeWrapper = ({
    children,
    borderColor,
    onClick,
    onDelete,
    onDuplicate,
    id
}: {
    children: React.ReactNode;
    borderColor: string;
    onClick: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    id: string;
}) => (
    <div
        className={`px-4 py-2 shadow-md rounded-lg bg-white border-2 ${borderColor} cursor-pointer relative group`}
        onClick={onClick}
    >
        {children}
        <div
            className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full -mt-2 opacity-0 group-hover:opacity-100 transition-opacity"
            data-tooltip-id={`tooltip-${id}`}
            data-tooltip-content="Node Actions"
        >
            <div className="bg-white text-gray-800 rounded-md p-1 flex shadow-md">
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(); }} className="p-1 hover:bg-gray-100 rounded">
                    <Copy size={16} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 hover:bg-gray-100 rounded text-red-600">
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
        <Tooltip id={`tooltip-${id}`} place="top" />
    </div>
);

export const nodeTypes = Object.values(widgets).flat().reduce((acc, widget) => {
    acc[widget.type] = (props) => {
        return (
            <NodeWrapper borderColor={`border-${widget.color}-500`} {...props}>
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
                        <div className="font-bold text-sm">{props.data.label}</div>
                        <div className="font-normal text-sm">{props.data.desc}</div>
                    </div>
                </div>
            </NodeWrapper>
        );
    };
    return acc;
}, {});
