'use client'

import { ChevronRight, ChevronDown, Folder, File, LucideWaypoints, FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import FileGrid from './file-grid'
import { cn } from "@/lib/utils"
import { FaVectorSquare } from 'react-icons/fa6'
import { BiGlobe } from 'react-icons/bi'
import { Datasets } from '@/types/datasets.types'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { MapServiceVendor } from '@/types/map.types'

export type TreeNode = {
    id: string
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
    id?: string,
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

    const isSelected = node.id === selectedPath

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
                    isOpen ? <FolderOpen className="text-blue-500 w-4 h-4 mr-1" /> : <Folder className="text-blue-500 w-4 h-4 mr-1" />
                )}

                {node.type != 'folder' && (
                    <div className="flex items-center">
                        {node.type === 'VectorTileServer' ? (
                            <>
                                <FaVectorSquare className="w-4 h-4 mr-2 text-red-500" />
                                <span className='capitalize text-red-500'>{node.name}</span>
                                <span className="ml-2 text-xs border border-red-500 text-red-500 px-2 py-0.5 rounded-full">{node.type}</span>
                            </>
                        ) : node.type === 'MapServer' ? (
                            <>
                                <BiGlobe className="w-4 h-4 mr-2 text-yellow-500" />
                                <span className='capitalize text-yellow-500'>{node.name}</span>
                                <span className="ml-2 text-xs border border-yellow-500 text-yellow-500 px-2 py-0.5 rounded-full">{node.type}</span>
                            </>
                        ) : node.type === 'FeatureServer' ? (
                            <>
                                <LucideWaypoints className="w-4 h-4 mr-2 text-blue-500" />
                                <span className='capitalize text-blue-500'>{node.name}</span>
                                <span className="ml-2 text-xs border border-blue-500 text-blue-500 px-2 py-0.5 rounded-full">{node.type}</span>
                            </>
                        ) : (
                            <>
                                <File className="w-4 h-4 mr-2 text-gray-500" />
                                <span className='capitalize text-gray-500'>{node.name}</span>
                                <span className="ml-2 text-xs border border-gray-500 text-gray-500 px-2 py-0.5 rounded-full">{node.type}</span>
                            </>
                        )}
                    </div>
                )}

                {node.type === 'folder' && (
                    <div className="flex items-center gap-2">
                        <span className='capitalize'>{node.name}</span>
                        <span className="text-foreground/50 text-xs">{node.children?.length} Items</span>
                    </div>
                )}
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

    const searchNode = (node: TreeNode, searchTerm: string): boolean => {
        // Check if current node name matches search
        if (node.name.toLowerCase().includes(searchTerm)) {
            return true;
        }

        // Recursively search children if they exist
        if (node.children) {
            return node.children.some(child => searchNode(child, searchTerm));
        }

        return false;
    }

    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredData, setFilteredData] = useState<TreeNode[]>(data);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredData(data);
            return;
        }

        const filtered = data.filter(node => searchNode(node, searchTerm.toLowerCase()));
        setFilteredData(filtered);
    }, [searchTerm, data]);

    const handleSelect = (node: TreeNode, path: string) => {
        const layer = {
            id: node.id,
            name: node.name,
            title: node.name,
            legend: "",
            thumbnail: "",
            map_service_vendor: MapServiceVendor.ArcGIS,
            url: node?.metadata?.url?.replaceAll("?f=json", ""),
        };
        if (node.type != "folder") {
            setSelectedDatasets([...selectedDatasets, { ...layer }]);
        }
        setSelectedNode(node)
        setSelectedPath(node.id)
    }

    return (
        <div className="sw-full h-full">
            <div className="h-full pr-4 overflow-auto">
                <ResizablePanelGroup direction="horizontal" className="h-full">
                    <ResizablePanel>
                        <div className="h-full p-5">
                            <h2 className="text-lg font-semibold mb-4">{activeDatasets.name} Directory Structure</h2>
                            <div className="mb-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search files and folders..."
                                        className="w-full px-3 py-2 pl-10 border rounded-md border-input bg-background"
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                        }}
                                    />
                                    <MagnifyingGlassIcon className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                                </div>
                            </div>
                            <div className="h-[calc(100%-120px)] overflow-auto">
                                {filteredData.map((node, index) => (
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
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel>
                        <div className="h-full p-5">
                            <h2 className="text-lg font-semibold mb-4">File/Folder Details</h2>
                            {selectedNode && <FileGrid node={selectedNode} path={selectedPath || ''} />}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

        </div>
    )
}

