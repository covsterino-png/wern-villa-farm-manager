import { useEffect, useState } from "react";
import { API } from "../api";

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");
  const [newFieldFarm, setNewFieldFarm] = useState("Gellidywyll");
  const [newFieldType, setNewFieldType] = useState("field");

  function loadFields() {
    fetch(`${API}/fields`)
      .then((response) => response.json())
      .then((data) => {
        setFields(data);
      });
  }

  useEffect(() => {
    loadFields();
  }, []);

  function addField() {
    if (!newField.trim()) {
      return;
    }

    fetch(`${API}/fields`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newField,
        farm: newFieldFarm,
        type: newFieldType,
      }),
    }).then(() => {
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
  🌱 Fields
</h1>
      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <input
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          placeholder="Field name..."
        />

        <select
          value={newFieldFarm}
          onChange={(e) => setNewFieldFarm(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="Gellidywyll">Gellidywyll</option>
          <option value="Wern Villa">Wern Villa</option>
        </select>

        <select
          value={newFieldType}
          onChange={(e) => setNewFieldType(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          <option value="field">🌱 Field</option>
          <option value="building">🏚️ Building</option>
        </select>

        <button
          onClick={addField}
          style={{
            marginLeft: "10px",
          }}
        >
          Add Field
        </button>
      </div>

      {fields.map((field) => (
        <div
          key={field.id}
          style={{
            background: "#1f1f1f",
            padding: "15px",
            borderRadius: "12px",
            marginBottom: "10px",
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <span>
            {field.type === "building" ? "🏚️" : "🌱"} {field.name}
          </span>
          <small style={{ color: "#aaa" }}>
            {field.farm || "Gellidywyll"}
          </small>
        </div>
      ))}
    </div>
  );
}