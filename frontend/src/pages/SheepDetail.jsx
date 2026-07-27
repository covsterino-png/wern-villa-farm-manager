import { useState, useEffect } from "react";

export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] =
    useState(false);

  const [groups, setGroups] =
    useState([]);

  const [fields, setFields] =
    useState([]);

  const [allSheep, setAllSheep] =
    useState([]);

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

  useEffect(() => {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register"
    )
      .then((res) => res.json())
      .then((data) => setGroups(data));

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

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "15px",
  borderRadius: "8px",
  border: "1px solid #444",
  boxSizing: "border-box",
};