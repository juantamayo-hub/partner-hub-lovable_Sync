/** @type {import('next').NextConfig} */
const nextConfig = {
  // CORS for /api/* so Lovable (*.lovable.app) can call from browser.
  // Route Handlers also add these headers and handle OPTIONS (next.config alone can leave OPTIONS as 405).
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
