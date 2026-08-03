import { useEffect, useState } from "react";

export default function Dashboard({ setPage }) {
  const [summary, setSummary] = useState({
    totalSheep: 0,
    wernVilla: 0,
    gellidywyll: 0,
    openTasks: 0,
  });

const [expandedTask, setExpandedTask] =
  useState(null);

  const [activity, setActivity] = useState([]);

  const [fieldCount, setFieldCount] =
    useState(0);

  const [treatmentCount, setTreatmentCount] =
    useState(0);

    const [todayTasks, setTodayTasks] =
  useState([]);
  useEffect(() => {
  fetch(
    "https://wern-villa-api.onrender.com/tasks/today"
  )
    .then((res) => res.json())
    .then((data) =>
      setTodayTasks(data)
    );
}, []);


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
  "https://wern-villa-api.onrender.com/recent-history"
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
  function completeTask(taskId) {
  fetch(
    `https://wern-villa-api.onrender.com/scheduled/${taskId}/complete`,
    {
      method: "PUT",
    }
  )
    .then((res) => res.json())
    .then(() => {
      return fetch(
        "https://wern-villa-api.onrender.com/tasks/today"
      );
    })
    .then((res) => res.json())
    .then((data) => {
      setTodayTasks(data);
    });
}

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
  🚜 Farm Control Centre
</h2>

<p
  style={{
    marginTop: "10px",
    color: "white",
  }}
>
  Manage sheep, groups, fields,
  treatments and tasks from one place.
</p>
      </div>
        <div
  style={{
    background: "#2b2b2b",
    padding: "20px",
    
    borderRadius: "12px",
    marginBottom: "20px",
  }}
>
<h2
  style={{
    color: "#03a9f4",
    marginTop: 0,
  }}
>
  📋 Today's tasks
</h2>

  {todayTasks.length === 0 ? (
<p
  style={{
    color: "#4caf50",
    fontWeight: "bold",
    fontSize: "1.1rem",
  }}
>
  ✅ All tasks complete
</p>
  ) : (
    todayTasks.map((task) => (
<div
  style={{
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "20px",
border: "1px solid #4caf50",
    textAlign: "center",
  }}
>
        <strong>
          🐑 {task.sheepName}
        </strong>
{task.caseId && (
  <>
    <br />
    <span
      style={{
        color: "#ff9800",
        fontWeight: "bold",
      }}
    >
      ⚠️ Health Case Active
    </span>
  </>
)}
        <br />

        {task.eventType}

        <br />

        <small>
          Due: {task.dueDate}
        </small>
        <br />
<button
  onClick={() =>
    setExpandedTask(
      expandedTask === task.id
        ? null
        : task.id
    )
  }
>
  {expandedTask === task.id
    ? "▲ Hide"
    : "▼ Details"}
</button>
{expandedTask === task.id && (
  <div
    style={{
      background: "#333",
      padding: "12px",
      marginTop: "10px",
      borderRadius: "8px",
    }}
  >
    <p>
      <strong>Sheep:</strong>
      {" "}
      {task.sheepName}
    </p>

    <p>
      <strong>Task:</strong>
      {" "}
      {task.eventType}
    </p>

<p>
  <strong>Related:</strong>
  {task.notes}
</p>

{task.caseId && (
  <div
    style={{
      marginTop: "10px",
      padding: "8px",
      background: "#1b5e20",
      borderRadius: "8px",
      color: "white",
      fontWeight: "bold",
    }}
  >
    🩺 Linked Health Case #{task.caseId}
  </div>
)}

    <p>
      <strong>Repeats Every:</strong>
      {" "}
      {task.repeatEvery}
      {" "}
      days
    </p>

    <p>
      <strong>Status:</strong>
      {" "}
      {task.status}
    </p>
  </div>
)}
<button
  onClick={() =>
    completeTask(task.id)
  }
  style={{
    background: "#4caf50",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
  }}
>
  ✅ Complete
</button>
      </div>
    ))
  )}
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
  icon="👥"
  title="Groups"
  value={summary.groups ?? 0}
  colour="#4caf50"
  onClick={() => setPage("flock-register")}
/>

<DashboardCard
  icon="🐑"
  title="Total Sheep"
  value={summary.totalSheep}
  colour="#03a9f4"
  onClick={() => setPage("sheep-register")}
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
  subtitle={`${summary.occupiedFields} Occupied`}
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
    📊 Farm Snapshot
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "15px",
    }}
  >
    <div>
      🐑 Sheep: {summary.totalSheep}
    </div>

    <div>
      👥 Groups: {summary.groups ?? 0}
    </div>

    <div>
      🌱 Fields: {fieldCount}
    </div>

    <div>
      ⚠️ Withdrawals: {withdrawalCount}
    </div>
  </div>
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
  {item.eventType}
</strong>

<br />

{item.details}

<br />

<small>{item.eventDate}</small>
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
  subtitle,
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
      {subtitle && (
  <div
    style={{
      fontSize: "0.9rem",
      color: "#aaa",
      marginTop: "6px",
    }}
  >
    {subtitle}
  </div>
)}
    </div>
  );
}