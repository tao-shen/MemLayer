import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// EMERGENCY: Kill zombie service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      if (registration.active && registration.active.scriptURL.includes('coi-serviceworker.js')) {
        console.warn('Found zombie service worker in main.tsx, killing it:', registration.active.scriptURL);
        registration.unregister().then(() => {
          console.log('Zombie killed, reloading...');
          window.location.reload();
        });
      }
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
