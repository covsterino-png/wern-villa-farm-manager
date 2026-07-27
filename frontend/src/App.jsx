import { useState } from "react";
import "./App.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MoveGroup from "./pages/MoveGroup";
import MovementHistory from "./pages/MovementHistory";
import Tasks from "./pages/Tasks";
import Treatments from "./pages/Treatments";
import Settings from "./pages/Settings";
import FarmMap from "./pages/FarmMap";
import FlockRegister from "./pages/FlockRegister";
import SheepRegister from "./pages/SheepRegister";

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

  const [user] = useState(
    localStorage.getItem("user")
  );

  const [movements, setMovements] =
    useState([]);

  if (!user) {
    return (
      <Login
        onLogin={(username) => {
          localStorage.setItem(
            "user",
            username
          );
          window.location.reload();
        }}
      />
    );
  }

  const isMobile =
    window.innerWidth < 768;

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
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile
          ? "column"
          : "row",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          width: isMobile
            ? "100%"
            : "250px",
          background: "#1f1f1f",
          color: "white",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            marginBottom: "25px",
            borderBottom:
              "1px solid #333",
            paddingBottom: "15px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#03a9f4",
              fontSize: "1.8rem",
            }}
          >
            🐑 Wern Villa
          </h1>

          <div
            style={{
              color: "#03a9f4",
              marginTop: "8px",
            }}
          >
            Logged in as: [{user}]
          </div>

          <button
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "10px",
              background: "#444",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
            onClick={() => {
              localStorage.removeItem(
                "user"
              );
              window.location.reload();
            }}
          >
            Logout
          </button>

          <div
            style={{
              color: "#888",
              fontSize: "0.85rem",
              marginTop: "10px",
              letterSpacing: "1px",
            }}
          >
            GEMMA & DAVID'S FARM
            MANAGER
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: isMobile
              ? "row"
              : "column",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <button
            style={buttonStyle(
              "dashboard"
            )}
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            style={buttonStyle("move")}
            onClick={() =>
              setPage("move")
            }
          >
🌱 Move Group
          </button>
          <button
  style={buttonStyle(
    "flock-register"
  )}
  onClick={() =>
    setPage(
      "flock-register"
    )
  }
>
  Flock Management
</button>
<button
  style={buttonStyle(
    "sheep-register"
  )}
  onClick={() =>
    setPage(
      "sheep-register"
    )
  }
>
  🐑 Sheep
</button>

          <button
            style={buttonStyle(
              "history"
            )}
            onClick={() =>
              setPage("history")
            }
          >
            History
          </button>

          <button
            style={buttonStyle("tasks")}
            onClick={() =>
              setPage("tasks")
            }
          >
            Tasks
          </button>

          <button
            style={buttonStyle(
              "treatments"
            )}
            onClick={() =>
              setPage("treatments")
            }
          >
            Treatments
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: isMobile
            ? "10px"
            : "20px",
          background: "#121212",
          color: "white",
          position: "relative",
        }}
      >
        {user === "David" && (
          <button
            onClick={() =>
              setPage("settings")
            }
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background:
                "transparent",
              border: "none",
              fontSize: "2rem",
              cursor: "pointer",
              zIndex: 1000,
            }}
            title="Administration"
          >
            ⚙️
          </button>
        )}

{page === "dashboard" && (
  <Dashboard
    setPage={setPage}
  />
)}

{page === "sheep-register" && (
  <SheepRegister />
)}
        {page === "flock-register" && (
  <FlockRegister />
)}

        {page === "farm-map" && (
          <FarmMap />
        )}

        {page === "settings" &&
          user === "David" && (
            <Settings />
          )}

{page === "move" && (
  <MoveGroup />
)}
``
        {page === "history" && (
          <MovementHistory />
        )}

        {page === "treatments" && (
          <Treatments />
        )}

        {page === "tasks" && (
          <Tasks />
        )}
      </div>
    </div>
  );
}

export default App;