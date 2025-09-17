import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "sijantan.rmlabs.id", protocol: "http", port: "" },
      { hostname: "api.dicebear.com", protocol: "https", port: "" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/maps/location",
        destination: "https://trueapi.truenapsh.my.id/api/maps/location",
      },
      {
        source: "/api/maps/alternatives",
        destination: "https://trueapi.truenapsh.my.id/api/maps/alternatives",
      },
    ];
  },
  // experimental: {
  //     reactCompiler: true,
  // },
  // compiler: {
  //     styledComponents: true,
  // },
  // eslint: {
  //     ignoreDuringBuilds: true,
  // },
  // typescript: {
  //     ignoreBuildErrors: true
  // },
};

export default nextConfig;
