/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // epub.js ships with some node-isms; keep client bundle clean
    config.resolve.fallback = { ...(config.resolve.fallback ?? {}), fs: false, path: false };
    return config;
  },
};

export default nextConfig;
