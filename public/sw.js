var CACHE_NAME = 'pepperberry-v4';
var OFFLINE_URL = '/offline.html';

// Pre-cache offline fallback page on install
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([OFFLINE_URL, '/icon-192.png', '/icon-512.png', '/PBLogo.png']);
    })
  );
  self.skipWaiting();
});

// Delete ALL caches on activate and take control immediately
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return caches.open(CACHE_NAME).then(function (cache) {
        return cache.addAll([OFFLINE_URL, '/icon-192.png', '/icon-512.png', '/PBLogo.png']);
      });
    })
  );
  self.clients.claim();
});

// Fetch handler with caching strategies
self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);

  // Skip non-GET requests (mutations must go online)
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Static assets: cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Auth API: always network, never cache (user list changes)
  if (url.pathname === '/api/auth/users') return;

  // API GET requests: network-first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(request);
        })
    );
    return;
  }

  // Navigation requests: network-first with cache fallback, then offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (cached) {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // All other requests: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response.ok) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(request, clone);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(request);
      })
  );
});

// Push notification handler
self.addEventListener('push', function (event) {
  if (!event.data) return;

  var data = event.data.json();

  var options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: data.url || '/dashboard',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Pepperberry Farm', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
