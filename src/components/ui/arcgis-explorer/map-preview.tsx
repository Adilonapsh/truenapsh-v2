"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { Loader2, Maximize, Minimize, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// Define the props for the MapPreview component
interface MapPreviewProps {
  serviceUrl: string
  serviceType: string
  serviceName: string
}

const MapPreview: React.FC<MapPreviewProps> = ({ serviceUrl, serviceType, serviceName }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [layerInfo, setLayerInfo] = useState<any>(null)
  const [imageLoading, setImageLoading] = useState(true)

  // Initialize the map when the component mounts
  useEffect(() => {
    // We need to check if we're in the browser environment
    if (typeof window === "undefined") return

    const map: any = null
    let cleanup: (() => void) | null = null

    const initializeMap = async () => {
      try {
        setLoading(true)
        setImageLoading(true)
        setError(null)

        // Fetch service metadata to get extent
        const response = await fetch(`${serviceUrl}?f=json`)
        if (!response.ok) {
          throw new Error(`Failed to fetch service metadata: ${response.statusText}`)
        }

        const serviceData = await response.json()
        setLayerInfo(serviceData)

        // Get the initial extent from the service
        let initialExtent
        if (serviceData.fullExtent) {
          initialExtent = serviceData.fullExtent
        } else if (serviceData.initialExtent) {
          initialExtent = serviceData.initialExtent
        } else if (serviceData.extent) {
          initialExtent = serviceData.extent
        } else {
          // Default to a world view if no extent is available
          initialExtent = {
            xmin: -180,
            ymin: -90,
            xmax: 180,
            ymax: 90,
            spatialReference: { wkid: 4326 },
          }
        }

        // Check if the map container exists
        if (!mapContainerRef.current) return

        // Create a simple map preview with HTML and CSS instead of Leaflet
        const container = mapContainerRef.current
        container.innerHTML = ""
        container.style.position = "relative"
        container.style.overflow = "hidden"
        container.style.backgroundColor = "#f0f0f0"

        // Create a map image element
        const mapImage = document.createElement("div")
        mapImage.style.position = "absolute"
        mapImage.style.top = "0"
        mapImage.style.left = "0"
        mapImage.style.width = "100%"
        mapImage.style.height = "100%"
        mapImage.style.backgroundSize = "cover"
        mapImage.style.backgroundPosition = "center"
        container.appendChild(mapImage)

        // Create a map overlay for the service
        if (serviceType === "MapServer") {
          // For MapServer, use the export image endpoint
          const width = container.clientWidth
          const height = container.clientHeight
          const bbox = `${initialExtent.xmin},${initialExtent.ymin},${initialExtent.xmax},${initialExtent.ymax}`
          const sr = initialExtent.spatialReference?.wkid || 4326

          const imageUrl = `${serviceUrl}/export?bbox=${bbox}&bboxSR=${sr}&layers=show:0&format=png&transparent=true&f=image&size=${width},${height}`

          // Create an actual image element to track loading
          const img = new Image()
          img.onload = () => {
            mapImage.style.backgroundImage = `url('${imageUrl}')`
            setImageLoading(false)
          }
          img.onerror = () => {
            setError("Failed to load map image")
            setImageLoading(false)
          }
          img.src = imageUrl

          // Add a base map image underneath
          const baseMapDiv = document.createElement("div")
          baseMapDiv.style.position = "absolute"
          baseMapDiv.style.top = "0"
          baseMapDiv.style.left = "0"
          baseMapDiv.style.width = "100%"
          baseMapDiv.style.height = "100%"
          baseMapDiv.style.backgroundImage =
            "url('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/0/0/0')"
          baseMapDiv.style.backgroundSize = "cover"
          baseMapDiv.style.zIndex = "-1"
          container.insertBefore(baseMapDiv, mapImage)
        } else if (serviceType === "FeatureServer") {
          // For FeatureServer, use a placeholder with service info
          mapImage.style.backgroundColor = "#e8e8e8"

          const infoDiv = document.createElement("div")
          infoDiv.style.position = "absolute"
          infoDiv.style.top = "50%"
          infoDiv.style.left = "50%"
          infoDiv.style.transform = "translate(-50%, -50%)"
          infoDiv.style.textAlign = "center"
          infoDiv.style.color = "#666"
          infoDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px;">Feature Service Preview</div>
            <div>${serviceName}</div>
            <div style="font-size: 0.8em; margin-top: 8px;">${serviceData.layers?.length || 0} layer(s)</div>
          `
          container.appendChild(infoDiv)
          setImageLoading(false)
        }

        // Add attribution
        const attribution = document.createElement("div")
        attribution.style.position = "absolute"
        attribution.style.bottom = "0"
        attribution.style.right = "0"
        attribution.style.fontSize = "10px"
        attribution.style.padding = "2px 5px"
        attribution.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
        attribution.style.color = "#333"
        attribution.innerHTML = "ArcGIS REST Services"
        container.appendChild(attribution)

        setLoading(false)

        // Set up cleanup function
        cleanup = () => {
          if (container) {
            container.innerHTML = ""
          }
        }
      } catch (err: any) {
        console.error("Error initializing map:", err)
        setError(err.message || "Failed to initialize map")
        setLoading(false)
        setImageLoading(false)
      }
    }

    initializeMap()

    // Cleanup function
    return () => {
      if (cleanup) {
        cleanup()
      }
    }
  }, [serviceUrl, serviceType, serviceName])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Refresh the map on resize by forcing a re-render
      if (mapContainerRef.current) {
        const currentWidth = mapContainerRef.current.clientWidth
        const currentHeight = mapContainerRef.current.clientHeight

        // Update any size-dependent elements
        const mapImages = mapContainerRef.current.querySelectorAll("div[style*='background-image']")
        mapImages.forEach((img: any) => {
          if (serviceType === "MapServer") {
            // Update the export image URL with new dimensions
            if (layerInfo && layerInfo.fullExtent) {
              const bbox = `${layerInfo.fullExtent.xmin},${layerInfo.fullExtent.ymin},${layerInfo.fullExtent.xmax},${layerInfo.fullExtent.ymax}`
              const sr = layerInfo.fullExtent.spatialReference?.wkid || 4326
              const imageUrl = `${serviceUrl}/export?bbox=${bbox}&bboxSR=${sr}&layers=show:0&format=png&transparent=true&f=image&size=${currentWidth},${currentHeight}`

              setImageLoading(true)
              const newImg = new Image()
              newImg.onload = () => {
                img.style.backgroundImage = `url('${imageUrl}')`
                setImageLoading(false)
              }
              newImg.onerror = () => {
                setError("Failed to load map image")
                setImageLoading(false)
              }
              newImg.src = imageUrl
            }
          }
        })
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [serviceType, serviceUrl, layerInfo])

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded)
    // Need to invalidate size after the DOM has updated
    setTimeout(() => {
      // Force a resize event to update the map
      window.dispatchEvent(new Event("resize"))
    }, 100)
  }

  return (
    <Card className={cn("overflow-hidden", expanded ? "fixed inset-4 z-50" : "")}>
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={mapContainerRef}
            className={cn("w-full bg-muted/20", expanded ? "h-[calc(100vh-2rem)]" : "h-[300px]")}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {!loading && imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <div className="text-destructive text-center p-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load map:</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button variant="secondary" size="icon" onClick={toggleExpanded} className="h-8 w-8 bg-background/80">
                {expanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {!loading && !error && layerInfo && (
            <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-2 text-xs">
              <div className="font-semibold">{serviceName}</div>
              <div className="text-muted-foreground">
                {layerInfo.layers?.length || layerInfo.sublayers?.length || 0} layer(s)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default MapPreview
