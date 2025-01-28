import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [{ hostname: 'sijantan.rmlabs.id', protocol: 'http', port: '' }],
    },
    async rewrites() {
        return [
            {
                source: "/api/maps/location",
                destination: "https://trueapi.truenapsh.my.id/api/maps/location",
            },
        ];
    },
    experimental: {
        reactCompiler: true,
    },
    compiler: {
        styledComponents: true,
    },
};

export default nextConfig;
