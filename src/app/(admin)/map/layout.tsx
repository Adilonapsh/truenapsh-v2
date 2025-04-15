import { Metadata } from "next";
import "../../css/custom.css";
import "../../globals.css";
import { MapLayoutClient } from "./layout-client";

export const metadata: Metadata = {
  title: "Maps - Truenapsh",
  description: "Truenapsh.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <section>
            <MapLayoutClient>{children}</MapLayoutClient>
        </section>
    );
}
