import Home from "@/components/animation/landscapes/scene";
import { GalleryVerticalEnd } from "lucide-react";
import type { Metadata } from "next";
import { Manrope, Work_Sans } from "next/font/google";
import "../globals.css";

const workSans = Work_Sans({
    variable: "--font-work-sans",
    subsets: ["latin"],
});

const manRope = Manrope({
    variable: "--font-man-rope",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Truemaps",
    description: "Truenapsh.",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // <html lang="id">
        //     <body
        //         className={`${workSans.variable} ${manRope.variable} antialiased`}
        //     >
        <div className="grid min-h-svh lg:grid-cols-2 overflow-hidden">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center gap-2 md:justify-start">
                    <a href="#" className="flex items-center gap-2 font-medium">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                            <GalleryVerticalEnd className="size-4" />
                        </div>
                        Truemaps Inc.
                    </a>
                </div>
                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs">
                        {children}
                    </div>
                </div>
            </div>
            <div className="relative hidden bg-muted lg:block">
                <Home/>
            </div>
        </div>
        //     </body>
        // </html>
    );
}
