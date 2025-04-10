import type { Metadata } from "next";
import { Manrope, Work_Sans } from "next/font/google";
import "./globals.css";

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
    <html lang="id">
      <body
        className={`${workSans.variable} ${manRope.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
