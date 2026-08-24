import { useEffect, useState } from "react";
import { API } from "../api";

export default function Dashboard({ setPage }) {
  const [summary, setSummary] = useState({
    totalSheep: 0,
    wernVilla: 0,
    gellidywyll: 0,
    openTasks: 0,
  });

const [expandedTask, setExpandedTask] =
  useState(null);

  const [caseActions, setCaseActions] =
  useState({});

  const [medicines, setMedicines] =
  useState([]);

const [selectedMedicine, setSelectedMedicine] =
  useState({});

const [injectionVolume, setInjectionVolume] =
  useState({});

  const [repeatAfterCompletion, setRepeatAfterCompletion] =
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
  const [transactionCount, setTransactionCount] =
    useState(0);
  const [heroPoints, setHeroPoints] = useState({ balance: 0, pending: 0 });
    const [showTasks, setShowTasks] =
  useState(false);
  const [showActivity, setShowActivity] =
  useState(false);
``

    const [todayTasks, setTodayTasks] =
  useState([]);

  const [allSheep, setAllSheep] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskSheepQuery, setTaskSheepQuery] = useState("");
  const [taskSheep, setTaskSheep] = useState(null);
  const [newTaskType, setNewTaskType] = useState("Foot Trim");
  const [newTaskDate, setNewTaskDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskRepeatEvery, setNewTaskRepeatEvery] = useState("");
  const [newTaskCount, setNewTaskCount] = useState("1");
  const [savingTask, setSavingTask] = useState(false);

  useEffect(() => {
    if (!showAddTask || allSheep.length > 0) return;

    fetch(`${API}/sheep`)
      .then((res) => res.json())
      .then((data) => setAllSheep(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [showAddTask]);

    useEffect(() => {
      fetch(`${API}/hero-points`)
        .then((res) => res.json())
        .then((data) => {
          setHeroPoints({
            balance: data.balance ?? 0,
            pending: (data.redemptions || []).filter((item) => item.status === "requested").length,
          });
        })
        .catch(() => {});
    }, []);

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

    fetch(
      `${API}/transactions`
    )
      .then((response) => response.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : data?.rows || [];
        const unsettled = rows.filter((t) => !t.settled).length;
        setTransactionCount(unsettled);
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

function resetNewTask() {
  setShowAddTask(false);
  setTaskSheep(null);
  setTaskSheepQuery("");
  setNewTaskType("Foot Trim");
  setNewTaskDate(new Date().toISOString().slice(0, 10));
  setNewTaskNotes("");
  setNewTaskRepeatEvery("");
  setNewTaskCount("1");
}

function saveNewTask() {
  if (!taskSheep) {
    alert("Choose a sheep first.");
    return;
  }

  if (!newTaskType.trim()) {
    alert("Enter what the task is.");
    return;
  }

  if (!newTaskDate) {
    alert("Choose a due date.");
    return;
  }

  setSavingTask(true);

  fetch(`${API}/sheep/${taskSheep.id}/scheduled`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dueDate: newTaskDate,
      eventType: newTaskType.trim(),
      notes: newTaskNotes,
      repeatEvery: Number(newTaskRepeatEvery) || 0,
      numberOfEvents: Math.max(1, Number(newTaskCount) || 1),
      repeatUntilResolved: false,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      return res.json();
    })
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => {
      setTodayTasks(data);
      setShowTasks(true);
      resetNewTask();
    })
    .catch((error) => {
      console.error(error);
      alert("Could not save this task. Please try again.");
    })
    .finally(() => setSavingTask(false));
}

  function completeTask(taskId) {
    const repeatEvery = Number(repeatAfterCompletion[taskId]);
    const body = Number.isFinite(repeatEvery) && repeatEvery > 0
      ? JSON.stringify({ repeatEvery })
      : undefined;

    fetch(`${API}/scheduled/${taskId}/complete`, {
      method: "PUT",
      ...(body && {
        headers: { "Content-Type": "application/json" },
        body,
      }),
    })
    .then((res) => {
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      return res.json();
    })
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => setTodayTasks(data))
    .catch((error) => {
      console.error(error);
      alert("Could not complete this task. Please try again.");
    });
}
function saveActionFromDashboard(
  caseId,
  taskId,
  task
) {
  if (actionType[taskId] === "Injection") {
    if (!selectedMedicine[taskId]) {
      alert("Select a medicine before saving the injection.");
      return;
    }

    if (!(Number(injectionVolume[taskId]) > 0)) {
      alert("Enter the injected volume in ml.");
      return;
    }

    const medicine = medicines.find(
      (item) => item.name === selectedMedicine[taskId]
    );

    if (!(Number(medicine?.costPerMl) >= 0)) {
      alert("Set the medicine cost per ml in Settings first.");
      return;
    }

  }

  const selectedMedicineRecord = medicines.find(
    (item) => item.name === selectedMedicine[taskId]
  );
  const calculatedCost = Number(injectionVolume[taskId]) *
    Number(selectedMedicineRecord?.costPerMl || 0);
  const injectionDetails = actionType[taskId] === "Injection"
    ? `Medicine: ${selectedMedicine[taskId]}\nVolume: ${injectionVolume[taskId]} ml\nCost: £${calculatedCost.toFixed(2)}`
    : "";

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
      ? `${injectionDetails}${actionNotes[taskId] ? `\n${actionNotes[taskId]}` : ""}`
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

  volumeMl:
    Number(injectionVolume[taskId]),

  treatmentDate:
    new Date().toLocaleDateString(),

  withdrawalDays:
  medicines.find(
    (m) =>
      m.name ===
      selectedMedicine[taskId]
  )?.withdrawalDays || 0,

  cost: calculatedCost,

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

  const sheepQuery = taskSheepQuery.trim().toLowerCase();
  const sheepMatches =
    sheepQuery.length === 0
      ? []
      : allSheep
          .filter((item) =>
            `${item.name ?? ""} ${item.eid ?? ""} ${item.groupName ?? ""}`
              .toLowerCase()
              .includes(sheepQuery)
          )
          .slice(0, 8);

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

<button
  onClick={() => (showAddTask ? resetNewTask() : setShowAddTask(true))}
  style={{
    background: showAddTask ? "#777" : "#4caf50",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    marginBottom: showAddTask ? "12px" : 0,
  }}
>
  {showAddTask ? "✖ Cancel" : "➕ Add Task"}
</button>

{showAddTask && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "16px",
      textAlign: "left",
    }}
  >
    {taskSheep ? (
      <div style={{ marginBottom: "12px" }}>
        <strong>🐑 {taskSheep.name}</strong>
        {taskSheep.eid && (
          <small style={{ color: "#aaa" }}> ({taskSheep.eid})</small>
        )}
        <button
          onClick={() => {
            setTaskSheep(null);
            setTaskSheepQuery("");
          }}
          style={{
            background: "#333",
            color: "white",
            border: "none",
            padding: "4px 10px",
            borderRadius: "8px",
            cursor: "pointer",
            marginLeft: "10px",
          }}
        >
          Change
        </button>
      </div>
    ) : (
      <div style={{ marginBottom: "12px" }}>
        <input
          autoFocus
          value={taskSheepQuery}
          onChange={(e) => setTaskSheepQuery(e.target.value)}
          placeholder="Search sheep by name, EID or flock"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #777",
            boxSizing: "border-box",
          }}
        />

        {sheepMatches.map((item) => (
          <button
            key={item.id}
            onClick={() => setTaskSheep(item)}
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              background: "#2b2b2b",
              color: "white",
              border: "none",
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "6px",
            }}
          >
            🐑 {item.name}
            {item.eid && (
              <small style={{ color: "#aaa" }}> · {item.eid}</small>
            )}
            {item.groupName && (
              <small style={{ color: "#aaa" }}> · {item.groupName}</small>
            )}
          </button>
        ))}

        {sheepQuery.length > 0 && sheepMatches.length === 0 && (
          <p style={{ color: "#aaa", marginBottom: 0 }}>No sheep found.</p>
        )}
      </div>
    )}

    <input
      list="dashboard-task-types"
      value={newTaskType}
      onChange={(e) => setNewTaskType(e.target.value)}
      placeholder="Task (e.g. Foot Trim)"
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #777",
        marginBottom: "10px",
        boxSizing: "border-box",
      }}
    />
    <datalist id="dashboard-task-types">
      <option value="Foot Trim" />
      <option value="Worming" />
      <option value="Vaccination" />
      <option value="Injection" />
      <option value="Health Check" />
      <option value="Re-check" />
      <option value="Dagging" />
      <option value="Shearing" />
      <option value="Weigh" />
    </datalist>

    <label style={{ display: "block", color: "#aaa", marginBottom: "4px" }}>
      Due date
    </label>
    <input
      type="date"
      value={newTaskDate}
      onChange={(e) => setNewTaskDate(e.target.value)}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #777",
        marginBottom: "10px",
        boxSizing: "border-box",
      }}
    />

    <textarea
      value={newTaskNotes}
      onChange={(e) => setNewTaskNotes(e.target.value)}
      placeholder="Notes (optional)"
      rows={2}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #777",
        marginBottom: "10px",
        boxSizing: "border-box",
      }}
    />

    <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
      <input
        type="number"
        min="1"
        value={newTaskCount}
        onChange={(e) => setNewTaskCount(e.target.value)}
        placeholder="How many"
        style={{
          width: "50%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #777",
          boxSizing: "border-box",
        }}
      />
      <input
        type="number"
        min="1"
        value={newTaskRepeatEvery}
        onChange={(e) => setNewTaskRepeatEvery(e.target.value)}
        placeholder="Every N days"
        style={{
          width: "50%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #777",
          boxSizing: "border-box",
        }}
      />
    </div>

    <button
      onClick={saveNewTask}
      disabled={savingTask}
      style={{
        background: "#4caf50",
        color: "white",
        border: "none",
        padding: "12px 18px",
        borderRadius: "10px",
        cursor: savingTask ? "default" : "pointer",
        fontWeight: "bold",
        width: "100%",
      }}
    >
      {savingTask ? "Saving..." : "Save Task"}
    </button>

    <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
      Tasks dated in the future appear in this list on the day they fall due.
    </small>
  </div>
)}

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
{actionType[task.id] === "Injection" && (
  <>
    <input
      type="number"
      min="0.01"
      step="0.01"
      placeholder="Injected volume (ml)"
      value={injectionVolume[task.id] || ""}
      onChange={(e) =>
        setInjectionVolume({
          ...injectionVolume,
          [task.id]: e.target.value,
        })
      }
      style={{
        width: "100%",
        padding: "10px",
        marginTop: "10px",
        borderRadius: "8px",
      }}
    />
    <div style={{ marginTop: "10px", color: "#aaa" }}>
      Calculated cost: £{(
        Number(injectionVolume[task.id]) *
        Number(medicines.find((item) => item.name === selectedMedicine[task.id])?.costPerMl || 0)
      ).toFixed(2)}
    </div>
  </>
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
<input
  type="number"
  min="1"
  placeholder="Repeat in days"
  value={repeatAfterCompletion[task.id] || ""}
  onChange={(e) =>
    setRepeatAfterCompletion({
      ...repeatAfterCompletion,
      [task.id]: e.target.value,
    })
  }
  style={{
    width: "130px",
    padding: "8px",
    marginLeft: "10px",
    borderRadius: "8px",
    border: "1px solid #777",
  }}
/>
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
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
    marginBottom: "20px",
    width: "100%",
    boxSizing: "border-box",
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
  icon="💷"
  title="Finances"
  value={transactionCount}
  subtitle="Pending"
  colour="#ffd54f"
  onClick={() =>
    setPage("financial")
  }
/>

<DashboardCard
  icon="📅"
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

<DashboardCard
  icon="🏆"
  title="Hero Points"
  value={heroPoints.balance}
  subtitle={`${heroPoints.pending} Pending Redemption${heroPoints.pending === 1 ? "" : "s"}`}
  colour="#03a9f4"
  onClick={() => setPage("hero-points")}
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
        minWidth: 0,
        boxSizing: "border-box",
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