'use client'

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from 'next-themes';
import { Manrope, Work_Sans } from "next/font/google";
import "../css/custom.css";
import "../globals.css";


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
    <html lang="en">
      <body
        className={`${workSans.variable} ${manRope.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
