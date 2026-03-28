import type { NextConfig } from "next";
import { build } from "velite";

const nextConfig: NextConfig = {
  output: 'export',
  // distDir dinâmico para builds triple-market: dist-br/, dist-it/, dist-en/
  // Fallback para '.next' em dev e no script build genérico
  distDir: process.env.OUT_DIR ?? '.next',
  trailingSlash: false,
  images: {
    unoptimized: true,
  },
};

// Async config: runs Velite before Next.js compilation.
// In production, prebuild script already ran `velite build` — skip to avoid
// Turbopack multi-eval race condition with clean:true that empties .velite.
// In dev, watch=true enables HMR-like content reloading.
// INT-045: NEXT_PUBLIC_LOCALE must be set before this runs.
export default async function config(): Promise<NextConfig> {
  if (process.env.NODE_ENV === 'development') {
    await build({ watch: true });
  }
  return nextConfig;
}
