/*! coi-serviceworker v0.1.7-patched - Guido Zuidhof, licensed under MIT */
let coepCredentialless = true;
console.log("COI: Configured with coepCredentialless =", coepCredentialless);
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

    // Active Killer: Unregister the old broken worker if present
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active && reg.active.scriptURL.includes("coi-serviceworker.js")) {
          console.log("[COI] Unregistering stale worker:", reg.active.scriptURL);
          await reg.unregister();
          window.location.reload();
          return;
        }
      }
    } catch (e) {
      console.error("[COI] Failed to clear stale workers", e);
    }

    let scriptSrc = window.document.currentScript?.src;
    if (!scriptSrc) {
      // Fallback for when currentScript is null (e.g. sub-routes on SPA)
      // Explicitly point to the Service Worker at the root of the deployment
      scriptSrc = `${window.location.origin}/TacitLayer/coi-fixed.js`;
    }
    const registration = await navigator.serviceWorker.register(scriptSrc).catch((e) => console.error("COI Service Worker failed to register:", e));
    if (registration) {
        console.log("COI Service Worker registered");

      // Loop protection
      try {
        if (window.sessionStorage.getItem('coiReloaded')) {
          console.error("COI: Reloaded but still not isolated. Stopping loop.");
          return;
        }
        window.sessionStorage.setItem('coiReloaded', 'true');
      } catch (e) {
        // checking sessionStorage might fail in some contexts
      }

        window.location.reload();
    }
  })();
} else {
  // If we are isolated, clear the flag
  try {
    window.sessionStorage.removeItem('coiReloaded');
  } catch (e) { }
}
