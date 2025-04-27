import { Layer } from "@/types/map.types";
import React, { createContext, useState, useContext, useEffect } from "react";

// Context untuk menyimpan state layers
const LayersContext = createContext<any>(null);

// Hook custom untuk menggunakan context
export const useLayers = () => {
    const context = useContext(LayersContext);
    if (!context) {
        throw new Error("useLayers must be used within a LayersProvider");
    }
    return context;
};


export const LayersProvider = ({ children, initialLayers }: { children: React.ReactNode, initialLayers: Layer[] }) => {
    const [layers, setLayers] = useState<Layer[]>(initialLayers);

    useEffect(() => {
        setLayers(initialLayers);
    }, [initialLayers]);

    return (
        <LayersContext.Provider value={{ layers, setLayers }}>
            {children}
        </LayersContext.Provider>
    );
};
