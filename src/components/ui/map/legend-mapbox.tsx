import { Layer } from '@/types/map.types'
import React, { useEffect, useState } from 'react'
import { MapRef } from 'react-map-gl';

type LegendItem = {
    type: string;
    color?: string;
    size?: number;
    filter?: any; // Bisa string atau array filter
}

type Props = {
    mapRef: React.RefObject<MapRef | null>,
    selectedLayer: Layer | null
}

function LegendMapbox({ mapRef, selectedLayer }: Props) {
    const [legends, setLegends] = useState<LegendItem[]>([]);
    const map = mapRef.current?.getMap();
    const selectedLayerId = selectedLayer?.id;

    useEffect(() => {
        if (!map || !selectedLayerId) return;

        const layer = map.getLayer(selectedLayerId);
        if (!layer) return;

        const type = layer.type || "";
        const filters = map.getFilter(selectedLayerId); // Ambil filter layer
        const legendItems: LegendItem[] = [];

        if (!filters) {
            // Jika tidak ada filter, ambil style default
            const color = getColor(type, selectedLayerId, map);
            const size = getSize(type, selectedLayerId, map);
            legendItems.push({ type, color: color?.toString(), size: typeof size === 'number' ? size : undefined });
        } else {
            // Jika ada filter, buat legend untuk setiap filter
            const uniqueFilters = extractUniqueFilters(filters);

            uniqueFilters.forEach((filter) => {
                const color = getColor(type, selectedLayerId, map, filter);
                const size = getSize(type, selectedLayerId, map, filter);
                legendItems.push({ type, color: color?.toString(), size: typeof size === 'number' ? size : undefined, filter });
            });
        }

        setLegends(legendItems);
    }, [map, selectedLayerId]);

    return (
        <div className="space-y-2">
            {legends.map((legend, index) => (
                <div key={index} className="flex items-center space-x-2">
                    {legend.type === "fill" && (
                        <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: legend.color }}></span>
                    )}
                    {legend.type === "line" && (
                        <div className="h-[2px] w-6" style={{ backgroundColor: legend.color, height: `${legend.size}px` }}></div>
                    )}
                    {legend.type === "circle" && (
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: legend.color, width: `${legend.size}px`, height: `${legend.size}px` }}></span>
                    )}
                    {legend.type === "symbol" && (
                        <span className="text-sm font-bold" style={{ color: legend.color }}>T</span>
                    )}
                    {legend.type === "heatmap" && (
                        <span className="w-6 h-3 bg-gradient-to-r from-blue-500 to-red-500 rounded-md"></span>
                    )}
                    <span>
                        <span>{selectedLayer?.name || "No layer selected"} {legend.filter ? `(${formatFilter(legend.filter)})` : ""}</span>
                    </span>
                </div>
            ))}
        </div>
    );
}

const formatFilter = (filter: any): string => {
    if (!filter) return "";

    if (Array.isArray(filter)) {
        if (filter[0] === "==") {
            return `${filter[1]}: ${filter[2]}`;
        } else if (filter[0] === "in") {
            return `${filter[1]}: [${filter.slice(2).join(", ")}]`;
        } else if (filter[0] === "all") {
            return filter.slice(1).map(f => formatFilter(f)).join(", ");
        } else if (filter[0] === "any") {
            return `(${filter.slice(1).map(f => formatFilter(f)).join(" OR ")})`;
        }
    }

    return JSON.stringify(filter);
};


// **Helper function untuk mengambil warna berdasarkan filter**
const getColor = (type: string, layerId: string, map: mapboxgl.Map, filter?: any) => {
    if (type === "fill") return map.getPaintProperty(layerId, "fill-color");
    if (type === "line") return map.getPaintProperty(layerId, "line-color");
    if (type === "circle") return map.getPaintProperty(layerId, "circle-color");
    if (type === "symbol") return map.getPaintProperty(layerId, "text-color");
    if (type === "heatmap") return map.getPaintProperty(layerId, "heatmap-color");
    return "";
};

// **Helper function untuk mengambil ukuran berdasarkan filter**
const getSize = (type: string, layerId: string, map: mapboxgl.Map, filter?: any) => {
    if (type === "line") return map.getPaintProperty(layerId, "line-width") || 2;
    if (type === "circle") return map.getPaintProperty(layerId, "circle-radius") || 5;
    return 5;
};

// **Ekstrak filter unik dari Mapbox filter array**
const extractUniqueFilters = (filters: any) => {
    if (!Array.isArray(filters)) return [];

    const extractedFilters: any[] = [];

    if (filters[0] === "all") {
        filters.slice(1).forEach((f) => {
            if (Array.isArray(f) && f.length >= 3) {
                extractedFilters.push(f);
            }
        });
    } else {
        extractedFilters.push(filters);
    }

    return extractedFilters;
};

export default LegendMapbox;
