import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Allow Spotify Album Art
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
