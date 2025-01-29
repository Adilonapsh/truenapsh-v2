'use client'

import { File, Folder } from 'lucide-react'

type TreeNode = {
    name: string
    type: string
    children?: TreeNode[]
}

export default function FileGrid({ node, path }: { node: TreeNode, path: string }) {
    if (node.type === 'file') {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <File className="w-8 h-8 text-gray-500" />
                    <span className="text-lg font-semibold">{node.name}</span>
                </div>
                <div>
                    <p><strong>Type:</strong> File</p>
                    <p><strong>Path:</strong> {path}</p>
                </div>
            </div>
        )

    } else if (node.type === 'file') {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <File className="w-8 h-8 text-gray-500" />
                    <span className="text-lg font-semibold">{node.name}</span>
                </div>
                <div>
                    <p><strong>Type:</strong> File</p>
                    <p><strong>Path:</strong> {path}</p>
                </div>
            </div>
        )
    } else {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Folder className="w-8 h-8 text-blue-500" />
                    <span className="text-lg font-semibold">{node.name}</span>
                </div>
                <div>
                    <p><strong>Type:</strong> Folder</p>
                    <p><strong>Path:</strong> {path}</p>
                    <p><strong>Contents:</strong></p>
                </div>
                <div className='h-[30vh] overflow-auto'>
                    <div className="grid grid-cols-1 gap-4">
                        {node.children?.map((child, index) => (
                            <div key={index} className="flex flex-col items-center p-2 border rounded">
                                {child.type === 'folder' ? (
                                    <Folder className="w-8 h-8 text-blue-500" />
                                ) : (
                                    <File className="w-8 h-8 text-gray-500" />
                                )}
                                <span className="mt-2 text-sm text-center break-all">{child.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }
}

