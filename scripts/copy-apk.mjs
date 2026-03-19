import { readFileSync, copyFileSync, readdirSync } from 'fs'
import { join } from 'path'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const version = pkg.version

// Try both possible APK names (varies by app ID configuration)
const src = (() => {
  const candidates = [
    './android/app/build/outputs/apk/debug/app-debug.apk',
    './android/app/build/outputs/apk/debug/mappaterritori-debug.apk',
  ]
  for (const c of candidates) {
    try { readFileSync(c); return c } catch {}
  }
  throw new Error('APK debug non trovato in ' + candidates.join(' o '))
})()
const dest = `./MappaTerritori-v${version}.apk`

copyFileSync(src, dest)
console.log(`APK copiato: ${dest}`)

// Lista APK presenti
const apks = readdirSync('.').filter(f => f.endsWith('.apk'))
console.log('APK disponibili:', apks.join(', '))
