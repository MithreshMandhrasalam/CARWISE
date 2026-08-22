import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from the Node.js backend
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
    ],
  },
  // Required for standalone Docker build
  output: 'standalone',
};

export default nextConfig;
