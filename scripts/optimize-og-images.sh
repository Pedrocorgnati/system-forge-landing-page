#!/bin/bash
# scripts/optimize-og-images.sh
# Converte OG images PNG → WebP para melhor performance
# Uso: bash scripts/optimize-og-images.sh
# Requer: cwebp (brew install webp / apt-get install webp)
set -e

OG_DIR="public/og"

if [ ! -d "$OG_DIR" ]; then
  echo "❌ Diretório $OG_DIR não encontrado. Execute a partir da raiz do projeto."
  exit 1
fi

for img in "$OG_DIR"/*.png; do
  if [ -f "$img" ]; then
    output="${img%.png}.webp"
    if command -v cwebp &> /dev/null; then
      cwebp -q 85 "$img" -o "$output"
      echo "✅ Convertido: $img → $output"
    else
      echo "⚠️  cwebp não encontrado. Instale com:"
      echo "   macOS:  brew install webp"
      echo "   Ubuntu: sudo apt-get install webp"
      echo ""
      echo "Alternativa Node.js (Sharp já instalado como devDep):"
      echo "   npx tsx -e \"require('sharp')('$img').webp({quality:85}).toFile('$output')\""
      break
    fi
  fi
done

echo ""
echo "📊 Tamanhos dos arquivos OG:"
ls -lh "$OG_DIR"/*.png "$OG_DIR"/*.webp 2>/dev/null | awk '{print $5, $9}'
