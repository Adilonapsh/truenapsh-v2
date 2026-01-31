import React from "react";
import {
    Square,
    Settings,
    Scissors,
    Link,
    Combine,
    Pentagon,
    SquareStack,
    SquareDashedBottom,
    Trash2,
    LineChart,
    PenTool,
    Hexagon,
    Building2,
} from "lucide-react";
import { MdTerrain } from "react-icons/md";
import { Layer } from "@/types/map.types";

export interface OperationItem {
    icon: React.ReactNode;
    label: string;
}

export interface OperationOption {
    id: string;
    name: string;
    type: "select" | "number" | "text";
    value: { key: string; value: string }[] | string[] | string | undefined;
    info: boolean;
}

export interface OperationDetail {
    title: string;
    description: string;
    options: OperationOption[];
}

export const geoprocessingOperations: OperationItem[] = [
    { icon: <Square className="h-5 w-5" />, label: "Boundary" },
    { icon: <Settings className="h-5 w-5" />, label: "Buffer" },
    { icon: <Scissors className="h-5 w-5" />, label: "Clip" },
    { icon: <Link className="h-5 w-5" />, label: "Difference" },
    { icon: <Combine className="h-5 w-5" />, label: "Intersection" },
];

export const geometryOperations: OperationItem[] = [
    { icon: <Pentagon className="h-5 w-5" />, label: "Centroid" },
    { icon: <SquareStack className="h-5 w-5" />, label: "Lines to Polygon" },
    { icon: <SquareDashedBottom className="h-5 w-5" />, label: "Polygon to Lines" },
    { icon: <Trash2 className="h-5 w-5" />, label: "Remove duplicates" },
    { icon: <LineChart className="h-5 w-5" />, label: "Generate Points Along Line" },
    { icon: <PenTool className="h-5 w-5" />, label: "Simplify" },
];

export const analysisOperations: OperationItem[] = [
    { icon: <Hexagon className="h-5 w-5" />, label: "Hexagon Grid" },
];

export const integrationOperations: OperationItem[] = [
    { icon: <Building2 className="h-5 w-5" />, label: "Building" },
    { icon: <MdTerrain className="h-5 w-5" />, label: "Elevation" },
];

export const getOperationDetails = (layers: Layer[]): Record<string, OperationDetail> => ({
    boundary: {
        title: "Boundary",
        description: "Create a boundary around features.",
        options: [
            { id: "typeOfBoundary", name: "Type of Boundary", type: "select", value: ["Bounding Box"], info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon"], info: true },
        ],
    },
    buffer: {
        title: "Buffer",
        description: "Create a buffer zone around features.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "bufferDistance", name: "Buffer Distance", type: "number", value: "10", info: true },
            { id: "units", name: "Units", type: "select", value: ["meters", "kilometers", "miles", "feet", "degrees"], info: false },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon", "Line", "Point"], info: true },
        ],
    },
    clip: {
        title: "Clip",
        description: "Clip a selection with another selection.",
        options: [
            { id: "sourceLayer", name: "Clip Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon", "Line", "Point"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    difference: {
        title: "Difference",
        description: "Remove features from a selection.",
        options: [
            { id: "sourceLayer", name: "Clip Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon", "Line", "Point"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    "lines to polygon": {
        title: "Line To Polygon",
        description: "Convert lines to polygons.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    centroid: {
        title: "Centroid",
        description: "Create a centroid of features.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Point"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    "polygon to lines": {
        title: "Polygon To Lines",
        description: "Convert polygons to lines.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Line"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    "remove duplicates": {
        title: "Remove Duplicates",
        description: "Remove duplicate features.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon", "Line", "Point"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    "hexagon grid": {
        title: "Hexagon Grid",
        description: "Create a hexagonal grid.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "cellSize", name: "Cell Size", type: "number", value: "10", info: true },
            { id: "units", name: "Units", type: "select", value: ["meters", "kilometers", "miles", "feet", "degrees"], info: false },
            { id: "gridCode", name: "Grid Code", type: "text", value: "Grid-001", info: true },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Polygon"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    simplify: {
        title: "Simplify",
        description: "Simplify geometry.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "tolerance", name: "Tolerance", type: "number", value: "0.001", info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    "generate points along line": {
        title: "Generate Points Along Line",
        description: "Generate points along lines.",
        options: [
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "interval", name: "Interval", type: "number", value: "0.05", info: true },
            { id: "units", name: "Units", type: "select", value: ["meters", "kilometers", "miles", "feet", "degrees"], info: false },
            { id: "outputGeometry", name: "Output Geometry", type: "select", value: ["Point"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    building: {
        title: "Building",
        description: "Create a building model.",
        options: [
            { id: "sourceBuilding", name: "Source Building", type: "select", value: ["Open street map", "Google Buildings"], info: true },
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "cutBuilding", name: "Cut Building", type: "select", value: ["With Bounding Box", "Extract Building"], info: true },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
    elevation: {
        title: "Elevation",
        description: "Create a Elevation model.",
        options: [
            { id: "sourceelevation", name: "Elevation Source", type: "select", value: ["Map Toolkit", "Open Elevation", "GPXZ"], info: true },
            { id: "targetLayer", name: "Target Layer", type: "select", value: layers?.map((layer) => ({ key: layer.id, value: layer.name })), info: true },
            { id: "interval", name: "Sample Interval", type: "number", value: "0", info: true },
            { id: "units", name: "Units", type: "select", value: ["meters", "kilometers", "miles", "feet", "degrees"], info: false },
            { id: "keepGeometry", name: "Keep Attributes", type: "select", value: ["All", "Selected", "None"], info: false },
        ],
    },
});
