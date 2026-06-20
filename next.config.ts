import type { NextConfig } from "next";
import { build } from "velite";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: 'export',
  // BUILD_ID estável: sem isto o Next gera um nanoid novo a cada build, e como
  // todo HTML embute /_next/static/<BUILD_ID>/_buildManifest.js + _ssgManifest.js,
  // TODO arquivo HTML muda de path a cada build -> o deploy SFTP incremental
  // (scripts/incremental-deploy.ts, diff sha256) via um delta de ~15k-35k arquivos
  // em todo deploy. Com um id constante, rebuilds de mesmo conteudo produzem out/
  // identico (toUpload=0) e um post novo gera so um delta pequeno. Seguro em
  // output:'export': nao ha runtime que rejeite id divergente, os chunks tem
  // content-hash proprio (cache-bust real continua), e o deploy purga o Cloudflare
  // (purge_everything) apos cada upload. Strings explicitas sao honradas verbatim
  // pelo Next (o guard /ad/i so se aplica ao fallback nanoid, nao a este valor).
  generateBuildId: () => 'systemforge-static',
  experimental: {
    // RESOLVED: tree-shaking otimizado para lucide-react
    optimizePackageImports: ['lucide-react'],
  },
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

// Module-scoped cache so Turbopack multi-eval reuses the same Velite build promise
// instead of racing parallel `clean: true` invocations that empty .velite mid-build.
let veliteBuildPromise: Promise<unknown> | undefined;

export default async function config(): Promise<NextConfig> {
  if (process.env.NODE_ENV === 'development') {
    if (!veliteBuildPromise) {
      veliteBuildPromise = build({ watch: true, clean: false });
    }
    await veliteBuildPromise;
  }
  return withAnalyzer(nextConfig);
}
