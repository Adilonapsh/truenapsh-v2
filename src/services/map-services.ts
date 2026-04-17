// import { Layer, Location, MapServiceVendor, WMSParams } from "@/types/map.types";

import {
  GetAllLayers,
  Layer,
  LayerNode,
  MapServiceVendor,
  ParsedLayer,
  WMSParams,
} from "@/types/map.types";
import { getBBOX } from "@/tools/map-tools";
import { v4 } from "uuid";
import { MapMouseEvent, MapTouchEvent } from "mapbox-gl";

const fetchGeoserverLayerBbox = async (url: string, layerId: string, filters?: string) => {
  const urls = `${url}?service=WMS&version=1.3.0&request=GetCapabilities${filters ? `&CQL_FILTER=${filters}` : ""}`;
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

const getFeatureInfo = async (
  e: MapMouseEvent | MapTouchEvent,
  layers: Layer | Layer[],
  mapRef: mapboxgl.Map
) => {
  const lat = e.lngLat.lat;
  const lng = e.lngLat.lng;
  const properties: Array<object> = [];
  const layerList = Array.isArray(layers) ? layers : [layers];
  if (!mapRef) return;
  for (const layer of layerList) {
    if (layer.visible) {
      if (
        layer.map_service_vendor === MapServiceVendor.Geoserver ||
        (layer.map_service_vendor === MapServiceVendor.ArcGIS &&
          typeof layer.map_service_url === 'string' &&
          !layer.map_service_url.includes("FeatureServer"))
      ) {
        if (layer.map_service_vendor === MapServiceVendor.Geoserver) {
          const url = generateFeatureInfoURL(lat, lng, layer);
          const response = await fetch(url);
          const data = await response.json();
          if (data.features.length > 0) {
            properties.push({
              layer_name: layer.name,
              properties: data.features[0].properties,
            });
          }
        } else if (layer.map_service_vendor === MapServiceVendor.ArcGIS) {
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
        const selectedFeatures = mapRef.queryRenderedFeatures(e.point, {
          layers: [layer.id],
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
  if (layer.map_service_vendor === MapServiceVendor.Geoserver) {
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
  } else if (typeof layer.map_service_url === 'string') {
    const wmsParams: Record<string, string> = {
      geometry: `${longitude},${latitude}`,
      geometryType: "esriGeometryPoint",
      sr: "4326",
      layers: "all",
      mapExtent: getBBOX(latitude, longitude, 100).toString(),
      imageDisplay: "400,300,96",
      tolerance: "5",
      f: "json",
    };
    return (
      layer.map_service_url +
      "/identify" +
      "?" +
      new URLSearchParams(wmsParams).toString()
    );
  }
  return "";
};

const convertWMSToVectorData = async (
  selectedLayer: Layer,
  mapRef: mapboxgl.Map,
  layers: Layer[]
) => {
  // eslint-disable-next-line prefer-const
  let infoLayers = [];
  if (typeof selectedLayer?.map_service_url !== 'string') return [];
  try {
    const response = await fetch(
      `${selectedLayer?.map_service_url.replace(
        "/wms",
        ""
      )}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${selectedLayer?.map_service_layer_name
      }&maxFeatures=1000000&outputFormat=application/json&srsName=EPSG:4326`
    );
    const data = await response.json();

    const layerID = v4();
    const sourceID = v4();
    // SOURCE LAYER
    mapRef.addSource(sourceID, {
      type: "geojson",
      data: data,
    });

    // ADD LAYER POLYGON
    if (
      data.features[0].geometry.type === "Polygon" ||
      data.features[0].geometry.type === "MultiPolygon"
    ) {
      const layerId = `${layerID}_poly`;
      mapRef.addLayer({
        id: layerId,
        type: "fill",
        source: sourceID,
        paint: {
          "fill-color": `#${Math.floor(Math.random() * 16777215).toString(
            16
          )} `,
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
        type: "2D",
      };
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
          "line-color": `#${Math.floor(Math.random() * 16777215).toString(
            16
          )} `,
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
        type: "2D",
      };
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
          "circle-color": `#${Math.floor(Math.random() * 16777215).toString(
            16
          )} `,
        },
      });

      const layerInfo: Layer = {
        id: layerId,
        name: `Vector ${selectedLayer?.name} `,
        map_service_url: "null",
        map_service_vendor: MapServiceVendor.GeoJSON,
        map_service_layer_name: layerId,
        visible: true,
        type: "2D",
      };
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
};

const getEsriServices = async (url: string) => {
  try {
    const urls = url + "?f=json";
    const response = await fetch(urls);
    const body = await response.json();
    return body;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error caught:", err.message);
    } else {
      console.error("Unknown error caught:", err);
    }
  }
};

const getGeoserverServices = async (url: string) => {
  try {
    const urls = `${url.replace(
      "/wms",
      ""
    )}/ows?service=WMS&version=1.3.0&request=GetCapabilities`;
    const response = await fetch(urls);
    const body = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, "text/xml");
    const getAllLayers: GetAllLayers = (node) => {
      const layers: ParsedLayer[] = [];
      const children = node.querySelectorAll("Layer");
      children.forEach((layer) => {
        const name =
          layer.querySelector("Name")?.textContent || "Unnamed Layer";
        const title =
          layer.querySelector("Title")?.textContent?.replaceAll("_", " ") ||
          "No Title";
        const legend = layer
          .querySelector("Style")
          ?.querySelector("LegendURL")
          ?.querySelector("OnlineResource")
          ?.getAttribute("xlink:href");
        const crs = layer.querySelector("CRS")?.textContent;
        // if (crs === "EPSG:4326") {
        //     const boundingBox = layer.querySelector("BoundingBox[CRS='EPSG:4326']");
        //     if (boundingBox) {
        //         const minx = boundingBox.getAttribute("minx");
        //         const miny = boundingBox.getAttribute("miny");
        //         const maxx = boundingBox.getAttribute("maxx");
        //         const maxy = boundingBox.getAttribute("maxy");
        //         bbox = `${minx},${miny},${maxx},${maxy}`;
        //     }
        // }else{
        const rawbbox = layer.querySelector("EX_GeographicBoundingBox");
        const west = rawbbox?.querySelector("westBoundLongitude")?.textContent;
        const east = rawbbox?.querySelector("eastBoundLongitude")?.textContent;
        const south = rawbbox?.querySelector("southBoundLatitude")?.textContent;
        const north = rawbbox?.querySelector("northBoundLatitude")?.textContent;
        const bbox = `${west},${south},${east},${north}`;
        // }
        const thumbnail = `${url}?service=WMS&version=1.1.0&request=GetMap&layers=${name}&bbox=${bbox}&width=300&height=150&srs=EPSG%3A4326&styles=&format=image%2Fjpeg`;
        const metadata = {
          bbox,
          crs,
        };
        layers.push({
          name,
          title,
          legend,
          thumbnail,
          url,
          map_service_vendor: MapServiceVendor.Geoserver,
          metadata,
        });
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
};

const transformGeoserverServicesToFolder = async (url: string) => {
  try {
    const urls = `${url.replace(
      "/wms",
      ""
    )}/ows?service=WMS&version=1.3.0&request=GetCapabilities`;
    const response = await fetch(urls);
    const body = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, "text/xml");

    const rootLayer = xmlDoc.querySelector("Capability > Layer");
    if (!rootLayer) return [];

    const layers = rootLayer.querySelectorAll("Layer");

    // Kumpulkan layer berdasarkan workspace
    const grouped: Record<
      string,
      {
        id: string;
        name: string;
        type: string;
        children: any[];
      }
    > = {};

    layers.forEach((layer) => {
      const fullName = layer.querySelector("Name")?.textContent || "";
      if (!fullName.includes(":")) return; // skip layer tanpa workspace
      const [workspace, layerName] = fullName.split(":");

      const title =
        layer.querySelector("Title")?.textContent?.replaceAll("_", " ") ||
        layerName;
      const legend = layer
        .querySelector("Style")
        ?.querySelector("LegendURL")
        ?.querySelector("OnlineResource")
        ?.getAttribute("xlink:href");

      const crs = layer.querySelector("CRS")?.textContent?.replaceAll("_", " ");
      const rawbbox = layer.querySelector("EX_GeographicBoundingBox");
      const west = rawbbox?.querySelector("westBoundLongitude")?.textContent;
      const east = rawbbox?.querySelector("eastBoundLongitude")?.textContent;
      const south = rawbbox?.querySelector("southBoundLatitude")?.textContent;
      const north = rawbbox?.querySelector("northBoundLatitude")?.textContent;
      const bbox = `${west},${south},${east},${north}`;
      const thumbnail = `${url}?service=WMS&version=1.1.0&request=GetMap&layers=${fullName}&bbox=${bbox}&width=300&height=150&srs=EPSG%3A4326&styles=&format=image%2Fjpeg`;

      if (!grouped[workspace]) {
        grouped[workspace] = {
          id: workspace,
          name: workspace.replaceAll("_", " "),
          type: "folder",
          children: [],
        };
      }

      // Jika mau bikin group layer type "MapServer" per setiap title utama
      let mapServerGroup = grouped[workspace].children!.find(
        (c: any) => c.name === title && c.type === "Layer"
      );
      if (!mapServerGroup) {
        mapServerGroup = {
          id: `${fullName}_group`,
          name: fullName,
          title: layerName.replaceAll("_", " "),
          type: "WMS",
          map_service_vendor: MapServiceVendor.Geoserver,
          children: [],
          metadata: {
            url: `${url}`,
            type: "WMS",
            initialExtent: {
              spatialReference: {
                wkid: crs?.replace("EPSG:", ""),
              },
              xmax: east,
              xmin: west,
              ymax: north,
              ymin: south,
            },
            mapName: title,
            copyrightText: layer.querySelector("Copyright")?.textContent,
            serviceDescription: layer.querySelector("Abstract")?.textContent,
          },
        };
        grouped[workspace].children!.push(mapServerGroup);
      }

      mapServerGroup.children!.push({
        id: fullName,
        name: fullName,
        title: layerName.replaceAll("_", " "),
        type: "layer",
        children: null,
        metadata: {
          name: fullName,
          legend,
          bbox,
          thumbnail,
          url,
        },
      });
    });

    return Object.values(grouped);
  } catch (err: unknown) {
    console.error("Error caught:", err instanceof Error ? err.message : err);
    return [];
  }
};

const transformEsriServicesToFolder = async (url: string) => {
  const getFolder = await getEsriServices(url);
  const folder = getFolder.folders;

  let generateFolder = await Promise.all(
    folder.map(async (name: string) => {
      const getServices = await getEsriServices(`${url}/${name}`);
      const services = getServices.services;

      if (services) {
        const generateServices = await Promise.all(
          services.map(async (service: any) => {
            const serviceUrl = `${url}/${service.name}/${service.type}`;
            const serviceJson = await getEsriServices(serviceUrl);
            const children =
              serviceJson?.layers?.map((layer: any) => ({
                id: `${serviceUrl}/${layer.id}`,
                name: layer.name,
                title: service.name.replaceAll("_", " ").split("/")[1],
                map_service_vendor: MapServiceVendor.ArcGIS,
                type: "layer",
                children: null,
                metadata: {
                  id: layer.id,
                  url: `${serviceUrl}/${layer.id}?f=json`,
                  path: `${serviceUrl}/${layer.id}`,
                },
              })) || [];

            return {
              id: service.name,
              name: service.name.replaceAll("_", " ").split("/")[1],
              title: service.name.replaceAll("_", " ").split("/")[1],
              type: service.type,
              map_service_vendor: MapServiceVendor.ArcGIS,
              children,
              metadata: {
                type: service.type,
                url: `${serviceUrl}?f=json`,
                path: serviceUrl,
                ...serviceJson,
              },
            };
          })
        );

        return {
          id: name,
          name: name.replaceAll("_", " "),
          type: "folder",
          children: generateServices,
        };
      }
    })
  );

  generateFolder = generateFolder.filter((folder) => folder !== undefined);
  return generateFolder;
};

const getWMSServices = async (url: string, map_service_vendor: string) => {
  if (map_service_vendor == MapServiceVendor.Geoserver) {
    return transformGeoserverServicesToFolder(url);
    // return getGeoserverServices(url);
  } else {
    const transform = await transformEsriServicesToFolder(url);
    return transform;
    // return getEsriServices(url);
  }
};

const getAllFeaturesGeoserver = async (url: string, layerId: string) => {
  const workspace = layerId.split(":")[0];
  const urls = `${url.replace(
    "/wms",
    ""
  )}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=${layerId}&maxFeatures=300&outputFormat=application/json`;
  try {
    const response = await fetch(urls);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch or parse capabilities document:", error);
  }
};


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
  transformEsriServicesToFolder,
  getWMSServices,
  getAllFeaturesGeoserver,
};
