import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import { withSerwist } from "@serwist/turbopack";

const root = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "pdf-parse"],
  // Avoid walking up to a parent lockfile (slow + wrong root on this machine).
  turbopack: {
    root,
  },
};

export default withSerwist(nextConfig);
