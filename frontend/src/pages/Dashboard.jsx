import { useEffect, useState } from "react";

export default function Dashboard({ setPage }) {
  const [summary, setSummary] = useState({
    totalSheep: 150,
    wernVilla: 0,
    gellidywyll: 150,
    openTasks: 0,
  });

  const [activity, setActivity] = useState([]);

  const [fieldCount, setFieldCount] =
    useState(0);

  const [treatmentCount, setTreatmentCount] =
    useState(0);

  const [withdrawalCount, setWithdrawalCount] =
    useState(0);

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/summary"
    )
      .then((response) => response.json())
      .then((data) => {
        setSummary(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/activity"
    )
      .then((response) => response.json())
      .then((data) => {
        setActivity(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/fields-count"
    )
      .then((response) => response.json())
      .then((data) => {
        setFieldCount(data.count);
      })
      .catch(() => {});

    fetch(
      "https://wern-villa-api.onrender.com/treatments-count"
    )
      .then((response) => response.json())
      .then((data) => {
        setTreatmentCount(data.count);
      })
      .catch(() => {});

    fetch(
      "https://wern-villa-api.onrender.com/withdrawals-count"
    )
      .then((response) => response.json())
      .then((data) => {
        setWithdrawalCount(data.count);
      })
      .catch(() => {});
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
          background:
            "linear-gradient(135deg, #03a9f4, #1565c0)",
          padding: "30px",
          borderRadius: "16px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "white",
          }}
        >
          Welcome to Wern Villa Farm Manager
        </h2>

        <p
          style={{
            marginTop: "10px",
            color: "white",
          }}
        >
          Sheep, treatments, tasks and movements
          all in one place.
        </p>
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
          icon="🐑"
          title="Total Sheep"
          value={summary.totalSheep}
          colour="#03a9f4"
        />

        <DashboardCard
          icon="🏡"
          title="Wern Villa"
          value={summary.wernVilla}
          colour="#4caf50"
        />

        <DashboardCard
          icon="🚜"
          title="Gellidywyll"
          value={summary.gellidywyll}
          colour="#ff9800"
        />

        <DashboardCard
          icon="📋"
          title="Open Tasks"
          value={summary.openTasks}
          colour="#e91e63"
          onClick={() => setPage("tasks")}
        />

        <DashboardCard
          icon="🌱"
          title="Fields"
          value={fieldCount}
          colour="#8bc34a"
          onClick={() => setPage("farm-map")}
        />

        <DashboardCard
          icon="💉"
          title="Treatments"
          value={treatmentCount}
          colour="#9c27b0"
          onClick={() =>
            setPage("treatments")
          }
        />

        <DashboardCard
          icon="⚠️"
          title="Withdrawals"
          value={withdrawalCount}
          colour="#f44336"
          onClick={() =>
            setPage("treatments")
          }
        />
      </div>

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
                borderBottom:
                  "1px solid #333",
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

function DashboardCard({
  icon,
  title,
  value,
  colour,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#1f1f1f",
        borderRadius: "16px",
        padding: "25px",
        border: `2px solid ${colour}`,
        boxShadow: `0 0 15px ${colour}20`,
        cursor: onClick
          ? "pointer"
          : "default",
        transition: "0.2s",
      }}
    >
      <div
        style={{
          fontSize: "2rem",
          marginBottom: "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#aaa",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "2.4rem",
          fontWeight: "bold",
          color: colour,
          marginTop: "10px",
        }}
      >
        {value}
      </div>
    </div>
  );
}