import { useState, useEffect } from "react";

export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] = useState(false);

    const [activeTab, setActiveTab] = useState("overview");
    
    const [history, setHistory] = useState([]);

  const [scans, setScans] = useState([]);

  const [toast, setToast] = useState("");

 
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
        <label>Date</label>

        <input
          type="date"
          value={lambingDate}
          onChange={(e) =>
            setLambingDate(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>Male Lambs</label>

        <input
          type="number"
          value={maleLambs}
          onChange={(e) =>
            setMaleLambs(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>Female Lambs</label>

        <input
          type="number"
          value={femaleLambs}
          onChange={(e) =>
            setFemaleLambs(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>Dead Lambs</label>

        <input
          type="number"
          value={deadLambs}
          onChange={(e) =>
            setDeadLambs(
              e.target.value
            )
          }
          style={inputStyle}
        />

        <label>Notes</label>

        <textarea
          value={lambingNotes}
          onChange={(e) =>
            setLambingNotes(
              e.target.value
            )
          }
          style={{
            ...inputStyle,
            minHeight: "80px",
          }}
        />

        <button
          onClick={saveLambing}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          ✅ Save Lambing
        </button>
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
            {Number(
              lambing.males
            ) +
              Number(
                lambing.females
              )}{" "}
            lambs born
          </strong>

          <br />

          ♂ {lambing.males}
          {" | "}
          ♀ {lambing.females}
          {" | "}
          Dead: {lambing.dead}

          <br />

          <small>
            {
              lambing.lambingDate
            }
          </small>
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