import React from 'react'
import { Button } from '../button'
import { IoClose } from 'react-icons/io5'
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '../tabs'
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '../card'
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../accordion"
import { Checkbox } from "../checkbox"
import { RadioGroup, RadioGroupItem } from "../radio-group"
import { DynamicTable } from '../dynamic-table'
import { LuTrash2, LuFileJson, LuFileStack, LuPlus } from 'react-icons/lu'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../resizable'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { ScrollArea } from '../scroll-area'
import { LuDatabase } from 'react-icons/lu'
import TreeDirectory from '../tree-view'
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from '../select'
import { Input } from '../input'
import useLayerStore from '@/stores/layer'
import { Layer, MapServiceVendor } from '@/types/map.types'
import { Datasets } from '@/types/datasets.types'
import useDatasetStore from '@/stores/datasets'
import { v4 } from 'uuid'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/stores/map'
import { getWMSServices } from '@/services/map-services'
import { findLayerConfigByGeometryType } from '@/tools/map-tools'
import toast from 'react-hot-toast'
import { addGeojsonToMap } from '@/tools/map-tools'
import { processCSV, csvToGeoJSON, getFileHandler, getLayerName } from '@/tools/map-utility'
import { Label } from '../label'
import { LuUpload } from 'react-icons/lu'
import { Slider } from '../slider'
import { ColorPicker } from '../color-picker'


interface UploadedFileConfig {
    id: string;
    file: File;
    name: string;
    ext: string;
    fileType: 'csv' | 'geojson' | 'geotiff' | 'image' | 'video' | '3d' | 'other';
    options: {
        encoding: string;
        delimiter: string;
        headerLinesToDiscard: number;
        firstRecordHasFieldNames: boolean;
        detectFieldTypes: boolean;
        decimalSeparatorIsComma: boolean;
        trimFields: boolean;
        discardEmptyFields: boolean;
        geometryType: 'point' | 'wkt' | 'none';
        latField: string;
        lngField: string;
        wktField: string;
        crs: string;
        modelScale: number[];
        modelRotation: number[];
        modelPosition: [number, number];
    };
    headers: string[];
    rows: any[];
    rawData: string[][];
    preview?: string; // For image/video preview
}

export default function AddLayerModal() {

    const { layers, addLayer } = useLayerStore();
    const { datasets, selectedDatasets, setSelectedDatasets, datasetProperties, activeDataset, setActiveDataset, datasetResult, setDatasetResult, setDatasetProperties } = useDatasetStore();
    const { isLoading, setIsLoading, displayLayouts, setDisplayLayouts } = useMapStore();
    const { map } = useMapStore();

    const [uploadedFiles, setUploadedFiles] = React.useState<UploadedFileConfig[]>([]);
    const [selectedFileId, setSelectedFileId] = React.useState<string | null>(null);

    const selectedFile = uploadedFiles.find(f => f.id === selectedFileId);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const mapInstance = map?.current?.getMap();
        const newFiles: UploadedFileConfig[] = [];

        for (const file of files) {
            const ext = file.name.split('.').pop()?.toLowerCase() || '';
            const id = v4();

            let headers: string[] = [];
            let rows: any[] = [];
            let rawData: string[][] = [];
            let fileType: 'csv' | 'geojson' | 'geotiff' | 'image' | 'video' | '3d' | 'other' = 'other';
            let preview: string | undefined;

            // Determine file type
            if (ext === 'csv' || ext === 'txt') {
                fileType = 'csv';
                try {
                    const result = await processCSV(file);
                    headers = result.headers;
                    rows = result.rows;
                    rawData = result.rawData;
                } catch (err: any) {
                    toast.error(`Failed to parse ${file.name}: ` + err.message);
                    continue;
                }
            } else if (ext === 'geojson') {
                fileType = 'geojson';
            } else if (['tif', 'tiff', 'geotiff'].includes(ext)) {
                fileType = 'geotiff';
            } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
                fileType = 'image';
                // Create preview for images
                preview = URL.createObjectURL(file);
            } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
                fileType = 'video';
                // Create preview for videos
                preview = URL.createObjectURL(file);
            } else if (['glb', 'gltf'].includes(ext)) {
                fileType = '3d';
                preview = URL.createObjectURL(file);
            }

            const lat = headers.find(h => h.toLowerCase().includes('lat') || h.toLowerCase().includes('y'));
            const lng = headers.find(h => h.toLowerCase().includes('lon') || h.toLowerCase().includes('lng') || h.toLowerCase().includes('x'));
            const wktField = headers.find(h => h.toLowerCase() === 'wkt' || h.toLowerCase().includes('geometry'));

            newFiles.push({
                id,
                file,
                name: file.name,
                ext,
                fileType,
                options: {
                    encoding: 'UTF-8',
                    delimiter: ',',
                    headerLinesToDiscard: 0,
                    firstRecordHasFieldNames: true,
                    detectFieldTypes: true,
                    decimalSeparatorIsComma: false,
                    trimFields: false,
                    discardEmptyFields: false,
                    geometryType: wktField ? 'wkt' : (lat && lng ? 'point' : 'none'),
                    latField: lat || '',
                    lngField: lng || '',
                    wktField: wktField || '',
                    crs: 'EPSG:4326 - WGS 84',
                    modelScale: [1, 1, 1],
                    modelRotation: [0, 0, 0],
                    modelPosition: [mapInstance ? mapInstance.getCenter().lng : 0, mapInstance ? mapInstance.getCenter().lat : 0]
                },
                headers,
                rows,
                rawData,
                preview
            });
        }

        setUploadedFiles(prev => [...prev, ...newFiles]);
        if (!selectedFileId && newFiles.length > 0) {
            setSelectedFileId(newFiles[0].id);
        }
    }

    const updateFileOptions = async (id: string, newOptions: Partial<UploadedFileConfig['options']>) => {
        const fileConfig = uploadedFiles.find(f => f.id === id);
        if (!fileConfig) return;

        const updatedOptions = { ...fileConfig.options, ...newOptions };

        let headers = fileConfig.headers;
        let rows = fileConfig.rows;
        let rawData = fileConfig.rawData;

        // If file is CSV/TXT and delimiter or header options changed, re-parse
        if (fileConfig.ext === 'csv' || fileConfig.ext === 'txt') {
            if (newOptions.delimiter !== undefined ||
                newOptions.headerLinesToDiscard !== undefined ||
                newOptions.firstRecordHasFieldNames !== undefined) {
                try {
                    const result = await processCSV(fileConfig.file, {
                        delimiter: updatedOptions.delimiter,
                        headerLinesToDiscard: updatedOptions.headerLinesToDiscard,
                        firstRecordHasFieldNames: updatedOptions.firstRecordHasFieldNames
                    });
                    headers = result.headers;
                    rows = result.rows;
                    rawData = result.rawData;
                } catch (err: any) {
                    toast.error("Failed to re-parse CSV: " + err.message);
                }
            }
        }

        setUploadedFiles(prev => prev.map(f =>
            f.id === id ? { ...f, options: updatedOptions, headers, rows, rawData } : f
        ));
    }

    const removeFile = (id: string) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== id));
        if (selectedFileId === id) {
            setSelectedFileId(uploadedFiles.find(f => f.id !== id)?.id || null);
        }
    }

    const handleAddUploadedLayer = async () => {
        if (uploadedFiles.length === 0) return;

        let successCount = 0;
        const mapInstance = map?.current?.getMap();
        if (!mapInstance) {
            toast.error("Map is not ready");
            return;
        }

        for (const fileConfig of uploadedFiles) {
            try {
                // Handle GeoTIFF files
                if (fileConfig.fileType === 'geotiff') {
                    const handler = getFileHandler(fileConfig.name);
                    if (!handler) {
                        toast.error(`Unsupported file type: ${fileConfig.name}`);
                        continue;
                    }
                    const geotiffData: any = await handler.handler(fileConfig.file);

                    const layerId = v4();
                    const layerName = getLayerName(fileConfig.name);

                    mapInstance.addSource(layerId, {
                        type: 'image',
                        url: geotiffData.imageUrl,
                        coordinates: geotiffData.bounds
                    });

                    mapInstance.addLayer({
                        id: layerId,
                        type: 'raster',
                        source: layerId,
                        paint: {
                            'raster-opacity': 0.85
                        }
                    });

                    addLayer({
                        id: layerId,
                        name: layerName,
                        map_service_url: '',
                        map_service_layer_name: layerName,
                        map_service_vendor: MapServiceVendor.Image,
                        type: 'raster',
                        visible: true,
                        min_zoom: 0,
                        max_zoom: 24,
                        status: 'Local',
                        rendered: 1
                    } as Layer);

                    successCount++;
                    continue;
                }

                // Handle image files
                if (fileConfig.fileType === 'image') {
                    const imageUrl = fileConfig.preview || URL.createObjectURL(fileConfig.file);
                    const layerId = v4();
                    const layerName = getLayerName(fileConfig.name);

                    // Get map center and calculate bounds
                    const center = mapInstance.getCenter();
                    const zoom = mapInstance.getZoom();
                    const offset = 0.01 * (20 - zoom); // Adjust size based on zoom

                    const bounds: [[number, number], [number, number], [number, number], [number, number]] = [
                        [center.lng - offset, center.lat + offset], // top-left
                        [center.lng + offset, center.lat + offset], // top-right
                        [center.lng + offset, center.lat - offset], // bottom-right
                        [center.lng - offset, center.lat - offset]  // bottom-left
                    ];

                    mapInstance.addSource(layerId, {
                        type: 'image',
                        url: imageUrl,
                        coordinates: bounds
                    });

                    mapInstance.addLayer({
                        id: layerId,
                        type: 'raster',
                        source: layerId,
                        paint: {
                            'raster-opacity': 0.85
                        }
                    });

                    addLayer({
                        id: layerId,
                        name: layerName,
                        map_service_url: imageUrl,
                        map_service_layer_name: layerName,
                        map_service_vendor: MapServiceVendor.Image,
                        type: 'raster',
                        visible: true,
                        min_zoom: 0,
                        max_zoom: 24,
                        status: 'Local',
                        rendered: 1
                    } as Layer);

                    successCount++;
                    continue;
                }

                // Handle video files
                if (fileConfig.fileType === 'video') {
                    const videoUrl = fileConfig.preview || URL.createObjectURL(fileConfig.file);
                    const layerId = v4();
                    const layerName = getLayerName(fileConfig.name);

                    // Create video element
                    const video = document.createElement('video');
                    video.src = videoUrl;
                    video.loop = true;
                    video.muted = true;
                    video.play();

                    // Get map center and calculate bounds
                    const center = mapInstance.getCenter();
                    const zoom = mapInstance.getZoom();
                    const offset = 0.01 * (20 - zoom);

                    const bounds: [[number, number], [number, number], [number, number], [number, number]] = [
                        [center.lng - offset, center.lat + offset],
                        [center.lng + offset, center.lat + offset],
                        [center.lng + offset, center.lat - offset],
                        [center.lng - offset, center.lat - offset]
                    ];

                    // Wait for video metadata to load
                    await new Promise((resolve) => {
                        video.addEventListener('loadedmetadata', resolve);
                    });

                    mapInstance.addSource(layerId, {
                        type: 'video',
                        urls: [videoUrl],
                        coordinates: bounds
                    });

                    mapInstance.addLayer({
                        id: layerId,
                        type: 'raster',
                        source: layerId,
                        paint: {
                            'raster-opacity': 0.85
                        }
                    });

                    addLayer({
                        id: layerId,
                        name: layerName,
                        map_service_url: videoUrl,
                        map_service_layer_name: layerName,
                        map_service_vendor: MapServiceVendor.Image,
                        type: 'raster',
                        visible: true,
                        min_zoom: 0,
                        max_zoom: 24,
                        status: 'Local',
                        rendered: 1
                    } as Layer);

                    successCount++;
                    continue;
                }

                // Handle 3D models
                if (fileConfig.fileType === '3d') {
                    // Use Blob URL with extension hint to help Mapbox identification
                    const modelUrl = URL.createObjectURL(fileConfig.file) + `?ext=.${fileConfig.ext}`;

                    if (fileConfig.ext === 'gltf') {
                        toast.error("Standard .gltf files often fail to load because they reference external files. Please use .glb for self-contained 3D models.", { duration: 6000 });
                    }


                    const layerId = v4();
                    const modelId = `model-${v4()}`;
                    const layerName = getLayerName(fileConfig.name);

                    // Register model in Mapbox style
                    if (mapInstance && (mapInstance as any).addModel) {
                        try {
                            (mapInstance as any).addModel(modelId, modelUrl);
                        } catch (err) {
                            console.error("Error adding model to map:", err);
                        }
                    }

                    // Mapbox GL JS v3 model source and layer
                    mapInstance.addSource(layerId, {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: [{
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: fileConfig.options.modelPosition
                                },
                                properties: {}
                            }]
                        }
                    });

                    mapInstance.addLayer({
                        id: layerId,
                        type: 'model',
                        source: layerId,
                        layout: {
                            'model-id': modelId
                        },
                        paint: {
                            'model-opacity': 1,
                            'model-rotation': fileConfig.options.modelRotation as [number, number, number],
                            'model-scale': fileConfig.options.modelScale as [number, number, number]
                        }
                    } as any);

                    addLayer({
                        id: layerId,
                        name: layerName,
                        map_service_url: modelUrl,
                        map_service_layer_name: layerName,
                        map_service_vendor: MapServiceVendor.Model,
                        type: '3d',
                        visible: true,
                        min_zoom: 0,
                        max_zoom: 24,
                        status: 'Local',
                        rendered: 1
                    } as Layer);

                    successCount++;
                    continue;
                }

                // Handle CSV/TXT and other geospatial files (not media)
                if (fileConfig.fileType === 'csv' || fileConfig.fileType === 'geojson' || fileConfig.fileType === 'other') {
                    let geojson: GeoJSON.GeoJSON;

                    if (fileConfig.ext === 'csv' || fileConfig.ext === 'txt') {
                        if (fileConfig.options.geometryType === 'point') {
                            if (!fileConfig.options.latField || !fileConfig.options.lngField) {
                                toast.error(`Please select latitude and longitude columns for ${fileConfig.name}`);
                                continue;
                            }
                            geojson = csvToGeoJSON(fileConfig.rows, {
                                latField: fileConfig.options.latField,
                                lngField: fileConfig.options.lngField
                            });
                        } else if (fileConfig.options.geometryType === 'wkt') {
                            if (!fileConfig.options.wktField) {
                                toast.error(`Please select WKT column for ${fileConfig.name}`);
                                continue;
                            }
                            geojson = csvToGeoJSON(fileConfig.rows, {
                                wktField: fileConfig.options.wktField
                            });
                        } else {
                            toast.error(`Geometry definition not set for ${fileConfig.name}`);
                            continue;
                        }
                    } else {
                        // Handle other geospatial files (GeoJSON, KML, etc.)
                        const handler = getFileHandler(fileConfig.name);
                        if (!handler) {
                            toast.error(`Unsupported file type: ${fileConfig.name}`);
                            continue;
                        }
                        const data = await handler.handler(fileConfig.file);
                        geojson = data as GeoJSON.GeoJSON;
                    }

                    await addGeojsonToMap({
                        mapRef: map,
                        layerName: getLayerName(fileConfig.name),
                        data: geojson
                    });
                    successCount++;
                }
            } catch (error: any) {
                toast.error(`Error adding ${fileConfig.name}: ` + error.message);
            }
        }

        if (successCount > 0) {
            toast.success(`Successfully added ${successCount} layer(s)`);
            if (successCount === uploadedFiles.length) {
                setDisplayLayouts({ ...displayLayouts, addLayer: false });
            }
        }
    }


    const handleDatasets = async () => {
        // set loading state (partial update to avoid unnecessary merges)
        setIsLoading({ dataset: true });
        const mapInstance = map?.current?.getMap();
        if (datasetProperties.map_service_vendor == MapServiceVendor.XYZ) {
            if (mapInstance) {
                const layerId = v4();
                const href = datasetProperties.url;
                const url = new URL(datasetProperties.url);
                const domain = url.hostname;
                mapInstance.addLayer({
                    id: layerId,
                    type: "raster",
                    source: {
                        type: "raster",
                        tiles: [
                            `/api/proxy?baseUrl=${encodeURIComponent(
                                href
                            )}&x={x}&y={y}&z={z}`,
                        ],
                        tileSize: 256,
                    },
                    paint: {
                        "raster-opacity": 1,
                    },
                    metadata: {
                        domain: domain,
                        url: href,
                        map_service_vendor: MapServiceVendor.XYZ,
                    },
                });

                addLayer({
                    id: layerId,
                    name: `XYZ Layer ${layers.length + 1}`,
                    map_service_url: url.toString(),
                    map_service_layer_name: "",
                    map_service_vendor: MapServiceVendor.XYZ,
                    type: "raster",
                    visible: true,
                    min_zoom: 0,
                    max_zoom: 24,
                    status: "Local",
                    rendered: 1,
                    metadata: {
                        domain: domain,
                        url: href,
                        map_service_vendor: MapServiceVendor.XYZ,
                    },
                } as Layer);
            }
        } else if (
            datasetProperties.map_service_vendor == MapServiceVendor.GeoJSON
        ) {
            if (mapInstance) {
                try {
                    const layerId = v4();
                    const href = datasetProperties.url?.trim();
                    if (!href) {
                        throw new Error("GeoJSON URL is empty");
                    }
                    const urlObj = new URL(href);
                    const domain = urlObj.hostname;

                    const response = await fetch(href);
                    const data = await response.json();

                    const normalizedGeojsonData =
                        data?.type === "FeatureCollection" && Array.isArray(data.features)
                            ? data
                            : {
                                type: "FeatureCollection",
                                features: data,
                            };

                    if (normalizedGeojsonData?.features?.length > 0) {
                        const geometryType = normalizedGeojsonData.features[0].geometry.type;
                        const layerConfig = findLayerConfigByGeometryType(geometryType);

                        mapInstance.addLayer({
                            id: layerId,
                            type: (layerConfig?.layerType as "fill" | "line" | "circle") ?? "circle",
                            source: {
                                type: "geojson",
                                data: normalizedGeojsonData,
                            },
                            minzoom: 0,
                            maxzoom: 24,
                            layout: {
                                visibility: "visible",
                            },
                            metadata: {
                                domain,
                                url: href,
                                map_service_vendor: MapServiceVendor.GeoJSON,
                            },
                            ...(layerConfig?.layerProps ?? {}),
                        });

                        // Tambahkan ke store setelah layer sukses ditambahkan ke map
                        addLayer({
                            id: layerId,
                            name: `Geojson Layer ${layers.length + 1}`,
                            map_service_url: urlObj.toString(),
                            map_service_layer_name: "",
                            map_service_vendor: MapServiceVendor.GeoJSON,
                            type: "vector",
                            visible: true,
                            min_zoom: 0,
                            max_zoom: 24,
                            status: "Local",
                            rendered: 1,
                            metadata: {
                                domain: domain,
                                url: href,
                                map_service_vendor: MapServiceVendor.GeoJSON,
                            },
                        } as Layer);

                        toast.success("Successfully loaded GeoJSON layer");
                    } else {
                        toast.error("GeoJSON has no features");
                    }
                } catch (error) {
                    console.error("Error fetching GeoJSON:", error);
                    toast.error("Failed to load GeoJSON data");
                }
            }
        } else if (datasetProperties.map_service_vendor === MapServiceVendor.Cesium) {
            if (mapInstance) {
                const layerId = v4();
                const url = datasetProperties.url;
                if (!url) {
                    toast.error("Please enter a valid URL");
                    return;
                }
                addLayer({
                    id: layerId,
                    name: `Cesium Layer ${layers.length + 1}`,
                    map_service_url: url,
                    map_service_layer_name: "3D Tiles",
                    map_service_vendor: MapServiceVendor.Cesium,
                    type: "3d",
                    visible: true,
                    min_zoom: 0,
                    max_zoom: 24,
                    status: "Local",
                    rendered: 1,
                    metadata: {
                        url: url,
                        map_service_vendor: MapServiceVendor.Cesium,
                        cesium_ion_token: datasetProperties.cesium_ion_token,
                        cesium_opacity: datasetProperties.cesium_opacity,
                        cesium_point_size: datasetProperties.cesium_point_size,
                        cesium_color: datasetProperties.cesium_color,
                    },
                } as Layer);
                toast.success("Cesium 3D Tiles added to map");
                setDisplayLayouts({ ...displayLayouts, addLayer: false });
            }
        } else {
            const datasets = await getWMSServices(
                datasetProperties.url,
                datasetProperties.map_service_vendor
            );
            setDatasetResult(datasets ?? []);
        }
        // ensure loading reset
        setIsLoading({ dataset: false });
    };

    const handleAddLayerToMap = async () => {
        if (selectedDatasets) {
            selectedDatasets.forEach((dataset) => {
                const layerId = v4();
                const layerName = dataset.title;
                const mapServiceUrl = dataset.url ? dataset.url : datasetProperties.url;
                const mapServiceLayerName = dataset.name;
                const mapServiceVendor = dataset.map_service_vendor;
                const type = "2D";
                const visible = true;
                const minZoom = 0;
                const maxZoom = 24;
                const status = "Local";

                addLayer({
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
                    rendered: 1,
                    metadata: {
                        map_service_url: mapServiceUrl,
                        map_service_layer_name: mapServiceLayerName,
                        map_service_vendor: mapServiceVendor as MapServiceVendor,
                    },
                } as Layer);
            });
            setSelectedDatasets([]);
        }
    };

    const handleFolderClick = async (data: Datasets) => {
        setActiveDataset(data);
        setIsLoading({ ...isLoading, dataset: true });

        const layerDatasets = await getWMSServices(
            data.url,
            data.map_service_vendor as MapServiceVendor
        );

        setDatasetResult(layerDatasets ?? []);
        setIsLoading({ ...isLoading, dataset: false });
    };

    return (
        <div>
            <div className="overflow-scroll relative p-5 w-full bg-white rounded-lg dark:bg-background">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">Add Layer</p>
                        <p className="font-normal">Add a Personalized Layer</p>
                    </div>
                    <Button
                        variant={"link"}
                        onClick={() =>
                            setDisplayLayouts({ ...displayLayouts, addLayer: false })
                        }
                    >
                        <IoClose size={"13pt"} />
                    </Button>
                </div>
                <div className="overflow-auto px-2 py-5 h-[80vh] max-w-[80vw] w-[80vw] transition-all duration-300">
                    <Tabs defaultValue="datasets">
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="datasets">Datasets</TabsTrigger>
                            <TabsTrigger value="wms">WMS</TabsTrigger>
                            <TabsTrigger value="upload">Upload</TabsTrigger>
                            <TabsTrigger value="integration">Integrations</TabsTrigger>
                        </TabsList>
                        <div className="px-2 py-5 h-full w-full">
                            <TabsContent value="datasets">
                                <Card className="transition-[width] duration-300 ease-in-out">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Datasets</CardTitle>
                                                <CardDescription>
                                                    Select Your Layer
                                                </CardDescription>
                                            </div>
                                            {selectedDatasets.length > 0 && (
                                                <p className="text-xs">
                                                    {selectedDatasets.length} Layer Selected
                                                </p>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="h-[55vh] w-full">
                                            <div className="flex overflow-auto h-full rounded-lg border">
                                                <ResizablePanelGroup direction="horizontal">
                                                    <ResizablePanel defaultSize={25} className="transition-[width] duration-300 ease-in-out">
                                                        <ScrollArea className="w-full h-full">
                                                            {datasets.map((dataset, index) => (
                                                                <Button
                                                                    key={index}
                                                                    variant="ghost"
                                                                    className={cn(
                                                                        "w-full justify-start font-normal",
                                                                        activeDataset?.id === dataset.id
                                                                            ? "bg-accent"
                                                                            : ""
                                                                    )}
                                                                    onClick={() => handleFolderClick(dataset)}
                                                                >
                                                                    {dataset.name}
                                                                </Button>
                                                            ))}
                                                        </ScrollArea>
                                                    </ResizablePanel>
                                                    <ResizableHandle withHandle />
                                                    <ResizablePanel defaultSize={75} className="transition-[width] duration-300 ease-in-out">
                                                        <div className="w-full h-full rounded-lg dark:bg-background">
                                                            {isLoading.dataset && (
                                                                <div className="flex justify-center items-center w-full h-full">
                                                                    <div className="flex flex-col gap-2 items-center">
                                                                        <AiOutlineLoading3Quarters
                                                                            className="animate-spin"
                                                                            size={24}
                                                                        />
                                                                        <p className="text-sm">
                                                                            Loading dataset...
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {!isLoading.dataset && (
                                                                <>
                                                                    {datasetResult?.length === 0 && (
                                                                        <div className="flex flex-col justify-center items-center h-full">
                                                                            <LuDatabase size={"30pt"} />
                                                                            <p className="font-bold">
                                                                                Theres no data to show yet.
                                                                            </p>
                                                                            <p className="text-sm">
                                                                                No data available yet. Please upload
                                                                                or enter a valid URL to display
                                                                                data.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {activeDataset?.map_service_vendor ===
                                                                        MapServiceVendor.Geoserver && (
                                                                            <div className="relative h-full">
                                                                                <TreeDirectory
                                                                                    data={datasetResult}
                                                                                    activeDatasets={activeDataset}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    {activeDataset?.map_service_vendor ===
                                                                        MapServiceVendor.ArcGIS &&
                                                                        datasetResult?.length > 0 && (
                                                                            <div className="relative h-full">
                                                                                <TreeDirectory
                                                                                    data={datasetResult}
                                                                                    activeDatasets={activeDataset}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </ResizablePanel>
                                                </ResizablePanelGroup>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="flex justify-end mt-4">
                                    <Button className="" onClick={() => handleAddLayerToMap()}>
                                        Add To Map
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="wms">
                                <Card className="transition-[width] duration-300 ease-in-out">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>WMS</CardTitle>
                                                <CardDescription>
                                                    Use your WMS to this map
                                                </CardDescription>
                                            </div>
                                            {selectedDatasets.length > 0 && (
                                                <p className="text-xs">
                                                    {selectedDatasets.length} Layer Selected
                                                </p>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 w-full">
                                        <div className="flex flex-col gap-2 items-center mb-2 lg:flex-row">
                                            <Select
                                                onValueChange={(value) =>
                                                    setDatasetProperties({
                                                        ...datasetProperties,
                                                        map_service_vendor: value as unknown as MapServiceVendor,
                                                    })
                                                }
                                            >
                                                <SelectTrigger className="w-full lg:w-[180px]">
                                                    <SelectValue
                                                        defaultValue={MapServiceVendor.Geoserver}
                                                        placeholder="Select Map Vendor"
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={MapServiceVendor.Geoserver}>
                                                        Geoserver
                                                    </SelectItem>
                                                    <SelectItem value={MapServiceVendor.ArcGIS}>
                                                        ArcGIS
                                                    </SelectItem>
                                                    <SelectItem value={MapServiceVendor.XYZ}>
                                                        XYZ
                                                    </SelectItem>
                                                    <SelectItem value={MapServiceVendor.GeoJSON}>
                                                        Geojson
                                                    </SelectItem>
                                                    <SelectItem value={MapServiceVendor.Cesium}>
                                                        Cesium 3D Tiles
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input
                                                type="url"
                                                placeholder={
                                                    datasetProperties.map_service_vendor ==
                                                        MapServiceVendor.Geoserver
                                                        ? "http(s)://(domain)/(path)/(to)/(wms)/wms"
                                                        : datasetProperties.map_service_vendor ==
                                                            MapServiceVendor.ArcGIS
                                                            ? "http(s)://(domain)/(path)/(to)/(services)"
                                                            : datasetProperties.map_service_vendor == MapServiceVendor.Cesium
                                                                ? "https://assets.ion.cesium.com/asset_id/tileset.json"
                                                                : "http(s)://(domain)/(path)/(to)/(tiles)/x/y/z"
                                                }
                                                className="w-full"
                                                onChange={(e) =>
                                                    setDatasetProperties({
                                                        ...datasetProperties,
                                                        url: e.currentTarget.value,
                                                    })
                                                }
                                            />
                                            {datasetProperties.map_service_vendor === MapServiceVendor.Cesium && (
                                                <div className="flex flex-col gap-4 w-full">
                                                    <Input
                                                        type="text"
                                                        placeholder="Cesium Ion Access Token (Optional)"
                                                        className="w-full"
                                                        onChange={(e) =>
                                                            setDatasetProperties({
                                                                ...datasetProperties,
                                                                cesium_ion_token: e.currentTarget.value,
                                                            })
                                                        }
                                                    />
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label className="text-xs">Opacity ({Math.round((datasetProperties.cesium_opacity || 1) * 100)}%)</Label>
                                                        </div>
                                                        <Slider
                                                            min={0}
                                                            max={1}
                                                            step={0.01}
                                                            value={[datasetProperties.cesium_opacity || 1]}
                                                            onValueChange={(val) => setDatasetProperties({
                                                                ...datasetProperties,
                                                                cesium_opacity: val[0]
                                                            })}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                         <div className="flex justify-between items-center">
                                                             <Label className="text-xs">Point Size ({datasetProperties.cesium_point_size || 2}px)</Label>
                                                         </div>
                                                         <Slider
                                                             min={1}
                                                             max={20}
                                                             step={1}
                                                             value={[datasetProperties.cesium_point_size || 2]}
                                                             onValueChange={(val) => setDatasetProperties({
                                                                 ...datasetProperties,
                                                                 cesium_point_size: val[0]
                                                             })}
                                                         />
                                                     </div>
                                                     <div className="flex flex-col gap-2">
                                                         <Label className="text-xs">Base Color Override</Label>
                                                         <ColorPicker 
                                                            color={datasetProperties.cesium_color || "#ffffff"} 
                                                            onChange={(color) => setDatasetProperties({
                                                                ...datasetProperties,
                                                                cesium_color: color
                                                            })}
                                                         />
                                                     </div>
                                                 </div>
                                            )}
                                            <Button
                                                type="submit"
                                                className="right-0 w-full lg:w-auto"
                                                onClick={() => handleDatasets()}
                                            >
                                                Connect
                                            </Button>
                                        </div>
                                        <div className="h-[50vh]">
                                            <div className="overflow-auto p-5 mb-2 w-full h-full bg-white rounded-lg border dark:bg-background">
                                                {isLoading.dataset && (
                                                    <div className="flex justify-center items-center w-full h-full">
                                                        <div className="flex flex-col gap-2 items-center">
                                                            <AiOutlineLoading3Quarters
                                                                className="animate-spin"
                                                                size={24}
                                                            />
                                                            <p className="text-sm">Loading dataset...</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {!isLoading.dataset && (
                                                    <>
                                                        {datasetResult?.length === 0 && (
                                                            <div className="flex flex-col justify-center items-center h-full">
                                                                <LuDatabase size={"30pt"} />
                                                                <p className="font-bold">
                                                                    Theres no data to show yet.
                                                                </p>
                                                                <p className="text-sm">
                                                                    No data available yet. Please upload or
                                                                    enter a valid URL to display data.
                                                                </p>
                                                            </div>
                                                        )}
                                                        <div>
                                                            {datasetProperties?.map_service_vendor ==
                                                                "Geoserver" && (
                                                                    <div className="h-96">
                                                                        <TreeDirectory
                                                                            data={datasetResult}

                                                                            activeDatasets={activeDataset!}
                                                                        />
                                                                    </div>
                                                                )}
                                                            {datasetProperties?.map_service_vendor ==
                                                                MapServiceVendor.ArcGIS &&
                                                                datasetResult?.length != 0 && (
                                                                    <div>
                                                                        <TreeDirectory
                                                                            data={datasetResult}
                                                                            activeDatasets={activeDataset!}
                                                                        />
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <div className="flex justify-end mt-4">
                                    <Button className="" onClick={() => handleAddLayerToMap()}>
                                        Add To Map
                                    </Button>
                                </div>
                            </TabsContent>
                            <TabsContent value="integration">
                                <Card className="transition-[width] duration-300 ease-in-out">
                                    <CardHeader>
                                        <CardTitle>Integrations</CardTitle>
                                        <CardDescription>
                                            Integrate your map with other services
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="h-[50vh] w-full">Testing</div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="upload" className="flex flex-col gap-4">
                                <div className="flex-1 flex gap-4 overflow-hidden mt-2">
                                    {/* Left Side: File List and Upload */}
                                    <div className="w-[700px] flex flex-col gap-4 border rounded-lg p-4 bg-muted/30">
                                        <div className="flex-1 overflow-auto space-y-2 pr-2">
                                            {uploadedFiles.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-lg p-4">
                                                    <LuUpload className="h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-xs text-center">No files uploaded yet</p>
                                                </div>
                                            ) : (
                                                uploadedFiles.map(file => (
                                                    <div
                                                        key={file.id}
                                                        onClick={() => setSelectedFileId(file.id)}
                                                        className={cn(
                                                            "group relative flex items-center gap-2 p-2 rounded-md cursor-pointer border transition-all",
                                                            selectedFileId === file.id ? "bg-primary/10 border-primary ring-1 ring-primary/20" : "bg-background hover:bg-muted border-transparent"
                                                        )}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold truncate pr-6">{file.name}</p>
                                                            <p className="text-xs text-muted-foreground uppercase">{file.ext}</p>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 absolute right-1"
                                                            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                                        >
                                                            <LuTrash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <input
                                            id="file-upload-multiple"
                                            type="file"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                            accept=".glb,.gltf,.geojson,.kml,.kmz,.topojson,.wkt,.zip,.csv,.txt,.tif,.tiff,.geotiff,.png,.jpg,.jpeg,.gif,.webp,.bmp,.mp4,.webm,.ogg,.mov,.gltf,.glb"
                                            multiple
                                        />
                                        <Button
                                            variant="outline"
                                            className="w-full h-9 border-dashed text-xs"
                                            onClick={() => document.getElementById('file-upload-multiple')?.click()}
                                        >
                                            <LuPlus className="mr-2 h-3 w-3" /> Add Files
                                        </Button>
                                    </div>

                                    {/* Right Side: Configuration */}
                                    <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-background">
                                        {selectedFile ? (
                                            <ScrollArea className="flex-1">
                                                <div className="p-4 space-y-6">
                                                    <div className="flex items-center justify-between pb-2 border-b">
                                                        <h3 className="font-bold text-sm">Configure {selectedFile.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs font-medium">Encoding</Label>
                                                            <Select
                                                                value={selectedFile.options.encoding}
                                                                onValueChange={(v) => updateFileOptions(selectedFile.id, { encoding: v })}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs w-32">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="UTF-8">UTF-8</SelectItem>
                                                                    <SelectItem value="UTF-16">UTF-16</SelectItem>
                                                                    <SelectItem value="ISO-8859-1">ISO-8859-1</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {(selectedFile.ext === 'csv' || selectedFile.ext === 'txt') ? (
                                                        <Accordion type="multiple" defaultValue={["format", "record", "geometry", "preview"]} className="space-y-3">
                                                            {/* File Format */}
                                                            <AccordionItem value="format" className="border rounded-md px-3 bg-muted/5">
                                                                <AccordionTrigger className="py-2 text-xs hover:no-underline font-bold">
                                                                    File Format
                                                                </AccordionTrigger>
                                                                <AccordionContent className="space-y-4 pt-1">
                                                                    <RadioGroup
                                                                        value={selectedFile.options.delimiter === ',' ? 'csv' : 'custom'}
                                                                        onValueChange={(v) => updateFileOptions(selectedFile.id, { delimiter: v === 'csv' ? ',' : ';' })}
                                                                        className="space-y-2"
                                                                    >
                                                                        <div className="flex items-center space-x-3">
                                                                            <RadioGroupItem value="csv" id="csv-fmt" className="h-4 w-4" />
                                                                            <Label htmlFor="csv-fmt" className="text-sm font-normal">CSV (comma separated values)</Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-3">
                                                                            <RadioGroupItem value="custom" id="custom-fmt" className="h-4 w-4" />
                                                                            <Label htmlFor="custom-fmt" className="text-sm font-normal">Custom delimiters</Label>
                                                                        </div>
                                                                    </RadioGroup>

                                                                    {selectedFile.options.delimiter !== ',' && (
                                                                        <div className="flex items-center gap-2 pl-7">
                                                                            <Label className="text-xs">Other delimiter</Label>
                                                                            <Input
                                                                                className="h-8 w-12 text-xs text-center"
                                                                                value={selectedFile.options.delimiter}
                                                                                onChange={(e) => updateFileOptions(selectedFile.id, { delimiter: e.target.value })}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </AccordionContent>
                                                            </AccordionItem>

                                                            {/* Record Options */}
                                                            <AccordionItem value="record" className="border rounded-md px-3 bg-muted/5">
                                                                <AccordionTrigger className="py-2 text-xs hover:no-underline font-bold">
                                                                    Record and Fields Options
                                                                </AccordionTrigger>
                                                                <AccordionContent className="grid grid-cols-2 gap-x-12 gap-y-4 pt-1">
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <Label className="text-xs">Header lines to discard</Label>
                                                                            <Input
                                                                                type="number"
                                                                                className="h-8 w-16 text-xs"
                                                                                value={selectedFile.options.headerLinesToDiscard}
                                                                                onChange={(e) => updateFileOptions(selectedFile.id, { headerLinesToDiscard: parseInt(e.target.value) || 0 })}
                                                                            />
                                                                        </div>
                                                                        <div className="flex items-center space-x-3">
                                                                            <Checkbox
                                                                                id="first-header"
                                                                                className="h-4 w-4"
                                                                                checked={selectedFile.options.firstRecordHasFieldNames}
                                                                                onCheckedChange={(c) => updateFileOptions(selectedFile.id, { firstRecordHasFieldNames: !!c })}
                                                                            />
                                                                            <Label htmlFor="first-header" className="text-xs">First record has field names</Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-3">
                                                                            <Checkbox
                                                                                id="detect-types"
                                                                                className="h-4 w-4"
                                                                                checked={selectedFile.options.detectFieldTypes}
                                                                                onCheckedChange={(c) => updateFileOptions(selectedFile.id, { detectFieldTypes: !!c })}
                                                                            />
                                                                            <Label htmlFor="detect-types" className="text-xs">Detect field types</Label>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-4">
                                                                        <div className="flex items-center space-x-3">
                                                                            <Checkbox
                                                                                id="dec-comma"
                                                                                className="h-4 w-4"
                                                                                checked={selectedFile.options.decimalSeparatorIsComma}
                                                                                onCheckedChange={(c) => updateFileOptions(selectedFile.id, { decimalSeparatorIsComma: !!c })}
                                                                            />
                                                                            <Label htmlFor="dec-comma" className="text-xs">Decimal separator is comma</Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-3">
                                                                            <Checkbox
                                                                                id="trim-fields"
                                                                                className="h-4 w-4"
                                                                                checked={selectedFile.options.trimFields}
                                                                                onCheckedChange={(c) => updateFileOptions(selectedFile.id, { trimFields: !!c })}
                                                                            />
                                                                            <Label htmlFor="trim-fields" className="text-xs">Trim fields</Label>
                                                                        </div>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>

                                                            {/* Geometry Definition */}
                                                            <AccordionItem value="geometry" className="border rounded-md px-3 bg-muted/5">
                                                                <AccordionTrigger className="py-2 text-xs hover:no-underline font-bold">
                                                                    Geometry Definition
                                                                </AccordionTrigger>
                                                                <AccordionContent className="space-y-5 pt-1">
                                                                    <RadioGroup
                                                                        value={selectedFile.options.geometryType}
                                                                        onValueChange={(v) => updateFileOptions(selectedFile.id, { geometryType: v as any })}
                                                                        className="grid grid-cols-2 gap-8"
                                                                    >
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center space-x-3">
                                                                                <RadioGroupItem value="point" id="point-geo" className="h-4 w-4" />
                                                                                <Label htmlFor="point-geo" className="text-sm font-medium">Point coordinates</Label>
                                                                            </div>

                                                                            {selectedFile.options.geometryType === 'point' && (
                                                                                <div className="pl-7 space-y-3 pb-2">
                                                                                    <div className="grid grid-cols-2 items-center gap-3">
                                                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">X field (Long)</Label>
                                                                                        <Select
                                                                                            value={selectedFile.options.lngField}
                                                                                            onValueChange={(v) => updateFileOptions(selectedFile.id, { lngField: v })}
                                                                                        >
                                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                                <SelectValue placeholder="Select X" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {selectedFile.headers.filter(h => h.trim() !== '').map((h, idx) => <SelectItem key={`${h}-${idx}`} value={h}>{h}</SelectItem>)}
                                                                                                <SelectItem value="_manual">Enter manually...</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 items-center gap-3">
                                                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Y field (Lat)</Label>
                                                                                        <Select
                                                                                            value={selectedFile.options.latField}
                                                                                            onValueChange={(v) => updateFileOptions(selectedFile.id, { latField: v })}
                                                                                        >
                                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                                <SelectValue placeholder="Select Y" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {selectedFile.headers.filter(h => h.trim() !== '').map((h, idx) => <SelectItem key={`${h}-${idx}`} value={h}>{h}</SelectItem>)}
                                                                                                <SelectItem value="_manual">Enter manually...</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center space-x-3">
                                                                                <RadioGroupItem value="wkt" id="wkt-geo" className="h-4 w-4" />
                                                                                <Label htmlFor="wkt-geo" className="text-sm font-medium">Well known text (WKT)</Label>
                                                                            </div>

                                                                            {selectedFile.options.geometryType === 'wkt' && (
                                                                                <div className="pl-7 space-y-3 pb-2">
                                                                                    <div className="grid grid-cols-2 items-center gap-3">
                                                                                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Geometry field</Label>
                                                                                        <Select
                                                                                            value={selectedFile.options.wktField}
                                                                                            onValueChange={(v) => updateFileOptions(selectedFile.id, { wktField: v })}
                                                                                        >
                                                                                            <SelectTrigger className="h-8 text-xs">
                                                                                                <SelectValue placeholder="Select WKT" />
                                                                                            </SelectTrigger>
                                                                                            <SelectContent>
                                                                                                {selectedFile.headers.filter(h => h.trim() !== '').map((h, idx) => <SelectItem key={`${h}-${idx}`} value={h}>{h}</SelectItem>)}
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            <div className="flex items-center space-x-3">
                                                                                <RadioGroupItem value="none" id="no-geo" className="h-4 w-4" />
                                                                                <Label htmlFor="no-geo" className="text-sm font-medium">No geometry (attribute only table)</Label>
                                                                            </div>
                                                                        </div>
                                                                    </RadioGroup>

                                                                    <div className="flex items-center gap-3 pt-3 border-t mt-4">
                                                                        <Label className="text-xs font-bold">Geometry CRS</Label>
                                                                        <Select value={selectedFile.options.crs} onValueChange={(v) => updateFileOptions(selectedFile.id, { crs: v })}>
                                                                            <SelectTrigger className="h-8 text-xs flex-1">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="EPSG:4326 - WGS 84">EPSG:4326 - WGS 84</SelectItem>
                                                                                <SelectItem value="EPSG:3857 - Web Mercator">EPSG:3857 - Web Mercator</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>

                                                            {/* Sample Data Preview */}
                                                            <AccordionItem value="preview" className="border rounded-md px-3 bg-muted/5">
                                                                <AccordionTrigger className="py-2 text-xs hover:no-underline font-bold">
                                                                    Sample Data
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-1">
                                                                    <div className="h-48 overflow-auto border rounded-md bg-background">
                                                                        <DynamicTable
                                                                            headers={selectedFile.headers}
                                                                            data={selectedFile.rawData.slice(selectedFile.options.firstRecordHasFieldNames ? 1 : 0, 11)}
                                                                            isLoading={false}
                                                                        />
                                                                    </div>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        </Accordion>
                                                    ) : selectedFile.fileType === '3d' ? (
                                                        <div className="space-y-6">
                                                            <div className="border rounded-md p-4 bg-muted/5 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Position Settings</p>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="h-7 text-[10px]"
                                                                        onClick={() => {
                                                                            const center = map?.current?.getMap().getCenter();
                                                                            if (center) {
                                                                                updateFileOptions(selectedFile.id, { modelPosition: [center.lng, center.lat] });
                                                                            }
                                                                        }}
                                                                    >
                                                                        Snap to Center
                                                                    </Button>
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] uppercase">Longitude</Label>
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 text-xs"
                                                                            step="0.000001"
                                                                            value={selectedFile.options.modelPosition[0]}
                                                                            onChange={(e) => updateFileOptions(selectedFile.id, {
                                                                                modelPosition: [parseFloat(e.target.value), selectedFile.options.modelPosition[1]]
                                                                            })}
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] uppercase">Latitude</Label>
                                                                        <Input
                                                                            type="number"
                                                                            className="h-8 text-xs"
                                                                            step="0.000001"
                                                                            value={selectedFile.options.modelPosition[1]}
                                                                            onChange={(e) => updateFileOptions(selectedFile.id, {
                                                                                modelPosition: [selectedFile.options.modelPosition[0], parseFloat(e.target.value)]
                                                                            })}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground pt-2">Transform</p>
                                                                <div className="space-y-3">
                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] uppercase">Scale (X, Y, Z)</Label>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            <Input type="number" step="0.1" className="h-8 text-xs" placeholder="X" value={selectedFile.options.modelScale[0]} onChange={(e) => updateFileOptions(selectedFile.id, { modelScale: [parseFloat(e.target.value), selectedFile.options.modelScale[1], selectedFile.options.modelScale[2]] })} />
                                                                            <Input type="number" step="0.1" className="h-8 text-xs" placeholder="Y" value={selectedFile.options.modelScale[1]} onChange={(e) => updateFileOptions(selectedFile.id, { modelScale: [selectedFile.options.modelScale[0], parseFloat(e.target.value), selectedFile.options.modelScale[2]] })} />
                                                                            <Input type="number" step="0.1" className="h-8 text-xs" placeholder="Z" value={selectedFile.options.modelScale[2]} onChange={(e) => updateFileOptions(selectedFile.id, { modelScale: [selectedFile.options.modelScale[0], selectedFile.options.modelScale[1], parseFloat(e.target.value)] })} />
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <Label className="text-[10px] uppercase">Rotation (Degrees X, Y, Z)</Label>
                                                                        <div className="grid grid-cols-3 gap-2">
                                                                            <Input type="number" className="h-8 text-xs" placeholder="X" value={selectedFile.options.modelRotation[0]} onChange={(e) => updateFileOptions(selectedFile.id, { modelRotation: [parseFloat(e.target.value), selectedFile.options.modelRotation[1], selectedFile.options.modelRotation[2]] })} />
                                                                            <Input type="number" className="h-8 text-xs" placeholder="Y" value={selectedFile.options.modelRotation[1]} onChange={(e) => updateFileOptions(selectedFile.id, { modelRotation: [selectedFile.options.modelRotation[0], parseFloat(e.target.value), selectedFile.options.modelRotation[2]] })} />
                                                                            <Input type="number" className="h-8 text-xs" placeholder="Z" value={selectedFile.options.modelRotation[2]} onChange={(e) => updateFileOptions(selectedFile.id, { modelRotation: [selectedFile.options.modelRotation[0], selectedFile.options.modelRotation[1], parseFloat(e.target.value)] })} />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col items-center justify-center py-8 border rounded-md bg-muted/5">
                                                                <LuFileStack size={"40pt"} className="text-muted-foreground mb-4" />
                                                                <p className="text-sm font-medium">{getLayerName(selectedFile.name)}</p>
                                                                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">3D Model (GLB/GLTF)</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center h-64 border rounded-md bg-muted/20">
                                                            <LuFileJson className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
                                                            <p className="text-xs font-bold">{selectedFile.name}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase">{selectedFile.ext} FILE DETECTED</p>
                                                            <p className="text-[9px] mt-4 text-muted-foreground max-w-[200px] text-center italic">
                                                                Standard geospatial file detected. No additional parsing configuration required.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </ScrollArea>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 bg-muted/5">
                                                <LuFileStack className="h-12 w-12 mb-4 opacity-10" />
                                                <p className="text-xs font-bold">Select a file to configure</p>
                                                <p className="text-[10px] text-center mt-2 max-w-[200px]">
                                                    You can configure delimiters, header offsets, and coordinate fields for each file.
                                                </p>
                                            </div>
                                        )}

                                        {uploadedFiles.length > 0 && (
                                            <div className="p-3 border-t flex justify-between bg-muted/20 items-center">
                                                <div className="text-xs text-muted-foreground">
                                                    <span className="font-bold text-primary">{uploadedFiles.length}</span> file(s) ready
                                                </div>
                                                <Button size="sm" className="h-9 text-xs px-6" onClick={handleAddUploadedLayer}>
                                                    Add All to Map
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                            {/* <div className="flex justify-end mt-2">
                                <Button className="" onClick={() => handleAddLayerToMap()}>
                                    Add To Map
                                </Button>
                            </div> */}
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
