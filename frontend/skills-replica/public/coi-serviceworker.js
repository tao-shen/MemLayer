self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
    console.log('[COI-KILLER] Unregistering old service worker...');
    event.waitUntil(
        self.registration.unregister().then(() => {
            console.log('[COI-KILLER] Unregistered. Taking control and reloading...');
            return self.clients.claim();
        }).then(() => {
             // Force reload all clients to ensure they pick up the new worker
            return self.clients.matchAll().then(clients => {
                return Promise.all(clients.map(client => client.navigate(client.url)));
            });
        })
    );
});
