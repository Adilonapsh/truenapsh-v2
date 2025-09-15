import { Layer } from "@/types/map.types";
import { create } from "zustand";

interface LayerState {
  layers: Layer[];
  setLayers: (layers: Layer[]) => void;
  setVisible: (layerId: string, visible: boolean) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
}

const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  setLayers: (layers: Layer[]) => set({ layers }),
  setVisible: (layerId: string, visible: boolean) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible } : layer
      ),
    })),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layerId) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== layerId),
    })),
}));

export default useLayerStore;

export const useLayers = () => useLayerStore((state) => state.layers);
export const useSetLayers = () => useLayerStore((state) => state.setLayers);
export const useAddLayer = () => useLayerStore((state) => state.addLayer);
export const useRemoveLayerById = () =>
  useLayerStore((state) => state.removeLayer);
