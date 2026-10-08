import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // AGENTS.md is written by hand for this repository.
  agentRules: false,
  // The dev badge sits on top of the rail's account button.
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
