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

const fetchCapabilitiesText = async (capUrl: string): Promise<string | null> => {
  // Try direct fetch first (works for CORS-enabled servers)
  try {
    const res = await fetch(capUrl);
    if (res.ok) {
      const text = await res.text();
      // Detect OGC ServiceException (e.g. invalid request)
      if (!text.includes("ServiceException") && text.includes("<WMS_Capabilities") || text.includes("<WMT_MS_Capabilities")) {
        return text;
      }
      // If ServiceException, fall through to proxy attempt
      if (!text.includes("ServiceException")) return text;
    }
  } catch (_) {
    // CORS / network error -> try proxy
  }
  // Fallback via server-side proxy to avoid CORS / missing ACAO header
  try {
    const proxyUrl = `/api/proxy/wms?url=${encodeURIComponent(capUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
};

const getWorkspaceFromUrl = (url: string): string => {
  try {
    const u = new URL(url);
    // e.g. /geoserver/palapa/wms -> palapa ; /geoserver/wms -> geoserver
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("geoserver");
    if (idx !== -1 && parts[idx + 1] && parts[idx + 1].toLowerCase() !== "wms" && parts[idx + 1].toLowerCase() !== "ows") {
      return parts[idx + 1];
    }
    return "default";
  } catch {
    return "default";
  }
};

const transformGeoserverServicesToFolder = async (url: string) => {
  try {
    const trimmed = url.trim().replace(/\/$/, "");
    // Build GetCapabilities URL robustly: palapa/wms -> palapa/ows?service=WMS ; also handle already having query params
    let capUrl: string;
    if (trimmed.includes("GetCapabilities") || trimmed.includes("service=WMS")) {
      capUrl = trimmed;
    } else if (trimmed.includes("/wms")) {
      capUrl = `${trimmed.replace(/\/wms\/?$/, "")}/ows?service=WMS&version=1.3.0&request=GetCapabilities`;
      // For workspace-specific URL like .../geoserver/palapa/wms keep workspace path: .../geoserver/palapa/ows
      if (trimmed.match(/\/geoserver\/[^/]+\/wms$/)) {
        capUrl = trimmed.replace(/\/wms\/?$/, "/ows?service=WMS&version=1.3.0&request=GetCapabilities");
      }
    } else if (trimmed.includes("/ows")) {
      capUrl = `${trimmed.split("?")[0]}?service=WMS&version=1.3.0&request=GetCapabilities`;
    } else {
      capUrl = `${trimmed}/ows?service=WMS&version=1.3.0&request=GetCapabilities`;
    }

    const body = await fetchCapabilitiesText(capUrl);
    if (!body) return [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, "text/xml");

    // Check for parser error or ServiceException
    if (xmlDoc.querySelector("parsererror") || body.includes("ServiceException")) {
      console.warn("WMS GetCapabilities ServiceException:", body.slice(0, 500));
      return [];
    }

    const rootLayer = xmlDoc.querySelector("Capability > Layer");
    if (!rootLayer) return [];

    const allLayerEls = Array.from(rootLayer.querySelectorAll("Layer")) as Element[];

    // Filter to only layers that have a direct <Name> child (leaf/queryable layers), not container folders
    const layerEls = allLayerEls.filter((el) => {
      return Array.from(el.children).some((c) => c.tagName === "Name");
    });

    // Fallback default workspace derived from URL for servers without namespace prefix (like Badan Pangan palapa)
    const defaultWorkspace = getWorkspaceFromUrl(url);

    const grouped: Record<
      string,
      {
        id: string;
        name: string;
        type: string;
        children: any[];
      }
    > = {};

    const seen = new Set<string>();
    layerEls.forEach((layer) => {
      const fullName = layer.querySelector("Name")?.textContent?.trim() || "";
      if (!fullName) return;
      if (seen.has(fullName)) return; // dedup duplicate <Layer> entries (parent + child with same Name like FSVA_2025)
      seen.add(fullName);
      // Badan Pangan example: "FSVA_2025" without colon -> group under workspace from URL
      const hasWorkspace = fullName.includes(":");
      const workspace = hasWorkspace ? fullName.split(":")[0] : defaultWorkspace;
      const layerName = hasWorkspace ? fullName.split(":").slice(1).join(":") : fullName;

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

      // Group per layer (avoid duplicate groups for same layer)
      let mapServerGroup = grouped[workspace].children!.find(
        (c: any) => c.name === fullName && c.type === "WMS"
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

const fetchWMTSCapabilitiesText = async (capUrl: string): Promise<string | null> => {
  try {
    const res = await fetch(capUrl);
    if (res.ok) {
      const text = await res.text();
      if (text.includes("<Capabilities") && text.includes("WMTS")) return text;
      if (!text.includes("ServiceException")) return text;
    }
  } catch (_) {}
  try {
    const proxyUrl = `/api/proxy/wms?url=${encodeURIComponent(capUrl)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) return await res.text();
  } catch (_) {}
  return null;
};

const transformWMTSServicesToFolder = async (url: string) => {
  try {
    const trimmed = url.trim();
    // Extract base WMTS URL (strip query) - generic, tidak hardcode BPS
    let base = trimmed.split("?")[0];
    if (base.includes("/gwc/service/wmts")) {
      base = base.split("/gwc/service/wmts")[0] + "/gwc/service/wmts";
    } else if (base.toLowerCase().includes("wmts")) {
      // fallback: pakai path sampai wmts (custom URL user)
      const idx = base.toLowerCase().indexOf("wmts");
      base = base.substring(0, idx + 4);
    }
    // If user pasted full GetTile URL with layer param, keep it but still fetch cap
    const capUrl = `${base}?REQUEST=GetCapabilities&VERSION=1.0.0&SERVICE=WMTS`;
    const body = await fetchWMTSCapabilitiesText(capUrl);
    if (!body) return [];
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(body, "text/xml");
    if (xmlDoc.querySelector("parsererror") || body.includes("ServiceException")) return [];

    const contents = xmlDoc.querySelector("Contents");
    if (!contents) return [];
    const layerEls = Array.from(contents.querySelectorAll(":scope > Layer")) as Element[];
    if (layerEls.length === 0) {
      // fallback: query all Layer under Contents
      const all = Array.from(contents.querySelectorAll("Layer")) as Element[];
      if (all.length === 0) return [];
      // use all but filter to only those with ows:Identifier
      layerEls.push(...all);
    }

    // If user pasted specific layer in URL, filter to that layer only but show all if exists
    let filterLayer: string | null = null;
    try {
      const u = new URL(trimmed);
      filterLayer = u.searchParams.get("layer") || u.searchParams.get("LAYER");
      if (filterLayer) filterLayer = decodeURIComponent(filterLayer);
    } catch {}

    const grouped: Record<string, { id: string; name: string; type: string; children: any[] }> = {};
    const defaultFolder = "WMTS";

    layerEls.forEach((el) => {
      const identifier = el.querySelector("ows\\:Identifier, Identifier")?.textContent?.trim() || "";
      if (!identifier) return;
      if (filterLayer && identifier !== filterLayer) return;
      // Skip if nested Style identifier (second occurrence) -> we already filtered by :scope > Layer, so safe
      const title = el.querySelector("ows\\:Title, Title")?.textContent?.trim() || identifier;
      const abstract = el.querySelector("ows\\:Abstract, Abstract")?.textContent?.trim() || "";
      const formatEl = Array.from(el.querySelectorAll("Format")).find(f => f.textContent?.includes("image/png")) || el.querySelector("Format");
      const format = formatEl?.textContent?.trim() || "image/png";

      // TileMatrixSet - prefer WebMercatorQuad / EPSG:900913 / GoogleMapsCompatible
      const tmsLinks = Array.from(el.querySelectorAll("TileMatrixSetLink > TileMatrixSet, TileMatrixSet"));
      let tms = "EPSG:900913";
      if (tmsLinks.length > 0) {
        const vals = tmsLinks.map(e => e.textContent?.trim() || "");
        const preferred = vals.find(v => v === "EPSG:900913" || v === "WebMercatorQuad" || v === "GoogleMapsCompatible");
        tms = preferred || vals[0];
      }

      // Selalu generate KVP proxied template agar lewat /api/proxy/wms (hindari CORS) dan konsisten {z}/{x}/{y}
      // Contoh user: https://geoserver.bps.go.id/gwc/service/wmts?layer=ksa%3Albs_2024&...&TileMatrix=13... -> jadi template proxy
      const proxiedTileTemplate = `/api/proxy/wms?baseUrl=${encodeURIComponent(base)}&service=WMTS&request=GetTile&version=1.0.0&layer=${encodeURIComponent(identifier)}&style=&tilematrixset=${encodeURIComponent(tms)}&TileMatrix={z}&TileCol={x}&TileRow={y}&format=${encodeURIComponent(format)}`;
      const tileTemplate = proxiedTileTemplate;

      // WGS84BoundingBox for thumbnail/bbox
      const lower = el.querySelector("ows\\:WGS84BoundingBox > ows\\:LowerCorner, WGS84BoundingBox > LowerCorner")?.textContent?.trim() || "";
      const upper = el.querySelector("ows\\:WGS84BoundingBox > ows\\:UpperCorner, WGS84BoundingBox > UpperCorner")?.textContent?.trim() || "";
      let bbox = "";
      if (lower && upper) {
        const [west, south] = lower.split(/\s+/);
        const [east, north] = upper.split(/\s+/);
        bbox = `${west},${south},${east},${north}`;
      }

      const workspace = identifier.includes(":") ? identifier.split(":")[0] : defaultFolder;
      if (!grouped[workspace]) {
        grouped[workspace] = { id: workspace, name: workspace, type: "folder", children: [] };
      }

      const thumbBbox = bbox || "-180,-90,180,90";
      const thumbnail = `/api/proxy/wms?baseUrl=${encodeURIComponent(base)}&service=WMTS&request=GetTile&version=1.0.0&layer=${encodeURIComponent(identifier)}&style=&tilematrixset=${encodeURIComponent(tms)}&TileMatrix=5&TileCol=24&TileRow=15&format=image/png`;

      let group = grouped[workspace].children!.find((c: any) => c.name === identifier && c.type === "WMTS");
      if (!group) {
        group = {
          id: `${identifier}_wmts_group`,
          name: identifier,
          title: title.replaceAll("_", " "),
          type: "WMTS",
          map_service_vendor: MapServiceVendor.WMTS,
          children: [],
          metadata: {
            url: tileTemplate,
            baseUrl: base,
            tileMatrixSet: tms,
            format,
            type: "WMTS",
            abstract,
            bbox,
          },
        };
        grouped[workspace].children!.push(group);
      }

      group.children!.push({
        id: identifier,
        name: identifier,
        title: title.replaceAll("_", " "),
        type: "layer",
        children: null,
        metadata: {
          name: identifier,
          tileTemplate,
          tileMatrixSet: tms,
          format,
          bbox,
          thumbnail,
          url: tileTemplate,
          baseUrl: base,
        },
      });
    });

    // If no layer matched filter, return all
    const result = Object.values(grouped);
    if (result.length === 0 && filterLayer) {
      // fallback: show single layer from pasted URL without capabilities parse
      const layerName = filterLayer;
      const tms = "WebMercatorQuad";
      const tileTemplate = `/api/proxy/wms?baseUrl=${encodeURIComponent(base)}&service=WMTS&request=GetTile&version=1.0.0&layer=${encodeURIComponent(layerName)}&style=&tilematrixset=${tms}&TileMatrix={z}&TileCol={x}&TileRow={y}&format=image/png`;
      return [{
        id: "WMTS",
        name: "WMTS",
        type: "folder",
        children: [{
          id: `${layerName}_wmts_group`,
          name: layerName,
          title: layerName.split(":").pop() || layerName,
          type: "WMTS",
          map_service_vendor: MapServiceVendor.WMTS,
          children: [{
            id: layerName,
            name: layerName,
            title: layerName.split(":").pop() || layerName,
            type: "layer",
            children: null,
            metadata: { name: layerName, tileTemplate, tileMatrixSet: tms, url: tileTemplate, baseUrl: base }
          }],
          metadata: { url: tileTemplate, baseUrl: base, tileMatrixSet: tms, type: "WMTS" }
        }]
      } as any];
    }

    return result;
  } catch (err: unknown) {
    console.error("WMTS transform error:", err instanceof Error ? err.message : err);
    return [];
  }
};

const transformVectorTileServerToFolder = async (url: string) => {
  try {
    const trimmed = url.trim().replace(/\/$/, "");
    let serviceUrl = trimmed;
    // If user pasted style json url, extract service url
    if (trimmed.includes("/resources/styles")) {
      serviceUrl = trimmed.split("/resources/styles")[0];
    }
    // Ensure url ends with VectorTileServer
    if (!serviceUrl.toLowerCase().includes("vectortileserver")) {
      // Try to fetch as is - maybe folder root, fallback to Esri folder logic
      return [];
    }
    const capUrl = `${serviceUrl}?f=json`;
    let body: string | null = null;
    try {
      const res = await fetch(capUrl);
      if (res.ok) body = await res.text();
    } catch {}
    if (!body) {
      try {
        const proxyUrl = `/api/proxy/wms?url=${encodeURIComponent(capUrl)}`;
        const res = await fetch(proxyUrl);
        if (res.ok) body = await res.text();
      } catch {}
    }
    if (!body) return [];
    const json = JSON.parse(body);
    if (json.error) return [];
    const name = json.name || serviceUrl.split("/").slice(-2, -1)[0] || "VectorTileServer";
    const title = json.name || name;
    // Build proxied tile template - keep {z}/{y}/{x} raw for Mapbox, encode rest for proxy
    const rawTile = `${serviceUrl}/tile/{z}/{y}/{x}.pbf`;
    const proxiedTile = `/api/proxy/wms?url=${encodeURIComponent(rawTile).replace(/%7B/g, "{").replace(/%7D/g, "}")}`;
    const tileUrl = proxiedTile;

    const workspace = name.includes(":") ? name.split(":")[0] : "VectorTile";
    const grouped: any[] = [{
      id: workspace,
      name: workspace,
      type: "folder",
      children: [{
        id: `${serviceUrl}_vt_group`,
        name: serviceUrl,
        title: title,
        type: "VectorTileServer",
        map_service_vendor: MapServiceVendor.VectorTileServer,
        children: [{
          id: serviceUrl,
          name: serviceUrl.split("/").pop() || title,
          title: title,
          type: "layer",
          children: null,
          metadata: {
            name: title,
            url: tileUrl,
            serviceUrl: serviceUrl,
            tileUrl: tileUrl,
            proxiedTileUrl: tileUrl,
            styleUrl: `${serviceUrl}/resources/styles/root.json`,
            json,
            bbox: json.fullExtent ? `${json.fullExtent.xmin},${json.fullExtent.ymin},${json.fullExtent.xmax},${json.fullExtent.ymax}` : "",
          }
        }],
        metadata: {
          url: serviceUrl,
          type: "VectorTileServer",
          json,
        }
      }]
    }];
    return grouped;
  } catch (err) {
    console.error("VectorTile transform error:", err);
    return [];
  }
};

const transformPMTilesToFolder = async (url: string) => {
  try {
    const trimmed = url.trim();
    // PMTiles URL harus .pmtiles
    if (!trimmed.toLowerCase().endsWith(".pmtiles")) return [];
    // Coba fetch header PMTiles untuk dapat metadata vector_layers (opsional, fallback tanpa fetch)
    let fileName = trimmed.split("/").pop() || "pmtiles";
    try { fileName = decodeURIComponent(fileName); } catch {}
    const baseName = fileName.replace(/\.pmtiles$/i, "");
    let vectorLayers: any[] = [];
    try {
      if (typeof window !== "undefined") {
        const { PMTiles } = await import("pmtiles");
        // Coba direct dulu, jika CORS gagal fallback ke proxy
        let p: any = null;
        try {
          p = new PMTiles(trimmed);
          await p.getHeader();
        } catch {
          const proxied = `${window.location.origin}/api/proxy/wms?url=${encodeURIComponent(trimmed)}`;
          p = new PMTiles(proxied);
        }
        if (p) {
          const meta = await p.getMetadata();
          vectorLayers = (meta as any)?.vector_layers || [];
        }
      }
    } catch {}
    // Jika tidak dapat vector_layers, buat 1 layer generic
    const layers = vectorLayers.length > 0 ? vectorLayers : [{ id: baseName, description: fileName }];
    const pmTilesUrl = trimmed;
    const folder = {
      id: "PMTiles",
      name: "PMTiles",
      type: "folder",
      children: [{
        id: `${pmTilesUrl}_pmtiles_group`,
        name: fileName,
        title: baseName.replaceAll("_", " ").replaceAll("-", " "),
        type: "PMTiles",
        map_service_vendor: MapServiceVendor.PMTiles,
        children: layers.map((vl: any) => ({
          id: `${pmTilesUrl}::${vl.id}`,
          name: vl.id,
          title: vl.id,
          type: "layer",
          children: null,
          metadata: {
            name: vl.id,
            url: pmTilesUrl,
            pmtilesUrl: pmTilesUrl,
            vectorLayerId: vl.id,
            description: vl.description || "",
          }
        })),
        metadata: {
          url: pmTilesUrl,
          pmtilesUrl: pmTilesUrl,
          type: "PMTiles",
          vectorLayers: layers,
        }
      }]
    };
    return [folder];
  } catch (err) {
    console.error("PMTiles transform error:", err);
    return [];
  }
};

const getWMSServices = async (url: string, map_service_vendor: string) => {
  // Auto-detect VectorTileServer even if vendor is ArcGIS
  const lower = url.toLowerCase();
  if (lower.includes("vectortileserver") || map_service_vendor == MapServiceVendor.VectorTileServer) {
    const vt = await transformVectorTileServerToFolder(url);
    if (vt.length > 0) return vt;
    // fallback to esri logic
  }
  if (lower.endsWith(".pmtiles") || map_service_vendor == MapServiceVendor.PMTiles) {
    return transformPMTilesToFolder(url);
  }
  if (map_service_vendor == MapServiceVendor.Geoserver) {
    return transformGeoserverServicesToFolder(url);
  } else if (map_service_vendor == MapServiceVendor.WMTS) {
    return transformWMTSServicesToFolder(url);
  } else if (map_service_vendor == MapServiceVendor.VectorTileServer) {
    return transformVectorTileServerToFolder(url);
  } else if (map_service_vendor == MapServiceVendor.PMTiles) {
    return transformPMTilesToFolder(url);
  } else {
    const transform = await transformEsriServicesToFolder(url);
    return transform;
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
