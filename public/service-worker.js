// Cache version - increment this when you make significant changes
const CACHE_VERSION = 'v2';
const CACHE_NAME = 'venuedating-app-' + CACHE_VERSION;
// Add a timestamp for cache-busting
const CACHE_TIMESTAMP = new Date().getTime();

// Define assets to cache
const ASSETS_TO_CACHE = [
  '/',
  //'/index.html',
  // '/views/auth.html',
  '/views/feed.html',
  '/views/profile.html',
  '/views/profile-verify.html',
  '/views/profile-interests.html',
  '/views/profile-complete.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/profile.js',
  '/js/profile-verify.js',
  '/js/data/countries.js',
  '/js/supabase-client.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event with different strategies based on file type
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Check if we're on localhost and skip caching entirely
  const url = new URL(event.request.url);
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    // On localhost, bypass cache completely for development
    return;
  }
  
  // Get the URL from the request
  const requestUrl = new URL(event.request.url);
  
  // Use network-first for HTML files to ensure fresh content
  if (requestUrl.pathname.endsWith('.html') || requestUrl.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Cache-first for other assets
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              // Clone the response
              const responseToCache = response.clone();

              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            })
            .catch(() => {
              // If both cache and network fail, serve offline page
              if (event.request.mode === 'navigate') {
                return caches.match('/');
              }
              
              return new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        })
    );
  }
});