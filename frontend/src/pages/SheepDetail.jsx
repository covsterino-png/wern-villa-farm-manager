import { useState, useEffect } from "react";
import { submitWrite } from "../offlineQueue";
import { getEidFormats } from "../eidUtils";

const TAG_STATUS_OPTIONS = [
  "Not Tagged",
  "Single Tag (Slaughter)",
  "Double Tagged (Breeding)",
  "Awaiting Replacement",
  "Bolus Fitted",
];

const TAG_COLOUR_OPTIONS = ["Yellow", "Red", "Black", "Other"];
const TAG_TYPE_OPTIONS = ["Electronic (EID)", "Visual", "Bolus"];

// DEFRA colour rules: yellow = EID only, black = bolus only, red = replacement tags only.
function getTagWarnings(tag) {
  const warnings = [];
  if (tag.colour === "Yellow" && tag.type !== "Electronic (EID)") {
    warnings.push("Yellow tags are reserved for the electronic (EID) tag.");
  }
  if (tag.colour === "Black" && tag.type !== "Bolus") {
    warnings.push("Black tags are reserved for electronic boluses.");
  }
  if (tag.colour === "Red" && !tag.replacement) {
    warnings.push("Red tags are reserved for replacement tags applied off the holding of birth.");
  }
  return warnings;
}

function getMonthsOld(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function getTaggingDeadlines(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const indoor = new Date(birth);
  indoor.setMonth(indoor.getMonth() + 6);
  const outdoor = new Date(birth);
  outdoor.setMonth(outdoor.getMonth() + 9);
  return { indoor, outdoor };
}

export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] = useState(false);

    const [activeTab, setActiveTab] = useState("overview");

  const [caseActions, setCaseActions] =
  useState({});

const [newActionType, setNewActionType] =
  useState("Health Check");

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

    const [financialAnalysis, setFinancialAnalysis] =
      useState({
        summary: {
          treatmentCount: 0,
          totalTreatmentCost: 0,
          totalVolumeMl: 0,
          averageTreatmentCost: 0,
          feedCount: 0,
          totalFeedCost: 0,
          purchaseCount: 0,
          totalPurchaseCost: 0,
          totalCost: 0,
          totalIncome: 0,
          netProfit: 0,
        },
        treatments: [],
        feed: [],
        purchases: [],
        sales: [],
      });

  const [scans, setScans] = useState([]);

  const [toast, setToast] = useState("");

  const [scheduledEvents, setScheduledEvents] =
  useState([]);

 
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

  const [currentField] = useState(
    sheep.currentField || ""
  );

  const [status, setStatus] =
    useState(
      sheep.status || "Active"
    );

  const [notes, setNotes] =
    useState(sheep.notes || "");

  const [tagStatus, setTagStatus] = useState(sheep.tagStatus || "Not Tagged");
  const [earTags, setEarTags] = useState(() => {
    try {
      const parsed = JSON.parse(sheep.earTags || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [newTagColour, setNewTagColour] = useState("Yellow");
  const [newTagType, setNewTagType] = useState("Electronic (EID)");
  const [newTagFlockMark, setNewTagFlockMark] = useState("");
  const [newTagIndividualNumber, setNewTagIndividualNumber] = useState("");
  const [newTagEid, setNewTagEid] = useState("");
  const [newTagDate, setNewTagDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [newTagReplacement, setNewTagReplacement] = useState(false);

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
      `https://wern-villa-api.onrender.com/sheep/${sheep.id}/financial-analysis`
    )
      .then((res) => res.json())
      .then((data) => setFinancialAnalysis(data));
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

      setToast("✅ Case resolved");

      setTimeout(() => {
        setToast("");
      }, 3000);
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
    submitWrite(
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
      },
      `Edit sheep ${name || eid}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.queued) {
          alert("Saved offline — will sync automatically once you're back online.");
          setEditing(false);
          return;
        }
        window.location.reload();
      });
  }

  function saveEarTags(nextTagStatus, nextEarTags) {
    submitWrite(
      `https://wern-villa-api.onrender.com/sheep/${sheep.id}/eartags`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tagStatus: nextTagStatus,
          earTags: nextEarTags,
        }),
      },
      `Update ear tags for ${sheep.name || sheep.eid}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.queued) {
          setToast("Saved offline — will sync automatically once you're back online.");
          setTimeout(() => setToast(""), 3000);
          return;
        }
        setToast("Ear tags updated.");
        setTimeout(() => setToast(""), 3000);
      });
  }

  function updateTagStatus(value) {
    setTagStatus(value);
    saveEarTags(value, earTags);
  }

  function addEarTag() {
    if (!newTagColour || !newTagType) return;
    const tag = {
      colour: newTagColour,
      type: newTagType,
      flockMark: newTagFlockMark,
      individualNumber: newTagIndividualNumber,
      eid: newTagType === "Electronic (EID)" ? newTagEid : "",
      dateApplied: newTagDate,
      replacement: newTagReplacement,
    };
    const nextEarTags = [...earTags, tag];
    setEarTags(nextEarTags);
    saveEarTags(tagStatus, nextEarTags);
    setNewTagFlockMark("");
    setNewTagIndividualNumber("");
    setNewTagEid("");
    setNewTagReplacement(false);
  }

  function removeEarTag(index) {
    const nextEarTags = earTags.filter((_, i) => i !== index);
    setEarTags(nextEarTags);
    saveEarTags(tagStatus, nextEarTags);
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
          placeholder="Hex or ISO EID"
        />
        {(() => {
          const { hex, iso } = getEidFormats(eid);
          return hex && iso ? (
            <p style={{ marginTop: "-8px", color: "#999" }}>
              Hex: {hex} &nbsp;|&nbsp; ISO: {iso}
            </p>
          ) : null;
        })()}

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
<TabButton
  label="Financial"
  active={activeTab === "financial"}
  onClick={() => setActiveTab("financial")}
/>
<TabButton
  label="Ear Tags"
  active={activeTab === "eartags"}
  onClick={() => setActiveTab("eartags")}
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

        {(() => {
          const { hex, iso } = getEidFormats(sheep.eid);
          if (!sheep.eid) {
            return (
              <p>
                <strong>EID:</strong> Not Tagged Yet
              </p>
            );
          }
          return hex && iso ? (
            <p>
              <strong>Hex:</strong> {hex} &nbsp;|&nbsp; <strong>ISO:</strong> {iso}
            </p>
          ) : (
            <p>
              <strong>EID:</strong> {sheep.eid}
            </p>
          );
        })()}

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
          onChange={(e) => setLambingDate(e.target.value)}
          style={inputStyle}
        />
        <label>Male lambs</label>
        <input
          type="number"
          min="0"
          value={maleLambs}
          onChange={(e) => setMaleLambs(e.target.value)}
          style={inputStyle}
        />
        <label>Female lambs</label>
        <input
          type="number"
          min="0"
          value={femaleLambs}
          onChange={(e) => setFemaleLambs(e.target.value)}
          style={inputStyle}
        />
        <label>Dead lambs</label>
        <input
          type="number"
          min="0"
          value={deadLambs}
          onChange={(e) => setDeadLambs(e.target.value)}
          style={inputStyle}
        />
        <label>Notes</label>
        <textarea
          value={lambingNotes}
          onChange={(e) => setLambingNotes(e.target.value)}
          style={{ ...inputStyle, minHeight: "80px" }}
        />
        <button
          onClick={saveLambing}
          style={{
            background: "#03a9f4",
            color: "white",
            border: "none",
            padding: "10px 16px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          Save Lambing
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
<button
  onClick={() =>
    stopRecurring(event.id)
  }
  style={{
    background: "#f44336",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "8px",
    marginLeft: "10px",
  }}
>
  🛑 Stop Recurring
</button>

        </div>
      ))
    )}
  </div>
)}
{activeTab === "financial" && (
  <div
    style={{
      background: "#2b2b2b",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    <h2>💷 Financial Analysis</h2>
    <p style={{ color: "#aaa" }}>
      Treatment costs plus the approximate share of flock feed costs for this sheep.
    </p>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "12px",
        margin: "20px 0",
      }}
    >
      <FinancialMetric
        label="Total treatment cost"
        value={`£${Number(financialAnalysis.summary?.totalTreatmentCost || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Treatments"
        value={financialAnalysis.summary?.treatmentCount || 0}
      />
      <FinancialMetric
        label="Total volume"
        value={`${Number(financialAnalysis.summary?.totalVolumeMl || 0).toFixed(2)} ml`}
      />
      <FinancialMetric
        label="Average treatment cost"
        value={`£${Number(financialAnalysis.summary?.averageTreatmentCost || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Total cost including feed"
        value={`£${Number(financialAnalysis.summary?.totalCost || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Feed cost"
        value={`£${Number(financialAnalysis.summary?.totalFeedCost || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Purchase cost"
        value={`£${Number(financialAnalysis.summary?.totalPurchaseCost || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Income"
        value={`£${Number(financialAnalysis.summary?.totalIncome || 0).toFixed(2)}`}
      />
      <FinancialMetric
        label="Net profit"
        value={`£${Number(financialAnalysis.summary?.netProfit || 0).toFixed(2)}`}
      />
    </div>

    <h3>Cost breakdown</h3>
    {financialAnalysis.treatments.length === 0 ? (
      <p>No treatment costs recorded for this sheep.</p>
    ) : (
      financialAnalysis.treatments.map((treatment) => (
        <div
          key={treatment.id}
          style={{
            background: "#1f1f1f",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "8px",
          }}
        >
          <strong>{treatment.treatment}</strong>
          <br />
          <small>{treatment.treatmentDate}</small>
          <br />
          Cost: £{Number(treatment.cost || 0).toFixed(2)}
          {treatment.volumeMl != null && (
            <>
              <br />
              Volume: {Number(treatment.volumeMl).toFixed(2)} ml
            </>
          )}
          {treatment.withdrawalDays > 0 && (
            <>
              <br />
              Withdrawal: {treatment.withdrawalDays} days
            </>
          )}
        </div>
      ))
    )}

    {financialAnalysis.purchases?.length > 0 && (
      <>
        <h3>Purchase cost</h3>
        {financialAnalysis.purchases.map((purchase) => (
          <div key={`purchase-${purchase.id}`} style={{ background: "#1f1f1f", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
            <strong>Purchased sheep</strong><br />
            <small>{purchase.purchaseDate}</small><br />
            £{Number(purchase.price || 0).toFixed(2)}
            {purchase.seller && <><br />From: {purchase.seller}</>}
            {purchase.notes && <><br />{purchase.notes}</>}
          </div>
        ))}
      </>
    )}

    {financialAnalysis.sales?.length > 0 && (
      <>
        <h3>Sale income</h3>
        {financialAnalysis.sales.map((sale) => (
          <div key={`sale-${sale.id}`} style={{ background: "#1f1f1f", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
            <strong>{sale.description || sale.saleType}</strong><br />
            <small>{sale.saleDate}</small><br />
            £{Number(sale.total || 0).toFixed(2)}
            {sale.customer && <><br />To: {sale.customer}</>}
          </div>
        ))}
      </>
    )}

    {financialAnalysis.feed?.length > 0 && (
      <>
        <h3>Flock feed allocation</h3>
        {financialAnalysis.feed.map((feed) => (
          <div key={`feed-${feed.id}`} style={{ background: "#1f1f1f", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
            <strong>{feed.description}</strong><br />
            <small>{feed.feedDate}</small><br />
            Approximate share: £{Number(feed.cost || 0).toFixed(2)}
            {feed.notes && <><br />{feed.notes}</>}
          </div>
        ))}
      </>
    )}
  </div>
)}

{activeTab === "eartags" && (() => {
  const monthsOld = getMonthsOld(dob);
  const deadlines = getTaggingDeadlines(dob);
  const electronicCount = earTags.filter((t) => t.type === "Electronic (EID)").length;
  const visualCount = earTags.filter((t) => t.type === "Visual").length;

  const setWarnings = [];
  if (tagStatus === "Single Tag (Slaughter)" && earTags.length !== 1) {
    setWarnings.push("Slaughter lambs should carry exactly 1 electronic tag.");
  }
  if (tagStatus === "Double Tagged (Breeding)" && (electronicCount < 1 || visualCount < 1)) {
    setWarnings.push("Breeding stock must carry 1 electronic (yellow) tag and 1 visual tag.");
  }
  if (tagStatus === "Single Tag (Slaughter)" && monthsOld != null && monthsOld >= 12) {
    setWarnings.push("This lamb is now over 12 months old — it must be upgraded to double tagging (breeding stock) before its first birthday.");
  }
  if (tagStatus === "Not Tagged" && deadlines) {
    const today = new Date();
    if (today > deadlines.indoor) {
      setWarnings.push(
        `Tagging deadline has passed: due within 6 months (indoor) / 9 months (outdoor) of birth, and always before leaving the holding of birth.`
      );
    }
  }

  return (
    <div
      style={{
        background: "#2b2b2b",
        padding: "20px",
        borderRadius: "10px",
      }}
    >
      <h2 style={{ color: "#03a9f4", marginTop: 0 }}>🏷️ Ear Tags</h2>
      <p style={{ color: "#aaa" }}>
        DEFRA requires official ear tags (or a bolus) for traceability. Tag colour is tightly
        regulated: yellow is the electronic (EID) tag, black is reserved for boluses, and red is
        reserved for replacement tags fitted off the holding of birth.
      </p>

      {deadlines && (
        <p style={{ color: "#999" }}>
          Tagging deadline: by {deadlines.indoor.toLocaleDateString()} if reared indoors overnight,
          or {deadlines.outdoor.toLocaleDateString()} if reared outdoors — whichever is sooner, and
          always before the animal leaves its holding of birth.
        </p>
      )}

      <label>Tag Status</label>
      <select
        style={inputStyle}
        value={tagStatus}
        onChange={(e) => updateTagStatus(e.target.value)}
      >
        {TAG_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {setWarnings.map((warning, i) => (
        <p key={i} style={{ color: "#ffcc80" }}>⚠️ {warning}</p>
      ))}

      <h3 style={{ color: "#03a9f4" }}>Tags Applied</h3>
      {earTags.length === 0 ? (
        <p>No tags recorded yet.</p>
      ) : (
        earTags.map((tag, index) => (
          <div
            key={index}
            style={{
              background: "#1f1f1f",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            <strong>{tag.colour} — {tag.type}</strong>
            <br />
            Flock mark: {tag.flockMark || "—"}
            {tag.individualNumber ? ` #${tag.individualNumber}` : ""}
            {tag.eid && (() => {
              const { hex, iso } = getEidFormats(tag.eid);
              return (
                <>
                  <br />
                  EID: {tag.eid}
                  {hex && iso ? ` (Hex: ${hex} | ISO: ${iso})` : ""}
                </>
              );
            })()}
            <br />
            Applied: {tag.dateApplied || "Unknown"}
            {tag.replacement && (
              <>
                <br />
                Replacement tag
              </>
            )}
            {getTagWarnings(tag).map((warning, i) => (
              <p key={i} style={{ color: "#ff8a65", marginBottom: 0 }}>⚠️ {warning}</p>
            ))}
            <br />
            <button
              onClick={() => removeEarTag(index)}
              style={{
                background: "#e53935",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "8px",
              }}
            >
              Remove
            </button>
          </div>
        ))
      )}

      <h3 style={{ color: "#03a9f4" }}>Add a Tag</h3>
      <label>Colour</label>
      <select
        style={inputStyle}
        value={newTagColour}
        onChange={(e) => setNewTagColour(e.target.value)}
      >
        {TAG_COLOUR_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <label>Type</label>
      <select
        style={inputStyle}
        value={newTagType}
        onChange={(e) => setNewTagType(e.target.value)}
      >
        {TAG_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <label>UK Flock Mark</label>
      <input
        style={inputStyle}
        value={newTagFlockMark}
        onChange={(e) => setNewTagFlockMark(e.target.value)}
        placeholder="e.g. UK 123456"
      />

      <label>Individual Number (5 digits, breeding tags)</label>
      <input
        style={inputStyle}
        value={newTagIndividualNumber}
        onChange={(e) => setNewTagIndividualNumber(e.target.value)}
        placeholder="e.g. 00123"
      />

      {newTagType === "Electronic (EID)" && (
        <>
          <label>EID</label>
          <input
            style={inputStyle}
            value={newTagEid}
            onChange={(e) => setNewTagEid(e.target.value)}
            placeholder="Hex or ISO EID"
          />
        </>
      )}

      <label>Date Applied</label>
      <input
        type="date"
        style={inputStyle}
        value={newTagDate}
        onChange={(e) => setNewTagDate(e.target.value)}
      />

      <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <input
          type="checkbox"
          checked={newTagReplacement}
          onChange={(e) => setNewTagReplacement(e.target.checked)}
        />
        Replacement tag (lost original, off holding of birth)
      </label>

      <button
        onClick={addEarTag}
        style={{
          background: "#4caf50",
          color: "white",
          border: "none",
          padding: "12px",
          borderRadius: "10px",
          width: "100%",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ➕ Add Tag
      </button>

      <p style={{ color: "#999", marginTop: "12px" }}>
        Remember to record any tagging or replacement event in your holding register within 36
        hours of applying the tag(s). If a sheep loses a tag, replace it within 28 days of
        noticing, or before it moves off the farm, whichever is sooner.
      </p>
    </div>
  );
})()}
    </div>
  );
}
function FinancialMetric({ label, value }) {
  return (
    <div
      style={{
        background: "#1f1f1f",
        padding: "14px",
        borderRadius: "8px",
      }}
    >
      <div style={{ color: "#aaa", fontSize: "0.85rem" }}>{label}</div>
      <strong style={{ fontSize: "1.25rem" }}>{value}</strong>
    </div>
  );
}
function stopRecurring(eventId) {
  fetch(
    `https://wern-villa-api.onrender.com/scheduled/${eventId}/stop`,
    {
      method: "PUT",
    }
  )
    .then((res) => res.json())
    .then(() => {
      window.location.reload();
    });
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