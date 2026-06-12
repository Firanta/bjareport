import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  // Allow server-side packages
  serverExternalPackages: ["@react-pdf/renderer"],
  // Set turbopack root to silence multiple lockfile warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
