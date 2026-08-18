// Minimal IndexedDB-backed queue so writes made while offline aren't lost.
// Failed network requests (not HTTP errors) are queued and retried on reconnect.

const DB_NAME = "farm-offline-queue";
const STORE_NAME = "requests";
const RETRY_INTERVAL_MS = 20000;

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

async function withStore(mode, callback) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const result = callback(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

function getAllEntries() {
  return new Promise(async (resolve, reject) => {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function notifyListeners() {
  getAllEntries().then((entries) => {
    window.dispatchEvent(
      new CustomEvent("offline-queue-changed", { detail: { count: entries.length } })
    );
  });
}

export function subscribeQueueCount(callback) {
  const handler = (event) => callback(event.detail.count);
  window.addEventListener("offline-queue-changed", handler);
  getAllEntries().then((entries) => callback(entries.length));
  return () => window.removeEventListener("offline-queue-changed", handler);
}

export async function getQueueCount() {
  const entries = await getAllEntries();
  return entries.length;
}

function isNetworkError(error) {
  return error instanceof TypeError;
}

async function queueEntry({ url, method, headers, body, description }) {
  await withStore("readwrite", (store) => {
    store.add({
      url,
      method,
      headers: headers ? Object.fromEntries(new Headers(headers).entries()) : {},
      body: typeof body === "string" ? body : body ? JSON.stringify(body) : null,
      description: description || "",
      createdAt: Date.now(),
    });
  });
  notifyListeners();
  scheduleFlush();
}

// Sends a write request; if the network is unreachable, queues it for later
// instead of losing the user's change. Returns a Response either way.
export async function submitWrite(url, options = {}, description = "") {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    await queueEntry({
      url,
      method: options.method || "GET",
      headers: options.headers,
      body: options.body,
      description,
    });
    return new Response(JSON.stringify({ queued: true }), {
      status: 202,
      headers: { "Content-Type": "application/json" },
    });
  }
}

let flushing = false;

export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    let entries = await getAllEntries();
    entries.sort((a, b) => a.id - b.id);
    for (const entry of entries) {
      try {
        const response = await fetch(entry.url, {
          method: entry.method,
          headers: entry.headers,
          body: entry.body,
        });
        if (!response.ok) {
          console.warn("Queued request rejected by server, dropping:", entry.description);
        }
        await withStore("readwrite", (store) => store.delete(entry.id));
        notifyListeners();
      } catch (error) {
        if (isNetworkError(error)) {
          // Still offline — stop and retry later, preserving order.
          break;
        }
        await withStore("readwrite", (store) => store.delete(entry.id));
        notifyListeners();
      }
    }
  } finally {
    flushing = false;
  }
}

function scheduleFlush() {
  if (navigator.onLine) flushQueue();
}

window.addEventListener("online", () => flushQueue());
window.addEventListener("load", () => flushQueue());
setInterval(() => {
  if (navigator.onLine) flushQueue();
}, RETRY_INTERVAL_MS);
