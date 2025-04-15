import { Manrope, Work_Sans } from "next/font/google";
import "../../css/custom.css";
import "../../globals.css";
import { MapLayoutClient } from "./layout-client";


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
        <html lang="id" suppressHydrationWarning>
            <body className={`${workSans.variable} ${manRope.variable} antialiased`}>
                <MapLayoutClient>{children}</MapLayoutClient>
            </body>
        </html>
    );
}
