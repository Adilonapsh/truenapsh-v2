import { create } from "zustand";
import { MapRef } from "react-map-gl";

interface MapStore {
  mapRef: React.RefObject<MapRef | null> | null;
  setMapRef: (ref: MapRef) => void;
}

const useMapStore = create<MapStore>((set) => ({
  mapRef: null,
  setMapRef: (ref) => set({ mapRef: ref }),
}));

export default useMapStore;
