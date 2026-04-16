import "./globals.css";
import type { Metadata } from "next";
import { Manrope, Work_Sans } from "next/font/google";

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
  icons: {
    icon: "/assets/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${workSans.variable} ${manRope.variable} antialiased`}
      >
          {children}
      </body>
    </html>
  );
}
