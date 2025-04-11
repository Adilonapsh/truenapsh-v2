"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Badge } from "../badge"

interface ProjectCardProps {
    title: string
    description?: string
    imageUrl: string
    tags?: string[]
    onClick?: () => void
}

export default function ProjectCard({
    title = "Amazing Project",
    description = "This is a long description of the project that demonstrates how we handle overflow text in our card component. It might contain lots of details about the project.",
    imageUrl = "/assets/map.png",
    tags = [],
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
                className="w-full lg:max-w-md border bg-white dark:bg-gray-950 shadow-lg cursor-pointer group"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={onClick}
            >
                <CardHeader className="p-0 relative overflow-hidden aspect-video">
                    <motion.div
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.3 }}
                        className="relative w-full h-full overflow-hidden"
                    >
                        <Image
                            src={imageUrl || "/assets/map.png"}
                            alt={title}
                            fill
                            className="object-cover overflow-hidden"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    </motion.div>
                    <div className="absolute top-0 left-0 flex flex-wrap gap-1 p-2">
                        {tags?.map((tag, index) => (
                            <Badge key={index} className="bg-primary text-primary-foreground">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-1">
                    <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <p className="text-xs text-muted-foreground">{truncatedDescription}</p>
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

