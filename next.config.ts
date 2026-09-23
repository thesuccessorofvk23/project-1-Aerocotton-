import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: "export",
  trailingSlash: true,
  // Keep build-worker parallelism low: this machine runs tight on Windows
  // commit memory and a full-width worker pool OOMs the build.
  experimental: {
    cpus: 2,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
