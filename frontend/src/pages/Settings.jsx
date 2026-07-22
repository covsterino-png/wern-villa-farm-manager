import { useEffect, useState } from "react";

export default function Settings() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState("");

  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");
  const [medicines, setMedicines] = useState([]);
const [newMedicine, setNewMedicine] = useState("");

  function loadGroups() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-groups"
    )
      .then((response) => response.json())
      .then((data) => {
        setGroups(data);
      });
  }
  function loadMedicines() {
  fetch(
    "https://wern-villa-api.onrender.com/medicines"
  )
    .then((response) => response.json())
    .then((data) => {
      setMedicines(data);
    });
}

  function loadFields() {
    fetch(
      "https://wern-villa-api.onrender.com/fields"
    )
      .then((response) => response.json())
      .then((data) => {
        setFields(data);
      });
  }

useEffect(() => {
  loadGroups();
  loadFields();
  loadMedicines();
}, []);
function addMedicine() {
  if (!newMedicine.trim()) return;

  fetch(
    "https://wern-villa-api.onrender.com/medicines",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newMedicine,
      }),
    }
  ).then(() => {
    setNewMedicine("");
    loadMedicines();
  });
}
  function addGroup() {
    if (!newGroup.trim()) return;

    fetch(
      "https://wern-villa-api.onrender.com/flock-groups",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroup,
        }),
      }
    ).then(() => {
      setNewGroup("");
      loadGroups();
    });
  }

  function addField() {
    if (!newField.trim()) return;

    fetch(
      "https://wern-villa-api.onrender.com/fields",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newField,
        }),
      }
    ).then(() => {
      setNewField("");
      loadFields();
    });
  }

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
          marginBottom: "20px",
        }}
      >
        ⚙️ Administration
      </h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            color: "#03a9f4",
          }}
        >
          🐑 Flock Groups
        </h2>

        <input
          value={newGroup}
          onChange={(e) =>
            setNewGroup(e.target.value)
          }
          placeholder="Group name..."
        />

        <button
          onClick={addGroup}
          style={{
            marginLeft: "10px",
          }}
        >
          Add Group
        </button>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          {groups.map((group) => (
            <div
              key={group.id}
              style={{
                background: "#2b2b2b",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              🐑 {group.name}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        <h2
          style={{
            color: "#03a9f4",
          }}
        >
          🌱 Fields
        </h2>

        <input
          value={newField}
          onChange={(e) =>
            setNewField(e.target.value)
          }
          placeholder="Field name..."
        />

        <button
          onClick={addField}
          style={{
            marginLeft: "10px",
          }}
        >
          Add Field
        </button>

        <div
          style={{
            marginTop: "20px",
          }}
        >
          {fields.map((field) => (
            <div
              key={field.id}
              style={{
                background: "#2b2b2b",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "10px",
              }}
            >
              🌱 {field.name}
            </div>
            
          ))}
          <div
  style={{
    background: "#1f1f1f",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
  }}
>
  <h2
    style={{
      color: "#03a9f4",
    }}
  >
    💉 Medicines
  </h2>

  <input
    value={newMedicine}
    onChange={(e) =>
      setNewMedicine(e.target.value)
    }
    placeholder="Medicine name..."
  />

  <button
    onClick={addMedicine}
    style={{
      marginLeft: "10px",
    }}
  >
    Add Medicine
  </button>

  <div
    style={{
      marginTop: "20px",
    }}
  >
    {medicines.map((medicine) => (
      <div
        key={medicine.id}
        style={{
          background: "#2b2b2b",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "10px",
        }}
      >
        💉 {medicine.name}
      </div>
    ))}
  </div>
</div>
        </div>
      </div>
    </div>
  );
}