import { useEffect, useState } from "react";

export default function MoveGroup() {
  const [groups, setGroups] =
    useState([]);

  const [fields, setFields] =
    useState([]);

  const [groupName, setGroupName] =
    useState("");

  const [newField, setNewField] =
    useState("");

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
  }, []);

  function moveGroup() {
    fetch(
      "https://wern-villa-api.onrender.com/move-group",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          groupName,
          newField,
        }),
      }
    )
      .then((res) => res.json())
      .then(() => {
        alert(
          "Group moved successfully"
        );
      });
  }

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🌱 Move Group
      </h1>

      <label>Group</label>

      <select
        value={groupName}
        onChange={(e) =>
          setGroupName(
            e.target.value
          )
        }
        style={inputStyle}
      >
        <option value="">
          Select Group
        </option>

        {groups.map((group) => (
          <option
            key={group.id}
            value={group.name}
          >
            {group.name}
          </option>
        ))}
      </select>

      <label>
        Move To Location
      </label>

      <select
        value={newField}
        onChange={(e) =>
          setNewField(
            e.target.value
          )
        }
        style={inputStyle}
      >
        <option value="">
          Select Field
        </option>

        {fields.map((field) => (
          <option
            key={field.id}
            value={field.name}
          >
            {field.name}
          </option>
        ))}
      </select>

      <button
        onClick={moveGroup}
        style={{
          background: "#03a9f4",
          color: "white",
          border: "none",
          padding: "12px 18px",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        🌱 Move Group
      </button>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px",
  marginBottom: "15px",
  borderRadius: "8px",
};