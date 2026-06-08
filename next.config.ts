import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-libsql", "@libsql/client"],
};

export default nextConfig;
