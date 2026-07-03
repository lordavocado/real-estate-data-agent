import type { NextConfig } from "next";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(webDir, "..");

/**
 * Keep dev build artifacts outside the repo so eve's dev-runtime snapshot
 * (which copies the whole monorepo) does not race on webpack cache files.
 */
const devDistDir = path.join(os.tmpdir(), "rea-web-next");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(process.env.NODE_ENV !== "production" ? { distDir: devDistDir } : {}),
  // Monorepo: web/ has its own lockfile; trace from repo root for deployments.
  outputFileTracingRoot: repoRoot,
  serverExternalPackages: ["react-leaflet", "leaflet"],
};

export default nextConfig;
