import { Place } from "@/types/map.types";

const searchPlaces = async (search: string, lang: string = "EN-en") => {
    if (isCoordinates(search)) {
        const place: Place[] = [
            {
                name: search,
                fullName: "Coordinates : " + search,
                address: search,
                location: {
                    lat: parseFloat(search.split(",")[1]),
                    lng: parseFloat(search.split(",")[0]),
                }
            }
        ];
        return place;
    } else {
        try {
            if (search) {
                const response = await fetch(
                    "/api/maps/location?" +
                    new URLSearchParams({ search, lang, }),
                    { mode: "no-cors", }
                );
                const data = await response.json();
                return data.data;
            } else {
                return [];
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Error caught:", error.message);
            } else {
                console.error("Unknown error caught:", error);
            }
            return [];
        }
    }
}

const searchAlternatives = async (from: number[], to: number[]) => {
    try {
        const body = {
            from: {
                x: from[0],
                y: from[1]
            },
            to: {
                x: to[0],
                y: to[1]
            }
        };
        const response = await fetch("/api/maps/alternatives", {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        let alternatives: any = [];
        data.data.alternatives.forEach((alternative: { coords: { x: number; y: number }[]; response: any }) => {
            const { coords, response } = alternative;
            const transformed = coords.map(({ x, y }) => [x, y]);
            alternatives.push({ coords: transformed, response })
        });
        return alternatives;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error caught:", error.message);
        } else {
            console.error("Unknown error caught:", error);
        }
        return [];
    }
}


const isCoordinates = (str: string) => {
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordRegex.test(str)) {
        return false;
    }
    return true;
}

const calculateCoordinatesWithAspectRatio = (
    lngLat: mapboxgl.LngLat,
    aspectRatio: number
): [number, number][] => {
    const baseWidth = 0.01; // Adjust base width as needed
    const height = baseWidth / aspectRatio;

    return [
        [lngLat.lng, lngLat.lat],
        [lngLat.lng + baseWidth, lngLat.lat],
        [lngLat.lng + baseWidth, lngLat.lat - height],
        [lngLat.lng, lngLat.lat - height]
    ];
};



export {
    searchPlaces,
    searchAlternatives,
    isCoordinates,
    calculateCoordinatesWithAspectRatio,
}