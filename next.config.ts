import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "sijantan.rmlabs.id", protocol: "http", port: "" },
      { hostname: "api.dicebear.com", protocol: "https", port: "" },
    ],
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
