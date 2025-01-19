'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans, Manrope } from "next/font/google";
import "../globals.css";
import "../css/custom.css"
import { SessionProvider } from "next-auth/react";


const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const manRope = Manrope({
  variable: "--font-man-rope",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Maps - Truenapsh",
//   description: "Truenapsh.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en" className="dark">
      <body
        className={`${workSans.variable} ${manRope.variable} antialiased`}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
