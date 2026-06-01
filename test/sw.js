/* ════════════════════════════════════════════════════════════════════
   SERVICE WORKER — cache degli asset statici (solo test/)
   ---------------------------------------------------------------------
   Obiettivo: ricariche quasi istantanee dopo la prima visita.

   REGOLE DI SICUREZZA (per non rompere auth/dati):
   - Intercetta SOLO richieste GET.
   - NON tocca mai Firestore/Auth/API dinamiche → quelle passano dirette
     (firestore.googleapis.com, identitytoolkit, securetoken, firebaseio…).
   - Librerie CDN versionate (React, Recharts, Firebase SDK, Google Fonts):
     cache-first (immutabili).
   - File propri (bundle JS, CSS, immagini): stale-while-revalidate
     (serve subito dalla cache e aggiorna in background → mai stantio al
     refresh successivo).
   - HTML/navigazione: network-first (sempre l'ultima versione se online,
     fallback cache se offline).

   Per forzare l'aggiornamento totale: incrementa CACHE_VERSION.
   ════════════════════════════════════════════════════════════════════ */
const CACHE_VERSION = "tutoria-v1";

// Host CDN di sole risorse statiche/immutabili (versionate nell'URL).
const STATIC_CDN = [
  "https://unpkg.com/",
  "https://www.gstatic.com/firebasejs/",
  "https://fonts.googleapis.com/",
  "https://fonts.gstatic.com/",
];

// Host che NON vanno MAI intercettati (dati dinamici / auth in tempo reale).
const NEVER_CACHE = [
  "firestore.googleapis.com",
  "firebaseinstallations.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "firebaseio.com",
];

self.addEventListener("install", e => { self.skipWaiting(); });

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;                      // solo GET
  const url = new URL(req.url);

  if (NEVER_CACHE.some(h => url.hostname.includes(h))) return;  // dati/auth → passthrough

  const isStaticCDN = STATIC_CDN.some(p => req.url.startsWith(p));
  const isSameOrigin = url.origin === self.location.origin;
  if (!isStaticCDN && !isSameOrigin) return;             // tutto il resto → passthrough

  // HTML / navigazione → network-first
  if (req.mode === "navigate" || (isSameOrigin && url.pathname.endsWith(".html"))) {
    event.respondWith(networkFirst(req));
    return;
  }

  // CDN versionate immutabili → cache-first
  if (isStaticCDN) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // File propri (bundle, css, assets) → stale-while-revalidate
  event.respondWith(staleWhileRevalidate(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE_VERSION);
  const hit = await cache.match(req);
  const fetching = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fetching;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req);
    return hit || Response.error();
  }
}
