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
                    new URLSearchParams({
                        search,
                        lang,
                    }),
                    {
                        mode: "no-cors",
                    }
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
// SLD PARSER
const styleSymbolizer = (simbolyzer: Element, type = "") => {
    let style = {};
    const fillNode = simbolyzer.getElementsByTagName("se:Fill");
    const strokeNode = simbolyzer.getElementsByTagName("se:Stroke");

    if (fillNode) {
        Array.from(fillNode).forEach((fill_param, index) => {
            Array.from(fill_param.getElementsByTagName("se:SvgParameter")).forEach((param) => {
                if (param.getAttribute("name") == "fill") {
                    style.push({ [type + "-color"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke") {
                    style.push({ [type + "-outline-color"]: param.textContent })
                }
            })
        })
    }
    if (strokeNode) {
        Array.from(strokeNode).forEach((stroke_param, index) => {
            Array.from(stroke_param.getElementsByTagName("se:SvgParameter")).forEach(param => {
                if (param.getAttribute("name") == "stroke") {
                    style.push({ [type + "-color"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke-width") {
                    style.push({ [type + "-width"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke-linejoin") {
                    style.push({ [type + "-join"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke-opacity") {
                    style.push({ [type + "-opacity"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke-linecap") {
                    style.push({ [type + "-cap"]: param.textContent })
                } else if (param.getAttribute("name") == "stroke-dasharray") {
                    style.push({ [type + "-dasharray"]: param.textContent })
                }
            })
        })
    }

    style = style.reduce((acc, obj) => {
        return { ...acc, ...obj };
    }, {})

    return style;
}

const parseSLD = (sld: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(sld, "text/xml");
    const rules = xmlDoc.getElementsByTagName("se:Rule");

    const results = [];
    Array.from(rules).forEach((rule, index) => {
        let filter = null;
        let layerStyle = {};

        const filterNode = rule.getElementsByTagName("ogc:Filter")[0];
        if (filterNode) {
            const propertyNode = filterNode.getElementsByTagName("ogc:PropertyName")[0];
            const literalNode = filterNode.getElementsByTagName("ogc:Literal")[0];
            if (propertyNode && literalNode) {
                const property = propertyNode?.textContent?.trim();
                const value = literalNode?.textContent?.trim();
                filter = ["==", ["get", property], value];
            }
        }

        const polygonSymbolizer = rule.getElementsByTagName("se:PolygonSymbolizer")[0];
        const lineSymbolizer = rule.getElementsByTagName("se:LineSymbolizer")[0];
        const pointSymbolizer = rule.getElementsByTagName("se:PointSymbolizer")[0];

        if (polygonSymbolizer) {
            const style = styleSymbolizer(polygonSymbolizer, "fill")
            layerStyle = {
                type: "fill",
                filter: filter,
                paint: style,
            };
        } else if (lineSymbolizer) {
            const style = styleSymbolizer(lineSymbolizer, "line")
            layerStyle = {
                type: "line",
                filter: filter,
                paint: style,
            };
        } else if (pointSymbolizer) {
            const style = styleSymbolizer(pointSymbolizer, "circle")
            layerStyle = {
                type: "circle",
                filter: filter,
                paint: style,
            };
        }
        results.push(layerStyle);
    })
    return results;
}


export {
    searchPlaces,
    isCoordinates,
    parseSLD
}