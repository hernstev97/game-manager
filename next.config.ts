import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The collaborative preview may address the local dev server through
  // 127.0.0.1 while Next starts on localhost.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
