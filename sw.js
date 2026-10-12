/* Cache somente do shell público. Nenhuma resposta Firebase ou dado do usuário é armazenado aqui. */
'use strict';
const CACHE_NAME = 'gestao-batismo-shell-v1';
const SHELL = ['./', './index.html', './experience-redesign.js', './work-modules.js', './manifest.webmanifest', './icon.svg'];
const STATIC_PATHS = new Set(['index.html','experience-redesign.js','work-modules.js','manifest.webmanifest','icon.svg']);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const base = new URL(self.registration.scope);
  if (!url.pathname.startsWith(base.pathname)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put('./index.html', response.clone()));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  const relative = url.pathname.slice(base.pathname.length);
  if (!STATIC_PATHS.has(relative) || url.search) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
    return response;
  }).catch(() => caches.match(request)));
});
