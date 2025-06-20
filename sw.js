const CACHE_NAME = 'hotelai-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/logo.png',
    '/icons/icon-32.png',
    '/icons/icon-64.png',
    '/icons/icon-128.png',
    '/icons/icon-256.png',
    '/icons/icon-512.png',
    '/icons/apple-icon-180.png',
    OFFLINE_URL,
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/@mdi/font@6.5.95/css/materialdesignicons.min.css',
    'https://unpkg.com/vue@3/dist/vue.global.prod.js'
];

// Install event - cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                return fetch(event.request).then(
                    response => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(() => {
                    // If the network is unavailable, try to return the offline page
                    if (event.request.mode === 'navigate') {
                        return caches.match(OFFLINE_URL);
                    }
                });
            })
    );
});

// Background sync for offline messages
self.addEventListener('sync', event => {
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
});

// Push notification handling
self.addEventListener('push', event => {
    const options = {
        body: event.data.text(),
        icon: '/icons/icon-128.png',
        badge: '/icons/icon-32.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Message',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            },
        ]
    };

    event.waitUntil(
        self.registration.showNotification('HotelAI Assistant', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: 'window'
        })
        .then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});

// Helper function to sync offline messages
async function syncMessages() {
    try {
        const messagesDb = await openDB('offlineMessages', 1);
        const messages = await messagesDb.getAll('messages');
        
        for (const message of messages) {
            try {
                await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${message.token}`
                    },
                    body: JSON.stringify(message)
                });
                
                await messagesDb.delete('messages', message.id);
            } catch (error) {
                console.error('Failed to sync message:', error);
            }
        }
    } catch (error) {
        console.error('Error syncing messages:', error);
    }
}

// Helper function to open IndexedDB
function openDB(dbName, version) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('messages')) {
                db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
} 