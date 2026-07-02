import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Monorepo: web/ has its own lockfile; trace from repo root for deployments.
  outputFileTracingRoot: path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    ".."
  ),
  serverExternalPackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
