"use client";

import React, { useState, Suspense, useRef, Component, ErrorInfo } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Stage,
    useGLTF,
    Environment,
    Center,
    Text,
    Line,
    Html
} from "@react-three/drei";
import { useMapStore } from "@/stores/map";
import { Button } from "../button";
import {
    RotateCw,
    Upload,
    Box,
    Grid3X3,
    Sun,
    Moon,
    AlertTriangle,
    Ruler,
    MapPin
} from "lucide-react";
import * as THREE from "three";
import { IoClose } from "react-icons/io5";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import useLayerStore from "@/stores/layer";
import { MapServiceVendor } from "@/types/map.types";
import { v4 } from 'uuid';

// --- Error Boundary ---
interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback: (error: Error) => React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("3D Model Error caught by boundary:", error, errorInfo);
        toast.error("Gagal memuat model 3D.");
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback(this.state.error!);
        }
        return this.props.children;
    }
}

// --- Model Component ---
function Model({ url, onClick, onPointerMove, onPointerOut }: {
    url: string;
    onClick?: (e: any) => void;
    onPointerMove?: (e: any) => void;
    onPointerOut?: (e: any) => void;
}) {
    const { scene } = useGLTF(url);
    return (
        <Center top onClick={onClick} onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
            <primitive object={scene} />
        </Center>
    );
}

// --- Loading Component ---
function ModelLoader() {
    return (
        <Center>
            <Text
                fontSize={50}
                color="#4facfe"
                anchorX="center"
                anchorY="middle"
            >
                Loading Model...
            </Text>
        </Center>
    );
}

// --- Main Component ---
export function ModelViewer3D() {
    const { displayLayouts, setDisplayLayouts, activeModelUrl, setActiveModelUrl, map } = useMapStore();
    const { addLayer } = useLayerStore();
    const [autoRotate, setAutoRotate] = useState(false);
    const [showGrid, setShowGrid] = useState(true);
    const [theme, setTheme] = useState<"light" | "dark" | "transparent">("dark");
    const [modelKey, setModelKey] = useState(0); // Key to force re-mount on error reset
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLoadToMap = async () => {
        if (!activeModelUrl) return;

        const mapInstance = map.current?.getMap();
        const center = mapInstance?.getCenter() || { lng: 0, lat: 0 };
        const capturedUrl = activeModelUrl;
        const lastFile = (fileInputRef as any).current?._lastFile;

        // Force unmount the viewer FIRST to free WebGL context
        setDisplayLayouts({ modelViewer3D: false });

        // Wait for unmount to complete before adding to map
        setTimeout(async () => {
            let finalData: any = capturedUrl;

            // If it's a local file, convert to ArrayBuffer to fix loader issues
            if (lastFile instanceof File) {
                try {
                    finalData = await lastFile.arrayBuffer();
                } catch (err) {
                    console.error("Failed to convert file to buffer", err);
                }
            }

            const fileName = lastFile?.name || (capturedUrl.startsWith('blob:')
                ? "3D Model"
                : capturedUrl.split('/').pop()?.split('#')[0] || "3D Model");

            addLayer({
                id: `model-${v4()}`,
                name: fileName,
                map_service_url: finalData, // Can be string URL or ArrayBuffer
                map_service_layer_name: fileName,
                map_service_vendor: MapServiceVendor.Model,
                type: "3d",
                visible: true,
                render_type: "model",
                metadata: {
                    location: {
                        lng: center.lng,
                        lat: center.lat
                    },
                    model_scale: [100, 100, 100], // Default scale up for world coordinates
                    model_rotation: [-90, 0, 0], // Common rotation fix for GLB (Y-up to Z-up)
                    model_opacity: 1
                }
            });

            toast.success("Model ditambahkan ke peta di posisi tengah layar.");
        }, 150);
    };

    // Measurement State
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
    const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null);

    const toggleMeasurement = () => {
        setIsMeasuring(!isMeasuring);
        setMeasurePoints([]);
        if (!isMeasuring) {
            toast("Mode Pengukuran Aktif. Klik 2 titik pada model.", { icon: '📏' });
        } else {
            toast("Mode Pengukuran Non-aktif.");
        }
    };

    const handleModelClick = (e: any) => {
        if (!isMeasuring) return;
        e.stopPropagation();

        const point = e.point;
        setMeasurePoints(prev => {
            if (prev.length >= 2) {
                // Reset and start new
                return [point];
            }
            return [...prev, point];
        });
    };

    const handleModelPointerMove = (e: any) => {
        if (!isMeasuring) {
            if (hoverPoint) setHoverPoint(null);
            return;
        }
        e.stopPropagation();
        setHoverPoint(e.point);
    };

    const handleModelPointerOut = (e: any) => {
        if (isMeasuring) setHoverPoint(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'glb' && ext !== 'gltf') {
            toast.error("Format file tidak didukung. Gunakan .glb atau .gltf");
            return;
        }

        // Keep original file for loading to map
        (fileInputRef as any).current._lastFile = file;

        // Add hint for loaders.gl if using blob
        const url = URL.createObjectURL(file) + `#.${ext}`;

        // Reset state for new model
        setActiveModelUrl(url);
        setModelKey(prev => prev + 1); // Force re-render to clear error boundary

        if (ext === 'gltf') {
            toast((t: any) => (
                <div className="flex flex-col gap-1">
                    <span className="font-bold text-yellow-500 flex items-center gap-2">
                        <AlertTriangle size={16} /> Warning: .gltf Detected
                    </span>
                    <span className="text-sm">
                        File .gltf seringkali membutuhkan file eksternal (.bin, textures).
                        Jika model tidak muncul atau error, gunakan file <b>.glb</b>.
                    </span>
                </div>
            ), { duration: 6000 });
        }
    };

    if (!displayLayouts.modelViewer3D) return null;

    const bgColor = theme === "light" ? "#f4f4f5" : theme === "dark" ? "#09090b" : "transparent";

    return (
        <div className="fixed inset-0 z-[110] w-screen h-screen">
            {/* Background */}
            <div
                className={cn("absolute inset-0 transition-colors duration-500",
                    theme === 'transparent' ? 'bg-black/40 backdrop-blur-sm' : ''
                )}
                style={{ backgroundColor: theme !== 'transparent' ? bgColor : undefined }}
            />

            {/* Canvas Area */}
            {activeModelUrl ? (
                <div className={`w-full h-full relative z-[1] ${isMeasuring ? 'cursor-crosshair' : 'cursor-default'}`}>
                    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 150], fov: 40 }}>
                        {/* Only clear color if not transparent to allow map to show through if desired */}
                        {theme !== 'transparent' && <color attach="background" args={[bgColor]} />}

                        <Suspense fallback={<ModelLoader />}>
                            <ErrorBoundary
                                key={modelKey}
                                fallback={(error) => (
                                    <Center>
                                        <Text
                                            fontSize={20}
                                            color="#ef4444"
                                            anchorX="center"
                                            anchorY="middle"
                                            maxWidth={300}
                                            textAlign="center"
                                        >
                                            Error Loading Model!
                                            {'\n'}
                                            Failed to load external resources.
                                            {'\n'}
                                            Please use a single .glb file.
                                        </Text>
                                    </Center>
                                )}
                            >
                                <Stage environment="city" intensity={0.5} shadows="contact">
                                    <Model
                                        url={activeModelUrl}
                                        onClick={handleModelClick}
                                        onPointerMove={handleModelPointerMove}
                                        onPointerOut={handleModelPointerOut}
                                    />
                                </Stage>
                            </ErrorBoundary>
                        </Suspense>

                        {/* Measurement Visuals */}
                        {isMeasuring && hoverPoint && (
                            <mesh position={hoverPoint}>
                                <sphereGeometry args={[0.02, 16, 16]} />
                                <meshBasicMaterial color="#fbbf24" depthTest={false} opacity={0.6} transparent />
                            </mesh>
                        )}

                        {measurePoints.map((point, index) => (
                            <mesh key={index} position={point}>
                                <sphereGeometry args={[0.03, 16, 16]} />
                                <meshBasicMaterial color="#ef4444" depthTest={false} />
                            </mesh>
                        ))}

                        {measurePoints.length === 2 && (
                            <>
                                <Line
                                    points={[measurePoints[0], measurePoints[1]]}
                                    color="#ef4444"
                                    lineWidth={2}
                                    depthTest={false}
                                />
                                <Html position={measurePoints[0].clone().lerp(measurePoints[1], 0.5)}>
                                    <div className="bg-black/75 text-white px-2 py-1 rounded text-xs font-mono whitespace-nowrap backdrop-blur-sm pointer-events-none select-none">
                                        {measurePoints[0].distanceTo(measurePoints[1]).toFixed(2)} units
                                    </div>
                                </Html>
                            </>
                        )}

                        <OrbitControls
                            makeDefault
                            autoRotate={autoRotate}
                            autoRotateSpeed={0.5}
                            enableDamping
                            enabled={!isMeasuring || measurePoints.length !== 1}
                        />
                        {showGrid && (
                            <gridHelper args={[100, 10, 0x4facfe, 0x222222]} position={[0, -0.01, 0]} />
                        )}
                        <Environment preset="city" />
                    </Canvas>
                </div>
            ) : (
                <div className="relative z-[1] w-full h-full flex flex-col items-center justify-center p-10 text-center pointer-events-none">
                    <div className="bg-zinc-950/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 pointer-events-auto">
                        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-8 ring-primary/5 animate-pulse mx-auto">
                            <Box size={40} className="text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2 text-white">No Model Active</h3>
                        <p className="text-zinc-400 max-w-md mb-8">
                            Upload a GLB or GLTF file to begin inspection.
                        </p>
                        <Button
                            size="lg"
                            className="px-8 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" /> Upload 3D File
                        </Button>
                    </div>
                </div>
            )}

            {/* Controls - Floating like Map Layout */}

            {/* Top Center - Title */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-[2]">
                <div className="px-4 py-2 bg-white rounded-lg dark:bg-background shadow-md border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                    <Box size={16} className="text-primary" />
                    <span className="text-sm font-bold">3D Studio</span>
                    {activeModelUrl && (
                        <>
                            <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {activeModelUrl.split('/').pop()?.substring(0, 20)}...
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Center - Main Controls */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[2]">
                <div className="flex gap-1 justify-center items-center p-1 bg-white rounded-lg dark:bg-background shadow-md border border-zinc-200 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload Model"
                    >
                        <Upload size={16} />
                    </Button>
                    <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLoadToMap}
                        className="text-primary hover:bg-primary/10"
                        title="Load to Map"
                    >
                        <MapPin size={16} />
                    </Button>
                    <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAutoRotate(!autoRotate)}
                        className={cn(autoRotate && "text-primary bg-primary/10")}
                        title="Auto Rotate"
                        disabled={isMeasuring}
                    >
                        <RotateCw size={16} className={cn(autoRotate && "animate-spin-slow")} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMeasurement}
                        className={cn(isMeasuring && "text-primary bg-primary/10")}
                        title="Measurement Tool"
                    >
                        <Ruler size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowGrid(!showGrid)}
                        className={cn(showGrid && "text-primary bg-primary/10")}
                        title="Toggle Grid"
                    >
                        <Grid3X3 size={16} />
                    </Button>
                    <div className="w-[1px] h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTheme(theme === "light" ? "dark" : theme === "dark" ? "transparent" : "light")}
                        title="Toggle Theme"
                        className="w-20"
                    >
                        {theme === "light" ? <div className="flex items-center gap-1"><Sun size={14} /> Light</div> :
                            theme === "dark" ? <div className="flex items-center gap-1"><Moon size={14} /> Dark</div> :
                                <div className="flex items-center gap-1"><Box size={14} /> Trans</div>}
                    </Button>
                </div>
            </div>

            {/* Top Right - Close */}
            <div className="absolute top-5 right-5 z-[2]">
                <div className="bg-white rounded-lg dark:bg-background shadow-md border border-zinc-200 dark:border-zinc-800">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisplayLayouts({ modelViewer3D: false })}
                        className="hover:text-red-500"
                    >
                        <IoClose size={20} />
                    </Button>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".glb,.gltf"
                onChange={handleFileUpload}
            />
        </div>
    );
}
