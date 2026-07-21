import { useEffect, useState } from "react";

export default function Dashboard() {
  const [summary, setSummary] = useState({
    totalSheep: 150,
    wernVilla: 0,
    gellidywyll: 150,
    openTasks: 0,
  });

  const [activity, setActivity] = useState([]);

  useEffect(() => {
    fetch("https://wern-villa-api.onrender.com/summary")
      .then((response) => response.json())
      .then((data) => {
        setSummary(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch("https://wern-villa-api.onrender.com/activity")
      .then((response) => response.json())
      .then((data) => {
        setActivity(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  return (
    <div
      style={{
        background: "#121212",
        minHeight: "100vh",
        color: "white",
        padding: "20px",
      }}
    >
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        🐑 Dashboard
      </h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "16px",
          marginBottom: "20px",
          border: "1px solid #333",
        }}
      >
        <h2
          style={{
            marginTop: 0,
            color: "#03a9f4",
          }}
        >
          🟢 Farm Status
        </h2>

        <p>Sheep Status: Healthy</p>
        <p>Database: Connected ✅</p>
        <p>Open Tasks: {summary.openTasks}</p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <DashboardCard
          title="🐑 Total Sheep"
          value={summary.totalSheep}
        />

        <DashboardCard
          title="🏡 Wern Villa"
          value={summary.wernVilla}
        />

        <DashboardCard
          title="🚜 Gellidywyll"
          value={summary.gellidywyll}
        />

        <DashboardCard
          title="📋 Open Tasks"
          value={summary.openTasks}
        />
      </div>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "16px",
          border: "1px solid #333",
        }}
      >
        <h2
          style={{
            color: "#03a9f4",
            marginTop: 0,
          }}
        >
          🚜 Recent Activity
        </h2>

        {activity.length === 0 ? (
          <p>No activity yet.</p>
        ) : (
          activity.map((item) => (
            <div
              key={item.id}
              style={{
                marginBottom: "12px",
                paddingBottom: "12px",
                borderBottom: "1px solid #333",
              }}
            >
              <strong>
                {item.number} sheep moved
              </strong>

              <br />

              {item.fromLocation}
              {" → "}
              {item.toLocation}

              <br />

              <small>{item.moveDate}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DashboardCard({ title, value }) {
  return (
    <div
      style={{
        background: "#1f1f1f",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid #333",
      }}
    >
      <div
        style={{
          color: "#03a9f4",
          marginBottom: "10px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
        }}
      >
        {value}
      </div>
    </div>
  );
}