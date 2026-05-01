"use client"

import React, { useState, useRef, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { useMapStore } from '@/stores/map'
import { 
    LuPrinter, LuDownload, LuX, LuType, LuLayoutGrid, LuImage, 
    LuGripVertical, LuCompass, LuLayers, LuPlus, LuTrash2, 
    LuSettings2, LuMousePointer2, LuMove, LuSquare, LuCopy, LuEye, LuEyeOff
} from 'react-icons/lu'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import toast from 'react-hot-toast'
import useLayerStore from '@/stores/layer'
import { v4 as uuidv4 } from 'uuid'

interface PrintComponent {
    id: string;
    type: 'title' | 'map' | 'legend' | 'north' | 'scale' | 'text' | 'shape';
    x: number;
    y: number;
    w: number;
    h: number;
    visible: boolean;
    zIndex: number;
    content?: string;
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
    padding?: number;
    opacity?: number;
}

const GRID_SIZE = 10;

export default function MapPrintModal() {
    const { map, displayLayouts, setDisplayLayouts } = useMapStore()
    const { layers } = useLayerStore()
    
    // Page Settings
    const [pageSize, setPageSize] = useState("a4")
    const [orientation, setOrientation] = useState("landscape")
    const [isExporting, setIsExporting] = useState(false)
    const [mapSnapshot, setMapSnapshot] = useState<string | null>(null)
    const [snapToGrid, setSnapToGrid] = useState(true)
    
    // Layout Components
    const [components, setComponents] = useState<PrintComponent[]>([
        { id: 'comp-map', type: 'map', x: 20, y: 20, w: 1080, h: 600, visible: true, zIndex: 1, borderColor: '#000000', borderWidth: 1, backgroundColor: '#f8fafc' },
        { id: 'comp-title', type: 'title', x: 20, y: 630, w: 700, h: 140, visible: true, zIndex: 2, fontSize: 24, fontWeight: 'bold', padding: 15, borderColor: '#e2e8f0', borderWidth: 1, backgroundColor: '#ffffff' },
        { id: 'comp-legend', type: 'legend', x: 730, y: 630, w: 370, h: 140, visible: true, zIndex: 3, padding: 15, borderColor: '#e2e8f0', borderWidth: 1, backgroundColor: '#ffffff' },
        { id: 'comp-north', type: 'north', x: 1040, y: 40, w: 40, h: 60, visible: true, zIndex: 4 },
        { id: 'comp-scale', type: 'scale', x: 40, y: 560, w: 120, h: 40, visible: true, zIndex: 5 },
    ])

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

    const previewRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLDivElement>(null)

    const isOpen = displayLayouts.printModal || false
    const selectedComp = components.find(c => c.id === selectedId)

    const handleClose = () => {
        setDisplayLayouts({ printModal: false })
        setMapSnapshot(null)
    }

    useEffect(() => {
        if (isOpen) {
            const captureInitialMap = async () => {
                const img = await captureMap()
                if (img) setMapSnapshot(img)
            }
            captureInitialMap()
        }
    }, [isOpen])

    const captureMap = async () => {
        const mapInstance = map?.current?.getMap()
        if (!mapInstance) return null
        return new Promise<string>((resolve) => {
            const getCanvasData = () => resolve(mapInstance.getCanvas().toDataURL('image/png', 1.0))
            if (mapInstance.loaded()) getCanvasData()
            else mapInstance.once('idle', getCanvasData)
            mapInstance.triggerRepaint()
        })
    }

    const handleExport = async (format: 'pdf' | 'png') => {
        if (!previewRef.current) return
        setIsExporting(true)
        const toastId = toast.loading(`Generating ${format.toUpperCase()}...`)
        const prevSelected = selectedId
        setSelectedId(null)

        try {
            const finalMapImage = await captureMap()
            if (finalMapImage) setMapSnapshot(finalMapImage)
            await new Promise(resolve => setTimeout(resolve, 800))
            
            const canvas = await html2canvas(previewRef.current, {
                useCORS: true, allowTaint: true, scale: 4, logging: false,
                backgroundColor: '#ffffff', imageTimeout: 0
            })

            if (format === 'png') {
                const link = document.createElement('a')
                link.download = `map-layout-${new Date().getTime()}.png`
                link.href = canvas.toDataURL('image/png')
                link.click()
            } else {
                const pdf = new jsPDF({ orientation: orientation as any, unit: 'mm', format: pageSize })
                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight)
                pdf.save(`map-layout-${new Date().getTime()}.pdf`)
            }
            toast.success(`Export successful!`, { id: toastId })
        } catch (error: any) {
            toast.error(`Export failed`, { id: toastId })
        } finally {
            setIsExporting(false)
            setSelectedId(prevSelected)
        }
    }

    const snap = (val: number) => snapToGrid ? Math.round(val / GRID_SIZE) * GRID_SIZE : val;

    const handleMouseDown = (e: React.MouseEvent, id: string, mode: 'move' | 'resize') => {
        if (isExporting) return
        e.stopPropagation()
        const component = components.find(c => c.id === id)
        if (!component) return
        setSelectedId(id)
        setDragMode(mode)
        const canvasRect = canvasRef.current!.getBoundingClientRect()
        setDragOffset({
            x: e.clientX - canvasRect.left - component.x,
            y: e.clientY - canvasRect.top - component.y
        })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!dragMode || !selectedId || !canvasRef.current) return
        const canvasRect = canvasRef.current.getBoundingClientRect()
        const currentX = e.clientX - canvasRect.left
        const currentY = e.clientY - canvasRect.top

        setComponents(prev => prev.map(c => {
            if (c.id !== selectedId) return c;
            return dragMode === 'move' 
                ? { ...c, x: snap(currentX - dragOffset.x), y: snap(currentY - dragOffset.y) }
                : { ...c, w: snap(Math.max(20, currentX - c.x)), h: snap(Math.max(20, currentY - c.y)) }
        }))
    }

    const handleMouseUp = () => {
        setDragMode(null)
    }

    const updateComp = (updates: Partial<PrintComponent>) => {
        if (!selectedId) return
        setComponents(prev => prev.map(c => c.id === selectedId ? { ...c, ...updates } : c))
    }

    const addItem = (type: PrintComponent['type']) => {
        const newComp: PrintComponent = {
            id: uuidv4(), type, x: 100, y: 100, w: 200, h: 80, visible: true, zIndex: components.length + 1,
            backgroundColor: '#ffffff', borderColor: '#000000', borderWidth: 1, padding: 10,
            content: type === 'text' ? 'New Label' : ''
        }
        if (type === 'text') newComp.fontSize = 14
        setComponents(prev => [...prev, newComp])
        setSelectedId(newComp.id)
    }

    const toggleVisibility = (id: string) => {
        setComponents(prev => prev.map(c => 
            c.id === id ? { ...c, visible: !c.visible } : c
        ))
    }

    const renderComponent = (comp: PrintComponent) => {
        if (!comp.visible) return null
        const isSel = selectedId === comp.id
        const style: React.CSSProperties = {
            position: 'absolute', left: comp.x, top: comp.y, width: comp.w, height: comp.h, zIndex: comp.zIndex,
            border: (isSel && !isExporting) ? '1px solid #3b82f6' : `${comp.borderWidth || 0}px solid ${comp.borderColor || 'transparent'}`,
            backgroundColor: comp.backgroundColor || 'transparent',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            opacity: comp.opacity ?? 1, borderRadius: `${comp.borderRadius || 0}px`,
            padding: `${comp.padding || 0}px`,
            boxShadow: (isSel && !isExporting) ? '0 0 0 1px #3b82f6, 0 4px 12px rgba(0,0,0,0.1)' : 'none'
        }

        return (
            <div key={comp.id} style={style} onMouseDown={(e) => handleMouseDown(e, comp.id, 'move')}>
                <div style={{ flex: 1, position: 'relative' }}>
                    {comp.type === 'map' && (
                        mapSnapshot ? <img src={mapSnapshot} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center"><AiOutlineLoading3Quarters className="animate-spin" /></div>
                    )}
                    {comp.type === 'title' && (
                        <div>
                            <h1 style={{ fontSize: `${comp.fontSize || 24}px`, fontWeight: comp.fontWeight || 'bold' }}>Map Title</h1>
                            <p style={{ color: '#64748b', fontSize: '12px' }}>Project Layout Export</p>
                        </div>
                    )}
                    {comp.type === 'text' && (
                        <textarea value={comp.content} onChange={e => updateComp({ content: e.target.value })} 
                            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: `${comp.fontSize}px`, outline: 'none', resize: 'none' }} />
                    )}
                    {comp.type === 'legend' && (
                        <div style={{ fontSize: '10px' }}>
                            <h4 style={{ fontWeight: 'bold', borderBottom: '1px solid #eee', marginBottom: '5px' }}>LEGEND</h4>
                            {layers.filter(l => l.visible).slice(0, 5).map(l => (
                                <div key={l.id} className="flex items-center gap-2 mb-1">
                                    <div style={{ width: '10px', height: '10px', background: '#cbd5e1' }} /> {l.name}
                                </div>
                            ))}
                        </div>
                    )}
                    {comp.type === 'north' && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="font-bold text-[12px]">N</div>
                            <div style={{ width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '15px solid black' }} />
                        </div>
                    )}
                    {comp.type === 'scale' && (
                        <div className="h-full flex flex-col justify-end">
                            <div style={{ borderBottom: '2px solid black', display: 'flex', justifyContent: 'space-between' }}>
                                <div className="h-2 border-l-2 border-black" /><div className="h-2 border-r-2 border-black" />
                            </div>
                            <span className="text-[10px] font-mono">Dynamic Scale</span>
                        </div>
                    )}
                </div>
                {isSel && !isExporting && (
                    <div onMouseDown={e => handleMouseDown(e, comp.id, 'resize')}
                        style={{ position: 'absolute', right: 0, bottom: 0, width: '10px', height: '10px', cursor: 'nwse-resize', background: '#3b82f6' }} />
                )}
            </div>
        )
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-none w-screen h-screen flex flex-col p-0 gap-0 rounded-none border-none overflow-hidden bg-[#f0f0f0] dark:bg-slate-950">
                <DialogHeader className="p-2 border-b bg-white dark:bg-slate-900 flex flex-row items-center justify-between space-y-0 h-12">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-sm font-bold flex items-center gap-2">
                            <LuPrinter className="h-4 w-4" /> Print Layout Editor
                        </DialogTitle>
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem('text')} title="Add Label"><LuType className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem('map')} title="Add Map"><LuImage className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem('legend')} title="Add Legend"><LuLayers className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem('north')} title="Add North Arrow"><LuCompass className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => addItem('scale')} title="Add Scale Bar"><LuLayoutGrid className="h-4 w-4" /></Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleExport('png')} className="h-8"><LuDownload className="mr-2 h-3 w-3" /> Export PNG</Button>
                        <Button size="sm" onClick={() => handleExport('pdf')} className="h-8"><LuPrinter className="mr-2 h-3 w-3" /> Export PDF</Button>
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8"><LuX className="h-4 w-4" /></Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Items List */}
                    <div className="w-64 border-r bg-white dark:bg-slate-900 flex flex-col">
                        <div className="p-3 border-b bg-muted/30 font-bold text-[10px] uppercase tracking-wider">Layout Items</div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {[...components].sort((a,b) => b.zIndex - a.zIndex).map(comp => (
                                <div key={comp.id} onClick={() => setSelectedId(comp.id)}
                                    className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer transition-colors ${selectedId === comp.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>
                                    <LuGripVertical className="h-3 w-3 opacity-30" />
                                    <span className="flex-1 truncate uppercase font-medium">{comp.type}</span>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); toggleVisibility(comp.id); }}>
                                        {comp.visible ? <LuEye className="h-3 w-3" /> : <LuEyeOff className="h-3 w-3" />}
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 border-t space-y-3">
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Page Setup</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={pageSize} onValueChange={setPageSize}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="a4">A4</SelectItem><SelectItem value="a3">A3</SelectItem></SelectContent></Select>
                                <Select value={orientation} onValueChange={setOrientation}><SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="landscape">Land.</SelectItem><SelectItem value="portrait">Port.</SelectItem></SelectContent></Select>
                            </div>
                        </div>
                    </div>

                    {/* Center: Canvas */}
                    <div className="flex-1 p-8 overflow-auto flex justify-center items-start scrollbar-hide"
                        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={() => setSelectedId(null)}>
                        <div ref={previewRef} className={`bg-white shadow-xl relative transition-all origin-top ${orientation === 'landscape' ? 'w-[1120px] h-[792px]' : 'w-[792px] h-[1120px]'}`}>
                            <div ref={canvasRef} className="w-full h-full relative" style={{ backgroundImage: 'radial-gradient(#ddd 0.5px, transparent 0.5px)', backgroundSize: '10px 10px' }}>
                                {components.map(renderComponent)}
                            </div>
                        </div>
                    </div>

                    {/* Right: Item Properties */}
                    <div className="w-72 border-l bg-white dark:bg-slate-900 overflow-y-auto">
                        <div className="p-3 border-b bg-muted/30 font-bold text-[10px] uppercase tracking-wider">Item Properties</div>
                        {selectedComp ? (
                            <div className="p-4 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-[11px] font-bold">Position & Size</Label>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                        <div className="space-y-1"><Label className="text-[9px]">X (px)</Label><Input type="number" value={selectedComp.x} onChange={e => updateComp({ x: parseInt(e.target.value) })} className="h-7 text-xs" /></div>
                                        <div className="space-y-1"><Label className="text-[9px]">Y (px)</Label><Input type="number" value={selectedComp.y} onChange={e => updateComp({ y: parseInt(e.target.value) })} className="h-7 text-xs" /></div>
                                        <div className="space-y-1"><Label className="text-[9px]">Width</Label><Input type="number" value={selectedComp.w} onChange={e => updateComp({ w: parseInt(e.target.value) })} className="h-7 text-xs" /></div>
                                        <div className="space-y-1"><Label className="text-[9px]">Height</Label><Input type="number" value={selectedComp.h} onChange={e => updateComp({ h: parseInt(e.target.value) })} className="h-7 text-xs" /></div>
                                    </div>
                                </div>

                                {selectedComp.type === 'text' && (
                                    <div className="space-y-3 pt-4 border-t">
                                        <Label className="text-[11px] font-bold">Text Style</Label>
                                        <div className="space-y-2">
                                            <Label className="text-[9px]">Font Size</Label>
                                            <Input type="number" value={selectedComp.fontSize} onChange={e => updateComp({ fontSize: parseInt(e.target.value) })} className="h-7 text-xs" />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-4 border-t">
                                    <Label className="text-[11px] font-bold">Appearance</Label>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between"><Label className="text-[9px]">Opacity</Label><span className="text-[9px]">{Math.round((selectedComp.opacity || 1) * 100)}%</span></div>
                                        <Input type="range" min="0" max="1" step="0.1" value={selectedComp.opacity || 1} onChange={e => updateComp({ opacity: parseFloat(e.target.value) })} className="h-4" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1"><Label className="text-[9px]">BG Color</Label><Input type="color" value={selectedComp.backgroundColor} onChange={e => updateComp({ backgroundColor: e.target.value })} className="h-7 p-1" /></div>
                                        <div className="space-y-1"><Label className="text-[9px]">Border Color</Label><Input type="color" value={selectedComp.borderColor} onChange={e => updateComp({ borderColor: e.target.value })} className="h-7 p-1" /></div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t">
                                    <Button variant="destructive" className="w-full h-8 text-xs gap-2" onClick={() => { setComponents(prev => prev.filter(c => c.id !== selectedId)); setSelectedId(null); }}>
                                        <LuTrash2 className="h-3 w-3" /> Remove Item
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-muted-foreground italic">Select an item on the canvas to edit its properties.</div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
