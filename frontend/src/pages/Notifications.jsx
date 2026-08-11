import { useState, useEffect } from "react";

export default function Notifications({ user }) {
  const [notifications, setNotifications] =
    useState([]);

  const load = async () => {
    const res = await fetch(
      `https://wern-villa-api.onrender.com/notifications?user=${user}`
    );
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    await fetch(
      `https://wern-villa-api.onrender.com/notifications/${id}/read`,
      { method: "PUT" }
    );

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
