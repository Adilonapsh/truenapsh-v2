'use client'

import React from 'react'

import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarRadioGroup,
    MenubarRadioItem,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from "@/components/ui/menubar"

function MapMenu(
    {
        children,
        onNewTab,
        onNewWindow,
        onSave,
        onShare,
        onExit,
    }:
        {
            children?: React.ReactNode
            onNewTab?: () => void
            onNewWindow?: () => void
            onSave?: () => void
            onShare?: () => void
            onExit?: () => void
        }
) {
    const handleOnNewTab = () => {
        window.open(window.location.href, '_blank');
    }

    const handleOnNewWindow = () => {
        window.open(window.location.href, '_self');
    }


    return (
        <div>
            <Menubar>
                <MenubarMenu>
                    <MenubarTrigger>File</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem onClick={onNewTab ?? handleOnNewTab}>
                            New Tab <MenubarShortcut>⌘T</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem onClick={onNewWindow ?? handleOnNewWindow}>
                            New Window <MenubarShortcut>⌘N</MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={onSave}>
                            Save <MenubarShortcut>⌘S</MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem onClick={onShare}>
                            Share
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarSub>
                            <MenubarSubTrigger>Print</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem>JPG</MenubarItem>
                                <MenubarItem>PDF</MenubarItem>
                                <MenubarItem>PNG</MenubarItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        <MenubarItem onClick={onExit}>
                            Exit
                        </MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>Edit</MenubarTrigger>
                    <MenubarContent>
                        <MenubarItem>
                            Undo <MenubarShortcut>⌘Z</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem>
                            Redo <MenubarShortcut>⇧⌘Z</MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarSub>
                            <MenubarSubTrigger>Find</MenubarSubTrigger>
                            <MenubarSubContent>
                                <MenubarItem>Search the web</MenubarItem>
                                <MenubarSeparator />
                                <MenubarItem>Find...</MenubarItem>
                                <MenubarItem>Find Next</MenubarItem>
                                <MenubarItem>Find Previous</MenubarItem>
                            </MenubarSubContent>
                        </MenubarSub>
                        <MenubarSeparator />
                        <MenubarItem>Cut</MenubarItem>
                        <MenubarItem>Copy</MenubarItem>
                        <MenubarItem>Paste</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                    <MenubarTrigger>View</MenubarTrigger>
                    <MenubarContent>
                        <MenubarCheckboxItem>Always Show Bookmarks Bar</MenubarCheckboxItem>
                        <MenubarCheckboxItem checked>
                            Always Show Full URLs
                        </MenubarCheckboxItem>
                        <MenubarSeparator />
                        <MenubarItem inset>
                            Reload <MenubarShortcut>⌘R</MenubarShortcut>
                        </MenubarItem>
                        <MenubarItem disabled inset>
                            Force Reload <MenubarShortcut>⇧⌘R</MenubarShortcut>
                        </MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem inset>Toggle Fullscreen</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem inset>Hide Sidebar</MenubarItem>
                    </MenubarContent>
                </MenubarMenu>
            </Menubar>
            {children}
        </div>
    )
}

export default MapMenu