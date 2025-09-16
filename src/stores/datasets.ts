import { TreeNode } from "@/components/ui/tree-view";
import { Datasets } from "@/types/datasets.types";
import { MapServiceVendor, ParsedLayer } from "@/types/map.types";
import { create } from "zustand";


interface DatasetsStore {
    datasets: Datasets[];
    setDatasets: (datasets: Datasets[]) => void;
    selectedDatasets: ParsedLayer[];
    setSelectedDatasets: (datasets: ParsedLayer[]) => void;
    datasetProperties: {
        url: string;
        map_service_vendor: MapServiceVendor;
    };
    setDatasetProperties: (properties: { url: string; map_service_vendor: MapServiceVendor }) => void;
    activeDataset: Datasets | null;
    setActiveDataset: (dataset: Datasets | null) => void;
    datasetResult: TreeNode[];
    setDatasetResult: (result: TreeNode[]) => void;
}

const useDatasetStore = create<DatasetsStore>((set) => ({
    datasets: [],
    setDatasets: (datasets) => set({ datasets }),
    selectedDatasets: [],
    setSelectedDatasets: (datasets) => set({ selectedDatasets: datasets }),
    datasetProperties: {
        url: "",
        map_service_vendor: MapServiceVendor.Null,
    },
    setDatasetProperties: (properties) => set({ datasetProperties: properties }),
    activeDataset: null,
    setActiveDataset: (dataset) => set({ activeDataset: dataset }),
    datasetResult: [],
    setDatasetResult: (result) => set({ datasetResult: result }),
}));





export default useDatasetStore;
