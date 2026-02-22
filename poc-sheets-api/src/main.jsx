import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// 強制清除舊版快取
const CURRENT_VERSION = 'v2.2';
const storedVersion = localStorage.getItem('app_version');
if (storedVersion !== CURRENT_VERSION) {
  localStorage.setItem('app_version', CURRENT_VERSION);
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }
  if (navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
  }
  if (storedVersion) {
    window.location.reload();
  }
}

// PWA 自動更新
const updateSW = registerSW({
  onNeedRefresh() {
    // 有新版本時自動更新
    updateSW(true)
  },
  onOfflineReady() {
    console.log('PWA 離線模式已就緒')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
