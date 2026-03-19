/**
 * Suona un doppio beep di allarme usando Web Audio API.
 * Nessuna dipendenza esterna — funziona nel WebView Android nativamente.
 * Il segnale consiste in 2 toni brevi (880 Hz) separati da 400ms.
 */
export function playBoundaryAlert(): void {
  try {
    const ctx = new AudioContext()

    const playBeep = (startTime: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880 // La5 — tono udibile e chiaro
      gain.gain.setValueAtTime(0.6, startTime)
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3)
      osc.start(startTime)
      osc.stop(startTime + 0.3)
    }

    playBeep(ctx.currentTime)        // 1° beep immediato
    playBeep(ctx.currentTime + 0.4)  // 2° beep dopo 400ms
  } catch {
    // AudioContext non disponibile → silenzio, nessun crash
  }
}
