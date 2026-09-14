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
import Outbuildings from "./pages/Outbuildings";
import OutbuildingDetail from "./pages/OutbuildingDetail";
import FloorPlan from "./pages/FloorPlan";
import FlockRegister from "./pages/FlockRegister";
import SheepRegister from "./pages/SheepRegister";
import Receipts from "./pages/Receipts";
import Notes from "./pages/Notes";
import Notifications from "./pages/Notifications";
import FinancialRegister from "./pages/FinancialRegister";
import Sales from "./pages/Sales";
import HeroPoints from "./pages/HeroPoints";
import { API, apiFetch } from "./api";
import { subscribeQueueCount } from "./offlineQueue";

const getStoredUser = () =>
  localStorage.getItem("authToken")
    ? localStorage.getItem("user")
    : null;

const lastScreenKey = (username) => `lastScreen:${username}`;

function getStoredPage(username) {
  if (!username) return "dashboard";
  const storedPage = localStorage.getItem(lastScreenKey(username));
  if (storedPage === "settings" && username !== "David") return "dashboard";
  return storedPage || "dashboard";
}

function App() {
  const [user] = useState(getStoredUser);
  const [page, setPage] = useState(() => getStoredPage(user));
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [installPrompt, setInstallPrompt] = useState(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [selectedBuilding, setSelectedBuilding] = useState(null);

  const [showBugModal, setShowBugModal] = useState(false);
  const [bugTitle, setBugTitle] = useState("");
  const [bugDetails, setBugDetails] = useState("");
  const [bugKind, setBugKind] = useState("bug");
  const [bugMessage, setBugMessage] = useState("");
  const [submittingBug, setSubmittingBug] = useState(false);

  async function submitBugReport(e) {
    e.preventDefault();
    if (!bugTitle.trim()) return;
    setSubmittingBug(true);
    setBugMessage("");
    try {
      await apiFetch("/dev-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: bugKind,
          title: bugTitle,
          details: bugDetails,
          screen: page,
        }),
      });
      setBugTitle("");
      setBugDetails("");
      setBugMessage("Report sent! Copilot will read it when you ask.");
      setTimeout(() => {
        setShowBugModal(false);
        setBugMessage("");
      }, 1800);
    } catch (err) {
      setBugMessage(`Error: ${err.message}`);
    } finally {
      setSubmittingBug(false);
    }
  }

  useEffect(() => subscribeQueueCount(setPendingSyncCount), []);

  useEffect(() => {
    const updateLayout = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(lastScreenKey(user), page);
    apiFetch("/app-open-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screen: page }),
    }).catch(() => {});
  }, [page, user]);

  useEffect(() => {
    if (!user) return;
    const logClick = (event) => {
      const element = event.target.closest?.("button, a, input, select, textarea, [role], [data-click-log]") || event.target;
      const label = element.getAttribute?.("aria-label") || element.getAttribute?.("placeholder") || element.getAttribute?.("name") || element.textContent || element.id || element.tagName;
      apiFetch("/click-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: String(label || "Unknown element").replace(/\s+/g, " ").trim().slice(0, 160),
          screen: page,
        }),
      }).catch(() => {});
    };
    document.addEventListener("click", logClick, true);
    return () => document.removeEventListener("click", logClick, true);
  }, [page, user]);

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
      } catch {
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
    ["sales", "Sales & Income"],
    ["notifications", `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ""}`],
    ["calendar", "Calendar"],
    ["notes", "Notes"],
    ["tasks", "Tasks"],
    ["treatments", "Treatments"],
    ["feed", "Flock Feed"],
    ["sheep-register", "Sheep Register"],
    ["flock-register", "Flock Register"],
    ["farm-map", "Farm Map"],
    ["floorplan", "Floorplan Devices"],
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
{pendingSyncCount > 0 && (
  <div
    style={{
      background: "#ff9800",
      color: "#1f1f1f",
      fontSize: "0.75rem",
      fontWeight: "bold",
      padding: "6px 10px",
      borderRadius: "8px",
      marginBottom: "8px",
      textAlign: "center",
    }}
    title="These changes will sync automatically once you're back online"
  >
    ⏳ {pendingSyncCount} change{pendingSyncCount === 1 ? "" : "s"} waiting to sync
  </div>
)}

        {isMobile ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
            <button
              onClick={() => navigate("dashboard")}
              aria-label="Home"
              title="Home"
              style={{ ...buttonStyle("dashboard"), flex: 1, textAlign: "center", padding: "12px", fontSize: "1.2rem" }}
            >
              🏠
            </button>
            {user === "David" && (
              <button
                onClick={() => navigate("settings")}
                aria-label="Settings"
                title="Settings"
                style={{ ...buttonStyle("settings"), width: "44px", textAlign: "center", fontSize: "1.2rem" }}
              >
                ⚙️
              </button>
            )}
            <button
              onClick={logout}
              aria-label="Logout"
              title="Logout"
              style={{ ...buttonStyle("logout"), width: "44px", textAlign: "center", fontSize: "1.2rem" }}
            >
              🚪
            </button>
          </div>
        ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {installPrompt && (
            <button
              style={buttonStyle("install")}
              onClick={installApp}
            >
              Install App
            </button>
          )}
          {user === "David" && (
            <button
              style={buttonStyle("bug-report")}
              onClick={() => {
                setMobileMenuOpen(false);
                setShowBugModal(true);
              }}
            >
              🐛 Report Bug / Idea
            </button>
          )}
          {user === "David" && (
            <button
              style={buttonStyle("settings")}
              onClick={() => navigate("settings")}
            >
              Settings
            </button>
          )}
          <button
            style={buttonStyle("logout")}
            onClick={logout}
          >
            Logout
          </button>
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
            {user === "David" && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowBugModal(true);
                }}
                style={{ ...buttonStyle("bug-report"), padding: "10px", minHeight: "42px", gridColumn: "span 2", background: "#334155" }}
              >
                🐛 Report Bug / Idea
              </button>
            )}
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
          <FarmMap onOpenOutbuildings={() => setPage("outbuildings")} />
        )}

        {page === "outbuildings" && (
          <Outbuildings
            onBack={() => setPage("farm-map")}
            onSelectBuilding={(unit) => {
              setSelectedBuilding(unit);
              setPage("outbuilding-detail");
            }}
          />
        )}

        {page === "outbuilding-detail" && (
          <OutbuildingDetail
            unit={selectedBuilding}
            onBack={() => setPage("outbuildings")}
          />
        )}

        {page === "floorplan" && (
          <FloorPlan user={user} />
        )}

        {page === "settings" &&
          user === "David" && (
            <Settings user={user} />
          )}

      {showBugModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setShowBugModal(false)}
        >
          <div
            style={{
              background: "#1e293b",
              color: "white",
              padding: "20px",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "460px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              border: "1px solid #334155",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ margin: 0, color: "#f8fafc", fontSize: "1.25rem" }}>🐛 Log Bug / Feature Request</h2>
              <button
                type="button"
                onClick={() => setShowBugModal(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", fontSize: "1.4rem", cursor: "pointer" }}
              >
                ✖
              </button>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: 0, marginBottom: "14px" }}>
              Spot a bug in a field or have a feature idea? Save it here and Copilot will read and fix it when you're back at your desk!
            </p>
            <form onSubmit={submitBugReport} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={bugKind}
                  onChange={(e) => setBugKind(e.target.value)}
                  style={{ padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #475569" }}
                >
                  <option value="bug">🐛 Bug</option>
                  <option value="feature">💡 Feature Idea</option>
                  <option value="tweak">✏️ UI Tweak</option>
                </select>
                <input
                  required
                  type="text"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                  placeholder="Short summary (e.g. Move button failed)"
                  style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #475569" }}
                />
              </div>
              <textarea
                rows={4}
                value={bugDetails}
                onChange={(e) => setBugDetails(e.target.value)}
                placeholder="Details of what happened or what you want changed..."
                style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "#0f172a", color: "white", border: "1px solid #475569", resize: "vertical" }}
              />
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Screen context: <code>{page}</code></div>
              {bugMessage && (
                <p style={{ margin: 0, color: bugMessage.includes("Error") ? "#ef4444" : "#10b981", fontSize: "0.9rem" }}>
                  {bugMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={submittingBug || !bugTitle.trim()}
                style={{
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                {submittingBug ? "Saving..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
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
{page === "sales" && (
  <Sales />
)}
{page === "calendar" && (
  <Calendar />
)}
{page === "notes" && (
  <Notes />
)}
{page === "notifications" && (
  <Notifications user={user} setPage={setPage} />
)}
{page === "hero-points" && (
  <HeroPoints user={user} />
)}
      </div>
    </div>
  );
}

export default App;