import { BoundingBox } from '@/types/map.types';
import * as turf from '@turf/turf';
import { BBox } from 'geojson';

const overpassBuildingIntegration = async (bbox: BBox) => {
    const bboxNamed = {
        south: bbox[1],
        west: bbox[0],
        north: bbox[3],
        east: bbox[2]
    };
    const query = `[out:json][timeout:25];(way["building"](${bboxNamed.south},${bboxNamed.west},${bboxNamed.north},${bboxNamed.east});relation["building"](${bboxNamed.south},${bboxNamed.west},${bboxNamed.north},${bboxNamed.east}););out body geom;`;

    try {
        const response = await fetch("https://overpass-api.de/api/interpreter", {
            method: "POST",
            body: query,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`) }

        const data = await response.json();

        return data.elements
            .filter((el: any) => el.type === "way" && el.geometry)
            .map((way: any) => {
                const coords = way.geometry.map((pt: any) => [pt.lon, pt.lat]);
                return turf.polygon([coords], way.tags);
            });
    } catch (error) {
        console.error('Error fetching building data:', error);
        throw error;
    }
}

export {
    overpassBuildingIntegration
}