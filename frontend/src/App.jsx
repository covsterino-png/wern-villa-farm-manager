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
import Receipts from "./pages/Receipts";

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
    function logout() {
  localStorage.removeItem("user");
  window.location.reload();
}
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
    padding: "6px",
    borderRadius: "10px",
    textAlign: "left",
    cursor: "pointer",
    minHeight: "36px",
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
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "8px",
  }}
>
  <span
    style={{
      color: "#03a9f4",
      fontSize: "0.9rem",
    }}
  >
    {user}
  </span>

  <div>
    <button
      onClick={() =>
        setPage("settings")
      }
      style={{
        background: "transparent",
        border: "none",
        color: "#aaa",
        cursor: "pointer",
        fontSize: "1rem",
        marginRight: "8px",
      }}
      title="Settings"
    >
      ⚙️
    </button>

    <button
      onClick={logout}
      style={{
        background: "transparent",
        border: "none",
        color: "#aaa",
        cursor: "pointer",
        fontSize: "1rem",
      }}
      title="Logout"
    >
      🚪
    </button>
  </div>
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
Move Group
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
  style={buttonStyle("receipts")}
  onClick={() => setPage("receipts")}
>
Receipts
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

        {page === "history" && (
          <MovementHistory />
        )}

        {page === "treatments" && (
          <Treatments />
        )}

        {page === "tasks" && (
          <Tasks />
          
        )}
        {page === "receipts" && (
  <Receipts />
)}
      </div>
    </div>
  );
}

export default App;