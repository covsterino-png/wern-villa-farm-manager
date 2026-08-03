import { useState, useEffect } from "react";

export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] = useState(false);

    const [activeTab, setActiveTab] = useState("overview");

    const [repeatEvery, setRepeatEvery] =
  useState(1);

const [numberOfEvents, setNumberOfEvents] =
  useState(1);
  const [caseActions, setCaseActions] =
  useState({});

const [newActionType, setNewActionType] =
  useState("Health Check");

  const [showMonitoringFor,
  setShowMonitoringFor] =
  useState(null);

const [monitoringType,
  setMonitoringType] =
  useState("Health Check");

const [monitoringFrequency,
  setMonitoringFrequency] =
  useState(2);

const [newActionNotes, setNewActionNotes] =
  useState("");

const [activeCaseId, setActiveCaseId] =
  useState(null);

  const [healthCases, setHealthCases] =
  useState([]);

const [showHealthCaseForm,
  setShowHealthCaseForm] =
  useState(false);

const [caseTitle, setCaseTitle] =
  useState("");

const [caseDescription,
  setCaseDescription] =
  useState("");

const [casePriority,
  setCasePriority] =
  useState("medium");
    
    const [history, setHistory] = useState([]);

  const [scans, setScans] = useState([]);

  const [toast, setToast] = useState("");

  const [scheduledEvents, setScheduledEvents] =
  useState([]);

const [showScheduledForm, setShowScheduledForm] =
  useState(false);

  const [repeatUntilResolved, setRepeatUntilResolved] =
  useState(false);

const [scheduledDate, setScheduledDate] =
  useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

const [scheduledType, setScheduledType] =
  useState("Injection");

const [scheduledNotes, setScheduledNotes] =
  useState("");

 
  const [showScanForm, setShowScanForm] = useState(false);

const [scanDate, setScanDate] = useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

  const [events, setEvents] =
  useState([]);

const [showEventForm, setShowEventForm] =
  useState(false);

const [eventDate, setEventDate] =
  useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

const [eventType, setEventType] =
  useState("Foot Trim");

const [eventNotes, setEventNotes] =
  useState("");

  const [weights, setWeights] =
  useState([]);

const [showWeightForm, setShowWeightForm] =
  useState(false);

const [weight, setWeight] =
  useState("");

const [weightDate, setWeightDate] =
  useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

const [lambings, setLambings] =
  useState([]);

const [showLambingForm, setShowLambingForm] =
  useState(false);

const [lambingDate, setLambingDate] =
  useState(
    new Date()
      .toISOString()
      .split("T")[0]
  );

const [maleLambs, setMaleLambs] =
  useState(0);

const [femaleLambs, setFemaleLambs] =
  useState(0);

const [deadLambs, setDeadLambs] =
  useState(0);

const [lambingNotes, setLambingNotes] =
  useState("");

const [scanResult, setScanResult] = useState("Single");

  const [groups, setGroups] = useState([]);

  const [fields, setFields] = useState([]);

  const [allSheep, setAllSheep] = useState([]);

  const [name, setName] = useState( sheep.name || ""
  );

  const [eid, setEid] = useState( sheep.eid || ""
  );

  const [sex, setSex] = useState( sheep.sex || ""
  );

  const [dob, setDob] = useState(
    sheep.dob || ""
  );

  const [mother, setMother] =
    useState(sheep.mother || "");

  const [groupName, setGroupName] =
    useState(sheep.groupName || "");

  const [
    currentField,
    setCurrentField,
  ] = useState(
    sheep.currentField || ""
  );

  const [status, setStatus] =
    useState(
      sheep.status || "Active"
    );

  const [notes, setNotes] =
    useState(sheep.notes || "");

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register"
    )
      .then((res) => res.json())
      .then((data) => setGroups(data));

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/health-cases`
)
  .then((res) => res.json())
  .then((data) =>
    setHealthCases(data)
  );
      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scheduled`
)
  .then((res) => res.json())
  .then((data) =>
    setScheduledEvents(data)
  );

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/events`
)
  .then((res) => res.json())
  .then((data) => setEvents(data));

      fetch(
  "https://wern-villa-api.onrender.com/sheep"
)
  .then((res) => res.json())
  .then((data) => setAllSheep(data));

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/lambings`
)
  .then((res) => res.json())
  .then((data) => setLambings(data));

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/weights`
)
  .then((res) => res.json())
  .then((data) => setWeights(data));

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scans`
)
  .then((res) => res.json())
  .then((data) => setScans(data));

      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scans`
)
  .then((res) => res.json())
  .then((data) => setScans(data));
     
      fetch(
  `https://wern-villa-api.onrender.com/sheep/${sheep.id}/history`
)
  .then((res) => res.json())
.then((data) =>
  setHistory(
    Array.isArray(data)
      ? data
      : []
  )
);
    fetch(
      "https://wern-villa-api.onrender.com/fields"
    )
      .then((res) => res.json())
      .then((data) => setFields(data));

    fetch(
      "https://wern-villa-api.onrender.com/sheep"
    )
      .then((res) => res.json())
      .then((data) =>
        setAllSheep(data)
      );
  }, []);


  
  function saveHealthCase() {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/health-cases`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        title: caseTitle,
        description:
          caseDescription,
        priority:
          casePriority,
      }),
    }
  )
    .then((res) => res.json())
    .then(() =>
      fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/health-cases`
      )
    )
    .then((res) => res.json())
    .then((data) => {
      setHealthCases(data);

      setShowHealthCaseForm(
        false
      );

      setCaseTitle("");
      setCaseDescription("");
    });
}

function loadCaseActions(caseId) {
  fetch(
    `https://wern-villa-api.onrender.com/health-cases/${caseId}/actions`
  )
    .then((res) => res.json())
    .then((data) => {
      const updated = {};

      updated[String(caseId)] = data;

      setCaseActions(updated);
    });
}

function saveAction(caseId) {
  fetch(
    `https://wern-villa-api.onrender.com/health-cases/${caseId}/actions`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        actionType: newActionType,
        notes: newActionNotes,
      }),
    }
  )
    .then((res) => res.json())
    .then(() => {
      loadCaseActions(caseId);

      setNewActionNotes("");

      setToast(
        "✅ Action added"
      );

      setTimeout(() => {
        setToast("");
      }, 3000);
    });
}

function createMonitoring(caseId) {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scheduled`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        dueDate: new Date()
          .toISOString()
          .split("T")[0],

        eventType: monitoringType,

        notes:
          `Health Case #${caseId}`,

        repeatEvery:
          Number(
            monitoringFrequency
          ),

        repeatUntilResolved:
          true,
      }),
    }
  )
    .then((res) => res.json())
    .then(() => {
      setToast(
        "✅ Monitoring created"
      );

      setShowMonitoringFor(
        null
      );

      setTimeout(() => {
        setToast("");
      }, 3000);
    });
}
function resolveCase(caseId) {
  fetch(
    `https://wern-villa-api.onrender.com/health-cases/${caseId}/resolve`,
    {
      method: "PUT",
    }
  )
    .then((res) => res.json())
    .then(() =>
      fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/health-cases`
      )
    )
    .then((res) => res.json())
    .then((data) => {
      setHealthCases(data);
    });
}

  function completeScheduledEvent(
  eventId
) {
  fetch(
    `https://wern-villa-api.onrender.com/scheduled/${eventId}/complete`,
    {
      method: "PUT",
    }
  )
    .then((res) => res.json())
    .then(() => {
      return fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scheduled`
      );
    })
    .then((res) => res.json())
    .then((data) => {
      setScheduledEvents(data);
    });
}

  function saveSheep() {
    fetch(
      `https://wern-villa-api.onrender.com/sheep/${sheep.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          eid,
          sex,
          dob,
          mother,
          groupName,
          currentField,
          status,
          notes,
        }),
      }
    )
      .then((res) => res.json())
      .then(() => {
        window.location.reload();
      });
  }

  function saveWeight() {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/weights`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        weight,
        weightDate,
      }),
    }
  )
    .then((res) => res.json())
    .then(() => {
      setToast(
        "✅ Weight saved successfully"
      );

      setTimeout(() => {
        setToast("");
      }, 3000);

      return fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/weights`
      );
    })
    .then((res) => res.json())
    .then((data) => {
      setWeights(data);
      setShowWeightForm(false);
      setWeight("");
    });
}

function saveLambing() {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/lambings`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        lambingDate,
        males: maleLambs,
        females: femaleLambs,
        dead: deadLambs,
        notes: lambingNotes,
      }),
    }
  )
    .then((res) => res.json())
    .then(() => {
      setToast(
        "✅ Lambing saved successfully"
      );

      setTimeout(() => {
        setToast("");
      }, 3000);

      return fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/lambings`
      );
    })
    .then((res) => res.json())
    .then((data) => {
      setLambings(data);

      setShowLambingForm(false);

      setMaleLambs(0);
      setFemaleLambs(0);
      setDeadLambs(0);
      setLambingNotes("");
    });
}

  function saveScan() {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scans`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scanDate,
        result: scanResult,
      }),
    }
  )
    .then((res) => res.json())
.then(() => {
  setToast(
    "✅ Scan saved successfully"
  );

  setTimeout(() => {
    setToast("");
  }, 3000);

  return fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scans`
  );
})
.then((res) => res.json())
.then((data) => {
  setScans(data);
  setShowScanForm(false);
});
}
function saveEvent() {
  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/events`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventDate,
        eventType,
        notes: eventNotes,
      }),
    }
  )
    .then((res) => res.json())
    .then(() => {
      setToast(
        "✅ Event saved successfully"
      );

      setTimeout(() => {
        setToast("");
      }, 3000);

      return fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/events`
      );
    })
    .then((res) => res.json())
    .then((data) => {
      setEvents(data);

      setShowEventForm(false);

      setEventType("Foot Trim");
      setEventNotes("");
    });
}

function saveScheduledEvent() {

  if (
    numberOfEvents > 1 &&
    repeatEvery < 1
  ) {
    alert(
      "Repeat Every must be at least 1 day."
    );
    return;
  }

  fetch(
    `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scheduled`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        dueDate: scheduledDate,
        eventType: scheduledType,
        notes: scheduledNotes,
        repeatEvery:
          Number(repeatEvery),
        numberOfEvents:
          Number(numberOfEvents),
          repeatUntilResolved,
      }),
    }
  )
    .then((res) => res.json())
    .then(() =>
      fetch(
        `https://wern-villa-api.onrender.com/sheep/${sheep.id}/scheduled`
      )
    )
    .then((res) => res.json())
    .then((data) => {
      setScheduledEvents(data);
      setShowScheduledForm(false);
      setScheduledNotes("");
      setRepeatEvery(0);
      setNumberOfEvents(1);
      setToast("✅ Schedule created");
    });
}

  if (editing) {
    return (
      <div
        style={{
          maxWidth: "500px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() =>
            setEditing(false)
          }
          style={{
            background: "#03a9f4",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Back to Sheep
        </button>

        <h1
          style={{
            color: "#03a9f4",
            fontSize: "2rem",
          }}
        >
          ✏️ Edit {sheep.name}
        </h1>

        <label>Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
        />

        <label>EID</label>
        <input
          style={inputStyle}
          value={eid}
          onChange={(e) =>
            setEid(e.target.value)
          }
        />

        <label>Sex</label>
        <select
          style={inputStyle}
          value={sex}
          onChange={(e) =>
            setSex(e.target.value)
          }
        >
          <option value="Ewe">
            Ewe
          </option>
          <option value="Ram">
            Ram
          </option>
        </select>

        <label>Date of Birth</label>
        <input
          style={inputStyle}
          type="date"
          value={dob}
          onChange={(e) =>
            setDob(e.target.value)
          }
        />

        <label>Mother</label>
        <select
          style={inputStyle}
          value={mother}
          onChange={(e) =>
            setMother(
              e.target.value
            )
          }
        >
          <option value="">
            Unknown
          </option>

          {allSheep.map((animal) => (
            <option
              key={animal.id}
              value={animal.name}
            >
              {animal.name}
            </option>
          ))}
        </select>

        <label>Group</label>
        <select
          style={inputStyle}
          value={groupName}
          onChange={(e) =>
            setGroupName(
              e.target.value
            )
          }
        >
          {groups.map((group) => (
            <option
              key={group.id}
              value={group.name}
            >
              {group.name}
            </option>
          ))}
        </select>


        <label>Status</label>
        <select
          style={inputStyle}
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="Active">
            Active
          </option>
          <option value="Breeding">
            Breeding
          </option>
          <option value="Replacement">
            Replacement
          </option>
          <option value="Store Lamb">
            Store Lamb
          </option>
          <option value="Sold">
            Sold
          </option>
          <option value="Deceased">
            Deceased
          </option>
        </select>

        <label>Notes</label>
        <textarea
          style={{
            ...inputStyle,
            minHeight: "80px",
          }}
          value={notes}
          onChange={(e) =>
            setNotes(e.target.value)
          }
        />

        <button
          onClick={saveSheep}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          💾 Save Changes
        </button>
      </div>
      
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          background: "#03a9f4",
          color: "white",
          border: "none",
          padding: "12px 18px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Back
      </button>

      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 {sheep.name}
      </h1>
      {toast && (
  <div
    style={{
      background: "#4caf50",
      color: "white",
      padding: "12px",
      borderRadius: "10px",
      textAlign: "center",
      marginBottom: "20px",
      fontWeight: "bold",
    }}
  >
    {toast}
  </div>
)}
      <div
  style={{
    textAlign: "center",
    color: "#aaa",
    marginTop: "-10px",
    marginBottom: "20px",
    fontSize: "1rem",
  }}
>
  {sheep.sex} • {sheep.groupName}

  <br />

  🌱 {sheep.currentField}
</div>
<div
  style={{
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
    marginBottom: "30px",
  }}
>
  <TabButton
    label="Overview"
    active={activeTab === "overview"}
    onClick={() =>
      setActiveTab("overview")
    }
  />

  <TabButton
    label="Timeline"
    active={activeTab === "timeline"}
    onClick={() =>
      setActiveTab("timeline")
    }
  />

  <TabButton
    label="Weights"
    active={activeTab === "weights"}
    onClick={() =>
      setActiveTab("weights")
    }
  />

  <TabButton
    label="Scans"
    active={activeTab === "scans"}
    onClick={() =>
      setActiveTab("scans")
    }
  />

  <TabButton
    label="Lambings"
    active={activeTab === "lambings"}
    onClick={() =>
      setActiveTab("lambings")
    }
  />
<TabButton
  label="Events"
  active={activeTab === "events"}
  onClick={() =>
    setActiveTab("events")
  }
/>
<TabButton
  label="Health"
  active={activeTab === "health"}
  onClick={() =>
    setActiveTab("health")
  }
/>
<TabButton
  label="Scheduled"
  active={
    activeTab === "scheduled"
  }
  onClick={() =>
    setActiveTab("scheduled")
  }
/>
</div>
<button
  onClick={() =>
    setEditing(true)
  }
  style={{
    background: "#ff9800",
    color: "white",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "20px",
  }}
>
  ✏️ Edit Sheep
</button>

{activeTab === "overview" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "15px",
      borderRadius: "10px",
    }}
  >
            <p>
          <strong>Sex:</strong>{" "}
          {sheep.sex}
        </p>

        <p>
          <strong>EID:</strong>{" "}
          {sheep.eid ||
            "Not Tagged Yet"}
        </p>

        <p>
          <strong>DOB:</strong>{" "}
          {sheep.dob ||
            "Unknown"}
        </p>

        <p>
          <strong>Mother:</strong>{" "}
          {sheep.mother ||
            "Unknown"}
        </p>

        <p>
          <strong>Group:</strong>{" "}
          {sheep.groupName}
        </p>

        <p>
          <strong>Field:</strong>{" "}
          {sheep.currentField}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {sheep.status}
        </p>

        <p>
          <strong>Notes:</strong>{" "}
          {sheep.notes ||
            "None"}
        </p>
      </div>
)}
{activeTab === "timeline" && (
  <>
    <h2
      style={{
        color: "#03a9f4",
        marginTop: "30px",
      }}
    >
      📜 Timeline
    </h2>

    {!Array.isArray(history) ||
    history.length === 0 ? (
      <p>No history yet</p>
    ) : (
      history.map((event) => (
        <div
          key={event.id}
          style={{
            background: "#2b2b2b",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
<div
  style={{
    color: "#03a9f4",
    fontWeight: "bold",
    fontSize: "1.1rem",
    marginBottom: "6px",
  }}
>
  {event.eventType}
</div>
          <div>
            {event.details}
          </div>

          <small>
            {event.eventDate}
          </small>
        </div>
      ))
    )}
  </>
)}
{activeTab === "weights" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>⚖️ Weights</h2>

    <button
      onClick={() =>
        setShowWeightForm(
          !showWeightForm
        )
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "15px",
      }}
    >
      ➕ Record Weight
    </button>

    {showWeightForm && (
      <div
        style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <label>
          Weight (kg)
        </label>

        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) =>
            setWeight(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>
          Date
        </label>

        <input
          type="date"
          value={weightDate}
          onChange={(e) =>
            setWeightDate(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <button
          onClick={saveWeight}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ✅ Save Weight
        </button>
      </div>
    )}

    {weights.length === 0 ? (
      <p>
        No weight records yet.
      </p>
    ) : (
      weights.map((entry) => (
        <div
          key={entry.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            {entry.weight} kg
          </strong>

          <br />

          <small>
            {entry.weightDate}
          </small>
        </div>
      ))
    )}
  </div>
)}

{activeTab === "scans" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>🤰 Pregnancy Scans</h2>

    <button
      onClick={() =>
        setShowScanForm(!showScanForm)
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "15px",
      }}
    >
      ➕ Record Scan
    </button>

    {showScanForm && (
      <div
        style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <label>Scan Date</label>

        <input
          type="date"
          value={scanDate}
          onChange={(e) =>
            setScanDate(e.target.value)
          }
          style={inputStyle}
        />

        <label>Result</label>

        <select
          value={scanResult}
          onChange={(e) =>
            setScanResult(
              e.target.value
            )
          }
          style={inputStyle}
        >
          <option value="Empty">
            Empty
          </option>

          <option value="Single">
            Single
          </option>

          <option value="Twin">
            Twin
          </option>

          <option value="Triplet">
            Triplet
          </option>

          <option value="Quad">
            Quad
          </option>
        </select>

        <button
          onClick={saveScan}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ✅ Save Scan
        </button>
      </div>
    )}

    {scans.length === 0 ? (
      <p>No scan records yet.</p>
    ) : (
      scans.map((scan) => (
        <div
          key={scan.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            {scan.result}
          </strong>

          <br />

          <small>
            {scan.scanDate}
          </small>
        </div>
      ))
    )}
  </div>
)}

{activeTab === "lambings" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>🍼 Lambings</h2>

    <button
      onClick={() =>
        setShowLambingForm(
          !showLambingForm
        )
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "15px",
      }}
    >
      ➕ Record Lambing
    </button>

    {showLambingForm && (
      <div
        style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        {/* Your existing lambing form stays here */}
      </div>
    )}

    {lambings.length === 0 ? (
      <p>No lambings recorded yet.</p>
    ) : (
      lambings.map((lambing) => (
        <div
          key={lambing.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            {Number(lambing.males) +
              Number(lambing.females)}{" "}
            lambs born
          </strong>

          <br />

          ♂ {lambing.males} | ♀{" "}
          {lambing.females} | Dead:{" "}
          {lambing.dead}

          <br />

          <small>
            {lambing.lambingDate}
          </small>
        </div>
      ))
    )}
  </div>
)}

{activeTab === "events" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>📝 Events</h2>

    <button
      onClick={() =>
        setShowEventForm(
          !showEventForm
        )
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
        cursor: "pointer",
        marginBottom: "15px",
      }}
    >
      ➕ Record Event
    </button>
<button
  onClick={() =>
    setShowScheduledForm(
      !showScheduledForm
    )
  }
  style={{
    background: "#03a9f4",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    marginBottom: "15px",
    marginLeft: "10px",
  }}
>
  📅 Schedule Event
</button>

{showScheduledForm && (
  <div
    style={{
      background: "#1f1f1f",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "20px",
    }}
  >
    <label>Type</label>

    <select
      value={scheduledType}
      onChange={(e) =>
        setScheduledType(
          e.target.value
        )
      }
      style={inputStyle}
    >
      <option>
        Injection
      </option>

      <option>
        Health Check
      </option>

      <option>
        Weight Check
      </option>

      <option>
        Foot Trim
      </option>

      <option>
        Other
      </option>
    </select>

    <label>
      First Due Date
    </label>

    <input
      type="date"
      value={scheduledDate}
      onChange={(e) =>
        setScheduledDate(
          e.target.value
        )
      }
      style={inputStyle}
    />

    <label>
      Repeat Every (Days)
    </label>

    <input
      type="number"
      value={repeatEvery}
      onChange={(e) =>
        setRepeatEvery(
          e.target.value
        )
      }
      style={inputStyle}
    />

{!repeatUntilResolved && (
  <>
    <label>
      Number of Events
    </label>

    <input
      type="number"
      min="1"
      value={numberOfEvents}
      onChange={(e) =>
        setNumberOfEvents(
          e.target.value
        )
      }
      style={inputStyle}
    />
  </>
)}
<div
  style={{
    marginTop: "15px",
    marginBottom: "15px",
    textAlign: "left",
  }}
>
  <label>
    <input
      type="checkbox"
      checked={repeatUntilResolved}
      onChange={(e) =>
        setRepeatUntilResolved(
          e.target.checked
        )
      }
      style={{ marginRight: "10px" }}
    />

    Repeat until resolved
  </label>
</div>

    <label>Notes</label>

    <textarea
      value={scheduledNotes}
      onChange={(e) =>
        setScheduledNotes(
          e.target.value
        )
      }
      style={{
        ...inputStyle,
        minHeight: "80px",
      }}
    />

    <button
      onClick={
        saveScheduledEvent
      }
      style={{
        background: "#4caf50",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
      }}
    >
      ✅ Create Schedule
    </button>
  </div>
)}
    {showEventForm && (
      <div
        style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <label>Date</label>

        <input
          type="date"
          value={eventDate}
          onChange={(e) =>
            setEventDate(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>Type</label>

        <select
          value={eventType}
          onChange={(e) =>
            setEventType(
              e.target.value
            )
          }
          style={inputStyle}
        >
          <option value="Foot Trim">
            Foot Trim
          </option>

          <option value="Injection">
            Injection
          </option>

          <option value="Tagging">
            Tagging
          </option>

          <option value="Health Check">
            Health Check
          </option>

          <option value="Shearing">
            Shearing
          </option>

          <option value="Other">
            Other
          </option>
        </select>

        <label>Notes</label>

        <textarea
          value={eventNotes}
          onChange={(e) =>
            setEventNotes(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            minHeight: "80px",
          }}
        />

        <button
          onClick={saveEvent}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ✅ Save Event
        </button>
      </div>
    )}
    

    {events.length === 0 ? (
      <p>No events recorded yet.</p>
    ) : (
      events.map((event) => (
        <div
          key={event.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            {event.eventType}
          </strong>

          <br />

          {event.notes}

          <br />

          <small>
            {event.eventDate}
          </small>
        </div>
        
      ))
    )}
  </div>
  
)}
          {activeTab === "health" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>
      🐑 Health Cases
    </h2>

    <button
      onClick={() =>
        setShowHealthCaseForm(
          !showHealthCaseForm
        )
      }
      style={{
        background: "#03a9f4",
        color: "white",
        border: "none",
        padding: "10px 16px",
        borderRadius: "10px",
        marginBottom: "20px",
      }}
    >
      ➕ New Health Case
    </button>

    {showHealthCaseForm && (
      <div
        style={{
          background: "#1f1f1f",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <input
          style={inputStyle}
          placeholder="Footrot"
          value={caseTitle}
          onChange={(e) =>
            setCaseTitle(
              e.target.value
            )
          }
        />

        <textarea
          style={{
            ...inputStyle,
            minHeight: "80px",
          }}
          placeholder="Describe issue..."
          value={caseDescription}
          onChange={(e) =>
            setCaseDescription(
              e.target.value
            )
          }
        />

        <select
          value={casePriority}
          onChange={(e) =>
            setCasePriority(
              e.target.value
            )
          }
          style={inputStyle}
        >
          <option value="low">
            Low
          </option>
          <option value="medium">
            Medium
          </option>
          <option value="high">
            High
          </option>
          <option value="urgent">
            Urgent
          </option>
        </select>

        <button
          onClick={saveHealthCase}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
          }}
        >
          ✅ Save Case
        </button>
      </div>
    )}

    {healthCases.map((item) => (
      <div
        key={item.id}
        style={{
          background: "#1f1f1f",
          padding: "12px",
          borderRadius: "10px",
          marginBottom: "10px",
        }}
      >
        <strong>
          {item.title}
        </strong>

        <br />

        {item.description}

        <br />

        <small>
          Priority:
          {" "}
          {item.priority}
        </small>

        <br />

        <small>
          Status:
          {" "}
          {item.status}
        </small>
        <br />

<button
  onClick={() => {
    if (activeCaseId === item.id) {
      setActiveCaseId(null);
    } else {
      setActiveCaseId(item.id);
      loadCaseActions(item.id);
    }
  }}
  style={{
    background: "#03a9f4",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    marginRight: "10px",
  }}
>
  📋 Actions
</button>
<button
  onClick={() =>
    setShowMonitoringFor(item.id)
  }
  style={{
    background: "#ff9800",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "10px",
    marginRight: "10px",
  }}
>
  ⏰ Monitoring
</button>

{activeCaseId === item.id && (
  <div
    style={{
      marginTop: "15px",
      padding: "12px",
      background: "#2b2b2b",
      borderRadius: "10px",
    }}
  >
    <select
      value={newActionType}
      onChange={(e) =>
        setNewActionType(
          e.target.value
        )
      }
      style={inputStyle}
    >
      <option>
        Health Check
      </option>

      <option>
        Injection
      </option>

      <option>
        Observation
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

    <textarea
      value={newActionNotes}
      onChange={(e) =>
        setNewActionNotes(
          e.target.value
        )
      }
      placeholder="Notes..."
      style={{
        ...inputStyle,
        minHeight: "70px",
      }}
    />

    <button
      onClick={() =>
        saveAction(item.id)
      }
      style={{
        background: "#4caf50",
        color: "white",
        border: "none",
        padding: "10px 14px",
        borderRadius: "8px",
        marginBottom: "15px",
      }}
    >
      ✅ Add Action
    </button>


{(caseActions[item.id] || []).map(
  (action) => (
    <div
      key={action.id}
      style={{
        background: "#1f1f1f",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "8px",
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
  </div>
)}
        <br />

<button
  onClick={() =>
    resolveCase(item.id)
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
  ✅ Resolve
</button>
      </div>
    ))}
  </div>
)}

{activeTab === "scheduled" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>📋 Scheduled Events</h2>

    {scheduledEvents.length === 0 ? (
      <p>
        No scheduled events.
      </p>
    ) : (
      scheduledEvents.map((event) => (
        <div
          key={event.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "10px",
            marginBottom: "10px",
          }}
        >
          <strong>
            {event.eventType}
          </strong>

          <br />

          {event.notes}

          <br />

          <small>
            Due: {event.dueDate}
          </small>
          <br />

<button
  onClick={() =>
    completeScheduledEvent(
      event.id
    )
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
)}
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? "#03a9f4"
          : "#2b2b2b",
        color: "white",
        border: active
          ? "2px solid #03a9f4"
          : "2px solid #444",
        borderRadius: "12px",
        padding: "12px 20px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      {label}
    </button>
  );
}
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #444",
  boxSizing: "border-box",
};