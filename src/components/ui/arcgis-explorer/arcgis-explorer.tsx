"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import {
    Loader2,
    ChevronRight,
    ChevronDown,
    Globe,
    MapIcon,
    ImageIcon,
    MapPin,
    RefreshCw,
    Search,
    X,
    FileJson,
    Folder,
    FolderOpen,
    AlertCircle,
    Layers,
    FileText,
    Table,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import ServicePreview from "./service-preview"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// Types
interface ArcGISLayer {
    id: number
    name: string
    type?: string
    url: string
    parentUrl: string
    geometryType?: string
}

interface ArcGISService {
    name: string
    type: string
    url: string
    lastModified?: string
    layerCount?: number
    selected?: boolean
    metadata?: any
    layers?: ArcGISLayer[]
    layersLoaded?: boolean
    layersLoading?: boolean
    layersError?: string | null
    expanded?: boolean
}

interface ArcGISFolder {
    name: string
    url: string
    expanded?: boolean
    loading?: boolean
    error?: string | null
    errorCode?: number | null
    selected?: boolean
    services?: ArcGISService[]
    folders?: string[]
    childFolders?: ArcGISFolder[]
    loaded?: boolean
}

interface ArcGISExplorerProps {
    baseUrl: string
    initialDepth?: number
    onSelectionChange: (selectedItems: string[]) => void
    searchQuery?: string
}

// Cache for API requests
const requestCache = new Map<string, any>()

// Helper function to construct proper URL paths
const constructChildUrl = (parentUrl: string, childName: string): string => {
    const parentParts = parentUrl.split("/")

    for (let i = parentParts.length - 1; i >= 0; i--) {
        if (parentParts[i] === childName) {
            const basePath = parentParts.slice(0, i + 1).join("/")
            return basePath
        }
    }
    // If no match is found, append the child name to the parent URL
    return `${parentUrl}/${childName}`
}

// Helper function to construct service URL
const constructServiceUrl = (folderUrl: string, serviceName: string, serviceType: string): string => {
    // First check if the service name is already in the path
    const folderParts = folderUrl.split("/")
    let serviceUrl = folderUrl

    const serviceFormat = serviceName.replace(folderParts[folderParts.length - 1] + "/", "")

    // If the service name is not already the last part of the URL, append it
    if (folderParts[folderParts.length - 1] !== serviceName) {
        serviceUrl = `${folderUrl}/${serviceFormat}`
    }

    // Always append the service type
    return `${serviceUrl}/${serviceType}`
}

const ArcGISExplorer: React.FC<ArcGISExplorerProps> = ({
    baseUrl,
    initialDepth = 0,
    onSelectionChange,
    searchQuery = "",
}) => {
    const [rootFolder, setRootFolder] = useState<ArcGISFolder | null>(null)
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [search, setSearch] = useState<string>(searchQuery)
    const [selectedService, setSelectedService] = useState<ArcGISService | null>(null)
    const [selectedLayer, setSelectedLayer] = useState<ArcGISLayer | null>(null)
    const [breadcrumbs, setBreadcrumbs] = useState<{ name: string; url: string }[]>([])

    const abortControllerRef = useRef<AbortController | null>(null)

    // Function to fetch data with retry logic
    const fetchWithRetry = useCallback(async (url: string, retries = 3, backoff = 300) => {
        // Check cache first
        if (requestCache.has(url)) {
            return requestCache.get(url)
        }

        // Create new abort controller for this request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                // Add JSON format parameter if not already present
                const requestUrl = url.includes("?") ? `${url}&f=json` : `${url}?f=json`

                // Set up timeout
                const timeoutId = setTimeout(() => {
                    if (abortControllerRef.current) {
                        abortControllerRef.current.abort()
                    }
                }, 2000)

                const response = await fetch(requestUrl, {
                    signal: abortControllerRef.current.signal,
                })
                clearTimeout(timeoutId)

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`)
                }

                const data = await response.json()
                // Cache the result
                requestCache.set(url, data)
                return data
            } catch (err: any) {
                if (err.name === "AbortError") {
                    throw new Error("Request timed out")
                }

                // If we've used all retries, throw the error
                if (attempt === retries - 1) {
                    throw err
                }

                // Otherwise wait with exponential backoff
                await new Promise((resolve) => setTimeout(resolve, backoff * Math.pow(2, attempt)))
            }
        }
    }, [])

    // Function to load folder contents
    const loadFolder = useCallback(
        async (folderUrl: string): Promise<ArcGISFolder> => {
            try {
                const data = await fetchWithRetry(folderUrl)

                const folder: ArcGISFolder = {
                    name: folderUrl === baseUrl ? "Root" : folderUrl.split("/").pop() || "",
                    url: folderUrl,
                    expanded: false,
                    loading: false,
                    error: null,
                    errorCode: null,
                    services: [],
                    folders: data.folders || [],
                    childFolders: [],
                    loaded: true,
                }

                // Process services
                if (data.services) {
                    folder.services = data.services.map((service: any) => ({
                        name: service.name,
                        type: service.type,
                        url: constructServiceUrl(folderUrl, service.name, service.type),
                        selected: false,
                        expanded: false,
                        layersLoaded: false,
                    }))
                }

                return folder
            } catch (err: any) {
                // Extract error code if available
                let errorCode = null
                if (err.message && err.message.includes("Status: ")) {
                    const statusMatch = err.message.match(/Status: (\d+)/)
                    if (statusMatch && statusMatch[1]) {
                        errorCode = Number.parseInt(statusMatch[1], 10)
                    }
                }

                return {
                    name: folderUrl === baseUrl ? "Root" : folderUrl.split("/").pop() || "",
                    url: folderUrl,
                    expanded: false,
                    loading: false,
                    error: err.message,
                    errorCode,
                    services: [],
                    folders: [],
                    loaded: true,
                }
            }
        },
        [baseUrl, fetchWithRetry],
    )

    // Function to load service layers
    const loadServiceLayers = useCallback(
        async (service: ArcGISService): Promise<ArcGISService> => {
            try {
                const data = await fetchWithRetry(service.url)

                const updatedService = { ...service, layersLoading: false, layersLoaded: true, layersError: null }

                // Process layers
                if (data.layers) {
                    updatedService.layers = data.layers.map((layer: any) => ({
                        id: layer.id,
                        name: layer.name,
                        type: layer.type,
                        geometryType: layer.geometryType,
                        url: `${service.url}/${layer.id}`,
                        parentUrl: service.url,
                    }))
                    updatedService.layerCount = data.layers.length
                } else if (data.sublayers) {
                    // Some services use 'sublayers' instead of 'layers'
                    updatedService.layers = data.sublayers.map((layer: any) => ({
                        id: layer.id,
                        name: layer.name,
                        type: layer.type,
                        url: `${service.url}/${layer.id}`,
                        parentUrl: service.url,
                    }))
                    updatedService.layerCount = data.sublayers.length
                } else {
                    updatedService.layers = []
                    updatedService.layerCount = 0
                }

                return updatedService
            } catch (err: any) {
                return {
                    ...service,
                    layersLoading: false,
                    layersLoaded: true,
                    layersError: err.message,
                    layers: [],
                }
            }
        },
        [fetchWithRetry],
    )

    // Initial load
    useEffect(() => {
        const initializeExplorer = async () => {
            setLoading(true)
            setError(null)

            try {
                const rootData = await loadFolder(baseUrl)

                // Prepare child folders but don't load them yet
                if (rootData.folders && rootData.folders.length > 0) {
                    rootData.childFolders = rootData.folders.map((childName) => ({
                        name: childName,
                        url: constructChildUrl(baseUrl, childName),
                        expanded: false,
                        loading: false,
                        error: null,
                        errorCode: null,
                        services: [],
                        folders: [],
                        childFolders: [],
                        loaded: false,
                    }))
                }

                setRootFolder(rootData)
                setBreadcrumbs([{ name: "Root", url: baseUrl }])
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        initializeExplorer()

        // Cleanup function
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [baseUrl, loadFolder])

    // Update selected items when selection changes
    useEffect(() => {
        onSelectionChange(selectedItems)
    }, [selectedItems, onSelectionChange])

    // Handle search query changes
    useEffect(() => {
        setSearch(searchQuery)
    }, [searchQuery])

    // Toggle folder expansion and load contents if needed
    const toggleFolder = async (folder: ArcGISFolder) => {
        if (!rootFolder) return

        // Function to update a folder in the tree
        const updateFolder = (current: ArcGISFolder): ArcGISFolder => {
            if (current.url === folder.url) {
                // If we're expanding and haven't loaded children yet
                if (!current.expanded && (!current.loaded || current.error)) {
                    // Mark as loading and expanded
                    return { ...current, expanded: true, loading: true, error: null, errorCode: null }
                }
                // Just toggle expansion for already loaded folders
                return { ...current, expanded: !current.expanded }
            }

            // Recursively update child folders
            if (current.childFolders) {
                return {
                    ...current,
                    childFolders: current.childFolders.map(updateFolder),
                }
            }

            return current
        }

        // Update the folder state
        const updatedRoot = updateFolder(rootFolder)
        setRootFolder(updatedRoot)

        // If we're expanding and need to load children
        if (!folder.loaded || folder.error) {
            try {
                // Fetch the folder contents
                const updatedFolder = await loadFolder(folder.url)

                // If there are subfolders, prepare them (but don't load their contents yet)
                if (updatedFolder.folders && updatedFolder.folders.length > 0) {
                    updatedFolder.childFolders = updatedFolder.folders.map((childName) => ({
                        name: childName,
                        url: constructChildUrl(folder.url, childName),
                        expanded: false,
                        loading: false,
                        error: null,
                        errorCode: null,
                        services: [],
                        folders: [],
                        childFolders: [],
                        loaded: false,
                    }))
                }

                // Update the folder with loaded data
                const updateFolderWithData = (current: ArcGISFolder): ArcGISFolder => {
                    if (current.url === folder.url) {
                        return {
                            ...current,
                            ...updatedFolder,
                            expanded: true,
                            loading: false,
                            error: null,
                            errorCode: null,
                        }
                    }

                    if (current.childFolders) {
                        return {
                            ...current,
                            childFolders: current.childFolders.map(updateFolderWithData),
                        }
                    }

                    return current
                }

                setRootFolder(updateFolderWithData(updatedRoot))
            } catch (err: any) {
                // Extract error code if available
                let errorCode = null
                if (err.message && err.message.includes("Status: ")) {
                    const statusMatch = err.message.match(/Status: (\d+)/)
                    if (statusMatch && statusMatch[1]) {
                        errorCode = Number.parseInt(statusMatch[1], 10)
                    }
                }

                // Update the folder with error
                const updateFolderWithError = (current: ArcGISFolder): ArcGISFolder => {
                    if (current.url === folder.url) {
                        return {
                            ...current,
                            error: err.message,
                            errorCode,
                            loading: false,
                            expanded: true,
                        }
                    }

                    if (current.childFolders) {
                        return {
                            ...current,
                            childFolders: current.childFolders.map(updateFolderWithError),
                        }
                    }

                    return current
                }

                setRootFolder(updateFolderWithError(updatedRoot))
            }
        }
    }

    // Toggle service expansion and load layers if needed
    const toggleService = async (service: ArcGISService) => {
        if (!rootFolder) return

        // Function to update a service in the tree
        const updateService = (current: ArcGISFolder): ArcGISFolder => {
            return {
                ...current,
                services: current.services?.map((s) => {
                    if (s.url === service.url) {
                        // If we're expanding and haven't loaded layers yet
                        if (!s.expanded && (!s.layersLoaded || s.layersError)) {
                            // Mark as loading and expanded
                            return { ...s, expanded: true, layersLoading: true, layersError: null }
                        }
                        // Just toggle expansion for already loaded services
                        return { ...s, expanded: !s.expanded }
                    }
                    return s
                }),
                childFolders: current.childFolders?.map(updateService),
            }
        }

        // Update the service state
        const updatedRoot = updateService(rootFolder)
        setRootFolder(updatedRoot)

        // If we're expanding and need to load layers
        if (!service.layersLoaded || service.layersError) {
            try {
                // Fetch the service layers
                const updatedService = await loadServiceLayers(service)

                // Update the service with loaded layers
                const updateServiceWithLayers = (current: ArcGISFolder): ArcGISFolder => {
                    return {
                        ...current,
                        services: current.services?.map((s) => (s.url === service.url ? updatedService : s)),
                        childFolders: current.childFolders?.map(updateServiceWithLayers),
                    }
                }

                setRootFolder(updateServiceWithLayers(updatedRoot))
            } catch (err: any) {
                // Update the service with error
                const updateServiceWithError = (current: ArcGISFolder): ArcGISFolder => {
                    return {
                        ...current,
                        services: current.services?.map((s) =>
                            s.url === service.url ? { ...s, layersError: err.message, layersLoading: false, expanded: true } : s,
                        ),
                        childFolders: current.childFolders?.map(updateServiceWithError),
                    }
                }

                setRootFolder(updateServiceWithError(updatedRoot))
            }
        }
    }

    // Toggle service selection
    const toggleServiceSelection = (service: ArcGISService) => {
        if (!rootFolder) return

        const serviceUrl = service.url

        if (selectedItems.includes(serviceUrl)) {
            setSelectedItems(selectedItems.filter((url) => url !== serviceUrl))
        } else {
            setSelectedItems([...selectedItems, serviceUrl])
        }
    }

    // Toggle layer selection
    const toggleLayerSelection = (layer: ArcGISLayer) => {
        if (!rootFolder) return

        const layerUrl = layer.url

        if (selectedItems.includes(layerUrl)) {
            setSelectedItems(selectedItems.filter((url) => url !== layerUrl))
        } else {
            setSelectedItems([...selectedItems, layerUrl])
        }
    }

    // Select a service to view details
    const selectService = (service: ArcGISService) => {
        setSelectedService(service)
        setSelectedLayer(null)
    }

    // Select a layer to view details
    const selectLayer = (layer: ArcGISLayer) => {
        setSelectedLayer(layer)
        setSelectedService(null)
    }

    // Toggle folder selection (selects all services in the folder)
    const toggleFolderSelection = (folder: ArcGISFolder) => {
        if (!rootFolder) return

        const getAllServiceUrls = (folder: ArcGISFolder): string[] => {
            let urls: string[] = []

            if (folder.services) {
                urls = urls.concat(folder.services.map((service) => service.url))
            }

            if (folder.childFolders) {
                folder.childFolders.forEach((childFolder) => {
                    urls = urls.concat(getAllServiceUrls(childFolder))
                })
            }

            return urls
        }

        const folderServiceUrls = getAllServiceUrls(folder)

        // Check if all services in the folder are already selected
        const allSelected = folderServiceUrls.length > 0 && folderServiceUrls.every((url) => selectedItems.includes(url))

        if (allSelected) {
            // Deselect all services in the folder
            setSelectedItems(selectedItems.filter((url) => !folderServiceUrls.includes(url)))
        } else {
            // Select all services in the folder
            const newSelectedItems = [...selectedItems]
            folderServiceUrls.forEach((url) => {
                if (!newSelectedItems.includes(url)) {
                    newSelectedItems.push(url)
                }
            })
            setSelectedItems(newSelectedItems)
        }
    }

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
    }

    const clearSearch = () => {
        setSearch("")
    }

    // Check if an item matches the search query
    const matchesSearch = (name: string, type?: string): boolean => {
        if (!search) return true

        const searchLower = search.toLowerCase()
        return name.toLowerCase().includes(searchLower) || (type && type.toLowerCase().includes(searchLower))
    }

    // Recursively render a folder and its contents
    const renderFolder = (folder: ArcGISFolder, depth = 0): JSX.Element => {
        // Check if folder or any of its contents match the search
        const folderMatches = matchesSearch(folder.name)

        const servicesMatch = folder.services?.some((service) => matchesSearch(service.name, service.type)) || false

        const childFoldersMatch =
            folder.childFolders?.some(
                (childFolder) =>
                    matchesSearch(childFolder.name) ||
                    childFolder.services?.some((service) => matchesSearch(service.name, service.type)),
            ) || false

        // If nothing matches the search and we have a search term, don't render
        if (search && !folderMatches && !servicesMatch && !childFoldersMatch) {
            return <></>
        }

        // Get all service URLs in this folder and its children
        const getAllServiceUrls = (f: ArcGISFolder): string[] => {
            let urls: string[] = []

            if (f.services) {
                urls = urls.concat(f.services.map((service) => service.url))
            }

            if (f.childFolders) {
                f.childFolders.forEach((childFolder) => {
                    urls = urls.concat(getAllServiceUrls(childFolder))
                })
            }

            return urls
        }

        const folderServiceUrls = getAllServiceUrls(folder)
        const allSelected = folderServiceUrls.length > 0 && folderServiceUrls.every((url) => selectedItems.includes(url))
        const someSelected = folderServiceUrls.some((url) => selectedItems.includes(url))

        // Get folder icon based on type
        const getFolderIcon = () => {
            if (folder.name.toLowerCase().includes("map")) {
                return <MapIcon className="h-4 w-4 mr-1 text-blue-500" />
            } else if (folder.name.toLowerCase().includes("gis")) {
                return <Globe className="h-4 w-4 mr-1 text-green-500" />
            } else if (folder.name.toLowerCase().includes("batas") || folder.name.toLowerCase().includes("administratif")) {
                return <Layers className="h-4 w-4 mr-1 text-orange-500" />
            } else {
                return folder.expanded ? (
                    <FolderOpen className="h-4 w-4 mr-1 text-yellow-500" />
                ) : (
                    <Folder className="h-4 w-4 mr-1 text-yellow-500" />
                )
            }
        }

        return (
            <div key={folder.url} className="select-none">
                <div
                    className={cn(
                        "flex items-center py-1 px-1 hover:bg-muted/50 rounded",
                        folderMatches && search ? "bg-yellow-500/10" : "",
                    )}
                    style={{ paddingLeft: `${depth * 16}px` }}
                >
                    <Checkbox
                        checked={allSelected}
                        className={cn("mr-1", someSelected && !allSelected ? "bg-primary/50" : "")}
                        onCheckedChange={() => toggleFolderSelection(folder)}
                    />

                    <button onClick={() => toggleFolder(folder)} className="flex items-center flex-1 text-left">
                        {folder.expanded ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                        {getFolderIcon()}
                        <span className={cn("font-medium", folderMatches && search ? "bg-yellow-500/30" : "")}>{folder.name}</span>
                    </button>
                </div>

                {/* Error message */}
                {folder.error && folder.expanded && (
                    <div className="flex items-center py-1 text-destructive" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                        <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
                        <span className="text-sm">
                            Connection failed: {folder.error} {folder.errorCode ? `(${folder.errorCode})` : ""}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleFolder(folder)
                            }}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                {/* Loading indicator */}
                {folder.loading && (
                    <div className="flex items-center py-1" style={{ paddingLeft: `${(depth + 1) * 16}px` }}>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                )}

                {/* Render services */}
                {folder.expanded && folder.services && folder.services.length > 0 && (
                    <div>
                        {folder.services.map((service) => {
                            // Skip if doesn't match search
                            if (search && !matchesSearch(service.name, service.type)) {
                                return null
                            }

                            // Get icon based on service type
                            const getServiceIcon = () => {
                                switch (service.type) {
                                    case "MapServer":
                                        return <MapIcon className="h-4 w-4 mr-1 text-blue-500" />
                                    case "FeatureServer":
                                        return <MapPin className="h-4 w-4 mr-1 text-red-500" />
                                    case "ImageServer":
                                        return <ImageIcon className="h-4 w-4 mr-1 text-purple-500" />
                                    case "GeocodeServer":
                                        return <MapPin className="h-4 w-4 mr-1 text-green-500" />
                                    default:
                                        return <FileJson className="h-4 w-4 mr-1 text-orange-500" />
                                }
                            }

                            return (
                                <div key={service.url}>
                                    <div
                                        className={cn(
                                            "flex items-center py-1 px-1 hover:bg-muted/50 rounded cursor-pointer",
                                            selectedItems.includes(service.url) ? "bg-muted/70" : "",
                                            selectedService?.url === service.url ? "bg-primary/20" : "",
                                            matchesSearch(service.name, service.type) && search ? "bg-yellow-500/10" : "",
                                        )}
                                        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
                                        onClick={() => selectService(service)}
                                    >
                                        <Checkbox
                                            checked={selectedItems.includes(service.url)}
                                            className="mr-1"
                                            onCheckedChange={() => toggleServiceSelection(service)}
                                            onClick={(e) => e.stopPropagation()} // Prevent triggering service selection
                                        />
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation() // Prevent triggering service selection
                                                toggleService(service)
                                            }}
                                            className="mr-1"
                                        >
                                            {service.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                        <div className="flex items-center flex-1">
                                            {getServiceIcon()}
                                            <span className={cn("mr-2", matchesSearch(service.name) && search ? "bg-yellow-500/30" : "")}>
                                                {service.name}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {service.type}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Service layers loading indicator */}
                                    {service.layersLoading && (
                                        <div className="flex items-center py-1" style={{ paddingLeft: `${(depth + 2) * 16}px` }}>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Loading layers...</span>
                                        </div>
                                    )}

                                    {/* Service layers error message */}
                                    {service.layersError && service.expanded && (
                                        <div
                                            className="flex items-center py-1 text-destructive"
                                            style={{ paddingLeft: `${(depth + 2) * 16}px` }}
                                        >
                                            <AlertCircle className="h-4 w-4 mr-1 text-destructive" />
                                            <span className="text-sm">Failed to load layers: {service.layersError}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 ml-1"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleService(service)
                                                }}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Render service layers */}
                                    {service.expanded && service.layers && service.layers.length > 0 && (
                                        <div>
                                            {service.layers.map((layer) => {
                                                // Skip if doesn't match search
                                                if (search && !matchesSearch(layer.name, layer.type)) {
                                                    return null
                                                }

                                                // Get icon based on layer type or geometry type
                                                const getLayerIcon = () => {
                                                    if (layer.geometryType) {
                                                        switch (layer.geometryType) {
                                                            case "esriGeometryPoint":
                                                                return <MapPin className="h-4 w-4 mr-1 text-red-500" />
                                                            case "esriGeometryPolyline":
                                                                return <Layers className="h-4 w-4 mr-1 text-blue-500" />
                                                            case "esriGeometryPolygon":
                                                                return <Layers className="h-4 w-4 mr-1 text-green-500" />
                                                            default:
                                                                return <FileText className="h-4 w-4 mr-1 text-orange-500" />
                                                        }
                                                    } else {
                                                        return <Table className="h-4 w-4 mr-1 text-purple-500" />
                                                    }
                                                }

                                                return (
                                                    <div
                                                        key={layer.url}
                                                        className={cn(
                                                            "flex items-center py-1 px-1 hover:bg-muted/50 rounded cursor-pointer",
                                                            selectedItems.includes(layer.url) ? "bg-muted/70" : "",
                                                            selectedLayer?.url === layer.url ? "bg-primary/20" : "",
                                                            matchesSearch(layer.name, layer.type) && search ? "bg-yellow-500/10" : "",
                                                        )}
                                                        style={{ paddingLeft: `${(depth + 2) * 16}px` }}
                                                        onClick={() => selectLayer(layer)}
                                                    >
                                                        <Checkbox
                                                            checked={selectedItems.includes(layer.url)}
                                                            className="mr-1"
                                                            onCheckedChange={() => toggleLayerSelection(layer)}
                                                            onClick={(e) => e.stopPropagation()} // Prevent triggering layer selection
                                                        />
                                                        <div className="flex items-center flex-1">
                                                            {getLayerIcon()}
                                                            <span
                                                                className={cn("mr-2", matchesSearch(layer.name) && search ? "bg-yellow-500/30" : "")}
                                                            >
                                                                {layer.name}
                                                            </span>
                                                            {layer.id !== undefined && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    ID: {layer.id}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Render child folders */}
                {folder.expanded && folder.childFolders && folder.childFolders.length > 0 && (
                    <div>{folder.childFolders.map((childFolder) => renderFolder(childFolder, depth + 1))}</div>
                )}
            </div>
        )
    }

    // Main render
    return (
        <div className="flex h-full border rounded-md overflow-hidden bg-background">
            {/* Left panel - Tree view */}
            <div className="w-80 border-r flex flex-col h-full">
                <div className="p-2 border-b flex items-center bg-muted/30">
                    <Globe className="h-5 w-5 mr-2" />
                    <h2 className="font-semibold">Layers</h2>
                </div>

                <div className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search files..." value={search} onChange={handleSearch} className="pl-8 pr-8" />
                        {search && (
                            <button className="absolute right-2 top-2.5" onClick={clearSearch}>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-1">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading services...</span>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-destructive p-4">
                            <p className="mb-2">{error}</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setLoading(true)
                                    setError(null)
                                    loadFolder(baseUrl)
                                        .then((data) => {
                                            // Prepare child folders but don't load them yet
                                            if (data.folders && data.folders.length > 0) {
                                                data.childFolders = data.folders.map((childName) => ({
                                                    name: childName,
                                                    url: constructChildUrl(baseUrl, childName),
                                                    expanded: false,
                                                    loading: false,
                                                    error: null,
                                                    errorCode: null,
                                                    services: [],
                                                    folders: [],
                                                    childFolders: [],
                                                    loaded: false,
                                                }))
                                            }

                                            setRootFolder(data)
                                            setLoading(false)
                                        })
                                        .catch((err) => {
                                            setError(err.message)
                                            setLoading(false)
                                        })
                                }}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                        </div>
                    ) : rootFolder ? (
                        renderFolder(rootFolder)
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p>No data available</p>
                        </div>
                    )}
                </div>

                {selectedItems.length > 0 && (
                    <div className="p-2 border-t bg-muted/30">
                        <p className="text-sm text-muted-foreground">
                            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                        </p>
                    </div>
                )}
            </div>

            {/* Right panel - Preview */}
            <div className="flex-1 flex flex-col h-full">
                <div className="p-2 border-b bg-muted/30">
                    <h3 className="font-mono text-sm truncate">
                        {selectedLayer
                            ? `Layer: ${selectedLayer.name} (ID: ${selectedLayer.id})`
                            : selectedService
                                ? `${selectedService.name}.${selectedService.type.toLowerCase()}`
                                : "No item selected"}
                    </h3>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-muted/10">
                    {selectedService ? (
                        <ServicePreview service={selectedService} />
                    ) : selectedLayer ? (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="p-4">
                                    <h3 className="text-lg font-semibold mb-2">Layer Information</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="font-medium">Name:</div>
                                        <div>{selectedLayer.name}</div>
                                        <div className="font-medium">ID:</div>
                                        <div>{selectedLayer.id}</div>
                                        <div className="font-medium">Type:</div>
                                        <div>{selectedLayer.type || "Unknown"}</div>
                                        <div className="font-medium">Geometry Type:</div>
                                        <div>{selectedLayer.geometryType || "Unknown"}</div>
                                        <div className="font-medium">URL:</div>
                                        <div className="truncate">{selectedLayer.url}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <p>No content available for preview</p>
                        </div>
                    )}
                </div>

                {(selectedService || selectedLayer) && (
                    <div className="border-t p-3">
                        <div className="text-sm">
                            <h3 className="font-semibold mb-2">File Info</h3>
                            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-mono">
                                    {selectedLayer ? "Layer" : selectedService ? selectedService.type : "-"}
                                </span>

                                <span className="text-muted-foreground">ID:</span>
                                <span className="font-mono">{selectedLayer ? selectedLayer.id : "-"}</span>

                                <span className="text-muted-foreground">Path:</span>
                                <span className="font-mono text-xs truncate">
                                    {selectedLayer ? selectedLayer.url : selectedService ? selectedService.url : "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ArcGISExplorer
