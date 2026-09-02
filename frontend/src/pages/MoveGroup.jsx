import { useEffect, useState } from "react";
import { API } from "../api";
import { submitWrite } from "../offlineQueue";

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
    fetch(`${API}/flock-register`)
      .then((res) => res.json())
      .then((data) => setGroups(data));

    fetch(`${API}/fields`)
      .then((res) => res.json())
      .then((data) => setFields(data));
  }, []);

  function moveGroup() {
    submitWrite(`${API}/move-group`,
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
      },
      `Move group ${groupName} to ${newField}`
    )
      .then((res) => res.json())
      .then((data) => {
        const eidMessage = data.eidCymru
          ? data.eidCymru.status === "submitted"
            ? " EID Cymru was updated."
            : ` EID Cymru submission is ready for review${data.eidCymru.error ? `: ${data.eidCymru.error}` : "."}`
          : "";
        alert(
          data.queued
            ? "Saved offline — move will sync automatically once you're back online."
            : `Group moved successfully.${eidMessage}`
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

        <optgroup label="🌱 Fields">
          {fields
            .filter((field) => (field.type || "field") !== "building")
            .map((field) => (
              <option
                key={field.id}
                value={field.name}
              >
                {field.name} ({field.farm || "Gellidywyll"})
              </option>
            ))}
        </optgroup>

        <optgroup label="🏚️ Buildings">
          {fields
            .filter((field) => field.type === "building")
            .map((field) => (
              <option
                key={field.id}
                value={field.name}
              >
                {field.name} ({field.farm || "Gellidywyll"})
              </option>
            ))}
        </optgroup>
      </select>

      <button
        onClick={moveGroup}
        disabled={!groupName || !newField}
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