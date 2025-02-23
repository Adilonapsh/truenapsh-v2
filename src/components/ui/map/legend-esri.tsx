'use client'
import React, { useEffect, useState } from "react";

interface LegendItem {
    imageData: string;
    label: string;
}

const LegendEsri: React.FC<{ url: string }> = ({ url }) => {
    const data: LegendItem[] = [];
    const [legendData, setLegendData] = useState<LegendItem[]>([]);
    useEffect(() => {
        const fetchLegend = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const legendJson = await response.json();
                const legendItems: LegendItem[] = legendJson.layers[0].legend.map((item: any) => ({
                    imageData: item.imageData,
                    label: item.label,
                }));
                setLegendData(legendItems);
            } catch (error) {
                console.error("Error fetching legend data:", error);
            }
        };
        fetchLegend();
    }, []);
    data.push(...legendData);

    return (
        <div>
            {data.map((item, index) => (
                <div key={index} className="flex gap-2">
                    <img src={`data:image/png;base64,${item.imageData}`} alt={item.label} width="20" height="20" />
                    <span style={{ fontSize: "14px" }}>{item.label}</span>
                </div>
            ))}
        </div>
    );
};

export default LegendEsri;