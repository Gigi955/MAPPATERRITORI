import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Rimuove SW residui di versioni precedenti che cachavano asset obsoleti
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((rs) => {
    for (const r of rs) r.unregister()
  }).catch(() => {})
  if (typeof caches !== 'undefined') {
    caches.keys().then((ks) => ks.forEach((k) => caches.delete(k))).catch(() => {})
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
