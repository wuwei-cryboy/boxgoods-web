import type { NextConfig } from "next";
const nextConfig: NextConfig = { images: { unoptimized: true } };
nextConfig.eslint = { ignoreDuringBuilds: true };
export default nextConfig;
