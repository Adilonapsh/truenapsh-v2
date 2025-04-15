'use client'
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"

export function MapLayoutClient({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChanges
            >
                <SessionProvider>
                    {children}
                </SessionProvider>
            </ThemeProvider>
        </div>
    )
}