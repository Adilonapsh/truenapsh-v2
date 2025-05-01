"use client"

import { Check, ChevronDown, Edit2, Plus, Settings, Trash2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Bookmark } from "@/types/bookmark.types"

interface BookmarkDropdownProps {
    bookmarks: Bookmark[]
    selectedBookmark: Bookmark | null
    onAddBookmark: (name: string) => void
    onDeleteBookmark: (id: string) => void
    onEditBookmark: (id: string, newName: string) => void
    onSelectBookmark: (bookmark: Bookmark) => void
}

export default function BookmarkDropdown({
    bookmarks,
    selectedBookmark,
    onAddBookmark,
    onDeleteBookmark,
    onEditBookmark,
    onSelectBookmark,
}: BookmarkDropdownProps) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [newBookmarkName, setNewBookmarkName] = useState("")
    const [isAddingBookmark, setIsAddingBookmark] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    const editInputRef = useRef<HTMLInputElement>(null)
    const addInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus()
        }
    }, [editingId])

    useEffect(() => {
        if (isAddingBookmark && addInputRef.current) {
            addInputRef.current.focus()
        }
    }, [isAddingBookmark])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleAddBookmark = () => {
        if (newBookmarkName.trim()) {
            onAddBookmark(newBookmarkName.trim())
            setNewBookmarkName("")
            setIsAddingBookmark(false)
        }
    }

    const handleStartEditing = (id: string, currentName: string) => {
        setEditingId(id)
        setEditingName(currentName)
    }

    const handleSaveEdit = (id: string) => {
        if (editingName.trim()) {
            onEditBookmark(id, editingName.trim())
            setEditingId(null)
        }
    }

    const handleCancelEdit = () => {
        setEditingId(null)
    }

    const handleCancelAdd = () => {
        setIsAddingBookmark(false)
        setNewBookmarkName("")
    }

    const handleSelectBookmark = (bookmark: Bookmark) => {
        onSelectBookmark(bookmark)
        setIsDropdownOpen(false)
    }

    return (
        <div>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-[200px] justify-between">
                        {selectedBookmark ? selectedBookmark.name : "Bookmarks"}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px]" ref={dropdownRef}>
                    <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-sm font-medium">Bookmarks</span>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                    e.preventDefault()
                                    setIsAddingBookmark(true)
                                }}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Settings className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <DropdownMenuSeparator />

                    {isAddingBookmark && (
                        <div className="px-2 py-2">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    handleAddBookmark()
                                }}
                                className="flex items-center gap-2"
                            >
                                <Input
                                    ref={addInputRef}
                                    value={newBookmarkName}
                                    onChange={(e) => setNewBookmarkName(e.target.value)}
                                    placeholder="New bookmark name"
                                    className="h-8"
                                />
                                <div className="flex gap-1">
                                    <Button type="submit" variant="ghost" size="icon" className="h-8 w-8">
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleCancelAdd()
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                            <DropdownMenuSeparator className="my-2" />
                        </div>
                    )}

                    {bookmarks.length === 0 && !isAddingBookmark ? (
                        <div className="px-2 py-4 text-center text-sm text-muted-foreground">No bookmarks yet</div>
                    ) : (
                        bookmarks.map((bookmark) => (
                            <DropdownMenuItem
                                key={bookmark.id}
                                className={`justify-between px-2 py-1.5 ${selectedBookmark?.id === bookmark.id ? "bg-muted" : ""}`}
                                onSelect={(e) => {
                                    if (editingId !== bookmark.id) {
                                        e.preventDefault()
                                        handleSelectBookmark(bookmark)
                                    } else {
                                        e.preventDefault()
                                    }
                                }}
                            >
                                {editingId === bookmark.id ? (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault()
                                            handleSaveEdit(bookmark.id)
                                        }}
                                        className="flex items-center justify-between w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Input
                                            ref={editInputRef}
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            className="h-6 py-1 px-1"
                                        />
                                        <div className="flex gap-1">
                                            <Button
                                                type="submit"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Check className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleCancelEdit()
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <span className="truncate cursor-pointer">{bookmark.name}</span>
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleStartEditing(bookmark.id, bookmark.name)
                                                }}
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    onDeleteBookmark(bookmark.id)
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
