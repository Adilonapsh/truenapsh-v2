import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { ProjectCard } from '@/components/ui/project/project-card';
import { decrypt } from '@/lib/crypt';
import { get } from '@/server/project';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { CopyIcon, TrashIcon } from 'lucide-react';


export default async function DashboardPage() {

    const session = await getServerSession(authOptions);
    const status = session ? 'authenticated' : 'unauthenticated';


    if (status == "unauthenticated") {
        redirect("/auth/login");
    }

    const projects = await get()

    return (
        <div>
            <div className='h-14 bg-gray-400'>
                <div className='flex justify-between items-center'>

                </div>
            </div>
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-6">Recent Projects</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.data.map((project, i) => (
                        <div key={project.id}>
                            <ContextMenu>
                                <ContextMenuTrigger>
                                    <a href={`map/${project.id}`} key={i}>
                                        <ProjectCard
                                            key={project.id}
                                            name={project.name}
                                            description={project.description}
                                            status={project.status as "active" | "completed" | "on-hold"}
                                            created_at={new Date(project.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        />
                                    </a>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem>
                                        <CopyIcon className="w-4 h-4 mr-2 " />
                                        Duplicate
                                    </ContextMenuItem>
                                    <ContextMenuItem>
                                        <TrashIcon className="w-4 h-4 mr-2 text-red-500" />
                                        Delete
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        </div>

                    ))}
                </div>
            </div>
        </div>
    )
}