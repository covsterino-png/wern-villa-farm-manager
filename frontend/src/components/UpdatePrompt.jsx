import { useRegisterSW } from "virtual:pwa-register/react";

// Shows a banner when a new app version is ready, and forces a reload to pick it up.
// This is the recovery path for iOS Safari, which can silently drop the old
// service worker/cache after ~7 days of inactivity and otherwise leave a blank screen.
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => registration.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: "#0f172a",
        color: "#fff",
        borderRadius: 12,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
      }}
    >
      <span>A new version of Farm Manager is available.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: "#2563eb",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Reload
      </button>
    </div>
  );
}
