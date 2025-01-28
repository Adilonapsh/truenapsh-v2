'use client'

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import ProjectCard from '@/components/ui/project/project-card';
import { get } from '@/server/project';
import { Project } from '@/types/project.types';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';


export default function DashboardPage() {
    const [loadingProject, setLoadingProject] = useState(true);

    const [projects, setProjects] = useState<Project[]>([]);
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await get();
                setProjects(data);
            } catch (err) {
                console.log(err);
            }
            setLoadingProject(false)
        };
        fetchProjects();
    }, [projects]);

    return (
        <div>
            <div className='grid grid-cols-1 lg:grid-cols-4 gap-2'>
                <div className='flex'>
                    <Card className="w-full max-w-md bg-white dark:bg-gray-950 shadow-lg border-0">
                        <CardHeader className="space-y-1 pb-8">
                            <CardTitle className="text-2xl font-semibold tracking-tight">Create Project</CardTitle>
                            <p className="text-sm text-muted-foreground">Start a new project from scratch or import an existing one</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-500">
                                    <div className="p-2 rounded-full bg-primary-600">
                                        <Plus className="h-5 w-5 text-primary-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium">New Project</h3>
                                        <p className="text-xs text-muted-foreground">Create a new project with custom configurations</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-medium" size="lg">
                                New project
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                {loadingProject ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <Card className="w-full max-w-md border bg-gray-100 dark:bg-gray-900 shadow-lg border-0">
                                <CardHeader className="p-0 relative overflow-hidden aspect-video bg-gray-200 dark:bg-gray-700" />
                                <CardContent className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    ))
                ) : (
                    projects?.map((project: Project, i: number) => (
                        <a href={`/map/${project.id}`} key={i}>
                            <ProjectCard title={project.name} description={project.description} imageUrl={project.thumbnail ?? ""} />
                        </a>
                    ))
                )}
            </div>
        </div>
    )
}