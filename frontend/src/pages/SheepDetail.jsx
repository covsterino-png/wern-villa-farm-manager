import { useState, useEffect } from "react";
export default function SheepDetail({
  sheep,
  onBack,
}) {
  const [editing, setEditing] =
    useState(false);

  const [name, setName] = useState(
    sheep.name || ""
  );
  const [fields, setFields] = useState([]);

  const [eid, setEid] = useState(
    sheep.eid || ""
  );
  const [allSheep, setAllSheep] =
  useState([]);
  fetch(
  "https://wern-villa-api.onrender.com/sheep"
)
  .then((res) => res.json())
  .then((data) => setAllSheep(data));

  const [sex, setSex] = useState(
    sheep.sex || ""
  );

  const [dob, setDob] = useState(
    sheep.dob || ""
  );
  const [groups, setGroups] = useState([]);

useEffect(() => {
  fetch(
    "https://wern-villa-api.onrender.com/flock-register"
  )
    .then((res) => res.json())
    .then((data) => setGroups(data));
}, []);
``

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
  fetch(
  "https://wern-villa-api.onrender.com/fields"
)
  .then((res) => res.json())
  .then((data) => setFields(data));

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

<h1
  style={{
    color: "#03a9f4",
    fontSize: "2rem",
    marginBottom: "20px",
  }}
>
  ✏️ Edit {sheep.name}
</h1>

<label>Name</label>
<br />

<input
  value={name}
  onChange={(e) =>
    setName(e.target.value)
  }
/>

<br />
<br />
        <br />
        <br />

<label>Name</label>
<br />

<input
  value={EID}
  onChange={(e) =>
    setName(e.target.value)
  }
/>

<br />
<br />
        <br />
        <br />

<label>Name</label>
<br />

<select
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

<br />
<br />
        <br />
        <br />

<label>Name</label>
<br />

<input
  value={dob}
  onChange={(e) =>
    setName(e.target.value)
  }
/>

<br />
<br />
        <br />
        <br />

<select
  value={mother}
  onChange={(e) =>
    setMother(e.target.value)
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
        <br />
        <br />

<select
  value={groupName}
  onChange={(e) =>
    setGroupName(e.target.value)
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

        <br />
        <br />

<select
  value={currentField}
  onChange={(e) =>
    setCurrentField(
      e.target.value
    )
  }
>
  {fields.map((field) => (
    <option
      key={field.id}
      value={field.name}
    >
      {field.name}
    </option>
  ))}
</select>

        <br />
        <br />

<select
  value={status}
  onChange={(e) =>
    setStatus(e.target.value)
  }
>
  <option value="Active">
    Active
  </option>

  <option value="Breeding">
    Breeding
  </option>

  <option value="Store Lamb">
    Store Lamb
  </option>

  <option value="Replacement">
    Replacement
  </option>

  <option value="Sold">
    Sold
  </option>

  <option value="Deceased">
    Deceased
  </option>
</select>

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