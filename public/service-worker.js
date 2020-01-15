importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');

// cache / request
workbox.routing.registerRoute(
    '/',
    new workbox.strategies.StaleWhileRevalidate()
);

// cache html and javascript
workbox.routing.registerRoute(
    /\.(?:js|html)$/,
    new workbox.strategies.StaleWhileRevalidate()
);

// cache css files but revalidate them
workbox.routing.registerRoute(
    /\.css$/,
    new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'css-cache',
    })
);

// cache image files with an expiration timer
workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    new workbox.strategies.CacheFirst({
        cacheName: 'image-cache',
        plugins: [
            new workbox.expiration.Plugin({
                // Cache only 20 images.
                maxEntries: 20,
                // Cache for a maximum of a week.
                maxAgeSeconds: 7 * 24 * 60 * 60,
            })
        ],
    })
);

// use the backgroundSync Plugin to send catch post requests on /notes/
workbox.routing.registerRoute(
    /\/notes.*/,
    new workbox.strategies.NetworkOnly({
        plugins: [
            new workbox.backgroundSync.Plugin('noteUpdateQueue', {
                maxRetentionTime: 24 * 60, // Retry for max of 24 Hours (specified in minutes),
                onSync: (ev) => {
                    ev.queue.replayRequests().then(() => {
                        sendToClients("Back online. Notes are sent to server");
                    });
                }
            })            
        ]
    }),
    'POST'
);

// get notes from the network if available, else get them from cache
workbox.routing.registerRoute(
    /\/notes.*/,
    new workbox.strategies.NetworkFirst({
        cacheName: 'notes-cache',
    }),
    'GET'
);


// send a message to all clients (i.e. tabs)
function sendToClients(msg) {
    clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(msg);
        })
    })
}