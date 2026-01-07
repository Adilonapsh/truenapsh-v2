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

const weatherIntegration = async (lon: number, lat: number, source?: string) => {
    try {
        if (!source) { source = 'bmkg' }
        let response;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        if (source === 'bmkg') {
            try {
                response = await fetch(`https://weather.bmkg.go.id/api/presentwx/coord?lon=${lon}&lat=${lat}`, {
                    signal: controller.signal
                });
            } finally {
                clearTimeout(timeoutId);
            }
        } else {
            throw new Error(`Source ${source} not supported`);
        }

        if (!response.ok) {
            throw new Error(`Weather API HTTP error! status: ${response.status}`)
        }

        const weatherData = await response.json();
        return weatherData;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error('Weather API request timed out');
            throw new Error('Weather API request timed out after 10 seconds');
        }
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

export {
    overpassBuildingIntegration,
    weatherIntegration
}