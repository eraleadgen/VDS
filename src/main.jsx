import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Unregister any stale service workers and force reload to pick up fresh bundle
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    if (registrations.length > 0) {
      registrations.forEach((reg) => reg.unregister());
      // Force reload to pick up the fresh un-cached bundle
      window.location.reload(true);
    }
  });
}
if ('caches' in window) {
  caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)