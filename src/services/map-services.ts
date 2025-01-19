// import { Layer, Location, MapServiceVendor, WMSParams } from "@/types/map.types";

import { GetAllLayers, Layer, MapServiceVendor, ParsedLayer, WMSParams } from "@/types/map.types";

const fetchGeoserverLayerBbox = async (url: string, layerId: string) => {
    const urls = `${url}?service=WMS&version=1.3.0&request=GetCapabilities`;
    try {
        const response = await fetch(urls);
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "application/xml");

        const layers = xmlDoc.getElementsByTagName("Layer");
        for (let i = 0; i < layers.length; i++) {
            const name = layers[i].getElementsByTagName("Name")[0].textContent;
            if (name === layerId) {
                const bbox = layers[i].getElementsByTagName("BoundingBox")[0];
                const minLng = bbox.getAttribute("minx");
                const minLat = bbox.getAttribute("miny");
                const maxLng = bbox.getAttribute("maxx");
                const maxLat = bbox.getAttribute("maxy");
                return {
                    minLng,
                    minLat,
                    maxLng,
                    maxLat,
                };
            }
        }
    } catch (error) {
        console.error("Failed to fetch or parse capabilities document:", error);
    }
};

const getFeatureInfo = async (e: mapboxgl.MapMouseEvent, layers: Layer | Layer[], mapRef: mapboxgl.Map) => {
    const lat = e.lngLat.lat;
    const lng = e.lngLat.lng;
    const properties: Array<object> = [];
    const layerList = Array.isArray(layers) ? layers : [layers];
    for (const layer of layerList) {
        if (layer.visible) {
            if (layer.map_service_vendor === "Geoserver" || layer.map_service_vendor === "ArcGIS") {
                if (layer.map_service_vendor === "Geoserver") {
                    const url = generateFeatureInfoURL(lat, lng, layer);
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.features.length > 0) {
                        properties.push({
                            layer_name: layer.name,
                            properties: data.features[0].properties,
                        });
                    }
                } else if (layer.map_service_vendor === "ArcGIS") {
                    const url = generateFeatureInfoURL(lat, lng, layer);
                    const response = await fetch(url);
                    const data = await response.json();
                    if (data.results.length > 0) {
                        properties.push({
                            layer_name: layer.name,
                            properties: data.results[0].attributes,
                        });
                    }
                }
            } else {
                const selectedFeatures = mapRef.queryRenderedFeatures({
                    layers: [layer.map_service_layer_name],
                });
                if (selectedFeatures && selectedFeatures.length > 0) {
                    properties.push({
                        layer_name: layer.name,
                        properties: selectedFeatures[0].properties,
                    });
                }
            }
        }
    }
    return properties;
};

const generateFeatureInfoURL = (
    latitude: number,
    longitude: number,
    layer: Layer
) => {
    if (layer.map_service_vendor === "Geoserver") {
        const params: WMSParams | Record<string, string> = {
            service: "wms",
            version: "1.3.0",
            request: "GetFeatureInfo",
            format: "image/png",
            transparent: "true",
            query_layers: layer.map_service_layer_name.toString(),
            layers: layer.map_service_layer_name.toString(),
            tiled: "true",
            info_format: "application/json",
            i: "128",
            j: "128",
            width: "256",
            height: "256",
            crs: "EPSG:3857",
            styles: "",
            bbox: getBBOX(latitude, longitude, 100).toString(),
        };
        return `${layer.map_service_url}?` + new URLSearchParams(params);
    } else {
        const wmsParams: Record<string, string> = {
            geometry: `${longitude},${latitude}`,
            geometryType: "esriGeometryPoint",
            sr: "4326",
            layers: "all",
            mapExtent: getBBOX(latitude, longitude, 100).toString(),
            imageDisplay: "400,300,96",
            tolerance: "5",
            f: "json"
        };
        return layer.map_service_url + "/identify" + "?" + new URLSearchParams(wmsParams).toString();

    }
};

const getBBOX = (lat: number, lng: number, z: number) => {
    const r = 6378137 * Math.PI * 2;
    const x = (lng / 360) * r;
    const sin = Math.sin((lat * Math.PI) / 180);
    const y = ((0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI) * r;
    return `${x - z},${y - z},${x + z},${y + z}`;
};


// const flyToCenter = (mapRef: React.RefObject<mapboxgl.Map>, location: Location) => {
//     mapRef.flyTo({
//         center: [location.lng, location.lat],
//         essential: true,
//         duration: 2000,
//         zoom: 18
//     });
// };

const convertWMSToVectorData = async (selectedLayer: Layer, mapRef: React.RefObject<mapboxgl.Map>, layers: Layer[]) => {
    // eslint-disable-next-line prefer-const
    let infoLayers = [];
    try {
        const response = await fetch(
            `${selectedLayer?.map_service_url.replace("/wms", "")}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${selectedLayer?.map_service_layer_name}&outputFormat=application/json&srsName=EPSG:4326`
        );
        const data = await response.json();

        const layerID = `vector_${selectedLayer?.map_service_layer_name}_${Date.now()}`
        const sourceID = `${layerID}_source`;
        // SOURCE LAYER
        mapRef.addSource(`${layerID}_source`, {
            type: "geojson",
            data: data,
        });

        // ADD LAYER POLYGON
        if (data.features[0].geometry.type === "Polygon" || data.features[0].geometry.type === "MultiPolygon") {
            const layerId = `${layerID}_poly`;
            mapRef.addLayer({
                id: layerId,
                type: "fill",
                source: sourceID,
                paint: {
                    "fill-color": `#${Math.floor(Math.random() * 16777215).toString(16)} `,
                    "fill-opacity": 0.5,
                },
            });

            const layerInfo: Layer = {
                id: layerId,
                name: `Vector ${selectedLayer?.name} `,
                map_service_url: "null",
                map_service_vendor: MapServiceVendor.GeoJSON,
                map_service_layer_name: layerId,
                visible: true,
                type: '2D'
            }
            infoLayers.push(layerInfo);
        }

        // ADD LAYER LINESTRING
        if (data.features[0].geometry.type === "LineString") {
            const layerId = `${layerID}_line`;
            mapRef.addLayer({
                id: layerId,
                type: "line",
                source: sourceID,
                paint: {
                    "line-color": `#${Math.floor(Math.random() * 16777215).toString(16)} `,
                    "line-width": 2,
                },
            });

            const layerInfo: Layer = {
                id: layerId,
                name: `Vector ${selectedLayer?.name} `,
                map_service_url: "null",
                map_service_vendor: MapServiceVendor.GeoJSON,
                map_service_layer_name: layerId,
                visible: true,
                type: '2D'
            }
            infoLayers.push(layerInfo);
        }

        // ADD LAYER POINT
        if (data.features[0].geometry.type === "Point") {
            const layerId = `${layerID}_point`;
            mapRef.addLayer({
                id: layerId,
                type: "circle",
                source: sourceID,
                paint: {
                    "circle-radius": 5,
                    "circle-color": `#${Math.floor(Math.random() * 16777215).toString(16)} `,
                },
            });

            const layerInfo: Layer = {
                id: layerId,
                name: `Vector ${selectedLayer?.name} `,
                map_service_url: "null",
                map_service_vendor: MapServiceVendor.GeoJSON,
                map_service_layer_name: layerId,
                visible: true,
                type: '2D'
            }
            infoLayers.push(layerInfo);
        }
        return infoLayers;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Error caught:", error.message);
        } else {
            console.error("Unknown error caught:", error);
        }
    }
}

// const getEsriLayers = async (url: string) => {
//     try {
//         const urls = url + "?f=json";
//         const response = await fetch(urls);
//         const body = await response.json();
//         return body;
//         // datasets.forEach(async (datasets) => {
//         //     const urls = datasets.url + "?f=json";
//         //     const response = await fetch(urls);
//         //     const body = await response.json();
//         //     console.log(body);
//         // });
//     } catch (error: unknown) {
//         if (error instanceof Error) {
//             console.error("Error caught:", error.message);
//         } else {
//             console.error("Unknown error caught:", error);
//         }
//     }
// };

const getEsriServices = async (url: string) => {
    try {
        const urls = url + "?f=json";
        const response = await fetch(urls);
        const body = await response.json();
        return body;
        // datasets.forEach(async (datasets) => {
        //     const urls = datasets.url + "?f=json";
        //     const response = await fetch(urls);
        //     const body = await response.json();
        //     console.log(body);
        // });
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.error("Error caught:", err.message);
        } else {
            console.error("Unknown error caught:", err);
        }
    }
}



const getGeoserverServices = async (url: string) => {
    try {
        const urls = `${url.replace("/wms", "")}/ows?service=WMS&version=1.3.0&request=GetCapabilities`;
        const response = await fetch(urls);
        const body = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(body, "text/xml");
        const getAllLayers: GetAllLayers = (node) => {
            const layers: ParsedLayer[] = [];
            const children = node.querySelectorAll("Layer");
            children.forEach((layer) => {
                const name = layer.querySelector("Name")?.textContent || "Unnamed Layer";
                const title = layer.querySelector("Title")?.textContent?.replaceAll("_", " ") || "No Title";
                const legend = layer.querySelector("Style")?.querySelector("LegendURL")?.querySelector("OnlineResource")?.getAttribute("xlink:href");
                const rawbbox = layer.querySelector("EX_GeographicBoundingBox");
                const west = rawbbox?.querySelector("westBoundLongitude")?.textContent;
                const east = rawbbox?.querySelector("eastBoundLongitude")?.textContent;
                const south = rawbbox?.querySelector("southBoundLatitude")?.textContent;
                const north = rawbbox?.querySelector("northBoundLatitude")?.textContent;
                const bbox = `${west},${south},${east},${north}`;
                const thumbnail = `${url}?service=WMS&version=1.1.0&request=GetMap&layers=${name}&bbox=${bbox}&width=300&height=150&srs=EPSG%3A4326&styles=&format=image%2Fjpeg`
                layers.push({ name, title, legend, thumbnail });
                layers.push(...getAllLayers(layer));
            });
            return layers;
        };

        const rootLayer = xmlDoc.querySelector("Capability > Layer");
        const allLayers: ParsedLayer[] = rootLayer ? getAllLayers(rootLayer) : [];
        return allLayers;
    } catch (err: unknown) {
        if (err instanceof Error) {
            console.log("Error caught:", err.message);
        } else {
            console.log("Unknown error caught:", err);
        }
    }
}


const getWMSServices = async (url: string, map_service_vendor: string) => {
    if (map_service_vendor == "Geoserver") {
        return getGeoserverServices(url);
    } else {
        const transform = await transfromEsriServicesToFolder(url);
        console.log(transform);
        return transform;
        // return getEsriServices(url);
    }

}

const transfromEsriServicesToFolder = async (url: string) => {
    let getFolder = await getEsriServices(url);
    let folder = getFolder.folders;
    let generateFolder = await Promise.all(folder.map(async (name: string, i: number) => {
        let getServices = await getEsriServices(`${url}/${name}`);
        let services = getServices.services;
        let generateservices;
        if (services) {
            generateservices = services.map((service: any, j: number) => {
                return {
                    id: `${service.name}-${j}`,
                    name: service.name.replaceAll("_", " ").split("/")[1],
                    type: service.type,
                    children: null,
                    metadata: {
                        type: service.type,
                        url: `${url}${service.name}/${service.type}?f=json`
                    }
                };
            });
            return {
                id: `${name}-${i}`,
                name: name.replaceAll("_", " "),
                type: "folder",
                children: generateservices ? [...generateservices] : [],
            };
        }
    }));
    generateFolder = generateFolder.filter(folder => folder !== undefined);
    return generateFolder;
}

export {
    fetchGeoserverLayerBbox as fetchLayerBbox,
    getFeatureInfo,
    generateFeatureInfoURL,
    getBBOX,
    //     getAutoCompleteLocation,
    //     getPaintProperties,
    //     flyToCenter,
    convertWMSToVectorData,
    //     getEsriLayers,
    //     getEsriServices,
    transfromEsriServicesToFolder,
    getWMSServices,
}