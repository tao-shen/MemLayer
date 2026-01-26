/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window === 'undefined') {
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener("message", (ev) => {
    if (!ev.data) {
      return;
    } else if (ev.data.type === "deregister") {
      self.registration.unregister();
    } else if (ev.data.type === "coepCredentialless") {
      coepCredentialless = ev.data.value;
    }
  });

  self.addEventListener("fetch", function (event) {
    const r = event.request;
    if (r.cache === "only-if-cached" && r.mode !== "same-origin") {
      return;
    }

    const coepHeaders = new Headers(r.headers);
    if (coepCredentialless) {
      coepHeaders.set("Cross-Origin-Embedder-Policy", "credentialless");
    } else {
      coepHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
    }
    coepHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

    const fetchPromise = (r.mode === 'navigate')
      ? fetch(r)
      : fetch(r, {
        cache: r.cache,
        credentials: r.credentials,
        headers: coepHeaders,
        integrity: r.integrity,
        keepalive: r.keepalive,
        method: r.method,
        mode: r.mode,
        redirect: r.redirect,
        referrer: r.referrer,
        referrerPolicy: r.referrerPolicy,
        signal: r.signal,
      });

    event.respondWith(
      fetchPromise.then((response) => {
        if (response.status === 0) {
          return response;
        }

        if (response.status === 200) {
            const newHeaders = new Headers(response.headers);
            newHeaders.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
            newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

            return new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers: newHeaders,
            });
         }
         return response;
      })
    );
  });
} else {
  (async function () {
    if (window.crossOriginIsolated !== false) return;

    const registration = await navigator.serviceWorker.register("/coi-fixed.js").catch((e) => console.error("COI Service Worker failed to register:", e));
    if (registration) {
        console.log("COI Service Worker registered");
        window.location.reload();
    }
  })();
}
