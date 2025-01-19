"use client"
import MapView from '@/components/ui/map-view'
import Search from '@/components/ui/map/search';
import { BoundingBox, InfoFeature, Layer, LayoutDisplay, Location, MapboxLayerStyle, MapIsLoading, MapServiceVendor, ParsedLayer, Place } from '@/types/map.types';
import { ColorSpecification, DataDrivenPropertyValueSpecification, LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react'
import { MapRef } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { IoClose } from 'react-icons/io5';
import { Button } from '../button';
import { Eye, EyeClosed, Folder, LayersIcon, PlusCircleIcon, PlusIcon, Repeat2Icon, UploadIcon } from 'lucide-react';
import { BiCollapse, BiGlobe, BiTrash } from 'react-icons/bi';
import { HiCubeTransparent } from 'react-icons/hi';
import { TbZoomInAreaFilled } from 'react-icons/tb';
import { MdOutlineStyle } from 'react-icons/md';
import { FiFilter } from 'react-icons/fi';
import { CiChat1 } from "react-icons/ci";

import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    closestCorners,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import SortableItem from './sortable-item';
import Image from 'next/image';
import { convertWMSToVectorData, fetchLayerBbox, getFeatureInfo, getWMSServices, } from '@/services/map-services';
import { FaVectorSquare } from 'react-icons/fa6';
import { Input } from '../input';
import { LuDatabase } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { DoubleRangeSlider } from '../double-slider';
import { ChatWithAI } from '../chat-with-ai';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { signOut, useSession } from 'next-auth/react';
import MapMenu from './map-menu';
import AnimatedLoadingScreen from '../loading-animation-screen';
import { StylePanel } from './style-panel';
import IconLayerType from './icon-layer-type';

export default function MapLayout({
    layersFetch
}: {
    layersFetch: Layer[]
}) {

    const mapRef = useRef<MapRef | null>(null);
    const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
    const [mousePosition, setMousePosition] = useState<{ lat: number; lng: number } | null>(null);
    const [currentMapClick, setCurrentMapClick] = useState<Location | null>(null);
    const [displayLayouts, setDisplayLayouts] = useState<LayoutDisplay>({
        layerInfo: false,
        style: false,
        addLayer: false,
        aiChat: false,
    });
    const [isLoading, setIsLoading] = useState<MapIsLoading>({
        initLoading: true,
        zoomToMap: false,
        featureInfo: false
    });

    const [showLoading, setShowLoading] = useState<boolean>(true)
    const [openItems, setOpenItems] = useState<string[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [basemap, setBasemap] = useState([
        {
            id: "Mapbox",
            name: "Mapbox",
            url: "mapbox://styles/mapbox/streets-v9",
            thumbnail: "/assets/basemap/Light.png"
        },
        {
            id: "Google Satellite",
            name: "Google Satellite",
            url: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga",
            thumbnail: "/assets/basemap/Satellite.png"
        },
        {
            id: "Google Street",
            name: "Google Street",
            url: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga",
            thumbnail: "/assets/basemap/googleStreets.png"
        },
    ]);
    const [layers, setLayers] = useState(layersFetch);
    const [activeBasemap, setActiveBasemap] = useState(0);
    const [mapboxLayerStyle, setMapboxLayerStyle] = useState<MapboxLayerStyle>({
        fill: "#000000",
        stroke: "#000000",
        stroke_width: 0,
        opacity: 100,
        contrast: 0,
        saturation: 0,
        brightness: [0, 1],
        zoom: [0, 24],
    })
    const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
    const [datasetProperties, setDatasetProperties] = useState({
        url: "",
        map_service_vendor: ""
    })
    const [datasetResult, setDatasetResult] = useState<ParsedLayer[]>([]);
    const [selectedDatasets, setSelectedDatasets] = useState<ParsedLayer[]>([]);
    const [infoFeatures, setInfoFeatures] = useState<InfoFeature[]>([])
    const [addLayerSettings, setAddLayerSetings] = useState({
        active: "",
    })


    // MAP FUNCTIONS
    const handleSearch = (place_result: Place) => {
        mapRef.current?.getMap()?.flyTo({
            center: [place_result.location.lng, place_result.location.lat],
            zoom: 12,
            duration: 1500,
        });
        addOrUpdateMarker(place_result.location.lng, place_result.location.lat)
    }

    const onMouseMove = (e: MapMouseEvent) => {
        const { lngLat } = e;
        setMousePosition({ lat: lngLat.lat, lng: lngLat.lng });
    };

    const onMapLoad = () => {
        const map = mapRef.current?.getMap();
        if (map) {
            layers.forEach(layer => {
                let url = "";
                if (layer.map_service_vendor == "Geoserver") {
                    const GEOSERVER_WMS_PARAMETER = "?service=WMS&version=1.1.0&request=getmap&layers={layer}&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true";
                    url = layer.map_service_url + GEOSERVER_WMS_PARAMETER.replace("{layer}", layer.map_service_layer_name)
                } else if (layer.map_service_vendor == "ArcGIS") {
                    const ESRI_WMS_PARAMETER = "/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image"
                    url = layer.map_service_url + ESRI_WMS_PARAMETER.replace("{layer}", layer.map_service_layer_name)
                }
                map.addLayer({
                    id: layer.id,
                    type: "raster",
                    source: {
                        type: "raster",
                        tiles: [url],
                        // minzoom: layer.min_zoom || 0,
                        // maxzoom: layer.max_zoom || 24,
                    },
                    minzoom: layer.min_zoom || 0,
                    maxzoom: layer.max_zoom || 24,
                    paint: {
                        "raster-opacity": layer.visible ? 1 : 0,
                    },
                });
            });
        }
        setIsLoading({ ...isLoading, initLoading: false });
        setTimeout(() => {
            setShowLoading(false);
        }, 1000);
    }

    const onStyleData = () => { }

    const addOrUpdateMarker = (longitude: number, latitude: number) => {
        if (marker) {
            marker.setLngLat([longitude, latitude]);
        } else {
            if (mapRef.current) {
                const map = mapRef.current.getMap();
                const newMarker = new mapboxgl.Marker()
                    .setLngLat([longitude, latitude])
                    .addTo(map);
                setMarker(newMarker);
            }
        }
    };

    const handleMapClick = async (event: MapMouseEvent) => {
        setIsLoading({ ...isLoading, featureInfo: true })
        const map = mapRef.current?.getMap();
        const latLng: Location = event.lngLat;
        addOrUpdateMarker(latLng.lng, latLng.lat)
        setCurrentMapClick({ lng: latLng.lng, lat: latLng.lat });
        setDisplayLayouts({ ...displayLayouts, layerInfo: true });
        setInfoFeatures([]);
        if (map) {
            const info = await getFeatureInfo(event, selectedLayer ? selectedLayer : layers, map) as InfoFeature[];
            setInfoFeatures(info);
        }
        setIsLoading({ ...isLoading, featureInfo: false });
    }

    const handleChangeBasemap = (index: number) => {
        const map = mapRef?.current?.getMap();
        if (map) {
            const bm = basemap[index];
            if (bm) {
                if (bm.id.toLowerCase().includes("mapbox")) {
                    map.setStyle(bm?.url);
                } else {
                    map.setStyle({
                        version: 8,
                        sources: {
                            "basemap": {
                                type: "raster",
                                tiles: [
                                    bm?.url
                                ],
                                tileSize: 256,
                            }
                        },
                        layers: [
                            {
                                id: "basemap-layer",
                                type: "raster",
                                source: "basemap",
                                minzoom: 0,
                                maxzoom: 24,
                                slot: "bottom"
                            }
                        ]
                    });
                }
                setActiveBasemap(index);
                setTimeout(() => {
                    setLayers(layers.map((layer, i) => i === 0 ? { ...layer, rendered: layer.rendered ? 0 + 1 : 1 } : layer));
                }, 500);
            }
        }
    }

    const setLayerVisible = (index: number, status: boolean) => {
        const map = mapRef?.current?.getMap();
        const layerId = layers[index].id;
        if (map) {
            map.setLayoutProperty(layerId, "visibility", !status ? "visible" : "none")
        }
        setLayers((prevLayers) =>
            prevLayers.map((layer) =>
                layer.id === layerId ? { ...layer, visible: !status } : layer
            )
        );
        console.log(layers)
    }

    const handleRemoveLayer = (index: number) => {
        const map = mapRef?.current?.getMap();
        const layerId = layers[index].id;
        if (map && layerId) {
            const layer = map.getLayer(layerId);
            if (layer) {
                map.removeLayer(layerId);
                map.removeSource(layer?.source ?? "")
            }
        }
        setLayers((prevLayers) => prevLayers.filter((_, i) => i !== index));
    }

    const handleZoomToLayer = async (index: number) => {
        setIsLoading({ ...isLoading, zoomToMap: true });
        const map = mapRef?.current?.getMap();
        const layer = layers[index];
        if (layer.map_service_vendor == "Geoserver") {
            const fetch = await fetchLayerBbox(layer.map_service_url, layer.map_service_layer_name);
            if (map && fetch) {
                const { minLng, minLat, maxLng, maxLat } = fetch;
                const bbox: BoundingBox = [
                    [parseFloat(minLng ?? "0"), parseFloat(minLat ?? "0")],
                    [parseFloat(maxLng ?? "0"), parseFloat(maxLat ?? "0")],
                ];
                map.fitBounds(bbox, {
                    padding: 25,
                    duration: 1000,
                });
            } else {
                console.log("Map reference is not defined.");
            }
        } else if (layer.map_service_vendor == "ArcGIS") {
            const esriURL = `${layer.map_service_url.replace("/export", "")}?f=json`;
            fetch(esriURL).then((response) => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
                .then((json) => {
                    if (json.fullExtent) {
                        const extent = {
                            minx: json.fullExtent.xmin,
                            miny: json.fullExtent.ymin,
                            maxx: json.fullExtent.xmax,
                            maxy: json.fullExtent.ymax
                        };
                        if (map) {
                            map.fitBounds([[extent.minx, extent.miny], [extent.maxx, extent.maxy]], {
                                padding: 20,
                                duration: 2000
                            });
                        }
                    } else {
                        console.error("Full extent is not available in the response.");
                    }
                }).catch((error) => {
                    console.log("Map reference is not defined.");
                });
        }
        setIsLoading({ ...isLoading, zoomToMap: false });

    }

    const handleStyleLayer = (index: number) => {
        const map = mapRef?.current?.getMap();
        setSelectedLayer(layers[index] as Layer);
        setDisplayLayouts({ ...displayLayouts, style: true })
        if (map) {
            getStyleLayer(index)
        }

    }

    const getStyleLayer = (index: number) => {
        const map = mapRef?.current?.getMap();
        const layerId = layers[index]?.id;

        if (map && layerId) {
            const layer = map.getLayer(layerId) as LayerSpecification | undefined;
            if (layer) {
                if (layer.minzoom && layer.maxzoom) {
                    setMapboxLayerStyle((prev) => ({
                        ...prev,
                        zoom: [layer.minzoom ?? 0, layer.maxzoom ?? 24],
                    }));
                }

                if (layer?.paint) {
                    // Handle opacity
                    const opacityKey = `${layer.type}-opacity` as keyof typeof layer.paint;
                    const opacity = layer.paint[opacityKey] as DataDrivenPropertyValueSpecification<number> | undefined;

                    if (opacity !== undefined) {
                        const parsedOpacity =
                            typeof opacity === "number" ? opacity : parseFloat(opacity as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            opacity: parsedOpacity * 100,
                        }));
                    }

                    // Handle fill color
                    const colorKey = `${layer.type}-color` as keyof typeof layer.paint;
                    const color = layer.paint[colorKey] as DataDrivenPropertyValueSpecification<ColorSpecification> | undefined;
                    if (color) {
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            fill: typeof color === 'string' ? color : undefined,
                        }));
                    }

                    // Handle stroke or outline color
                    const strokeKey = `${layer.type}-stroke-color` as keyof typeof layer.paint;
                    const outlineKey = `${layer.type}-outline-color` as keyof typeof layer.paint;

                    const stroke = layer.paint[strokeKey] as DataDrivenPropertyValueSpecification<ColorSpecification> | undefined;
                    const outline = layer.paint[outlineKey] as DataDrivenPropertyValueSpecification<ColorSpecification> | undefined;

                    setMapboxLayerStyle((prev) => {
                        const updatedStroke = stroke ?? outline ?? "#000000";
                        return {
                            ...prev,
                            stroke: typeof updatedStroke === 'string' ? updatedStroke : undefined,
                        };
                    });

                    // handle brightness
                    const brightnessMinKey = `${layer.type}-brightness-min` as keyof typeof layer.paint;
                    const brightnessMin = layer.paint[brightnessMinKey] as DataDrivenPropertyValueSpecification<number> | undefined;
                    const brightnessMaxKey = `${layer.type}-brightness-max` as keyof typeof layer.paint;
                    const brightnessMax = layer.paint[brightnessMaxKey] as DataDrivenPropertyValueSpecification<number> | undefined;

                    if (brightnessMin !== undefined || brightnessMax !== undefined) {
                        const parsedMinBrightness =
                            typeof brightnessMin === 'number' ? brightnessMin : parseFloat(brightnessMin as unknown as string);
                        const parsedMaxBrightness =
                            typeof brightnessMax === 'number' ? brightnessMax : parseFloat(brightnessMax as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            brightness: [parsedMinBrightness, parsedMaxBrightness],
                        }));
                    }

                    // handle saturation
                    const saturationKey = `${layer.type}-saturation` as keyof typeof layer.paint;
                    const saturation = layer.paint[saturationKey] as DataDrivenPropertyValueSpecification<number> | undefined;
                    if (saturation !== undefined) {
                        const parsedSaturation =
                            typeof saturation === 'number' ? saturation : parseFloat(saturation as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            saturation: parsedSaturation,
                        }));
                    }

                    // Handle stroke width
                    const strokeWidthKey = `${layer.type}-stroke-width` as keyof typeof layer.paint;
                    const strokeWidth = layer.paint[strokeWidthKey] as DataDrivenPropertyValueSpecification<number> | undefined;
                    if (strokeWidth !== undefined) {
                        const parsedStrokeWidth =
                            typeof strokeWidth === 'number' ? strokeWidth : parseFloat(strokeWidth as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            stroke_width: parsedStrokeWidth,
                        }));
                    }

                    // handle contrast
                    const contrastKey = `${layer.type}-contrast` as keyof typeof layer.paint;
                    const contrast = layer.paint[contrastKey] as DataDrivenPropertyValueSpecification<number> | undefined;
                    if (contrast !== undefined) {
                        const parsedContrast =
                            typeof contrast === 'number' ? contrast : parseFloat(contrast as unknown as string);
                        setMapboxLayerStyle((prev) => ({
                            ...prev,
                            contrast: parsedContrast,
                        }));
                    }

                }
            }
        }
    }

    // END MAP FUNCTIONS



    // TOOL FUNCTIONS
    const collapseAll = () => {
        setOpenItems([]);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event;
        if (active.id !== over?.id) {
            const oldIndex = layers.findIndex((layer) => layer.id === active.id);
            const newIndex = layers.findIndex((layer) => layer.id === over?.id);

            const newLayers = arrayMove(layers, oldIndex, newIndex);
            setLayers(newLayers);

            const map = mapRef.current?.getMap();
            if (map) {
                newLayers.forEach((layer, index) => {
                    const beforeId = index === 0 ? undefined : newLayers[index - 1].id;
                    try {
                        map.moveLayer(layer.id, beforeId);
                    } catch (err) {
                        console.warn("Error moving layer:", err);
                    }
                });
            }
        }
    };

    const setPaint = (paint_type: string, value: string | number) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer) {
            const layerId = selectedLayer.id;
            if (map && value) {
                const type = map.getLayer(layerId)?.type
                if (type) {
                    const paintType = type + paint_type as keyof mapboxgl.PaintSpecification;
                    map.setPaintProperty(
                        selectedLayer.id,
                        paintType,
                        value
                    );
                }
            }
        }
    }


    const setFill = (value: string) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill: value })
        setPaint("-color", value)
    }
    const setStroke = (value: string) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            const type = map.getLayer(layerId)?.type
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke: value })
            if (type == "fill") {
                setPaint("-outline-color", value)
            } else {
                setPaint("-stroke-color", value)
            }
        }
    }
    const setStrokeWidth = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: value })
        setPaint("-stroke-width", value)
    }
    const setContrast = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, contrast: value })
        setPaint("-contrast", value)
    }
    const setSaturation = (value: number) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, saturation: value })
        setPaint("-saturation", value)
    }
    const setBrightness = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, brightness: values })
        setPaint("-brightness-min", values[0])
        setPaint("-brightness-max", values[1])
    }

    const handleZoomChange = (values: number[]) => {
        setMapboxLayerStyle({ ...mapboxLayerStyle, zoom: values })
        const map = mapRef?.current?.getMap();
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            map.setLayerZoomRange(layerId, values[0], values[1])
        }
    }

    const setOpacity = (value: number) => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer) {
            const layerId = selectedLayer.id;
            const type = map?.getLayer(layerId)?.type
            const val = value / 100;
            setMapboxLayerStyle({ ...mapboxLayerStyle, opacity: value ?? 0 })
            setPaint("-opacity", val)
            if (type == "circle") {
                setPaint("-stroke-opacity", val)
            }
        }
    }


    const handleDatasets = async () => {
        const datasets = await getWMSServices(datasetProperties.url, datasetProperties.map_service_vendor);
        setDatasetResult(datasets);
    }
    const handleSelectedDatasets = (index: number) => {
        const layer: ParsedLayer = datasetResult[index];
        setSelectedDatasets([...selectedDatasets, { ...layer, index }]);
    }

    const handleAddLayerToMap = async () => {
        selectedDatasets.forEach(dataset => {
            const layerId = Math.random().toString(36).substring(7) + "_" + Date.now();
            const layerName = dataset.title;
            const mapServiceUrl = datasetProperties.url;
            const mapServiceLayerName = dataset.name;
            const mapServiceVendor = datasetProperties.map_service_vendor;
            const type = "2D";
            const visible = true;
            const minZoom = 0;
            const maxZoom = 24;
            const status = "Local";

            setLayers(prevLayers => [...prevLayers, {
                id: layerId,
                name: layerName,
                description: "",
                map_service_url: mapServiceUrl,
                map_service_layer_name: mapServiceLayerName,
                map_service_vendor: mapServiceVendor as MapServiceVendor,
                type: type,
                visible: visible,
                min_zoom: minZoom,
                max_zoom: maxZoom,
                status: status,
                rendered: 1
            }]);
        });
        setSelectedDatasets([]);
    }

    const handleConvertToVector = async (layer: Layer) => {
        const map = mapRef.current?.getMap();
        if (map) {
            toast.promise(
                convertWMSToVectorData(layer, map, layers).then(vectorLayer => {
                    if (vectorLayer) {
                        setLayers(prevLayers => [...prevLayers, ...vectorLayer]);
                    }
                }),
                {
                    loading: 'Loading...',
                    success: 'Conversion successful.',
                    error: 'Error during conversion',
                }
            );
        }
    }
    // END TOOL FUNCTIONS

    const handleOnSave = () => {
        toast.promise(new Promise((resolve, reject) => {
            setTimeout(() => {
                const rand = Math.random();
                if (rand > 0.5) {
                    resolve(null);
                }
                reject();
            }, 2000);
        }), {
            loading: 'Saving...',
            success: 'Saved successfully.',
            error: 'Failed to save.',
        })
        return;
    }

    useEffect(() => {
        const map = mapRef.current?.getMap();
        if (map) {
            layers.forEach(layer => {
                if (layer.map_service_vendor == "Geoserver" || layer.map_service_vendor == "ArcGIS") {
                    let url = "";
                    if (layer.map_service_vendor == "Geoserver") {
                        const GEOSERVER_WMS_PARAMETER = "?service=WMS&version=1.1.0&request=getmap&layers={layer}&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true";
                        url = layer.map_service_url + GEOSERVER_WMS_PARAMETER.replace("{layer}", layer.map_service_layer_name)
                    } else if (layer.map_service_vendor == "ArcGIS") {
                        const ESRI_WMS_PARAMETER = "/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image"
                        url = layer.map_service_url + ESRI_WMS_PARAMETER.replace("{layer}", layer.map_service_layer_name)
                    }
                    if (!map.getLayer(layer.id)) {
                        map.addLayer({
                            id: layer.id,
                            type: "raster",
                            source: {
                                type: "raster",
                                tiles: [url],
                                // minzoom: layer.min_zoom || 0,
                                // maxzoom: layer.max_zoom || 24,
                            },
                            minzoom: layer.min_zoom || 0,
                            maxzoom: layer.max_zoom || 24,
                            layout: {
                                "visibility": layer.visible ? "visible" : "none",
                            },
                            paint: {
                                "raster-opacity": 1,
                            },
                        });
                    }
                } else {
                    // WIP
                }
            });
        }
    }, [layers]);


    return (
        <div className='relative h-dvh'>
            <MapView mapRef={mapRef} onMouseMove={(event) => onMouseMove(event as MapMouseEvent)} onClick={(event) => handleMapClick(event as MapMouseEvent)} onLoad={onMapLoad} onStyleData={onStyleData} />
            {showLoading && (
                <div className={`absolute top-0 h-screen w-screen flex justify-center items-center z-10 ${isLoading.initLoading ? "" : "opacity-0"} transition-all duration-500`}>
                    <AnimatedLoadingScreen />
                </div>
            )}
            <div className='absolute top-0 mt-20 ml-5 max-h-[calc(100vh-9rem)] overflow-y-auto'>
                <div className='bg-white px-5 py-2 rounded w-80 text-sm'>
                    <div className='flex justify-between items-center sticky top-0 py-2 bg-white'>
                        <h5 className='text-md font-bold'>Workspaces</h5>
                        <div className='flex gap-3 items-center'>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <BiCollapse size={"13pt"} onClick={collapseAll} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Collapse All</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger onClick={() => signOut()}>
                                        <Folder size={"13pt"} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Datasets</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger onClick={() => setDisplayLayouts({ ...displayLayouts, addLayer: true })}>
                                        <PlusIcon size={"13pt"} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Add Layer</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                    {layers.length === 0 && (
                        <div className='flex flex-col justify-center items-center h-32'>
                            <LayersIcon className='mb-1' size={"20pt"} />
                            <p className='font-semibold'>You havent added any layers yet.</p>
                            <p className='text-xs'>Start adding layers to your map.</p>
                        </div>
                    )}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                    >
                        <SortableContext items={layers.map((layer) => layer.id)} strategy={verticalListSortingStrategy}>
                            <Accordion
                                type="multiple"
                                value={openItems}
                                onValueChange={(values) => setOpenItems(values)}
                            >
                                {layers.map((layer, index) => (
                                    <SortableItem key={layer.id} id={layer.id}>
                                        <AccordionItem className='border-none' value={layer.id}>
                                            <div className='flex items-center gap-2'>
                                                <IconLayerType size='13pt' layer={layer} />
                                                <AccordionTrigger className='hover:no-underline text-sm py-2 w-64 capitalize'>{layer.name}</AccordionTrigger>
                                            </div>
                                            <AccordionContent className='text-xs border-none'>
                                                <div className='flex justify-center gap-1 px-1'>
                                                    <Button variant={"ghost"} size="sm" onClick={() => setLayerVisible(index, layer.visible)}>{layer.visible ? <Eye size={"12pt"} /> : <EyeClosed size={"12pt"} />}</Button>
                                                    <Button variant={"ghost"} size="sm" onClick={() => { handleConvertToVector(layer) }}><HiCubeTransparent size={"12pt"} /></Button>
                                                    <Button variant={"ghost"} size="sm" onClick={() => handleZoomToLayer(index)}> <TbZoomInAreaFilled size={"12pt"} /></Button>
                                                    <Button variant={"ghost"} size="sm"><FiFilter size={"12pt"} /></Button>
                                                    <Button variant={"ghost"} size="sm" onClick={() => handleStyleLayer(index)}><MdOutlineStyle size={"12pt"} /></Button>
                                                    <Button variant={"ghost"} size="sm" className='text-red-700' onClick={() => handleRemoveLayer(index)}><BiTrash size={"12pt"} /></Button>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </SortableItem>
                                ))}
                            </Accordion>
                        </SortableContext>
                    </DndContext>
                </div>
            </div >
            <div className='absolute top-0 mt-5 ml-5' id='search'>
                <Search onSearch={handleSearch} />
            </div>
            <div className='absolute top-0 mt-5 ml-[22rem] font-bold'>
                <MapMenu onSave={handleOnSave}></MapMenu>
            </div>
            <div className='absolute top-0 right-0 p-5 text-xs min-w-96' id='layerInfo'>
                {displayLayouts.layerInfo ?
                    <div className='bg-white rounded-lg max-h-[calc(100vh-15rem)] max-w-xl overflow-auto'>
                        <div id='header' className='flex justify-between items-center sticky top-0 px-5 pt-5 pb-3 bg-white'>
                            <div>
                                <p className='font-semibold mb-2 text-sm'>Layer Information</p>
                                <p className='font-semibold'>
                                    Long : {currentMapClick?.lng.toFixed(9)},
                                    Lat {currentMapClick?.lat.toFixed(9)}</p>
                            </div>
                            <Button variant={"link"} onClick={() => setDisplayLayouts({ ...displayLayouts, layerInfo: false })}>
                                <IoClose size={"13pt"} />
                            </Button>
                        </div>
                        <div className='text-xs px-5'>

                            {infoFeatures.map((layer, index) => (
                                <Accordion key={index} type="single" collapsible>
                                    <AccordionItem value={`item-${index}`} className='border-none'>
                                        <AccordionTrigger className='hover:no-underline capitalize'>{layer?.layer_name}</AccordionTrigger>
                                        <AccordionContent className='text-xs'>
                                            <table className='w-full border'>
                                                <tbody>
                                                    {Object.keys(layer.properties).map((body, i) => (
                                                        <tr key={i}>
                                                            <th className='border border-gray-100 text-start text-wrap w-[100px] capitalize px-2 py-1'>{body}</th>
                                                            <td className='border border-gray-100 text-wrap px-2'>{layer.properties[body as keyof typeof layer.properties]}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ))}
                            {isLoading.featureInfo ? (
                                <div className='flex justify-center items-center mb-5'>
                                    <AiOutlineLoading3Quarters size={"20"} className='animate-spin' />
                                </div>
                            ) : ""}
                            {/* <VideoPlayer url="https://restreamer.kotabogor.go.id/memfs/2e691d1f-3e29-48b5-bfb4-2eb6cbc3ee66.m3u8" source_type="application/x-mpegURL" /> */}
                        </div>
                    </div> :
                    ""
                }
            </div>
            <div className='absolute top-0 right-0 text-xs mt-5 mr-5'>
                {displayLayouts.style && (
                    <StylePanel
                        selectedLayer={selectedLayer}
                        values={mapboxLayerStyle}
                        setValues={setMapboxLayerStyle}
                        onFillChange={setFill}
                        onStrokeChange={setStroke}
                        onStrokeWidthChange={setStrokeWidth}
                        onContrastChange={setContrast}
                        onSaturationChange={setSaturation}
                        onBrightnessChange={setBrightness}
                        onZoomChange={handleZoomChange}
                        onOpacityChange={(e) => setOpacity(e)}
                        setDisplayLayouts={setDisplayLayouts}
                        setSelectedLayer={setSelectedLayer}
                    />
                )}
            </div>
            <div className='absolute top-0 right-0 p-5 text-xs min-w-96'>
                {displayLayouts.aiChat && (
                    <div className='bg-white rounded-lg max-h-[calc(100vh-9rem)] overflow-y-auto'>
                        <div id='header' className='flex justify-between items-center sticky top-0 px-5 pt-5 pb-3 bg-white'>
                            <div>
                                <p className='font-semibold mb-2 text-sm'>AI Helper</p>
                                <p className='font-semibold'>
                                    {selectedLayer?.name}
                                </p>
                            </div>
                            <Button variant={"link"} onClick={() => {
                                setDisplayLayouts({ ...displayLayouts, aiChat: false })
                            }}>
                                <IoClose size={"13pt"} />
                            </Button>
                        </div>
                        <div>
                            <ChatWithAI />
                        </div>
                    </div>
                )}
            </div>
            <div className='absolute bottom-2 right-14 mb-5 ml-28'>
                <div className='bg-white p-2 text-xs rounded-lg min-w-52 text-center'>
                    {mousePosition?.lng.toFixed(9)}, {mousePosition?.lat.toFixed(9)}
                </div>
            </div>
            <div className='absolute bottom-14 right-14 mb-5 ml-28'>
                <div className='bg-white w-14 h-14 rounded-lg'>
                    <Popover>
                        <PopoverTrigger>
                            <div className='flex justify-center items-center h-full p-1'>
                                <Image src={basemap[activeBasemap].thumbnail} width={100} height={100} className='rounded' alt={basemap[activeBasemap].name} />
                            </div>
                        </PopoverTrigger>
                        <PopoverContent className='w-fit p-2'>
                            <div className='flex gap-2 justify-center items-center text-sm'>
                                {basemap.map((item, index) => (
                                    <div key={item.id} className='rounded-lg border h-14 w-14 p-1' onClick={() => handleChangeBasemap(index)}>
                                        <Image src={item.thumbnail} width={100} height={100} alt={item.name} className='rounded' />
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            {displayLayouts.addLayer && (
                <div className='absolute h-screen w-screen flex justify-center items-center p-0 md:p-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 bg-opacity-50 backdrop-filter backdrop-blur-sm'>
                    <div className='bg-white h-full lg:max-h-screen lg:w-1/2 rounded-lg p-5'>
                        <div className='flex justify-between items-center'>
                            <div>
                                <p className='font-semibold'>Add Layer</p>
                                <p className='font-normal'>Add a Personalized Layer</p>
                            </div>
                            <Button variant={"link"} onClick={() => setDisplayLayouts({ ...displayLayouts, addLayer: false })}>
                                <IoClose size={"13pt"} />
                            </Button>
                        </div>
                        <div className='p-5'>
                            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5">
                                <div className='flex flex-col gap-1 w-auto'>
                                    <Button variant={"outline"} className={`w-full lg:w-60 ${addLayerSettings.active == "Upload" ? "bg-gray-900 text-white" : ""}`} onClick={() => setAddLayerSetings({ active: "Upload" })}><UploadIcon />Upload</Button>
                                    <Button variant={"outline"} className={`w-full lg:w-60 ${addLayerSettings.active == "WMS Service" ? "bg-gray-900 text-white" : ""}`} onClick={() => setAddLayerSetings({ active: "WMS Service" })}><UploadIcon />WMS Service</Button>
                                </div>
                                {(addLayerSettings.active == "WMS Service") ? (
                                    <div className='w-full'>
                                        <h5 className='font-bold text-lg'>Upload with URL</h5>
                                        <hr className='my-5' />
                                        <p className='text-sm'>WMS Service URL</p>
                                        <div className="flex flex-col gap-2 lg:flex-row items-center mb-2">
                                            <Select onValueChange={(value) => setDatasetProperties({ ...datasetProperties, map_service_vendor: value })}>
                                                <SelectTrigger className="w-full lg:w-[180px]">
                                                    <SelectValue defaultValue={"Geoserver"} placeholder="Select Map Vendor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Geoserver">Geoserver</SelectItem>
                                                    <SelectItem value="Arcgis">Arcgis</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input type="url" placeholder="http(s)://(domain)/(path)/(to)/(wms)/wms" className='w-full' onChange={(e) => setDatasetProperties({ ...datasetProperties, url: e.currentTarget.value })} />
                                        </div>
                                        <div className='flex justify-end'>
                                            <Button type="submit" className='w-full lg:w-auto right-0' onClick={() => handleDatasets()}>Connect</Button>
                                        </div>
                                        <hr className='my-5' />
                                        <div className='w-full max-h-96 overflow-auto bg-gray-100 border p-5 mb-5'>
                                            {datasetResult?.length === 0 && (
                                                <div className="flex flex-col justify-center items-center">
                                                    <LuDatabase size={"30pt"} />
                                                    <p className='font-bold'>Theres no data to show yet.</p>
                                                    <p className='text-sm'>No data available yet. Please upload or enter a valid URL to display data.</p>
                                                </div>
                                            )}
                                            <div className='grid grid-cols-4 gap-2'>
                                                {datasetResult?.map((item, index) => (
                                                    <div key={index} onClick={() => handleSelectedDatasets(index)} className={"bg-blue-200 rounded-lg"}>
                                                        <img src={item?.thumbnail || ''} alt="Dataset Preview" className="bg-cover aspect-video" width={200} height={100} />
                                                        <PlusCircleIcon className="absolute hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl w-5 h-5 group-hover/dataset:block" />
                                                        <p className="text-xs px-2 text-ellipsis capitalize py-1">{item.title}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className='flex justify-end'>
                                            <Button className='float-right right-0' onClick={() => handleAddLayerToMap()}>Add To Map</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className='w-full'>
                                        <h5 className='font-bold text-lg'>Upload Layer</h5>
                                        <hr className='my-5' />
                                    </div>
                                )

                                }

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}