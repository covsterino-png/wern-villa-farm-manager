import { useEffect, useState } from "react";
import { API } from "../api";

export default function RecentActivity() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/recent-history`)
      .then((response) => response.json())
      .then((data) => setActivity(Array.isArray(data) ? data : []))
      .catch((error) => console.error(error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ textAlign: "left" }}>
      <h2 style={{ color: "#03a9f4", marginTop: 0 }}>
        🚜 Recent Activity ({activity.length})
      </h2>
      {loading ? (
        <p>Loading...</p>
      ) : activity.length === 0 ? (
        <p>No activity yet.</p>
      ) : (
        activity.map((item) => (
          <div
            key={`${item.source || "sheep"}-${item.id}`}
            style={{
              marginBottom: "12px",
              paddingBottom: "12px",
              borderBottom: "1px solid #333",
            }}
          >
            <strong>{item.eventType}</strong>
            <br />
            {item.details}
            <br />
            <small>{item.eventDate}</small>
          </div>
        ))
      )}
    </div>
  );
}
