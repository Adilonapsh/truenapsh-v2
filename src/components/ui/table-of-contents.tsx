"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Section {
  id: string
  title: string
}

interface TableOfContentsProps {
  sections: Section[]
  basePath: string
}

export function TableOfContents({ sections, basePath }: TableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>("")

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200 // Offset for header

      // Find the section that's currently in view
      let currentSection = ""

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const elementTop = element.offsetTop
          const elementBottom = elementTop + element.offsetHeight

          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            currentSection = section.id
            break
          }
        }
      }

      // If no section is found in the main loop, find the closest one above
      if (!currentSection) {
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i]
          const element = document.getElementById(section.id)
          if (element && scrollPosition >= element.offsetTop - 200) {
            currentSection = section.id
            break
          }
        }
      }

      setActiveSection(currentSection)
    }

    // Initial check
    handleScroll()

    // Add scroll listener
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  return (
    <nav className="space-y-1">
      {sections.map((section) => (
        <Link
          key={section.id}
          href={`${basePath}#${section.id}`}
          className={`block text-sm py-2 px-3 transition-all duration-200 rounded-md ${
            activeSection === section.id
              ? "bg-primary/10 text-primary font-medium border-l-2 border-primary shadow-sm"
              : "hover:text-primary hover:bg-muted/50"
          }`}
          scroll={true}
        >
          {section.title}
        </Link>
      ))}
    </nav>
  )
}
