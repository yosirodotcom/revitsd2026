import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Proteksi global dari QuotaExceededError pada localStorage
try {
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    try {
      originalSetItem.call(localStorage, key, value);
    } catch (e) {
      console.warn(`[LocalStorage Quota Warning] Gagal menyimpan "${key}". Kuota penuh, data disimpan dalam memori React state.`, e);
    }
  };
} catch (e) {
  console.error('[LocalStorage Override Error]:', e);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
