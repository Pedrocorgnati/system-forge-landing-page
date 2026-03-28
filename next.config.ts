import type { NextConfig } from "next";
import { build } from "velite";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: 'export',
  // distDir dinâmico para builds triple-market: dist-br/, dist-it/, dist-en/
  // Fallback para '.next' em dev e no script build genérico
  distDir: process.env.OUT_DIR ?? '.next',
  trailingSlash: false,
  images: {
    // OBRIGATÓRIO: static export (output: 'export') não suporta otimização de
    // imagens em runtime — Next.js precisa de servidor Node.js para isso.
    // Com unoptimized: true, next/image renderiza <img> com width/height corretos
    // mas sem conversão WebP automática. O priority={true} ainda gera <link rel="preload">
    // para LCP. Para WebP nas OG images: usar scripts/optimize-og-images.sh.
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
  return withAnalyzer(nextConfig);
}
