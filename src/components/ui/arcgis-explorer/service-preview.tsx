"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle, RefreshCw, MapIcon, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MapPreview from "./map-preview"

interface ServicePreviewProps {
    service: {
        name: string
        type: string
        url: string
    }
}

const ServicePreview: React.FC<ServicePreviewProps> = ({ service }) => {
    const [metadata, setMetadata] = useState<any>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<string>("info")

    const fetchMetadata = async () => {
        setLoading(true)
        setError(null)

        try {
            const requestUrl = service.url.includes("?") ? `${service.url}&f=json` : `${service.url}?f=json`

            const response = await fetch(requestUrl)

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const data = await response.json()
            setMetadata(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMetadata()
    }, [service.url])

    // Determine if the service supports map preview
    const supportsMapPreview = service.type === "MapServer" || service.type === "FeatureServer"

    // Set the active tab based on service type
    useEffect(() => {
        if (supportsMapPreview) {
            setActiveTab("map")
        } else {
            setActiveTab("info")
        }
    }, [supportsMapPreview])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading service metadata...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <div className="flex items-center mb-4">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <p>Error loading metadata: {error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMetadata}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        )
    }

    if (!metadata) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No metadata available</p>
            </div>
        )
    }

    // Render service information
    const renderServiceInfo = () => {
        switch (service.type) {
            case "MapServer":
                return (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Map Service Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-semibold">Name:</div>
                                    <div>{metadata.mapName || metadata.name || service.name}</div>

                                    <div className="font-semibold">Description:</div>
                                    <div>{metadata.description || "No description"}</div>

                                    <div className="font-semibold">Service Type:</div>
                                    <div>{metadata.serviceDescription || service.type}</div>

                                    <div className="font-semibold">Layers:</div>
                                    <div>{metadata.layers?.length || 0}</div>

                                    <div className="font-semibold">Initial Extent:</div>
                                    <div className="truncate">
                                        {metadata.initialExtent
                                            ? `${metadata.initialExtent.xmin.toFixed(2)}, ${metadata.initialExtent.ymin.toFixed(2)}, ${metadata.initialExtent.xmax.toFixed(2)}, ${metadata.initialExtent.ymax.toFixed(2)}`
                                            : "Not specified"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {metadata.layers && metadata.layers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Layers ({metadata.layers.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">ID</th>
                                                    <th className="text-left py-2">Name</th>
                                                    <th className="text-left py-2">Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metadata.layers.map((layer: any) => (
                                                    <tr key={layer.id} className="border-b border-muted">
                                                        <td className="py-2">{layer.id}</td>
                                                        <td className="py-2">{layer.name}</td>
                                                        <td className="py-2">{layer.type}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )

            case "FeatureServer":
                return (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feature Service Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-semibold">Name:</div>
                                    <div>{metadata.serviceName || metadata.name || service.name}</div>

                                    <div className="font-semibold">Description:</div>
                                    <div>{metadata.description || "No description"}</div>

                                    <div className="font-semibold">Service Type:</div>
                                    <div>{metadata.serviceDescription || service.type}</div>

                                    <div className="font-semibold">Layers:</div>
                                    <div>{metadata.layers?.length || 0}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {metadata.layers && metadata.layers.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Layers ({metadata.layers.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="max-h-60 overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left py-2">ID</th>
                                                    <th className="text-left py-2">Name</th>
                                                    <th className="text-left py-2">Type</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {metadata.layers.map((layer: any) => (
                                                    <tr key={layer.id} className="border-b border-muted">
                                                        <td className="py-2">{layer.id}</td>
                                                        <td className="py-2">{layer.name}</td>
                                                        <td className="py-2">{layer.geometryType || "Unknown"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )

            case "ImageServer":
                return (
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Image Service Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="font-semibold">Name:</div>
                                    <div>{metadata.serviceName || metadata.name || service.name}</div>

                                    <div className="font-semibold">Description:</div>
                                    <div>{metadata.description || "No description"}</div>

                                    <div className="font-semibold">Image Format:</div>
                                    <div>{metadata.pixelType || "Unknown"}</div>

                                    <div className="font-semibold">Bands:</div>
                                    <div>{metadata.bandCount || "Unknown"}</div>

                                    <div className="font-semibold">Width:</div>
                                    <div>{metadata.width || "Unknown"}</div>

                                    <div className="font-semibold">Height:</div>
                                    <div>{metadata.height || "Unknown"}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )

            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>{service.type} Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-xs">
                                {JSON.stringify(metadata, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )
        }
    }

    return (
        <div className="space-y-4">
            {supportsMapPreview ? (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="map" className="flex items-center">
                            <MapIcon className="h-4 w-4 mr-2" />
                            Map Preview
                        </TabsTrigger>
                        <TabsTrigger value="info" className="flex items-center">
                            <Layers className="h-4 w-4 mr-2" />
                            Information
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="map" className="mt-4">
                        <MapPreview serviceUrl={service.url} serviceType={service.type} serviceName={service.name} />
                    </TabsContent>
                    <TabsContent value="info" className="mt-4">
                        {renderServiceInfo()}
                    </TabsContent>
                </Tabs>
            ) : (
                renderServiceInfo()
            )}
        </div>
    )
}

export default ServicePreview
