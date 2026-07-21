import { useState } from "react";
import "./App.css";

import Dashboard from "./pages/Dashboard";
import MoveSheep from "./pages/MoveSheep";
import Fields from "./pages/Fields";
import MovementHistory from "./pages/MovementHistory";
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

  const isMobile = window.innerWidth < 768;

const buttonStyle = (buttonPage) => ({
  background:
    page === buttonPage
      ? "#03a9f4"
      : "#2b2b2b",
  color: "white",
  border: "none",
  padding: "16px",
  borderRadius: "10px",
  textAlign: "left",
  cursor: "pointer",
  minHeight: "50px",
  fontWeight:
    page === buttonPage
      ? "bold"
      : "normal",
  transition: "0.2s",
});
  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: isMobile ? "100%" : "250px",
          background: "#1f1f1f",
          color: "white",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <h2 style={{ color: "#03a9f4" }}>
          🐑 Farm Manager
        </h2>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "row" : "column",
            flexWrap: "wrap",
            gap: "10px",
            marginTop: "20px",
          }}
        >
          <button
            style={buttonStyle("dashboard")}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>

          <button
            style={buttonStyle("move")}
            onClick={() => setPage("move")}
          >
            Move Sheep
          </button>

          <button
            style={buttonStyle("fields")}
            onClick={() => setPage("fields")}
          >
            Fields
          </button>

          <button
            style={buttonStyle("history")}
            onClick={() => setPage("history")}
          >
            History
          </button>

          <button
            style={buttonStyle("tasks")}
            onClick={() => setPage("tasks")}
          >
            Tasks
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: isMobile ? "10px" : "20px",
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

        {page === "fields" && <Fields />}

        {page === "history" && (
          <MovementHistory />
        )}

        {page === "tasks" && <Tasks />}
      </div>
    </div>
  );
}

export default App;