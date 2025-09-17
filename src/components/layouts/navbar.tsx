"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function Navbar() {
    const [theme, setTheme] = useState("light")
    const [mounted, setMounted] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem("theme") || "light"
        setTheme(savedTheme)

        if (savedTheme === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true)
            } else {
                setScrolled(false)
            }
        }

        window.addEventListener("scroll", handleScroll)
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light"
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)

        if (newTheme === "dark") {
            document.documentElement.classList.add("dark")
        } else {
            document.documentElement.classList.remove("dark")
        }
    }

    return (
        <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4">
            <div
                className={cn(
                    "container transition-all duration-300 ease-in-out",
                    scrolled ? "rounded-full shadow-md max-w-4xl mt-5 backdrop-blur-sm bg-background/70 border" : "bg-transparent border-b",
                )}
            >
                <div className="flex h-16 items-center justify-between px-2">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/assets/logo.png" alt="Logo" className="h-7 w-7" />
                        <span className="font-bold text-xl hidden lg:block">TrueMaps</span>
                    </Link>

                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
                            Home
                        </Link>
                        <Link href="/fitur" className="text-sm font-medium transition-colors hover:text-primary">
                            Fitur
                        </Link>
                        <Link href="/testimoni" className="text-sm font-medium transition-colors hover:text-primary">
                            Testimoni
                        </Link>
                        <Link href="/faq" className="text-sm font-medium transition-colors hover:text-primary">
                            FAQ
                        </Link>
                    </nav>

                    {/* Right side buttons */}
                    <div className="flex items-center space-x-4">
                        {/* Theme toggle */}
                        <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                            {mounted && (theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />)}
                        </Button>

                        {/* Join button */}
                        <a href="/auth/login" className="rounded-full bg-black dark:bg-white text-white dark:text-black px-10 py-2 ">Gabung</a>
                    </div>
                </div>
            </div>
        </header>
    )
}
