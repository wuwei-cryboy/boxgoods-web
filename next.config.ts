import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone", images: { unoptimized: true } };
nextConfig.eslint = { ignoreDuringBuilds: true };
export default nextConfig;
