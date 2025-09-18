"use client";

import type React from "react";

import useLayerStore from "@/stores/layer";
import {
    addGeojsonToMap,
    bufferLayers,
    buildingLayers,
    centroidLayers,
    clipLayers,
    differenceLayers,
    elevationLayers,
    hexagonLayer,
    linesToPolygonLayers,
    pointAlongLinesLayers,
    polygonToLinesLayers,
    removeDuplicatesLayers,
    simplifyLayers,
} from "@/tools/map-tools";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Building2,
    Combine,
    Hexagon,
    Info,
    LineChart,
    Link,
    PenTool,
    Pentagon,
    Scissors,
    Search,
    Settings,
    Square,
    SquareDashedBottom,
    SquareStack,
    Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MdTerrain } from "react-icons/md";
import { MapRef } from "react-map-gl";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select";
import { FeatureCollection, Geometry, MultiPolygon, Polygon } from "geojson";

export default function OperationComponents({
    mapRef,
}: {
    mapRef: React.RefObject<MapRef | null>;
}) {
    const { layers, addLayer } = useLayerStore();
    const [selectedOperation, setSelectedOperation] = useState<string | null>(
        null
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [operationOptions, setOperationOptions] = useState<Record<string, any>>(
        {}
    );
    const [isLoading, setIsLoading] = useState(false);

    // Operation data
    const geoprocessingOperations: OperationItem[] = [
        { icon: <Square className="h-6 w-6" />, label: "Boundary" },
        { icon: <Settings className="h-6 w-6" />, label: "Buffer" },
        { icon: <Scissors className="h-6 w-6" />, label: "Clip" },
        { icon: <Link className="h-6 w-6" />, label: "Difference" },
        { icon: <Combine className="h-6 w-6" />, label: "Intersection" },
        // { icon: <Unlink className="h-6 w-6" />, label: "Subtract" },
        // { icon: <Union className="h-6 w-6" />, label: "Union" },
        // { icon: <Triangle className="h-6 w-6" />, label: "Wedge Buffer" },
    ];

    const geometryOperations: OperationItem[] = [
        { icon: <Pentagon className="h-6 w-6" />, label: "Centroid" },
        // { icon: <CircleDot className="h-6 w-6" />, label: "Fill Holes" },
        { icon: <SquareStack className="h-6 w-6" />, label: "Lines to Polygon" },
        // { icon: <Asterisk className="h-6 w-6" />, label: "Explode MultiFeatures" },
        // { icon: <LayoutGrid className="h-6 w-6" />, label: "Explode Linestrings" },
        {
            icon: <SquareDashedBottom className="h-6 w-6" />,
            label: "Polygon to Lines",
        },
        { icon: <Trash2 className="h-6 w-6" />, label: "Remove duplicates" },
        {
            icon: <LineChart className="h-6 w-6" />,
            label: "Generate Points Along Line",
        },
        { icon: <PenTool className="h-6 w-6" />, label: "Simplify" },
        // { icon: <Droplets className="h-6 w-6" />, label: "Smoothing" },
        // { icon: <SplitSquareVertical className="h-6 w-6" />, label: "Split by line" },
    ];

    const analysisOperations: OperationItem[] = [
        // { icon: <Hash className="h-6 w-6" />, label: "Count Features in Surface" },
        // { icon: <Grid className="h-6 w-6" />, label: "Spatial Aggregation" },
        // { icon: <Clock className="h-6 w-6" />, label: "Nearest Neighbour" },
        // { icon: <X className="h-6 w-6" />, label: "Voronoi Polygons" },
        { icon: <Hexagon className="h-6 w-6" />, label: "Hexagon Grid" },
        // { icon: <CircleDashed className="h-6 w-6" />, label: "Buffer Analysis" },
        // { icon: <SquareStack className="h-6 w-6" />, label: "Overlay Analysis" },
        // { icon: <Clock className="h-6 w-6" />, label: "Temporal Analysis" },
    ];

    const integrationOperations: OperationItem[] = [
        { icon: <Building2 className="h-6 w-6" />, label: "Building" },
        { icon: <MdTerrain className="h-6 w-6" />, label: "Elevation" },
    ];

    // Operation details data
    const operationDetails: Record<string, OperationDetail> = {
        boundary: {
            // WIP
            title: "Boundary",
            description: "Create a boundary around features.",
            options: [
                {
                    id: "typeOfBoundary",
                    name: "Type of Boundary",
                    type: "select",
                    value: ["Bounding Box"],
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon"],
                    info: true,
                },
            ],
        },
        buffer: {
            title: "Buffer",
            description: "Create a buffer zone around features.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "bufferDistance",
                    name: "Buffer Distance",
                    type: "number",
                    value: "10",
                    info: true,
                },
                {
                    id: "units",
                    name: "Units",
                    type: "select",
                    value: [
                        "meters",
                        "metres",
                        "millimeters",
                        "millimetres",
                        "centimeters",
                        "centimetres",
                        "kilometers",
                        "kilometres",
                        "miles",
                        "nauticalmiles",
                        "inches",
                        "yards",
                        "feet",
                        "radians",
                        "degrees",
                    ],
                    info: false,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon", "Line", "Point"],
                    info: true,
                },
            ],
        },
        clip: {
            title: "Clip",
            description: "Clip a selection with another selection.",
            options: [
                {
                    id: "sourceLayer",
                    name: "Clip Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon", "Line", "Point"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        difference: {
            title: "Difference",
            description: "Remove features from a selection.",
            options: [
                {
                    id: "sourceLayer",
                    name: "Clip Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon", "Line", "Point"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        "lines to polygon": {
            title: "Line To Polygon",
            description: "Convert lines to polygons.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        centroid: {
            title: "Centroid",
            description: "Create a centroid of features.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Point"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        "polygon to lines": {
            title: "Polygon To Lines",
            description: "Convert polygons to lines.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Line"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        "remove duplicates": {
            title: "Remove Duplicates",
            description: "Remove duplicate features.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon", "Line", "Point"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        "hexagon grid": {
            title: "Hexagon Grid",
            description: "Create a hexagonal grid.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "cellSize",
                    name: "Cell Size",
                    type: "number",
                    value: "10",
                    info: true,
                },
                {
                    id: "units",
                    name: "Units",
                    type: "select",
                    value: [
                        "meters",
                        "metres",
                        "millimeters",
                        "millimetres",
                        "centimeters",
                        "centimetres",
                        "kilometers",
                        "kilometres",
                        "miles",
                        "nauticalmiles",
                        "inches",
                        "yards",
                        "feet",
                        "radians",
                        "degrees",
                    ],
                    info: false,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Polygon"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        simplify: {
            title: "Simplify",
            description: "Simplify geometry.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "tolerance",
                    name: "Tolerance",
                    type: "number",
                    value: "0.001",
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        "generate points along line": {
            title: "Generate Points Along Line",
            description: "Generate points along lines.",
            options: [
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "interval",
                    name: "Interval",
                    type: "number",
                    value: "0.05",
                    info: true,
                },
                {
                    id: "units",
                    name: "Units",
                    type: "select",
                    value: [
                        "meters",
                        "metres",
                        "millimeters",
                        "millimetres",
                        "centimeters",
                        "centimetres",
                        "kilometers",
                        "kilometres",
                        "miles",
                        "nauticalmiles",
                        "inches",
                        "yards",
                        "feet",
                        "radians",
                        "degrees",
                    ],
                    info: false,
                },
                {
                    id: "outputGeometry",
                    name: "Output Geometry",
                    type: "select",
                    value: ["Point"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        building: {
            title: "Building",
            description: "Create a building model.",
            options: [
                {
                    id: "sourceBuilding",
                    name: "Source Building",
                    type: "select",
                    value: ["Open street map", "Google Buildings"],
                    info: true,
                },
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "cutBuilding",
                    name: "Cut Building",
                    type: "select",
                    value: ["With Bounding Box", "Extract Building"],
                    info: true,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
        elevation: {
            title: "Elevation",
            description: "Create a Elevation model.",
            options: [
                {
                    id: "sourceelevation",
                    name: "Elevation Source",
                    type: "select",
                    value: ["Map Toolkit", "Open Elevation", "GPXZ"],
                    info: true,
                },
                {
                    id: "targetLayer",
                    name: "Target Layer",
                    type: "select",
                    value: layers?.map((layer) => ({ key: layer.id, value: layer.name })),
                    info: true,
                },
                {
                    id: "interval",
                    name: "Sample Interval",
                    type: "number",
                    value: "0",
                    info: true,
                },
                {
                    id: "units",
                    name: "Units",
                    type: "select",
                    value: [
                        "meters",
                        "metres",
                        "millimeters",
                        "millimetres",
                        "centimeters",
                        "centimetres",
                        "kilometers",
                        "kilometres",
                        "miles",
                        "nauticalmiles",
                        "inches",
                        "yards",
                        "feet",
                        "radians",
                        "degrees",
                    ],
                    info: false,
                },
                {
                    id: "keepGeometry",
                    name: "Keep Attributes",
                    type: "select",
                    value: ["All", "Selected", "None"],
                    info: false,
                },
            ],
        },
    };

    useEffect(() => {
        if (selectedOperation) {
            const lowerCaseName = selectedOperation.toLowerCase();
            const operation = operationDetails[lowerCaseName];

            if (operation) {
                const initialOptions: Record<string, any> = {};
                operation.options.forEach((option) => {
                    initialOptions[option.id] = option.value;
                });
                setOperationOptions(initialOptions);
            }
        }
    }, [selectedOperation]);

    // Helper functions
    const handleOperationClick = (operation: string) => {
        setSelectedOperation(operation);
    };

    const handleBackClick = () => {
        setSelectedOperation(null);
        setOperationOptions({});
    };

    const handleOptionChange = (optionId: string, value: string) => {
        setOperationOptions((prev) => ({
            ...prev,
            [optionId]: value,
        }));
    };

    const filteredOperations = (operations: OperationItem[]) => {
        if (!searchQuery) return operations;
        return operations.filter((op) =>
            op.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    const handleRun = async () => {
        setIsLoading(true);
        const map = mapRef?.current?.getMap();
        const lowerOperationName = selectedOperation?.toLowerCase();
        if (lowerOperationName === "boundary") {
            console.log("boundary", operationOptions);
        } else if (lowerOperationName === "buffer") {
            const bufferLayer = operationOptions.targetLayer;
            const BufferLayerSource = map?.getLayer(bufferLayer)?.source;
            const bufferData = BufferLayerSource
                ? map?.getSource(BufferLayerSource)?.serialize().data
                : undefined;
            const bufferedLayer = bufferLayers(
                bufferData,
                Number(operationOptions.bufferDistance),
                operationOptions.units
            );
            if (bufferedLayer) {
                addGeojsonToMap({
                    mapRef: mapRef,
                    data: bufferedLayer as GeoJSON.GeoJSON,
                    layerName: `Buffer ${operationOptions.bufferDistance} ${operationOptions.units}`,
                });
                console.log("Buffered Layer :", bufferedLayer);
            }
        } else if (lowerOperationName === "clip") {
            const clipLayer = operationOptions.sourceLayer;
            const targetLayer = operationOptions.targetLayer;
            if (clipLayer && targetLayer) {
                const clipLayerSource = map?.getLayer(clipLayer)?.source;
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const clipData = clipLayerSource
                    ? map?.getSource(clipLayerSource)?.serialize().data
                    : undefined;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const clippedLayers = await clipLayers(clipData, targetData);
                if (clippedLayers) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: clippedLayers as GeoJSON.GeoJSON,
                        layerName: `Clipped ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("cliped", clippedLayers);
                }
            }
        } else if (lowerOperationName === "difference") {
            const diffLayer = operationOptions.sourceLayer;
            const targetLayer = operationOptions.targetLayer;
            if (diffLayer && targetLayer) {
                const diffLayerSource = map?.getLayer(diffLayer)?.source;
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const diffData = diffLayerSource
                    ? map?.getSource(diffLayerSource)?.serialize().data
                    : undefined;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const differenceLayer = await differenceLayers(diffData, targetData);
                if (differenceLayer) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: differenceLayer as GeoJSON.GeoJSON,
                        layerName: `Difference ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("Difference", differenceLayer);
                }
            }
        } else if (lowerOperationName === "lines to polygon") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const linesToPolygon = await linesToPolygonLayers(targetData);
                if (linesToPolygon) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: linesToPolygon as GeoJSON.GeoJSON,
                        layerName: `Untitled Layers ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("Difference", linesToPolygon);
                }
            }
        } else if (lowerOperationName === "centroid") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const centroidLayer = await centroidLayers(targetData);
                if (centroidLayer) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: centroidLayer as GeoJSON.GeoJSON,
                        layerName: `Untitled Layers ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("Center", centroidLayer);
                }
            }
        } else if (lowerOperationName === "polygon to lines") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const polygonToLines = await polygonToLinesLayers(targetData);
                if (polygonToLines) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: polygonToLines as GeoJSON.GeoJSON,
                        layerName: `Untitled Layers ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("Center", polygonToLines);
                }
            }
        } else if (lowerOperationName === "voronoi") {
        } else if (lowerOperationName === "hexagon grid") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const hexagon = await hexagonLayer(
                    targetData,
                    Number(operationOptions.cellSize),
                    operationOptions.units
                );
                if (hexagon) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: hexagon as GeoJSON.GeoJSON,
                        layerName: `Hexagon ${(layers?.length ?? 0) + 1} ${operationOptions.cellSize
                            } ${operationOptions.units}`,
                    });
                    console.log("Center", hexagon);
                }
            }
        } else if (lowerOperationName === "buffer analysis") {
        } else if (lowerOperationName === "overlay analysis") {
        } else if (lowerOperationName === "temporal analysis") {
        } else if (lowerOperationName === "remove duplicates") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const removeDuplicateLayer = await removeDuplicatesLayers(targetData);
                if (removeDuplicateLayer) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: removeDuplicateLayer as GeoJSON.GeoJSON,
                        layerName: `Clean Layers ${(layers?.length ?? 0) + 1}`,
                    });
                    console.log("Center", removeDuplicateLayer);
                }
            }
        } else if (lowerOperationName === "generate points along line") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const pointsLayer = await pointAlongLinesLayers(
                    targetData,
                    Number(operationOptions.interval),
                    operationOptions.units
                );
                if (pointsLayer) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: pointsLayer as GeoJSON.GeoJSON,
                        layerName: `Points Along Line / ${operationOptions.interval} ${operationOptions.units}`,
                    });
                }
            }
        } else if (lowerOperationName === "simplify") {
            const targetLayer = operationOptions.targetLayer;
            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source;
                const targetData = targetLayerSource
                    ? map?.getSource(targetLayerSource)?.serialize().data
                    : undefined;
                const simplifyLayer = await simplifyLayers(
                    targetData,
                    Number(operationOptions.tolerance)
                );
                if (simplifyLayer) {
                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: simplifyLayer as GeoJSON.GeoJSON,
                        layerName: `Simplify ${(layers?.length ?? 0) + 1} ${operationOptions.tolerance
                            }`,
                    });
                    console.log("Center", simplifyLayer);
                }
            }
        } else if (lowerOperationName === "smoothing") {
        } else if (lowerOperationName === "split by line") {
        } else if (lowerOperationName === "building") {
            const targetLayer = operationOptions.targetLayer;
            const cutBuilding = operationOptions.cutBuilding;

            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source ?? "";
                const targetData = map?.getSource(targetLayerSource)?.serialize().data;

                // Pastikan fallback ke null jika undefined
                let buildingLayer: FeatureCollection<Geometry> | null =
                    (await buildingLayers(targetData)) ?? null;

                console.log("Building layer created:", buildingLayer);

                if (cutBuilding === "Extract Building" && buildingLayer) {
                    const clipped = await clipLayers(
                        targetData as FeatureCollection<Polygon | MultiPolygon>,
                        buildingLayer as FeatureCollection<Polygon | MultiPolygon>
                    );
                    buildingLayer = clipped ?? null;
                }

                if (buildingLayer) {
                    const layerName = `Building ${cutBuilding === "Extract Building" ? "Clip" : ""
                        } ${(layers?.length ?? 0) + 1}`;

                    addGeojsonToMap({
                        mapRef: mapRef,
                        data: buildingLayer as GeoJSON.GeoJSON,
                        layerName: layerName,
                    });

                    console.log("Building layer created:", layerName);
                }
            }
        } else if (lowerOperationName === "elevation") {
            const targetLayer = operationOptions.targetLayer;
            const sourceElevation = operationOptions.sourceelevation;

            if (targetLayer) {
                const targetLayerSource = map?.getLayer(targetLayer)?.source ?? "";
                const targetData = map?.getSource(targetLayerSource)?.serialize().data;

                const pointsLayer = await pointAlongLinesLayers(
                    targetData,
                    Number(operationOptions.interval),
                    operationOptions.units
                );

                if (!pointsLayer) {
                    console.warn("No points generated from line layer.");
                    return;
                }

                const elevationLayer = await elevationLayers(
                    pointsLayer as FeatureCollection<Geometry>,
                    sourceElevation
                );

                console.log("Elevation layer created:", elevationLayer);
            }
        }
        setIsLoading(false);
    };

    // Get operation details for the selected operation
    const getOperationDetail = (operationName: string) => {
        const lowerCaseName = operationName.toLowerCase();
        return (
            operationDetails[lowerCaseName] || {
                title: operationName,
                description: `Configure ${operationName} operation.`,
                options: [],
            }
        );
    };

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="w-full h-full">
                {selectedOperation ? (
                    // Operation Detail Panel
                    <div className="h-full overflow-y-auto">
                        {/* Header */}
                        <div className="p-4 border-b flex items-center gap-3">
                            <button
                                onClick={handleBackClick}
                                className="hover:bg-gray-100 p-1 rounded-full"
                            >
                                <ArrowLeft className="h-5 w-5 text-gray-500" />
                            </button>
                            <h1 className="text-mdfont-medium">
                                {getOperationDetail(selectedOperation).title}
                            </h1>
                        </div>

                        {/* Description */}
                        <div className="p-4 border-b">
                            <p className="text-xs text-gray-600">
                                {getOperationDetail(selectedOperation).description}
                            </p>
                        </div>

                        {/* Feature Selection */}
                        {/* <div className="p-4 border-b">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Create bounds around...</span>
                                <button className="text-sm text-blue-600">Switch to datasets</button>
                            </div>
                            <div className="relative">
                                <div className="border rounded-md p-2 pl-8 flex items-center justify-between border-blue-200">
                                    <span className="text-sm">= Select features in map</span>
                                    <div className="h-5 w-5 rounded-full border border-gray-300 flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        {/* Options */}
                        {getOperationDetail(selectedOperation).options.map(
                            (option, index) => (
                                <div key={index} className="p-4 border-b">
                                    <div className="flex items-center gap-1 mb-2">
                                        <span className="text-sm font-medium">{option.name}</span>
                                        {option.info && <Info className="h-4 w-4 text-gray-400" />}
                                    </div>
                                    <div className="relative">
                                        {option.type === "select" ? (
                                            <Select
                                                onValueChange={(e) => handleOptionChange(option.id, e)}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder={`Select ${option.name}`} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Array.isArray(option.value) &&
                                                        option.value.map((item, index) => {
                                                            const isObjectValue = typeof item === "object";
                                                            const value = isObjectValue ? item.key : item;
                                                            const label = isObjectValue ? item.value : item;
                                                            return (
                                                                <SelectItem
                                                                    className="capitalize"
                                                                    key={index}
                                                                    value={value}
                                                                >
                                                                    {label}
                                                                </SelectItem>
                                                            );
                                                        })}
                                                </SelectContent>
                                            </Select>
                                        ) : option.type === "number" ? (
                                            <input
                                                type="number"
                                                defaultValue={
                                                    typeof option.value === "string"
                                                        ? option.value
                                                        : undefined
                                                }
                                                className="w-full bg-background border border-gray-600 rounded-md py-2 px-3 text-sm"
                                                onChange={(e) =>
                                                    handleOptionChange(option.id, e.target.value)
                                                }
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                defaultValue={
                                                    typeof option.value === "string"
                                                        ? option.value
                                                        : undefined
                                                }
                                                className="w-full bg-background border border-gray-600 rounded-md py-2 px-3 text-sm"
                                                onChange={(e) =>
                                                    handleOptionChange(option.id, e.target.value)
                                                }
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        )}

                        {/* Run Button */}
                        <div className="p-4 flex justify-end">
                            <button
                                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded flex gap-2 items-center"
                                // disabled={isLoading}
                                onClick={(e) => {
                                    handleRun();
                                }}
                            >
                                {isLoading && (
                                    <motion.div
                                        className="w-4 h-4 border-[3px] border-black dark:border-white border-t-transparent rounded-full"
                                        animate={{
                                            rotate: 360,
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            ease: "linear",
                                            repeat: Infinity,
                                        }}
                                    />
                                )}
                                Run {selectedOperation}
                            </button>
                        </div>
                    </div>
                ) : (
                    // Operations List Panel
                    <div className="h-full overflow-y-auto">
                        {/* Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="w-full bg-background border border-neutral-200 dark:border-neutral-800 rounded-md py-2 pl-9 pr-3 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Geoprocessing Section */}
                        {filteredOperations(geoprocessingOperations).length > 0 && (
                            <div className="px-4 mb-6">
                                <h2 className="text-base font-medium mb-3">Geoprocessing</h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {filteredOperations(geoprocessingOperations).map(
                                        (op, index) => (
                                            <OperationButton
                                                key={`geo-${index}`}
                                                icon={op.icon}
                                                label={op.label}
                                                onClick={() => handleOperationClick(op.label)}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Geometry Section */}
                        {filteredOperations(geometryOperations).length > 0 && (
                            <div className="px-4 mb-6">
                                <h2 className="text-base font-medium mb-3">Geometry</h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {filteredOperations(geometryOperations).map((op, index) => (
                                        <OperationButton
                                            key={`geom-${index}`}
                                            icon={op.icon}
                                            label={op.label}
                                            onClick={() => handleOperationClick(op.label)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Section */}
                        {filteredOperations(analysisOperations).length > 0 && (
                            <div className="px-4 mb-6">
                                <h2 className="text-base font-medium mb-3">Analysis</h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {filteredOperations(analysisOperations).map((op, index) => (
                                        <OperationButton
                                            key={`analysis-${index}`}
                                            icon={op.icon}
                                            label={op.label}
                                            onClick={() => handleOperationClick(op.label)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Inttegration Section */}
                        {filteredOperations(integrationOperations).length > 0 && (
                            <div className="px-4 mb-6">
                                <h2 className="text-base font-medium mb-3">Integration</h2>
                                <div className="grid grid-cols-3 gap-2">
                                    {filteredOperations(integrationOperations).map(
                                        (op, index) => (
                                            <OperationButton
                                                key={`analysis-${index}`}
                                                icon={op.icon}
                                                label={op.label}
                                                onClick={() => handleOperationClick(op.label)}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper Components
function OperationButton({
    icon,
    label,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <div className="flex flex-col items-center">
            <button
                onClick={onClick}
                className="w-full aspect-square border rounded-md flex items-center justify-center mb-1 
                 transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 
                 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                aria-label={label}
            >
                {icon}
            </button>
            <span className="text-xs text-center">{label}</span>
        </div>
    );
}

// Types
interface OperationItem {
    icon: React.ReactNode;
    label: string;
}

interface OperationDetail {
    title: string;
    description: string;
    options: {
        id: string;
        name: string;
        type: string;
        value: { key: string; value: string }[] | string[] | string | undefined;
        info: boolean;
    }[];
}
