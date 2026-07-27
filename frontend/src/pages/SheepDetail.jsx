import { useState } from "react";

export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] = useState(
    sheep.name || ""
  );

  const [eid, setEid] = useState(
    sheep.eid || ""
  );

  const [sex, setSex] = useState(
    sheep.sex || ""
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
          groupName,
          mother,
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

  if (editing) {
    return (
      <div>
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
          ← Cancel
        </button>

        <h1>✏️ Edit Sheep</h1>

        <input
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          placeholder="Name"
        />

        <br />
        <br />

        <input
          value={eid}
          onChange={(e) =>
            setEid(e.target.value)
          }
          placeholder="EID"
        />

        <br />
        <br />

        <input
          value={sex}
          onChange={(e) =>
            setSex(e.target.value)
          }
          placeholder="Sex"
        />

        <br />
        <br />

        <input
          value={dob}
          onChange={(e) =>
            setDob(e.target.value)
          }
          placeholder="DOB"
        />

        <br />
        <br />

        <input
          value={mother}
          onChange={(e) =>
            setMother(e.target.value)
          }
          placeholder="Mother"
        />

        <br />
        <br />

        <input
          value={groupName}
          onChange={(e) =>
            setGroupName(
              e.target.value
            )
          }
          placeholder="Group"
        />

        <br />
        <br />

        <input
          value={currentField}
          onChange={(e) =>
            setCurrentField(
              e.target.value
            )
          }
          placeholder="Field"
        />

        <br />
        <br />

        <input
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          placeholder="Status"
        />

        <br />
        <br />

        <textarea
          value={notes}
          onChange={(e) =>
            setNotes(
              e.target.value
            )
          }
          placeholder="Notes"
        />

        <br />
        <br />

        <button
          onClick={saveSheep}
          style={{
            background: "#4caf50",
            color: "white",
            border: "none",
            padding: "12px 18px",
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          💾 Save Sheep
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
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        ← Breeding Ewes
      </button>

      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 {sheep.name}
      </h1>

      <button
        onClick={() =>
          setEditing(true)
        }
        style={{
          background: "#ff9800",
          color: "white",
          border: "none",
          padding: "10px 16px",
          borderRadius: "10px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ✏️ Edit Sheep
      </button>

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
    </div>
  );
}