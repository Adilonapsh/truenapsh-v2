import React from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getSmoothStepPath,
    useReactFlow,
} from '@xyflow/react';
import { Plus, Trash2 } from 'lucide-react';

export default function ButtonEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}: EdgeProps) {
    const { setEdges, getEdge, getNode } = useReactFlow();
    const [isHovered, setIsHovered] = React.useState(false);

    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetPosition,
        targetX,
        targetY,
    });

    const onEdgeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    const onAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const edge = getEdge(id);
        if (!edge) return;

        // Custom event to be handled in FlowDiagram
        const event = new CustomEvent('edge-insert-node', {
            detail: {
                edgeId: id,
                source: edge.source,
                target: edge.target,
                position: { x: labelX, y: labelY }
            }
        });
        window.dispatchEvent(event);
    };

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
            {/* Interaction edge - wider for easier hover */}
            <path
                d={edgePath}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                className="cursor-pointer pointer-events-auto"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        fontSize: 12,
                        pointerEvents: isHovered ? 'all' : 'none',
                    }}
                    className={`nodrag nopan transition-all duration-200 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className="flex gap-1.5 bg-background border border-border shadow-sm rounded-md p-1 transition-all">
                        <button
                            className="p-1 hover:bg-muted rounded text-foreground/70 hover:text-primary transition-colors cursor-pointer"
                            onClick={onAddClick}
                            title="Insert node"
                        >
                            <Plus size={14} />
                        </button>
                        <div className="w-[1px] h-3 bg-border self-center" />
                        <button
                            className="p-1 hover:bg-red-50 rounded text-foreground/70 hover:text-red-600 transition-colors cursor-pointer"
                            onClick={onEdgeClick}
                            title="Delete line"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
