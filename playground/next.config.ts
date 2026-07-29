import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@ds/ui"],
};

export default nextConfig;
