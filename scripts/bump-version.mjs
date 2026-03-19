import { readFileSync, writeFileSync } from 'fs'

// Bump package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
const [major, minor, patch] = pkg.version.split('.').map(Number)
const newPatch = patch + 1
const newVersion = `${major}.${minor}.${newPatch}`
pkg.version = newVersion
writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n')

// Bump android/app/build.gradle
const gradlePath = './android/app/build.gradle'
let gradle = readFileSync(gradlePath, 'utf-8')
const versionCode = major * 10000 + minor * 100 + newPatch
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${newVersion}"`)
writeFileSync(gradlePath, gradle)

console.log(`Versione aggiornata: ${pkg.version.replace(`.${newPatch - 1}.`, '.')}${newPatch - 1} → ${newVersion}`)
console.log(`versionCode: ${versionCode}`)
