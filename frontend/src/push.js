import { API, fetchJson } from "./api";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function pushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushSubscription() {
  if (!pushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(user) {
  if (!pushSupported()) {
    return { ok: false, reason: "unsupported" };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { ok: false, reason: "denied" };
    }

    const { publicKey } = await fetchJson("/push/vapid-public-key");
    if (!publicKey) {
      return { ok: false, reason: "not-configured" };
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const saveResponse = await fetch(`${API}/push/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: user, subscription: subscription.toJSON() }),
    });

    if (!saveResponse.ok) {
      const errorBody = await saveResponse.json().catch(() => ({}));
      return { ok: false, reason: "error", message: errorBody.error || `Server rejected subscription (${saveResponse.status})` };
    }

    return { ok: true };
  } catch (error) {
    console.error("Push subscription failed:", error);
    return { ok: false, reason: "error", message: error.message };
  }
}

export async function unsubscribeFromPush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await fetch(`${API}/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  });
  await subscription.unsubscribe();
}
