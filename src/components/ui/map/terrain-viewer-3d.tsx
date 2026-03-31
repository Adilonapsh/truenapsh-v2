"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import mapboxgl from "mapbox-gl";
import { useMapStore } from "@/stores/map";
import useLayerStore from "@/stores/layer";
import { MapServiceVendor } from "@/types/map.types";
import { Button } from "../button";
import { Slider } from "../slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../select";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "../card";
import { X, RotateCcw, Loader2, Fullscreen, Minimize2, RotateCw } from "lucide-react";
import { IoClose } from "react-icons/io5";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// --- Helper Functions ---
function loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = rej;
        img.src = url;
    });
}

function getElevation(r: number, g: number, b: number): number {
    return -10000 + (r * 65536 + g * 256 + b) * 0.1;
}

function tileToBBox(x: number, y: number, z: number) {
    const worldSize = 40075016.68557849;
    const res = worldSize / Math.pow(2, z);
    const originX = -worldSize / 2;
    const originY = worldSize / 2;

    const minX = originX + x * res;
    const minY = originY - (y + 1) * res;
    const maxX = originX + (x + 1) * res;
    const maxY = originY - y * res;

    return [minX, minY, maxX, maxY]; // Web Mercator (EPSG:3857)
}

// --- 3D Terrain Mesh Component ---
interface TerrainMeshProps {
    heightData: Uint8ClampedArray | null;
    texture: THREE.Texture | null;
    slopeTexture: THREE.Texture | null;
    styleTexture: THREE.Texture | null;
    elevationScale: number;
    mode: "satellite" | "slope" | "style";
}

function TerrainMesh({
    heightData,
    texture,
    slopeTexture,
    styleTexture,
    elevationScale,
    mode,
}: TerrainMeshProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const fullSize = 512 * 3; // 3x3 tiles
    const res = 512;

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(5000, 5000, res - 1, res - 1);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    useEffect(() => {
        if (!heightData) return;

        const vertices = geometry.attributes.position.array as Float32Array;
        const step = fullSize / res;

        for (let i = 0; i < res; i++) {
            for (let j = 0; j < res; j++) {
                const px = Math.min(fullSize - 1, Math.floor(j * step));
                const py = Math.min(fullSize - 1, Math.floor(i * step));
                const idx = (py * fullSize + px) * 4;
                const h = getElevation(
                    heightData[idx],
                    heightData[idx + 1],
                    heightData[idx + 2]
                );
                vertices[(i * res + j) * 3 + 1] = h * elevationScale;
            }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
    }, [heightData, elevationScale, geometry]);

    const activeTexture = mode === "satellite" ? texture : mode === "slope" ? slopeTexture : styleTexture;

    if (!heightData || !activeTexture) return null;

    return (
        <mesh geometry={geometry}>
            <meshBasicMaterial map={activeTexture} side={THREE.DoubleSide} />
        </mesh>
    );
}

// --- Main TerrainViewer3D Component ---
export function TerrainViewer3D() {
    const { map, displayLayouts, setDisplayLayouts } = useMapStore();
    const { layers } = useLayerStore();
    const [loading, setLoading] = useState(false);
    const [elevationScale, setElevationScale] = useState(0.2);
    const [mode, setMode] = useState<"satellite" | "slope" | "style">("satellite");
    const [sourceZoom, setSourceZoom] = useState<number | null>(null);

    const [heightData, setHeightData] = useState<Uint8ClampedArray | null>(null);
    const [texture, setTexture] = useState<THREE.Texture | null>(null);
    const [slopeTexture, setSlopeTexture] = useState<THREE.Texture | null>(null);
    const [styleTexture, setStyleTexture] = useState<THREE.Texture | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);

    const boxLayerId = "terrain-3d-box";
    const hiddenMapContainerRef = useRef<HTMLDivElement>(null);
    const hiddenMapRef = useRef<mapboxgl.Map | null>(null);

    // Initialize hidden map once
    useEffect(() => {
        if (!hiddenMapContainerRef.current || hiddenMapRef.current) return;

        const hMap = new mapboxgl.Map({
            container: hiddenMapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v11",
            center: [0, 0],
            zoom: 1,
            interactive: false,
            preserveDrawingBuffer: true,
            accessToken: MAPBOX_TOKEN
        });

        hiddenMapRef.current = hMap;

        return () => {
            hMap.remove();
            hiddenMapRef.current = null;
        };
    }, []);

    const generateSlopeTexture = useCallback(
        (data: Uint8ClampedArray, size: number, hillshadeData?: Uint8ClampedArray) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext("2d");
            if (!ctx) return null;

            const imgData = ctx.createImageData(size, size);

            const getH = (px: number, py: number) => {
                px = Math.max(0, Math.min(size - 1, px));
                py = Math.max(0, Math.min(size - 1, py));
                const i = (py * size + px) * 4;
                return getElevation(data[i], data[i + 1], data[i + 2]);
            };

            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    const dzdx = (getH(x + 1, y) - getH(x - 1, y)) / 2;
                    const dzdy = (getH(x, y + 1) - getH(x, y - 1)) / 2;
                    const slope =
                        Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy)) * (180 / Math.PI);

                    const idx = (y * size + x) * 4;

                    let r, g, b;
                    // Discrete Slope classification (standard analysis)
                    if (slope < 2) { // 0-2 (Flat) - Green
                        r = 46; g = 125; b = 50;
                    } else if (slope < 5) { // 2-5 - Light Green
                        r = 139; g = 195; b = 74;
                    } else if (slope < 15) { // 5-15 - Yellow
                        r = 255; g = 235; b = 59;
                    } else if (slope < 25) { // 15-25 - Orange
                        r = 255; g = 152; b = 0;
                    } else if (slope < 40) { // 25-40 - Red
                        r = 211; g = 47; b = 47;
                    } else { // > 40 - Purple
                        r = 123; g = 31; b = 162;
                    }

                    // Apply hillshade multiplier if available
                    if (hillshadeData) {
                        const hRatio = (hillshadeData[idx] + hillshadeData[idx + 1] + hillshadeData[idx + 2]) / 600; // Brighten a bit
                        r = Math.min(255, r * hRatio);
                        g = Math.min(255, g * hRatio);
                        b = Math.min(255, b * hRatio);
                    }

                    imgData.data[idx] = r;
                    imgData.data[idx + 1] = g;
                    imgData.data[idx + 2] = b;
                    imgData.data[idx + 3] = 255;
                }
            }
            ctx.putImageData(imgData, 0, 0);
            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
        },
        []
    );

    const fetchTerrainData = useCallback(
        async (lng: number, lat: number, z: number) => {
            setLoading(true);
            setSourceZoom(z);

            // Mapbox Tile Calculation
            const n = Math.pow(2, z);
            const cx = Math.floor(((lng + 180) / 360) * n);
            const cy = Math.floor(
                ((1 -
                    Math.log(
                        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
                    ) /
                    Math.PI) /
                    2) *
                n
            );

            // Highlight Box on Map
            const mapbox = map.current?.getMap();
            if (mapbox) {
                const getTileBBox = (x: number, y: number, z: number) => {
                    const worldSize = 40075016.68557849;
                    const res = worldSize / Math.pow(2, z);
                    const originX = -worldSize / 2;
                    const originY = worldSize / 2;

                    const minX = originX + x * res;
                    const minY = originY - (y + 1) * res;
                    const maxX = originX + (x + 1) * res;
                    const maxY = originY - y * res;

                    // Convert to LngLat (Web Mercator inverse)
                    const toLng = (mx: number) => (mx * 180) / (worldSize / 2);
                    const toLat = (my: number) => (Math.atan(Math.exp((my * Math.PI) / (worldSize / 2))) * 360) / Math.PI - 90;

                    return [
                        [toLng(minX), toLat(minY)],
                        [toLng(maxX), toLat(maxY)]
                    ];
                };

                const tl = getTileBBox(cx - 1, cy - 1, z);
                const br = getTileBBox(cx + 1, cy + 1, z);
                const bounds = [tl[0][0], br[0][1], br[1][0], tl[1][1]] as [number, number, number, number];

                if (mapbox.getLayer(boxLayerId)) {
                    (mapbox.getSource(boxLayerId) as any).setData({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [bounds[0], bounds[1]],
                                [bounds[2], bounds[1]],
                                [bounds[2], bounds[3]],
                                [bounds[0], bounds[3]],
                                [bounds[0], bounds[1]]
                            ]]
                        }
                    });
                } else {
                    mapbox.addSource(boxLayerId, {
                        type: 'geojson',
                        data: {
                            type: 'Feature',
                            properties: {},
                            geometry: {
                                type: 'Polygon',
                                coordinates: [[
                                    [bounds[0], bounds[1]],
                                    [bounds[2], bounds[1]],
                                    [bounds[2], bounds[3]],
                                    [bounds[0], bounds[3]],
                                    [bounds[0], bounds[1]]
                                ]]
                            }
                        }
                    });
                    mapbox.addLayer({
                        id: boxLayerId,
                        type: 'line',
                        source: boxLayerId,
                        paint: {
                            'line-color': '#4facfe',
                            'line-width': 2
                        }
                    });
                }
            }

            const size = 512;
            const fullSize = size * 3;

            const hCanvas = document.createElement("canvas");
            hCanvas.width = hCanvas.height = fullSize;
            const hCtx = hCanvas.getContext("2d");

            const sCanvas = document.createElement("canvas");
            sCanvas.width = sCanvas.height = fullSize;
            const sCtx = sCanvas.getContext("2d");

            const hillCanvas = document.createElement("canvas");
            hillCanvas.width = hillCanvas.height = fullSize;
            const hillCtx = hillCanvas.getContext("2d");

            if (!hCtx || !sCtx || !hillCtx) return;

            // Initialize hillshade with neutral white in case tiles fail to load
            hillCtx.fillStyle = "white";
            hillCtx.fillRect(0, 0, fullSize, fullSize);

            const tiles = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push({ x: cx + dx, y: cy + dy, z: z });
                }
            }

            try {
                const promises = tiles.map(async (tile, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const tUrl = `https://api.mapbox.com/v4/mapbox.terrain-rgb/${tile.z}/${tile.x}/${tile.y}@2x.pngraw?access_token=${MAPBOX_TOKEN}`;
                    const sUrl = `https://api.mapbox.com/v4/mapbox.satellite/${tile.z}/${tile.x}/${tile.y}@2x.png?access_token=${MAPBOX_TOKEN}`;
                    const hillUrl = `https://api.mapbox.com/v4/mapbox.hillshade/${tile.z}/${tile.x}/${tile.y}@2x.png?access_token=${MAPBOX_TOKEN}`;

                    const [imgH, imgS] = await Promise.all([
                        loadImage(tUrl),
                        loadImage(sUrl)
                    ]);
                    hCtx.drawImage(imgH, col * size, row * size, size, size);
                    sCtx.drawImage(imgS, col * size, row * size, size, size);

                    try {
                        const imgHill = await loadImage(hillUrl);
                        hillCtx.drawImage(imgHill, col * size, row * size, size, size);
                    } catch (e) {
                        // If hillshade fails, we just don't draw it on the hill context
                        // The slope texture generation handles missing hillshadeData anyway
                    }
                });

                await Promise.all(promises);

                const hData = hCtx.getImageData(0, 0, fullSize, fullSize).data;
                const hillData = hillCtx.getImageData(0, 0, fullSize, fullSize).data;
                setHeightData(hData);

                const tex = new THREE.CanvasTexture(sCanvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                setTexture(tex);

                const sTex = generateSlopeTexture(hData, fullSize, hillData);
                setSlopeTexture(sTex);

                // --- 4. Capture Canvas from Hidden Map (True WYSIWYG) ---
                const hMap = hiddenMapRef.current;
                const mainMap = map.current?.getMap();

                if (hMap && mainMap) {
                    const style = mainMap.getStyle();
                    if (style) {
                        hMap.setStyle(style);
                    }

                    // Fit to our 3x3 tile bounds
                    const tl = tileToBBox(cx - 1, cy - 1, z);
                    const br = tileToBBox(cx + 1, cy + 1, z);

                    // Convert Web Mercator to LngLat for Mapbox
                    const toLng = (mx: number) => (mx * 180) / 20037508.34;
                    const toLat = (my: number) => (Math.atan(Math.exp((my * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;

                    const bounds: [number, number, number, number] = [toLng(tl[0]), toLat(br[1]), toLng(br[2]), toLat(tl[3])];

                    hMap.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
                        animate: false,
                        padding: 0
                    });

                    // Wait for it to settle
                    await new Promise<void>((resolve) => {
                        const onIdle = () => {
                            resolve();
                        };
                        hMap.once('idle', onIdle);
                        // Safety timeout
                        setTimeout(resolve, 3000);
                    });

                    const canvas = hMap.getCanvas();
                    // Copy to a persistent 2D canvas to avoid WebGL clearing issues
                    const copyCanvas = document.createElement("canvas");
                    copyCanvas.width = canvas.width;
                    copyCanvas.height = canvas.height;
                    const copyCtx = copyCanvas.getContext("2d");
                    if (copyCtx) {
                        copyCtx.drawImage(canvas, 0, 0);
                        const stex = new THREE.CanvasTexture(copyCanvas);
                        stex.colorSpace = THREE.SRGBColorSpace;
                        stex.needsUpdate = true;
                        setStyleTexture(stex);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch terrain tiles", err);
                setLoading(false);
                toast.error("Gagal mengambil data terrain");
            }
        },
        [map, generateSlopeTexture, layers]
    );

    const onMapClick = useCallback(
        (e: any) => {
            if (!displayLayouts.terrain3D) return;
            const { lng, lat } = e.lngLat;
            const z = Math.floor(map.current?.getMap()?.getZoom() || 14);
            fetchTerrainData(lng, lat, z);
        },
        [displayLayouts.terrain3D, fetchTerrainData, map]
    );

    useEffect(() => {
        const mb = map.current?.getMap();
        if (mb) {
            mb.on("click", onMapClick);
            return () => {
                mb.off("click", onMapClick);
                if (mb.getStyle()) {
                    if (mb.getLayer(boxLayerId)) mb.removeLayer(boxLayerId);
                    if (mb.getSource(boxLayerId)) mb.removeSource(boxLayerId);
                }
            };
        }
    }, [map, onMapClick]);

    if (!displayLayouts.terrain3D) return null;

    return (
        <>
            <div className={cn("w-full transition-all", isFullscreen && "fixed inset-0 z-[100] p-10 bg-black/60 backdrop-blur-md")}>
                <Card className={cn(
                    "bg-background dark:bg-background border-none shadow-none overflow-hidden",
                    isFullscreen && "w-full h-full max-w-[95vw] mx-auto shadow-2xl border flex flex-col"
                )}>
                    <CardHeader className="px-5 py-4 flex flex-row items-center justify-between border-b">
                        <div>
                            <CardTitle className="text-sm mb-2 font-bold">3D Terrain Viewer (360)</CardTitle>
                            <CardDescription className="text-xs text-foreground">
                                {heightData ? "Terrain loaded" : "Klik di peta untuk memuat terrain"}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8", autoRotate && "text-primary bg-primary/10")}
                                onClick={() => setAutoRotate(!autoRotate)}
                                title="Auto Rotate"
                            >
                                <RotateCw className={cn("h-4 w-4", autoRotate && "animate-spin-slow")} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setIsFullscreen(!isFullscreen)}
                            >
                                {isFullscreen ? <Minimize2 size={16} /> : <Fullscreen size={16} />}
                            </Button>
                            <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto"
                                onClick={() => setDisplayLayouts({ ...displayLayouts, terrain3D: false })}
                            >
                                <IoClose size="13pt" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className={cn("p-5 flex flex-col gap-4", isFullscreen && "flex-1 overflow-hidden lg:flex-row")}>
                        <div className={cn(
                            "relative aspect-square bg-black rounded-lg overflow-hidden border border-white/10 ring-1 ring-white/5 shadow-inner",
                            isFullscreen && "aspect-auto flex-1 h-full"
                        )}>
                            <Canvas>
                                <PerspectiveCamera makeDefault position={[4000, 3000, 4000]} far={100000} />
                                <OrbitControls enableDamping autoRotate={autoRotate} autoRotateSpeed={2.0} />
                                <TerrainMesh
                                    heightData={heightData}
                                    texture={texture}
                                    slopeTexture={slopeTexture}
                                    styleTexture={styleTexture}
                                    elevationScale={elevationScale}
                                    mode={mode}
                                />
                            </Canvas>

                            {loading && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 animate-in fade-in transition-all">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    <span className="text-xs font-medium text-primary">Memproses Terrain...</span>
                                </div>
                            )}

                            {!heightData && !loading && (
                                <div className="absolute inset-0 flex items-center justify-center text-center p-8 text-muted-foreground bg-secondary/20">
                                    <p className="text-sm font-medium">Pilih lokasi pada peta Mapbox untuk menampilkan terrain 3D di sini.</p>
                                </div>
                            )}
                        </div>

                        <div className={cn("space-y-4", isFullscreen && "w-80 shrink-0")}>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 mb-1">
                                    <label>Eksagerasi Vertikal</label>
                                    <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono leading-none">
                                        {elevationScale.toFixed(2)}x
                                    </span>
                                </div>
                                <Slider
                                    value={[elevationScale]}
                                    min={0.01}
                                    max={1.5}
                                    step={0.01}
                                    onValueChange={(val) => setElevationScale(val[0])}
                                    className="py-2"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">Mode Tampilan</label>
                                <Select value={mode} onValueChange={(val: any) => setMode(val)}>
                                    <SelectTrigger className="h-9 bg-muted/30 border-none shadow-none focus:ring-1 focus:ring-primary/20">
                                        <SelectValue placeholder="Pilih Mode" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="satellite" className="text-xs">Satelit (Asli)</SelectItem>
                                        <SelectItem value="slope" className="text-xs">Analisis Kelerengan</SelectItem>
                                        {/* <SelectItem value="style" className="text-xs">Sesuai Peta (Style)</SelectItem> */}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-2 border-t border-white/5 flex gap-2 items-center text-[10px] text-muted-foreground leading-tight">
                                <div className="flex-1">
                                    <p>Status: <span className="text-green-500 font-medium font-mono text-[9px]">UNLIT</span></p>
                                    <p>Data Zoom: <span className="text-foreground font-medium font-mono text-[9px]">{sourceZoom ?? "--"}</span></p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2 bg-muted/30 border-none hover:bg-muted/50 transition-colors"
                                    onClick={() => {
                                        setHeightData(null);
                                        setTexture(null);
                                        setSlopeTexture(null);
                                        setSourceZoom(null);
                                    }}
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            {/* Hidden map container for canvas capture */}
            <div
                ref={hiddenMapContainerRef}
                style={{
                    position: 'fixed',
                    left: '0',
                    top: '0',
                    width: '1024px',
                    height: '1024px',
                    pointerEvents: 'none',
                    zIndex: -100,
                    opacity: 0.001
                }}
            />
        </>
    );
}
