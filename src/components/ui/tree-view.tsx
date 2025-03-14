'use client'

import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { useState } from 'react'
import FileGrid from './file-grid'
import { cn } from "@/lib/utils"
import { FaVectorSquare } from 'react-icons/fa6'
import { BiGlobe } from 'react-icons/bi'
import { Datasets } from '@/types/datasets.types'

type TreeNode = {
    name: string
    type: string
    children?: TreeNode[]
    metadata?: Metadata
}

type Metadata = {
    type: string
    url: string
}

type TreeNodeProps = {
    node: TreeNode
    level: number
    path: string
    onSelect: (node: TreeNode, path: string) => void
    selectedPath: string | null
}

function TreeNode({ node, level, path, onSelect, selectedPath }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleOpen = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen)
        }
        onSelect(node, path)
    }

    const isSelected = selectedPath === path

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer",
                    isSelected && "bg-accent text-accent-foreground"
                )}
                style={{ paddingLeft: `${level * 20}px` }}
                onClick={toggleOpen}
            >
                {node.type === 'folder' && (
                    isOpen ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />
                )}
                {node.type === 'folder' && (
                    <Folder className="w-4 h-4 mr-2 text-blue-500" />
                )}

                {node.type != 'folder' && (
                    <div>
                        {node.type === 'VectorTileServer' ? (
                            <FaVectorSquare className="w-4 h-4 mr-2 text-gray-500" />
                        ) : node.type === 'MapServer' ? (
                            <BiGlobe className="w-4 h-4 mr-2 text-gray-500" />
                        ) : node.type === 'FeatureServer' ? (
                            <FaVectorSquare className="w-4 h-4 mr-2 text-gray-500" />
                        ) : (
                            <File className="w-4 h-4 mr-2 text-gray-500" />
                        )}
                    </div>
                )}
                <span className='capitalize'>{node.name}</span>
            </div>
            {isOpen && node.children && (
                <div>
                    {node.children.map((childNode, index) => (
                        <TreeNode
                            key={index}
                            node={childNode}
                            level={level + 1}
                            path={`${path}/${childNode.name}`}
                            onSelect={onSelect}
                            selectedPath={selectedPath}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

export default function TreeDirectory({ data, setSelectedDatasets, selectedDatasets, activeDatasets }: { data: TreeNode[], setSelectedDatasets: (datasets: any[]) => void, selectedDatasets: any[], activeDatasets: Datasets }) {
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
    const [selectedPath, setSelectedPath] = useState<string | null>(null)

    const handleSelect = (node: TreeNode, path: string) => {
        const layer = {
            id: node.id,
            name: node.name,
            title: node.name,
            legend: "",
            thumbnail: "",
            map_service_vendor: "ArcGIS",
            url: node?.metadata?.url?.replaceAll("?f=json", ""),
        };
        if (node.type != "folder") {
            setSelectedDatasets([...selectedDatasets, { ...layer }]);
        }
        setSelectedNode(node)
        setSelectedPath(path)
    }
    return (
        <div className="flex border-r-1 p-4 max-w-4xl w-full h-full">
            <div className="h-full w-1/2 pr-4 border-r overflow-auto">
                <h2 className="text-lg font-semibold mb-4">{activeDatasets.name} Directory Structure</h2>
                {data.map((node, index) => (
                    <TreeNode
                        key={index}
                        node={node}
                        level={0}
                        path={node.name}
                        onSelect={handleSelect}
                        selectedPath={selectedPath}
                    />
                ))}
            </div>
            <div className="w-1/2 pl-4 sticky">
                <h2 className="text-lg font-semibold mb-4">File/Folder Details</h2>
                {selectedNode && <FileGrid node={selectedNode} path={selectedPath || ''} />}
            </div>
        </div>
    )
}

