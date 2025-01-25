"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Plus, Settings, Trash2, Edit2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Bookmark {
  id: string
  name: string
}

export default function BookmarkDropdown() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newBookmarkName, setNewBookmarkName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const editInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

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
      const newBookmark: Bookmark = {
        id: Math.random().toString(36).substr(2, 9),
        name: newBookmarkName.trim(),
      }
      setBookmarks([...bookmarks, newBookmark])
      setNewBookmarkName("")
      setIsDialogOpen(false)
    }
  }

  const handleDeleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((bookmark) => bookmark.id !== id))
  }

  const handleEditBookmark = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveEdit = (id: string) => {
    setBookmarks(
      bookmarks.map((bookmark) => (bookmark.id === id ? { ...bookmark, name: editingName.trim() } : bookmark)),
    )
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  return (
    <div className="p-4">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Add New Bookmark</DialogTitle>
            <div id="dialog-description" className="text-sm text-muted-foreground">
              Enter a name for your new bookmark.
            </div>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bookmark-name">Bookmark name</Label>
              <Input
                id="bookmark-name"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                placeholder="Enter bookmark name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBookmark}>Add Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[200px] justify-between">
            Bookmarks
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[200px]" ref={dropdownRef}>
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-medium">Bookmarks</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.preventDefault()
                  setIsDialogOpen(true)
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
          {bookmarks.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-muted-foreground">No bookmarks yet</div>
          ) : (
            bookmarks.map((bookmark) => (
              <DropdownMenuItem
                key={bookmark.id}
                className="justify-between px-2 py-1.5"
                onSelect={(e) => e.preventDefault()}
              >
                {editingId === bookmark.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSaveEdit(bookmark.id)
                    }}
                    className="flex items-center justify-between w-full"
                  >
                    <Input
                      ref={editInputRef}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-6 py-1 px-1"
                    />
                    <div className="flex gap-1">
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="truncate">{bookmark.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.preventDefault()
                          handleEditBookmark(bookmark.id, bookmark.name)
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
                          handleDeleteBookmark(bookmark.id)
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

