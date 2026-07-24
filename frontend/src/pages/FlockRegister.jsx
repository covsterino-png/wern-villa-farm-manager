import { useEffect, useState } from "react";

export default function FlockRegister() {
  const [groups, setGroups] =
    useState([]);

  const [name, setName] =
    useState("");

  const [count, setCount] =
    useState("");

  const [currentField, setCurrentField] =
    useState("");

  const [notes, setNotes] =
    useState("");

  function loadGroups() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-register"
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

  return (
    <div>
      <h1
        style={{
          color: "#03a9f4",
        }}
      >
        🐑 Flock Register
      </h1>

      <input
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
        placeholder="Group Name"
      />

      <input
        value={count}
        onChange={(e) =>
          setCount(e.target.value)
        }
        placeholder="Number"
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
            style={{
              background: "#2b2b2b",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "10px",
            }}
          >
            <h3>
              🐑 {group.name}
            </h3>

            <div>
              Count: {group.count}
            </div>

            <div>
              Field:
              {" "}
              {group.currentField}
            </div>

            <div>
              Notes:
              {" "}
              {group.notes}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}