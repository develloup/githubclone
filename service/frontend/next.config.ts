import { NextConfig } from "next";
import withBundleAnalyzer from '@next/bundle-analyzer'

const isAnalyze = process.env.ANALYZE === 'true';
const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: false, // Resolves problems with URLs
  
  images: {
    domains: [
      "img.shields.io",
      "user-images.githubusercontent.com",
      "raw.githubusercontent.com",
      "avatars.githubusercontent.com"
    ]
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:3000/api/:path*", // the docker service
      }
    ]
  }
};


export default isAnalyze ? withBundleAnalyzer({ enabled: true })(nextConfig) : nextConfig;

// export default nextConfig;