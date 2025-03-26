'use client'

import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider, useTheme } from 'next-themes'
import * as Icons from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

// Type for the icon mapping
type IconName = keyof typeof Icons

// Types for the data structure
interface User {
    name: string
    email: string
    avatar: string
}

interface Team {
    name: string
    logo: string
    plan: string
}

interface NavItem {
    title: string
    url: string
    icon: string
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

interface Project {
    name: string
    url: string
    icon: string
}

interface LayoutData {
    user: User
    teams: Team[]
    navMain: NavItem[]
    projects: Project[]
}

interface LayoutClientProps {
    children: React.ReactNode
    data: LayoutData
}

// Helper function to get icon component
const getIcon = (iconName: string) => {
    // Convert kebab-case to PascalCase
    const pascalCase = iconName.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')

    return Icons[pascalCase as IconName] || Icons.HelpCircle
}

export function LayoutClient({ children, data }: LayoutClientProps) {
    // Transform the data to include icon components
    const transformedData = {
        ...data,
        teams: data.teams.map(team => ({
            ...team,
            logo: getIcon(team.logo),
        })),
        navMain: data.navMain.map(item => ({
            ...item,
            icon: getIcon(item.icon),
        })),
        projects: data.projects.map(project => ({
            ...project,
            icon: getIcon(project.icon),
        })),
    }

    const { setTheme } = useTheme()

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <SessionProvider>
                <SidebarProvider>
                    <AppSidebar data={transformedData} variant="floating" />
                    <SidebarInset>
                        <div className="flex justify-between items-center pr-5">
                            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                                <div className="flex items-center gap-2 px-4">
                                    <SidebarTrigger className="-ml-1" />
                                    <Separator orientation="vertical" className="mr-2 h-4" />
                                    <Breadcrumb>
                                        <BreadcrumbList>
                                            <BreadcrumbItem className="hidden md:block">
                                                <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                                            </BreadcrumbItem>
                                            <BreadcrumbSeparator className="hidden md:block" />
                                            <BreadcrumbItem>
                                                <BreadcrumbPage className="capitalize">Testing</BreadcrumbPage>
                                            </BreadcrumbItem>
                                        </BreadcrumbList>
                                    </Breadcrumb>
                                </div>
                            </header>
                            <div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Icons.Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                            <Icons.Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                            <span className="sr-only">Toggle theme</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setTheme("light")}>
                                            Light
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                                            Dark
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setTheme("system")}>
                                            System
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                            {children}
                        </div>
                    </SidebarInset>
                </SidebarProvider>
            </SessionProvider>
        </ThemeProvider>
    )
}