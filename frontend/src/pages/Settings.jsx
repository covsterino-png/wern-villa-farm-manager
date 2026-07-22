export default function Settings() {
  return (
    <div>
      <h1>⚙️ Settings</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "500px",
        }}
      >
        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          🌱 Fields
        </div>

        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          🐑 Flock Groups
        </div>

        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          💉 Medicines
        </div>

        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          👥 Users
        </div>

        <div
          style={{
            background: "#1f1f1f",
            padding: "20px",
            borderRadius: "12px",
          }}
        >
          💷 Finance Categories
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from "react";

export default function Settings() {
  const [groups, setGroups] = useState([]);
  const [newGroup, setNewGroup] = useState("");

  function loadGroups() {
    fetch(
      "https://wern-villa-api.onrender.com/flock-groups"
    )
      .then((response) => response.json())
      .then((data) => {
        setGroups(data);
      });
  }

  useEffect(() => {
    loadGroups();
  }, []);

  function addGroup() {
    if (!newGroup.trim()) {
      return;
    }

    fetch(
      "https://wern-villa-api.onrender.com/flock-groups",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
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

  return (
    <div>
      <h1>⚙️ Settings</h1>

      <div
        style={{
          background: "#1f1f1f",
          padding: "20px",
          borderRadius: "12px",
          marginBottom: "20px",
        }}
      >
        <h2>🐑 Flock Groups</h2>

        <input
          value={newGroup}
          onChange={(e) =>
            setNewGroup(e.target.value)
          }
          placeholder="Group name..."
        />

        <button
          onClick={addGroup}
          style={{ marginLeft: "10px" }}
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
                marginBottom: "10px",
              }}
            >
              🐑 {group.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}