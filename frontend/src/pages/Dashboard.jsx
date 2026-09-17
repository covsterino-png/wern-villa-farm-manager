import { useEffect, useRef, useState } from "react";
import { API, fetchJson } from "../api";

const FEED_CELEBRATION_MESSAGES = {
  David: [
    "🏆 Every sheep fed, David — legend status confirmed!",
    "☕ Flock's full, David. Kettle's on you now.",
    "🐑 David 1, Hunger 0. Full flock, job done!",
  ],
  Gemma: [
    "🌟 All sheep fed, Gemma — the flock loves you!",
    "💪 Nailed it, Gemma. Full flock, zero fuss.",
    "🐑 Gemma clears the tally — every sheep fed today!",
  ],
  default: [
    "🎉 Every sheep fed today — nice work!",
    "🐑 Full flock, happy flock. Well done!",
  ],
};

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
  const [withdrawalCount, setWithdrawalCount] =
    useState(0);
  const [transactionCount, setTransactionCount] =
    useState(0);
  const [heroPoints, setHeroPoints] = useState({ balance: 0, pending: 0 });
  const [notesCount, setNotesCount] = useState(0);
  const [calendarUpcomingCount, setCalendarUpcomingCount] = useState(0);
  const [salesTotal, setSalesTotal] = useState(0);
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [unassignedSheep, setUnassignedSheep] = useState([]);
  const [smartDevices, setSmartDevices] = useState([]);

  const todayKey = () => new Date().toISOString().split("T")[0];
  const [feedTallyBatches, setFeedTallyBatches] = useState([]);
  const [feedBatchSize, setFeedBatchSize] = useState(25);
  const [showFeedTally, setShowFeedTally] = useState(
    () => localStorage.getItem("feedTallyMinimised") !== "true"
  );

  const [chickenCount, setChickenCount] = useState(0);
  const [eggCollections, setEggCollections] = useState([]);
  const [showEggModal, setShowEggModal] = useState(false);
  const [chickenCountInput, setChickenCountInput] = useState("0");
  const [savingChickenCount, setSavingChickenCount] = useState(false);
  const [eggInput, setEggInput] = useState("");
  const [savingEggs, setSavingEggs] = useState(false);

  function loadChickens() {
    fetch(`${API}/chickens`)
      .then((res) => res.json())
      .then((data) => {
        setChickenCount(Number(data?.count) || 0);
        setChickenCountInput(String(Number(data?.count) || 0));
      })
      .catch(() => {});
  }

  function loadEggCollections() {
    fetch(`${API}/egg-collections?date=${todayKey()}`)
      .then((res) => res.json())
      .then((data) => setEggCollections(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => {
    loadChickens();
    loadEggCollections();
  }, []);

  const eggsToday = eggCollections.reduce((sum, e) => sum + Number(e.count || 0), 0);

  function saveChickenCount() {
    const amount = Number(chickenCountInput);
    if (!Number.isFinite(amount) || amount < 0) {
      alert("Enter a valid chicken count.");
      return;
    }
    setSavingChickenCount(true);
    fetch(`${API}/chickens`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: amount }),
    })
      .then(loadChickens)
      .catch(() => {})
      .finally(() => setSavingChickenCount(false));
  }

  function addEggs() {
    const amount = Number(eggInput);
    if (!(amount > 0)) {
      alert("Enter a number of eggs greater than zero.");
      return;
    }
    setSavingEggs(true);
    fetch(`${API}/egg-collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: todayKey(),
        count: amount,
        collectedBy: localStorage.getItem("user"),
      }),
    })
      .then(loadEggCollections)
      .then(() => setEggInput(""))
      .catch(() => {})
      .finally(() => setSavingEggs(false));
  }

  function undoLastEggEntry() {
    fetch(`${API}/egg-collections/last?date=${todayKey()}`, { method: "DELETE" })
      .then(loadEggCollections)
      .catch(() => {});
  }

  function toggleFeedTally() {
    setShowFeedTally((prev) => {
      const next = !prev;
      localStorage.setItem("feedTallyMinimised", String(!next));
      return next;
    });
  }

  // Shared feed tally (server-backed so David and Gemma both see/update the same
  // running count of sheep fed today, replacing a physical calculator app).
  function loadFeedTally() {
    fetch(`${API}/feed-tally?date=${todayKey()}`)
      .then((res) => res.json())
      .then((data) => setFeedTallyBatches(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => {
    loadFeedTally();
    const interval = setInterval(loadFeedTally, 8000);
    return () => clearInterval(interval);
  }, []);

  const feedTallyTotal = feedTallyBatches.reduce((sum, b) => sum + Number(b.size || 0), 0);

  const [showFeedCelebration, setShowFeedCelebration] = useState(false);
  const [feedCelebrationMessage, setFeedCelebrationMessage] = useState("");
  const wasAllFedRef = useRef(false);

  useEffect(() => {
    const allFed = summary.totalSheep > 0 && feedTallyTotal >= summary.totalSheep;
    if (allFed && !wasAllFedRef.current) {
      const user = localStorage.getItem("user");
      const pool = FEED_CELEBRATION_MESSAGES[user] || FEED_CELEBRATION_MESSAGES.default;
      setFeedCelebrationMessage(pool[Math.floor(Math.random() * pool.length)]);
      setShowFeedCelebration(true);
    } else if (!allFed) {
      setShowFeedCelebration(false);
    }
    wasAllFedRef.current = allFed;
  }, [feedTallyTotal, summary.totalSheep]);

  function addFeedBatch(size) {
    const amount = Number(size);
    if (!(amount > 0)) return;
    fetch(`${API}/feed-tally`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: todayKey(),
        size: amount,
        createdBy: localStorage.getItem("user"),
      }),
    })
      .then(loadFeedTally)
      .catch(() => {});
  }

  function undoLastFeedBatch() {
    fetch(`${API}/feed-tally/last?date=${todayKey()}`, { method: "DELETE" })
      .then(loadFeedTally)
      .catch(() => {});
  }

  function resetFeedTally() {
    if (feedTallyBatches.length > 0 && !window.confirm("Reset today's feed tally to zero for everyone?")) {
      return;
    }
    fetch(`${API}/feed-tally?date=${todayKey()}`, { method: "DELETE" })
      .then(loadFeedTally)
      .catch(() => {});
  }

  useEffect(() => {
    fetch(`${API}/ai/config`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.devices)) {
          setSmartDevices(data.devices);
        }
      })
      .catch(() => {});
  }, []);

  async function toggleDashboardDevice(id) {
    try {
      const res = await fetchJson(`/ai/devices/${id}/toggle`, { method: "POST" });
      setSmartDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, state: res.state } : d))
      );
    } catch (err) {
      alert("Could not toggle device: " + err.message);
    }
  }

  function loadUnassigned() {
    fetch(`${API}/unassigned-sheep`)
      .then((res) => res.json())
      .then((data) => setUnassignedSheep(Array.isArray(data) ? data : []))
      .catch(() => {});
  }
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
  const [newTaskMedicine, setNewTaskMedicine] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [newTaskNotes, setNewTaskNotes] = useState("");
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
    fetch(`${API}/sales`)
      .then((res) => res.json())
      .then((data) => setSalesTotal(Number(data?.total) || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/notes`)
      .then((res) => res.json())
      .then((data) => setNotesCount(Array.isArray(data) ? data.length : 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API}/calendar-events`)
      .then((res) => res.json())
      .then((data) => {
        const todayKeyValue = todayKey();
        const upcoming = Array.isArray(data)
          ? data.filter((event) => event.date >= todayKeyValue).length
          : 0;
        setCalendarUpcomingCount(upcoming);
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

function cancelTask(task) {
  const confirmed = window.confirm(
    `Cancel "${task.eventType}" for ${task.sheepName}? It will be removed from the task list.`
  );
  if (!confirmed) return;

  fetch(`${API}/scheduled/${task.id}/cancel`, { method: "PUT" })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Cancel failed (${res.status})`);
      }
      return res.json();
    })
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => setTodayTasks(data))
    .catch((error) => {
      console.error(error);
      alert(`Could not cancel this task. ${error.message}`);
    });
}

function resetNewTask() {
  setShowAddTask(false);
  setTaskSheep(null);
  setTaskSheepQuery("");
  setNewTaskType("Foot Trim");
  setNewTaskMedicine("");
  setNewTaskDate(new Date().toISOString().slice(0, 10));
  setNewTaskNotes("");
}

function saveNewTask() {
  if (!taskSheep) {
    alert("Choose a sheep first.");
    return;
  }

  if (!newTaskType) {
    alert("Choose what the task is.");
    return;
  }

  if (newTaskType === "Injection" && !newTaskMedicine) {
    alert("Choose which medicine the injection is for.");
    return;
  }

  if (!newTaskDate) {
    alert("Choose a due date.");
    return;
  }

  const eventType =
    newTaskType === "Injection"
      ? `Injection - ${newTaskMedicine}`
      : newTaskType;

  setSavingTask(true);

  fetch(`${API}/sheep/${taskSheep.id}/scheduled`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dueDate: newTaskDate,
      eventType,
      notes: newTaskNotes,
      repeatUntilResolved: false,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
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
      alert(`Could not save this task. ${error.message}`);
    })
    .finally(() => setSavingTask(false));
}

  // Scheduled injection titles look like "Injection - Alamycin", plus a
  // " #2" or " 2 of 3" suffix once repeats have generated follow-ups.
  function injectionMedicineFor(task) {
    const match = /^Injection\s*-\s*(.+)$/i.exec(task.eventType || "");
    if (!match) return null;

    return match[1]
      .replace(/\s+#\d+$/, "")
      .replace(/\s+\d+\s+of\s+\d+$/i, "")
      .trim();
  }

  function completeTask(task) {
    const taskId = task.id;
    const medicine = injectionMedicineFor(task);
    const needsVolume = Boolean(medicine) && !task.caseId;
    const volume = Number(injectionVolume[taskId]);

    if (needsVolume && !(volume > 0)) {
      alert("Enter the injected volume in ml before completing.");
      return;
    }

    const medicineRecord = medicines.find((item) => item.name === medicine);

    const recordTreatment = needsVolume
      ? fetch(`${API}/treatments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupName: "Individual Sheep",
            sheepId: task.sheepId,
            sheepName: task.sheepName,
            treatment: medicine,
            volumeMl: volume,
            treatmentDate: new Date().toLocaleDateString(),
            withdrawalDays: medicineRecord?.withdrawalDays || 0,
            cost: volume * Number(medicineRecord?.costPerMl || 0),
            notes: task.notes || "",
            administeredBy: localStorage.getItem("user"),
          }),
        }).then((res) => {
          if (!res.ok) throw new Error(`Treatment save failed (${res.status})`);
          return res.json();
        })
      : Promise.resolve();

    const repeatEvery = Number(repeatAfterCompletion[taskId]);
    const body = Number.isFinite(repeatEvery) && repeatEvery > 0
      ? JSON.stringify({ repeatEvery })
      : undefined;

    recordTreatment
      .then(() =>
        fetch(`${API}/scheduled/${taskId}/complete`, {
          method: "PUT",
          ...(body && {
            headers: { "Content-Type": "application/json" },
            body,
          }),
        })
      )
    .then((res) => {
      if (!res.ok) throw new Error(`Complete failed (${res.status})`);
      return res.json();
    })
    .then(() => fetch(`${API}/tasks/today`))
    .then((res) => res.json())
    .then((data) => {
      setTodayTasks(data);
      setInjectionVolume((prev) => ({ ...prev, [taskId]: "" }));
    })
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

  const farmBreakdown = Object.entries(summary.sheepByFarm || {}).filter(
    ([farmName]) => farmName !== "Unassigned"
  );

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
        padding: window.innerWidth < 768 ? "12px" : "20px",
      }}
    >

      {smartDevices.length > 0 && (
        <div
          style={{
            background: "#1e293b",
            padding: "14px",
            borderRadius: "12px",
            marginBottom: "12px",
            border: "1px solid #334155",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h3 style={{ margin: 0, color: "#38bdf8", fontSize: "1.05rem" }}>
              ⚡ Smart Farm Controls
            </h3>
            <button
              onClick={() => setPage("floorplan")}
              style={{
                background: "transparent",
                color: "#38bdf8",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              View Floorplan →
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gap: "10px",
            }}
          >
            {smartDevices.map((dev) => (
              <button
                key={dev.id}
                onClick={() => toggleDashboardDevice(dev.id)}
                style={{
                  background: dev.state === "on" ? "#0284c7" : "#0f172a",
                  color: "white",
                  border: dev.state === "on" ? "2px solid #38bdf8" : "1px solid #334155",
                  padding: "10px 8px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ fontSize: "1.4rem" }}>{dev.icon || "💡"}</span>
                <strong style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{dev.name}</strong>
                <span style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  {dev.state === "on" ? "🟢 ON" : "⚪ OFF"}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          background: "#1e293b",
          padding: "14px",
          borderRadius: "12px",
          marginBottom: "12px",
          border: "1px solid #334155",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showFeedTally ? "10px" : 0 }}>
          <h3
            onClick={toggleFeedTally}
            style={{ margin: 0, color: "#38bdf8", fontSize: "1.05rem", cursor: "pointer" }}
          >
            🌾 Feed Tally ({feedTallyTotal}) {showFeedTally ? "▲" : "▼"}
          </h3>
          {showFeedTally && (
            <button
              onClick={resetFeedTally}
              style={{
                background: "transparent",
                color: "#f87171",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "4px 10px",
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Reset
            </button>
          )}
        </div>

        {showFeedTally && (
        <>
        <div style={{ textAlign: "center", marginBottom: "12px" }}>
          <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "white", lineHeight: 1 }}>
            {feedTallyTotal}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            sheep fed today{summary.totalSheep ? ` of ${summary.totalSheep}` : ""}
            {feedTallyBatches.length > 0 && ` · ${feedTallyBatches.length} batch${feedTallyBatches.length === 1 ? "" : "es"}`}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Batch size</span>
          <button
            onClick={() => setFeedBatchSize((n) => Math.max(1, n - 1))}
            style={{ background: "#0f172a", color: "white", border: "1px solid #334155", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
          >
            −
          </button>
          <input
            type="number"
            min="1"
            value={feedBatchSize}
            onChange={(e) => setFeedBatchSize(Math.max(1, Number(e.target.value) || 1))}
            style={{ width: "60px", textAlign: "center", padding: "6px", borderRadius: "8px", border: "1px solid #334155", background: "#0f172a", color: "white" }}
          />
          <button
            onClick={() => setFeedBatchSize((n) => n + 1)}
            style={{ background: "#0f172a", color: "white", border: "1px solid #334155", borderRadius: "8px", padding: "6px 12px", cursor: "pointer" }}
          >
            +
          </button>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => addFeedBatch(feedBatchSize)}
            style={{
              flex: 1,
              background: "#0284c7",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "10px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            ➕ Add batch of {feedBatchSize}
          </button>
          <button
            onClick={undoLastFeedBatch}
            disabled={feedTallyBatches.length === 0}
            style={{
              background: "#0f172a",
              color: "white",
              border: "1px solid #334155",
              padding: "12px 14px",
              borderRadius: "10px",
              cursor: feedTallyBatches.length === 0 ? "default" : "pointer",
              opacity: feedTallyBatches.length === 0 ? 0.5 : 1,
            }}
          >
            ↩ Undo
          </button>
        </div>
        </>
        )}
      </div>

      {showFeedCelebration && (
        <div className="sheep-egg">
          <span className="sheep-egg-sheep">🐑</span>
          <strong>All sheep fed!</strong>
          <span>{feedCelebrationMessage}</span>
          <button
            className="sheep-egg-close"
            onClick={() => setShowFeedCelebration(false)}
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

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

    <select
      value={newTaskType}
      onChange={(e) => {
        setNewTaskType(e.target.value);
        if (e.target.value !== "Injection") setNewTaskMedicine("");
      }}
      style={{
        width: "100%",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #777",
        marginBottom: "10px",
        boxSizing: "border-box",
      }}
    >
      <option value="Foot Trim">Foot Trim</option>
      <option value="Worming">Worming</option>
      <option value="Vaccination">Vaccination</option>
      <option value="Injection">Injection</option>
      <option value="Health Check">Health Check</option>
      <option value="Re-check">Re-check</option>
      <option value="Dagging">Dagging</option>
      <option value="Shearing">Shearing</option>
      <option value="Weigh">Weigh</option>
    </select>

    {newTaskType === "Injection" && (
      <select
        value={newTaskMedicine}
        onChange={(e) => setNewTaskMedicine(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #777",
          marginBottom: "10px",
          boxSizing: "border-box",
        }}
      >
        <option value="">Select medicine</option>
        {medicines.map((medicine) => (
          <option key={medicine.id} value={medicine.name}>
            {medicine.name}
          </option>
        ))}
      </select>
    )}

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
{injectionMedicineFor(task) && !task.caseId && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "12px",
      borderRadius: "8px",
      marginTop: "10px",
      textAlign: "left",
    }}
  >
    <div style={{ marginBottom: "6px" }}>
      💉 {injectionMedicineFor(task)}
    </div>

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
        borderRadius: "8px",
        border: "1px solid #777",
        boxSizing: "border-box",
      }}
    />

    <div style={{ marginTop: "8px", color: "#aaa" }}>
      Calculated cost: £{(
        Number(injectionVolume[task.id]) *
        Number(
          medicines.find(
            (item) => item.name === injectionMedicineFor(task)
          )?.costPerMl || 0
        )
      ).toFixed(2)}
    </div>
  </div>
)}
<button
  onClick={() =>
    completeTask(task)
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

<button
  onClick={() => cancelTask(task)}
  style={{
    background: "#555",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    marginLeft: "10px",
  }}
>
  ✖ Cancel
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

{summary.sheepByFarm?.Unassigned > 0 && (
  <div
    onClick={() => {
      setShowUnassigned(!showUnassigned);
      if (!showUnassigned) loadUnassigned();
    }}
    style={{
      color: "#ffcc80",
      cursor: "pointer",
      marginBottom: "12px",
    }}
  >
    ⚠️ {summary.sheepByFarm.Unassigned} sheep not in a known field —{" "}
    {showUnassigned ? "hide" : "show"}
  </div>
)}

{showUnassigned && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "16px",
      borderRadius: "12px",
      marginBottom: "12px",
      textAlign: "left",
    }}
  >
    <strong>Sheep not in a known field</strong>

    {unassignedSheep.length === 0 ? (
      <p style={{ color: "#aaa" }}>None.</p>
    ) : (
      unassignedSheep.map((sheep) => (
        <div
          key={sheep.id}
          style={{
            padding: "8px 0",
            borderBottom: "1px solid #333",
          }}
        >
          🐑 <strong>{sheep.name}</strong>
          {sheep.eid && (
            <small style={{ color: "#aaa" }}> · {sheep.eid}</small>
          )}
          <div style={{ color: "#ffcc80", fontSize: "0.85rem" }}>
            Field: {sheep.currentField ? `"${sheep.currentField}"` : "(none set)"}
          </div>
        </div>
      ))
    )}

    <small style={{ color: "#aaa", display: "block", marginTop: "8px" }}>
      Either the field name doesn't match any field record, or none is set.
      Fix it on the sheep's own page, or add the field on the Fields page.
    </small>
  </div>
)}

<div
  style={{
    display: "grid",
    gridTemplateColumns:
      window.innerWidth < 768
        ? "repeat(3, minmax(0, 1fr))"
        : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: window.innerWidth < 768 ? "8px" : "12px",
    marginBottom: "20px",
    width: "100%",
    boxSizing: "border-box",
  }}
><DashboardCard
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
  subtitle={
    farmBreakdown.length > 0
      ? farmBreakdown.map(([farmName, count]) => (
          <div key={farmName}>
            {farmName} {count}
          </div>
        ))
      : null
  }
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
  subtitle={`This month • ${withdrawalCount} active withdrawals`}
  value={treatmentCount}
  colour="#9c27b0"
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
  icon="💰"
  title="Income"
  value={`£${salesTotal.toFixed(0)}`}
  subtitle="Tax year sales"
  colour="#4caf50"
  onClick={() => setPage("sales")}
/>

<DashboardCard
  icon="🐔"
  title="Chickens"
  value={chickenCount}
  subtitle={`${eggsToday} egg${eggsToday === 1 ? "" : "s"} today`}
  colour="#ffb300"
  onClick={() => setShowEggModal(true)}
/>

<DashboardCard
  icon="📅"
  title="Calendar"
  value={calendarUpcomingCount}
  subtitle="Upcoming"
  colour="#00bcd4"
  onClick={() =>
    setPage("calendar")
  }
/>

<DashboardCard
  icon="📝"
  title="Notes"
  value={notesCount}
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
              key={`${item.source || "sheep"}-${item.id}`}
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

      {showEggModal && (
        <div
          onClick={() => setShowEggModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1f1f1f",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #333",
              maxWidth: "420px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              color: "white",
            }}
          >
            <h2 style={{ marginTop: 0, color: "#ffb300" }}>🐔 Chickens</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", color: "#aaa", marginBottom: "4px" }}>
                Number of chickens
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="number"
                  min="0"
                  value={chickenCountInput}
                  onChange={(e) => setChickenCountInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #777",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={saveChickenCount}
                  disabled={savingChickenCount}
                  style={{
                    background: "#ffb300",
                    color: "#1f1f1f",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    cursor: savingChickenCount ? "default" : "pointer",
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #333", margin: "16px 0" }} />

            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "2.4rem", fontWeight: "bold", color: "white", lineHeight: 1 }}>
                {eggsToday}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                egg{eggsToday === 1 ? "" : "s"} collected today
                {eggCollections.length > 0 && ` · ${eggCollections.length} entr${eggCollections.length === 1 ? "y" : "ies"}`}
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <input
                type="number"
                min="1"
                placeholder="Eggs collected"
                value={eggInput}
                onChange={(e) => setEggInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #777",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={addEggs}
                disabled={savingEggs}
                style={{
                  background: "#0284c7",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: savingEggs ? "default" : "pointer",
                }}
              >
                ➕ Add
              </button>
            </div>

            <button
              onClick={undoLastEggEntry}
              disabled={eggCollections.length === 0}
              style={{
                width: "100%",
                background: "transparent",
                color: "#f87171",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "8px",
                cursor: eggCollections.length === 0 ? "default" : "pointer",
                opacity: eggCollections.length === 0 ? 0.5 : 1,
                marginBottom: "12px",
              }}
            >
              ↩ Undo last entry
            </button>

            <small style={{ color: "#aaa", display: "block", marginBottom: "12px" }}>
              Record egg sales income on the Sales page — choose "🥚 Eggs" as the sale type.
            </small>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => {
                  setShowEggModal(false);
                  setPage("sales");
                }}
                style={{
                  flex: 1,
                  background: "#4caf50",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                💰 Log egg sale
              </button>
              <button
                onClick={() => setShowEggModal(false)}
                style={{
                  flex: 1,
                  background: "#333",
                  color: "white",
                  border: "none",
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
  const isMobile = window.innerWidth < 768;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#1f1f1f",
        borderRadius: "16px",
        padding: isMobile ? "12px 4px" : "16px",
        border: `2px solid ${colour}`,
        boxShadow: `0 0 15px ${colour}20`,
        cursor: onClick
          ? "pointer"
          : "default",
        transition: "0.2s",
        minWidth: 0,
        boxSizing: "border-box",
        overflow: "hidden",
        textAlign: "center",
        overflowWrap: "break-word",
      }}
    >
      <div
        style={{
          fontSize: isMobile ? "1.3rem" : "1.6rem",
          marginBottom: isMobile ? "6px" : "10px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          color: "#aaa",
          fontSize: isMobile ? "0.72rem" : "0.9rem",
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: isMobile ? "1.4rem" : "1.8rem",
          fontWeight: "bold",
          color: colour,
          marginTop: isMobile ? "6px" : "10px",
        }}
      >
        {value}
      </div>
      {subtitle && (
  <div
    style={{
      fontSize: isMobile ? "0.7rem" : "0.9rem",
      color: "#aaa",
      marginTop: "6px",
      lineHeight: 1.2,
    }}
  >
    {subtitle}
  </div>
)}
    </div>
  );
}