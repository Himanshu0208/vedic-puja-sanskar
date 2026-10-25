import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: 'http://vedic-puja-backend:8080/api/v1/:path*' },
      { source: '/uploads/:path*', destination: 'http://uploads:80/uploads/:path*' },
    ];
  },
};

export default nextConfig;
