import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: "export",
  trailingSlash: false, // Verhindert Probleme mit URLs
};

export default nextConfig;