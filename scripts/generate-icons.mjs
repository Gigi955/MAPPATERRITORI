// Genera le icone Android da SVG: ic_launcher.png, ic_launcher_round.png,
// ic_launcher_foreground.png in tutti i densità mipmap-*.
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const resDir = join(root, 'android/app/src/main/res')

const fullSvg = readFileSync(join(__dirname, 'icon-source.svg'))
const fgSvg = readFileSync(join(__dirname, 'icon-foreground.svg'))

// Dimensioni per Android mipmap (px)
// ic_launcher / ic_launcher_round: 48/72/96/144/192 px
// ic_launcher_foreground (adaptive): 108dp canvas → 162/216/324/432/648 px
const densities = [
  { dir: 'mipmap-mdpi',    launcher: 48,  foreground: 108 },
  { dir: 'mipmap-hdpi',    launcher: 72,  foreground: 162 },
  { dir: 'mipmap-xhdpi',   launcher: 96,  foreground: 216 },
  { dir: 'mipmap-xxhdpi',  launcher: 144, foreground: 324 },
  { dir: 'mipmap-xxxhdpi', launcher: 192, foreground: 432 },
]

async function renderPng(svgBuffer, size, outPath, { round = false } = {}) {
  let pipeline = sharp(svgBuffer, { density: 384 }).resize(size, size)
  if (round) {
    const r = size / 2
    const mask = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
         <circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/>
       </svg>`
    )
    pipeline = pipeline.composite([{ input: mask, blend: 'dest-in' }])
  }
  await pipeline.png().toFile(outPath)
}

for (const d of densities) {
  const outDir = join(resDir, d.dir)
  mkdirSync(outDir, { recursive: true })
  await renderPng(fullSvg, d.launcher, join(outDir, 'ic_launcher.png'))
  await renderPng(fullSvg, d.launcher, join(outDir, 'ic_launcher_round.png'), { round: true })
  await renderPng(fgSvg,   d.foreground, join(outDir, 'ic_launcher_foreground.png'))
  console.log(`✓ ${d.dir}: launcher=${d.launcher}px, foreground=${d.foreground}px`)
}

// Icona PWA/fallback 512 opzionale
await renderPng(fullSvg, 512, join(root, 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_512.png'))
console.log('\n✓ Tutte le icone generate.')
