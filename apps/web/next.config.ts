import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  serverExternalPackages: ["tesseract.js", "pdf-parse"],
};

export default withSerwist(nextConfig);
