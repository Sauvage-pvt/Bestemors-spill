/* Spillebordet - offline uten manuell versjonshåndtering.
 *
 * index.html hentes fra nett først, med 3 sekunders tålmodighet.
 * Kommer den ikke, serveres siste lagrede utgave. Det betyr at
 * endringer du pusher lander med en gang, og at appen fortsatt
 * virker uten dekning.
 *
 * Ikoner og manifest serveres fra cache og oppdateres stille i
 * bakgrunnen - de endrer seg nesten aldri.
 *
 * CACHE-navnet trenger du normalt ikke å røre. Øk det bare hvis du
 * bytter ut ikonene og vil tvinge fram nye med én gang.
 */
var CACHE = 'spillebordet-v2';
var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png'
];
var NETTVERK_TIMEOUT = 3000;

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(SHELL); })
      .catch(function () { /* offline ved første install - ikke fatalt */ })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* Er dette selve appsiden? */
function erSide(req) {
  if (req.mode === 'navigate') return true;
  if (req.destination === 'document') return true;
  return req.url.indexOf('.html') !== -1;
}

/* Hent fra nett, men gi opp etter NETTVERK_TIMEOUT ms. */
function nettMedTimeout(req) {
  return new Promise(function (resolve, reject) {
    var ferdig = false;
    var timer = setTimeout(function () {
      if (!ferdig) { ferdig = true; reject(new Error('timeout')); }
    }, NETTVERK_TIMEOUT);
    fetch(req).then(function (res) {
      if (ferdig) return;
      ferdig = true; clearTimeout(timer); resolve(res);
    }, function (err) {
      if (ferdig) return;
      ferdig = true; clearTimeout(timer); reject(err);
    });
  });
}

/* Siste utvei: har vi verken nett eller cache, si det på norsk
   i stedet for å la Safari vise sin egen feilside. */
function ingenting() {
  return new Response(
    '<!doctype html><html lang="nb"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>Spillebordet</title><style>body{margin:0;min-height:100vh;display:flex;' +
    'align-items:center;justify-content:center;background:#1E4038;color:#F6EFE2;' +
    'font:17px/1.5 -apple-system,sans-serif;text-align:center;padding:32px}' +
    'h1{font:400 26px/1.2 Georgia,serif;margin:0 0 10px}' +
    'p{margin:0;color:rgba(246,239,226,.7)}</style></head><body><div>' +
    '<h1>Spillebordet er ikke lastet ned ennå</h1>' +
    '<p>Koble til internett én gang, så virker den etterpå uten dekning.</p>' +
    '</div></body></html>',
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function fraCache(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return caches.match('./index.html');
  }).then(function (hit) {
    return hit || ingenting();
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  if (erSide(req)) {
    /* Nett først: nye versjoner lander umiddelbart. */
    e.respondWith(
      nettMedTimeout(req).then(function (res) {
        if (res && res.ok) {
          var kopi = res.clone();
          caches.open(CACHE).then(function (c) { c.put('./index.html', kopi); });
        }
        return res;
      }).catch(function () {
        return fraCache(req);
      })
    );
    return;
  }

  /* Alt annet: cache først, oppdater stille i bakgrunnen. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var nett = fetch(req).then(function (res) {
        if (res && res.ok) {
          var kopi = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, kopi); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || nett;
    })
  );
});
