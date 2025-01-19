import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { FaFacebookF, FaPinterestP, FaTwitter, FaYoutube } from "react-icons/fa6";

export default function Home() {

  const components: { title: string; href: string; description: string }[] = [
    {
      title: "Alert Dialog",
      href: "/docs/primitives/alert-dialog",
      description:
        "A modal dialog that interrupts the user with important content and expects a response.",
    },
    {
      title: "Hover Card",
      href: "/docs/primitives/hover-card",
      description:
        "For sighted users to preview content available behind a link.",
    },
    {
      title: "Progress",
      href: "/docs/primitives/progress",
      description:
        "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
    },
    {
      title: "Scroll-area",
      href: "/docs/primitives/scroll-area",
      description: "Visually or semantically separates content.",
    },
    {
      title: "Tabs",
      href: "/docs/primitives/tabs",
      description:
        "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
    },
    {
      title: "Tooltip",
      href: "/docs/primitives/tooltip",
      description:
        "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    },
  ]

  const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
  >(({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        </NavigationMenuLink>
      </li>
    )
  })
  ListItem.displayName = "ListItem"

  return (

    <div className="bg-[#f6fbff]">
      <div className="container sticky py-3 text-center mx-auto w-full z-10" id="navbar">
        <div className="flex justify-between items-center">
          <Image src={"next.svg"} height={100} width={100} alt="Logo" />
          <div>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">Getting started</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <Link
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                            href="/"
                          >
                            {/* <Icons.logo className="h-6 w-6" /> */}
                            <div className="mb-2 mt-4 text-lg font-medium">
                              shadcn/ui
                            </div>
                            <p className="text-sm leading-tight text-muted-foreground">
                              Beautifully designed components built with Radix UI and
                              Tailwind CSS.
                            </p>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <ListItem href="/docs" title="Introduction">
                        Re-usable components built using Radix UI and Tailwind CSS.
                      </ListItem>
                      <ListItem href="/docs/installation" title="Installation">
                        How to install dependencies and structure your app.
                      </ListItem>
                      <ListItem href="/docs/primitives/typography" title="Typography">
                        Styles for headings, paragraphs, lists...etc
                      </ListItem>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">Components</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">Me</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                      {components.map((component) => (
                        <ListItem
                          key={component.title}
                          title={component.title}
                          href={component.href}
                        >
                          {component.description}
                        </ListItem>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="flex">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent">ENG</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4">
                      <li><button>IND</button></li>
                      <li><button>JPN</button></li>
                      <li><button>ENG</button></li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            <button className="px-4 py-2 bg-black rounded-full text-white text-sm font-bold">Contact Us</button>
          </div>
        </div>
      </div>
      <div className="container relative min-h-screen bg-[#f6fbff] text-black flex justify-between items-center overflow-x-hidden">
        <div className="opacity-10 -z-0">
          <Image src="/ind.png" width={10000} height={10000} alt="Map Icon" className="absolute top-[20%] right-0" />
        </div>
        <div className="h-full flex flex-col gap-5 justify-center z-0">
          <h3 className="text-5xl w-full lg:w-1/2 font-extrabold">Explore The World With Precision, One Map At A Time.</h3>
          <p className="w-full lg:w-1/3 text-lg font-light">Navigate the World, Discover New Paths, and Plan with Precision Using Advanced Mapping Tools.</p>
          <div>
            <a href="/auth/login" className="px-5 py-3 bg-black rounded-full text-white text-sm font-light">GET STARTED</a>
          </div>
        </div>
      </div>
      <div className="min-h-96 bg-[#010609] flex gap-5 items-center justify-between text-white">
        <div className="container flex flex-col gap-5 lg:flex-row py-5 lg:p-0 justify-between items-center">
          <h3 className="text-5xl w-full text-center lg:w-1/4 lg:text-start font-semibold">Where Your Beginnings Start!</h3>
          <p className="hidden lg:block">|</p>
          <p className="w-full lg:w-1/3 text-center lg:text-start">Explore New Horizons with a Trusted Mapping Platform, Proven to Help You Navigate, Discover, and Plan with Precision.</p>
          <p className="hidden lg:block">|</p>
          <button className="px-5 py-3 bg-[#f6fbff] text-black text-sm font-bold">OUR SERVICES</button>
        </div>
      </div>
      <div className="min-h-96 py-10">
        <div className="container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="border-none bg-[#f6fbff]">
            <CardHeader>
              <CardTitle>
                <Image src={"data.svg"} width={90} height={100} alt="Icon" className="text-black" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="text-xl font-extrabold mb-2">Access to Accurate Data</h4>
              <p className="text-sm">Access precise and reliable mapping data to plan routes, discover new locations, and make informed decisions with ease.</p>
            </CardContent>
            <CardFooter>
              <p className="font-bold">READ MORE</p>
            </CardFooter>
          </Card>
          <Card className="border-none bg-[#f6fbff]">
            <CardHeader>
              <CardTitle>
                <Image src={"pieceofmind.svg"} width={90} height={100} alt="Icon" className="text-black" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="text-xl font-extrabold mb-2">Peace of Mind</h4>
              <p className="text-sm">Navigate confidently with a proven platform designed for accuracy and reliability, ensuring smooth and stress-free journeys.</p>
            </CardContent>
            <CardFooter>
              <p className="font-bold">READ MORE</p>
            </CardFooter>
          </Card>
          <Card className="border-none bg-[#f6fbff]">
            <CardHeader>
              <CardTitle>
                <Image src={"timesaving.svg"} width={90} height={100} alt="Icon" className="text-black" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="text-xl font-extrabold mb-2">Time-Saving</h4>
              <p className="text-sm">Save time with smart route planning and real-time updates, getting you to your destination faster and more efficiently.</p>
            </CardContent>
            <CardFooter>
              <p className="font-bold">READ MORE</p>
            </CardFooter>
          </Card>
          <Card className="border-none bg-[#f6fbff]">
            <CardHeader>
              <CardTitle>
                <Image src={"lifetime.svg"} width={90} height={100} alt="Icon" className="text-black" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <h4 className="text-xl font-extrabold mb-2">Lifetime Support</h4>
              <p className="text-sm">Enjoy lifetime support with regular updates, expert assistance, and reliable tools to ensure a seamless navigation experience.</p>
            </CardContent>
            <CardFooter>
              <p className="font-bold">READ MORE</p>
            </CardFooter>
          </Card>
        </div>
      </div>
      <div className="container min-h-96 flex flex-row items-center">
        <div className="grid grid-col-1 lg:grid-cols-3 gap-3 w-full">
          <div className="flex flex-col gap-5 mb-5 lg:mb-0">
            <Image src={"next.svg"} height={100} width={100} alt="Logo" />
            <p className="w-1/3">Explore The World With Precision.</p>
            <div className="flex justify-between">
              <a href="#" className="font-bold">Home</a>
              <a href="#" className="font-bold">Service</a>
              <a href="#" className="font-bold">Map</a>
              <a href="#" className="font-bold">About</a>
            </div>
          </div>
          <div className="hidden lg:flex flex-col justify-center items-start gap-5 mx-32">
            <p className="font-bold">Help</p>
            <ul className="leading-10">
              <li>Customer Support</li>
              <li>Terms & Conditions</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
          <div className="flex flex-col justify-center items-start gap-5">
            <p className="font-bold">Subsribed To Our Newsletter.</p>
            <div className="flex items-center w-full">
              <Input className="rounded-none" type="email" placeholder="Email" />
              <button type="submit" className="px-4 py-2 bg-[#010609] text-white text-sm font-bold">Subscibe</button>
            </div>
            <div className="flex justify-between w-full items-center">
              <p className="font-bold">Follow Us:</p>
              <div className="flex gap-5">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaTwitter /></a>
                <a href="#"><FaPinterestP /></a>
                <a href="#"><FaYoutube /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
