import MovementHistory from "./pages/MovementHistory";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import MoveSheep from "./pages/MoveSheep";
import Fields from "./pages/Fields";
import Tasks from "./pages/Tasks";

function App() {
  const [page, setPage] = useState("dashboard");

  const [farmData, setFarmData] = useState({
    totalSheep: 150,

    locations: {
      wernVilla: 0,
      gellidywyll: 150,
    },

    flock: {
      breedingEwes: 106,
      eweLambs: 33,
      rams: 11,
    },
  });
  const [movements, setMovements] = useState([]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: "250px",
          background: "#1f1f1f",
          color: "white",
          padding: "20px",
        }}
      >
        <h2 style={{ color: "#03a9f4" }}>
  🐑 Farm Manager
</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
  style={{
    background: "#2b2b2b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
  }}
  onClick={() => setPage("dashboard")}
>
            Dashboard
          </button>

          <button
  style={{
    background: "#2b2b2b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
  }}
  onClick={() => setPage("move")}
>
            Move Sheep
          </button>

          <button
  style={{
    background: "#2b2b2b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
  }}
  onClick={() => setPage("fields")}
>
            Fields
          </button>
          <button

style={{
    background: "#2b2b2b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
  }}
  onClick={() => setPage("history")}

>

History

</button>
<button
  style={{
    background: "#2b2b2b",
    color: "white",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
  }}
  onClick={() => setPage("tasks")}
>
  Tasks
</button>
        </div>
      </div>

      <div
  style={{
    flex: 1,
    padding: "20px",
    background: "#121212",
    color: "white",
  }}
>
        {page === "dashboard" && (
          <Dashboard farmData={farmData} />
        )}

        {page === "move" && (
          <MoveSheep
  farmData={farmData}
  setFarmData={setFarmData}
  movements={movements}
  setMovements={setMovements}
/>
        )}

        {page === "fields" && (
          <Fields />
        )}
        {page === "history" && (
  <MovementHistory/>
)}
{page === "tasks" && (
  <Tasks />
)}
      </div>
    </div>
  );
}

export default App;