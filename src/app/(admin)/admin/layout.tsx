import "@/app/globals.css"
import { getServerSession } from "next-auth"
import { Manrope, Work_Sans } from "next/font/google"
import { LayoutClient } from "./layout-client"
import { Toaster } from "react-hot-toast"

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
})

const manRope = Manrope({
  variable: "--font-man-rope",
  subsets: ["latin"],
})

export const metadata = {
  title: "Maps - Truenapsh",
  description: "Truenapsh.",
}

let data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Default",
      logo: "gallery-vertical-end",
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      isActive: true,
      icon: "frame",
      items: [
        {
          title: "Project",
          url: "/admin/dashboard",
        },
      ]
    },
    {
      title: "Playground",
      url: "#",
      icon: "square-terminal",
      isActive: false,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: "bot",
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: "book-open",
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: "settings-2",
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: "frame",
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: "pie-chart",
    },
    {
      name: "Travel",
      url: "#",
      icon: "map",
    },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const session = await getServerSession()
  data.user = session?.user
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} ${manRope.variable} antialiased`}>
        <Toaster
          position="top-right"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            className: '',
            duration: 5000,
            // style: {
            //     background: '#363636',
            //     color: '#fff',
            // },
            success: {
              duration: 3000,
            },
          }}
        />
        <LayoutClient data={data}>{children}</LayoutClient>
      </body>
    </html>
  )
}