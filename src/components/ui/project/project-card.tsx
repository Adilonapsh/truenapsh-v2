"use client"

import { useState } from "react"
import Image from "next/image"
import { MoreHorizontal, Pencil, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProjectCardProps {
    title: string
    description: string
    imageUrl: string
    onClick?: () => void
}

export default function ProjectCard({
    title = "Amazing Project",
    description = "This is a long description of the project that demonstrates how we handle overflow text in our card component. It might contain lots of details about the project.",
    imageUrl = "/assets/placeholder.svg",
    onClick = () => console.log("Card clicked"),
}: ProjectCardProps) {
    const [isHovered, setIsHovered] = useState(false)

    const truncateText = (text: string, limit: number) => {
        if (text.length <= limit) return text
        return text.slice(0, limit) + "..."
    }

    const truncatedDescription = truncateText(description, 100)

    return (
        <TooltipProvider>
            <Card
                className="w-full max-w-md border bg-white dark:bg-gray-950 shadow-lg border-0 cursor-pointer group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
            >
                <CardHeader className="p-0 relative overflow-hidden aspect-video">
                    <motion.div
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full"
                    >
                        <Image
                            src={imageUrl || "/assets/placeholder.svg"}
                            alt={title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </motion.div>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                    <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground">{truncatedDescription}</p>
                        </TooltipTrigger>
                        {description.length > 100 && (
                            <TooltipContent>
                                <p className="max-w-xs">{description}</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </CardContent>
            </Card>
        </TooltipProvider>
    )
}

