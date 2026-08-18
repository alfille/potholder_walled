/* Service Worker with strategy:
    1. Add selected files to cache
    2. Hook into fetch only for those files
    3. Get from network and return plus update cache
    4. Fall back to cache if network fails
    * */
    
const cacheName = "PotHolder";
const cacheList = [
    "/",
    "/index.html",
    "/sw.js",
    "/images/NoPicture.png",
    "/images/pot400.jpg",
    "/images/wheel.png",
    "/js/app.js",
    "/js/doc_data.js",
    "/js/pouchdb-9.0.0.min.js",
    "/js/pouchdb.quick-search.min.js",
    "/js/qrious.min.js",
    "/style/base.css",
    "/style/print.css",
    ];

// preload cache
self.addEventListener('install', event => 
    event
    .waitUntil(
        caches.open(cacheName)
        .then( (cache) => cache.addAll( cacheList ) )
        .catch( (err) => console.log("Error filling cache",err))
        )
);

// Selected Fetch
self.addEventListener('fetch', event => {
    if ( event.request.method === 'GET' ) {
        const url = new URL(event.request.url) ;
        if ( cacheList.includes(url.pathname) ) {
            event.respondWith(
                fetch(event.request)
                .then( response => {
                    if ( !response.ok ) {
                        throw 404;
                    }
                    const rc = response.clone() ;
                    caches.open(cacheName)
                    .then( cache => {
                        cache.put( event.request, rc );
                        cache.keys()
                        .then( keys =>
                            keys
                            .filter( key => !cacheList.includes(new URL(key.url).pathname))
                            .forEach( key => cache.delete(key.url) )
                            );
                        });
                    return response ;
                    })
                .catch( () => caches.match(event.request) )
            );
        }
    }
});
