'use client'

import { File, Folder, LucideWaypoints } from 'lucide-react'
import { BiGlobe } from 'react-icons/bi'
import { FaVectorSquare } from 'react-icons/fa6'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from './tabs'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from './card'

type TreeNode = {
    name: string
    type: string
    children?: TreeNode[],
    metadata?: Record<string, any>,
}

export default function FileGrid({ node, path }: { node: TreeNode, path: string }) {
    if (node.type === 'file') {
        return (
            <div className="space-y-4">
                <div className="flex items-center space-x-2">
                    <File className="w-8 h-8 text-gray-500" />
                    <span className="text-lg font-semibold capitalize">{node.name}</span>
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
                    <span className="text-lg font-semibold capitalize">{node.name}</span>
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
                    <span className="text-lg font-semibold capitalize">{node.name}</span>
                </div>
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="layers">Layers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                                <CardDescription>

                                </CardDescription>
                            </CardHeader>
                            <CardContent className="h-full space-y-2">
                                <div className='h-80 overflow-auto'>
                                    <p><strong>Type:</strong> Folder</p>
                                    <p><strong>Path:</strong> {node?.metadata?.url}</p>
                                    <p><strong>Contents:</strong></p>
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-2">
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <p><strong>Version:</strong> {node?.metadata?.currentVersion}</p>
                                                <p><strong>Service Description:</strong> <span dangerouslySetInnerHTML={{ __html: node?.metadata?.serviceDescription || '' }}></span></p>
                                                <p><strong>Map Name:</strong> {node?.metadata?.mapName}</p>
                                                <p><strong>Copyright:</strong> {node?.metadata?.copyrightText}</p>
                                            </div>
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <p><strong>Initial Extent:</strong></p>
                                                <p className="text-sm">xmin: {node?.metadata?.initialExtent?.xmin}</p>
                                                <p className="text-sm">ymin: {node?.metadata?.initialExtent?.ymin}</p>
                                                <p className="text-sm">xmax: {node?.metadata?.initialExtent?.xmax}</p>
                                                <p className="text-sm">ymax: {node?.metadata?.initialExtent?.ymax}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <p><strong>Spatial Reference:</strong> WKID {node?.metadata?.spatialReference?.wkid}</p>
                                                <p><strong>Units:</strong> {node?.metadata?.units}</p>
                                                <p><strong>Max Records:</strong> {node?.metadata?.maxRecordCount}</p>
                                                <p><strong>Capabilities:</strong> {node?.metadata?.capabilities}</p>
                                            </div>
                                            <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                                                <p><strong>Document Info:</strong></p>
                                                <p className="text-sm">Keywords: {node?.metadata?.documentInfo?.Keywords}</p>
                                                <p className="text-sm">Comments: {node?.metadata?.documentInfo?.Comments}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="layers">
                        <Card>
                            <CardHeader>
                                <CardTitle>Layers</CardTitle>
                                <CardDescription>

                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className='h-[30vh] overflow-auto'>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {node.children?.map((child, index) => (
                                            <div key={index} className="flex flex-col items-center p-2 border rounded">
                                                {child.type === 'folder' ? (
                                                    <Folder className="w-8 h-8 text-blue-500" />
                                                ) : child.type === 'VectorTileServer' ? (
                                                    <div className="flex flex-col items-center space-y-2 p-3 hover:bg-red-50 transition-colors rounded-lg">
                                                        <FaVectorSquare className="w-10 h-10 text-red-500" />
                                                        <span className='font-medium capitalize text-red-600'>{child.name}</span>
                                                        <span className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full font-medium">{child.type}</span>
                                                    </div>
                                                ) : child.type === 'MapServer' ? (
                                                    <div className="flex flex-col items-center space-y-2 p-3 hover:bg-amber-50 transition-colors rounded-lg">
                                                        <BiGlobe className="w-10 h-10 text-amber-500" />
                                                        <span className='font-medium capitalize text-amber-600'>{child.name}</span>
                                                        <span className="text-xs bg-amber-100 text-amber-600 px-3 py-1 rounded-full font-medium">{child.type}</span>
                                                    </div>
                                                ) : child.type === 'FeatureServer' ? (
                                                    <div className="flex flex-col items-center space-y-2 p-3 hover:bg-blue-50 transition-colors rounded-lg">
                                                        <LucideWaypoints className="w-10 h-10 text-blue-500" />
                                                        <span className='font-medium capitalize text-blue-600'>{child.name}</span>
                                                        <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">{child.type}</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center space-y-2 p-3 hover:bg-gray-50 transition-colors rounded-lg">
                                                        <File className="w-10 h-10 text-gray-500" />
                                                        <span className='font-medium capitalize text-gray-600'>{child.name}</span>
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{child.type}</span>
                                                    </div>
                                                )}
                                                <span className="mt-2 text-sm text-center break-all">{child.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>


            </div>
        )
    }
}

