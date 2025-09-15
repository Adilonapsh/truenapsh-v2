import { overpassBuildingIntegration } from "@/services/map-integrations";
import useLayerStore from "@/stores/layer";
import { Layer, MapServiceVendor, Place } from "@/types/map.types";
import * as turf from "@turf/turf";
import {
    Feature,
    FeatureCollection,
    Geometry,
    LineString,
    MultiLineString,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import { MapRef } from "react-map-gl";
import { v4 } from "uuid";

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
        },
      },
    ];
    return place;
  } else {
    try {
      if (search) {
        const response = await fetch(
          "/api/maps/location?" + new URLSearchParams({ search, lang }),
          { mode: "no-cors" }
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
};

const searchAlternatives = async (from: number[], to: number[]) => {
  try {
    const body = {
      from: {
        x: from[0],
        y: from[1],
      },
      to: {
        x: to[0],
        y: to[1],
      },
    };
    const response = await fetch("/api/maps/alternatives", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    const alternatives: any = [];
    data.data.alternatives.forEach(
      (alternative: { coords: { x: number; y: number }[]; response: any }) => {
        const { coords, response } = alternative;
        const transformed = coords.map(({ x, y }) => [x, y]);
        alternatives.push({ coords: transformed, response });
      }
    );
    return alternatives;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error caught:", error.message);
    } else {
      console.error("Unknown error caught:", error);
    }
    return [];
  }
};

const isCoordinates = (str: string) => {
  const coordRegex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  if (!coordRegex.test(str)) {
    return false;
  }
  return true;
};

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
    [lngLat.lng, lngLat.lat - height],
  ];
};

const getBBOX = (lat: number, lng: number, z: number) => {
  const r = 6378137 * Math.PI * 2;
  const x = (lng / 360) * r;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = ((0.25 * Math.log((1 + sin) / (1 - sin))) / Math.PI) * r;
  return `${x - z},${y - z},${x + z},${y + z}`;
};

export const layerConfigs = [
  {
    types: ["Polygon", "MultiPolygon"],
    layerType: "fill" as const,
    nameSuffix: "Polygon",
    layerProps: {
      paint: {
        "fill-opacity": 0.5,
        "fill-color": "#627BC1",
      },
    },
  },
  {
    types: ["LineString", "MultiLineString"],
    layerType: "line" as const,
    nameSuffix: "Linestring",
    layerProps: {
      paint: {
        "line-color": "#627BC1",
        "line-width": 2,
        "line-opacity": 1,
      },
    },
  },
  {
    types: ["Point", "MultiPoint"],
    layerType: "circle" as const,
    nameSuffix: "Point",
    layerProps: {
      paint: {
        "circle-radius": 5,
        "circle-color": "#627BC1",
        "circle-opacity": 1,
      },
    },
  },
];

const findLayerConfigByGeometryType = (type: string) => {
  return layerConfigs.find((config) => config.types.includes(type));
};

const addGeojsonToMap = async ({
  mapRef,
  layerName,
  mapServiceUrl = "",
  layerCode = "",
  data,
}: {
  mapRef: React.RefObject<MapRef | null>;
  layerName: string;
  mapServiceUrl?: string;
  layerCode?: string;
  data: GeoJSON.GeoJSON;
}) => {
  const map = mapRef?.current?.getMap();
  if (!map) return;

  const addLayer = useLayerStore.getState().addLayer; // ✅ ambil fungsi langsung dari store

  const layerId = v4();
  const commonLayerProps = {
    map_service_url: mapServiceUrl,
    map_service_layer_name: layerCode,
    map_service_vendor: MapServiceVendor.GeoJSON,
    type: "2D",
    visible: true,
    min_zoom: 0,
    max_zoom: 24,
    status: "Local",
    rendered: 1,
    metadata: {
      map_service_url: mapServiceUrl,
      map_service_layer_name: layerCode,
      map_service_vendor: MapServiceVendor.GeoJSON,
    },
  };

  const geometryTypes = [
    ...new Set(
      (data as GeoJSON.FeatureCollection).features.map(
        (feature) => feature.geometry.type
      )
    ),
  ];

  // Add source
  map.addSource(layerId, {
    type: "geojson",
    data: data,
  });

  // Fit bounds
  const bounds: [number, number, number, number] = turf
    .bbox(data)
    .slice(0, 4) as [number, number, number, number];
  map.fitBounds(bounds, {
    padding: { top: 50, bottom: 50, left: 50, right: 50 },
    duration: 1000,
  });

  // Loop configs
  layerConfigs.forEach((config) => {
    if (
      config.types.some((type) =>
        geometryTypes.includes(
          type as
            | "Point"
            | "MultiPoint"
            | "LineString"
            | "MultiLineString"
            | "Polygon"
            | "MultiPolygon"
            | "GeometryCollection"
        )
      )
    ) {
      const layerSubId =
        config.layerType === "circle" ? "point" : config.layerType;
      const fullLayerId = `${layerId}-${layerSubId}`;

      addLayer({
        ...commonLayerProps,
        id: fullLayerId,
        name: `${layerName} ${config.nameSuffix}`,
      });

      // Tambah ke mapbox
      map.addLayer({
        id: fullLayerId,
        type: config.layerType,
        source: layerId,
        minzoom: 0,
        maxzoom: 24,
        filter: ["in", "$type", config.types[0]],
        paint: config.layerProps.paint,
        metadata: commonLayerProps.metadata ?? {},
      });
    }
  });
};

const clipLayers = (
  featureClip: FeatureCollection<Polygon | MultiPolygon>,
  featureOverlay: FeatureCollection<Polygon | MultiPolygon>
) => {
  try {
    return turf.featureCollection(
      featureOverlay.features
        .flatMap((feature1) => {
          if (featureClip.features) {
            return featureClip.features
              .map((feature2) => {
                const intersection = turf.intersect(
                  turf.featureCollection([feature1, feature2])
                );
                return intersection
                  ? { ...intersection, properties: { ...feature1.properties } }
                  : null;
              })
              .filter(Boolean);
          } else {
            const intersection = turf.intersect(
              turf.featureCollection([feature1, featureClip])
            );
            return intersection
              ? { ...intersection, properties: { ...feature1.properties } }
              : null;
          }
        })
        .filter(Boolean)
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const bufferLayers = (
  featureCollection: FeatureCollection<Geometry>,
  radius: number,
  units: turf.Units = "kilometers"
) => {
  try {
    return turf.featureCollection(
      featureCollection.features.map((feature) => {
        const buffered = turf.buffer(feature, radius, { units });
        return { ...buffered, properties: { ...feature.properties } };
      })
    );
  } catch (error) {
    console.error("Error buffering layers:", error);
    return null;
  }
};

const differenceLayers = (
  featureClip: FeatureCollection<Polygon | MultiPolygon>,
  featureOverlay: FeatureCollection<Polygon | MultiPolygon>
) => {
  try {
    return turf.featureCollection(
      featureOverlay.features
        .filter(
          (feature): feature is Feature<Polygon | MultiPolygon> =>
            feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon"
        )
        .flatMap((feature1) => {
          if (featureClip.features) {
            return featureClip.features
              .map((feature2) => {
                const difference = turf.difference(
                  turf.featureCollection([feature1, feature2])
                );
                return difference
                  ? { ...difference, properties: { ...feature1.properties } }
                  : null;
              })
              .filter(Boolean);
          } else {
            const difference = turf.difference(
              turf.featureCollection([feature1, clipFeature])
            );
            return difference
              ? { ...difference, properties: { ...feature1.properties } }
              : null;
          }
        })
        .filter(Boolean)
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const centroidLayers = (
  featureClip: FeatureCollection<Polygon | MultiPolygon>
) => {
  try {
    return turf.featureCollection(
      featureClip.features.map((feature) => {
        const centroidFeature = turf.centroid(feature);
        return centroidFeature;
      })
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const polygonToLinesLayers = (
  polygonFeature: FeatureCollection<Polygon | MultiPolygon>
) => {
  try {
    return turf.featureCollection(
      polygonFeature.features
        .filter(
          (feature): feature is Feature<Polygon | MultiPolygon> =>
            feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon"
        )
        .map((feature) => {
          if (feature.geometry.type === "Polygon") {
            return turf.polygonToLine(feature);
          } else {
            const multiLines = feature.geometry.coordinates.map((coords) =>
              turf.polygonToLine(turf.polygon(coords))
            );
            return turf.multiLineString(
              multiLines.flatMap((line) =>
                line.geometry.type === "LineString"
                  ? [line.geometry.coordinates]
                  : line.geometry.coordinates
              )
            );
          }
        })
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const linesToPolygonLayers = (
  lineFeature: FeatureCollection<LineString | MultiLineString>
) => {
  try {
    return turf.featureCollection(
      lineFeature.features
        .filter(
          (feature): feature is Feature<LineString> =>
            feature.geometry.type === "LineString"
        )
        .map((feature) => {
          const polygonFeature = turf.lineToPolygon(feature);
          return polygonFeature;
        })
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const removeDuplicatesLayers = (featureClip: FeatureCollection<Geometry>) => {
  try {
    return turf.featureCollection(
      featureClip.features
        .filter(
          (feature): feature is Feature<Geometry> =>
            feature.geometry.type === "Polygon" ||
            feature.geometry.type === "MultiPolygon"
        )
        .map((feature) => {
          const polygonFeature = turf.cleanCoords(feature);
          return polygonFeature;
        })
    );
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const hexagonLayer = (
  featureClip: FeatureCollection<Polygon | MultiPolygon>,
  cellSide: number,
  units: turf.Units = "kilometers"
) => {
  try {
    if (
      !featureClip ||
      !featureClip.features ||
      !Array.isArray(featureClip.features) ||
      featureClip.features.length === 0
    ) {
      throw new Error(
        "Invalid FeatureCollection: featureClip.features is not an array or is empty"
      );
    }

    const bbox = turf.bbox(featureClip);

    const hexGrid = turf.hexGrid(bbox, cellSide, {
      units,
      mask: featureClip?.features[0],
    });
    const hexagons = hexGrid.features
      .filter((hex) =>
        featureClip.features.some((feature) =>
          turf.booleanPointInPolygon(turf.center(hex), feature)
        )
      )
      .map((hex) => {
        const area = turf.area(hex) / 1e6;
        return {
          ...hex,
          properties: {
            size: cellSide,
            units: units,
            area: parseFloat(area.toFixed(4)), // Bulatkan ke 4 desimal
          },
        };
      });
    return turf.featureCollection(hexagons);
  } catch (error) {
    console.error("Error clipping layers:", error);
    return null;
  }
};

const simplifyLayers = (
  featureCollection: FeatureCollection<Polygon | MultiPolygon>,
  tolerance: number = 0.001,
  highQuality: boolean = true
): FeatureCollection<Polygon | MultiPolygon> => {
  try {
    return turf.featureCollection(
      featureCollection.features.map((feature) =>
        turf.simplify(feature, { tolerance, highQuality })
      )
    );
  } catch (error) {
    console.error("Error simplifying polygons:", error);
    return featureCollection;
  }
};

const pointAlongLinesLayers = (
  lineFeatureCollection: FeatureCollection<LineString | MultiLineString>,
  interval: number,
  units: turf.Units = "kilometers"
): FeatureCollection<Point> => {
  try {
    const points: Feature<Point>[] = [];
    lineFeatureCollection.features.forEach((feature) => {
      if (feature.geometry.type === "LineString") {
        const length = turf.length(feature, { units });
        for (let i = 0; i <= length; i += interval) {
          const point = turf.along(feature, i, { units });
          points.push(point);
        }
      } else if (feature.geometry.type === "MultiLineString") {
        feature.geometry.coordinates.forEach((lineCoords) => {
          const line = turf.lineString(lineCoords);
          const length = turf.length(line, { units });
          for (let i = 0; i <= length; i += interval) {
            const point = turf.along(line, i, { units });
            points.push(point);
          }
        });
      }
    });

    return turf.featureCollection(points);
  } catch (error) {
    console.error("Error generating points along line:", error);
    return turf.featureCollection([]);
  }
};

const buildingLayers = async (featureCollection: FeatureCollection) => {
  try {
    const bbox = turf.bbox(featureCollection);
    const buildings = await overpassBuildingIntegration(bbox);
    if (buildings) {
      const featureCollection = turf.featureCollection(
        buildings.filter(
          (building: any): building is GeoJSON.Feature => building !== null
        )
      );
      return featureCollection;
    }
  } catch (error) {
    console.error("Error fetching building data:", error);
  }
};

const elevationLayers = async (
  featureCollection: FeatureCollection,
  source: string
) => {
  try {
    console.log("WIP GUYES");
    if (source === "Map Toolkit") {
      const points = featureCollection.features.map((feature) => {
        const coords = feature.geometry.coordinates;
        return Array.isArray(coords[0])
          ? coords[0].map((c: any) => `[${c}]`).join(",")
          : `[${coords}]`;
      });
      const response = await fetch(
        `https://maptoolkit.p.rapidapi.com/elevation?points=[${points}]`,
        {
          headers: {
            "x-rapidapi-key":
              "313cbbad8cmshee05ce25c9e166bp101569jsnef19f7ec20c8",
            "x-rapidapi-host": "maptoolkit.p.rapidapi.com",
          },
        }
      );
      const data = await response.json();
      console.log("Ini Response : ", data);
    } else if (source === "Open Elevation") {
      const points = featureCollection.features.map((feature) => {
        const coords = feature.geometry.coordinates;
        const coordArray = Array.isArray(coords[0]) ? coords[0] : coords;
        return {
          latitude: coordArray[1],
          longitude: coordArray[0],
        };
      });
      const latitudes = points.map((p) => p.latitude).join(",");
      const longitudes = points.map((p) => p.longitude).join(",");
      const response = await fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`
      );
      const data = await response.json();
      console.log("Ini Response : ", data);
    } else if (source === "GPXZ") {
      const points = featureCollection.features.map((feature) => {
        const coords = feature.geometry.coordinates;
        const coordArray = Array.isArray(coords[0]) ? coords[0] : coords;
        return {
          latitude: coordArray[1],
          longitude: coordArray[0],
        };
      });
      const pointsStr = points
        .map((p) => `${p.latitude},${p.longitude}`)
        .join("|");

      const response = await fetch(`https://api.gpxz.io/v1/elevation/points`, {
        method: "POST",
        headers: {
          "x-api-key": "ak_1fJxvQgh_GDctGup4zErSqvRg",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `latlons=${pointsStr}`,
      });
      const data = await response.json();
      console.log("Ini Response : ", data);
    }
  } catch (error) {
    console.error("Error fetching building data:", error);
  }
};

const aiCommand = (
  mapRef: React.RefObject<MapRef | null>,
  command: Record<string, any>,
  layers: Layer[]
) => {
  const {
    action,
    center,
    zoom,
    pitch,
    bearing,
    speed = 1.2,
    duration = 1000,
  } = command;

  if (!mapRef.current) {
    console.warn("Map reference is not available");
    return;
  }

  const commonParams = {
    center,
    zoom,
    pitch,
    bearing,
  };

  try {
    if (action === "flyTo") {
      mapRef?.current?.flyTo({ ...commonParams, speed });
    } else if (action === "easeTo") {
      mapRef?.current?.getMap().easeTo({ ...commonParams, duration });
    } else if (action === "findLayer") {
      mapRef?.current?.getMap().getLayer(command.idLayer);
    } else if (action === "filterLayer") {
      const layerId: string =
        layers.find((layer) => layer.name === command.layerName)?.id ?? "";
      if (layerId) {
        mapRef?.current?.getMap().setFilter(layerId, command.filter);
        const features = mapRef?.current
          ?.getMap()
          .queryRenderedFeatures({ layers: [layerId] });
        console.log("Ini Features ", features);
        if (features.length > 0) {
          const bbox = turf.bbox(turf.featureCollection(features));
          mapRef?.current?.getMap().fitBounds(
            [
              [bbox[0], bbox[1]],
              [bbox[2], bbox[3]],
            ],
            {
              padding: 50,
              maxZoom: 15,
            }
          );
        }
      }
    }
  } catch (error) {
    console.error("Error executing map command:", error);
  }
};

export {
    addGeojsonToMap,
    aiCommand,
    bufferLayers,
    buildingLayers,
    calculateCoordinatesWithAspectRatio,
    centroidLayers,
    clipLayers,
    differenceLayers,
    elevationLayers, findLayerConfigByGeometryType, getBBOX,
    hexagonLayer,
    isCoordinates,
    linesToPolygonLayers,
    pointAlongLinesLayers,
    polygonToLinesLayers,
    removeDuplicatesLayers,
    searchAlternatives,
    searchPlaces,
    simplifyLayers
};

