"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MapView from "@/components/ui/map-view";
import Search from "@/components/ui/map/search";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  BoundingBox,
  InfoFeature,
  Layer,
  Location,
  MapboxLayerStyle,
  MapServiceVendor,
  Place,
} from "@/types/map.types";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import {
  ArrowUp,
  Eye,
  EyeClosed,
  Fullscreen,
  Heart,
  LayersIcon,
  MinusIcon,
  PlusIcon,
  SaveAll,
  ScanSearch,
  X,
} from "lucide-react";
import mapboxgl, {
  ColorSpecification,
  DataDrivenPropertyValueSpecification,
  LayerSpecification,
  LngLat,
  LngLatBoundsLike,
  MapMouseEvent,
  MapTouchEvent,
} from "mapbox-gl";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { BiCollapse, BiLogOutCircle, BiTrash } from "react-icons/bi";
import { FiFilter } from "react-icons/fi";
import { HiCubeTransparent } from "react-icons/hi";
import { IoClose } from "react-icons/io5";
import { MdGpsFixed, MdOutlineStyle } from "react-icons/md";
import {
  TbRouteSquare,
  TbTriangleSquareCircle,
  TbZoomInAreaFilled,
} from "react-icons/tb";
import { MapRef } from "react-map-gl";
import { Button } from "../button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { addBookmark, removeBookmark, updateBookmark } from "@/server/bookmark";
import {
  convertWMSToVectorData,
  fetchLayerBbox,
  getAllFeaturesGeoserver,
  getFeatureInfo,
  getWMSServices,
} from "@/services/map-services";
import useDatasetStore from "@/stores/datasets";
import useLayerStore, { useSetFields } from "@/stores/layer";
import { useMapStore } from "@/stores/map";
import {
  addGeojsonToMap,
  findLayerConfigByGeometryType,
  searchAlternatives,
} from "@/tools/map-tools";
import { handleDrop } from "@/tools/map-utility";
import { Bookmark, BookmarkResponse } from "@/types/bookmark.types";
import { Datasets } from "@/types/datasets.types";
import {
  closestCorners,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import * as turf from "@turf/turf";
import { MapLayerMouseEvent } from "mapbox-gl";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { AiOutlineSisternode } from "react-icons/ai";
import { WiStars } from "react-icons/wi";
import io from "socket.io-client";
import { v4 } from "uuid";
import { ChatWithAI } from "../ai/chat-with-ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { DynamicTable, TableProps } from "../dynamic-table";
import FlowDiagramWithDraggableNodes from "../flow/flow-components";
import AnimatedLoadingScreen from "../loading-animation-screen";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "../resizable";
import AddLayerModal from "./add-layer-modal";
import BookmarkDropdown from "./bookmark-dropdown";
import FeatureInfo from "./feature-info";
import IconLayerType from "./icon-layer-type";
import LegendEsri from "./legend-esri";
import LegendMapbox from "./legend-mapbox";
import MapMenu from "./map-menu";
import OperationComponents from "./operation-page";
import SortableItem from "./sortable-item";
import { StylePanel } from "./style-panel";
import { CursorData } from "@/types/collaboration.types";
import IconTooltip from "../icon-tooltip";
import { MapCommandExecutor } from "@/tools/ai-tools/ai-tools";

export default function MapLayout({
  layersFetch,
  datasetsFetch,
  bookmarkFetch,
}: {
  layersFetch: Layer[];
  datasetsFetch: Datasets[];
  bookmarkFetch: Bookmark[];
}) {
  const params = useParams();
  const mapRef = useRef<MapRef | null>(null);

  const {
    setMap,
    displayLayouts,
    setDisplayLayouts,
    selectedLayer,
    setSelectedLayer,
  } = useMapStore();

  const drawRef = useRef<MapboxDraw | null>(null); // Ref untuk MapboxDraw
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);

  const isDragging = useRef(false);

  const [mousePosition, setMousePosition] = useState<mapboxgl.LngLat | null>(
    null
  );
  const [isMapMoving, setIsMapMoving] = useState(false);
  const throttleRef = useRef<NodeJS.Timeout | null>(null);
  const moveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [currentMapClick, setCurrentMapClick] = useState<Location | null>(null);

  const { isLoading, setIsLoading } = useMapStore();

  const [showLoading, setShowLoading] = useState<boolean>(true);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [basemap, setBasemap] = useState([
    {
      id: "Mapbox",
      name: "Mapbox",
      url: "mapbox://styles/mapbox/streets-v9",
      thumbnail: "/assets/basemap/Light.png",
    },
    {
      id: "Mapbox Dark",
      name: "Mapbox Dark",
      url: "mapbox://styles/mapbox/dark-v11",
      thumbnail: "/assets/basemap/Light.png",
    },
    {
      id: "Google Satellite",
      name: "Google Satellite",
      url: "https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga",
      thumbnail: "/assets/basemap/Satellite.png",
    },
    {
      id: "Google Street",
      name: "Google Street",
      url: "https://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}&s=Ga",
      thumbnail: "/assets/basemap/googleStreets.png",
    },
    {
      id: "Mapbox Dark 2",
      name: "Mapbox Dark 2",
      url: "mapbox://styles/adilonapsh/cm7sqa9ua00b001qubb9q0myu",
      thumbnail: "/assets/basemap/googleStreets.png",
    },
  ]);
  //   const [layers, setLayers] = useState(layersFetch);
  const { layers, setLayers, removeLayer, setVisibility, addLayer, setFields } =
    useLayerStore();
  const [activeBasemap, setActiveBasemap] = useState(0);

  // const [selectedDatasets, setSelectedDatasets] = useState<ParsedLayer[]>([]);
  const {
    setDatasets,
    selectedDatasets,
    setSelectedDatasets,
    datasetProperties,
    setDatasetResult,
    setActiveDataset,
  } = useDatasetStore();

  const [infoFeatures, setInfoFeatures] = useState<InfoFeature[]>([]);
  const [toggleEdit, setToggleEdit] = useState<boolean>(false);

  const [zoom, setZoom] = useState<number>(0);
  const [compass, setCompass] = useState({ rotate: 0, pitch: 0 });

  const [drawMode, setDrawMode] = useState<string | null>(null);
  const [isDrawDone, setIsDrawDone] = useState<boolean>(true);

  const [aiCommandProgress, setAiCommandProgress] = useState<{
    status: 'idle' | 'start' | 'running' | 'success' | 'error';
    action?: string;
    step?: string;
    progress?: number;
  }>({ status: 'idle' });

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    lng: number;
    lat: number;
  } | null>(null);

  const [routeCoordinates, setRouteCoordinates] = useState<{
    origin?: number[] | undefined;
    destination?: number[] | undefined;
  } | null>(null);
  const [activeRoutes, setActiveRoutes] = useState<{
    origin?: number[] | undefined;
    destination?: number[] | undefined;
    properties?: Record<string, any>;
  } | null>(null);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(bookmarkFetch);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(
    null
  );

  const [tableData, setTableData] = useState<TableProps>({
    headers: [],
    data: [],
  });

  // MAP FUNCTIONS
  const handleSearch = (place_result: Place) => {
    mapRef.current?.getMap()?.flyTo({
      center: [place_result.location.lng, place_result.location.lat],
      zoom: 12,
      duration: 1500,
    });
    addOrUpdateMarker(place_result.location.lng, place_result.location.lat);
  };

  const onMoveStart = useCallback(() => {
    setIsMapMoving(true);
    // Clear timeout jika ada
    if (moveTimeoutRef.current) {
      clearTimeout(moveTimeoutRef.current);
    }
  }, []);

  const onMoveEnd = useCallback(() => {
    // Delay sedikit setelah move end untuk memastikan inertia benar-benar berhenti
    moveTimeoutRef.current = setTimeout(() => {
      setIsMapMoving(false);
    }, 100);
  }, []);

  const onMouseMove = useCallback(
    (e: MapMouseEvent) => {
      if (isMapMoving) return;

      if (throttleRef.current) return;

      throttleRef.current = setTimeout(() => {
        setMousePosition(e.lngLat);
        throttleRef.current = null;
      }, 10);
    },
    [isMapMoving]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (throttleRef.current) clearTimeout(throttleRef.current);
      if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
    };
  }, []);

  // WIP WEBSOCKET
  const cursorElement = (userId: string, color: string, name?: string) => {
    const el = document.createElement("div");
    el.className = "cursor-marker";
    el.innerHTML = `
            <svg class="cursor-marker-child" width="25px" height="25px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.92098 2.29951C6.93571 1.5331 5.5 2.23523 5.5 3.48349V20.4923C5.5 21.9145 7.2945 22.5382 8.17661 21.4226L12.3676 16.1224C12.6806 15.7267 13.1574 15.4958 13.6619 15.4958H20.5143C21.9425 15.4958 22.5626 13.6887 21.4353 12.8119L7.92098 2.29951Z" fill="${color}" stroke="white" stroke-width="1"/>
            </svg>
            <div class="cursor-label" style="background-color:${color}; background-opacity:20%; color:white;">${name}</div>
        `;

    el.addEventListener("mouseenter", () => {
      el.querySelector(".cursor-label")?.classList.remove("hidden");
    });
    el.addEventListener("mouseleave", () => {
      el.querySelector(".cursor-label")?.classList.add("hidden");
    });

    return el;
  };

  const socketRef = useRef<any>(null);
  const cursorsRef = useRef<Record<string, mapboxgl.Marker>>({});

  const labelTimeouts: { [id: string]: NodeJS.Timeout } = {};
  const projectIdParams: string | undefined = params.id?.toString();

  const initWebsocket = () => {
    socketRef.current = io(`${process.env.NEXT_PUBLIC_WEBSOCKET_URL}`);
    const map = mapRef.current?.getMap();
    const colors = [
      "#FF4747",
      "#FFC400",
      "#47FF4D",
      "#47FFFF",
      "#4797FF",
      "#8B47FF",
      "#FF47FC",
    ];
    const userColor =
      colors[Math.floor(Math.random() * colors.length)] ??
      "#" + Math.floor(Math.random() * 16777215).toString(16);
    const username = "User_" + Math.floor(Math.random() * 1000);
    if (map) {
      map.on("mousemove", (e) => {
        socketRef.current.emit("cursor-move", {
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          username,
          color: userColor,
          projectid: projectIdParams,
        });
      });

      socketRef.current.on(
        "cursor-update",
        ({ id, lng, lat, projectId, username, color }: CursorData) => {
          const myUserId = socketRef.current.id;
          if (id === myUserId || projectId != projectId) return;
          if (!cursorsRef.current[id]) {
            const markerEl = cursorElement(id, color, username);
            cursorsRef.current[id] = new mapboxgl.Marker({ element: markerEl })
              .setLngLat([lng, lat])
              .addTo(map);
            markerEl.classList.add("cursor-enter");
            setTimeout(() => el.classList.remove("cursor-enter"), 300);
          } else {
            cursorsRef.current[id].setLngLat([lng, lat]);
          }

          const el = cursorsRef.current[id].getElement();
          const label = el.querySelector(".cursor-label") as HTMLElement;
          if (label) {
            label.classList.remove("hidden");
            clearTimeout(labelTimeouts[id]);

            // Tampilkan lagi setelah 1 detik diam
            labelTimeouts[id] = setTimeout(() => {
              label.classList.remove("hidden");
            }, 1000);
          }
        }
      );

      socketRef.current.on("cursor-remove", (id: string) => {
        if (cursorsRef.current[id]) {
          cursorsRef.current[id].remove();
          delete cursorsRef.current[id];
        }
      });
    }
  };

  // INISIALISASI
  useEffect(() => {
    setLayers(layersFetch);
    setDatasets(datasetsFetch);

    const socket = socketRef.current;
    if (socket) {
      const handleUnload = () => socket.disconnect();
      window.addEventListener("beforeunload", handleUnload);

      return () => {
        socket.disconnect();
        window.removeEventListener("beforeunload", handleUnload);
      };
    }
  }, [mapRef]);

  //   END WIP WEBSOCKET

  const handleKeyDown = (e: KeyboardEvent) => {
    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const isTyping = tag === "input" || tag === "textarea";
    if (isTyping) return;

    if (!drawRef.current) return;

    const key = e.key.toLowerCase();
    if (key === "p") {
      drawRef.current.changeMode("draw_point");
    } else if (key === "l") {
      drawRef.current.changeMode("draw_line_string");
    } else if (key === "g") {
      drawRef.current.changeMode("draw_polygon");
    } else if (e.key === "Escape") {
      drawRef.current.changeMode("simple_select");
    } else if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleOnSave();
    } else if (e.key === "Enter") {
      saveFeaturesToLayer();
    }
  };

  const onMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (map) {
      if (mapRef.current) {
        setMap(mapRef.current);
      }

      // Load Layers
      initLayers();
      initWebsocket();
      setZoom(parseFloat(map.getZoom().toFixed(1)));

      const drawStyles = [
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#2A3A75", // Warna isian
            "fill-opacity": 0.5, // Transparansi isian
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "line-color": "#1E90FF", // Warna garis tepi
            "line-width": 2, // Ketebalan garis
          },
        },
        {
          id: "gl-draw-line",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "line-color": "#1E90FF", // Warna garis
            "line-width": 3, // Ketebalan garis
          },
        },
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
          paint: {
            "circle-radius": 5, // Ukuran titik
            "circle-color": "#1E90FF", // Warna titik
            "circle-stroke-color": "#FFFFFF", // Warna Stroke
            "circle-stroke-width": 2, // Warna Stroke
          },
        },
      ];

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        styles: drawStyles,
        controls: {
          polygon: true,
          line_string: true,
          point: true,
          trash: true,
          combine_features: false,
          uncombine_features: false,
        },
      });

      drawRef.current = draw;
      map.addControl(draw, "bottom-right");

      // Load Draw Styles
      map.on("draw.create", (e: { features: GeoJSON.Feature[] }) => {
        setIsDrawDone(false);
      });

      map.on("draw.update", (e: { features: GeoJSON.Feature[] }) => {
        setIsDrawDone(false);
      });

      map.on("draw.delete", (e: { features: GeoJSON.Feature[] }) => {});

      map.on("draw.modechange", (e: { mode: string }) => {
        setDrawMode(e.mode);
      });

      map.on("dragstart", () => {
        isDragging.current = true;
      });
      map.on("dragend", () => {
        setTimeout(() => (isDragging.current = false), 50);
      });

      map.getCanvas().addEventListener("keydown", handleKeyDown);
    }
    setIsLoading({ ...isLoading, initLoading: false });
    setTimeout(() => {
      setShowLoading(false);
    }, 1000);
  };

  const onStyleData = () => {};

  const onZoomEnd = () => {
    setZoom(parseFloat(mapRef.current?.getMap()?.getZoom().toFixed(1) ?? "0"));
  };

  const onRotate = () => {
    const bearing = mapRef.current?.getMap()?.getBearing();
    const pitch = mapRef.current?.getMap()?.getPitch();
    setCompass({
      rotate: typeof bearing === "number" ? Number(bearing.toFixed(0)) : 0,
      pitch: typeof pitch === "number" ? Number(pitch.toFixed(0)) : 0,
    });
  };

  const addOrUpdateMarker = (longitude: number, latitude: number) => {
    if (marker) {
      marker.setLngLat([longitude, latitude]);
    } else {
      const el = document.createElement("div");
      el.className = "relative";
      const pulseDiv = document.createElement("div");
      pulseDiv.className =
        "w-4 h-4 bg-blue-500 rounded-full border-2 border animate-pulse border-background";
      const pingDiv = document.createElement("div");
      pingDiv.className =
        "absolute inset-0 w-4 h-4 bg-blue-500 rounded-full opacity-75 animate-ping";
      el.appendChild(pulseDiv);
      el.appendChild(pingDiv);
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        const newMarker = new mapboxgl.Marker({
          // color: "#000",
          clickTolerance: 20,
          element: el,
        })
          .setLngLat([longitude, latitude])
          .addTo(map);
        setMarker(newMarker);
      }
    }
  };

  const handleMapClick = async (event: MapMouseEvent | MapTouchEvent) => {
    if (isDragging.current) return;
    const mode = drawRef.current?.getMode();
    const map = mapRef.current?.getMap();
    const latLng: Location = event.lngLat;
    setInfoFeatures([]);
    setIsLoading({ ...isLoading, featureInfo: true });
    if (map && mode == "simple_select") {
      addOrUpdateMarker(latLng.lng, latLng.lat);
      setCurrentMapClick({ lng: latLng.lng, lat: latLng.lat });
      setDisplayLayouts({ ...displayLayouts, layerInfo: true });
      const info = (await getFeatureInfo(
        event,
        selectedLayer ? selectedLayer : layers,
        map
      )) as InfoFeature[];
      setInfoFeatures(info);
    }
    setIsLoading({ ...isLoading, featureInfo: false });
  };

  const handleChangeBasemap = (index: number) => {
    const map = mapRef?.current?.getMap();
    if (map) {
      const bm = basemap[index];
      if (bm) {
        if (bm.id.toLowerCase().includes("mapbox")) {
          map.setStyle(bm?.url);
          setTimeout(() => {
            setLayers(
              layers.map((layer, i) =>
                i === 0
                  ? {
                      ...layer,
                      rendered: layer.rendered ? 0 + 1 : 1,
                      render_type: layer.render_type ?? "raster",
                    }
                  : layer
              )
            );
          }, 500);
        } else {
          if (map.getLayer("basemap-layer")) {
            map.removeLayer("basemap-layer");
            map.removeSource("basemap-layer");
          }
          map.addLayer(
            {
              id: "basemap-layer",
              type: "raster",
              source: {
                type: "raster",
                tiles: [bm?.url],
                tileSize: 256,
              },
              minzoom: 0,
              maxzoom: 24,
            },
            "gl-draw-polygon-fill.cold"
          );
        }
        setActiveBasemap(index);
      }
    }
  };

  const setLayerVisible = (index: number, status: boolean) => {
    const map = mapRef?.current?.getMap();
    const layerId = layers[index].id;
    if (map) {
      map.setLayoutProperty(
        layerId,
        "visibility",
        !status ? "visible" : "none"
      );
    }
    setVisibility(layerId, !status);
  };

  const isSourceUsed = (sourceId: string): boolean => {
    const map = mapRef?.current?.getMap();
    const layers = map?.getStyle()?.layers || [];
    return layers.some((layer) => layer.source === sourceId);
  };

  const handleRemoveLayer = (index: number) => {
    const map = mapRef?.current?.getMap();
    const layerId = layers[index].id;
    if (map && layerId) {
      const layer = map.getLayer(layerId);
      const is_source_used = isSourceUsed(layer?.source ?? "");
      if (layer) {
        map.removeLayer(layerId);
        if (!is_source_used) {
          map.removeSource(layer?.source ?? "");
        }
      }
    }
    removeLayer(layerId);
  };

  const handleZoomToLayer = async (index: number) => {
    setIsLoading({ ...isLoading, zoomToMap: true });
    const map = mapRef?.current?.getMap();
    const layer = layers[index];
    if (map) {
      if (layer.map_service_vendor == MapServiceVendor.Geoserver) {
        const fetch = await fetchLayerBbox(
          layer.map_service_url,
          layer.map_service_layer_name,
          layer.filters as string
        );
        if (map && fetch) {
          const { minLng, minLat, maxLng, maxLat } = fetch;
          const bbox: BoundingBox = [
            [parseFloat(minLng ?? "0"), parseFloat(minLat ?? "0")],
            [parseFloat(maxLng ?? "0"), parseFloat(maxLat ?? "0")],
          ];
          map.fitBounds(bbox, {
            padding: 25,
            duration: 1000,
          });
        } else {
          console.log("Map reference is not defined.");
        }
      } else if (layer.map_service_vendor == MapServiceVendor.ArcGIS) {
        const esriURL = `${layer.map_service_url.replace(
          "/export",
          ""
        )}?f=json`;
        fetch(esriURL)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok");
            }
            return response.json();
          })
          .then((json) => {
            if (json.fullExtent) {
              const extent = {
                minx: json.fullExtent.xmin,
                miny: json.fullExtent.ymin,
                maxx: json.fullExtent.xmax,
                maxy: json.fullExtent.ymax,
              };
              if (map) {
                map.fitBounds(
                  [
                    [extent.minx, extent.miny],
                    [extent.maxx, extent.maxy],
                  ],
                  {
                    padding: 20,
                    duration: 2000,
                  }
                );
              }
            } else {
              console.error("Full extent is not available in the response.");
            }
          })
          .catch((err) => {
            console.log("Map reference is not defined.", err);
          });
      } else if (layer.map_service_vendor == "GeoJSON") {
        const layerSource = map.getLayer(layer.id)?.source;
        if (layerSource) {
          const source = map.getSource(layerSource) as mapboxgl.GeoJSONSource;
          if (source) {
            const data = source.serialize().data as GeoJSON.GeoJSON;
            const bbox = turf.bbox(data);
            map.fitBounds(bbox as [number, number, number, number], {
              padding: 25,
              duration: 1000,
            });
          }
        }
      }
    }
    setIsLoading({ ...isLoading, zoomToMap: false });
  };

  const handleStyleLayer = (index: number) => {
    const map = mapRef?.current?.getMap();
    setSelectedLayer(layers[index] as Layer);
    setDisplayLayouts({ ...displayLayouts, style: true });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDropEvent = async (
    event: React.DragEvent<HTMLDivElement>,
    mapRef: any,
    mousePosition: any,
    toast: any
  ) => {
    await handleDrop(event, mapRef, mousePosition, toast);
  };

  const handleNorth = () => {
    mapRef.current?.getMap()?.easeTo({ bearing: 0, duration: 1000 });
  };

  // END MAP FUNCTIONS

  // TOOL FUNCTIONS
  const collapseAll = () => {
    setOpenItems([]);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active } = event;
    if (active.id !== over?.id) {
      const oldIndex = layers.findIndex((layer) => layer.id === active.id);
      const newIndex = layers.findIndex((layer) => layer.id === over?.id);

      const newLayers = arrayMove(layers, oldIndex, newIndex);
      setLayers(newLayers);

      const map = mapRef.current?.getMap();
      if (map) {
        newLayers.forEach((layer, index) => {
          const beforeId = index === 0 ? undefined : newLayers[index - 1].id;
          try {
            map.moveLayer(layer.id, beforeId);
          } catch (err) {
            console.warn("Error moving layer:", err);
          }
        });
      }
    }
  };

  const handleConvertToVector = async (layer: Layer) => {
    const map = mapRef.current?.getMap();
    if (map) {
      toast.promise(
        convertWMSToVectorData(layer, map, layers).then((vectorLayer) => {
          if (vectorLayer) {
            vectorLayer.forEach((layer) => {
              addLayer(layer);
            });
          }
        }),
        {
          loading: "Loading...",
          success: "Conversion successful.",
          error: "Error during conversion",
        }
      );
    }
  };

  const handleChangeLayerName = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const layerIndex = layers[index];
    if (layerIndex) {
      const updatedLayers = [...layers];
      updatedLayers[index] = {
        ...updatedLayers[index],
        name: event.target.value,
      };
      setLayers(updatedLayers);
    }
  };
  // END TOOL FUNCTIONS

  const handleOnSave = () => {
    handlePrint();
    toast.promise(
      new Promise((resolve, reject) => {
        setTimeout(() => {
          const rand = Math.random();
          if (rand > 0.5) {
            resolve(null);
          }
          reject();
        }, 2000);
      }),
      {
        loading: "Saving...",
        success: "Saved successfully.",
        error: "Failed to save.",
      }
    );
    return;
  };

  const handleOnExit = () => {
    window.location.assign("/admin/dashboard");
  };

  const initLayers = () => {
    const map = mapRef.current?.getMap();
    if (map) {
      layers.forEach((layer, index) => {
        const getServiceUrl = () => {
          if (layer.map_service_vendor === MapServiceVendor.Geoserver) {
            const WMS_PARAMS =
              "?service=WMS&version=1.1.0&request=getmap&layers={layer}&styles=&bbox={bbox-epsg-3857}&width=256&height=256&srs=EPSG:3857&format=image/png&transparent=true";
            return (
              layer.map_service_url +
              WMS_PARAMS.replace("{layer}", layer.map_service_layer_name)
            );
          }

          if (layer.map_service_vendor === MapServiceVendor.ArcGIS) {
            if (layer.map_service_url.includes("FeatureServer")) {
              return (
                layer.map_service_url +
                "/0/query?where=1=1&outFields=*&f=geojson&geometryType=esriGeometryEnvelope&returnGeometry=true"
              );
            }
            const ESRI_PARAMS =
              "/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=250,250&format=png&transparent=true&f=image";
            return (
              layer.map_service_url +
              ESRI_PARAMS.replace("{layer}", layer.map_service_layer_name)
            );
          }

          if (layer.map_service_vendor === MapServiceVendor.GeoJSON) {
            return layer.map_service_url;
          }

          return "";
        };

        const url = getServiceUrl();
        if (!url || map.getLayer(layer.id)) return;

        const addGeoJSONLayer = async (fetchUrl: string) => {
          try {
            const response = await fetch(fetchUrl);
            const data = await response.json();

            if (!data.features?.length) return;

            const type = data.features[0].geometry.type;
            const layerConfig = findLayerConfigByGeometryType(type);

            map.addLayer({
              id: layer.id,
              type: layerConfig?.layerType as "fill" | "line" | "circle",
              source: {
                type: "geojson",
                data: data,
              },
              minzoom: layer.min_zoom || 0,
              maxzoom: layer.max_zoom || 24,
              layout: {
                visibility: layer.visible ? "visible" : "none",
              },
              metadata: layer.metadata ?? {},
              ...layerConfig?.layerProps,
            });
          } catch (error) {
            console.error("Error fetching GeoJSON:", error);
            toast.error("Failed to load GeoJSON data");
          }
        };

        if (
          (layer.map_service_vendor === MapServiceVendor.GeoJSON &&
            layer.map_service_url) ||
          layer.map_service_url.includes("FeatureServer")
        ) {
          addGeoJSONLayer(url);
        } else {
          map.addLayer({
            id: layer.id,
            type: "raster",
            source: {
              type: "raster",
              tiles: [url],
            },
            minzoom: layer.min_zoom || 0,
            maxzoom: layer.max_zoom || 24,
            layout: {
              visibility: layer.visible ? "visible" : "none",
            },
            paint: {
              "raster-opacity": 1,
            },
            metadata: layer.metadata ?? {},
          });
        }

        const layerIndex = layers[index];
        if (layerIndex) {
          const updatedLayers = [...layers];
          updatedLayers[index] = {
            ...updatedLayers[index],
            render_type: map.getLayer(layer.id)?.type as
              | "symbol"
              | "fill"
              | "raster"
              | "background"
              | "building"
              | "circle"
              | "clip"
              | "fill-extrusion"
              | "heatmap"
              | "hillshade"
              | "line"
              | "model"
              | "raster-particle"
              | "sky"
              | undefined,
          };
          setLayers(updatedLayers);
        }
      });
    }
  };

  useEffect(() => {
    initLayers();
  }, [layers]);

  const handleEditFeatures = () => {
    const map = mapRef?.current?.getMap();
    if (selectedLayer) {
      const layerId = selectedLayer.id;
      const sourceId = map?.getLayer(layerId)?.source;
      const sourceType = map?.getSource(sourceId ?? "")?.type;
      const toggleEdits = !toggleEdit;
      if (sourceType === "image") {
        setToggleEdit(toggleEdits);
        if (!toggleEdit) {
        } else {
        }
      } else {
        const data = map?.getSource(sourceId ?? "")?.serialize();
        setToggleEdit(toggleEdits);
        if (!toggleEdit) {
          const geoJsonData = data.data as GeoJSON.GeoJSON;
          if (geoJsonData) {
            drawRef.current?.add(geoJsonData);
          }
        } else {
          const features = drawRef.current?.getAll();
          const source = map?.getSource(
            sourceId ?? ""
          ) as mapboxgl.GeoJSONSource;
          if (features) {
            source.setData(features);
          }
          drawRef.current?.deleteAll();
        }
      }
    }
  };

  const saveFeaturesToLayer = () => {
    if (drawRef.current) {
      const features = drawRef.current.getAll();
      if (drawRef.current) {
        drawRef.current.deleteAll();
      }
      addGeojsonToMap({
        mapRef: mapRef,
        layerName: "Untitled Layer " + layers.length + 1,
        data: features,
      });
      setIsDrawDone(true);
    }
  };

  const handleFolderClick = async (data: Datasets) => {
    setActiveDataset(data);
    setIsLoading({ ...isLoading, dataset: true });

    const layerDatasets = await getWMSServices(
      data.url,
      data.map_service_vendor as MapServiceVendor
    );

    setDatasetResult(layerDatasets ?? []);
    setIsLoading({ ...isLoading, dataset: false });
  };

  const handlePrint = async () => {
    const map = mapRef.current;
    const mapCanvas = map?.getCanvas();
    const dataUrl = mapCanvas?.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = "map.png";
    link.href = dataUrl || "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    mapRef.current?.getMap()?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.getMap()?.zoomOut();
  };

  // WIP
  const handleMaxLayersBbox = async () => {
    let maxBbox: number[] = [];
    const map = mapRef.current;
    if (map) {
      await map.getStyle()?.layers?.forEach((layer) => {
        const features = map.queryRenderedFeatures({ layers: [layer.id] });
        if (features.length > 0) {
          const bbox = turf.bbox({ type: "FeatureCollection", features });
          maxBbox = bbox;
          if (maxBbox.length === 0) {
            maxBbox = bbox;
          } else {
            const currentArea =
              (maxBbox[2] - maxBbox[0]) * (maxBbox[3] - maxBbox[1]);
            const newArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
            if (newArea > currentArea) {
              maxBbox = bbox;
            }
          }
        }
      });
      if (maxBbox.length > 0) {
        map.fitBounds(maxBbox as LngLatBoundsLike, {
          padding: 25,
          duration: 1000,
        });
      }
    }
  };

  // Routes
  const handleRoutes = async () => {
    const from = routeCoordinates?.origin;
    const to = routeCoordinates?.destination;
    const map = mapRef.current?.getMap();

    if (!from) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = [
              position.coords.longitude,
              position.coords.latitude,
            ];
            if (map?.getLayer("route-origin")) {
              map.removeLayer("route-origin");
              map.removeSource("route-origin");
            }
            map?.addLayer({
              id: "route-origin",
              type: "circle",
              source: {
                type: "geojson",
                data: turf.points([coords]),
              },
              paint: {
                "circle-radius": 4,
                "circle-color": "#3887be",
                "circle-stroke-color": "#fff",
                "circle-stroke-width": 2,
              },
            });
            setRouteCoordinates({
              ...routeCoordinates,
              origin: coords,
            });
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error("Could not get current location");
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser");
      }
    }

    if (from && to) {
      const alternatives = await toast.promise(searchAlternatives(from, to), {
        loading: "Searching for routes...",
        success: "Routes found!",
        error: "Failed to find routes",
      });
      setActiveRoutes({ origin: from, destination: to });
      const colors = { active: "#3887ff", secondary: "#8F8F8F" };
      map?.getStyle()?.layers?.forEach((layer) => {
        const layerId = layer.id;
        if (layerId.includes("route-group-")) {
          map.removeLayer(layerId);
          if (map.getSource(layerId)) {
            map.removeSource(layerId);
          }
        }
      });
      alternatives.forEach((alternative: any, index: number) => {
        const routes = turf.lineString(
          alternative.coords,
          alternatives.response
        );
        const bounds = turf.bbox(routes);

        map?.addLayer({
          id: `route-group-${index}`,
          type: "line",
          source: {
            type: "geojson",
            data: routes,
          },
          slot: alternative.response.isFastest ? "top" : "bottom",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": alternative.response.isFastest
              ? colors.active
              : colors.secondary,
            "line-width": 5,
            "line-opacity": alternative.response.isFastest ? 1 : 0.8,
          },
        });

        map?.on("mouseenter", `route-group-${index}`, () => {
          if (map) {
            map.getCanvas().style.cursor = "pointer";
          }
        });

        map?.on("mouseleave", `route-group-${index}`, () => {
          if (map) {
            map.getCanvas().style.cursor = "";
          }
        });

        map?.on("click", `route-group-${index}`, () => {
          if (map) {
            // Change the clicked route to active color
            map.setPaintProperty(
              `route-group-${index}`,
              "line-color",
              colors.active
            );

            // Bring the selected route to the top
            map.moveLayer(`route-group-${index}`);

            // Change all other routes to secondary color
            alternatives.forEach((_: any, i: number) => {
              if (i !== index) {
                map.setPaintProperty(
                  `route-group-${i}`,
                  "line-color",
                  colors.secondary
                );

                // Also update opacity for consistency
                map.setPaintProperty(`route-group-${i}`, "line-opacity", 0.8);
              } else {
                // Set full opacity for the selected route
                map.setPaintProperty(`route-group-${i}`, "line-opacity", 1);
              }
            });

            const properties = alternatives[index].response;
            setActiveRoutes((prev) => ({ ...prev, properties: properties }));
            setDisplayLayouts({ ...displayLayouts, routes: true });
          }
        });

        map?.fitBounds([bounds[0], bounds[1], bounds[2], bounds[3]], {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
        });
      });
      // setRouteCoordinates(null)
    }
  };

  const handleRouteOrigin = () => {
    const map = mapRef.current?.getMap();

    if (map?.getLayer("route-origin")) {
      map.removeLayer("route-origin");
      map.removeSource("route-origin");
    }

    if (menuPosition) {
      map?.addLayer({
        id: "route-origin",
        type: "circle",
        source: {
          type: "geojson",
          data: turf.points([[menuPosition.lng, menuPosition.lat]]),
        },
        paint: {
          "circle-radius": 4,
          "circle-color": "#3887be",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
    }

    setRouteCoordinates({
      ...routeCoordinates,
      origin: menuPosition ? [menuPosition.lng, menuPosition.lat] : undefined,
    });
  };

  const handleRouteDestination = () => {
    const map = mapRef.current?.getMap();

    if (map?.getLayer("route-destination")) {
      map.removeLayer("route-destination");
      map.removeSource("route-destination");
    }

    if (menuPosition) {
      map?.addLayer({
        id: "route-destination",
        type: "circle",
        source: {
          type: "geojson",
          data: turf.points([[menuPosition.lng, menuPosition.lat]]),
        },
        paint: {
          "circle-radius": 4,
          "circle-color": "#3887be",
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
    }

    setRouteCoordinates({
      ...routeCoordinates,
      destination: menuPosition
        ? [menuPosition?.lng, menuPosition.lat]
        : undefined,
    });
  };

  const removeRoutes = () => {
    const map = mapRef.current?.getMap();

    if (map?.getLayer("route-origin")) {
      map.removeLayer("route-origin");
      map.removeSource("route-origin");
    }

    if (map?.getLayer("route-destination")) {
      map.removeLayer("route-destination");
      map.removeSource("route-destination");
    }
    map?.getStyle()?.layers?.forEach((layer) => {
      const layerId = layer.id;
      if (layerId.includes("route-group-")) {
        map.removeLayer(layerId);
        if (map.getSource(layerId)) {
          map.removeSource(layerId);
        }
      }
    });
  };

  const handleContextMenu = (event: MapLayerMouseEvent) => {
    event.originalEvent.preventDefault();
    setMenuPosition({
      x: event.originalEvent.clientX,
      y: event.originalEvent.clientY,
      lng: event.lngLat.lng,
      lat: event.lngLat.lat,
    });
  };

  const handleCopyCoordinates = () => {
    if (menuPosition) {
      navigator.clipboard.writeText(`${menuPosition.lng}, ${menuPosition.lat}`);
      toast.success("Coordinates copied to clipboard");
      setMenuPosition(null);
    }
  };

  const handleMapboxCommand = async (command: any) => {
    if (!mapRef.current) return;

    if (typeof command === "object") {
      const executor = new MapCommandExecutor(mapRef, layers);
      try {
        await executor.execute(command, (p) => {
          setAiCommandProgress(p);
        });
      } catch (e) {
        setAiCommandProgress({ status: 'error', action: command?.action, step: 'Failed', });
      }
    }
  };

  const handleAddBookmark = async (name: string) => {
    const map = mapRef.current?.getMap();

    const center = map?.getCenter();
    const properties: Record<
      string,
      object | string | number | undefined | LngLat
    > = {
      center: center ? { lng: center.lng, lat: center.lat } : undefined,
      zoom: map?.getZoom(),
      pitch: map?.getPitch(),
      bearing: map?.getBearing(),
    };

    const newBookmark: Bookmark = {
      id: v4(),
      name: name,
      project_id: projectIdParams,
      properties,
    };

    const response: BookmarkResponse = await toast.promise(
      addBookmark(newBookmark),
      {
        loading: "Saving bookmark...",
        success: "Bookmark saved!",
        error: "Failed to save bookmark",
      }
    );

    const { data } = response;
    if (data) {
      setBookmarks([...bookmarks, data as Bookmark]);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (selectedBookmark && selectedBookmark.id === id) {
      setSelectedBookmark(null);
    }
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id));
    const response = toast.promise(removeBookmark(id), {
      loading: "Deleting bookmark...",
      success: "Bookmark deleted!",
      error: "Failed to delete bookmark",
    });
  };

  const handleEditBookmark = async (id: string, newName: string) => {
    const updatedBookmarks = bookmarks.map((bookmark) =>
      bookmark.id === id ? { ...bookmark, name: newName } : bookmark
    );
    setBookmarks(updatedBookmarks);

    if (selectedBookmark && selectedBookmark.id === id) {
      const updatedBookmark = updatedBookmarks.find((b) => b.id === id);
      if (updatedBookmark) {
        const properties: Bookmark = {
          id: id,
          name: newName,
        };

        const response = await toast.promise(updateBookmark(id, properties), {
          loading: "Updating bookmark...",
          success: "Bookmark updated!",
          error: "Failed to update bookmark",
        });
        setSelectedBookmark(updatedBookmark);
      }
    }
  };

  const handleSelectBookmark = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);

    const properties =
      typeof bookmark.properties === "string"
        ? JSON.parse(bookmark.properties)
        : bookmark.properties;
    const { center, zoom, pitch, bearing } = properties;
    if (bookmark) {
      mapRef.current?.getMap()?.flyTo({
        center,
        zoom,
        bearing,
        pitch,
        speed: 0.5,
        curve: 1,
      });
    }
  };

  const handleTableMapbox = async (index: number) => {
    const map = mapRef?.current?.getMap();
    const layerId = layers[index]?.id;
    const mapServiceVendor = layers[index]?.map_service_vendor;
    const mapServiceLayerName = layers[index]?.map_service_layer_name;
    const mapServiceUrl = layers[index]?.map_service_url;
    const layer = map?.getLayer(layerId);
    const sourceId = layer?.source;
    const metadata = (layer as LayerSpecification & { metadata?: any })
      ?.metadata;

    let header: string[] = [];
    let rows: any[] = [];

    setDisplayLayouts({ ...displayLayouts, table: true });
    setIsLoading({ ...isLoading, layerTable: true });

    if (
      mapServiceVendor === MapServiceVendor.GeoJSON ||
      mapServiceUrl?.includes("FeatureServer")
    ) {
      const source = map?.getSource(sourceId ?? "");
      if (!source) return;

      const data = source.serialize();
      const features = data?.data?.features || [];

      if (features.length === 0) return;

      const allProperties = features.map(
        (feature: { properties: any }) => feature.properties
      );

      header = Object.keys(allProperties[0] || {});
      rows = allProperties.map((properties: Record<string, any>) =>
        Object.values(properties)
      );
    } else if (mapServiceVendor === MapServiceVendor.Geoserver) {
      const data = await getAllFeaturesGeoserver(
        mapServiceUrl,
        mapServiceLayerName
      );
      if (!data?.features?.length) return;
      const allProperties = data.features.map(
        (feature: { properties: any }) => feature.properties
      );
      header = Object.keys(allProperties[0] || {});
      rows = allProperties.map((properties: Record<string, any>) =>
        Object.values(properties)
      );
    }

    setFields(layerId, header);

    setTableData({
      headers: header,
      data: rows,
    });

    setIsLoading({ ...isLoading, layerTable: false });
  };

  const handleDraw = (drawMode: string) => {
    if (drawMode === "point") {
      drawRef.current?.changeMode("draw_point");
    } else if (drawMode === "line") {
      drawRef.current?.changeMode("draw_line_string");
    } else if (drawMode === "polygon") {
      drawRef.current?.changeMode("draw_polygon");
    } else if (drawMode === "single_delete") {
      const allFeatures = drawRef.current?.getAll().features;
      const lastFeature = allFeatures?.[allFeatures.length - 1];
      if (lastFeature) {
        drawRef.current?.delete(lastFeature.id as string);
      }
    } else if (drawMode === "find_my_location") {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lng = pos.coords.longitude;
          const lat = pos.coords.latitude;
          mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
        },
        (err) => alert("Lokasi tidak tersedia: " + err.message),
        { enableHighAccuracy: true }
      );
    } else if (drawMode === "clear") {
      drawRef.current?.deleteAll();
    } else {
      drawRef.current?.changeMode("simple_select");
    }
  };

  return (
    <div className="relative w-screen h-screen bg-gray-200">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <MapView
            mapRef={mapRef}
            onRotate={onRotate}
            onMouseMove={onMouseMove}
            onClick={(event) => handleMapClick(event as MapMouseEvent)}
            onTouchEnd={(event) => handleMapClick(event as MapTouchEvent)}
            onLoad={onMapLoad}
            onStyleData={onStyleData}
            onZoomEnd={onZoomEnd}
            handleDragOver={handleDragOver}
            handleDrop={(e) => handleDropEvent(e, mapRef, mousePosition, toast)}
            onContextMenu={handleContextMenu}
            onMoveStart={onMoveStart}
            onMoveEnd={onMoveEnd}
          />
        </ContextMenuTrigger>
        {menuPosition && (
          <ContextMenuContent
            className="absolute text-xs"
            style={{ top: menuPosition.y, left: menuPosition.x }}
          >
            <ContextMenuItem
              className="text-xs"
              onClick={() => {
                handleCopyCoordinates();
              }}
            >
              Copy Coordinates
            </ContextMenuItem>
            <ContextMenuItem
              className="text-xs"
              onClick={() => {
                handleRouteOrigin();
              }}
            >
              Route From Here
            </ContextMenuItem>
            <ContextMenuItem
              className="text-xs"
              onClick={() => {
                handleRouteDestination();
              }}
            >
              Route To Here
            </ContextMenuItem>
          </ContextMenuContent>
        )}
      </ContextMenu>
      {showLoading && (
        <div
          className={`absolute top-0 h-screen w-screen flex justify-center items-center z-10 ${
            isLoading.initLoading ? "" : "opacity-0"
          } transition-all duration-500 z-20`}
        >
          <AnimatedLoadingScreen />
        </div>
      )}

      {/* LEFT SIDE */}
      <div className="absolute top-0 left-0 flex">
        <div
          className={`h-dvh bg-white transform transition-all duration-300 ease-in-out ${
            displayLayouts.aiChat
              ? "w-[30rem] overflow-hidden"
              : "w-[0rem] overflow-hidden"
          } z-10`}
        >
          <ChatWithAI onCommandReceived={handleMapboxCommand} commandProgress={aiCommandProgress} />
        </div>
        <div className="transition-transform duration-300 ease-in-out">
          <div className="absolute top-0 mt-20 ml-5 max-h-[calc(100vh-9rem)] overflow-y-auto">
            <div className="px-5 py-2 w-80 text-sm bg-white rounded dark:bg-background">
              <div className="flex sticky top-0 justify-between items-center py-2 bg-white dark:bg-background">
                <h5 className="font-bold text-md">Workspaces</h5>
                <div className="flex gap-3 items-center">
                  <TooltipProvider>
                    <div className="flex gap-2">
                      <IconTooltip
                        label="Logout"
                        icon={<BiLogOutCircle size="13pt" />}
                        onClick={() => signOut()}
                      />
                      <IconTooltip
                        label="AI Chat"
                        icon={<WiStars size="13pt" />}
                        onClick={() =>
                          setDisplayLayouts({
                            ...displayLayouts,
                            aiChat: !displayLayouts.aiChat,
                          })
                        }
                      />
                      <IconTooltip
                        label="Collapse All"
                        icon={<BiCollapse size="13pt" />}
                        onClick={collapseAll}
                      />
                      <IconTooltip
                        label="Node Workspaces"
                        icon={<AiOutlineSisternode size="13pt" />}
                        onClick={() =>
                          setDisplayLayouts({
                            ...displayLayouts,
                            node_workspace: true,
                          })
                        }
                      />
                      <IconTooltip
                        label="Add Layer"
                        icon={<PlusIcon size="13pt" />}
                        onClick={() =>
                          setDisplayLayouts({
                            ...displayLayouts,
                            addLayer: true,
                          })
                        }
                      />
                    </div>
                  </TooltipProvider>
                </div>
              </div>
              {layers.length === 0 && (
                <div className="flex flex-col justify-center items-center h-32">
                  <LayersIcon className="mb-1" size={"20pt"} />
                  <p className="font-semibold">
                    You havent added any layers yet.
                  </p>
                  <p className="text-xs">Start adding layers to your map.</p>
                </div>
              )}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={layers.map((layer) => layer.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Accordion
                    type="multiple"
                    value={openItems}
                    onValueChange={(values) => setOpenItems(values)}
                  >
                    {layers.map((layer, index) => (
                      <SortableItem key={layer.id} id={layer.id}>
                        <AccordionItem className="border-none" value={layer.id}>
                          <div className="flex gap-2 items-center">
                            <IconLayerType size="13pt" layer={layer} />
                            <AccordionTrigger className="py-2 w-64 text-sm capitalize hover:no-underline">
                              <input
                                value={layer.name}
                                onChange={(e) =>
                                  handleChangeLayerName(e, index)
                                }
                                className="font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                              />
                            </AccordionTrigger>
                          </div>
                          <AccordionContent className="text-xs border-none">
                            <div className="flex gap-1 justify-center px-1">
                              <Button
                                variant={"ghost"}
                                size="sm"
                                onClick={() =>
                                  setLayerVisible(index, layer.visible)
                                }
                              >
                                {layer.visible ? (
                                  <Eye size={"12pt"} />
                                ) : (
                                  <EyeClosed size={"12pt"} />
                                )}
                              </Button>
                              <Button
                                variant={"ghost"}
                                size="sm"
                                onClick={() => {
                                  handleConvertToVector(layer);
                                }}
                              >
                                <HiCubeTransparent size={"12pt"} />
                              </Button>
                              <Button
                                variant={"ghost"}
                                size="sm"
                                onClick={() => handleZoomToLayer(index)}
                              >
                                <ScanSearch size={"12pt"} />
                              </Button>
                              <Button
                                variant={"ghost"}
                                size="sm"
                                onClick={() => handleTableMapbox(index)}
                              >
                                <FiFilter size={"12pt"} />
                              </Button>
                              <Button
                                variant={"ghost"}
                                size="sm"
                                onClick={() => handleStyleLayer(index)}
                              >
                                <MdOutlineStyle size={"12pt"} />
                              </Button>
                              <Button
                                variant={"ghost"}
                                size="sm"
                                className="text-red-700"
                                onClick={() => handleRemoveLayer(index)}
                              >
                                <BiTrash size={"12pt"} />
                              </Button>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </SortableItem>
                    ))}
                  </Accordion>
                </SortableContext>
              </DndContext>
            </div>
          </div>
          <div className="absolute top-0 mt-5 ml-5" id="search">
            <Search onSearch={handleSearch} />
          </div>
          <div className="absolute top-0 mt-5 ml-[22rem] font-bold">
            <MapMenu onSave={handleOnSave} onExit={handleOnExit}></MapMenu>
            <div className="absolute mt-2">
              <BookmarkDropdown
                bookmarks={bookmarks}
                selectedBookmark={selectedBookmark}
                onAddBookmark={handleAddBookmark}
                onDeleteBookmark={handleDeleteBookmark}
                onEditBookmark={handleEditBookmark}
                onSelectBookmark={handleSelectBookmark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="absolute top-0 right-0 p-5 text-xs min-w-96 max-w-[600px] max-h-[90vh]">
        {displayLayouts.layerInfo && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm mb-2">
                    Layer Information
                  </CardTitle>
                  <CardDescription className="text-xs text-foreground">
                    {currentMapClick ? (
                      <>
                        Long: {currentMapClick.lng.toFixed(9)}, Lat:{" "}
                        {currentMapClick.lat.toFixed(9)}
                      </>
                    ) : (
                      "Click on a layer to view its information."
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant={"link"}
                  size={"sm"}
                  onClick={() =>
                    setDisplayLayouts({ ...displayLayouts, layerInfo: false })
                  }
                >
                  <IoClose size={"13pt"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="">
              <FeatureInfo infoFeatures={infoFeatures} isLoading={isLoading} />
            </CardContent>
          </Card>
        )}
        {displayLayouts.style && (
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="relative flex justify-between items-center">
                <div className="absolute -top-10 -left-10 opacity-55">
                  <IconLayerType size={"50pt"} layer={selectedLayer} />
                </div>
                <div>
                  <CardTitle className="text-sm mb-2">
                    Style {selectedLayer?.name || "Layer"}
                  </CardTitle>
                  <CardDescription className="text-xs text-foreground">
                    {selectedLayer?.name || "Select a layer to style"}
                  </CardDescription>
                </div>
                <Button
                  variant={"link"}
                  size={"sm"}
                  onClick={() => {
                    setSelectedLayer(null);
                    setDisplayLayouts({ style: false });
                  }}
                >
                  <IoClose size={"13pt"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[70vh]">
              <StylePanel handleEditFeatures={handleEditFeatures} />
            </CardContent>
          </Card>
        )}
        {displayLayouts.routes && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm mb-2">Routes</CardTitle>
                  <CardDescription className="text-xs text-foreground">
                    {currentMapClick ? (
                      <>
                        From: <br />
                        {routeCoordinates?.origin?.join(",") || "N/A"}, <br />
                        To: <br />
                        {routeCoordinates?.destination?.join(",") || "N/A"}
                      </>
                    ) : (
                      "No Route Information."
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant={"link"}
                  size={"sm"}
                  onClick={() => {
                    setRouteCoordinates(null);
                    setDisplayLayouts({ ...displayLayouts, routes: false });
                    removeRoutes();
                  }}
                >
                  <IoClose size={"13pt"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[70vh]">
              <table className="w-full">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Route Name</td>
                    <td className="text-end">
                      {activeRoutes?.properties?.routeName}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Toll</td>
                    <td className="text-end">
                      {activeRoutes?.properties?.isToll ? "True" : "False"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Origin</td>
                    <td className="text-end">
                      <div>
                        <p>{activeRoutes?.origin?.[0]?.toFixed(7)}</p>
                        <p>{activeRoutes?.origin?.[1]?.toFixed(7)}</p>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Destination</td>
                    <td className="text-end">
                      <div>
                        <p>{activeRoutes?.destination?.[0]?.toFixed(7)}</p>
                        <p>{activeRoutes?.destination?.[1]?.toFixed(7)}</p>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Distance</td>
                    <td className="text-end">
                      {activeRoutes?.properties?.totalLength
                        ? activeRoutes.properties.totalLength >= 1000
                          ? `${(
                              activeRoutes.properties.totalLength / 1000
                            ).toFixed(2)} km`
                          : `${activeRoutes.properties.totalLength.toFixed(
                              0
                            )} m`
                        : "-"}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 font-semibold">Duration</td>
                    <td className="text-end">
                      {activeRoutes?.properties?.totalSeconds
                        ? activeRoutes.properties.totalSeconds >= 3600
                          ? `${Math.floor(
                              activeRoutes.properties.totalSeconds / 3600
                            )}h ${Math.floor(
                              (activeRoutes.properties.totalSeconds % 3600) / 60
                            )}m`
                          : `${Math.floor(
                              activeRoutes.properties.totalSeconds / 60
                            )} minutes `
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
        {displayLayouts.tools && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-sm mb-2">Tools</CardTitle>
                  <CardDescription className="text-xs text-foreground">
                    Select Tools
                  </CardDescription>
                </div>
                <Button
                  variant={"link"}
                  size={"sm"}
                  onClick={() => {
                    setDisplayLayouts({ tools: false });
                  }}
                >
                  <IoClose size={"13pt"} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-[70vh] h-[70vh]">
              <OperationComponents />
            </CardContent>
          </Card>
        )}
      </div>
      {/* <div className="absolute top-0 right-0 z-10 p-5 text-xs min-w-96">
        {displayLayouts.aiChat && (
          <div className="bg-white rounded-lg max-h-[calc(100vh-9rem)] overflow-y-auto dark:bg-background">
            <div
              id="header"
              className="flex sticky top-0 justify-between items-center px-5 pt-5 pb-3 bg-white dark:bg-background"
            >
              <div>
                <p className="mb-2 text-sm font-semibold">AI Helper</p>
              </div>
              <Button
                variant={"link"}
                onClick={() => {
                  setDisplayLayouts({ ...displayLayouts, aiChat: false });
                }}
              >
                <IoClose size={"13pt"} />
              </Button>
            </div>
            <div>
              <ChatWithAI onCommandReceived={handleMapboxCommand} />
            </div>
          </div>
        )}
      </div> */}

      {/* BOTTOM EL */}
      <div className="absolute bottom-0">
        <div className="relative w-screen">
          <div className="absolute bottom-5 right-10 ml-28 z-[1]">
            <div className="p-2 text-xs text-center bg-white rounded-lg min-w-52 dark:bg-background">
              {mousePosition ? (
                <>
                  {mousePosition.lng.toFixed(9)}, {mousePosition.lat.toFixed(9)}
                </>
              ) : (
                "Coordinates not available"
              )}
            </div>
          </div>
          <div className="absolute bottom-14 right-10 ml-28 z-[1]">
            <div className="w-14 h-14 bg-white rounded-lg dark:bg-background">
              <Popover>
                <PopoverTrigger>
                  <div className="flex justify-center items-center p-1 h-full">
                    <Image
                      src={basemap[activeBasemap].thumbnail}
                      width={100}
                      height={100}
                      className="rounded"
                      alt={basemap[activeBasemap].name}
                    />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="p-2 w-fit">
                  <div className="flex gap-2 justify-center items-center text-sm">
                    {basemap.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-1 w-14 h-14 rounded-lg border"
                        onClick={() => handleChangeBasemap(index)}
                      >
                        <Image
                          src={item.thumbnail}
                          width={100}
                          height={100}
                          alt={item.name}
                          className="rounded"
                        />
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1]">
            <div className="flex gap-1 justify-center items-center p-1 bg-white rounded-lg dark:bg-background">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant={"ghost"} size="sm">
                    <TbTriangleSquareCircle />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => handleDraw("point")}>
                      Point
                      <DropdownMenuShortcut>P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDraw("line")}>
                      Linestring
                      <DropdownMenuShortcut>L</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDraw("polygon")}>
                      Polygon
                      <DropdownMenuShortcut>G</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDraw("single_delete")}
                    >
                      Delete last feature
                      <DropdownMenuShortcut>Del</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDraw("clear")}>
                      Delete all
                      <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant={"ghost"} size="sm" onClick={() => handleNorth()}>
                <ArrowUp
                  style={{ transform: `rotate(${-compass.rotate}deg)` }}
                />
              </Button>
              <Button
                variant={"ghost"}
                size="sm"
                onClick={() => handleZoomOut()}
              >
                <MinusIcon />
              </Button>
              <label htmlFor="" className="w-5 text-xs text-center">
                {zoom}
              </label>
              <Button
                variant={"ghost"}
                size="sm"
                onClick={() => handleZoomIn()}
              >
                <PlusIcon />
              </Button>
              {/* <Button variant={"ghost"} size="sm" onClick={() => handleMaxLayersBbox()}><Fullscreen /></Button> */}
              <Button
                variant={"ghost"}
                size="sm"
                onClick={() => handleMaxLayersBbox()}
              >
                <Fullscreen />
              </Button>
              <Button
                variant={"ghost"}
                size="sm"
                onClick={() => handleDraw("find_my_location")}
              >
                <MdGpsFixed />
              </Button>
              {!isDrawDone && (
                <Button
                  variant={"ghost"}
                  size="sm"
                  onClick={() => saveFeaturesToLayer()}
                >
                  <SaveAll />
                </Button>
              )}
              {routeCoordinates?.destination && (
                <Button
                  variant={"ghost"}
                  size="sm"
                  onClick={() => handleRoutes()}
                >
                  <TbRouteSquare />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div
          className={`${displayLayouts.table ? "block" : "hidden"} w-screen`}
        >
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={100}>
              <div
                className={`relative p-5 w-full h-full bg-white rounded-lg dark:bg-background`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h5 className="mb-2 font-bold text-md">Table</h5>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => {
                      setDisplayLayouts({ ...displayLayouts, table: false });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="h-[50vh] w-full overflow-auto">
                  <DynamicTable
                    headers={tableData.headers}
                    data={tableData.data}
                    isLoading={isLoading.layerTable}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={0}>
              <div
                className={`relative p-5 w-full h-full bg-white rounded-lg dark:bg-background`}
              >
                <div className="flex justify-between items-center"></div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* MODAL EL */}
      {displayLayouts.legend && (
        <div className="absolute bottom-14 right-32 mb-5 ml-60">
          <div className="p-2 bg-white rounded-lg dark:bg-background">
            <div className="flex gap-5 justify-between items-center">
              <h5 className="font-bold text-md">
                Legend {selectedLayer?.name}
              </h5>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8"
                onClick={() => {
                  setDisplayLayouts({ legend: false });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              {selectedLayer?.map_service_vendor ==
                MapServiceVendor.Geoserver && (
                <>
                  <img
                    src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0x09090b;fontColor:0xffffff;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`}
                    className="hidden dark:block"
                    alt="Legend Dark"
                  />
                  <img
                    src={`${selectedLayer?.map_service_url}?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetLegendGraphic&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER=${selectedLayer?.map_service_layer_name}&LEGEND_OPTIONS=bgColor:0xffffff;fontColor:0x000000;fontAntiAliasing:true;dpi:200;layout:vertical;columnheigh:1000;countMatched:true;hideEmptyRules:false;fontStyle:bold`}
                    className="block dark:hidden"
                    alt="Legend Light"
                  />
                </>
              )}
              {selectedLayer?.map_service_vendor == MapServiceVendor.ArcGIS && (
                <LegendEsri
                  url={`${selectedLayer?.map_service_url}/legend?f=json`}
                />
              )}
              {selectedLayer?.map_service_vendor ==
                MapServiceVendor.GeoJSON && (
                <LegendMapbox selectedLayer={selectedLayer} mapRef={mapRef} />
              )}
            </div>
          </div>
        </div>
      )}
      {displayLayouts.node_workspace && (
        <div className="absolute top-0 left-0 z-10 p-5 w-screen h-screen rounded">
          <div className="p-5 w-full h-full bg-white dark:bg-background">
            <div className="flex absolute top-0 right-0">
              <Button
                variant={"ghost"}
                className="p-3 rounded-full"
                onClick={() => {
                  setDisplayLayouts({
                    ...displayLayouts,
                    node_workspace: false,
                  });
                }}
              >
                <X size={20} />
              </Button>
            </div>
            <FlowDiagramWithDraggableNodes />
          </div>
        </div>
      )}
      {displayLayouts.addLayer && (
        <div className="flex absolute top-1/2 left-1/2 z-10 justify-center items-center p-0 w-screen h-screen bg-opacity-50 backdrop-filter backdrop-blur-sm -translate-x-1/2 -translate-y-1/2 md:p-10 bg-slate-200">
          <AddLayerModal />
        </div>
      )}
    </div>
  );
}
