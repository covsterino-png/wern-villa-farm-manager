import { useEffect, useState } from "react";

export default function Fields() {
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState("");

  function loadFields() {
    fetch("https://wern-villa-api.onrender.com/fields")
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

    fetch("https://wern-villa-api.onrender.com/fields", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newField,
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
          }}
        >
          🌱 {field.name}
        </div>
      ))}
    </div>
  );
}