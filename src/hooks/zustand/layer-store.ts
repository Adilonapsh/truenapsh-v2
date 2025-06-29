import { Layer, MapServiceVendor } from '@/types/map.types'
import { create } from 'zustand'
import { v4 } from 'uuid';

type LayersStore = {
    layers: Layer[],
    setLayers: (layers: Layer[]) => void,
    addLayer: (layer: Layer) => void,
    setLayerVisibility: (layerId: string, status: boolean) => void,
    removeLayer: (layerId: string) => void,
}

export const useLayers = create<LayersStore>((set) => ({
    layers: [],
    setLayers: (layers: Layer[]) =>
        set(() => ({
            layers: layers
        })),
    addLayer: (layer: Layer) =>
        set((state) => ({
            layers: [...state.layers, layer]
        })),
    setLayerVisibility: (layerId: string, status: boolean) =>
        set((state) => ({
            layers: state.layers.map(layer =>
                layer.id === layerId ? { ...layer, visible: status } : layer
            )
        })),
    removeLayer: (layerId: string) =>
        set((state) => ({
            layers: state.layers.filter((layer: Layer) => layer.id !== layerId)
        })),
}))