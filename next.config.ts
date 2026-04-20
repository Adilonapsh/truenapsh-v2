import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Ignore source-map-loader warnings for broken source maps in libraries
    config.ignoreWarnings = [
      { module: /node_modules\/(@deck\.gl|@loaders\.gl|@luma\.gl)/ },
    ];
    return config;
  },
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
