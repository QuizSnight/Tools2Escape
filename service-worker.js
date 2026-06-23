const CACHE_NAME = "tools2escape-v28";
const SHARE_DB_NAME = "tools2escape-share-target";
const SHARE_DB_VERSION = 1;
const SHARE_STORE_NAME = "shares";
const SHARE_PENDING_KEY = "pending";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./src/config.js",
  "./src/seed-data.js",
  "./src/planning-data.js",
  "./src/app.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method === "POST" && url.searchParams.get("share-target") === "receive") {
    event.respondWith(receiveSharedBooking(request));
    return;
  }

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

async function receiveSharedBooking(request) {
  const redirectUrl = new URL("./?share-target=pending", self.registration.scope);

  try {
    const form = await request.formData();
    const files = form.getAll("files")
      .filter((entry) => entry instanceof File && entry.size)
      .map((file) => ({
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
        blob: file,
      }));

    await savePendingShare({
      id: SHARE_PENDING_KEY,
      title: String(form.get("title") || ""),
      text: String(form.get("text") || ""),
      url: String(form.get("url") || ""),
      files,
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Shared booking could not be stored.", error);
    redirectUrl.searchParams.set("share-target", "error");
  }

  return Response.redirect(redirectUrl.href, 303);
}

function savePendingShare(payload) {
  return openShareDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(SHARE_STORE_NAME, "readwrite");
    transaction.objectStore(SHARE_STORE_NAME).put(payload);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  }));
}

function openShareDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SHARE_DB_NAME, SHARE_DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SHARE_STORE_NAME)) {
        database.createObjectStore(SHARE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
