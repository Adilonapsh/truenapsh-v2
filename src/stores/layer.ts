import { Layer } from "@/types/map.types";
import { create } from "zustand";

export interface LayerState {
  layers: Layer[];
  folders: string[];
  layerOrder: Record<string, string[]>; // Key: folder path (or "root"), Value: Array of IDs
  setLayers: (layers: Layer[]) => void;
  setVisibility: (layerId: string, visible: boolean) => void;
  setFolderVisibility: (folderPath: string, visible: boolean) => void;
  updateLayerFolder: (layerId: string, folder: string | undefined) => void;
  addFolder: (folderPath: string) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  renameFolder: (oldPath: string, newPath: string) => void;
  removeFolder: (folderPath: string) => void;
  setFields: (layerId: string, fields: Layer["fields"]) => void;
  setFilters: (layerId: string, filters: Layer["filters"]) => void;
  setFolders: (folders: string[]) => void;
  setLayerOrder: (folderPath: string, order: string[]) => void;
  setZoomRange: (layerId: string, minZoom: number, maxZoom: number) => void;
  updateLayerMetadata: (layerId: string, metadata: any) => void;
}

const useLayerStore = create<LayerState>((set) => ({
  layers: [],
  folders: [],
  layerOrder: {},
  setLayers: (layers: Layer[]) => set({ layers }),
  addLayer: (layer) => set((state) => ({ layers: [...state.layers, layer] })),
  removeLayer: (layerId) =>
    set((state) => {
      // Cleanup layerOrder
      const newOrder = { ...state.layerOrder };
      Object.keys(newOrder).forEach(key => {
        newOrder[key] = newOrder[key].filter(id => id !== layerId);
      });
      return {
        layers: state.layers.filter((layer) => layer.id !== layerId),
        layerOrder: newOrder
      };
    }),
  setVisibility: (layerId: string, visible: boolean) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible } : layer
      ),
    })),
  setFolderVisibility: (folderPath: string, visible: boolean) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.folder === folderPath || layer.folder?.startsWith(folderPath + "/")
          ? { ...layer, visible }
          : layer
      ),
    })),
  updateLayerFolder: (layerId: string, folder: string | undefined) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, folder } : layer
      ),
    })),
  addFolder: (folderPath: string) =>
    set((state) => ({
      folders: state.folders.includes(folderPath)
        ? state.folders
        : [...state.folders, folderPath],
    })),
  renameFolder: (oldPath, newPath) =>
    set((state) => {
      const newOrder = { ...state.layerOrder };
      // Rename keys in layerOrder
      if (newOrder[oldPath]) {
        newOrder[newPath] = newOrder[oldPath];
        delete newOrder[oldPath];
      }
      // Rename items in layerOrder (if folders are in the order list)
      // Folders in order list are just "folder-{path}"? No, let's assume "folder-{name}" relative to parent?
      // Wait, buildLayerTree uses "folder-{fullPath}" as ID.
      // So we need to update IDs in the value arrays as well.
      Object.keys(newOrder).forEach(key => {
        newOrder[key] = newOrder[key].map(id => {
          if (id === `folder-${oldPath}`) return `folder-${newPath}`;
          if (id.startsWith(`folder-${oldPath}/`)) {
            return `folder-${newPath}${id.slice(`folder-${oldPath}`.length)}`;
          }
          return id;
        });
        // Also handle subfolder keys
        if (key.startsWith(oldPath + "/")) {
          const newKey = newPath + key.slice(oldPath.length);
          newOrder[newKey] = newOrder[key];
          delete newOrder[key];
        }
      });

      return {
        folders: state.folders.map((f) =>
          f === oldPath ? newPath : f.startsWith(oldPath + "/") ? newPath + f.slice(oldPath.length) : f
        ),
        layers: state.layers.map((layer) => {
          if (layer.folder === oldPath) {
            return { ...layer, folder: newPath };
          }
          if (layer.folder?.startsWith(oldPath + "/")) {
            return { ...layer, folder: newPath + layer.folder.slice(oldPath.length) };
          }
          return layer;
        }),
        layerOrder: newOrder
      }
    }),
  removeFolder: (folderPath) =>
    set((state) => {
      const newOrder = { ...state.layerOrder };

      // Delete the folder's own order entry
      delete newOrder[folderPath];

      // Delete all subfolder order entries
      Object.keys(newOrder).forEach(key => {
        if (key.startsWith(folderPath + "/")) {
          delete newOrder[key];
        }
      });

      // Remove folder references from all parent order arrays
      Object.keys(newOrder).forEach(key => {
        newOrder[key] = newOrder[key].filter(id => {
          // Remove the folder itself
          if (id === `folder-${folderPath}`) return false;
          // Remove all subfolders
          if (id.startsWith(`folder-${folderPath}/`)) return false;
          return true;
        });
      });

      return {
        folders: state.folders.filter((f) => f !== folderPath && !f.startsWith(folderPath + "/")),
        layers: state.layers.filter((layer) =>
          layer.folder !== folderPath && !layer.folder?.startsWith(folderPath + "/")
        ),
        layerOrder: newOrder
      }
    }),
  setFields: (layerId: string, fields: Layer["fields"]) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, fields } : layer
      ),
    })),
  setFilters: (layerId: string, filters: Layer["filters"]) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, filters } : layer
      ),
    })),
  setFolders: (folders: string[]) => set({ folders }),
  setLayerOrder: (folderPath: string, order: string[]) =>
    set((state) => ({
      layerOrder: { ...state.layerOrder, [folderPath]: order }
    })),
  setZoomRange: (layerId: string, minZoom: number, maxZoom: number) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, min_zoom: minZoom, max_zoom: maxZoom } : layer
      ),
    })),
  updateLayerMetadata: (layerId: string, metadata: any) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === layerId ? { ...layer, metadata: { ...layer.metadata, ...metadata } } : layer
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
export const useSetFilters = () => useLayerStore((state) => state.setFilters);
