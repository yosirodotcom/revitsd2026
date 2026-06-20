import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Proteksi global dari QuotaExceededError dan SecurityError pada localStorage
try {
  // Test access to localStorage
  const testVal = '__test__';
  window.localStorage.setItem(testVal, testVal);
  window.localStorage.removeItem(testVal);

  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    try {
      originalSetItem.call(localStorage, key, value);
    } catch (e) {
      console.warn(`[LocalStorage Quota Warning] Gagal menyimpan "${key}". Kuota penuh, data disimpan dalam memori React state.`, e);
    }
  };
} catch (e) {
  console.warn('[LocalStorage Blocked / Error] Menggunakan in-memory storage fallback:', e);
  const memStore = {};
  const mockStorage = {
    getItem(key) {
      return memStore[key] !== undefined ? memStore[key] : null;
    },
    setItem(key, value) {
      memStore[key] = String(value);
    },
    removeItem(key) {
      delete memStore[key];
    },
    clear() {
      for (const key in memStore) {
        delete memStore[key];
      }
    },
    key(index) {
      return Object.keys(memStore)[index] || null;
    },
    get length() {
      return Object.keys(memStore).length;
    }
  };
  try {
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true
    });
  } catch (err) {
    console.error('[LocalStorage Override Failed]: cannot redefine window.localStorage', err);
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
