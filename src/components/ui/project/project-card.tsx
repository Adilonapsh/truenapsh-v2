import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProjectCardProps {
    name: string
    description: string
    status?: "active" | "completed" | "on-hold"
    created_at?: string
}

export function ProjectCard({ name, description, status, created_at }: ProjectCardProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{name}</CardTitle>
                    {/* <Badge
                        variant={status === "active" ? "default" : status === "completed" ? "secondary" : "destructive"}
                    >
                        {status}
                    </Badge> */}
                    <Badge variant={"default"}>
                        {created_at}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <CardDescription>{description}</CardDescription>
            </CardContent>
        </Card>
    )
}

