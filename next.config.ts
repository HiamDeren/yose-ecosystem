import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build  → xuất bản demo tĩnh vào ./out (không cần server)
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Static export không hỗ trợ Partial Prerendering, nên tắt Cache Components khi export
  cacheComponents: !isExport,
  partialPrefetching: !isExport,
  ...(isExport ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } } : {}),
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
