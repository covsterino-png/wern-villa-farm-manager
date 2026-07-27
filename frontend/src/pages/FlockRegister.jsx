import { useEffect, useState } from "react";
import FlockGroupDetail from "./FlockGroupDetail";

export default function FlockRegister() {
  const [groups, setGroups] = useState([]);

  const [name, setName] = useState("");
  const [count, setCount] = useState("");
  const [currentField, setCurrentField] =
    useState("");
  const [notes, setNotes] = useState("");

  const [
    selectedGroup,
    setSelectedGroup,
  ] = useState(null);

function loadGroups() {
  fetch(
    "https://wern-villa-api.onrender.com/flock-register-summary"
  )
    .then((res) => res.json())
    .then((data) => setGroups(data));
}
  useEffect(() => {
    loadGroups();
  }, []);

  function addGroup() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name,
          count,
          currentField,
          notes,
        }),
      }
    ).then(() => {
      setName("");
      setCount("");
      setCurrentField("");
      setNotes("");
      loadGroups();
    });
  }

  if (selectedGroup) {
    return (
      <FlockGroupDetail
        groupName={selectedGroup}
        onBack={() =>
          setSelectedGroup(null)
        }
      />
    );
  }

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 Flock Management
      </h1>

      <input
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        placeholder="Group Name"
      />

            <input
        value={currentField}
        onChange={(e) =>
          setCurrentField(
            e.target.value
          )
        }
        placeholder="Current Field"
      />

      <input
        value={notes}
        onChange={(e) =>
          setNotes(e.target.value)
        }
        placeholder="Notes"
      />

      <button onClick={addGroup}>
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
            onClick={() =>
              setSelectedGroup(
                group.name
              )
            }
            style={{
              background: "#2b2b2b",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
              cursor: "pointer",
            }}
          >
            <h3>
              🐑 {group.name}
            </h3>

            <div>
<div
  style={{
    color: "#03a9f4",
    fontWeight: "bold",
  }}
>
  {group.sheepCount} Sheep
</div>
            </div>

            <div>
              Field:{" "}
              {group.currentField}
            </div>

            <div>
              Notes: {group.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}