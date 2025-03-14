import * as turf from '@turf/turf';

const overpassBuildingIntegration = async () => {
    const bbox = {
        south: -6.6229,
        west: 106.7892,
        north: -6.5729,
        east: 106.8392
    };
    const query = `[out:json][timeout:25];(way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});relation["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east}););out body geom;`;

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
                // if (coords.length > 2 && coords[0] !== coords[coords.length - 1]) {
                //     coords.push(coords[0]);
                // }
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