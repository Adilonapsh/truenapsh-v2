"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { Badge } from "../badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  tags?: string[];
  onClick?: () => void;
}

export default function ProjectCard({
  id = "",
  title = "Amazing Project",
  description = "This is a long description of the project that demonstrates how we handle overflow text in our card component. It might contain lots of details about the project.",
  imageUrl = "/assets/map.png",
  tags = [],
  onClick = () => console.log("Card clicked"),
}: ProjectCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const truncateText = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
  };

  const truncatedDescription = truncateText(description, 100);

  return (
    <a href={`/map/${id}`} className="w-full">
      <TooltipProvider>
        <Card
          className="w-full lg:max-w-md border bg-white dark:bg-gray-950 shadow-lg cursor-pointer group overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={onClick}
        >
          <CardHeader className="p-0 relative overflow-hidden aspect-video">
            <div className="absolute top-2 right-2 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger className="text-white hover:bg-white/10 rounded-full p-1">
                  <MoreHorizontal className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <motion.div
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full overflow-hidden"
            >
              <Image
                src={imageUrl || "/assets/map.png"}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              <div className="absolute inset-0 " />
            </motion.div>
            <div className="absolute top-2 left-2 right-12 flex justify-start items-start">
              <div className="flex flex-wrap gap-1">
                {tags?.map((tag, index) => (
                  <Badge
                    key={index}
                    className="bg-primary/80 text-primary-foreground backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-1">
            <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground">
                  {truncatedDescription}
                </p>
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
    </a>
  );
}
