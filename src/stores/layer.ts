import { Layer } from "@/types/map.types";
import { create } from "zustand";

export interface LayerState {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  setVisibility: (layerId: string, visible: boolean) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void
  setFields: (layerId: string, fields: Layer["fields"]) => void
}

const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  setLayers: (layers: Layer[]) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== layerId),
    })),
  setVisibility: (layerId: string, visible: boolean) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible } : layer
      ),
    })),
  setFields: (layerId: string, fields: Layer["fields"]) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, fields } : layer
      ),
    })),
}));

export default useLayerStore;

export const useLayers = () => useLayerStore((state) => state.layers);
export const useSetVisible = () => useLayerStore((state) => state.setVisibility);
export const useSetLayers = () => useLayerStore((state) => state.setLayers);
export const useAddLayer = () => useLayerStore((state) => state.addLayer);
export const useRemoveLayerById = () =>
  useLayerStore((state) => state.removeLayer);
export const useSetFields = () => useLayerStore((state) => state.setFields);
