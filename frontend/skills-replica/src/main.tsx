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

// Hide the initial loading spinner once React has mounted
const hideLoader = () => {
  const loader = document.getElementById('app-loader');
  if (loader) {
    loader.classList.add('hidden');
    // Remove from DOM after transition
    setTimeout(() => loader.remove(), 300);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide loader after a brief delay to ensure first paint
requestAnimationFrame(() => {
  requestAnimationFrame(hideLoader);
});
