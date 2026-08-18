import { useState, useEffect } from "react";
import "./App.css";
import Calendar from "./pages/Calendar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MoveGroup from "./pages/MoveGroup";
import MovementHistory from "./pages/MovementHistory";
import Tasks from "./pages/Tasks";
import Treatments from "./pages/Treatments";
import Feed from "./pages/Feed";
import Settings from "./pages/Settings";
import FarmMap from "./pages/FarmMap";
import FlockRegister from "./pages/FlockRegister";
import SheepRegister from "./pages/SheepRegister";
import Receipts from "./pages/Receipts";
import Notes from "./pages/Notes";
import Notifications from "./pages/Notifications";
import FinancialRegister from "./pages/FinancialRegister";
import HeroPoints from "./pages/HeroPoints";
import { API } from "./api";

function App() {
  const [page, setPage] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    localStorage.getItem("authToken")
      ? localStorage.getItem("user")
      : null
  );

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(`${API}/notifications?user=${user}`);
        const data = await res.json();
        if (!mounted) return;
        setUnreadCount(data.filter((d) => d.read === 0).length);
      } catch (e) {
        // ignore
      }
    };

    load();
    const t = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [user]);

  const [movements, setMovements] =
    useState([]);
    function logout() {
  localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  window.location.reload();
}
  if (!user) {
    return (
      <Login
        onLogin={(username, token) => {
          localStorage.setItem("user", username);
          localStorage.setItem("authToken", token);
          setTimeout(() => window.location.reload(), 0);
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

  const navigate = (nextPage) => {
    setPage(nextPage);
    if (isMobile) setMobileMenuOpen(false);
  };

  const navItems = [
    ["move", "Move"],
    ["history", "History"],
    ["receipts", "Receipts"],
    ["financial", "Finances"],
    ["notifications", `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
    ["calendar", "Calendar"],
    ["notes", "Notes"],
    ["tasks", "Tasks"],
    ["treatments", "Treatments"],
    ["feed", "Flock Feed"],
    ["sheep-register", "Sheep Register"],
    ["flock-register", "Flock Register"],
    ["farm-map", "Farm Map"],
    ["hero-points", "Hero Points"],
  ];

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
    color: "#aaa",
    fontSize: "0.8rem",
    whiteSpace: "nowrap",
  }}
>
  {user} • Farm Manager
</span>
  <div>
    {installPrompt && (
      <button
        onClick={installApp}
        style={{
          background: "transparent",
          border: "none",
          color: "#aaa",
          cursor: "pointer",
          fontSize: "1rem",
          marginRight: "8px",
        }}
        title="Install App"
      >
        ⬇️
      </button>
    )}
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

        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => navigate("dashboard")}
              style={{ ...buttonStyle("dashboard"), flex: 1, textAlign: "center", padding: "12px" }}
            >
              Home
            </button>
            <button
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              style={{
                background: "#2b2b2b",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                width: "48px",
                height: "44px",
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            style={buttonStyle(
              "dashboard"
            )}
            onClick={() => navigate("dashboard")}
          >
            Home
          </button>

          <button
            style={buttonStyle("move")}
            onClick={() => navigate("move")}
          >
Move
          </button>

          <button
            style={buttonStyle(
              "history"
            )}
            onClick={() => navigate("history")}
          >
            History
          </button>


          <button
  style={buttonStyle("receipts")}
  onClick={() => navigate("receipts")}
>
Receipts
</button>
          <button
            style={buttonStyle("financial")}
            onClick={() => navigate("financial")}
          >
            Finances
          </button>
          <button
            style={buttonStyle("feed")}
            onClick={() => navigate("feed")}
          >
            Flock Feed
          </button>
          
          <button
            style={buttonStyle("notifications")}
            onClick={() => navigate("notifications")}
          >
            🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            style={buttonStyle("hero-points")}
            onClick={() => navigate("hero-points")}
          >
            Hero Points
          </button>
        </div>
        )}

        {isMobile && mobileMenuOpen && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "8px",
              marginTop: "10px",
              paddingTop: "10px",
              borderTop: "1px solid #333",
            }}
          >
            {navItems.map(([nextPage, label]) => (
              <button
                key={nextPage}
                onClick={() => navigate(nextPage)}
                style={{ ...buttonStyle(nextPage), padding: "10px", minHeight: "42px" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
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
            <Settings user={user} />
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
        {page === "feed" && (
          <Feed />
        )}

        {page === "tasks" && (
          <Tasks />
          
        )}
        {page === "receipts" && (
  <Receipts />
)}
        {page === "financial" && (
          <FinancialRegister user={user} />
        )}
{page === "calendar" && (
  <Calendar />
)}
{page === "notes" && (
  <Notes />
)}
{page === "notifications" && (
  <Notifications user={user} />
)}
{page === "hero-points" && (
  <HeroPoints user={user} />
)}
      </div>
    </div>
  );
}

export default App;