"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Database, ExternalLink, MoreVertical, Copy, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface Dataset {
    id: number
    name: string
    url: string
    description?: string
}

interface DatasetManagerProps {
    onSelectDataset: (dataset: Dataset) => void
    currentDatasetUrl?: string
}

const DEFAULT_DATASETS: Dataset[] = [
    {
        id: 1,
        name: "Bappeda Jabar",
        url: "https://arcgis.jabarprov.go.id/arcgis/rest/services/",
        description: "Badan Perencanaan Pembangunan Daerah Jawa Barat",
    },
    {
        id: 2,
        name: "DISDUKCAPIL KEMENDAGRI",
        url: "https://gis.dukcapil.kemendagri.go.id/arcgis/rest/services/",
        description: "Direktorat Jenderal Kependudukan dan Pencatatan Sipil",
    },
    {
        id: 3,
        name: "BIG",
        url: "https://geoservices.big.go.id/gis/rest/services/",
        description: "Badan Informasi Geospasial",
    },
    {
        id: 4,
        name: "BPS",
        url: "https://geoportal.bps.go.id/server/rest/services/",
        description: "Badan Pusat Statistik",
    },
    {
        id: 5,
        name: "BNPB",
        url: "https://gis.bnpb.go.id/server/rest/services/",
        description: "Badan Nasional Penanggulangan Bencana",
    },
    {
        id: 6,
        name: "MENLHK",
        url: "https://geoportal.menlhk.go.id/server/rest/services/",
        description: "Kementerian Lingkungan Hidup dan Kehutanan",
    },
    {
        id: 7,
        name: "BMKG",
        url: "https://gis.bmkg.go.id/arcgis/rest/services/",
        description: "Badan Meteorologi, Klimatologi, dan Geofisika",
    },
    {
        id: 8,
        name: "BAPPENAS",
        url: "https://geospasial.bappenas.go.id/server/rest/services/",
        description: "Kementerian Perencanaan Pembangunan Nasional",
    },
    {
        id: 9,
        name: "Tanggerang Kota",
        url: "https://maps.tangerangkota.go.id/arcgis/rest/services/",
        description: "Pemerintah Kota Tangerang",
    },
    {
        id: 10,
        name: "ESDM 1",
        url: "https://geoportal.esdm.go.id/gis1/rest/services/",
        description: "Kementerian Energi dan Sumber Daya Mineral 1",
    },
    {
        id: 11,
        name: "ESDM 3",
        url: "https://geoportal.esdm.go.id/gis3/rest/services/",
        description: "Kementerian Energi dan Sumber Daya Mineral 3",
    },
]

const STORAGE_KEY = "arcgis-explorer-datasets"

const DatasetManager: React.FC<DatasetManagerProps> = ({ onSelectDataset, currentDatasetUrl }) => {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [newDataset, setNewDataset] = useState<Partial<Dataset>>({ name: "", url: "" })
    const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null)
    const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)

    // Load datasets from localStorage on component mount
    useEffect(() => {
        const storedDatasets = localStorage.getItem(STORAGE_KEY)
        if (storedDatasets) {
            try {
                setDatasets(JSON.parse(storedDatasets))
            } catch (e) {
                console.error("Failed to parse stored datasets", e)
                setDatasets(DEFAULT_DATASETS)
            }
        } else {
            setDatasets(DEFAULT_DATASETS)
        }
    }, [])

    // Save datasets to localStorage when they change
    useEffect(() => {
        if (datasets.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets))
        }
    }, [datasets])

    // Handle adding a new dataset
    const handleAddDataset = () => {
        if (!newDataset.name || !newDataset.url) return

        const newId = Math.max(0, ...datasets.map((d) => d.id)) + 1
        const datasetToAdd: Dataset = {
            id: newId,
            name: newDataset.name,
            url: newDataset.url,
            description: newDataset.description,
        }

        setDatasets([...datasets, datasetToAdd])
        setNewDataset({ name: "", url: "", description: "" })
        setIsAddDialogOpen(false)
    }

    // Handle editing a dataset
    const handleEditDataset = () => {
        if (!selectedDataset || !selectedDataset.name || !selectedDataset.url) return

        const updatedDatasets = datasets.map((dataset) => (dataset.id === selectedDataset.id ? selectedDataset : dataset))

        setDatasets(updatedDatasets)
        setIsEditDialogOpen(false)
    }

    // Handle deleting a dataset
    const handleDeleteDataset = () => {
        if (!selectedDataset) return

        const updatedDatasets = datasets.filter((dataset) => dataset.id !== selectedDataset.id)
        setDatasets(updatedDatasets)
        setIsDeleteDialogOpen(false)
    }

    // Handle selecting a dataset
    const handleSelectDataset = (dataset: Dataset) => {
        onSelectDataset(dataset)
    }

    // Reset to default datasets
    const resetToDefaults = () => {
        setDatasets(DEFAULT_DATASETS)
    }

    // Copy URL to clipboard
    const copyUrlToClipboard = (url: string) => {
        navigator.clipboard
            .writeText(url)
            .then(() => {
                // Could add a toast notification here
                console.log("URL copied to clipboard")
            })
            .catch((err) => {
                console.error("Failed to copy URL", err)
            })
    }

    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Datasets</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Dataset
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={resetToDefaults}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset to Defaults
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="h-full rounded-md border">
                <ContextMenu>
                    <ContextMenuTrigger className="w-full">
                        <div className="p-1">
                            {datasets.map((dataset) => (
                                <div
                                    key={dataset.id}
                                    className={cn(
                                        "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted/50",
                                        currentDatasetUrl === dataset.url ? "bg-primary/10" : "",
                                    )}
                                    onClick={() => handleSelectDataset(dataset)}
                                    onContextMenu={(e) => {
                                        e.preventDefault()
                                        setSelectedDataset(dataset)
                                        setContextMenuPosition({ x: e.clientX, y: e.clientY })
                                    }}
                                >
                                    <div className="flex items-center">
                                        <Database className="h-4 w-4 mr-2 text-primary" />
                                        <div>
                                            <div className="font-medium">{dataset.name}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{dataset.url}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                copyUrlToClipboard(dataset.url)
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedDataset(dataset)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        window.open(dataset.url, "_blank")
                                                    }}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Open in Browser
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedDataset(dataset)
                                                        setIsDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ContextMenuTrigger>

                    <ContextMenuContent>
                        <ContextMenuItem onClick={() => handleSelectDataset(selectedDataset!)}>
                            <Database className="h-4 w-4 mr-2" />
                            Load Dataset
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => copyUrlToClipboard(selectedDataset?.url || "")}>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy URL
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => window.open(selectedDataset?.url || "", "_blank")}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Browser
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={() => setIsEditDialogOpen(true)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </ContextMenuItem>
                        <ContextMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </ContextMenuItem>
                    </ContextMenuContent>
                </ContextMenu>
            </ScrollArea>

            {/* Add Dataset Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Dataset</DialogTitle>
                        <DialogDescription>Add a new ArcGIS REST service endpoint.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={newDataset.name}
                                onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="url" className="text-right">
                                URL
                            </Label>
                            <Input
                                id="url"
                                value={newDataset.url}
                                onChange={(e) => setNewDataset({ ...newDataset, url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://example.com/arcgis/rest/services/"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="description"
                                value={newDataset.description || ""}
                                onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddDataset}>Add</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dataset Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Dataset</DialogTitle>
                        <DialogDescription>Modify the ArcGIS REST service endpoint.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="edit-name"
                                value={selectedDataset?.name || ""}
                                onChange={(e) => setSelectedDataset((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-url" className="text-right">
                                URL
                            </Label>
                            <Input
                                id="edit-url"
                                value={selectedDataset?.url || ""}
                                onChange={(e) => setSelectedDataset((prev) => (prev ? { ...prev, url: e.target.value } : null))}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-description" className="text-right">
                                Description
                            </Label>
                            <Input
                                id="edit-description"
                                value={selectedDataset?.description || ""}
                                onChange={(e) => setSelectedDataset((prev) => (prev ? { ...prev, description: e.target.value } : null))}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditDataset}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dataset Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Dataset</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this dataset? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="p-3 border rounded-md bg-muted/50">
                            <p className="font-medium">{selectedDataset?.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedDataset?.url}</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteDataset}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default DatasetManager
