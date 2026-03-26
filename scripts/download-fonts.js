#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * download-fonts.js
 * Baixa fontes self-hosted de fontsource.org (mirrors dos arquivos originais)
 * Executar: node scripts/download-fonts.js
 * ou: npm run fonts:download
 */

const https = require('https')
const http = require('http')
const fs = require('fs')
const path = require('path')

const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts')

const fonts = [
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-300-normal.woff2',
    dest: 'inter-latin-300.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-400-normal.woff2',
    dest: 'inter-latin-400.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-500-normal.woff2',
    dest: 'inter-latin-500.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-600-normal.woff2',
    dest: 'inter-latin-600.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-700-normal.woff2',
    dest: 'inter-latin-700.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/inter@5/files/inter-latin-ext-400-normal.woff2',
    dest: 'inter-latin-ext.woff2',
  },
  {
    url: 'https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/files/jetbrains-mono-latin-400-normal.woff2',
    dest: 'jetbrains-mono-latin.woff2',
  },
]

if (!fs.existsSync(FONTS_DIR)) {
  fs.mkdirSync(FONTS_DIR, { recursive: true })
}

function downloadFile(url, dest, redirectCount = 0) {
  if (redirectCount > 5) {
    return Promise.reject(new Error(`Too many redirects for ${dest}`))
  }

  return new Promise((resolve, reject) => {
    const filePath = path.join(FONTS_DIR, dest)
    const file = fs.createWriteStream(filePath)
    const client = url.startsWith('https') ? https : http

    client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close()
        fs.unlink(filePath, () => {})
        return downloadFile(response.headers.location, dest, redirectCount + 1)
          .then(resolve)
          .catch(reject)
      }

      if (response.statusCode !== 200) {
        file.close()
        fs.unlink(filePath, () => {})
        return reject(new Error(`HTTP ${response.statusCode} for ${url}`))
      }

      response.pipe(file)
      file.on('finish', () => {
        file.close()
        const stats = fs.statSync(filePath)
        console.log(`✓ ${dest} (${Math.round(stats.size / 1024)}KB)`)
        resolve()
      })
    }).on('error', (err) => {
      file.close()
      fs.unlink(filePath, () => {})
      reject(err)
    })
  })
}

async function main() {
  console.log('Baixando fontes self-hosted...\n')
  for (const font of fonts) {
    await downloadFile(font.url, font.dest)
  }
  console.log('\nFontes baixadas em public/fonts/')
  console.log('Verifique os tamanhos: npm run fonts:verify')
}

main().catch((err) => {
  console.error('Erro ao baixar fontes:', err.message)
  process.exit(1)
})
