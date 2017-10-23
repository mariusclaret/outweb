importScripts("/firebase.js");

firebase.initializeApp({
    apiKey: "AIzaSyDBatbo2HFNFFqPJc2AqfM0nBC5GaAFnfw",
    authDomain: "outweb-997a6.firebaseapp.com",
    databaseURL: "https://outweb-997a6.firebaseio.com",
    projectId: "outweb-997a6",
    storageBucket: "outweb-997a6.appspot.com",
    messagingSenderId: "70974067345"
});

const messaging = firebase.messaging();
const cache_name = "v5.0";
const fine_caches = [cache_name];
const static_files = [
    "/",
    "/firebase.js",
    "/script.js",
    "/ripple.js",
    "/style.css",
    "/index.html",
    "/failure_banner.png",
    "/failure_icon.png",
    "/failure_profile.png"
];

self.addEventListener("install", function (event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(cache_name).then(function (cache) {
            return cache.addAll(static_files);
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            Promise.all(
                keys.map(function (key) {
                    if (!fine_caches.includes(key)) {
                        return caches.delete(key);
                    }
                })
            );
        })
    )
});

self.addEventListener("fetch", function (event) {
    const url = new URL(event.request.url);
    if (url.origin == location.origin) {
        event.respondWith(
            caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            })
        );
    }
});