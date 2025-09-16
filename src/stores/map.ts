import { LayoutDisplay, MapIsLoading } from "@/types/map.types";
import { MapRef } from "react-map-gl";
import { create } from "zustand";


interface MapStore {
    map: MapRef | null;
    setMap: (ref: MapRef) => void;
    isLoading: MapIsLoading;
    setIsLoading: (loading: Partial<MapIsLoading>) => void;
    displayLayouts: LayoutDisplay;
    setDisplayLayouts: (layouts: Partial<LayoutDisplay>) => void;
}

export const useMapStore = create<MapStore>((set) => ({
    map: null,
    setMap: (ref) => set({ map: ref }),
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
    },
    setDisplayLayouts: (layouts) =>
        set((state) => ({
            displayLayouts: { ...state.displayLayouts, ...layouts }
        })),
}));
