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
        }
    }
}


const isCoordinates = (str: string) => {
    const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
    if (!coordRegex.test(str)) {
        return false;
    }
    return true;
}


export {
    searchPlaces,
    isCoordinates
}