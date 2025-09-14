/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*" },
      { protocol: "http", hostname: "*" },
    ],
  },
  webpack: (config) => {
    config.externals.push({
      "bufferutil": "bufferutil",
      "utf-8-validate": "utf-8-validate",
    });
    return config;
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "vercel.app"],
      allowedForwardedHosts: ["*"]
    },
  },
  // Ensure Socket.io works properly on Vercel
  transpilePackages: ["socket.io", "socket.io-client", "engine.io-client"],
};

module.exports = nextConfig;
