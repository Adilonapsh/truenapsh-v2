import type { Metadata } from "next";
import { Geist, Geist_Mono, Work_Sans, Manrope } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
        {children}
      </body>
    </html>
  );
}
