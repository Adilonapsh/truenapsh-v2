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

export default function AddLayerModal() {

    const { layers, addLayer } = useLayerStore();
    const { datasets, selectedDatasets, setSelectedDatasets, datasetProperties, activeDataset, setActiveDataset, datasetResult, setDatasetResult, setDatasetProperties } = useDatasetStore();
    const { isLoading, setIsLoading, displayLayouts, setDisplayLayouts } = useMapStore();
    const { map } = useMapStore();


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
            <div className="overflow-scroll relative p-5 w-full bg-white rounded-lg lg:max-h-screen dark:bg-background">
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
                <div className="overflow-auto px-2 py-5 h-full max-w-[80vw] w-[80vw] transition-all duration-300">
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
                            <TabsContent value="upload"></TabsContent>
                            <div className="flex justify-end mt-2">
                                <Button className="" onClick={() => handleAddLayerToMap()}>
                                    Add To Map
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
