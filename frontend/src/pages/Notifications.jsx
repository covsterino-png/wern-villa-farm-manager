import { useState, useEffect } from "react";
import { API, fetchJson } from "../api";
import { pushSupported, getPushSubscription, subscribeToPush } from "../push";

export default function Notifications({ user }) {
  const [notifications, setNotifications] =
    useState([]);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  const load = async () => {
    const data = await fetchJson(`/notifications?user=${user}`);
    setNotifications(data);
  };

  useEffect(() => {
    load();
    getPushSubscription().then((sub) => setPushEnabled(!!sub));
  }, []);

  const enablePush = async () => {
    setPushMessage("");
    const result = await subscribeToPush(user);
    if (result.ok) {
      setPushEnabled(true);
    } else if (result.reason === "denied") {
      setPushMessage("Notifications were blocked. Enable them in your browser/phone settings for this site.");
    } else if (result.reason === "unsupported") {
      setPushMessage("Push notifications aren't supported on this browser. On iPhone, add this app to your Home Screen first (Share → Add to Home Screen), then try again.");
    } else {
      setPushMessage("Couldn't enable push notifications right now.");
    }
  };

  const markRead = async (id) => {
    await fetch(`${API}/notifications/${id}/read`, { method: "PUT" });

    load();
  };

  return (
    <div>
      <h1 style={{ color: "#03a9f4" }}>🔔 Notifications</h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        {pushEnabled ? (
          <p style={{ color: "#8bc34a", margin: 0 }}>✅ Push notifications are on for this device.</p>
        ) : (
          <>
            <button
              onClick={enablePush}
              style={{
                background: "#03a9f4",
                color: "white",
                border: "none",
                padding: "10px 16px",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              🔔 Enable push notifications on this device
            </button>
            {pushMessage && <p style={{ color: "#ffcc80" }}>{pushMessage}</p>}
          </>
        )}
      </div>

      <div
        style={{
          background: "#1f1f1f",
          padding: 20,
          borderRadius: 12,
        }}
      >
        {notifications.length === 0 && (
          <div style={{ color: "#aaa" }}>No notifications</div>
        )}

        {notifications.map((n) => (
          <div
            key={n.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 12,
              background: n.read ? "#141414" : "#232323",
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <div>
              <div style={{ fontWeight: "bold" }}>{n.title}</div>
              <div style={{ color: "#ccc" }}>{n.message}</div>
              <div style={{ color: "#777", fontSize: "0.8rem" }}>{n.createdDate}</div>
            </div>

            <div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  style={{
                    background: "#4caf50",
                    color: "white",
                    border: "none",
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    marginRight: 8,
                  }}
                >
                  Mark read
                </button>
              )}

              <a
                href="#"
                style={{ color: "#03a9f4", textDecoration: "none" }}
              >
                Open
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
