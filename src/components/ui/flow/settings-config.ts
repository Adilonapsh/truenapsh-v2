export interface SettingInput {
    id: string;
    label: string;
    type: "text" | "url" | "select" | "number" | "switch" | "file" | "key-value-list";
    options?: (string | { label: string; value: string })[];
    defaultValue?: string;
    tooltip?: string;
    showIf?: (parameters: Record<string, any>) => boolean;
    isOptional?: boolean;
}

export const settingsInputs: Record<string, SettingInput[]> = {
    //Trigger
    websocket: [
        { id: "url", label: "URL", type: "url" },
        { id: "body", label: "Body", type: "switch" },
    ],
    // Input/Output
    import: [
        { id: "file", label: "File", type: "file" },
        {
            id: "type",
            label: "Type",
            type: "select",
            options: ["Text", "CSV", "JSON", "GEOJSON", "Excel"],
            defaultValue: "Text",
        },
    ],
    export: [
        { id: "name", label: "Name", type: "text" },
        {
            id: "type",
            label: "Type",
            type: "select",
            options: ["Text", "CSV", "JSON", "GEOJSON", "Excel"],
            defaultValue: "Text",
        },
    ],
    map: [
        {
            id: "type",
            label: "Type",
            type: "select",
            options: [
                "filter",
                "change_style",
                "change_data",
                "change_source",
                "change_source_data",
                "change_layer_name",
            ],
        },
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data GEOJSON to be mapped",
            showIf: (p) => p.type === "change_data",
        },
        {
            id: "output",
            label: "Output",
            type: "text",
            tooltip: "Output GEOJSON",
        },
        {
            id: "expression",
            label: "Expression",
            type: "text",
            tooltip: "Expression to be mapped",
            showIf: (p) => p.type === "change_style",
        },
        {
            id: "filter",
            label: "Filter",
            type: "text",
            tooltip: "Filter to be applied",
            showIf: (p) => p.type === "filter",
        },
    ],
    analytics: [
        {
            id: "name",
            label: "Name",
            type: "text",
            tooltip: "Name of the analytics",
        },
    ],
    "http-request": [
        {
            id: "method",
            label: "Method",
            type: "select",
            options: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
            defaultValue: "GET",
        },
        { id: "url", label: "URL", type: "url" },
        { id: "send_query", label: "Send Query Parameters", type: "switch" },
        {
            id: "query_params",
            label: "Query Parameters",
            type: "key-value-list",
            showIf: (p) => p.send_query === "true",
        },
        { id: "send_headers", label: "Send Headers", type: "switch" },
        {
            id: "headers",
            label: "Headers",
            type: "key-value-list",
            showIf: (p) => p.send_headers === "true",
        },
        { id: "send_body", label: "Send Body", type: "switch" },
        {
            id: "body_params",
            label: "Body Parameters",
            type: "key-value-list",
            showIf: (p) => p.send_body === "true",
        },
        // Optional Settings
        {
            id: "ignore_ssl",
            label: "Ignore SSL Issues (Insecure)",
            type: "switch",
            isOptional: true,
            tooltip: "Ignore SSL Issues (Insecure)",
        },
        {
            id: "timeout",
            label: "Timeout",
            type: "number",
            defaultValue: "10000",
            isOptional: true,
            tooltip: "Timeout in milliseconds",
        },
        {
            id: "redirects",
            label: "Redirects",
            type: "switch",
            isOptional: true,
            tooltip: "Redirects",
        },
        {
            id: "array_format",
            label: "Array Format in Query Parameters",
            type: "switch",
            isOptional: true,
            tooltip: "Array Format in Query Parameters",
        },
        {
            id: "lowercase_headers",
            label: "Lowercase Headers",
            type: "switch",
            isOptional: true,
            tooltip: "Lowercase Headers",
        },
        {
            id: "proxy",
            label: "Proxy",
            type: "text",
            isOptional: true,
            tooltip: "Proxy",
        },
    ],
    // Data Preparation
    select: [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be selected",
        },
    ],
    "order-by": [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be ordered",
        },
        {
            id: "order",
            label: "Order",
            type: "select",
            options: ["Ascending", "Descending"],
            defaultValue: "Ascending",
        },
    ],
    limit: [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be limited",
        },
        {
            id: "limit",
            label: "Limit",
            type: "number",
            tooltip: "Limit of the data",
        },
    ],
    filter: [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be filtered",
        },
        {
            id: "filter",
            label: "Filter",
            type: "text",
            tooltip: "Filter to be applied",
        },
    ],
    join: [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be joined",
        },
        {
            id: "join",
            label: "Join",
            type: "text",
            tooltip: "Join to be applied",
        },
    ],
    "group-by": [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be grouped",
        },
        {
            id: "group",
            label: "Group",
            type: "text",
            tooltip: "Group to be applied",
        },
    ],
    count: [
        {
            id: "data",
            label: "Data",
            type: "text",
            tooltip: "Data to be counted",
        },
    ],
    // Geoprocessing
    boundary: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
        {
            id: "layer-overlay",
            label: "Layer overlay",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    buffer: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
        {
            id: "buffer",
            label: "Buffer",
            type: "number",
            tooltip: "Buffer to be applied",
        },
        {
            id: "unit",
            label: "Unit",
            type: "select",
            options: ["Meter", "Kilometer", "Mile"],
            defaultValue: "Meter",
        },
        {
            id: "buffer-type",
            label: "Buffer Type",
            type: "select",
            options: ["Simple", "Dissolve"],
            defaultValue: "Simple",
        },
    ],
    clip: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
        {
            id: "layer-overlay",
            label: "Layer overlay",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    difference: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
        {
            id: "layer-overlay",
            label: "Layer overlay",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    intersection: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
        {
            id: "layer-overlay",
            label: "Layer overlay",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    //  Geometry
    centroid: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    "lines-to-polygon": [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    "polygon-to-lines": [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    "remove-duplicates": [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    "generate-points": [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    simplify: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    // Analysis
    "hexagon-grid": [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    // Integration
    building: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
    elevation: [
        {
            id: "layer-input",
            label: "Layer Input",
            type: "select",
            tooltip: "Layer to be boundary",
        },
    ],
};
