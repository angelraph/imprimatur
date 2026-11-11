import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pages read live licences and sittings, so they render on request.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
