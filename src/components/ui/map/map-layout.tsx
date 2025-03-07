"use client"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import MapView from '@/components/ui/map-view';
import Search from '@/components/ui/map/search';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { BoundingBox, InfoFeature, Layer, LayoutDisplay, Location, MapboxLayerStyle, MapIsLoading, MapServiceVendor, ParsedLayer, Place } from '@/types/map.types';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { ArrowUp, Eye, EyeClosed, Fullscreen, LayersIcon, MinusIcon, PlusCircleIcon, PlusIcon, SaveAll, X } from 'lucide-react';
import mapboxgl, { ColorSpecification, DataDrivenPropertyValueSpecification, LayerSpecification, MapMouseEvent } from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import { BiArrowToTop, BiCollapse, BiLogOutCircle, BiTrash } from 'react-icons/bi';
import { CiCompass1 } from "react-icons/ci";
import { RiCompassDiscoverFill } from "react-icons/ri";
import { FiFilter } from 'react-icons/fi';
import { HiCubeTransparent } from 'react-icons/hi';
import { IoClose } from 'react-icons/io5';
import { MdOutlineStyle } from 'react-icons/md';
import { TbRouteSquare, TbZoomInAreaFilled } from 'react-icons/tb';
import { MapRef } from 'react-map-gl';
import { Button } from '../button';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { convertWMSToVectorData, fetchLayerBbox, getFeatureInfo, getWMSServices, transfromEsriServicesToFolder, } from '@/services/map-services';
import { calculateCoordinatesWithAspectRatio, searchAlternatives } from "@/tools/map-tools";
import { Datasets } from "@/types/datasets.types";
import {
    closestCorners,
    DndContext,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import * as toGeoJSON from "@tmcw/togeojson";
import * as turf from '@turf/turf';
import JSZip from "jszip";
import { signOut } from 'next-auth/react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { AiOutlineLoading3Quarters, AiOutlineSisternode } from 'react-icons/ai';
import { LuDatabase } from 'react-icons/lu';
import { WiStars } from "react-icons/wi";
import shp from 'shpjs';
import * as topojson from "topojson-client";
import { v4 } from 'uuid';
import * as wkt from "wkt";
import { ChatWithAI } from '../chat-with-ai';
import FlowDiagramWithDraggableNodes from '../flow/flow-components';
import M3U8VideoPlayer from "../hls";
import { Input } from '../input';
import AnimatedLoadingScreen from '../loading-animation-screen';
import { ScrollArea } from "../scroll-area";
import TreeDirectory from '../tree-view';
import IconLayerType from './icon-layer-type';
import LegendEsri from "./legend-esri";
import MapMenu from './map-menu';
import SortableItem from './sortable-item';
import { StylePanel } from './style-panel';


export default function MapLayout({
    layersFetch,
    datasetsFetch
}: {
    layersFetch: Layer[],
    datasetsFetch: Datasets[]
}) {

    const mapRef = useRef<MapRef | null>(null);
    const drawRef = useRef<MapboxDraw | null>(null); // Ref untuk MapboxDraw
    const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
    const [mousePosition, setMousePosition] = useState<mapboxgl.LngLat | null>(null);
    const [currentMapClick, setCurrentMapClick] = useState<Location | null>(null);
    const [displayLayouts, setDisplayLayouts] = useState<LayoutDisplay>({
        layerInfo: false,
        style: false,
        legend: false,
        addLayer: false,
        aiChat: false,
        node_workspace: false,
    });
    const [isLoading, setIsLoading] = useState<MapIsLoading>({
        initLoading: true,
        zoomToMap: false,
        featureInfo: false
    });

    const [showLoading, setShowLoading] = useState<boolean>(true)
    const [openItems, setOpenItems] = useState<string[]>([]);
    const [basemap, setBasemap] = useState([
        {
            id: "Mapbox",
            name: "Mapbox",
            url: "mapbox://styles/mapbox/streets-v9",
            thumbnail: "/assets/basemap/Light.png"
        },
        {
            id: "Mapbox Dark",
            name: "Mapbox Dark",
            url: "mapbox://styles/mapbox/dark-v11",
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
        {
            id: "Mapbox Dark 2",
            name: "Mapbox Dark 2",
            url: "mapbox://styles/adilonapsh/cm7sqa9ua00b001qubb9q0myu",
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
    const [toggleEdit, setToggleEdit] = useState<boolean>(false);
    const [datasets, setDatasets] = useState<Datasets[]>(datasetsFetch)
    const [activeDatasets, setActiveDatasets] = useState<Datasets | null>(null);

    const [zoom, setZoom] = useState<number>(0);
    const [compass, setCompass] = useState({ rotate: 0, pitch: 0, });

    const [drawMode, setDrawMode] = useState<string | null>(null);
    const [isDrawDone, setIsDrawDone] = useState<boolean>(true);


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
        setMousePosition(lngLat);
    };

    const onMapLoad = () => {
        const map = mapRef.current?.getMap();
        if (map) {
            setZoom(parseFloat(map.getZoom().toFixed(1)));
            // Load Layers
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


            // Load Draw Styles
            const customStyles = [
                {
                    id: 'gl-draw-polygon-fill',
                    type: 'fill',
                    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                    paint: {
                        'fill-color': '#2A3A75', // Warna isian
                        'fill-opacity': 0.5, // Transparansi isian
                    },
                },
                {
                    id: 'gl-draw-polygon-stroke',
                    type: 'line',
                    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                    paint: {
                        'line-color': '#1E90FF', // Warna garis tepi
                        'line-width': 2, // Ketebalan garis
                    },
                },
                {
                    id: 'gl-draw-line',
                    type: 'line',
                    filter: ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                    paint: {
                        'line-color': '#1E90FF', // Warna garis
                        'line-width': 3, // Ketebalan garis
                    },
                },
                {
                    id: 'gl-draw-point',
                    type: 'circle',
                    filter: ['all', ['==', '$type', 'Point'], ['!=', 'mode', 'static']],
                    paint: {
                        'circle-radius': 5, // Ukuran titik
                        'circle-color': '#1E90FF', // Warna titik
                        'circle-stroke-color': '#FFFFFF', // Warna Stroke
                        'circle-stroke-width': 2, // Warna Stroke
                    },
                },
            ];

            const draw = new MapboxDraw({
                displayControlsDefault: false,
                styles: customStyles,
                controls: {
                    polygon: true,
                    line_string: true,
                    point: true,
                    trash: true,
                    combine_features: false,
                    uncombine_features: false,
                },
            });

            drawRef.current = draw;
            map.addControl(draw, 'bottom-right');

            map.on('draw.create', (e: { features: GeoJSON.Feature[] }) => {
                console.log('Feature created:', e.features[0]);
                setIsDrawDone(false);
            });

            map.on('draw.update', (e: { features: GeoJSON.Feature[] }) => {
                console.log('Feature updated:', e.features[0]);
                setIsDrawDone(false);
            });

            map.on('draw.delete', (e: { features: GeoJSON.Feature[] }) => {
                console.log('Feature deleted:', e.features[0]);
            });

            map.on('draw.modechange', (e: { mode: string }) => {
                setDrawMode(e.mode);
            })

        }
        setIsLoading({ ...isLoading, initLoading: false });
        setTimeout(() => {
            setShowLoading(false);
        }, 1000);
    }

    const onStyleData = () => { }

    const onZoomEnd = () => {
        setZoom(parseFloat(mapRef.current?.getMap()?.getZoom().toFixed(1) ?? "0"));
    }

    const onRotate = () => {
        const bearing = mapRef.current?.getMap()?.getBearing();
        const pitch = mapRef.current?.getMap()?.getPitch();
        setCompass({ rotate: typeof bearing === 'number' ? bearing.toFixed(0) : 0, pitch: typeof pitch === 'number' ? pitch.toFixed(0) : 0 });
    }

    const addOrUpdateMarker = (longitude: number, latitude: number) => {
        if (marker) {
            marker.setLngLat([longitude, latitude]);
        } else {
            if (mapRef.current) {
                const map = mapRef.current.getMap();
                const newMarker = new mapboxgl.Marker({
                    color: "#000",
                    clickTolerance: 20
                })
                    .setLngLat([longitude, latitude])
                    .addTo(map);
                setMarker(newMarker);
            }
        }
    };

    const handleMapClick = async (event: MapMouseEvent) => {
        const mode = drawRef.current?.getMode();
        const map = mapRef.current?.getMap();
        const latLng: Location = event.lngLat;
        setInfoFeatures([]);
        setIsLoading({ ...isLoading, featureInfo: true })
        if (map && mode == 'simple_select') {
            addOrUpdateMarker(latLng.lng, latLng.lat)
            setCurrentMapClick({ lng: latLng.lng, lat: latLng.lat });
            setDisplayLayouts({ ...displayLayouts, layerInfo: true });
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

    const isSourceUsed = (sourceId: string): boolean => {
        const map = mapRef?.current?.getMap();
        const layers = map?.getStyle()?.layers || [];
        return layers.some((layer) => layer.source === sourceId);
    };

    const handleRemoveLayer = (index: number) => {
        const map = mapRef?.current?.getMap();
        const layerId = layers[index].id;
        if (map && layerId) {
            const layer = map.getLayer(layerId);
            const is_source_used = isSourceUsed(layer?.source ?? "")
            if (layer) {
                map.removeLayer(layerId);
                if (!is_source_used) {
                    map.removeSource(layer?.source ?? "")
                }
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
                }).catch((err) => {
                    console.log("Map reference is not defined.", err);
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

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files;
        try {
            Array.from(file).forEach(async (fl) => {
                if (fl.name.includes(".geojson")) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const geojsonData = JSON.parse(reader.result as string);
                        handleAddUploadToMap({
                            layerName: fl.name.split(".")[0].replaceAll("_", " "),
                            data: geojsonData
                        })
                    };
                    reader.readAsText(fl);
                } else if (fl.name.includes(".zip")) {
                    const buffer = await fl.arrayBuffer();
                    const shapeData = await shp(buffer);
                    handleAddUploadToMap({
                        layerName: fl.name.split(".")[0].replace(/_/g, " "),
                        data: shapeData as GeoJSON.GeoJSON
                    });
                } else if (fl.name.includes(".gpkg")) {
                    toast.error("Geopackage in progress");
                } else if (fl.name.includes(".kml")) {
                    const text = await fl.text();

                    // Parse KML into DOM
                    const parser = new DOMParser();
                    const kml = parser.parseFromString(text, "application/xml");

                    // Convert KML to GeoJSON
                    const geojson = toGeoJSON.kml(kml);
                    handleAddUploadToMap({
                        layerName: fl.name.split(".")[0].replace(/_/g, " "),
                        data: geojson as GeoJSON.GeoJSON
                    });
                } else if (fl.name.includes(".kmz")) {
                    const zip = new JSZip();
                    const content = await zip.loadAsync(fl);

                    const kmlFile = Object.keys(content.files).find((filename) =>
                        filename.endsWith(".kml")
                    );
                    if (!kmlFile) {
                        throw new Error("No KML file found in KMZ archive.");
                    }

                    const kmlText = await content.files[kmlFile].async("text");
                    const parser = new DOMParser();
                    const kml = parser.parseFromString(kmlText, "application/xml");
                    const geojson = toGeoJSON.kml(kml);
                    handleAddUploadToMap({
                        layerName: fl.name.split(".")[0].replace(/_/g, " "),
                        data: geojson as GeoJSON.GeoJSON
                    });
                } else if (fl.name.includes(".topojson")) {
                    const text = await fl.text();
                    const topojsonData = JSON.parse(text);
                    const geojson = topojson.feature(topojsonData, topojsonData.objects[Object.keys(topojsonData.objects)[0]]);
                    handleAddUploadToMap({
                        layerName: fl.name.split(".")[0].replace(/_/g, " "),
                        data: geojson as GeoJSON.GeoJSON
                    });
                } else if (fl.name.includes(".wkt")) {
                    const text = await fl.text();
                    const geojson = {
                        type: "FeatureCollection",
                        features: [{
                            type: "Feature",
                            geometry: wkt.parse(text),
                            properties: {}
                        }]
                    };
                    handleAddUploadToMap({
                        layerName: fl.name.split(".")[0].replace(/_/g, " "),
                        data: geojson as GeoJSON.GeoJSON
                    });
                } else if (fl.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const imgSrc = reader.result as string;
                        if (mousePosition) {
                            addImageToMap(imgSrc, mousePosition);
                        } else {
                            console.error("Mouse position is null. Cannot add image to map.");
                        }
                    };
                    reader.readAsDataURL(fl);
                } else {
                    throw new Error("Selected file must be .geojson, .gpkg, .kml, .kmz, .topojson, .wkt, .zip or an image.");
                }
            });
        } catch (err) {
            console.log(err);
            toast.error("Harap Masukkan File Geojson");
        }
    };

    const handleNorth = () => {
        mapRef.current?.getMap()?.easeTo({ bearing: 0, duration: 1000 });
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

    const setPaint = (paint_type: string, value: string | number | undefined) => {
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

    const resetFill = () => {
        const defaultColor = "#000000";
        setMapboxLayerStyle({ ...mapboxLayerStyle, fill: defaultColor })
        setPaint("-color", defaultColor)
    }

    const resetStroke = () => {
        const map = mapRef?.current?.getMap();
        const defaultColor = "#000000";
        if (selectedLayer && map) {
            const layerId = selectedLayer.id;
            const type = map.getLayer(layerId)?.type
            setMapboxLayerStyle({ ...mapboxLayerStyle, stroke: defaultColor })
            if (type == "fill") {
                setPaint("-outline-color", defaultColor)
            } else {
                setPaint("-stroke-color", defaultColor)
            }
        }
    }

    const resetStrokeWidth = () => {
        const strokeWidth = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, stroke_width: strokeWidth })
        setPaint("-stroke-width", strokeWidth)
    }

    const resetContrast = () => {
        const contrast = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, contrast: contrast })
        setPaint("-contrast", contrast)
    }

    const resetSaturation = () => {
        const saturation = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, saturation: saturation })
        setPaint("-saturation", saturation)
    }

    const resetBrightness = () => {
        const brightness = 0;
        setMapboxLayerStyle({ ...mapboxLayerStyle, brightness: brightness })
        setPaint("-brightness-min", brightness)
        setPaint("-brightness-max", brightness)
    }

    const handleDatasets = async () => {
        const datasets = await getWMSServices(datasetProperties.url, datasetProperties.map_service_vendor);
        setDatasetResult(datasets ?? []);
    }

    const handleSelectedDatasets = (index: number) => {
        const layer: ParsedLayer = datasetResult[index];
        const existingIndex = selectedDatasets.findIndex(dataset => dataset.index === index);
        if (existingIndex >= 0) {
            const newDatasets = [...selectedDatasets];
            newDatasets.splice(existingIndex, 1);
            setSelectedDatasets(newDatasets);
        } else {
            setSelectedDatasets([...selectedDatasets, { ...layer, index }]);
        }
        console.log(selectedDatasets);
    }

    const handleAddLayerToMap = async () => {
        selectedDatasets.forEach(dataset => {
            console.log("datasert", dataset);
            const layerId = v4();
            const layerName = dataset.title;
            const mapServiceUrl = dataset.url ? dataset.url : datasetProperties.url;
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

    const handleChangeLayerName = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const layerIndex = layers[index];
        if (layerIndex) {
            const updatedLayers = [...layers];
            updatedLayers[index] = { ...updatedLayers[index], name: event.target.value };
            setLayers(updatedLayers);
        }
    }
    // END TOOL FUNCTIONS

    const handleOnSave = () => {
        handlePrint()
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

    const handleOnExit = () => {
        window.location.assign('/admin/dashboard');
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
                        const ESRI_WMS_PARAMETER = "/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=250,250&format=png&transparent=true&f=image"
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

    const handleAddUploadToMap = async ({
        layerName,
        mapServiceUrl = "",
        layerCode = "",
        data
    }: {
        layerName: string,
        mapServiceUrl?: string,
        layerCode?: string,
        data: GeoJSON.GeoJSON
    }) => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const layerId = v4();
        const commonLayerProps = {
            map_service_url: mapServiceUrl,
            map_service_layer_name: layerCode,
            map_service_vendor: MapServiceVendor.GeoJSON,
            type: "2D",
            visible: true,
            min_zoom: 0,
            max_zoom: 24,
            status: "Local",
            rendered: 1
        };

        const geometryTypes = [...new Set((data as GeoJSON.FeatureCollection).features.map(feature => feature.geometry.type))];

        // Add source
        map.addSource(layerId, {
            type: 'geojson',
            data: data,
        });

        // Fit bounds
        const bounds: [number, number, number, number] = turf.bbox(data).slice(0, 4) as [number, number, number, number];
        map.fitBounds(bounds, {
            padding: { top: 50, bottom: 50, left: 50, right: 50 },
            duration: 1000
        });

        // Layer rendering configurations
        const layerConfigs = [
            {
                types: ["Polygon", "MultiPolygon"],
                layerType: "fill" as const,
                nameSuffix: "Polygon",
                layerProps: {
                    paint: {
                        "fill-opacity": 0.5,
                        "fill-color": "#627BC1"
                    }
                }
            },
            {
                types: ["LineString", "MultiLineString"],
                layerType: "line" as const,
                nameSuffix: "Linestring",
                layerProps: {
                    paint: {
                        "line-color": "#627BC1",
                        "line-width": 2,
                        "line-opacity": 1
                    }
                }
            },
            {
                types: ["Point", "MultiPoint"],
                layerType: "circle" as const,
                nameSuffix: "Point",
                layerProps: {
                    paint: {
                        "circle-radius": 5,
                        "circle-color": "#627BC1",
                        "circle-opacity": 1
                    }
                }
            }
        ];

        layerConfigs.forEach(config => {
            if (config.types.some(type => geometryTypes.includes(type as "Point" | "MultiPoint" | "LineString" | "MultiLineString" | "Polygon" | "MultiPolygon" | "GeometryCollection"))) {
                const layerSubId = config.layerType === "circle" ? "point" : config.layerType;
                const fullLayerId = `${layerId}-${layerSubId}`;

                // Add layer to state
                setLayers(prevLayers => [...prevLayers, {
                    ...commonLayerProps,
                    id: fullLayerId,
                    name: `${layerName} ${config.nameSuffix}`
                }]);

                map.addLayer({
                    id: fullLayerId,
                    type: config.layerType,
                    source: layerId,
                    minzoom: 0,
                    maxzoom: 24,
                    filter: ["in", "$type", config.types[0]],
                    paint: config.layerProps.paint
                });
            }
        });
    };

    const addImageToMap = (imageUrl: string, lngLat: mapboxgl.LngLat) => {
        const map = mapRef.current?.getMap();
        if (!map) return;

        const img = new window.Image();
        img.src = imageUrl;
        img.onload = () => {
            const aspectRatio = img.width / img.height;
            const sourceId = v4();
            const layerId = v4();

            const coordinates = calculateCoordinatesWithAspectRatio(lngLat, aspectRatio);

            if (coordinates.length === 4) {
                map.addSource(sourceId, {
                    type: 'image',
                    url: imageUrl,
                    coordinates: coordinates as [[number, number], [number, number], [number, number], [number, number]]
                });

                map.addLayer({
                    id: layerId,
                    type: 'raster',
                    source: sourceId
                });

                const layerName = "Image " + (layers.length + 1);

                const commonLayerProps = {
                    map_service_url: imageUrl,
                    map_service_layer_name: layerName,
                    map_service_vendor: MapServiceVendor.Image,
                    type: "2D",
                    visible: true,
                    min_zoom: 0,
                    max_zoom: 24,
                    status: "Local",
                    rendered: 1
                };

                setLayers(prevLayers => [...prevLayers, {
                    ...commonLayerProps,
                    id: layerId,
                    name: layerName
                }]);
            }
        };

    }

    const handleEditFeatures = () => {
        const map = mapRef?.current?.getMap();
        if (selectedLayer) {
            const layerId = selectedLayer.id;
            const sourceId = map?.getLayer(layerId)?.source;
            const sourceType = map?.getSource(sourceId ?? "")?.type;
            const toggleEdits = !toggleEdit;
            if (sourceType === "image") {
                setToggleEdit(toggleEdits);
                if (!toggleEdit) {
                } else {
                }
            } else {
                const data = map?.getSource(sourceId ?? "")?.serialize()
                setToggleEdit(toggleEdits);
                if (!toggleEdit) {
                    drawRef.current?.add(data.data);
                } else {
                    const features = drawRef.current?.getAll();
                    const source = map?.getSource(sourceId ?? "") as mapboxgl.GeoJSONSource
                    source.setData(features);
                    drawRef.current?.deleteAll();
                }
            }
        }
    }

    const saveFeaturesToLayer = () => {
        if (drawRef.current) {
            const features = drawRef.current.getAll();
            if (drawRef.current) {
                drawRef.current.deleteAll();
            }
            handleAddUploadToMap({
                layerName: "Untitled Layer " + layers.length + 1,
                data: features
            })
            setIsDrawDone(true)
        }
    };

    const handleFolderClick = async (e: React.MouseEventHandler, data: Datasets) => {
        setActiveDatasets(data);
        const transformedFolder = await transfromEsriServicesToFolder(data.url);
        setDatasetResult(transformedFolder ?? []);
    }

    const handlePrint = async () => {
        const map = mapRef.current;
        const mapCanvas = map?.getCanvas();
        const dataUrl = mapCanvas?.toDataURL('image/png');

        const link = document.createElement('a');
        link.download = 'map.png';
        link.href = dataUrl || '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const handleZoomIn = () => {
        mapRef.current?.getMap()?.zoomIn();
    }

    const handleZoomOut = () => {
        mapRef.current?.getMap()?.zoomOut();
    }

    // WIP
    const handleMaxLayersBbox = async () => {
        let maxBbox: number[] = [];
        const map = mapRef.current;
        if (map) {
            await map.getStyle()?.layers?.forEach(layer => {
                const features = map.queryRenderedFeatures({ layers: [layer.id] });
                if (features.length > 0) {
                    const bbox = turf.bbox({ type: "FeatureCollection", features });
                    maxBbox = bbox
                    if (maxBbox.length === 0) {
                        maxBbox = bbox;
                    } else {
                        const currentArea = (maxBbox[2] - maxBbox[0]) * (maxBbox[3] - maxBbox[1]);
                        const newArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
                        if (newArea > currentArea) {
                            maxBbox = bbox;
                        }
                    }
                }
            });
            if (maxBbox.length > 0) {
                map.fitBounds(maxBbox as any, {
                    padding: 25,
                    duration: 1000,
                });
            }
        }
    }

    const handleRoutes = async () => {
        const jawaBaratBounds = [106.75, -6.65, 106.9, -6.5]; // Approximate bounds of Kota Bogor
        const randomLng = Math.random() * (jawaBaratBounds[2] - jawaBaratBounds[0]) + jawaBaratBounds[0];
        const randomLat = Math.random() * (jawaBaratBounds[3] - jawaBaratBounds[1]) + jawaBaratBounds[1];
        const from = [randomLng, randomLat];
        const to = [106.8071939, -6.6015137]
        const alternatives = await searchAlternatives(from, to);
        const map = mapRef.current?.getMap();
        const colors = { active: "#3887ff", secondary: "#8F8F8F" }
        map?.getStyle()?.layers?.forEach(layer => {
            const layerId = layer.id;
            if (layerId.includes('route-group-')) {
                map.removeLayer(layerId);
                if (map.getSource(layerId)) {
                    map.removeSource(layerId);
                }
            }
        });
        alternatives.forEach((alternative, index: number) => {
            const routes = turf.lineString(alternative.coords);

            const bounds = turf.bbox(routes);

            map?.addLayer({
                id: `route-group-${index}`,
                type: 'line',
                source: {
                    type: 'geojson',
                    data: routes
                },
                slot: alternative.response.isFastest ? 'top' : 'bottom',
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                },
                paint: {
                    'line-color': alternative.response.isFastest ? colors.active : colors.secondary,
                    'line-width': 5,
                    'line-opacity': alternative.response.isFastest ? 1 : .8,
                }
            });

            map?.addLayer({
                id: `route-group-from-${index}`,
                type: 'circle',
                source: {
                    type: 'geojson',
                    data: turf.points([from])
                },
                paint: {
                    'circle-radius': 4,
                    'circle-color': '#3887be',
                    'circle-stroke-color': '#fff',
                    'circle-stroke-width': 2,
                }
            });

            map?.addLayer({
                id: `route-group-to-${index}`,
                type: 'circle',
                source: {
                    type: 'geojson',
                    data: turf.points([to])
                },
                paint: {
                    'circle-radius': 4,
                    'circle-color': '#3887be',
                    'circle-stroke-color': '#fff',
                    'circle-stroke-width': 2,
                }
            });

            map?.on('mouseenter', `route-group-${index}`, () => {
                if (map) {
                    map.getCanvas().style.cursor = 'pointer';
                }
            });
            
            map?.on('mouseleave', `route-group-${index}`, () => {
                if (map) {
                    map.getCanvas().style.cursor = '';
                }
            });
            
            map?.on('click', `route-group-${index}`, () => {
                if (map) {
                    // Change the clicked route to active color
                    map.setPaintProperty(
                        `route-group-${index}`,
                        'line-color',
                        colors.active
                    );
                    
                    // Bring the selected route to the top
                    map.moveLayer(`route-group-${index}`);
                    
                    // Change all other routes to secondary color
                    alternatives.forEach((_, i) => {
                        if (i !== index) {
                            map.setPaintProperty(
                                `route-group-${i}`,
                                'line-color',
                                colors.secondary
                            );
                            
                            // Also update opacity for consistency
                            map.setPaintProperty(
                                `route-group-${i}`,
                                'line-opacity',
                                0.8
                            );
                        } else {
                            // Set full opacity for the selected route
                            map.setPaintProperty(
                                `route-group-${i}`,
                                'line-opacity',
                                1
                            );
                        }
                    });
                }
            });

            map?.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                duration: 1000
            });
        });
    }


    return (
        <div className='relative h-dvh'>
            <MapView onRotate={onRotate} mapRef={mapRef} onMouseMove={onMouseMove} onClick={(event) => handleMapClick(event as MapMouseEvent)} onLoad={onMapLoad} onStyleData={onStyleData} onZoomEnd={onZoomEnd} handleDragOver={handleDragOver} handleDrop={handleDrop} />
            {showLoading && (
                <div className={`absolute top-0 h-screen w-screen flex justify-center items-center z-10 ${isLoading.initLoading ? "" : "opacity-0"} transition-all duration-500`}>
                    <AnimatedLoadingScreen />
                </div>
            )}
            <div className='absolute top-0 mt-20 ml-5 max-h-[calc(100vh-9rem)] overflow-y-auto'>
                <div className='bg-white px-5 py-2 rounded w-80 text-sm dark:bg-background'>
                    <div className='flex justify-between items-center sticky top-0 py-2 bg-white dark:bg-background'>
                        <h5 className='text-md font-bold'>Workspaces</h5>
                        <div className='flex gap-3 items-center'>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger onClick={() => signOut()}>
                                        <BiLogOutCircle size={"13pt"} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Logout</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger onClick={() => setDisplayLayouts({ ...displayLayouts, aiChat: true })}>
                                        <WiStars size={"13pt"} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>AI Chat</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
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
                                    <TooltipTrigger onClick={() => setDisplayLayouts({ ...displayLayouts, node_workspace: true })}>
                                        <AiOutlineSisternode size={"13pt"} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Node Workspaces</p>
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
                                                <AccordionTrigger className='hover:no-underline text-sm py-2 w-64 capitalize'>
                                                    <input
                                                        value={layer.name}
                                                        onChange={(e) => handleChangeLayerName(e, index)}
                                                        className="font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                                                    />
                                                </AccordionTrigger>
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
                <MapMenu onSave={handleOnSave} onExit={handleOnExit}></MapMenu>
            </div>

            <div className='absolute top-0 right-0 p-5 text-xs min-w-96' id='layerInfo'>
                {displayLayouts.layerInfo ?
                    <div className='bg-white rounded-lg max-h-[calc(100vh-15rem)] max-w-xl overflow-auto dark:bg-background'>
                        <div id='header' className='flex justify-between items-center sticky top-0 px-5 pt-5 pb-3 bg-white dark:bg-background'>
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
                                                    {Object.keys(layer.properties).map((body, i) =>
                                                        body.includes("video") ? (
                                                            <tr key={i}>
                                                                <th className='border border-accent text-start text-wrap w-[100px] capitalize px-2 py-1'>
                                                                    {body.replaceAll("_", " ")}
                                                                </th>
                                                                <td className='border border-accent text-wrap px-2'>
                                                                    {typeof layer.properties[body as keyof typeof layer.properties] === 'string' && layer.properties[body as keyof typeof layer.properties].startsWith("http") ? (
                                                                        <M3U8VideoPlayer src={layer.properties[body as keyof typeof layer.properties]} placeholderImage="/assets/placeholder.svg" />
                                                                    ) : (
                                                                        <span>{layer.properties[body as keyof typeof layer.properties]}</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            <tr key={i}>
                                                                <th className='border border-accent text-start text-wrap w-[100px] capitalize px-2 py-1'>
                                                                    {body.replaceAll("_", " ")}
                                                                </th>
                                                                <td className='border border-accent text-wrap px-2'>
                                                                    {layer.properties[body as keyof typeof layer.properties]}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
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
            <div className='absolute top-0 right-0 text-xs mt-5 mr-5 z-10'>
                {displayLayouts.style && (
                    <StylePanel
                        mapRef={mapRef}
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
                        handleEditFeatures={handleEditFeatures}
                        resetFill={resetFill}
                        resetStroke={resetStroke}
                    />
                )}
            </div>
            <div className='absolute top-0 right-0 p-5 text-xs min-w-96 z-10'>
                {displayLayouts.aiChat && (
                    <div className='bg-white rounded-lg max-h-[calc(100vh-9rem)] overflow-y-auto dark:bg-background'>
                        <div id='header' className='flex justify-between items-center sticky top-0 px-5 pt-5 pb-3 bg-white dark:bg-background'>
                            <div>
                                <p className='font-semibold mb-2 text-sm'>AI Helper</p>
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

            <div className='absolute bottom-2 right-14 mb-5 ml-28 z-[1]'>
                <div className='bg-white p-2 text-xs rounded-lg min-w-52 text-center dark:bg-background'>
                    {mousePosition?.lng.toFixed(9)}, {mousePosition?.lat.toFixed(9)}
                </div>
            </div>
            <div className='absolute bottom-14 right-14 mb-5 ml-28 z-[1]'>
                <div className='bg-white w-14 h-14 rounded-lg dark:bg-background'>
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

            {/* Zooming */}
            <div className='absolute bottom-5 left-1/2 -translate-x-1/2 z-[1]'>
                <div className="flex justify-center items-center gap-1 bg-white dark:bg-background p-1 rounded-lg">
                    <Button variant={"ghost"} size="sm" onClick={(e) => handleNorth()}><ArrowUp style={{ transform: `rotate(${-compass.rotate}deg)` }} /></Button>
                    <Button variant={"ghost"} size="sm" onClick={(e) => handleZoomOut()}><MinusIcon /></Button>
                    <label htmlFor="" className="text-xs w-5 text-center">{zoom}</label>
                    <Button variant={"ghost"} size="sm" onClick={(e) => handleZoomIn()}><PlusIcon /></Button>
                    <Button variant={"ghost"} size="sm" onClick={(e) => handleMaxLayersBbox()}><Fullscreen /></Button>
                    {!isDrawDone && (
                        <Button variant={"ghost"} size="sm" onClick={(e) => saveFeaturesToLayer()}><SaveAll /></Button>
                    )}
                    <Button variant={"ghost"} size="sm" onClick={(e) => handleRoutes()}><TbRouteSquare /></Button>
                </div>
            </div>

            {displayLayouts.legend && (
                <div className='absolute bottom-14 right-32 mb-5 ml-60'>
                    <div className='bg-white rounded-lg dark:bg-background p-2'>
                        <div className="flex justify-between items-center gap-5">
                            <h5 className='text-md font-bold'>Legend {selectedLayer?.name}</h5>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setDisplayLayouts((prev) => ({ ...prev, legend: false }));
                            }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div>
                            {selectedLayer?.map_service_vendor == "Geoserver" && (
                                <img src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}`} alt="Legend" />
                            )}
                            {selectedLayer?.map_service_vendor == "ArcGIS" && (
                                <LegendEsri url={`${selectedLayer?.map_service_url}/legend?f=json`} />
                            )}
                        </div>
                    </div>
                </div>
            )}
            {displayLayouts.node_workspace && (
                <div className='absolute top-0 h-screen w-screen left-0 rounded p-5 z-10'>
                    <div className='bg-white w-full h-full p-5 dark:bg-background'>
                        <div className='absolute flex top-0 right-0'>
                            <Button variant={"ghost"} className='rounded-full p-3' onClick={(e) => { setDisplayLayouts({ ...displayLayouts, node_workspace: false }) }}>
                                <X size={20} />
                            </Button>
                        </div>
                        <FlowDiagramWithDraggableNodes />
                    </div>
                </div>
            )}
            {displayLayouts.addLayer && (
                <div className='absolute h-screen w-screen flex justify-center items-center p-0 md:p-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-200 bg-opacity-50 backdrop-filter backdrop-blur-sm' >
                    <div className='relative h-full w-full xl:w-1/2 bg-white lg:max-h-screen  rounded-lg p-5 dark:bg-background'>
                        <div className='flex justify-between items-center'>
                            <div>
                                <p className='font-semibold'>Add Layer</p>
                                <p className='font-normal'>Add a Personalized Layer</p>
                            </div>
                            <Button variant={"link"} onClick={() => setDisplayLayouts({ ...displayLayouts, addLayer: false })}>
                                <IoClose size={"13pt"} />
                            </Button>
                        </div>
                        <div className='h-full px-2 py-5'>
                            <Tabs defaultValue="datasets" className="w-full h-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="datasets">Datasets</TabsTrigger>
                                    <TabsTrigger value="wms">WMS</TabsTrigger>
                                </TabsList>
                                <TabsContent value="wms">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>WMS</CardTitle>
                                                    <CardDescription>
                                                        Use your WMS to this map
                                                    </CardDescription>
                                                </div>
                                                {selectedDatasets.length > 0 && (<p className="text-xs">{selectedDatasets.length} Layer Selected</p>)}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className="flex flex-col gap-2 lg:flex-row items-center mb-2">
                                                <Select onValueChange={(value) => setDatasetProperties({ ...datasetProperties, map_service_vendor: value })}>
                                                    <SelectTrigger className="w-full lg:w-[180px]">
                                                        <SelectValue defaultValue={"Geoserver"} placeholder="Select Map Vendor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={MapServiceVendor.Geoserver}>Geoserver</SelectItem>
                                                        <SelectItem value={MapServiceVendor.ArcGIS}>ArcGIS</SelectItem>
                                                        {/* <SelectItem value={MapServiceVendor.GeoJSON}>Geojson</SelectItem> */}
                                                    </SelectContent>
                                                </Select>
                                                <Input type="url" placeholder="http(s)://(domain)/(path)/(to)/(wms)/wms" className='w-full' onChange={(e) => setDatasetProperties({ ...datasetProperties, url: e.currentTarget.value })} />
                                                <Button type="submit" className='w-full lg:w-auto right-0' onClick={() => handleDatasets()}>Connect</Button>
                                            </div>
                                            <div className='h-[50vh] w-full'>
                                                <div className='h-full w-full overflow-auto bg-white border p-5 mb-2 rounded-lg dark:bg-background'>
                                                    {datasetResult?.length === 0 && (
                                                        <div className="h-full flex flex-col justify-center items-center">
                                                            <LuDatabase size={"30pt"} />
                                                            <p className='font-bold'>Theres no data to show yet.</p>
                                                            <p className='text-sm'>No data available yet. Please upload or enter a valid URL to display data.</p>
                                                        </div>
                                                    )}
                                                    {datasetProperties?.map_service_vendor == "Geoserver" && (
                                                        <div className='grid grid-cols-4 gap-2'>
                                                            {datasetResult?.map((item, index) => (
                                                                <div key={index} onClick={() => handleSelectedDatasets(index)} className={`relative bg-primary rounded-lg border overflow-hidden ${selectedDatasets.some(dataset => dataset.index === index) ? 'border-primary border-2' : ''}`}>
                                                                    <img src={item?.thumbnail || ''} alt="Dataset Preview" className="bg-cover aspect-video hover:scale-105 transition-all" width={200} height={100} />
                                                                    <PlusCircleIcon size={'24'} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white bg-primary rounded-full p-2 hover:bg-primary-darker cursor-pointer ${selectedDatasets.some(dataset => dataset.index === index) ? '' : 'hidden'}`} />
                                                                    <p className="text-background text-xs px-2 text-ellipsis capitalize py-1">{item.title}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {datasetProperties?.map_service_vendor == "ArcGIS" && datasetResult?.length != 0 && (
                                                        <div>
                                                            <TreeDirectory data={datasetResult} setSelectedDatasets={setSelectedDatasets} selectedDatasets={selectedDatasets} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button className='' onClick={() => handleAddLayerToMap()}>Add To Map</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="datasets">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Datasets</CardTitle>
                                            <CardDescription>Select Your Layer</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <div className='h-[55vh] w-full'>
                                                <div className="h-full flex gap-4 overflow-auto border rounded-lg">
                                                    <ScrollArea className="h-full w-1/2 border-r">
                                                        <div className="p-2 space-y-1 ">
                                                            {datasets.map((dataset, index) => (
                                                                <Button
                                                                    key={index}
                                                                    variant="ghost"
                                                                    className={cn("w-full justify-start font-normal", activeDatasets?.id === dataset.id ? "bg-accent" : "")}
                                                                    onClick={(e) => handleFolderClick(e, dataset)}
                                                                >
                                                                    {dataset.name}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </ScrollArea>
                                                    <div className='h-full w-full rounded-lg dark:bg-background'>
                                                        {datasetResult?.length === 0 && (
                                                            <div className="h-full flex flex-col justify-center items-center">
                                                                <LuDatabase size={"30pt"} />
                                                                <p className='font-bold'>Theres no data to show yet.</p>
                                                                <p className='text-sm'>No data available yet. Please upload or enter a valid URL to display data.</p>
                                                            </div>
                                                        )}
                                                        {activeDatasets?.map_service_vendor == "Geoserver" && (
                                                            <div className='grid grid-cols-4 gap-2'>
                                                                {datasetResult?.map((item, index) => (
                                                                    <div key={index} onClick={() => handleSelectedDatasets(index)} className={"bg-blue-200 rounded-lg"}>
                                                                        <img src={item?.thumbnail || ''} alt="Dataset Preview" className="bg-cover aspect-video" width={200} height={100} />
                                                                        <PlusCircleIcon className="absolute hidden top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl w-5 h-5 group-hover/dataset:block" />
                                                                        <p className="text-xs px-2 text-ellipsis capitalize py-1">{item.title}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {activeDatasets?.map_service_vendor == "ArcGIS" && datasetResult?.length != 0 && (
                                                            <div className="relative">
                                                                <TreeDirectory data={datasetResult} setSelectedDatasets={setSelectedDatasets} selectedDatasets={selectedDatasets} activeDatasets={activeDatasets} />
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>
                                            <div className='flex justify-end'>
                                                <Button className='' onClick={() => handleAddLayerToMap()}>Add To Map</Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </div>
            )}
        </div >
    )
}