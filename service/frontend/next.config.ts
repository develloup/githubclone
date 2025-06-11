import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false, // Resolves problems with URLs

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:3000/api/:path*", // the docker service
      }
    ]
  }
};

export default nextConfig;