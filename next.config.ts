import type { NextConfig } from "next";

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // 同源模式：把 /api/* 反代到 fishai-server
  // 这样前端和后端可以共用一个域名/端口，避免 CORS
  // 如果后端在不同域名，设置 NEXT_PUBLIC_API_BASE_URL 即可不走 rewrites
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${SERVER_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
