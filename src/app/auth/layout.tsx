import Home from "@/components/animation/landscapes/scene";
import Image from "next/image";
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
       
        <div className="grid overflow-hidden min-h-svh lg:grid-cols-2">
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex gap-2 justify-center md:justify-start">
                    <a href="#" className="flex gap-2 items-center font-medium">
                        <Image className="w-6 h-6" src="/assets/logo.png" width="200" height="200" alt="Logo" />
                        Truemaps Inc.
                    </a>
                </div>
                <div className="flex flex-1 justify-center items-center">
                    <div className="w-full max-w-xs">
                        {children}
                    </div>
                </div>
            </div>
            <div className="hidden relative bg-muted lg:block">
                <Home />
            </div>
        </div>
    );
}
