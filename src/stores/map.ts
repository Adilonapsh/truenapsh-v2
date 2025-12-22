import { Layer, LayoutDisplay, MapIsLoading } from "@/types/map.types";
import { RefObject } from "react";
import { MapRef } from "react-map-gl";
import { create } from "zustand";


interface MapStore {
    map: RefObject<MapRef | null>;
    setMap: (ref: MapRef) => void;
    isLoading: MapIsLoading;
    setIsLoading: (loading: Partial<MapIsLoading>) => void;
    displayLayouts: LayoutDisplay;
    setDisplayLayouts: (layouts: Partial<LayoutDisplay>) => void;
    selectedLayer: Layer | null;
    setSelectedLayer: (layer: Layer | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
    map: { current: null },
    setMap: (ref) => set({ map: { current: ref } }),
    isLoading: {
        initLoading: true,
        zoomToMap: false,
        featureInfo: false,
        dataset: false,
        layerTable: false,
    },
    setIsLoading: (loading) =>
        set((state) => ({
            isLoading: { ...state.isLoading, ...loading }
        })),
    displayLayouts: {
        layerInfo: false,
        style: false,
        legend: false,
        addLayer: false,
        aiChat: false,
        node_workspace: false,
        routes: false,
        tools: false,
        table: false,
        drawProperties: false,
    },
    setDisplayLayouts: (layouts) =>
        set((state) => ({
            displayLayouts: { ...state.displayLayouts, ...layouts }
        })),
    selectedLayer: null,
    setSelectedLayer: (layer) => set({ selectedLayer: layer }),
}));
