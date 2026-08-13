import { useEffect, useState } from "react";
import { API } from "../api";

export default function Dashboard({ setPage }) {
  const [summary, setSummary] = useState({
    totalSheep: 0,
    wernVilla: 0,
    gellidywyll: 0,
    openTasks: 0,
  });
  const [financeBalance, setFinanceBalance] = useState({ David: 0, Gemma: 0 });

const [expandedTask, setExpandedTask] =
  useState(null);

  const [caseActions, setCaseActions] =
  useState({});

  const [medicines, setMedicines] =
  useState([]);

const [selectedMedicine, setSelectedMedicine] =
  useState({});


  const [actionType, setActionType] =
  useState({});

const [actionNotes, setActionNotes] =
  useState({});

  const [activity, setActivity] = useState([]);

  const [fieldCount, setFieldCount] =
    useState(0);

  const [treatmentCount, setTreatmentCount] =
    useState(0);
    const [showTasks, setShowTasks] =
  useState(false);
  const [showActivity, setShowActivity] =
  useState(false);
``

    const [todayTasks, setTodayTasks] =
  useState([]);

  useEffect(() => {
  fetch(
    `${API}/medicines`
  )
    .then((res) => res.json())
    .then((data) => {
      setMedicines(data);
    });
}, []);
  useEffect(() => {
  fetch(
    `${API}/tasks/today`
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
      `${API}/summary`
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
  `${API}/recent-history`
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
    fetch(`${API}/transactions`)
      .then((res) => res.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : data?.rows || [];
        const nextBalance = rows.reduce((acc, t) => {
          if (t.settled) return acc;
          const payer = t.payer;
          const payee = t.payee;
          const amount = Number(t.amount) || 0;

          if (!payer || !payee || !["David", "Gemma"].includes(payer) || !["David", "Gemma"].includes(payee)) {
            return acc;
          }

          const owed = t.shared ? amount / 2 : amount;
          acc[payer] = (acc[payer] || 0) + owed;
          acc[payee] = (acc[payee] || 0) - owed;
          return acc;
        }, { David: 0, Gemma: 0 });

        setFinanceBalance(nextBalance);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    fetch(
      `${API}/fields-count`
    )
      .then((response) => response.json())
      .then((data) => {
        setFieldCount(data.count);
      })
      .catch(() => {});

    fetch(
      `${API}/treatments-count`
    )
      .then((response) => response.json())
      .then((data) => {
        setTreatmentCount(data.count);
      })
      .catch(() => {});

    fetch(
      `${API}/withdrawals-count`
    )
      .then((response) => response.json())
      .then((data) => {
        setWithdrawalCount(data.count);
      })
      .catch(() => {});
  }, []);
  function stopRecurring(taskId) {
  fetch(`${API}/scheduled/${taskId}/stop`, { method: "PUT" })
    .then((res) => res.json())
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => setTodayTasks(data));
}

function loadCaseActions(caseId) {
  fetch(`${API}/health-cases/${caseId}/actions`)
    .then((res) => res.json())
    .then((data) => {
      setCaseActions((prev) => ({ ...prev, [caseId]: data }));
    });
}
  function completeTask(taskId) {
  fetch(`${API}/scheduled/${taskId}/complete`, { method: "PUT" })
    .then((res) => res.json())
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => setTodayTasks(data));
}
function saveActionFromDashboard(
  caseId,
  taskId,
  task
) {
  fetch(`${API}/health-cases/${caseId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  actionType:
    actionType[taskId] ||
    "Observation",

  notes:
    actionType[taskId] ===
    "Injection"
      ? `Medicine: ${
          selectedMedicine[
            taskId
          ] || "Unknown"
        }

${actionNotes[taskId] || ""}`
      : actionNotes[
          taskId
        ] || "",
}),
    }
  )
.then((res) => res.json())
.then(() => {

  if (actionType[taskId] === "Injection") {
    fetch(`${API}/treatments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
  groupName:
    "Individual Sheep",

  sheepId:
    task.sheepId,

  sheepName:
    task.sheepName,

  treatment:
    selectedMedicine[taskId],

  treatmentDate:
    new Date().toLocaleDateString(),

  withdrawalDays:
  medicines.find(
    (m) =>
      m.name ===
      selectedMedicine[taskId]
  )?.withdrawalDays || 0,

  cost: 0,

  notes:
    actionNotes[taskId] || "",

  administeredBy:
    localStorage.getItem("user"),
}),
      }
    );
  }

  loadCaseActions(caseId);
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


        <div
  style={{
    background: "#2b2b2b",
    padding: "12px",
    
    borderRadius: "12px",
    marginBottom: "12px",
  }}
>
<h2
  onClick={() =>
    setShowTasks(!showTasks)
  }
  style={{
    color: "#03a9f4",
    marginTop: 0,
    cursor: "pointer",
  }}
>
  📋 Today's Tasks ({todayTasks.length})
  {" "}
  {showTasks ? "▲" : "▼"}
</h2>

{showTasks &&
(
todayTasks.length === 0 ? (<p
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
  onClick={() => {
    if (expandedTask === task.id) {
      setExpandedTask(null);
    } else {
      setExpandedTask(task.id);

      if (task.caseId) {
        loadCaseActions(task.caseId);
      }
    }
  }}
  style={{
    background:
      expandedTask === task.id
        ? "#ff9800"
        : "#03a9f4",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    marginTop: "10px",
    fontWeight: "bold",
boxShadow:
  expandedTask === task.id
    ? "0 0 12px rgba(255,152,0,0.4)"
    : "0 0 12px rgba(3,169,244,0.4)",
      }}
>
{expandedTask === task.id
  ? "📖 Close Record"
  : "🩺 Open Record"}
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
    {task.caseId && (
  <>
    <select
      value={
        actionType[task.id] ||
        "Observation"
      }
      onChange={(e) =>
        setActionType({
          ...actionType,
          [task.id]:
            e.target.value,
        })
      }
      style={{
        width: "100%",
        padding: "10px",
        marginTop: "10px",
      }}
    >
      <option>
        Observation
      </option>
      <option>
        Health Check
      </option>
      <option>
        Injection
      </option>
      <option>
        Foot Treatment
      </option>
      <option>
        Weight
      </option>
      <option>
        Vet Visit
      </option>
      <option>
        Note
      </option>
    </select>
          {actionType[task.id] ===
  "Injection" && (
  <select
    value={
      selectedMedicine[
        task.id
      ] || ""
    }
    onChange={(e) =>
      setSelectedMedicine({
        ...selectedMedicine,
        [task.id]:
          e.target.value,
      })
    }
    style={{
      width: "100%",
      padding: "10px",
      marginTop: "10px",
      borderRadius: "8px",
    }}
  >
    <option value="">
      Select Medicine
    </option>

    {medicines.map(
      (medicine) => (
        <option
          key={medicine.id}
          value={
            medicine.name
          }
        >
          {medicine.name}
        </option>
      )
    )}
  </select>
  
)}
{selectedMedicine[task.id] && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "12px",
      marginTop: "10px",
      borderRadius: "8px",
      border: "1px solid #444",
      textAlign: "left",
    }}
  >
    {(() => {
      const medicine =
        medicines.find(
          (m) =>
            m.name ===
            selectedMedicine[
              task.id
            ]
        );

      if (!medicine) {
        return null;
      }

      return (
        <>
          <div>
            💊 Dose:
            {" "}
            {medicine.doseRate}
          </div>

<div
  style={{
    marginTop: "6px",
    color: "#ff9800",
    fontWeight: "bold",
  }}
>
  ⚠️ Withdrawal:
  {medicine.withdrawalDays} days
</div>

          <div
            style={{
              marginTop: "6px",
            }}
          >
            💉 Method:
            {" "}
            {
              medicine.administrationMethod
            }
          </div>
        </>
      );
    })()}
  </div>
)}



    <textarea
      placeholder="Notes..."
      value={
        actionNotes[task.id] || ""
      }
      onChange={(e) =>
        setActionNotes({
          ...actionNotes,
          [task.id]:
            e.target.value,
        })
      }
      style={{
        width: "100%",
        minHeight: "80px",
        marginTop: "10px",
        borderRadius: "8px",
        padding: "10px",
      }}
    />

    <button
      onClick={() =>
        saveActionFromDashboard(
          task.caseId,
          task.id,
          task
        )
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "8px 12px",
        borderRadius: "8px",
        marginTop: "10px",
      }}
    >
      💾 Save Action
    </button>
    <h4
  style={{
    marginTop: "15px",
    color: "#03a9f4",
  }}
>
  Previous Actions
</h4>

{(caseActions[task.caseId] || []).map(
  (action) => (
    <div
      key={action.id}
      style={{
        background: "#1f1f1f",
        padding: "10px",
        borderRadius: "8px",
        marginTop: "8px",
        textAlign: "left",
      }}
    >
      <strong>
        {action.actionType}
      </strong>

      <br />

      {action.notes}

      <br />

      <small>
        {action.actionDate}
      </small>
    </div>
  )
)}

  </>
)}
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
{!!task.autoRepeat && (
  <button
    onClick={() =>
      stopRecurring(task.id)
    }
    style={{
      background: "#f44336",
      color: "white",
      border: "none",
      padding: "8px 12px",
      borderRadius: "8px",
      marginLeft: "10px",
      cursor: "pointer",
    }}
  >
    🛑 Stop Repeat
  </button>
)}
      </div>
    ))
  )
)}
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 768
        ? "repeat(2, 1fr)"
        : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
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
  subtitle="This Month"
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
<DashboardCard
  icon="�"
  title="David / Gemma"
  value={`£${Math.abs(financeBalance.David || financeBalance.Gemma || 0).toFixed(2)}`}
  subtitle={
    financeBalance.David > 0
      ? "David is owed"
      : financeBalance.Gemma > 0
        ? "Gemma is owed"
        : financeBalance.David < 0
          ? "Gemma owes David"
          : financeBalance.Gemma < 0
            ? "David owes Gemma"
            : "Balanced"
  }
  colour={financeBalance.David > 0 || financeBalance.Gemma > 0 ? "#4caf50" : "#03a9f4"}
  onClick={() => setPage("finances")}
/>

<DashboardCard
  icon="�📅"
  title="Calendar"
  value={4}
  subtitle="Upcoming"
  colour="#00bcd4"
  onClick={() =>
    setPage("calendar")
  }
/>

<DashboardCard
  icon="📝"
  title="Notes"
  value={0}
  subtitle="Lists"
  colour="#ff9800"
  onClick={() =>
    setPage("notes")
  }
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
  onClick={() =>
    setShowActivity(!showActivity)
  }
  style={{
    color: "#03a9f4",
    marginTop: 0,
    cursor: "pointer",
  }}
>
  🚜 Recent Activity ({activity.length})
  {" "}
  {showActivity ? "▲" : "▼"}
</h2>
{showActivity && (
  <>
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
  </>
)}      </div>
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
        padding: "16px",
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
          fontSize: "1.6rem",
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
          fontSize: "1.8rem",
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